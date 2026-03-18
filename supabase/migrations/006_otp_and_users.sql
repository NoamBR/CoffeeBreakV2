-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  phone text UNIQUE,
  name text,
  birthday text,
  created_at timestamptz DEFAULT now()
);

-- Create otp_codes table
CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  failed_attempts integer DEFAULT 0,
  wa_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for fast OTP lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_used ON otp_codes (phone, used, expires_at);

-- RLS policies
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- otp_codes: only service role can access (edge functions use service key)
CREATE POLICY otp_codes_service_only ON otp_codes FOR ALL USING (false);

-- users: customers see own row, staff sees all
CREATE POLICY users_self_read ON users FOR SELECT USING (
  auth.uid()::text = id OR
  (auth.jwt() -> 'app_metadata' ->> 'role') IN ('manager', 'worker')
);

CREATE POLICY users_service_write ON users FOR ALL USING (false);
