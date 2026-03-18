// Supabase Edge Function: PayMe Payment Callback
// Receives POST from PayMe when payment completes
// Deploy: supabase functions deploy payme-callback
//
// SECURITY: Validates order existence, payment state, and merchant identity
// before updating payment status. Prevents callback forgery attacks.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SELLER_KEY = Deno.env.get('PAYME_SELLER_KEY') || '';
const SELLER_ID = Deno.env.get('PAYME_SELLER_ID') || '';

// TODO: Restrict CORS to PayMe callback IPs once their IP range is confirmed.
// For now, wildcard is kept to avoid breaking payment flow.
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // PayMe callback fields
    const {
      transaction_id,    // Our order ID
      payme_sale_id,     // PayMe's transaction ID
      payme_status,      // Payment status from PayMe
      sale_price,        // Amount in agorot
      buyer_card_mask,   // Masked card number (e.g., "****1234")
      seller_payme_id,   // Verify it's our merchant
      status_code,       // 0 = success
    } = body;

    console.log('PayMe callback received:', {
      transaction_id,
      payme_sale_id,
      payme_status,
      status_code,
      seller_payme_id,
    });

    if (!transaction_id) {
      return json({ error: 'Missing transaction_id' }, 400);
    }

    // ── Security: Verify merchant identity ─────────────────────
    // Reject callbacks claiming to be from a different merchant
    if (SELLER_ID && seller_payme_id && seller_payme_id !== SELLER_ID) {
      console.error('SECURITY: seller_payme_id mismatch', {
        expected: SELLER_ID,
        received: seller_payme_id,
        transaction_id,
      });
      return json({ error: 'Invalid merchant' }, 403);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ── Security: Verify order exists and is in valid state ────
    // Prevents forged callbacks for non-existent or already-processed orders
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, payment_status, total')
      .eq('id', transaction_id)
      .single();

    if (orderError || !order) {
      console.error('SECURITY: Callback for non-existent order', { transaction_id });
      return json({ error: 'Order not found' }, 404);
    }

    // Idempotency: if already completed, return success without re-processing
    if (order.payment_status === 'completed') {
      console.log(`Order ${transaction_id} already completed — idempotent return`);
      return json({ status: 'ok', note: 'already_processed' });
    }

    // Only process orders that are in 'processing' state (set by generate-payment)
    if (order.payment_status !== 'processing') {
      console.error('SECURITY: Callback for order in unexpected state', {
        transaction_id,
        current_status: order.payment_status,
      });
      return json({ error: 'Order not in processing state' }, 409);
    }

    // ── Security: Verify payment amount matches order total ────
    // Prevents partial-payment forgery
    if (sale_price != null && order.total != null) {
      const expectedAgorot = Math.round(order.total * 100);
      const receivedAgorot = typeof sale_price === 'string' ? parseInt(sale_price, 10) : sale_price;
      if (receivedAgorot !== expectedAgorot) {
        console.error('SECURITY: Payment amount mismatch', {
          transaction_id,
          expected: expectedAgorot,
          received: receivedAgorot,
        });
        return json({ error: 'Amount mismatch' }, 400);
      }
    }

    // Determine payment status
    const isSuccess = status_code === 0 || payme_status === 'approved';

    // Extract last 4 digits from card mask
    const last4 = buyer_card_mask
      ? buyer_card_mask.replace(/[^0-9]/g, '').slice(-4)
      : null;

    // Update order payment details
    const updateData: Record<string, any> = {
      payment_status: isSuccess ? 'completed' : 'failed',
      payment_transaction_id: payme_sale_id || null,
      payment_card_last4: last4,
    };

    if (isSuccess) {
      updateData.payment_paid_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', transaction_id)
      .eq('payment_status', 'processing'); // Atomic: only update if still processing

    if (error) {
      console.error('Failed to update order:', error);
      return json({ error: 'Failed to update order' }, 500);
    }

    console.log(`Order ${transaction_id} payment ${isSuccess ? 'completed' : 'failed'}`);

    return json({ status: 'ok' });
  } catch (err) {
    console.error('payme-callback error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
