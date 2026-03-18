// Supabase Edge Function: Send OTP via WhatsApp (Meta Cloud API)
// Deploy: supabase functions deploy send-otp
// Secrets: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, WHATSAPP_TEMPLATE_NAME

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const WA_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '';
const WA_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || '';
const WA_TEMPLATE = Deno.env.get('WHATSAPP_TEMPLATE_NAME') || 'otp_code';

const OTP_EXPIRY_MINUTES = 5;
const RATE_LIMIT_PER_HOUR = 5;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function generateOtp(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const num = ((bytes[0] << 16) | (bytes[1] << 8) | bytes[2]) % 900000 + 100000;
  return num.toString();
}

// Normalize phone: ensure it starts with country code, no spaces/dashes
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

    if (!WA_PHONE_ID || !WA_TOKEN) {
      return json({ error: 'WhatsApp not configured. Contact support.' }, 500);
    }

    const normalizedPhone = normalizePhone(phone);
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

    // Store in DB
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

    // ── Send via WhatsApp ────────────────────────────────────
    const waResponse = await fetch(
      `https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WA_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: normalizedPhone,
          type: 'template',
          template: {
            name: WA_TEMPLATE,
            language: { code: 'he' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: code },
                ],
              },
            ],
          },
        }),
      }
    );

    const waData = await waResponse.json();

    if (!waResponse.ok) {
      console.error('WhatsApp API error:', waData);
      return json({
        error: 'לא הצלחנו לשלוח הודעה בוואטסאפ. ודאו שהמספר נכון.',
      }, 400);
    }

    console.log('OTP sent to', normalizedPhone, 'messageId:', waData.messages?.[0]?.id);

    return json({ success: true });
  } catch (err) {
    console.error('send-otp error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
