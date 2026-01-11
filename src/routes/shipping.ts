import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { calculateShipping } from '../lib/shipping.js';

const router = Router();

const calculateSchema = z.object({
  productId: z.string().uuid(),
  country: z.string().min(1),
});

router.post('/calculate', async (req, res) => {
  const parsed = calculateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  // Get product size
  const productRows = await query<{ size: string | null }>(
    'SELECT size FROM products WHERE id = $1',
    [parsed.data.productId],
  );

  if (productRows.length === 0) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const shippingCents = calculateShipping(parsed.data.country, productRows[0].size);
  
  res.json({
    shippingCents,
    shippingAmount: (shippingCents / 100).toFixed(2),
    currency: 'EUR',
  });
});

export default router;
