// Supabase Edge Function: WhatsApp Webhook
// Receives incoming messages, verifies OTP, replies with result
// Deploy: supabase functions deploy whatsapp-webhook --no-verify-jwt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const WEBHOOK_VERIFY_TOKEN = Deno.env.get('WA_WEBHOOK_VERIFY_TOKEN') || 'coffeebreak_verify_2026';
const WA_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '';
const WA_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || '';

/**
 * Send a WhatsApp text reply to a phone number.
 */
async function sendReply(to: string, text: string) {
  if (!WA_PHONE_ID || !WA_TOKEN) return;

  try {
    await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });
  } catch (err) {
    console.error('Failed to send reply:', err);
  }
}

serve(async (req) => {
  // ── GET: Webhook verification ─────────────────────────────
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
      console.log('Webhook verified!');
      return new Response(challenge, { status: 200 });
    }

    return new Response('Forbidden', { status: 403 });
  }

  // ── POST: Incoming WhatsApp messages ──────────────────────
  if (req.method === 'POST') {
    try {
      const body = await req.json();

      const entries = body?.entry || [];
      for (const entry of entries) {
        const changes = entry?.changes || [];
        for (const change of changes) {
          if (change.field !== 'messages') continue;

          const messages = change.value?.messages || [];
          for (const message of messages) {
            if (message.type !== 'text') continue;

            const fromPhone = message.from;
            const text = message.text?.body?.trim();

            if (!text || !fromPhone) continue;

            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
            const now = new Date().toISOString();

            // Check if the text is a 6-digit code
            const codeMatch = text.match(/^(\d{6})$/);
            if (!codeMatch) {
              // Not a code — send help message
              await sendReply(fromPhone, 'שלום! כדי לאמת את החשבון שלך, שלח את הקוד בן 6 הספרות שמוצג באפליקציה.');
              continue;
            }

            const code = codeMatch[1];
            console.log('OTP received from', fromPhone, ':', code);

            // Look up matching OTP
            const { data: otpRecord, error } = await supabase
              .from('otp_codes')
              .select('id, code, phone, failed_attempts')
              .eq('phone', fromPhone)
              .eq('code', code)
              .eq('used', false)
              .gte('expires_at', now)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (error || !otpRecord) {
              // Wrong code or expired
              console.log('No matching OTP for', fromPhone, code);
              await sendReply(fromPhone, 'הקוד שגוי או שפג תוקפו. חזרו לאפליקציה וצרו קוד חדש.');
              continue;
            }

            // ── Success — mark as verified ────────────────
            await supabase
              .from('otp_codes')
              .update({ used: true, wa_verified: true })
              .eq('id', otpRecord.id);

            console.log('OTP verified via WhatsApp for', fromPhone);
            await sendReply(fromPhone, 'המספר אומת בהצלחה! חזרו לאפליקציה להשלמת ההרשמה. ☕');
          }
        }
      }

      return new Response('OK', { status: 200 });
    } catch (err) {
      console.error('Webhook error:', err);
      return new Response('OK', { status: 200 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});
