import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '@/lib/secureStorage';
import { WeeklyHours } from '@/types';

type ScratchOdds = {
  bonus_stamp: number;
  discount_10: number;
  free_upgrade: number;
  free_pastry: number;
};

const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCKOUT_MINUTES = 15;

type SettingsState = {
  staffPin: string;
  stampsGoal: number;
  tierThresholds: { silver: number; gold: number };
  tierDiscounts: { bronze: number; silver: number; gold: number };
  scratchOdds: ScratchOdds;
  streakBonusDay: number;
  storeHoursOverride: WeeklyHours | null;
  storePhone: string;
  storeAddress: string;
  storeInstagram: string;
  storeFacebook: string;
  // PIN brute-force protection
  pinFailedAttempts: number;
  pinLockedUntil: string | null; // ISO timestamp
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  resetToDefaults: () => void;
  // PIN verification with lockout
  verifyPin: (pin: string) => { success: boolean; locked: boolean; remainingAttempts: number; lockoutSeconds: number };
  resetPinLockout: () => void;
};

const DEFAULTS = {
  staffPin: '1234',
  stampsGoal: 5,
  tierThresholds: { silver: 20, gold: 50 },
  tierDiscounts: { bronze: 0, silver: 5, gold: 10 },
  scratchOdds: { bonus_stamp: 0.4, discount_10: 0.3, free_upgrade: 0.2, free_pastry: 0.1 },
  streakBonusDay: 7,
  storeHoursOverride: null as WeeklyHours | null,
  storePhone: '',
  storeAddress: '',
  storeInstagram: '',
  storeFacebook: '',
  pinFailedAttempts: 0,
  pinLockedUntil: null as string | null,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,

      updateSetting: (key, value) => set({ [key]: value } as Partial<SettingsState>),

      resetToDefaults: () => set(DEFAULTS),

      verifyPin: (pin: string) => {
        const state = get();
        const now = Date.now();

        // Check if locked out
        if (state.pinLockedUntil) {
          const lockEnd = new Date(state.pinLockedUntil).getTime();
          if (now < lockEnd) {
            const lockoutSeconds = Math.ceil((lockEnd - now) / 1000);
            return { success: false, locked: true, remainingAttempts: 0, lockoutSeconds };
          }
          // Lockout expired — reset
          set({ pinFailedAttempts: 0, pinLockedUntil: null });
        }

        // Verify PIN
        if (pin === state.staffPin) {
          set({ pinFailedAttempts: 0, pinLockedUntil: null });
          return { success: true, locked: false, remainingAttempts: PIN_MAX_ATTEMPTS, lockoutSeconds: 0 };
        }

        // Wrong PIN
        const newAttempts = (state.pinFailedAttempts || 0) + 1;

        if (newAttempts >= PIN_MAX_ATTEMPTS) {
          const lockUntil = new Date(now + PIN_LOCKOUT_MINUTES * 60 * 1000).toISOString();
          set({ pinFailedAttempts: newAttempts, pinLockedUntil: lockUntil });
          return { success: false, locked: true, remainingAttempts: 0, lockoutSeconds: PIN_LOCKOUT_MINUTES * 60 };
        }

        set({ pinFailedAttempts: newAttempts });
        return { success: false, locked: false, remainingAttempts: PIN_MAX_ATTEMPTS - newAttempts, lockoutSeconds: 0 };
      },

      resetPinLockout: () => set({ pinFailedAttempts: 0, pinLockedUntil: null }),
    }),
    {
      name: 'coffeebreak-settings',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
