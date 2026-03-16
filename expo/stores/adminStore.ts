import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type StaffRole = 'manager' | 'worker';

type AdminState = {
  isManagerAuthenticated: boolean;
  isWorkerAuthenticated: boolean;
  currentRole: StaffRole | null;
  managerPin: string;
  workerPin: string;
  authenticateManager: (pin: string) => boolean;
  authenticateWorker: (pin: string) => boolean;
  logout: () => void;
  updateManagerPin: (newPin: string) => void;
  updateWorkerPin: (newPin: string) => void;
};

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      isManagerAuthenticated: false,
      isWorkerAuthenticated: false,
      currentRole: null,
      managerPin: '9876',
      workerPin: '1111',

      authenticateManager: (pin) => {
        if (pin === get().managerPin) {
          set({ isManagerAuthenticated: true, currentRole: 'manager' });
          return true;
        }
        return false;
      },

      authenticateWorker: (pin) => {
        if (pin === get().workerPin) {
          set({ isWorkerAuthenticated: true, currentRole: 'worker' });
          return true;
        }
        return false;
      },

      logout: () => set({ isManagerAuthenticated: false, isWorkerAuthenticated: false, currentRole: null }),

      updateManagerPin: (newPin) => set({ managerPin: newPin }),
      updateWorkerPin: (newPin) => set({ workerPin: newPin }),
    }),
    {
      name: 'coffeebreak-admin',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist auth state + PINs so manager stays logged in
      partialize: (state) => ({
        managerPin: state.managerPin,
        workerPin: state.workerPin,
        isManagerAuthenticated: state.isManagerAuthenticated,
        isWorkerAuthenticated: state.isWorkerAuthenticated,
        currentRole: state.currentRole,
      }),
    }
  )
);
