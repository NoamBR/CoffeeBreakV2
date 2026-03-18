/**
 * Edge Function: grant-stamp
 *
 * Awards a loyalty stamp to a customer, linked to a verified paid order.
 * Prevents ghost stamps (stamps without real purchases) and double-stamping.
 *
 * Called by staff after confirming a customer's order is complete.
 *
 * Request body: { user_id: string, order_id: number }
 * Response:     { success: boolean, stamps_count?: number, reward_earned?: boolean, scratch_awarded?: boolean }
 */
import { getAuthUser, getStaffRole } from '../_shared/auth.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

const SECURITY_HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  // 1. Authenticate caller — must be staff
  const user = await getAuthUser(req);
  if (!user) {
    return json({ error: 'unauthorized' }, 401);
  }

  const role = getStaffRole(user);
  if (!role) {
    return json({ error: 'forbidden', message: 'Staff role required' }, 403);
  }

  // 2. Rate limit: 60 stamps/min per staff member
  if (!(await checkRateLimit(`grant-stamp:${user.id}`, 60, 60_000))) {
    return json({ error: 'rate_limited' }, 429);
  }

  // 3. Parse request body
  let userId: string;
  let orderId: number;
  try {
    const body = await req.json();
    userId = body.user_id;
    orderId = body.order_id;
    if (!userId || !orderId) throw new Error('missing fields');
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }

  // 4. Call server-side grant_stamp function (validates order ownership, payment, deduplication)
  const { data, error } = await supabaseAdmin.rpc('grant_stamp', {
    p_user_id: userId,
    p_order_id: orderId,
    p_staff_id: user.id,
  });

  if (error) {
    console.error('[grant-stamp] RPC error:', error.message);
    return json({ error: 'db_error' }, 500);
  }

  if (!data?.success) {
    return json({
      success: false,
      reason: data?.reason ?? 'unknown_error',
    }, 400);
  }

  // 5. If scratch card awarded, create it server-side
  if (data.scratch_awarded) {
    const { error: scratchErr } = await supabaseAdmin.rpc('create_scratch_card', {
      p_user_id: userId,
    });
    if (scratchErr) {
      console.error('[grant-stamp] scratch card creation failed:', scratchErr.message);
      // Non-blocking — stamp was already granted successfully
    }
  }

  // 6. Audit log
  supabaseAdmin.from('voucher_access_log').insert({
    staff_id: user.id,
    barcode: `order:${orderId}`,
    action: 'stamp',
  }).then(() => {}, () => {}); // Fire-and-forget

  return json(data);
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: SECURITY_HEADERS,
  });
}
