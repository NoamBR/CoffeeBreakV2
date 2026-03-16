-- ============================================================
-- CoffeeBreak Voucher System Schema
-- Server-authoritative voucher lifecycle with atomic redemption
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE voucher_type AS ENUM (
    'free_coffee',
    'discount_percent',
    'free_pastry',
    'free_upgrade',
    'birthday_gift'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE voucher_status AS ENUM (
    'active',
    'pending',
    'redeemed',
    'expired',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- VOUCHERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS vouchers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type              voucher_type NOT NULL,
  status            voucher_status NOT NULL DEFAULT 'active',
  title             TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  value             NUMERIC(5,2),                                -- e.g. 10.00 for 10% discount
  barcode           TEXT NOT NULL UNIQUE,                         -- server-generated, VCH-XXXXXX-XXXXXX
  source            TEXT NOT NULL DEFAULT 'system',               -- loyalty / referral / scratch / birthday / manual / migration

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ,                                  -- NULL = never expires
  redeemed_at       TIMESTAMPTZ,
  redeemed_by       UUID REFERENCES auth.users(id),               -- staff who processed redemption

  -- Anti-fraud
  redemption_nonce  UUID,                                         -- set once atomically during redemption

  -- Link to order (if applied at checkout)
  order_id          TEXT REFERENCES orders(id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Customer voucher list
CREATE INDEX IF NOT EXISTS idx_vouchers_user_id
  ON vouchers (user_id, created_at DESC);

-- Staff barcode lookup (unique constraint already creates an index, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_vouchers_barcode
  ON vouchers (barcode);

-- Active voucher queries
CREATE INDEX IF NOT EXISTS idx_vouchers_active
  ON vouchers (status)
  WHERE status = 'active';

-- Expiration sweep
CREATE INDEX IF NOT EXISTS idx_vouchers_expires
  ON vouchers (expires_at)
  WHERE expires_at IS NOT NULL AND status = 'active';

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Cryptographic barcode generation (hex-based, collision-safe)
CREATE OR REPLACE FUNCTION generate_voucher_barcode()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_barcode TEXT;
  conflict_exists BOOLEAN;
BEGIN
  LOOP
    new_barcode := 'VCH-' ||
      upper(encode(gen_random_bytes(3), 'hex')) || '-' ||
      upper(encode(gen_random_bytes(3), 'hex'));

    SELECT EXISTS(SELECT 1 FROM vouchers WHERE barcode = new_barcode) INTO conflict_exists;
    EXIT WHEN NOT conflict_exists;
  END LOOP;

  RETURN new_barcode;
END;
$$;

-- Create voucher (server-side barcode generation)
CREATE OR REPLACE FUNCTION create_voucher(
  p_user_id     UUID,
  p_type        voucher_type,
  p_title       TEXT,
  p_description TEXT DEFAULT '',
  p_value       NUMERIC DEFAULT NULL,
  p_source      TEXT DEFAULT 'system',
  p_expires_at  TIMESTAMPTZ DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_barcode TEXT;
  v_row vouchers;
BEGIN
  v_barcode := generate_voucher_barcode();

  INSERT INTO vouchers (user_id, type, title, description, value, barcode, source, expires_at)
  VALUES (p_user_id, p_type, p_title, p_description, p_value, v_barcode, p_source, p_expires_at)
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'success', true,
    'voucher', row_to_json(v_row)::jsonb
  );
END;
$$;

-- Validate voucher (read-only, no state mutation)
CREATE OR REPLACE FUNCTION validate_voucher(p_barcode TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row vouchers;
BEGIN
  SELECT * INTO v_row
  FROM vouchers
  WHERE barcode = upper(trim(p_barcode));

  IF v_row IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'not_found');
  END IF;

  IF v_row.status = 'redeemed' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'already_redeemed',
      'redeemed_at', v_row.redeemed_at
    );
  END IF;

  IF v_row.status != 'active' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'invalid_status',
      'status', v_row.status
    );
  END IF;

  IF v_row.expires_at IS NOT NULL AND v_row.expires_at <= now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'expired');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'voucher', row_to_json(v_row)::jsonb
  );
END;
$$;

-- Atomic voucher redemption (prevents double-spending)
CREATE OR REPLACE FUNCTION redeem_voucher(
  p_barcode   TEXT,
  p_staff_id  UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row vouchers;
  v_nonce UUID;
BEGIN
  v_nonce := gen_random_uuid();

  -- Atomic UPDATE: only one concurrent caller can succeed
  UPDATE vouchers
  SET
    status = 'redeemed',
    redeemed_at = now(),
    redeemed_by = p_staff_id,
    redemption_nonce = v_nonce
  WHERE barcode = upper(trim(p_barcode))
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  RETURNING * INTO v_row;

  IF v_row IS NULL THEN
    -- Determine specific failure reason
    PERFORM 1 FROM vouchers WHERE barcode = upper(trim(p_barcode));
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'not_found');
    END IF;

    PERFORM 1 FROM vouchers
      WHERE barcode = upper(trim(p_barcode)) AND status = 'redeemed';
    IF FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'already_redeemed');
    END IF;

    PERFORM 1 FROM vouchers
      WHERE barcode = upper(trim(p_barcode))
        AND expires_at IS NOT NULL AND expires_at <= now();
    IF FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'expired');
    END IF;

    RETURN jsonb_build_object('success', false, 'error', 'invalid_status');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'voucher', row_to_json(v_row)::jsonb
  );
END;
$$;

-- Batch expiration sweep (call via pg_cron or Edge Function)
CREATE OR REPLACE FUNCTION expire_vouchers()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE vouchers
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at <= now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- Customers can read their own vouchers
CREATE POLICY vouchers_customer_select ON vouchers
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Staff can read ALL vouchers (for scan validation)
CREATE POLICY vouchers_staff_select ON vouchers
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role') IN ('manager', 'worker')
  );

-- No direct INSERT/UPDATE/DELETE policies for clients
-- All mutations go through SECURITY DEFINER functions

-- ============================================================
-- REALTIME: enable for live voucher status updates
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE vouchers;
