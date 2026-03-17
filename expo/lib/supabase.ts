import { createClient } from '@supabase/supabase-js';
import { secureStorage } from '@/lib/secureStorage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// SECURITY: Auth tokens stored in iOS Keychain / Android Keystore via secureStorage
// (previously AsyncStorage — plaintext on device)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
