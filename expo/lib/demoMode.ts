// Demo mode for App Store / Play Store review accounts.
// The reviewer uses a special phone number that bypasses WhatsApp OTP delivery.
// The backend recognizes this number and accepts a fixed OTP code.

export const DEMO_PHONE = '+972500000000';
export const DEMO_PHONE_NORMALIZED = '972500000000';
export const DEMO_OTP = '123456';

export function isDemoPhone(phone: string): boolean {
  const normalized = phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
  return normalized === DEMO_PHONE_NORMALIZED;
}
