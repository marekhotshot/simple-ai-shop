-- Migration: Add Stripe payment support to orders table

-- Make PayPal fields nullable and remove unique constraint to allow multiple payment providers
-- We'll use a partial unique index to maintain uniqueness for non-null PayPal order IDs
ALTER TABLE orders 
  ALTER COLUMN paypal_order_id DROP NOT NULL;

-- Drop the old unique constraint if it exists
ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_paypal_order_id_key;

-- Add Stripe payment fields
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT CHECK (payment_provider IN ('PAYPAL', 'STRIPE')) NULL;

-- Create partial unique index for PayPal order IDs (only enforce uniqueness on non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_paypal_order_id_unique 
  ON orders(paypal_order_id) 
  WHERE paypal_order_id IS NOT NULL;

-- Create unique index for Stripe payment intent IDs (only enforce uniqueness on non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_unique 
  ON orders(stripe_payment_intent_id) 
  WHERE stripe_payment_intent_id IS NOT NULL;

-- Create indexes for Stripe fields
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_provider ON orders(payment_provider);

-- Update existing orders to have payment_provider='PAYPAL' where paypal_order_id is set and starts with actual PayPal format
-- Note: Bank transfer orders may have paypal_order_id starting with 'bank_', so we check for that
UPDATE orders 
SET payment_provider = 'PAYPAL' 
WHERE paypal_order_id IS NOT NULL 
  AND payment_provider IS NULL
  AND paypal_order_id NOT LIKE 'bank_%';
