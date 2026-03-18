-- Add wa_verified column to otp_codes for WhatsApp webhook verification
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS wa_verified boolean DEFAULT false;
