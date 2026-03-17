import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

/**
 * Extract and verify the authenticated user from the request's Authorization header.
 * Returns the user object or null if unauthenticated.
 */
export async function getAuthUser(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Extract the staff role from app_metadata (not user_metadata — cannot be set client-side).
 */
export function getStaffRole(user: { app_metadata?: Record<string, unknown> }): string | null {
  const role = user.app_metadata?.role;
  if (typeof role === 'string' && ['manager', 'worker'].includes(role)) return role;
  return null;
}
