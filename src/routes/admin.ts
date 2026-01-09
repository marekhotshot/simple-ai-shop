import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { query } from '../db.js';
import { config } from '../lib/env.js';
import { loadSettingFlags, saveSetting } from '../lib/settings.js';

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
  category: z.enum(['PAINTINGS', 'SCULPTURES']),
  priceCents: z.number().int().positive(),
  status: z.enum(['AVAILABLE', 'SOLD', 'HIDDEN']).default('AVAILABLE'),
  translations: z.array(translationSchema).min(1),
});

router.post('/products', async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const payload = parsed.data;
  const productRows = await query<{ id: string }>(
    `INSERT INTO products (slug, category, price_cents, status)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [payload.slug, payload.category, payload.priceCents, payload.status],
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
     SET slug = $1, category = $2, price_cents = $3, status = $4, updated_at = NOW()
     WHERE id = $5`,
    [payload.slug, payload.category, payload.priceCents, payload.status, req.params.id],
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

  res.json({ ok: true });
});

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Missing file' });
    return;
  }

  const productId = String(req.body.productId ?? '');
  const variant = String(req.body.variant ?? 'ORIGINAL');
  if (!productId) {
    res.status(400).json({ error: 'Missing productId' });
    return;
  }

  const targetDir = path.join(config.dataRoot, 'products', productId, variant.toLowerCase());
  await fs.mkdir(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, req.file.filename + path.extname(req.file.originalname));
  await fs.rename(req.file.path, targetPath);

  await query(
    `INSERT INTO product_images (product_id, variant, path, mime_type)
     VALUES ($1, $2, $3, $4)`,
    [productId, variant, targetPath, req.file.mimetype],
  );

  res.status(201).json({ path: targetPath });
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
    'google.api_key',
    'google.image_model',
    'google.text_model',
    'google.features.remove_bg.enabled',
    'google.features.enhance.enabled',
    'google.features.gen_desc.enabled',
  ];
  const flags = await loadSettingFlags(keys);
  res.json({ configured: flags });
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

export default router;
