import Stripe from 'stripe';
import { query, pool } from '../db.js';
import { loadSetting } from './settings.js';
import { config } from './env.js';

async function getStripeClient(): Promise<Stripe> {
  const apiKey = await loadSetting('stripe.secret_key');
  if (!apiKey) {
    throw new Error('Stripe API key not configured');
  }
  return new Stripe(apiKey, {
    apiVersion: '2025-02-24.acacia',
  });
}

/**
 * Convert product image path to full URL
 */
function imagePathToUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${config.imageBaseUrl}${cleanPath}`;
}

/**
 * Get product data with translations and images
 */
async function getProductData(productId: string, locale: string = 'en') {
  const productRows = await query<{
    id: string;
    slug: string;
    category: string;
    price_cents: number;
    status: string;
    title: string | null;
    description_short: string | null;
  }>(
    `SELECT p.id, p.slug, p.category, p.price_cents, p.status,
      pt.title, pt.description_short
    FROM products p
    LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = $1
    WHERE p.id = $2`,
    [locale, productId],
  );

  if (!productRows[0]) {
    throw new Error('Product not found');
  }

  const product = productRows[0];
  
  // Get images
  const images = await query<{ path: string }>(
    `SELECT path FROM product_images 
     WHERE product_id = $1 AND variant = 'WEB'
     ORDER BY sort_order ASC
     LIMIT 8`,
    [productId],
  );

  // If no WEB images, try THUMB
  let imagePaths = images.map(img => img.path);
  if (imagePaths.length === 0) {
    const thumbImages = await query<{ path: string }>(
      `SELECT path FROM product_images 
       WHERE product_id = $1 AND variant = 'THUMB'
       ORDER BY sort_order ASC
       LIMIT 8`,
      [productId],
    );
    imagePaths = thumbImages.map(img => img.path);
  }

  // If still no images, try any image
  if (imagePaths.length === 0) {
    const anyImages = await query<{ path: string }>(
      `SELECT path FROM product_images 
       WHERE product_id = $1
       ORDER BY sort_order ASC
       LIMIT 8`,
      [productId],
    );
    imagePaths = anyImages.map(img => img.path);
  }

  return {
    ...product,
    images: imagePaths.map(path => imagePathToUrl(path)).filter(url => url),
  };
}

/**
 * Sync a single product to Stripe
 */
export async function syncProductToStripe(productId: string, locale: string = 'en'): Promise<{
  stripeProductId: string;
  stripePriceId: string;
}> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get product data (outside transaction for images)
    const productData = await getProductData(productId, locale);
    
    if (productData.status !== 'AVAILABLE' && productData.status !== 'RESERVED') {
      throw new Error(`Product status is ${productData.status}, cannot sync to Stripe`);
    }

    const stripe = await getStripeClient();
    
    // Check if product already exists in Stripe
    const existingProductRows = await client.query<{ stripe_product_id: string | null; stripe_price_id: string | null }>(
      'SELECT stripe_product_id, stripe_price_id FROM products WHERE id = $1',
      [productId],
    );
    
    const existingStripeProductId = existingProductRows.rows[0]?.stripe_product_id;
    const existingStripePriceId = existingProductRows.rows[0]?.stripe_price_id;

    let stripeProduct: Stripe.Product;
    let stripePrice: Stripe.Price;

    if (existingStripeProductId) {
      // Update existing product
      stripeProduct = await stripe.products.update(existingStripeProductId, {
        name: productData.title || productData.slug,
        description: productData.description_short || undefined,
        images: productData.images,
        metadata: {
          product_id: productId,
          slug: productData.slug,
          category: productData.category,
        },
      });

      // If price changed, create new price and archive old one
      const existingPrice = existingStripePriceId 
        ? await stripe.prices.retrieve(existingStripePriceId)
        : null;

      if (!existingPrice || existingPrice.unit_amount !== productData.price_cents) {
        // Archive old price if it exists and is active
        if (existingPrice && existingPrice.active) {
          await stripe.prices.update(existingPrice.id, { active: false });
        }

        // Create new price
        stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: productData.price_cents,
          currency: 'eur',
        });

        // Update database with new price ID
        await client.query(
          'UPDATE products SET stripe_price_id = $1 WHERE id = $2',
          [stripePrice.id, productId],
        );
      } else {
        stripePrice = existingPrice;
      }
    } else {
      // Create new product
      stripeProduct = await stripe.products.create({
        name: productData.title || productData.slug,
        description: productData.description_short || undefined,
        images: productData.images,
        metadata: {
          product_id: productId,
          slug: productData.slug,
          category: productData.category,
        },
      });

      // Create price
      stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: productData.price_cents,
        currency: 'eur',
      });

      // Update database
      await client.query(
        'UPDATE products SET stripe_product_id = $1, stripe_price_id = $2 WHERE id = $3',
        [stripeProduct.id, stripePrice.id, productId],
      );
    }

    await client.query('COMMIT');
    return {
      stripeProductId: stripeProduct.id,
      stripePriceId: stripePrice.id,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Sync all available products to Stripe
 */
export async function syncAllProductsToStripe(locale: string = 'en'): Promise<{
  synced: number;
  errors: Array<{ productId: string; error: string }>;
}> {
  const products = await query<{ id: string }>(
    "SELECT id FROM products WHERE status IN ('AVAILABLE', 'RESERVED')",
  );

  const errors: Array<{ productId: string; error: string }> = [];
  let synced = 0;

  for (const product of products) {
    try {
      await syncProductToStripe(product.id, locale);
      synced++;
    } catch (error) {
      errors.push({
        productId: product.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { synced, errors };
}
