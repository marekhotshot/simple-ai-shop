import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { fallbackText, resolveLocale } from '../lib/i18n.js';
import { sendMail } from '../lib/email.js';

const router = Router();

router.get('/products', async (req, res) => {
  const locale = resolveLocale(String(req.query.lang ?? 'sk'));
  const category = req.query.category ? String(req.query.category) : null;
  const availableOnly = req.query.availableOnly === 'true';

  const params: Array<string | boolean> = [];
  const filters: string[] = [];
  if (category) {
    params.push(category);
    filters.push(`p.category = $${params.length}`);
  }
  if (availableOnly) {
    params.push(true);
    filters.push(`p.status = 'AVAILABLE'`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
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
    primary_image: string | null;
  }>(
    `SELECT p.id, p.slug, p.category, p.price_cents, p.status,
      sk.title AS title_sk, sk.description_short AS desc_sk,
      en.title AS title_en, en.description_short AS desc_en,
      img.path AS primary_image
    FROM products p
    LEFT JOIN product_translations sk ON sk.product_id = p.id AND sk.locale = 'sk'
    LEFT JOIN product_translations en ON en.product_id = p.id AND en.locale = 'en'
    LEFT JOIN LATERAL (
      SELECT path FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1
    ) img ON true
    ${whereClause}
    ORDER BY p.created_at DESC`,
    params.length ? params : undefined,
  );

  const response = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    category: row.category,
    priceCents: row.price_cents,
    status: row.status,
    title: fallbackText(row.title_sk ?? '', locale === 'en' ? row.title_en : row.title_sk),
    descriptionShort: fallbackText(row.desc_sk ?? '', locale === 'en' ? row.desc_en : row.desc_sk),
    primaryImage: row.primary_image,
  }));

  res.json({ products: response });
});

router.get('/products/:slug', async (req, res) => {
  const locale = resolveLocale(String(req.query.lang ?? 'sk'));
  const slug = req.params.slug;

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
    WHERE p.slug = $1`,
    [slug],
  );

  if (!rows[0]) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const images = await query<{ path: string; variant: string }>(
    'SELECT path, variant FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC',
    [rows[0].id],
  );

  res.json({
    id: rows[0].id,
    slug: rows[0].slug,
    category: rows[0].category,
    priceCents: rows[0].price_cents,
    status: rows[0].status,
    title: fallbackText(rows[0].title_sk ?? '', locale === 'en' ? rows[0].title_en : rows[0].title_sk),
    descriptionShort: fallbackText(
      rows[0].desc_sk ?? '',
      locale === 'en' ? rows[0].desc_en : rows[0].desc_sk,
    ),
    images,
  });
});

const requestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  country: z.string().optional().nullable(),
  message: z.string().min(1),
  referenceProductId: z.string().uuid().optional().nullable(),
  referenceProductSlug: z.string().optional().nullable(),
  category: z.enum(['PAINTINGS', 'SCULPTURES']).optional().nullable(),
});

router.post('/custom-request', async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const payload = parsed.data;
  const rows = await query<{ id: string }>(
    `INSERT INTO custom_requests
    (reference_product_id, reference_product_slug, category, name, email, country, message)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id`,
    [
      payload.referenceProductId ?? null,
      payload.referenceProductSlug ?? null,
      payload.category ?? null,
      payload.name,
      payload.email,
      payload.country ?? null,
      payload.message,
    ],
  );

  const emailResult = await sendMail({
    subject: 'New custom request',
    text: `Name: ${payload.name}\nEmail: ${payload.email}\nMessage: ${payload.message}`,
  });

  res.json({ id: rows[0].id, mailSent: emailResult.sent, mailReason: emailResult.reason ?? null });
});

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
});

router.post('/contact', async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const payload = parsed.data;
  const rows = await query<{ id: string }>(
    `INSERT INTO contact_messages (name, email, message)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [payload.name, payload.email, payload.message],
  );

  const emailResult = await sendMail({
    subject: 'New contact message',
    text: `Name: ${payload.name}\nEmail: ${payload.email}\nMessage: ${payload.message}`,
  });

  res.json({ id: rows[0].id, mailSent: emailResult.sent, mailReason: emailResult.reason ?? null });
});

export default router;
