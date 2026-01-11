-- Migration: Add size and finish fields to products

ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS size TEXT NULL,
  ADD COLUMN IF NOT EXISTS finish TEXT NULL;

COMMENT ON COLUMN products.size IS 'Product size/dimensions (e.g., "30x30 cm")';
COMMENT ON COLUMN products.finish IS 'Surface finish (e.g., "Natural / Light Oil")';
