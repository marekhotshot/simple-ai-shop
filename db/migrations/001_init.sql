CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('PAINTINGS', 'SCULPTURES')),
  price_cents INT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'SOLD', 'HIDDEN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('sk', 'en')),
  title TEXT NOT NULL,
  description_short TEXT NOT NULL,
  UNIQUE (product_id, locale)
);

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('ORIGINAL', 'WEB', 'THUMB', 'AI_NO_BG_ENHANCED', 'SHARE')),
  path TEXT NOT NULL,
  mime_type TEXT,
  width INT,
  height INT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  paypal_order_id TEXT UNIQUE NOT NULL,
  paypal_capture_id TEXT UNIQUE NULL,
  status TEXT NOT NULL CHECK (status IN ('CREATED', 'PAID', 'CANCELLED', 'REFUNDED')),
  amount_cents INT NOT NULL,
  buyer_email TEXT NULL,
  shipping_name TEXT NULL,
  shipping_country TEXT NULL,
  shipping_address_json JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS custom_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_product_id UUID NULL REFERENCES products(id) ON DELETE SET NULL,
  reference_product_slug TEXT NULL,
  category TEXT NULL CHECK (category IN ('PAINTINGS', 'SCULPTURES')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT NULL,
  message TEXT NOT NULL,
  attachment_path TEXT NULL,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'IN_PROGRESS', 'DONE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('AI_IMAGE_PROCESS', 'AI_GEN_DESC', 'GEN_SHARE_IMAGE')),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'DONE', 'FAILED')),
  payload JSONB NOT NULL,
  result JSONB NULL,
  error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings_secure (
  key TEXT PRIMARY KEY,
  value_encrypted BYTEA NOT NULL,
  value_last4 TEXT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_translations_locale ON product_translations(locale);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_orders_product ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
