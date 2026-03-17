import { create } from 'zustand';
import * as staffAuthService from '@/services/staffAuthService';

export type StaffRole = 'manager' | 'worker';

type AdminState = {
  isManagerAuthenticated: boolean;
  isWorkerAuthenticated: boolean;
  currentRole: StaffRole | null;
  staffUserId: string | null;
  staffEmail: string | null;
  isLoading: boolean;
  loginError: string | null;

  // Auth actions — server-verified via Supabase Auth
  authenticateStaff: (email: string, password: string) => Promise<boolean>;
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;

  // Legacy PIN-based auth (deprecated — will be removed)
  // Kept temporarily for backward compat during migration
  authenticateManager: (pin: string) => boolean;
  authenticateWorker: (pin: string) => boolean;
};

export const useAdminStore = create<AdminState>()((set, get) => ({
  isManagerAuthenticated: false,
  isWorkerAuthenticated: false,
  currentRole: null,
  staffUserId: null,
  staffEmail: null,
  isLoading: false,
  loginError: null,

  authenticateStaff: async (email, password) => {
    set({ isLoading: true, loginError: null });
    try {
      const session = await staffAuthService.staffLogin(email, password);
      set({
        isManagerAuthenticated: session.role === 'manager',
        isWorkerAuthenticated: session.role === 'worker',
        currentRole: session.role,
        staffUserId: session.userId,
        staffEmail: session.email,
        isLoading: false,
      });
      return true;
    } catch (err) {
      set({
        isLoading: false,
        loginError: err instanceof Error ? err.message : 'שגיאת התחברות',
      });
      return false;
    }
  },

  restoreSession: async () => {
    try {
      const session = await staffAuthService.getCurrentStaffSession();
      if (session) {
        set({
          isManagerAuthenticated: session.role === 'manager',
          isWorkerAuthenticated: session.role === 'worker',
          currentRole: session.role,
          staffUserId: session.userId,
          staffEmail: session.email,
        });
      }
    } catch {
      // Session expired or invalid — stay logged out
    }
  },

  logout: async () => {
    await staffAuthService.staffLogout();
    set({
      isManagerAuthenticated: false,
      isWorkerAuthenticated: false,
      currentRole: null,
      staffUserId: null,
      staffEmail: null,
      loginError: null,
    });
  },

  // ─── Legacy PIN auth (deprecated) ─────────────────────────────
  // These exist only for backward compatibility during the migration.
  // They do NOT provide server-side verification and should be removed
  // once all staff are onboarded to Supabase Auth.
  authenticateManager: (_pin) => {
    console.warn('[SECURITY] PIN-based auth is deprecated. Use authenticateStaff() with email/password.');
    return false; // Disabled — always fails
  },
  authenticateWorker: (_pin) => {
    console.warn('[SECURITY] PIN-based auth is deprecated. Use authenticateStaff() with email/password.');
    return false; // Disabled — always fails
  },
}));
