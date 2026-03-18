// Supabase Edge Function: Generate OTP for WhatsApp verification
// Flow: generate code → return to app → user sends code to business via wa.me link
// Deploy: supabase functions deploy send-otp

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Business WhatsApp number for wa.me link (international format, no +)
const WA_BUSINESS_NUMBER = Deno.env.get('WA_BUSINESS_NUMBER') || '';

const OTP_EXPIRY_MINUTES = 5;
const RATE_LIMIT_PER_HOUR = 5;

// Demo account for App Store reviewers
const DEMO_PHONE = '972500000000';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Frame-Options': 'DENY',
    },
  });

function generateOtp(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const num = ((bytes[0] << 16) | (bytes[1] << 8) | bytes[2]) % 900000 + 100000;
  return num.toString();
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone) {
      return json({ error: 'Phone number is required' }, 400);
    }

    const normalizedPhone = normalizePhone(phone);

    // ── Demo mode: skip real OTP ─────────────────────────────
    if (normalizedPhone === DEMO_PHONE) {
      return json({ success: true, waLink: null, demo: true });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ── Rate limiting ────────────────────────────────────────
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('otp_codes')
      .select('*', { count: 'exact', head: true })
      .eq('phone', normalizedPhone)
      .gte('created_at', oneHourAgo);

    if (!countError && (count ?? 0) >= RATE_LIMIT_PER_HOUR) {
      return json({ error: 'יותר מדי ניסיונות. נסו שוב בעוד שעה.' }, 429);
    }

    // ── Generate OTP ─────────────────────────────────────────
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from('otp_codes')
      .insert({
        phone: normalizedPhone,
        code,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error('Failed to store OTP:', insertError);
      return json({ error: 'שגיאה פנימית. נסו שוב.' }, 500);
    }

    // ── Build wa.me link ─────────────────────────────────────
    const waText = encodeURIComponent(code);
    const waLink = WA_BUSINESS_NUMBER
      ? `https://wa.me/${WA_BUSINESS_NUMBER}?text=${waText}`
      : null;

    console.log('OTP generated for', normalizedPhone, 'code:', code);

    return json({
      success: true,
      code,
      waLink,
      expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
    });
  } catch (err) {
    console.error('send-otp error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
