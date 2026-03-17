import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// NOTE: Supabase Auth uses AsyncStorage (not SecureStore) because:
// 1. expo-secure-store has a 2048-byte value limit — JWT tokens can exceed this
// 2. Supabase Auth expects a web-compatible storage interface
// secureStorage is used separately for Zustand stores (user PII, voucher data)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
