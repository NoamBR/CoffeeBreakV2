import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationTarget = 'all' | 'bronze' | 'silver' | 'gold' | 'birthday';

export type NotificationEntry = {
  id: string;
  title: string;
  body: string;
  target: NotificationTarget;
  sentAt: string;
};

export const NOTIFICATION_TEMPLATES = [
  { id: 'new-deal', title: 'מבצע חדש!', body: 'יש לנו מבצע מיוחד שחכה רק לכם. היכנסו לאפליקציה לפרטים!' },
  { id: 'miss-you', title: 'חסר לנו!', body: 'לא ראינו אתכם כבר כמה ימים... בואו לקפה ותקבלו הפתעה!' },
  { id: 'birthday', title: 'יום הולדת שמח!', body: 'מגיע לכם משקה + מאפה במתנה! בואו לחגוג איתנו.' },
  { id: 'order-ready', title: 'ההזמנה מוכנה!', body: 'ההזמנה שלכם מחכה לכם. בואו לאסוף!' },
];

type NotificationsState = {
  history: NotificationEntry[];
  sendNotification: (title: string, body: string, target: NotificationTarget) => void;
  clearHistory: () => void;
};

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      history: [],

      sendNotification: (title, body, target) => {
        const entry: NotificationEntry = {
          id: Date.now().toString(),
          title,
          body,
          target,
          sentAt: new Date().toISOString(),
        };
        set((state) => ({
          history: [entry, ...state.history],
        }));
        // TODO: Connect to Firebase Cloud Messaging / Expo Push when backend is ready
      },

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'coffeebreak-notifications',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
