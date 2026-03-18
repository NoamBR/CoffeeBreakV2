import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '@/lib/secureStorage';

type ThemePreference = 'light' | 'dark';

interface ThemeState {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'light',
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: 'coffeebreak-theme',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
