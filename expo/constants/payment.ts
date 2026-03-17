import { PaymentMethod } from '@/types';

export type PaymentMethodConfig = {
  key: PaymentMethod;
  label: string;
  icon: string;
  enabled: boolean;
};

// Toggle credit_card to true once you have PayMe credentials
export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  { key: 'at_register', label: 'תשלום בקופה', icon: 'store', enabled: true },
  { key: 'credit_card', label: 'כרטיס אשראי', icon: 'credit-card', enabled: true },
  { key: 'bit', label: 'Bit', icon: 'smartphone', enabled: false },
  { key: 'apple_pay', label: 'Apple Pay', icon: 'apple', enabled: false },
  { key: 'google_pay', label: 'Google Pay', icon: 'wallet', enabled: false },
];

// PayMe environment config
const PAYME_ENV = process.env.EXPO_PUBLIC_PAYME_ENV || 'sandbox';

export const PAYME_CONFIG = {
  env: PAYME_ENV as 'sandbox' | 'production',
  sellerId: process.env.EXPO_PUBLIC_PAYME_SELLER_ID || '',
  // API base URLs
  apiUrl: PAYME_ENV === 'production'
    ? 'https://ng.payme.io/api'
    : 'https://sandbox.payme.io/api',
  // Hosted payment page base
  hppUrl: PAYME_ENV === 'production'
    ? 'https://ng.payme.io'
    : 'https://sandbox.payme.io',
  // Allowed WebView origins
  allowedOrigins: [
    'https://ng.payme.io',
    'https://sandbox.payme.io',
    'https://secure.payme.io',
  ],
  // Deep link return URLs
  returnUrl: 'rork-app://payment-result?status=success',
  failureUrl: 'rork-app://payment-result?status=failed',
  // Currency
  currency: 'ILS',
  // Default installments range (1 = no installments)
  installments: '1-3',
  // Language
  language: 'he',
};
