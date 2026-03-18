// Supabase Edge Function: Verify OTP (check if verified via WhatsApp webhook)
// Deploy: supabase functions deploy verify-otp
// Flow: App polls this endpoint → checks if wa_verified = true → returns session

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const DEMO_PHONE = '972500000000';
const DEMO_OTP = '123456';
const PHONE_EMAIL_DOMAIN = 'phone.coffeebreak.app';

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
    },
  });

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
}

function syntheticEmail(phone: string): string {
  return `${phone}@${PHONE_EMAIL_DOMAIN}`;
}

async function findOrCreateAuthUser(
  supabase: ReturnType<typeof createClient>,
  phone: string,
): Promise<{ userId: string; isNew: boolean } | { userId: null; error: string }> {
  const email = syntheticEmail(phone);

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    phone,
    phone_confirm: true,
    user_metadata: { phone, login_method: 'whatsapp_otp' },
  });

  if (!createError && created?.user) {
    return { userId: created.user.id, isNew: true };
  }

  if (
    createError?.message?.includes('already') ||
    createError?.message?.includes('exists') ||
    createError?.message?.includes('duplicate')
  ) {
    const { data: listed } = await supabase.auth.admin.listUsers({ page: 1, perPage: 50 });
    const found = listed?.users?.find((u) => u.email === email || u.phone === phone);
    if (found) return { userId: found.id, isNew: false };
    return { userId: null, error: 'User exists but not found in listing' };
  }

  return { userId: null, error: `createUser failed: ${createError?.message}` };
}

async function generateSessionToken(
  supabase: ReturnType<typeof createClient>,
  email: string,
): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.generateLink({ type: 'magiclink', email });
  if (error || !data?.properties?.hashed_token) return null;
  return data.properties.hashed_token;
}

async function syncPublicUser(
  supabase: ReturnType<typeof createClient>,
  authUserId: string,
  phone: string,
): Promise<void> {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('phone', phone)
    .single();

  if (existing) {
    if (existing.id !== authUserId) {
      await supabase.from('users').update({ id: authUserId }).eq('id', existing.id);
    }
    return;
  }

  await supabase.from('users').insert({
    id: authUserId,
    phone,
    created_at: new Date().toISOString(),
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, code } = await req.json();

    if (!phone) {
      return json({ error: 'Phone is required' }, 400);
    }

    const normalizedPhone = normalizePhone(phone);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ── Demo mode ────────────────────────────────────────────
    if (normalizedPhone === DEMO_PHONE) {
      if (code && code.trim() !== DEMO_OTP) {
        return json({ verified: false, error: 'קוד שגוי.' }, 400);
      }
      if (!code) {
        return json({ verified: false, pending: true });
      }

      const result = await findOrCreateAuthUser(supabase, normalizedPhone);
      if (!result.userId) return json({ verified: true, userId: `demo-${Date.now()}` });
      await syncPublicUser(supabase, result.userId, normalizedPhone);
      const token = await generateSessionToken(supabase, syntheticEmail(normalizedPhone));
      return json({ verified: true, userId: result.userId, access_token: token, token_type: token ? 'magiclink' : null });
    }

    // ── Check if OTP was verified via WhatsApp webhook ───────
    const now = new Date().toISOString();

    // If code is provided, do manual verification (fallback)
    if (code) {
      const { data: otpRecord } = await supabase
        .from('otp_codes')
        .select('id, code, failed_attempts')
        .eq('phone', normalizedPhone)
        .eq('used', false)
        .gte('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!otpRecord || otpRecord.code !== code.trim()) {
        if (otpRecord) {
          await supabase
            .from('otp_codes')
            .update({ failed_attempts: (otpRecord.failed_attempts || 0) + 1 })
            .eq('id', otpRecord.id);
        }
        return json({ verified: false, error: 'קוד שגוי או שפג תוקפו.' }, 400);
      }

      // Mark as used
      await supabase.from('otp_codes').update({ used: true }).eq('id', otpRecord.id);
    } else {
      // Poll mode: check if webhook already verified an OTP for this phone
      const { data: verifiedRecord } = await supabase
        .from('otp_codes')
        .select('id')
        .eq('phone', normalizedPhone)
        .eq('used', true)
        .eq('wa_verified', true)
        .gte('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!verifiedRecord) {
        return json({ verified: false, pending: true });
      }
    }

    // ── OTP verified — create auth session ───────────────────
    const result = await findOrCreateAuthUser(supabase, normalizedPhone);

    if (!result.userId) {
      const { data: fallbackUser } = await supabase
        .from('users')
        .upsert({ phone: normalizedPhone, created_at: new Date().toISOString() }, { onConflict: 'phone' })
        .select('id')
        .single();

      return json({
        verified: true,
        userId: fallbackUser?.id || `temp-${Date.now()}`,
        access_token: null,
        token_type: null,
      });
    }

    await syncPublicUser(supabase, result.userId, normalizedPhone);
    const token = await generateSessionToken(supabase, syntheticEmail(normalizedPhone));

    // Check if user already has a name (returning user)
    const { data: existingUser } = await supabase
      .from('users')
      .select('name, birthday')
      .eq('phone', normalizedPhone)
      .single();

    const userName = existingUser?.name || null;
    const userBirthday = existingUser?.birthday || null;

    console.log('OTP verified for', normalizedPhone, 'userId:', result.userId, 'existing:', !!userName);

    return json({
      verified: true,
      userId: result.userId,
      access_token: token,
      token_type: token ? 'magiclink' : null,
      existingUser: userName ? { name: userName, birthday: userBirthday } : null,
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
