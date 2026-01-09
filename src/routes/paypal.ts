import { Router } from 'express';
import { z } from 'zod';
import { pool, query } from '../db.js';
import { loadSetting } from '../lib/settings.js';
import { config } from '../lib/env.js';

const router = Router();

async function getPayPalToken() {
  const mode = (await loadSetting('paypal.mode')) ?? config.paypal.mode;
  const prefix = mode === 'live' ? 'paypal.live' : 'paypal.sandbox';
  const clientId = await loadSetting(`${prefix}.client_id`);
  const clientSecret = await loadSetting(`${prefix}.client_secret`);
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials missing');
  }
  const baseUrl = mode === 'live' ? config.paypal.liveBaseUrl : config.paypal.sandboxBaseUrl;
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) {
    throw new Error(`PayPal auth failed ${response.status}`);
  }
  const data = (await response.json()) as { access_token: string };
  return { accessToken: data.access_token, baseUrl };
}

const createSchema = z.object({
  productId: z.string().uuid(),
  returnUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

router.post('/create-order', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
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

  const { accessToken, baseUrl } = await getPayPalToken();
  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'EUR',
            value: (product.price_cents / 100).toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: parsed.data.returnUrl,
        cancel_url: parsed.data.cancelUrl,
      },
    }),
  });

  if (!response.ok) {
    res.status(502).json({ error: 'PayPal create order failed' });
    return;
  }

  const data = (await response.json()) as { id: string };
  await query(
    `INSERT INTO orders (product_id, paypal_order_id, status, amount_cents)
     VALUES ($1, $2, 'CREATED', $3)`,
    [product.id, data.id, product.price_cents],
  );

  res.json({ orderId: data.id });
});

const captureSchema = z.object({
  orderId: z.string().min(1),
});

router.post('/capture-order', async (req, res) => {
  const parsed = captureSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { accessToken, baseUrl } = await getPayPalToken();
  const response = await fetch(`${baseUrl}/v2/checkout/orders/${parsed.data.orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    res.status(502).json({ error: 'PayPal capture failed' });
    return;
  }

  const data = (await response.json()) as {
    id: string;
    status: string;
    payer?: { email_address?: string };
    purchase_units?: Array<{ shipping?: { name?: { full_name?: string }; address?: Record<string, string> } }>;
    payments?: { captures?: Array<{ id: string }> };
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderRows = await client.query<{
      id: string;
      product_id: string;
      status: string;
    }>('SELECT id, product_id, status FROM orders WHERE paypal_order_id = $1 FOR UPDATE', [
      parsed.data.orderId,
    ]);

    const order = orderRows.rows[0];
    if (!order) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const updateProduct = await client.query(
      "UPDATE products SET status = 'SOLD', updated_at = NOW() WHERE id = $1 AND status = 'AVAILABLE'",
      [order.product_id],
    );

    if (updateProduct.rowCount === 0) {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'Product already sold' });
      return;
    }

    const captureId = data.payments?.captures?.[0]?.id ?? null;
    const shipping = data.purchase_units?.[0]?.shipping;

    await client.query(
      `UPDATE orders
       SET status = 'PAID', paypal_capture_id = $1, buyer_email = $2,
           shipping_name = $3, shipping_country = $4, shipping_address_json = $5,
           paid_at = NOW()
       WHERE id = $6`,
      [
        captureId,
        data.payer?.email_address ?? null,
        shipping?.name?.full_name ?? null,
        shipping?.address?.country_code ?? null,
        shipping?.address ?? null,
        order.id,
      ],
    );

    await client.query('COMMIT');
    res.json({ status: data.status, captureId });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Capture transaction failed' });
  } finally {
    client.release();
  }
});

export default router;
