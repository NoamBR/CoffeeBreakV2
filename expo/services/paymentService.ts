/**
 * Payment Service — Isracard via PayMe Integration
 *
 * Flow for credit card payments:
 * 1. App calls initiateCardPayment() → hits Supabase Edge Function
 * 2. Edge Function calls PayMe "generate-sale" API → returns hosted payment URL
 * 3. App opens URL in WebView (payment-webview.tsx)
 * 4. Customer enters card details on PayMe's PCI-compliant page
 * 5. PayMe redirects back → app detects result → navigates to order-success
 * 6. PayMe sends server callback → Edge Function updates order in DB
 */

import { PaymentMethod, PaymentInfo } from '@/types';
import { PAYME_CONFIG } from '@/constants/payment';
import { supabase } from '@/lib/supabase';

export { PAYMENT_METHODS } from '@/constants/payment';

export type PaymentRequest = {
  amount: number;
  orderId: string;
  customerName: string;
  customerPhone: string;
  method: PaymentMethod;
};

export type PaymentResult = {
  success: boolean;
  payment: PaymentInfo;
  paymentUrl?: string; // for WebView-based payments
  error?: string;
};

// ─── Main entry point ─────────────────────────────────────
export async function processPayment(request: PaymentRequest): Promise<PaymentResult> {
  switch (request.method) {
    case 'at_register':
      return processAtRegister(request);
    case 'credit_card':
      return initiateCardPayment(request);
    case 'bit':
    case 'apple_pay':
    case 'google_pay':
      return {
        success: false,
        payment: { method: request.method, status: 'failed', amount: request.amount },
        error: 'שיטת תשלום זו תהיה זמינה בקרוב',
      };
    default:
      return {
        success: false,
        payment: { method: request.method, status: 'failed', amount: request.amount },
        error: 'שיטת תשלום לא נתמכת',
      };
  }
}

// ─── Pay at register (no processing needed) ───────────────
async function processAtRegister(request: PaymentRequest): Promise<PaymentResult> {
  return {
    success: true,
    payment: {
      method: 'at_register',
      status: 'pending',
      amount: request.amount,
    },
  };
}

// ─── Credit card via Isracard/PayMe ───────────────────────
export async function initiateCardPayment(request: PaymentRequest): Promise<PaymentResult> {
  try {
    // Call Supabase Edge Function to generate PayMe payment URL
    const { data, error } = await supabase.functions.invoke('generate-payment', {
      body: {
        orderId: request.orderId,
        amount: Math.round(request.amount * 100), // convert to agorot
        customerName: request.customerName,
        customerPhone: request.customerPhone,
        productName: `הזמנה ${request.orderId}`,
      },
    });

    if (error || !data?.paymentUrl) {
      console.error('[paymentService] generate-payment failed:', error || 'no paymentUrl');
      return {
        success: false,
        payment: { method: 'credit_card', status: 'failed', amount: request.amount },
        error: data?.error || 'שגיאה ביצירת עמוד תשלום. נסו שוב.',
      };
    }

    return {
      success: true,
      paymentUrl: data.paymentUrl,
      payment: {
        method: 'credit_card',
        status: 'processing',
        amount: request.amount,
      },
    };
  } catch (err) {
    console.error('[paymentService] initiateCardPayment error:', err);
    return {
      success: false,
      payment: { method: 'credit_card', status: 'failed', amount: request.amount },
      error: 'שגיאה בהתחברות לשרת התשלומים. בדקו חיבור אינטרנט.',
    };
  }
}

// ─── Verify payment status (after WebView redirect) ───────
export async function verifyPayment(orderId: string): Promise<PaymentInfo | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('payment_method, payment_status, payment_transaction_id, payment_card_last4, payment_paid_at, total')
      .eq('id', orderId)
      .single();

    if (error || !data) return null;

    return {
      method: (data.payment_method || 'at_register') as PaymentMethod,
      status: data.payment_status === 'completed' ? 'completed' : 'pending',
      transactionId: data.payment_transaction_id || undefined,
      last4: data.payment_card_last4 || undefined,
      paidAt: data.payment_paid_at || undefined,
      amount: data.total || 0,
    };
  } catch {
    return null;
  }
}
