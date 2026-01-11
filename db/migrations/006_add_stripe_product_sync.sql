-- Migration: Add Stripe product sync fields

-- Add Stripe product and price IDs to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT UNIQUE NULL,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_stripe_product_id ON products(stripe_product_id);
CREATE INDEX IF NOT EXISTS idx_products_stripe_price_id ON products(stripe_price_id);
