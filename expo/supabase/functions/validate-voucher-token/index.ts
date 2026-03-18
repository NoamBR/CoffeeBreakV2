/**
 * Edge Function: validate-voucher-token
 *
 * Staff scans a QR code → this function verifies the HMAC token,
 * checks expiry, enforces single-use per token, and returns voucher details.
 *
 * SECURITY HARDENING:
 * - Constant-time HMAC verification (prevents timing attacks)
 * - Token deduplication (prevents QR screenshot replay)
 * - Tightened expiry window (65s vs previous 90s)
 *
 * Request body: { qr_payload: string }
 * Response:     { valid: boolean, error?: string, voucher?: object }
 */
import { getAuthUser, getStaffRole } from '../_shared/auth.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

const VOUCHER_HMAC_SECRET = Deno.env.get('VOUCHER_HMAC_SECRET');
const TOKEN_MAX_AGE_SECONDS = 35; // 5s grace over 30s generation window (tightened from 65s)

/** Convert hex string to Uint8Array for constant-time comparison */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  // Authenticate caller — must be staff
  const user = await getAuthUser(req);
  if (!user) {
    return json({ error: 'unauthorized' }, 401);
  }

  const role = getStaffRole(user);
  if (!role) {
    return json({ error: 'forbidden', message: 'Staff role required' }, 403);
  }

  // Rate limit: 30 validations/min per staff member
  if (!(await checkRateLimit(`validate-token:${user.id}`, 30, 60_000))) {
    return json({ error: 'rate_limited' }, 429);
  }

  // Parse body
  let qrPayload: string;
  try {
    const body = await req.json();
    qrPayload = body.qr_payload;
    if (!qrPayload) throw new Error('missing qr_payload');
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }

  // Parse QR payload: barcode|timestamp|hmac
  const parts = qrPayload.split('|');
  if (parts.length !== 3) {
    return json({ valid: false, error: 'invalid_format' });
  }

  const [barcode, timestampStr, clientToken] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return json({ valid: false, error: 'invalid_format' });
  }

  // Check token age (tightened to 65s)
  const now = Math.floor(Date.now() / 1000);
  if (now - timestamp > TOKEN_MAX_AGE_SECONDS) {
    return json({ valid: false, error: 'expired' });
  }

  // Verify HMAC using constant-time comparison
  if (!VOUCHER_HMAC_SECRET) {
    return json({ error: 'server_config_error' }, 500);
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(VOUCHER_HMAC_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );

  // Look up device binding for this voucher (if it was generated with device fingerprint)
  const { data: voucherMeta } = await supabaseAdmin
    .from('vouchers')
    .select('bound_device_hash')
    .eq('barcode', barcode.toUpperCase())
    .single();

  const deviceHash = voucherMeta?.bound_device_hash || '';

  // Construct HMAC payload matching how it was generated:
  // With device binding: barcode:timestamp:device_hash
  // Without (legacy):    barcode:timestamp
  const payload = deviceHash
    ? `${barcode}:${timestamp}:${deviceHash}`
    : `${barcode}:${timestamp}`;

  // Constant-time verification: crypto.subtle.verify handles timing-safe comparison internally
  let clientSignature: Uint8Array;
  try {
    clientSignature = hexToBytes(clientToken);
    if (clientSignature.length !== 32) {
      return json({ valid: false, error: 'invalid_token' });
    }
  } catch {
    return json({ valid: false, error: 'invalid_token' });
  }

  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    clientSignature,
    encoder.encode(payload),
  );

  if (!isValid) {
    return json({ valid: false, error: 'invalid_token' });
  }

  // ── Anti-replay: Token deduplication ────────────────────────
  // Each timestamp can only be validated once per voucher.
  // Prevents QR screenshot sharing within the validity window.
  const { data: deduped, error: dedupError } = await supabaseAdmin
    .from('vouchers')
    .update({ last_token_timestamp: timestamp })
    .eq('barcode', barcode.toUpperCase())
    .lt('last_token_timestamp', timestamp)
    .select('barcode')
    .single();

  if (dedupError || !deduped) {
    // Either voucher not found or this token was already used
    // Check if it's a "not found" vs "already used" case
    const { data: exists } = await supabaseAdmin
      .from('vouchers')
      .select('barcode, last_token_timestamp')
      .eq('barcode', barcode.toUpperCase())
      .single();

    if (!exists) {
      return json({ valid: false, error: 'not_found' });
    }
    // Token timestamp already consumed — replay attempt
    return json({ valid: false, error: 'token_already_used' });
  }

  // Token is valid and fresh — now validate the voucher status
  const { data, error } = await supabaseAdmin.rpc('validate_voucher', {
    p_barcode: barcode,
  });

  if (error) {
    return json({ error: 'db_error' }, 500);
  }

  // Log staff access for audit
  await supabaseAdmin.from('voucher_access_log').insert({
    staff_id: user.id,
    barcode,
    action: 'validate',
  }).then(() => {}, () => {}); // Fire-and-forget

  return json(data);
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Frame-Options': 'DENY',
    },
  });
}
