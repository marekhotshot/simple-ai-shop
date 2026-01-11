import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';

const router = Router();

const processImageSchema = z.object({
  productId: z.string().uuid(),
  imageId: z.string().uuid(),
  prompt: z.string().optional().default('Remove background and enhance quality'),
});

router.post('/ai/process-image', async (req, res) => {
  const parsed = processImageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const jobRows = await query<{ id: string }>(
    `INSERT INTO jobs (type, status, payload)
     VALUES ('AI_IMAGE_PROCESS', 'PENDING', $1)
     RETURNING id`,
    [JSON.stringify(parsed.data)],
  );

  res.status(202).json({ jobId: jobRows[0].id });
});

const generateDescSchema = z.object({
  productId: z.string().uuid(),
  hints: z.string().optional().nullable(),
});

router.post('/ai/generate-description', async (req, res) => {
  const parsed = generateDescSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const jobRows = await query<{ id: string }>(
    `INSERT INTO jobs (type, status, payload)
     VALUES ('AI_GEN_DESC', 'PENDING', $1)
     RETURNING id`,
    [JSON.stringify(parsed.data)],
  );

  res.status(202).json({ jobId: jobRows[0].id });
});

const socialSchema = z.object({
  productId: z.string().uuid(),
  locale: z.enum(['sk', 'en']),
  platform: z.enum(['facebook', 'tiktok']),
  title: z.string().min(1),
  price: z.number().int().positive(),
  url: z.string().url(),
});

router.post('/social/generate', async (req, res) => {
  const parsed = socialSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const currency = new Intl.NumberFormat(parsed.data.locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(parsed.data.price / 100);
  const hashtags = parsed.data.locale === 'sk'
    ? '#lipa #drevo #umenie #rucnapraca'
    : '#linden #woodart #handcrafted #oneofone';
  const cta = parsed.data.locale === 'sk'
    ? `Pozrite si viac: ${parsed.data.url}`
    : `See more: ${parsed.data.url}`;

  const caption = parsed.data.platform === 'facebook'
    ? `${parsed.data.title} · ${currency}\n${cta}`
    : `${parsed.data.title} ${currency} ✨ ${cta}`;

  res.json({
    caption,
    hashtags,
  });
});

const shareSchema = z.object({
  productId: z.string().uuid(),
  locale: z.enum(['sk', 'en']),
});

router.post('/share-image/generate', async (req, res) => {
  const parsed = shareSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const jobRows = await query<{ id: string }>(
    `INSERT INTO jobs (type, status, payload)
     VALUES ('GEN_SHARE_IMAGE', 'PENDING', $1)
     RETURNING id`,
    [JSON.stringify(parsed.data)],
  );

  res.status(202).json({ jobId: jobRows[0].id });
});

const generateTitleDescSchema = z.object({
  productId: z.string().uuid(),
  imageId: z.string().uuid(),
  locale: z.enum(['sk', 'en']),
});

// Generate title and description from main image using consistent template
router.post('/ai/generate-title-description', async (req, res) => {
  const parsed = generateTitleDescSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const jobRows = await query<{ id: string }>(
    `INSERT INTO jobs (type, status, payload)
     VALUES ('AI_GEN_TITLE_DESC', 'PENDING', $1)
     RETURNING id`,
    [JSON.stringify(parsed.data)],
  );

  res.status(202).json({ jobId: jobRows[0].id });
});

export default router;
