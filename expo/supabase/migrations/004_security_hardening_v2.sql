-- ============================================================
-- CoffeeBreak Security Hardening V2
-- Fixes: create_voucher auth, token deduplication, persistent rate limits,
--        orders customer RLS, staff anomaly detection
-- ============================================================

-- ============================================================
-- 1. TOKEN DEDUPLICATION — prevent QR screenshot replay
-- ============================================================
ALTER TABLE vouchers
  ADD COLUMN IF NOT EXISTS last_token_timestamp BIGINT NOT NULL DEFAULT 0;

-- Index for efficient deduplication lookups
CREATE INDEX IF NOT EXISTS idx_vouchers_barcode_timestamp
  ON vouchers (barcode, last_token_timestamp);

-- ============================================================
-- 2. PERSISTENT RATE LIMITING — survives Edge Function restarts
-- ============================================================
CREATE TABLE IF NOT EXISTS rate_limits (
  key           TEXT NOT NULL,
  window_start  TIMESTAMPTZ NOT NULL,
  count         INT NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);

-- Cleanup index for old entries
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup
  ON rate_limits (window_start);

-- Atomic rate limit check: returns TRUE if allowed, FALSE if rate-limited
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key          TEXT,
  p_window_start TIMESTAMPTZ,
  p_max          INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  INSERT INTO rate_limits (key, window_start, count)
  VALUES (p_key, p_window_start, 1)
  ON CONFLICT (key, window_start) DO UPDATE
    SET count = rate_limits.count + 1
  RETURNING count INTO v_count;

  RETURN v_count <= p_max;
END;
$$;

-- Periodic cleanup of old rate limit entries (run via pg_cron or manual)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_start < now() - INTERVAL '10 minutes';
END;
$$;

-- ============================================================
-- 3. RESTRICT create_voucher — enforce auth.uid() check
-- ============================================================
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
  -- ── Security: Only allow creating vouchers for the authenticated user ──
  -- Prevents IDOR where attacker passes a different user's ID
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot create vouchers for other users';
  END IF;

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

-- ============================================================
-- 4. ORDERS CUSTOMER RLS — prevent order IDOR
-- ============================================================
-- Ensure customers can only see their own orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders' AND policyname = 'orders_customer_select'
  ) THEN
    CREATE POLICY orders_customer_select ON orders
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- 5. SECURITY ALERTS TABLE — for anomaly detection
-- ============================================================
CREATE TABLE IF NOT EXISTS security_alerts (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  alert_type  TEXT NOT NULL,
  staff_id    UUID REFERENCES auth.users(id),
  details     TEXT,
  resolved    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_type
  ON security_alerts (alert_type, created_at DESC);

ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

-- Only managers can view security alerts
CREATE POLICY security_alerts_manager_read ON security_alerts
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'manager'
  );

-- ============================================================
-- 6. STAFF ANOMALY DETECTION TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION check_staff_anomaly()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Check if staff has redeemed more than 20 vouchers in the last 8 hours
  SELECT COUNT(*) INTO v_count
  FROM voucher_access_log
  WHERE staff_id = NEW.staff_id
    AND action = 'redeem'
    AND created_at > now() - INTERVAL '8 hours';

  IF v_count > 20 THEN
    INSERT INTO security_alerts (alert_type, staff_id, details)
    VALUES (
      'high_redemption_rate',
      NEW.staff_id,
      format('Staff redeemed %s vouchers in last 8 hours (threshold: 20)', v_count)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_staff_anomaly'
  ) THEN
    CREATE TRIGGER trg_staff_anomaly
      AFTER INSERT ON voucher_access_log
      FOR EACH ROW
      WHEN (NEW.action = 'redeem')
      EXECUTE FUNCTION check_staff_anomaly();
  END IF;
END $$;

-- ============================================================
-- 7. DEVICE BINDING COLUMN (for P3 device fingerprinting)
-- ============================================================
ALTER TABLE vouchers
  ADD COLUMN IF NOT EXISTS bound_device_hash TEXT;

-- User devices table for tracking registered devices
CREATE TABLE IF NOT EXISTS user_devices (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  device_hash   TEXT NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_hash)
);

ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Users can only see their own devices
CREATE POLICY user_devices_own ON user_devices
  FOR SELECT USING (auth.uid() = user_id);
