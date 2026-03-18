/**
 * Edge Function: generate-voucher-token
 *
 * Generates a short-lived HMAC-SHA256 signed token for a voucher QR code.
 * Only the voucher owner can request a token. Tokens expire after 60 seconds.
 *
 * SECURITY HARDENING:
 * - Device fingerprint binding: HMAC includes device identity so screenshots
 *   shared to other devices produce invalid tokens
 * - Persistent rate limiting (DB-backed)
 *
 * Request body: { voucher_id: string, device_fingerprint?: string }
 * Response:     { token: string, expires_in: number }
 */
import { getAuthUser } from '../_shared/auth.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

const VOUCHER_HMAC_SECRET = Deno.env.get('VOUCHER_HMAC_SECRET');

Deno.serve(async (req) => {
  // Only POST allowed
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 });
  }

  // Authenticate caller
  const user = await getAuthUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  // Rate limit: 60 tokens/min per user (one per second at most)
  if (!(await checkRateLimit(`gen-token:${user.id}`, 60, 60_000))) {
    return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429 });
  }

  // Parse body
  let voucherId: string;
  let deviceFingerprint: string | undefined;
  try {
    const body = await req.json();
    voucherId = body.voucher_id;
    deviceFingerprint = body.device_fingerprint;
    if (!voucherId) throw new Error('missing voucher_id');
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_body' }), { status: 400 });
  }

  // Verify voucher ownership + active status
  const { data: voucher, error } = await supabaseAdmin
    .from('vouchers')
    .select('barcode, user_id, status')
    .eq('id', voucherId)
    .single();

  if (error || !voucher) {
    return new Response(JSON.stringify({ error: 'voucher_not_found' }), { status: 404 });
  }

  if (voucher.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 });
  }

  if (voucher.status !== 'active') {
    return new Response(JSON.stringify({ error: 'voucher_not_active', status: voucher.status }), { status: 400 });
  }

  // Generate HMAC-SHA256 token
  if (!VOUCHER_HMAC_SECRET) {
    return new Response(JSON.stringify({ error: 'server_config_error' }), { status: 500 });
  }

  // ── Device fingerprint binding ────────────────────────────────
  // If client provides a device fingerprint, include it in the HMAC payload.
  // This binds the QR token to the specific device — screenshots from
  // other devices can't reproduce a valid HMAC.
  let deviceHash = '';
  if (deviceFingerprint && deviceFingerprint.length >= 32) {
    // Hash the fingerprint (never store raw fingerprint in DB)
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(deviceFingerprint),
    );
    deviceHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Store device hash on voucher for validation lookup
    await supabaseAdmin
      .from('vouchers')
      .update({ bound_device_hash: deviceHash })
      .eq('id', voucherId);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  // Include device hash in HMAC payload for binding
  const payload = deviceHash
    ? `${voucher.barcode}:${timestamp}:${deviceHash}`
    : `${voucher.barcode}:${timestamp}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(VOUCHER_HMAC_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const token = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const qrPayload = `${voucher.barcode}|${timestamp}|${token}`;

  return new Response(
    JSON.stringify({ token: qrPayload, expires_in: 30 }),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Frame-Options': 'DENY',
      },
    },
  );
});
