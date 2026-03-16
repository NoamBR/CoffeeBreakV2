import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type InAppNotification = {
  id: string;
  title: string;
  body: string;
  type: 'order_placed' | 'order_ready' | 'order_completed' | 'general';
  orderId?: string;
  read: boolean;
  createdAt: string;
};

type InAppNotificationsState = {
  customerNotifications: InAppNotification[];
  staffNotifications: InAppNotification[];
  addCustomerNotification: (title: string, body: string, type: InAppNotification['type'], orderId?: string) => void;
  addStaffNotification: (title: string, body: string, type: InAppNotification['type'], orderId?: string) => void;
  markRead: (id: string, target: 'customer' | 'staff') => void;
  markAllRead: (target: 'customer' | 'staff') => void;
  clearAll: (target: 'customer' | 'staff') => void;
  getUnreadCount: (target: 'customer' | 'staff') => number;
};

export const useInAppNotificationsStore = create<InAppNotificationsState>()(
  persist(
    (set, get) => ({
      customerNotifications: [],
      staffNotifications: [],

      addCustomerNotification: (title, body, type, orderId) => {
        const notif: InAppNotification = {
          id: Date.now().toString(),
          title,
          body,
          type,
          orderId,
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          customerNotifications: [notif, ...state.customerNotifications].slice(0, 50),
        }));
      },

      addStaffNotification: (title, body, type, orderId) => {
        const notif: InAppNotification = {
          id: Date.now().toString(),
          title,
          body,
          type,
          orderId,
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          staffNotifications: [notif, ...state.staffNotifications].slice(0, 50),
        }));
      },

      markRead: (id, target) =>
        set((state) => ({
          [target === 'customer' ? 'customerNotifications' : 'staffNotifications']:
            (target === 'customer' ? state.customerNotifications : state.staffNotifications)
              .map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllRead: (target) =>
        set((state) => ({
          [target === 'customer' ? 'customerNotifications' : 'staffNotifications']:
            (target === 'customer' ? state.customerNotifications : state.staffNotifications)
              .map((n) => ({ ...n, read: true })),
        })),

      clearAll: (target) =>
        set({
          [target === 'customer' ? 'customerNotifications' : 'staffNotifications']: [],
        }),

      getUnreadCount: (target) => {
        const notifs = target === 'customer'
          ? get().customerNotifications
          : get().staffNotifications;
        return notifs.filter((n) => !n.read).length;
      },
    }),
    {
      name: 'coffeebreak-in-app-notifications',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
