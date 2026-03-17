/**
 * Staff Authentication Service
 *
 * Staff authenticate via Supabase Auth (email/password).
 * Roles are stored in `app_metadata.role` (only settable via service role key).
 * This prevents clients from self-assigning staff roles.
 */

import { supabase } from '@/lib/supabase';
import type { StaffRole } from '@/stores/adminStore';

export type StaffSession = {
  userId: string;
  email: string;
  role: StaffRole;
};

/**
 * Authenticate a staff member via Supabase Auth.
 * Verifies that the user has a valid staff role in `app_metadata`.
 */
export async function staffLogin(email: string, password: string): Promise<StaffSession> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes('Invalid login')) {
      throw new Error('אימייל או סיסמה שגויים');
    }
    throw new Error(`שגיאת התחברות: ${error.message}`);
  }

  const role = data.user.app_metadata?.role as string | undefined;
  if (!role || !['manager', 'worker'].includes(role)) {
    // Sign out immediately — this user is not staff
    await supabase.auth.signOut();
    throw new Error('משתמש זה אינו מורשה כצוות');
  }

  return {
    userId: data.user.id,
    email: data.user.email ?? email,
    role: role as StaffRole,
  };
}

/**
 * Sign out the current staff session.
 */
export async function staffLogout(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Get the current staff session if authenticated.
 */
export async function getCurrentStaffSession(): Promise<StaffSession | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const role = user.app_metadata?.role as string | undefined;
  if (!role || !['manager', 'worker'].includes(role)) return null;

  return {
    userId: user.id,
    email: user.email ?? '',
    role: role as StaffRole,
  };
}
