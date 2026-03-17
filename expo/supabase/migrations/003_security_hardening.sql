-- ============================================================
-- CoffeeBreak Security Hardening Migration
-- Fixes: RLS policies, self-redemption, audit logging, input constraints
-- ============================================================

-- ============================================================
-- 1. AUDIT LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS voucher_access_log (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  staff_id   UUID NOT NULL REFERENCES auth.users(id),
  barcode    TEXT NOT NULL,
  action     TEXT NOT NULL CHECK (action IN ('validate', 'redeem', 'view')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voucher_access_log_staff
  ON voucher_access_log (staff_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_voucher_access_log_barcode
  ON voucher_access_log (barcode, created_at DESC);

-- RLS on audit log: staff can read their own logs, managers can read all
ALTER TABLE voucher_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY access_log_staff_own ON voucher_access_log
  FOR SELECT USING (auth.uid() = staff_id);

CREATE POLICY access_log_manager_all ON voucher_access_log
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'manager'
  );

-- ============================================================
-- 2. FIX RLS POLICIES — use app_metadata instead of user_metadata
-- ============================================================

-- Drop old policies that used insecure JWT claims
DROP POLICY IF EXISTS vouchers_staff_select ON vouchers;

-- Recreate with app_metadata (cannot be set client-side)
CREATE POLICY vouchers_staff_select ON vouchers
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'worker')
  );

-- ============================================================
-- 3. SELF-REDEMPTION PREVENTION
-- Replace redeem_voucher function with self-scan block
-- ============================================================

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

  -- ── Self-redemption check ──────────────────────────────────
  -- Staff cannot redeem vouchers they own
  IF p_staff_id IS NOT NULL THEN
    PERFORM 1 FROM vouchers
      WHERE barcode = upper(trim(p_barcode))
        AND user_id = p_staff_id;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'self_redemption_blocked'
      );
    END IF;
  END IF;

  -- ── Atomic UPDATE: only one concurrent caller can succeed ──
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

  -- ── Audit log ──────────────────────────────────────────────
  IF p_staff_id IS NOT NULL THEN
    INSERT INTO voucher_access_log (staff_id, barcode, action)
    VALUES (p_staff_id, v_row.barcode, 'redeem');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'voucher', row_to_json(v_row)::jsonb
  );
END;
$$;

-- ============================================================
-- 4. INPUT CONSTRAINTS — prevent abuse via oversized payloads
-- ============================================================

DO $$ BEGIN
  ALTER TABLE vouchers ADD CONSTRAINT chk_title_length
    CHECK (char_length(title) <= 200);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE vouchers ADD CONSTRAINT chk_description_length
    CHECK (char_length(description) <= 1000);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add constraint to orders table if it exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    BEGIN
      ALTER TABLE orders ADD CONSTRAINT chk_notes_length
        CHECK (char_length(notes) <= 500);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TABLE orders ADD CONSTRAINT chk_customer_name_length
        CHECK (char_length(customer_name) <= 100);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- ============================================================
-- 5. INCREASE BARCODE ENTROPY (6 → 8 bytes per segment)
-- ============================================================

CREATE OR REPLACE FUNCTION generate_voucher_barcode()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_barcode TEXT;
  conflict_exists BOOLEAN;
BEGIN
  LOOP
    -- 8 bytes per segment = 64 bits total entropy (vs. 48 before)
    new_barcode := 'VCH-' ||
      upper(encode(gen_random_bytes(4), 'hex')) || '-' ||
      upper(encode(gen_random_bytes(4), 'hex'));

    SELECT EXISTS(SELECT 1 FROM vouchers WHERE barcode = new_barcode) INTO conflict_exists;
    EXIT WHEN NOT conflict_exists;
  END LOOP;

  RETURN new_barcode;
END;
$$;

-- ============================================================
-- 6. STAFF LOGIN ATTEMPT TRACKING (for rate limiting)
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_login_attempts (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identifier  TEXT NOT NULL,         -- email or IP
  success     BOOLEAN NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier
  ON staff_login_attempts (identifier, created_at DESC);

-- Function to check if login should be blocked (>5 failures in 15 min)
CREATE OR REPLACE FUNCTION check_login_allowed(p_identifier TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_failures INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_failures
  FROM staff_login_attempts
  WHERE identifier = p_identifier
    AND success = false
    AND created_at > now() - INTERVAL '15 minutes';

  RETURN v_failures < 5;
END;
$$;

-- ============================================================
-- 7. FIX ORDERS RLS — use app_metadata instead of user_metadata
-- ============================================================

DROP POLICY IF EXISTS orders_staff_select ON orders;
CREATE POLICY orders_staff_select ON orders
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'worker')
  );

DROP POLICY IF EXISTS orders_staff_update ON orders;
CREATE POLICY orders_staff_update ON orders
  FOR UPDATE USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'worker')
  );

DROP POLICY IF EXISTS order_items_staff_select ON order_items;
CREATE POLICY order_items_staff_select ON order_items
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'worker')
  );

-- ============================================================
-- 8. MENU ITEMS TABLE (server-side price source of truth)
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  available   BOOLEAN NOT NULL DEFAULT true,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Everyone can read the menu
CREATE POLICY menu_items_public_read ON menu_items
  FOR SELECT USING (true);

-- Only managers can modify menu items
CREATE POLICY menu_items_manager_write ON menu_items
  FOR ALL USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'manager'
  );

-- ============================================================
-- 9. SECURE ORDER PLACEMENT (server-side price validation)
-- ============================================================
CREATE OR REPLACE FUNCTION place_order_secure(
  p_user_id        UUID,
  p_customer_name  TEXT,
  p_customer_phone TEXT,
  p_items          JSONB,          -- [{menu_item_id, quantity, customizations}]
  p_voucher_barcode TEXT DEFAULT NULL,
  p_pickup_time    TEXT DEFAULT 'בהקדם האפשרי',
  p_notes          TEXT DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id     TEXT;
  v_subtotal     NUMERIC := 0;
  v_discount     NUMERIC := 0;
  v_item         JSONB;
  v_menu_item    RECORD;
  v_qty          INT;
  v_line_total   NUMERIC;
  v_voucher      RECORD;
BEGIN
  -- Generate order ID server-side
  v_order_id := 'CB-' || upper(encode(gen_random_bytes(3), 'hex'));

  -- Validate and price each item from server-side menu_items table
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_menu_item
    FROM menu_items
    WHERE id = (v_item ->> 'menu_item_id')
      AND available = true;

    IF v_menu_item IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'invalid_item',
        'item_id', v_item ->> 'menu_item_id'
      );
    END IF;

    v_qty := COALESCE((v_item ->> 'quantity')::int, 1);
    IF v_qty < 1 OR v_qty > 20 THEN
      RETURN jsonb_build_object('success', false, 'error', 'invalid_quantity');
    END IF;

    v_line_total := v_menu_item.price * v_qty;
    v_subtotal := v_subtotal + v_line_total;

    -- Insert order item with server-verified price
    INSERT INTO order_items (order_id, menu_item_id, item_name, price_snapshot, quantity, customizations, line_total)
    VALUES (v_order_id, v_menu_item.id, v_menu_item.name, v_menu_item.price, v_qty, v_item ->> 'customizations', v_line_total);
  END LOOP;

  -- Apply voucher if provided
  IF p_voucher_barcode IS NOT NULL THEN
    SELECT * INTO v_voucher
    FROM vouchers
    WHERE barcode = upper(trim(p_voucher_barcode))
      AND user_id = p_user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now());

    IF v_voucher IS NOT NULL THEN
      IF v_voucher.type = 'discount_percent' AND v_voucher.value IS NOT NULL THEN
        v_discount := ROUND(v_subtotal * (v_voucher.value / 100), 2);
      ELSIF v_voucher.type IN ('free_coffee', 'free_pastry', 'free_upgrade') THEN
        -- Apply fixed discount up to subtotal
        v_discount := LEAST(v_subtotal, COALESCE(v_voucher.value, 0));
      END IF;
    END IF;
  END IF;

  -- Insert the order with server-calculated prices
  INSERT INTO orders (id, user_id, customer_name, customer_phone, subtotal, discount, total, pickup_time, notes)
  VALUES (
    v_order_id,
    p_user_id,
    COALESCE(left(p_customer_name, 100), ''),
    COALESCE(left(p_customer_phone, 20), ''),
    v_subtotal,
    v_discount,
    GREATEST(v_subtotal - v_discount, 0),
    COALESCE(left(p_pickup_time, 100), 'בהקדם האפשרי'),
    left(COALESCE(p_notes, ''), 500)
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'total', GREATEST(v_subtotal - v_discount, 0)
  );
END;
$$;
