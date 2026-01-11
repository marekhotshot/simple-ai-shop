-- Migration: Add image orientation field to products

ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS image_orientation TEXT NULL CHECK (image_orientation IN ('square', 'landscape', 'portrait'));

COMMENT ON COLUMN products.image_orientation IS 'Image display orientation: square, landscape (horizontal), or portrait (vertical)';

-- Set default based on category (can be overridden in admin)
UPDATE products 
SET image_orientation = CASE 
  WHEN category IN ('WALL_CARVINGS') THEN 'landscape'
  WHEN category IN ('FREE_STANDING', 'SCULPTURES') THEN 'portrait'
  ELSE 'square'
END
WHERE image_orientation IS NULL;
