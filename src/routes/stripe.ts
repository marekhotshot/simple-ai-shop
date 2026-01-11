import { Router } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { pool, query } from '../db.js';
import { loadSetting } from '../lib/settings.js';
import { config } from '../lib/env.js';
import { sendMail } from '../lib/email.js';

const router = Router();

async function getStripeClient(): Promise<Stripe> {
  const apiKey = await loadSetting('stripe.secret_key');
  if (!apiKey) {
    throw new Error('Stripe API key not configured');
  }
  return new Stripe(apiKey, {
    apiVersion: '2025-02-24.acacia',
  });
}

// Check if Stripe is configured
router.get('/configured', async (_req, res) => {
  try {
    const apiKey = await loadSetting('stripe.secret_key');
    const publishableKey = await loadSetting('stripe.publishable_key');
    res.json({ configured: !!(apiKey && publishableKey) });
  } catch (error) {
    res.json({ configured: false });
  }
});

const createPaymentIntentSchema = z.object({
  productId: z.string().uuid(),
  returnUrl: z.string().url().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

router.post('/create-payment-intent', async (req, res) => {
  const parsed = createPaymentIntentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const productRows = await query<{ id: string; price_cents: number; status: string }>(
    'SELECT id, price_cents, status FROM products WHERE id = $1',
    [parsed.data.productId],
  );

  const product = productRows[0];
  if (!product || product.status !== 'AVAILABLE') {
    res.status(409).json({ error: 'Product not available' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check product is still available
    const checkProduct = await client.query<{ status: string }>(
      'SELECT status FROM products WHERE id = $1 FOR UPDATE',
      [product.id],
    );

    if (checkProduct.rows[0]?.status !== 'AVAILABLE') {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'Product no longer available' });
      return;
    }

    // Create Stripe payment intent
    const stripe = await getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: product.price_cents,
      currency: 'eur',
      metadata: {
        productId: product.id,
      },
    });

    // Create order record with shipping info if provided
    // Note: We do NOT reserve the product here - it will be reserved only when payment succeeds
    await client.query(
      `INSERT INTO orders (product_id, stripe_payment_intent_id, status, amount_cents, payment_provider, buyer_email, shipping_name, shipping_country, shipping_address_json)
       VALUES ($1, $2, 'CREATED', $3, 'STRIPE', $4, $5, $6, $7)`,
      [
        product.id,
        paymentIntent.id,
        product.price_cents,
        parsed.data.email || null,
        parsed.data.name || null,
        parsed.data.country || null,
        JSON.stringify({
          address: parsed.data.address,
          city: parsed.data.city,
          zip: parsed.data.zip,
          country: parsed.data.country,
          phone: parsed.data.phone,
        }),
      ],
    );

    await client.query('COMMIT');

    const publishableKey = await loadSetting('stripe.publishable_key');
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      publishableKey: publishableKey || null,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof Error && error.message === 'Stripe API key not configured') {
      res.status(503).json({ error: 'Stripe not configured' });
      return;
    }
    console.error('Stripe payment intent creation failed:', error);
    res.status(502).json({ error: 'Payment intent creation failed' });
  } finally {
    client.release();
  }
});

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1),
});

router.post('/confirm-payment', async (req, res) => {
  const parsed = confirmPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify payment intent with Stripe
    const stripe = await getStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(parsed.data.paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      await client.query('ROLLBACK');
      res.status(400).json({ error: `Payment not succeeded. Status: ${paymentIntent.status}` });
      return;
    }

    // Find order by payment intent ID
    const orderRows = await client.query<{
      id: string;
      product_id: string;
      status: string;
    }>(
      'SELECT id, product_id, status FROM orders WHERE stripe_payment_intent_id = $1 FOR UPDATE',
      [parsed.data.paymentIntentId],
    );

    const order = orderRows.rows[0];
    if (!order) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.status === 'PAID') {
      await client.query('ROLLBACK');
      res.json({ status: 'already_paid', orderId: order.id });
      return;
    }

    // Get charge ID from the payment intent
    const chargeId = paymentIntent.latest_charge;
    let customerEmail: string | null = null;

    if (chargeId && typeof chargeId === 'string') {
      try {
        const charge = await stripe.charges.retrieve(chargeId);
        customerEmail = charge.billing_details?.email || null;
      } catch (err) {
        console.error('Failed to retrieve charge:', err);
      }
    }

    // Update product to SOLD (reserve if needed, then mark as sold)
    // This handles the case where product might still be AVAILABLE (if payment intent was created but product wasn't reserved)
    // or already RESERVED (from a previous attempt)
    const updateProduct = await client.query(
      "UPDATE products SET status = 'SOLD', updated_at = NOW() WHERE id = $1 AND status IN ('AVAILABLE', 'RESERVED')",
      [order.product_id],
    );

    if (updateProduct.rowCount === 0) {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'Product is no longer available' });
      return;
    }

    // Update order to PAID
    await client.query(
      `UPDATE orders
       SET status = 'PAID', stripe_charge_id = $1, buyer_email = $2, paid_at = NOW()
       WHERE id = $3`,
      [chargeId || null, customerEmail, order.id],
    );

    // Send confirmation email
    if (customerEmail) {
      try {
        await sendMail({
          to: customerEmail,
          subject: 'Order Confirmation - Payment Received',
          html: `
            <h2>Order Confirmation</h2>
            <p>Thank you for your order!</p>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Payment Intent ID:</strong> ${parsed.data.paymentIntentId}</p>
            <p><strong>Status:</strong> Payment received and confirmed</p>
            <p>Your order will be processed and shipped soon. You will receive a shipping notification once your order is on its way.</p>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
      }
    }

    await client.query('COMMIT');
    res.json({ status: 'paid', orderId: order.id });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof Error && error.message === 'Stripe API key not configured') {
      res.status(503).json({ error: 'Stripe not configured' });
      return;
    }
    console.error('Stripe payment confirmation failed:', error);
    res.status(500).json({ error: 'Payment confirmation failed' });
  } finally {
    client.release();
  }
});

export default router;
