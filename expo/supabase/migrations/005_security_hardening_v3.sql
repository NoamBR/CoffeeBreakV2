-- ============================================================
-- CoffeeBreak Security Hardening V3
-- Server-side loyalty logic, stamp-order linkage, scratch card
-- validation, voucher source tracking, lowered anomaly threshold
-- ============================================================

-- ============================================================
-- 1. VOUCHER SOURCE TRACKING — track how each voucher was earned
-- ============================================================
-- Add source_verified column: TRUE = server validated the reward chain
ALTER TABLE vouchers
  ADD COLUMN IF NOT EXISTS source_verified BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- 2. SERVER-SIDE LOYALTY CARDS — prevent client-side manipulation
-- ============================================================
CREATE TABLE IF NOT EXISTS loyalty_cards (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES auth.users(id),
  stamps_count          INT NOT NULL DEFAULT 0 CHECK (stamps_count >= 0 AND stamps_count < 5),
  completed_cards       INT NOT NULL DEFAULT 0 CHECK (completed_cards >= 0),
  total_stamps_ever     INT NOT NULL DEFAULT 0 CHECK (total_stamps_ever >= 0),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE loyalty_cards ENABLE ROW LEVEL SECURITY;

-- Customers can read only their own loyalty card
CREATE POLICY loyalty_cards_customer_read ON loyalty_cards
  FOR SELECT USING (auth.uid() = user_id);

-- Staff (managers) can view all loyalty cards for auditing
CREATE POLICY loyalty_cards_manager_read ON loyalty_cards
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'manager'
  );

-- ============================================================
-- 3. STAMP TRANSACTIONS — each stamp must reference a paid order
-- ============================================================
CREATE TABLE IF NOT EXISTS stamp_transactions (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  order_id      BIGINT NOT NULL REFERENCES orders(id),
  staff_id      UUID REFERENCES auth.users(id),
  stamp_type    TEXT NOT NULL DEFAULT 'purchase' CHECK (stamp_type IN ('purchase', 'bonus')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Prevent double-stamping the same order
  UNIQUE (order_id, stamp_type)
);

CREATE INDEX IF NOT EXISTS idx_stamp_transactions_user
  ON stamp_transactions (user_id, created_at DESC);

ALTER TABLE stamp_transactions ENABLE ROW LEVEL SECURITY;

-- Customers see their own stamp history
CREATE POLICY stamp_transactions_customer_read ON stamp_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Staff can view all stamps
CREATE POLICY stamp_transactions_staff_read ON stamp_transactions
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'worker')
  );

-- ============================================================
-- 4. GRANT STAMP — server-side function with order validation
-- ============================================================
CREATE OR REPLACE FUNCTION grant_stamp(
  p_user_id   UUID,
  p_order_id  BIGINT,
  p_staff_id  UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_card  loyalty_cards;
  v_new_stamps INT;
  v_reward_earned BOOLEAN := false;
  v_scratch_awarded BOOLEAN := false;
  v_voucher_result jsonb;
BEGIN
  -- Verify the order exists, belongs to the user, and is paid
  SELECT id, user_id, payment_status, status
  INTO v_order
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'order_not_found');
  END IF;

  IF v_order.user_id != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'reason', 'order_not_owned');
  END IF;

  IF v_order.payment_status != 'completed' AND v_order.status != 'completed' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'order_not_paid');
  END IF;

  -- Prevent double-stamping (UNIQUE constraint will catch this too, but explicit check is clearer)
  IF EXISTS (SELECT 1 FROM stamp_transactions WHERE order_id = p_order_id AND stamp_type = 'purchase') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_stamped');
  END IF;

  -- Insert stamp transaction
  INSERT INTO stamp_transactions (user_id, order_id, staff_id, stamp_type)
  VALUES (p_user_id, p_order_id, p_staff_id, 'purchase');

  -- Upsert loyalty card
  INSERT INTO loyalty_cards (user_id, stamps_count, total_stamps_ever)
  VALUES (p_user_id, 1, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    stamps_count = loyalty_cards.stamps_count + 1,
    total_stamps_ever = loyalty_cards.total_stamps_ever + 1,
    updated_at = now()
  RETURNING * INTO v_card;

  v_new_stamps := v_card.stamps_count;

  -- Check if card is complete (5 stamps = free coffee reward)
  IF v_new_stamps >= 5 THEN
    -- Reset stamps, increment completed cards
    UPDATE loyalty_cards
    SET stamps_count = 0, completed_cards = completed_cards + 1, updated_at = now()
    WHERE user_id = p_user_id;

    -- Create verified free coffee voucher
    v_voucher_result := create_voucher(
      p_user_id, 'free_coffee'::voucher_type,
      'קפה חינם — כרטיס נאמנות',
      'קפה חינם! אספת 5 חותמות בכרטיס הנאמנות.',
      NULL, 'loyalty_reward',
      now() + INTERVAL '30 days'
    );

    -- Mark voucher as source-verified
    UPDATE vouchers
    SET source_verified = true
    WHERE id = (v_voucher_result -> 'voucher' ->> 'id')::uuid;

    v_reward_earned := true;
  END IF;

  -- Check if scratch card should be awarded (every 3rd total stamp)
  IF v_card.total_stamps_ever % 3 = 0 THEN
    v_scratch_awarded := true;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'stamps_count', CASE WHEN v_reward_earned THEN 0 ELSE v_new_stamps END,
    'total_stamps_ever', v_card.total_stamps_ever,
    'reward_earned', v_reward_earned,
    'scratch_awarded', v_scratch_awarded
  );
END;
$$;

-- ============================================================
-- 5. SERVER-SIDE SCRATCH CARD — prevent prize manipulation
-- ============================================================
CREATE TABLE IF NOT EXISTS scratch_cards (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  prize       TEXT NOT NULL CHECK (prize IN ('bonus_stamp', 'discount_10', 'free_upgrade', 'free_pastry')),
  revealed    BOOLEAN NOT NULL DEFAULT false,
  voucher_id  UUID REFERENCES vouchers(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE scratch_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY scratch_cards_customer_read ON scratch_cards
  FOR SELECT USING (auth.uid() = user_id);

-- Server-side prize roll — weights: 40% bonus_stamp, 30% discount_10, 20% free_upgrade, 10% free_pastry
CREATE OR REPLACE FUNCTION create_scratch_card(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_roll DOUBLE PRECISION;
  v_prize TEXT;
  v_card_id BIGINT;
BEGIN
  -- Security: only create for authenticated user
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot create scratch cards for other users';
  END IF;

  -- Server-side random prize roll (not manipulable by client)
  v_roll := random();
  IF v_roll < 0.4 THEN
    v_prize := 'bonus_stamp';
  ELSIF v_roll < 0.7 THEN
    v_prize := 'discount_10';
  ELSIF v_roll < 0.9 THEN
    v_prize := 'free_upgrade';
  ELSE
    v_prize := 'free_pastry';
  END IF;

  INSERT INTO scratch_cards (user_id, prize)
  VALUES (p_user_id, v_prize)
  RETURNING id INTO v_card_id;

  RETURN jsonb_build_object(
    'success', true,
    'scratch_card_id', v_card_id
    -- Prize is NOT returned here — client reveals it with reveal_scratch_card()
  );
END;
$$;

-- Reveal scratch card — creates the voucher and returns the prize
CREATE OR REPLACE FUNCTION reveal_scratch_card(p_scratch_card_id BIGINT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_card RECORD;
  v_voucher_result jsonb;
BEGIN
  SELECT * INTO v_card
  FROM scratch_cards
  WHERE id = p_scratch_card_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'card_not_found');
  END IF;

  -- Security: only the card owner can reveal
  IF auth.uid() IS NOT NULL AND v_card.user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'reason', 'forbidden');
  END IF;

  IF v_card.revealed THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_revealed');
  END IF;

  -- Create voucher based on prize type
  IF v_card.prize = 'discount_10' THEN
    v_voucher_result := create_voucher(
      v_card.user_id, 'discount_percent'::voucher_type,
      '10% הנחה — כרטיס גירוד',
      'זכית ב-10% הנחה מכרטיס גירוד!',
      10, 'scratch_card',
      now() + INTERVAL '14 days'
    );
  ELSIF v_card.prize = 'free_upgrade' THEN
    v_voucher_result := create_voucher(
      v_card.user_id, 'free_upgrade'::voucher_type,
      'שדרוג גודל — כרטיס גירוד',
      'זכית בשדרוג גודל חינם מכרטיס גירוד!',
      NULL, 'scratch_card',
      now() + INTERVAL '14 days'
    );
  ELSIF v_card.prize = 'free_pastry' THEN
    v_voucher_result := create_voucher(
      v_card.user_id, 'free_pastry'::voucher_type,
      'מאפה חינם — כרטיס גירוד',
      'זכית במאפה חינם מכרטיס גירוד!',
      NULL, 'scratch_card',
      now() + INTERVAL '14 days'
    );
  END IF;
  -- bonus_stamp: no voucher, handled by incrementing stamps

  -- Mark as revealed
  UPDATE scratch_cards
  SET revealed = true,
      voucher_id = CASE
        WHEN v_voucher_result IS NOT NULL
        THEN (v_voucher_result -> 'voucher' ->> 'id')::uuid
        ELSE NULL
      END
  WHERE id = p_scratch_card_id;

  -- Mark voucher as source-verified
  IF v_voucher_result IS NOT NULL THEN
    UPDATE vouchers
    SET source_verified = true
    WHERE id = (v_voucher_result -> 'voucher' ->> 'id')::uuid;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'prize', v_card.prize,
    'voucher', COALESCE(v_voucher_result -> 'voucher', 'null'::jsonb)
  );
END;
$$;

-- ============================================================
-- 6. LOWER ANOMALY DETECTION THRESHOLD — 20 → 10 redemptions
-- ============================================================
CREATE OR REPLACE FUNCTION check_staff_anomaly()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Lowered from 20 to 10: flag earlier to catch abuse during busy periods
  SELECT COUNT(*) INTO v_count
  FROM voucher_access_log
  WHERE staff_id = NEW.staff_id
    AND action = 'redeem'
    AND created_at > now() - INTERVAL '8 hours';

  IF v_count > 10 THEN
    INSERT INTO security_alerts (alert_type, staff_id, details)
    VALUES (
      'high_redemption_rate',
      NEW.staff_id,
      format('Staff redeemed %s vouchers in last 8 hours (threshold: 10)', v_count)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 7. VOUCHER REDEMPTION SOURCE VALIDATION
-- ============================================================
-- Add check: vouchers from loyalty/scratch sources must be source_verified
-- This prevents client-forged vouchers from being redeemed
CREATE OR REPLACE FUNCTION validate_voucher_source()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only enforce for reward-chain sources (loyalty, scratch card)
  IF NEW.status = 'redeemed' AND OLD.status = 'active' THEN
    IF OLD.source IN ('loyalty_reward', 'scratch_card') AND NOT OLD.source_verified THEN
      RAISE EXCEPTION 'Voucher source not verified — possible forgery';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_voucher_source'
  ) THEN
    CREATE TRIGGER trg_validate_voucher_source
      BEFORE UPDATE ON vouchers
      FOR EACH ROW
      WHEN (NEW.status = 'redeemed' AND OLD.status = 'active')
      EXECUTE FUNCTION validate_voucher_source();
  END IF;
END $$;
