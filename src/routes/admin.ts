import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import Stripe from 'stripe';
import { query } from '../db.js';
import { config } from '../lib/env.js';
import { loadSettingFlags, saveSetting, loadSetting } from '../lib/settings.js';
import { syncProductToStripe, syncAllProductsToStripe } from '../lib/stripe-sync.js';

const router = Router();

const upload = multer({
  dest: path.join(config.dataRoot, 'tmp'),
});

const translationSchema = z.object({
  locale: z.enum(['sk', 'en']),
  title: z.string().min(1),
  descriptionShort: z.string().min(1),
});

const productSchema = z.object({
  slug: z.string().min(1),
  category: z.enum(['PAINTINGS', 'SCULPTURES', 'WALL_CARVINGS', 'FREE_STANDING', 'NATURE_INSPIRED', 'FANTASY_MYTH', 'CUSTOM']),
  tags: z.array(z.enum(['PAINTINGS', 'SCULPTURES', 'WALL_CARVINGS', 'FREE_STANDING', 'NATURE_INSPIRED', 'FANTASY_MYTH', 'CUSTOM'])).optional(),
  priceCents: z.number().int().positive(),
  status: z.enum(['AVAILABLE', 'SOLD', 'HIDDEN', 'RESERVED']).default('AVAILABLE'),
  size: z.string().optional().nullable(),
  finish: z.string().optional().nullable(),
  imageOrientation: z.enum(['square', 'landscape', 'portrait']).optional().nullable(),
  translations: z.array(translationSchema).min(1),
});

router.get('/products', async (_req, res) => {
  const rows = await query<{
    id: string;
    slug: string;
    category: string;
    price_cents: number;
    status: string;
    title_sk: string | null;
    desc_sk: string | null;
    title_en: string | null;
    desc_en: string | null;
  }>(
    `SELECT p.id, p.slug, p.category, p.price_cents, p.status,
      sk.title AS title_sk, sk.description_short AS desc_sk,
      en.title AS title_en, en.description_short AS desc_en
    FROM products p
    LEFT JOIN product_translations sk ON sk.product_id = p.id AND sk.locale = 'sk'
    LEFT JOIN product_translations en ON en.product_id = p.id AND en.locale = 'en'
    ORDER BY p.created_at DESC`,
  );

  const products = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    category: row.category,
    priceCents: row.price_cents,
    status: row.status,
    translations: [
      { locale: 'sk', title: row.title_sk || '', descriptionShort: row.desc_sk || '' },
      { locale: 'en', title: row.title_en || '', descriptionShort: row.desc_en || '' },
    ],
  }));

  res.json({ products });
});

router.get('/products/:id', async (req, res) => {
  const productId = req.params.id;
  const rows = await query<{
    id: string;
    slug: string;
    category: string;
    price_cents: number;
    status: string;
    size: string | null;
    finish: string | null;
    image_orientation: string | null;
    title_sk: string | null;
    desc_sk: string | null;
    title_en: string | null;
    desc_en: string | null;
  }>(
    `SELECT p.id, p.slug, p.category, p.price_cents, p.status, p.size, p.finish, p.image_orientation,
      sk.title AS title_sk, sk.description_short AS desc_sk,
      en.title AS title_en, en.description_short AS desc_en
    FROM products p
    LEFT JOIN product_translations sk ON sk.product_id = p.id AND sk.locale = 'sk'
    LEFT JOIN product_translations en ON en.product_id = p.id AND en.locale = 'en'
    WHERE p.id = $1`,
    [productId],
  );

  if (!rows[0]) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const images = await query<{ id: string; path: string; sort_order: number }>(
    'SELECT id, path, sort_order FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC',
    [productId],
  );

  const tags = await query<{ tag: string }>(
    'SELECT tag FROM product_tags WHERE product_id = $1 ORDER BY tag',
    [productId],
  );

  res.json({
    id: rows[0].id,
    slug: rows[0].slug,
    category: rows[0].category,
    tags: tags.map(t => t.tag),
    priceCents: rows[0].price_cents,
    status: rows[0].status,
    size: rows[0].size || null,
    finish: rows[0].finish || null,
    imageOrientation: rows[0].image_orientation || null,
    translations: [
      { locale: 'sk', title: rows[0].title_sk || '', descriptionShort: rows[0].desc_sk || '' },
      { locale: 'en', title: rows[0].title_en || '', descriptionShort: rows[0].desc_en || '' },
    ],
    images: images.map((img) => ({
      id: img.id,
      path: img.path,
      sortOrder: img.sort_order,
    })),
  });
});

router.post('/products', async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const payload = parsed.data;
  const productRows = await query<{ id: string }>(
    `INSERT INTO products (slug, category, price_cents, status, size, finish, image_orientation)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [payload.slug, payload.category, payload.priceCents, payload.status, payload.size || null, payload.finish || null, payload.imageOrientation || null],
  );
  const productId = productRows[0].id;

  for (const translation of payload.translations) {
    await query(
      `INSERT INTO product_translations (product_id, locale, title, description_short)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (product_id, locale)
       DO UPDATE SET title = EXCLUDED.title, description_short = EXCLUDED.description_short`,
      [productId, translation.locale, translation.title, translation.descriptionShort],
    );
  }

  // Handle tags (multiple categories)
  if (payload.tags && payload.tags.length > 0) {
    // Delete existing tags
    await query('DELETE FROM product_tags WHERE product_id = $1', [productId]);
    // Insert new tags
    for (const tag of payload.tags) {
      await query(
        'INSERT INTO product_tags (product_id, tag) VALUES ($1, $2) ON CONFLICT (product_id, tag) DO NOTHING',
        [productId, tag],
      );
    }
  } else {
    // If no tags provided, use the category as a tag
    await query(
      'INSERT INTO product_tags (product_id, tag) VALUES ($1, $2) ON CONFLICT (product_id, tag) DO NOTHING',
      [productId, payload.category],
    );
  }

  res.status(201).json({ id: productId });
});

router.put('/products/:id', async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const payload = parsed.data;
  await query(
    `UPDATE products
     SET slug = $1, category = $2, price_cents = $3, status = $4, size = $5, finish = $6, image_orientation = $7, updated_at = NOW()
     WHERE id = $8`,
    [payload.slug, payload.category, payload.priceCents, payload.status, payload.size || null, payload.finish || null, payload.imageOrientation || null, req.params.id],
  );

  for (const translation of payload.translations) {
    await query(
      `INSERT INTO product_translations (product_id, locale, title, description_short)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (product_id, locale)
       DO UPDATE SET title = EXCLUDED.title, description_short = EXCLUDED.description_short`,
      [req.params.id, translation.locale, translation.title, translation.descriptionShort],
    );
  }

  // Handle tags (multiple categories)
  const productId = req.params.id;
  // Delete existing tags
  await query('DELETE FROM product_tags WHERE product_id = $1', [productId]);
  // Insert new tags
  if (payload.tags && payload.tags.length > 0) {
    for (const tag of payload.tags) {
      await query(
        'INSERT INTO product_tags (product_id, tag) VALUES ($1, $2) ON CONFLICT (product_id, tag) DO NOTHING',
        [productId, tag],
      );
    }
  } else {
    // If no tags provided, use the category as a tag
    await query(
      'INSERT INTO product_tags (product_id, tag) VALUES ($1, $2) ON CONFLICT (product_id, tag) DO NOTHING',
      [productId, payload.category],
    );
  }

  res.json({ ok: true });
});

router.delete('/products/:id', async (req, res) => {
  const productId = req.params.id;
  await query('DELETE FROM products WHERE id = $1', [productId]);
  res.json({ ok: true });
});

router.post('/products/:id/images', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Missing file' });
    return;
  }

  const productId = req.params.id;
  const variant = String(req.body.variant ?? 'ORIGINAL');
  const sortOrder = parseInt(String(req.body.sortOrder ?? '1'));

  const targetDir = path.join(config.dataRoot, 'products', productId, variant.toLowerCase());
  await fs.mkdir(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, req.file.filename + path.extname(req.file.originalname));
  await fs.rename(req.file.path, targetPath);

  const relativePath = path.relative(config.dataRoot, targetPath).replace(/\\/g, '/');
  const uploadPath = '/' + relativePath;

  const result = await query<{ id: string }>(
    `INSERT INTO product_images (product_id, variant, path, mime_type, sort_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [productId, variant, uploadPath, req.file.mimetype, sortOrder],
  );

  res.status(201).json({ id: result[0].id, path: uploadPath });
});

router.delete('/products/:id/images/:imageId', async (req, res) => {
  const imageId = req.params.imageId;
  const imageRows = await query<{ path: string }>(
    'SELECT path FROM product_images WHERE id = $1',
    [imageId],
  );

  if (imageRows.length === 0) {
    res.status(404).json({ error: 'Image not found' });
    return;
  }

  const imagePath = path.join(config.dataRoot, imageRows[0].path.replace(/^\//, ''));
  try {
    await fs.unlink(imagePath);
  } catch (error) {
    // Ignore file not found errors
  }

  await query('DELETE FROM product_images WHERE id = $1', [imageId]);
  res.json({ ok: true });
});

router.get('/settings/integrations', async (_req, res) => {
  const keys = [
    'paypal.mode',
    'paypal.sandbox.client_id',
    'paypal.sandbox.client_secret',
    'paypal.sandbox.webhook_id',
    'paypal.live.client_id',
    'paypal.live.client_secret',
    'paypal.live.webhook_id',
    'stripe.secret_key',
    'stripe.publishable_key',
    'google.api_key',
    'google.image_model',
    'google.text_model',
    'google.features.remove_bg.enabled',
    'google.features.enhance.enabled',
    'google.features.gen_desc.enabled',
    'bank_transfer.details',
  ];
  const flags = await loadSettingFlags(keys);
  // Also load actual values for keys that might need to be displayed (like last4)
  const configured: any = {};
  for (const key of keys) {
    const flag = flags[key];
    if (key === 'bank_transfer.details') {
      // For bank transfer, always try to load the value
      const value = await loadSetting(key);
      configured[key] = { configured: !!value, value: value || '' };
    } else if (flag) {
      configured[key] = { last4: flag.last4 || undefined, configured: flag.configured };
    } else {
      configured[key] = { configured: false };
    }
  }
  
  // Check if PayPal is configured
  const mode = (await loadSetting('paypal.mode')) ?? 'sandbox';
  const prefix = mode === 'live' ? 'paypal.live' : 'paypal.sandbox';
  const clientId = await loadSetting(`${prefix}.client_id`);
  const clientSecret = await loadSetting(`${prefix}.client_secret`);
  const paypalConfigured = !!(clientId && clientSecret);
  
  // Check if Stripe is configured
  const stripeSecretKey = await loadSetting('stripe.secret_key');
  const stripePublishableKey = await loadSetting('stripe.publishable_key');
  const stripeConfigured = !!(stripeSecretKey && stripePublishableKey);
  
  res.json({ 
    configured,
    paypalConfigured, // Add flag for easy frontend check
    stripeConfigured, // Add flag for easy frontend check
  });
});

const integrationSchema = z.object({
  values: z.record(z.string(), z.string().min(1)),
  updatedBy: z.string().optional().nullable(),
});

router.post('/settings/integrations', async (req, res) => {
  const parsed = integrationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { values, updatedBy } = parsed.data;
  const entries = Object.entries(values);
  for (const [key, value] of entries) {
    await saveSetting(key, value, updatedBy ?? null);
  }

  res.json({ ok: true });
});

// GET orders
router.get('/orders', async (_req, res) => {
  const rows = await query<{
    id: string;
    product_id: string;
    paypal_order_id: string | null;
    paypal_capture_id: string | null;
    stripe_payment_intent_id: string | null;
    stripe_charge_id: string | null;
    payment_provider: string | null;
    status: string;
    amount_cents: number;
    buyer_email: string | null;
    shipping_name: string | null;
    shipping_country: string | null;
    shipping_address_json: any;
    created_at: Date;
    paid_at: Date | null;
    product_slug: string | null;
    product_title_sk: string | null;
  }>(
    `SELECT o.*, p.slug AS product_slug, pt.title AS product_title_sk
     FROM orders o
     JOIN products p ON p.id = o.product_id
     LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'sk'
     ORDER BY o.created_at DESC`,
  );

  res.json({ orders: rows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    productSlug: row.product_slug,
    productTitle: row.product_title_sk,
    paypalOrderId: row.paypal_order_id,
    paypalCaptureId: row.paypal_capture_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    stripeChargeId: row.stripe_charge_id,
    paymentProvider: row.payment_provider,
    status: row.status,
    amountCents: row.amount_cents,
    buyerEmail: row.buyer_email,
    shippingName: row.shipping_name,
    shippingCountry: row.shipping_country,
    shippingAddress: row.shipping_address_json,
    createdAt: row.created_at.toISOString(),
    paidAt: row.paid_at?.toISOString() || null,
  })) });
});

// GET single order
router.get('/orders/:id', async (req, res) => {
  const rows = await query<{
    id: string;
    product_id: string;
    paypal_order_id: string | null;
    paypal_capture_id: string | null;
    stripe_payment_intent_id: string | null;
    stripe_charge_id: string | null;
    payment_provider: string | null;
    status: string;
    amount_cents: number;
    buyer_email: string | null;
    shipping_name: string | null;
    shipping_country: string | null;
    shipping_address_json: any;
    created_at: Date;
    paid_at: Date | null;
    product_slug: string | null;
    product_title_sk: string | null;
  }>(
    `SELECT o.*, p.slug AS product_slug, pt.title AS product_title_sk
     FROM orders o
     JOIN products p ON p.id = o.product_id
     LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'sk'
     WHERE o.id = $1`,
    [req.params.id],
  );

  if (!rows[0]) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const row = rows[0];
  res.json({
    id: row.id,
    productId: row.product_id,
    productSlug: row.product_slug,
    productTitle: row.product_title_sk,
    paypalOrderId: row.paypal_order_id,
    paypalCaptureId: row.paypal_capture_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    stripeChargeId: row.stripe_charge_id,
    paymentProvider: row.payment_provider,
    status: row.status,
    amountCents: row.amount_cents,
    buyerEmail: row.buyer_email,
    shippingName: row.shipping_name,
    shippingCountry: row.shipping_country,
    shippingAddress: row.shipping_address_json,
    createdAt: row.created_at.toISOString(),
    paidAt: row.paid_at?.toISOString() || null,
  });
});

// GET custom requests
router.get('/requests', async (req, res) => {
  const status = req.query.status as string | undefined;
  const whereClause = status ? 'WHERE status = $1' : '';
  const params = status ? [status] : [];

  const rows = await query<{
    id: string;
    reference_product_id: string | null;
    reference_product_slug: string | null;
    category: string | null;
    name: string;
    email: string;
    country: string | null;
    message: string;
    attachment_path: string | null;
    status: string;
    created_at: Date;
  }>(
    `SELECT * FROM custom_requests ${whereClause} ORDER BY created_at DESC`,
    params,
  );

  res.json({ requests: rows.map((row) => ({
    id: row.id,
    referenceProductId: row.reference_product_id,
    referenceProductSlug: row.reference_product_slug,
    category: row.category,
    name: row.name,
    email: row.email,
    country: row.country,
    message: row.message,
    attachmentPath: row.attachment_path,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  })) });
});

// GET single custom request
router.get('/requests/:id', async (req, res) => {
  const rows = await query<{
    id: string;
    reference_product_id: string | null;
    reference_product_slug: string | null;
    category: string | null;
    name: string;
    email: string;
    country: string | null;
    message: string;
    attachment_path: string | null;
    status: string;
    created_at: Date;
  }>(
    'SELECT * FROM custom_requests WHERE id = $1',
    [req.params.id],
  );

  if (!rows[0]) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const row = rows[0];
  res.json({
    id: row.id,
    referenceProductId: row.reference_product_id,
    referenceProductSlug: row.reference_product_slug,
    category: row.category,
    name: row.name,
    email: row.email,
    country: row.country,
    message: row.message,
    attachmentPath: row.attachment_path,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  });
});

// UPDATE custom request status
router.put('/requests/:id/status', async (req, res) => {
  const statusSchema = z.object({
    status: z.enum(['NEW', 'IN_PROGRESS', 'DONE']),
  });
  
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  await query(
    'UPDATE custom_requests SET status = $1 WHERE id = $2',
    [parsed.data.status, req.params.id],
  );

  res.json({ ok: true });
});

// GET contact messages
router.get('/contact-messages', async (_req, res) => {
  const rows = await query<{
    id: string;
    name: string;
    email: string;
    message: string;
    created_at: Date;
  }>(
    'SELECT * FROM contact_messages ORDER BY created_at DESC',
  );

  res.json({ messages: rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    createdAt: row.created_at.toISOString(),
  })) });
});

// POST test PayPal
router.post('/settings/integrations/test-paypal', async (req, res) => {
  try {
    const mode = await loadSetting('paypal.mode');
    const prefix = mode === 'live' ? 'paypal.live' : 'paypal.sandbox';
    const clientId = await loadSetting(`${prefix}.client_id`);
    const clientSecret = await loadSetting(`${prefix}.client_secret`);
    
    if (!clientId || !clientSecret) {
      res.status(400).json({ error: 'PayPal credentials not configured' });
      return;
    }

    const baseUrl = mode === 'live' 
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
    
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (response.ok) {
      res.json({ ok: true, message: 'PayPal credentials valid' });
    } else {
      res.status(400).json({ error: `PayPal authentication failed: ${response.statusText}` });
    }
  } catch (error) {
    res.status(500).json({ error: 'PayPal test failed', details: String(error) });
  }
});

// POST test Google
router.post('/settings/integrations/test-google', async (req, res) => {
  try {
    // Allow testing with provided API key or use saved one
    const apiKey = req.body?.apiKey || await loadSetting('google.api_key');
    
    if (!apiKey) {
      res.status(400).json({ error: 'Google API key not configured. Please enter an API key and save it first, or provide it in the test request.' });
      return;
    }

    // Test with a simple API call (you can adjust this based on actual Google Gemini API)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    
    if (response.ok) {
      res.json({ ok: true, message: 'Google API key is valid' });
    } else {
      const errorText = await response.text();
      res.status(400).json({ error: `Google API test failed: ${response.statusText}. ${errorText}` });
    }
  } catch (error) {
    res.status(500).json({ error: 'Google API test failed', details: String(error) });
  }
});

// POST test Stripe
router.post('/settings/integrations/test-stripe', async (req, res) => {
  try {
    const secretKey = req.body?.secretKey || await loadSetting('stripe.secret_key');
    const publishableKey = req.body?.publishableKey || await loadSetting('stripe.publishable_key');
    
    if (!secretKey || !publishableKey) {
      res.status(400).json({ error: 'Stripe keys not configured. Please enter both Secret Key and Publishable Key and save them first, or provide them in the test request.' });
      return;
    }

    // Test with Stripe API - retrieve account info
    const stripe = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia',
    });

    const account = await stripe.accounts.retrieve();
    
    if (account && account.id) {
      res.json({ ok: true, message: `Stripe credentials valid. Account: ${account.id}` });
    } else {
      res.status(400).json({ error: 'Stripe API test failed: Invalid response' });
    }
  } catch (error: any) {
    if (error.type === 'StripeAuthenticationError') {
      res.status(400).json({ error: 'Stripe authentication failed: Invalid API key' });
    } else {
      res.status(500).json({ error: 'Stripe API test failed', details: String(error.message || error) });
    }
  }
});

// POST sync single product to Stripe
router.post('/products/:id/sync-stripe', async (req, res) => {
  try {
    const productId = req.params.id;
    const locale = (req.body?.locale as string) || 'en';
    
    const result = await syncProductToStripe(productId, locale);
    res.json({
      ok: true,
      message: 'Product synced to Stripe successfully',
      stripeProductId: result.stripeProductId,
      stripePriceId: result.stripePriceId,
    });
  } catch (error) {
    console.error('Stripe sync error:', error);
    if (error instanceof Error && error.message === 'Stripe API key not configured') {
      res.status(503).json({ error: 'Stripe not configured' });
      return;
    }
    res.status(500).json({ 
      error: 'Failed to sync product to Stripe', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

// POST sync all products to Stripe
router.post('/products/sync-stripe-all', async (req, res) => {
  try {
    const locale = (req.body?.locale as string) || 'en';
    
    const result = await syncAllProductsToStripe(locale);
    res.json({
      ok: true,
      message: `Synced ${result.synced} products to Stripe`,
      synced: result.synced,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Stripe sync all error:', error);
    if (error instanceof Error && error.message === 'Stripe API key not configured') {
      res.status(503).json({ error: 'Stripe not configured' });
      return;
    }
    res.status(500).json({ 
      error: 'Failed to sync products to Stripe', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

export default router;
