-- Seed data for App Store / Play Store demo reviewer account
-- Phone: +972500000000 (demo mode bypasses WhatsApp OTP)
-- Run this in Supabase SQL Editor after deploying the app

-- 1. Create demo user (if not exists)
INSERT INTO users (phone, name, birthday, created_at)
VALUES ('972500000000', 'Apple Reviewer', '1990-01-15', NOW() - INTERVAL '60 days')
ON CONFLICT (phone) DO UPDATE SET name = 'Apple Reviewer';

-- 2. Create demo vouchers
-- Active voucher (free coffee)
INSERT INTO vouchers (user_id, type, title, description, barcode, status, expires_at, created_at)
SELECT
  u.id,
  'free_coffee',
  'קפה חינם',
  'קפה הפוך רגיל חינם - מתנת הצטרפות',
  'DEMO-VOUCHER-ACTIVE-001',
  'active',
  NOW() + INTERVAL '30 days',
  NOW() - INTERVAL '2 days'
FROM users u WHERE u.phone = '972500000000'
ON CONFLICT DO NOTHING;

-- Redeemed voucher (shows history)
INSERT INTO vouchers (user_id, type, title, description, barcode, status, redeemed_at, created_at)
SELECT
  u.id,
  'free_pastry',
  'מאפה חינם',
  'קרואסון חמאה - פרס גירוד',
  'DEMO-VOUCHER-USED-001',
  'redeemed',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '10 days'
FROM users u WHERE u.phone = '972500000000'
ON CONFLICT DO NOTHING;

-- 3. Create demo orders (history)
INSERT INTO orders (user_id, total, status, payment_method, payment_status, created_at)
SELECT
  u.id,
  14.00,
  'completed',
  'at_register',
  'completed',
  NOW() - INTERVAL '1 day'
FROM users u WHERE u.phone = '972500000000';

INSERT INTO orders (user_id, total, status, payment_method, payment_status, created_at)
SELECT
  u.id,
  28.50,
  'completed',
  'credit_card',
  'completed',
  NOW() - INTERVAL '3 days'
FROM users u WHERE u.phone = '972500000000';

INSERT INTO orders (user_id, total, status, payment_method, payment_status, created_at)
SELECT
  u.id,
  16.00,
  'completed',
  'at_register',
  'completed',
  NOW() - INTERVAL '7 days'
FROM users u WHERE u.phone = '972500000000';

-- 4. Create staff reviewer account for admin access
-- Run this via Supabase Dashboard > Authentication > Users > Create User
-- OR via the Supabase Management API:
--
--   Email:    reviewer@coffeebreak.app
--   Password: Review2026!
--   Role:     manager
--
-- After creating the auth user, insert the staff profile:
INSERT INTO staff (auth_user_id, email, role, name, created_at)
SELECT
  au.id,
  'reviewer@coffeebreak.app',
  'manager',
  'App Reviewer',
  NOW()
FROM auth.users au
WHERE au.email = 'reviewer@coffeebreak.app'
ON CONFLICT (email) DO NOTHING;

-- 5. Add a discount voucher for variety
INSERT INTO vouchers (user_id, type, title, description, barcode, value, status, expires_at, created_at)
SELECT
  u.id,
  'discount',
  '10% הנחה',
  'הנחת VIP לחברי מועדון זהב',
  'DEMO-VOUCHER-DISC-001',
  10,
  'active',
  NOW() + INTERVAL '14 days',
  NOW() - INTERVAL '1 day'
FROM users u WHERE u.phone = '972500000000'
ON CONFLICT DO NOTHING;

-- Note: Loyalty stamps, streak, tier, and "Your Usual" data are managed
-- client-side in Zustand stores (persisted via AsyncStorage).
-- The demo reviewer will see these features populate naturally after
-- logging in and interacting with the app.
--
-- For a richer demo, the reviewer can:
-- 1. Browse the full menu (100+ items)
-- 2. View active deals
-- 3. See their voucher collection (2 active + 1 redeemed)
-- 4. View order history (3 past orders)
-- 5. Access staff admin via long-press on profile avatar
