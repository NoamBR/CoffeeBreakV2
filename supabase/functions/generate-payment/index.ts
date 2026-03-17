// Supabase Edge Function: Generate PayMe Hosted Payment Page URL
// Deploy: supabase functions deploy generate-payment
// Secrets: PAYME_SELLER_ID, PAYME_SELLER_KEY, PAYME_ENV (sandbox|production)
//
// SECURITY: Validates user authentication, order ownership, amount integrity,
// and payment state before generating a payment URL.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PAYME_ENV = Deno.env.get('PAYME_ENV') || 'sandbox';
const PAYME_API_URL = PAYME_ENV === 'production'
  ? 'https://ng.payme.io/api/generate-sale'
  : 'https://sandbox.payme.io/api/generate-sale';

const SELLER_ID = Deno.env.get('PAYME_SELLER_ID') || '';
const SELLER_KEY = Deno.env.get('PAYME_SELLER_KEY') || '';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Security: Authenticate the caller ───────────────────────
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || SUPABASE_SERVICE_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authError } = await anonClient.auth.getUser();
      if (!authError && user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return json({ error: 'Unauthorized — authentication required' }, 401);
    }

    const { orderId, amount, customerName, customerPhone, productName } = await req.json();

    if (!orderId || !amount) {
      return json({ error: 'orderId and amount are required' }, 400);
    }

    if (!SELLER_ID || !SELLER_KEY) {
      return json({ error: 'Payment provider not configured. Contact support.' }, 500);
    }

    // ── Security: Verify order exists, belongs to user, and amount matches ──
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, total, payment_status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return json({ error: 'Order not found' }, 404);
    }

    // Verify the authenticated user owns this order
    if (order.user_id !== userId) {
      console.error('SECURITY: User attempted to pay for another user\'s order', {
        userId,
        orderId,
        orderUserId: order.user_id,
      });
      return json({ error: 'Forbidden — order does not belong to you' }, 403);
    }

    // Verify amount matches order total (both in agorot)
    const expectedAgorot = Math.round(order.total * 100);
    if (amount !== expectedAgorot) {
      console.error('SECURITY: Payment amount mismatch', {
        orderId,
        expected: expectedAgorot,
        received: amount,
      });
      return json({ error: 'Amount does not match order total' }, 400);
    }

    // Prevent double payment
    if (order.payment_status === 'completed') {
      return json({ error: 'Order already paid' }, 400);
    }

    // Build callback URL (this Edge Function's sibling)
    const callbackUrl = `${SUPABASE_URL}/functions/v1/payme-callback`;

    // Call PayMe Generate Sale API
    const paymeResponse = await fetch(PAYME_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seller_payme_id: SELLER_ID,
        seller_payme_key: SELLER_KEY,
        sale_price: amount, // in agorot
        currency: 'ILS',
        product_name: productName || `Order ${orderId}`,
        transaction_id: orderId,
        installments: '1-3',
        language: 'he',
        capture_buyer: 1,
        buyer_name: customerName || '',
        buyer_phone: customerPhone || '',
        sale_callback_url: callbackUrl,
        sale_return_url: `rork-app://payment-result?status=success&order_id=${orderId}`,
        sale_failure_url: `rork-app://payment-result?status=failed&order_id=${orderId}`,
      }),
    });

    const paymeData = await paymeResponse.json();

    if (paymeData.status_code !== 0 || !paymeData.sale_url) {
      console.error('PayMe error:', paymeData);
      return json({
        error: 'שגיאה ביצירת עמוד תשלום',
        details: paymeData.status_error_details || paymeData.status_error_code,
      }, 400);
    }

    // Update order in DB with pending payment status
    await supabase
      .from('orders')
      .update({
        payment_method: 'credit_card',
        payment_status: 'processing',
      })
      .eq('id', orderId);

    return json({ paymentUrl: paymeData.sale_url });
  } catch (err) {
    console.error('generate-payment error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});
