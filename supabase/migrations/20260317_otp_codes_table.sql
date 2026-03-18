-- OTP codes table for WhatsApp verification
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  failed_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup by phone + code (only unused)
CREATE INDEX IF NOT EXISTS idx_otp_phone_code ON otp_codes(phone, code) WHERE used = FALSE;

-- Rate limiting index
CREATE INDEX IF NOT EXISTS idx_otp_rate_limit ON otp_codes(phone, created_at);

-- Users table (if not exists) for phone-based auth
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  birthday TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
