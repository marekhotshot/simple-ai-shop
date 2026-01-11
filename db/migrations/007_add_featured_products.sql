-- Migration: Add featured flag to products

-- Add featured boolean column to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for faster queries on featured products
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
