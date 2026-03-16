import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';

type UserState = {
  user: User | null;
  isOnboarded: boolean;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  completeOnboarding: (name: string, phone: string, birthday?: string) => void;
  incrementCoffees: () => void;
  reset: () => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isOnboarded: false,

      setUser: (user) => set({ user }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      completeOnboarding: (name, phone, birthday) =>
        set({
          isOnboarded: true,
          user: {
            id: Date.now().toString(),
            name,
            phone,
            birthday,
            joinedAt: new Date().toISOString(),
            totalCoffees: 0,
          },
        }),

      incrementCoffees: () =>
        set((state) => ({
          user: state.user
            ? { ...state.user, totalCoffees: state.user.totalCoffees + 1 }
            : null,
        })),

      reset: () => set({ user: null, isOnboarded: false }),
    }),
    {
      name: 'coffeebreak-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
