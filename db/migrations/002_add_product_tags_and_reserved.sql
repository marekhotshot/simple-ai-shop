-- Migration: Add product tags (multiple categories) and reserved status

-- Update products table to allow new categories
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE products ADD CONSTRAINT products_category_check 
  CHECK (category IN ('PAINTINGS', 'SCULPTURES', 'WALL_CARVINGS', 'FREE_STANDING', 'NATURE_INSPIRED', 'FANTASY_MYTH', 'CUSTOM'));

-- Create product_tags table for multiple categories/tags per product
CREATE TABLE IF NOT EXISTS product_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag TEXT NOT NULL CHECK (tag IN ('PAINTINGS', 'SCULPTURES', 'WALL_CARVINGS', 'FREE_STANDING', 'NATURE_INSPIRED', 'FANTASY_MYTH', 'CUSTOM')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, tag)
);

-- Add reserved status to products
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE products ADD CONSTRAINT products_status_check 
  CHECK (status IN ('AVAILABLE', 'SOLD', 'HIDDEN', 'RESERVED'));

-- Update orders status to include RESERVED
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('CREATED', 'PAID', 'CANCELLED', 'REFUNDED', 'RESERVED'));

-- Update custom_requests category constraint
ALTER TABLE custom_requests DROP CONSTRAINT IF EXISTS custom_requests_category_check;
ALTER TABLE custom_requests ADD CONSTRAINT custom_requests_category_check 
  CHECK (category IN ('PAINTINGS', 'SCULPTURES', 'WALL_CARVINGS', 'FREE_STANDING', 'NATURE_INSPIRED', 'FANTASY_MYTH', 'CUSTOM') OR category IS NULL);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_tags_product ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON product_tags(tag);
