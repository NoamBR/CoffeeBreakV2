-- ============================================================
-- CoffeeBreak Orders Schema
-- Optimized for: read-heavy staff dashboard, write-heavy order placement
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('placed', 'preparing', 'ready', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,                          -- CB-XXXX format from client
  user_id         UUID REFERENCES auth.users(id),           -- nullable for guest orders
  customer_name   TEXT NOT NULL DEFAULT '',
  customer_phone  TEXT NOT NULL DEFAULT '',
  status          order_status NOT NULL DEFAULT 'placed',
  subtotal        NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  discount        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total           NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  pickup_time     TEXT NOT NULL DEFAULT 'בהקדם האפשרי',
  notes           TEXT,
  placed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ready_at        TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

-- Hot path: staff dashboard shows active orders (FIFO)
CREATE INDEX IF NOT EXISTS idx_orders_active
  ON orders (placed_at ASC)
  WHERE status IN ('placed', 'preparing', 'ready');

-- Customer order history (newest first)
CREATE INDEX IF NOT EXISTS idx_orders_user
  ON orders (user_id, placed_at DESC)
  WHERE user_id IS NOT NULL;

-- Date-range analytics queries
CREATE INDEX IF NOT EXISTS idx_orders_date
  ON orders (placed_at DESC);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_orders_status
  ON orders (status);

-- ============================================================
-- ORDER ITEMS TABLE (denormalized price/name snapshot)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id    TEXT NOT NULL,                             -- reference to menu item
  item_name       TEXT NOT NULL,                             -- frozen at order time
  price_snapshot  NUMERIC(10,2) NOT NULL CHECK (price_snapshot >= 0),
  quantity        INT NOT NULL CHECK (quantity > 0),
  customizations  TEXT,                                      -- formatted string
  line_total      NUMERIC(10,2) NOT NULL CHECK (line_total >= 0)
);

-- Fast join on order_id for fetching full order details
CREATE INDEX IF NOT EXISTS idx_order_items_order
  ON order_items (order_id);

-- "Your Usual" detection: find most-ordered items per user
-- (join through orders.user_id -> order_items.menu_item_id)
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item
  ON order_items (menu_item_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update status_updated_at on status change
CREATE OR REPLACE FUNCTION update_order_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_updated_at = NOW();
    IF NEW.status = 'ready' THEN
      NEW.ready_at = NOW();
    ELSIF NEW.status = 'completed' THEN
      NEW.completed_at = NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_status_timestamp ON orders;
CREATE TRIGGER trg_order_status_timestamp
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status_timestamp();

-- "Your Usual" function: returns top items ordered 3+ times by a user
CREATE OR REPLACE FUNCTION get_user_usual(p_user_id UUID)
RETURNS TABLE(
  menu_item_id TEXT,
  item_name TEXT,
  order_count BIGINT,
  last_customizations TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    oi.menu_item_id,
    oi.item_name,
    COUNT(*) AS order_count,
    (
      SELECT oi2.customizations
      FROM order_items oi2
      JOIN orders o2 ON o2.id = oi2.order_id
      WHERE o2.user_id = p_user_id AND oi2.menu_item_id = oi.menu_item_id
      ORDER BY o2.placed_at DESC
      LIMIT 1
    ) AS last_customizations
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.user_id = p_user_id
  GROUP BY oi.menu_item_id, oi.item_name
  HAVING COUNT(*) >= 3
  ORDER BY order_count DESC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Customers can read their own orders
CREATE POLICY orders_customer_select ON orders
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Customers can insert their own orders
CREATE POLICY orders_customer_insert ON orders
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Staff can read ALL orders (check via user metadata role)
CREATE POLICY orders_staff_select ON orders
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role') IN ('manager', 'worker')
  );

-- Staff can update order status
CREATE POLICY orders_staff_update ON orders
  FOR UPDATE USING (
    (auth.jwt() ->> 'user_role') IN ('manager', 'worker')
  );

-- Order items: customers see their own order's items
CREATE POLICY order_items_customer_select ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Order items: customers can insert items for their own orders
CREATE POLICY order_items_customer_insert ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Order items: staff can read all
CREATE POLICY order_items_staff_select ON order_items
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role') IN ('manager', 'worker')
  );

-- ============================================================
-- REALTIME: enable for live order status updates
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
