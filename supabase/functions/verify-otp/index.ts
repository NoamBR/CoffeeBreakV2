// Supabase Edge Function: Verify OTP code
// Deploy: supabase functions deploy verify-otp
// Security: Rate-limited to 5 failed attempts per phone per 15 minutes

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const MAX_VERIFY_ATTEMPTS = 5;
const VERIFY_WINDOW_MINUTES = 15;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return json({ error: 'Phone and code are required' }, 400);
    }

    const normalizedPhone = normalizePhone(phone);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ── Rate limit: check failed attempts ────────────────────
    const windowStart = new Date(Date.now() - VERIFY_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { data: recentCodes } = await supabase
      .from('otp_codes')
      .select('failed_attempts')
      .eq('phone', normalizedPhone)
      .gte('created_at', windowStart)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const totalFails = recentCodes?.failed_attempts ?? 0;
    if (totalFails >= MAX_VERIFY_ATTEMPTS) {
      return json({
        verified: false,
        error: 'יותר מדי ניסיונות שגויים. נסו שוב בעוד 15 דקות.',
      }, 429);
    }

    // ── Look up valid OTP ────────────────────────────────────
    const now = new Date().toISOString();
    const { data: otpRecord, error: lookupError } = await supabase
      .from('otp_codes')
      .select('id, phone, code, expires_at, used, failed_attempts')
      .eq('phone', normalizedPhone)
      .eq('used', false)
      .gte('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lookupError || !otpRecord || otpRecord.code !== code.trim()) {
      // Increment failed attempts on the latest OTP record
      if (otpRecord) {
        await supabase
          .from('otp_codes')
          .update({ failed_attempts: (otpRecord.failed_attempts || 0) + 1 })
          .eq('id', otpRecord.id);
      }
      return json({ verified: false, error: 'קוד שגוי או שפג תוקפו. נסו שוב.' }, 400);
    }

    // ── Success: mark as used ────────────────────────────────
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);

    // Find or create user by phone
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', normalizedPhone)
      .single();

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          phone: normalizedPhone,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createError || !newUser) {
        console.error('Failed to create user:', createError);
        userId = `temp-${Date.now()}`;
      } else {
        userId = newUser.id;
      }
    }

    console.log('OTP verified for', normalizedPhone, 'userId:', userId);

    return json({ verified: true, userId });
  } catch (err) {
    console.error('verify-otp error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
