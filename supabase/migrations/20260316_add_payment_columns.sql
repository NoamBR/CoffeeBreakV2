-- Add payment tracking columns to orders table
-- Run this migration on your Supabase SQL editor

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'at_register';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_card_last4 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_paid_at TIMESTAMPTZ;

-- Index for callback lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_transaction_id ON orders(payment_transaction_id);
