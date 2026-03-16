import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeeklyHours } from '@/types';

type ScratchOdds = {
  bonus_stamp: number;
  discount_10: number;
  free_upgrade: number;
  free_pastry: number;
};

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
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  resetToDefaults: () => void;
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
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      updateSetting: (key, value) => set({ [key]: value } as Partial<SettingsState>),

      resetToDefaults: () => set(DEFAULTS),
    }),
    {
      name: 'coffeebreak-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
