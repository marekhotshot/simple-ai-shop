import { Router } from 'express';
import { z } from 'zod';
import { query, pool } from '../db.js';
import { loadSetting } from '../lib/settings.js';
import { sendMail } from '../lib/email.js';

const router = Router();

const createOrderSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  customAmount: z.number().optional().nullable(), // Optional: allow paying more than listed price
});

router.post('/create', async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check product availability
    const productRows = await client.query<{ id: string; price_cents: number; status: string; slug: string }>(
      'SELECT id, price_cents, status, slug FROM products WHERE id = $1 FOR UPDATE',
      [parsed.data.productId],
    );

    const product = productRows.rows[0];
    if (!product) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (product.status !== 'AVAILABLE') {
      await client.query('ROLLBACK');
      res.status(409).json({ error: `Product is ${product.status.toLowerCase()}` });
      return;
    }

    // Use custom amount if provided and >= listed price, otherwise use listed price
    const amountCents = parsed.data.customAmount && parsed.data.customAmount >= (product.price_cents / 100)
      ? Math.round(parsed.data.customAmount * 100)
      : product.price_cents;

    // Create order with RESERVED status (will be updated to PAID when payment received)
    const orderId = `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const orderRows = await client.query<{ id: string }>(
      `INSERT INTO orders (product_id, paypal_order_id, status, amount_cents, buyer_email, shipping_name, shipping_country, shipping_address_json)
       VALUES ($1, $2, 'RESERVED', $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        product.id,
        orderId,
        amountCents,
        parsed.data.email,
        parsed.data.name,
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

    // Update product status to RESERVED
    await client.query(
      "UPDATE products SET status = 'RESERVED', updated_at = NOW() WHERE id = $1",
      [product.id],
    );

    await client.query('COMMIT');

    const orderId_actual = orderRows.rows[0].id;

    // Get bank transfer details
    const bankTransferDetails = await loadSetting('bank_transfer.details') || 'Bank transfer details will be sent via email.';

    // Send confirmation email with bank transfer details
    try {
      await sendMail({
        to: parsed.data.email,
        subject: 'Order Confirmation - Payment Instructions',
        html: `
          <h2>Order Confirmation</h2>
          <p>Thank you for your order, ${parsed.data.name}!</p>
          <p><strong>Order ID:</strong> ${orderId_actual}</p>
          <p><strong>Product:</strong> ${product.slug}</p>
          <p><strong>Amount:</strong> €${(amountCents / 100).toFixed(2)}</p>
          
          <h3>Payment Instructions</h3>
          <div style="white-space: pre-line; background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
${bankTransferDetails}
          </div>
          
          <p><strong>Please include your Order ID (${orderId_actual}) in the payment reference.</strong></p>
          
          <p>Your order will be processed once payment is received. We will notify you when your order ships.</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the order if email fails
    }

    res.status(201).json({ 
      orderId: orderId_actual,
      orderNumber: orderId,
      amountCents,
      bankTransferDetails,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

export default router;
