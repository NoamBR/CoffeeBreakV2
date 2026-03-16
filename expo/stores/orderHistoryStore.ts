import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FullOrder, OrderStatus } from '@/types';
import { useInAppNotificationsStore } from './inAppNotificationsStore';
import * as ordersService from '@/services/ordersService';

type OrderEntry = {
  itemId: string;
  itemName: string;
  price: number;
  date: string;
  customizations?: string;
};

type OrderHistoryState = {
  orders: OrderEntry[];
  fullOrders: FullOrder[];
  syncing: boolean;
  lastSyncError: string | null;
  addOrder: (order: Omit<OrderEntry, 'date'>) => void;
  addFullOrder: (order: Omit<FullOrder, 'date' | 'statusUpdatedAt'>, userId?: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  getUsual: () => OrderEntry | null;
  getActiveOrders: () => FullOrder[];
  fetchOrdersFromDB: (userId: string) => Promise<void>;
  fetchActiveFromDB: () => Promise<void>;
  syncOrder: (order: FullOrder) => void;
};

export const useOrderHistoryStore = create<OrderHistoryState>()(
  persist(
    (set, get) => ({
      orders: [],
      fullOrders: [],
      syncing: false,
      lastSyncError: null,

      addOrder: (order) => {
        const entry: OrderEntry = {
          ...order,
          date: new Date().toISOString(),
        };
        set((state) => ({
          orders: [...state.orders, entry],
        }));
      },

      addFullOrder: (order, userId) => {
        const now = new Date().toISOString();
        const fullOrder: FullOrder = {
          ...order,
          date: now,
          statusUpdatedAt: now,
        };

        // Optimistic local update
        set((state) => ({
          fullOrders: [...state.fullOrders, fullOrder],
        }));

        // Notify staff about new order
        const itemsSummary = order.items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ');
        useInAppNotificationsStore.getState().addStaffNotification(
          'הזמנה חדשה!',
          `${order.customerName ?? 'לקוח'}: ${itemsSummary}`,
          'order_placed',
          order.id
        );

        // Also add each item to flat orders for getUsual() compatibility
        for (const item of order.items) {
          get().addOrder({
            itemId: item.itemId,
            itemName: item.itemName,
            price: item.price,
            customizations: item.customizations,
          });
        }

        // Persist to Supabase (non-blocking)
        ordersService.placeOrder(order, userId).then(
          (saved) => {
            // Update with server timestamps
            set((state) => ({
              fullOrders: state.fullOrders.map((o) =>
                o.id === saved.id ? saved : o
              ),
              lastSyncError: null,
            }));
          },
          (err) => {
            console.warn('[orders] Failed to sync to DB:', err);
            set({ lastSyncError: err?.message ?? 'Failed to save order' });
          }
        );
      },

      updateOrderStatus: (orderId, status) => {
        const now = new Date().toISOString();

        // Optimistic local update
        set((state) => ({
          fullOrders: state.fullOrders.map((o) => {
            if (o.id !== orderId) return o;
            return {
              ...o,
              status,
              statusUpdatedAt: now,
              readyAt: status === 'ready' ? now : o.readyAt,
              completedAt: status === 'completed' ? now : o.completedAt,
            };
          }),
        }));

        // Get updated order for notification
        const order = get().fullOrders.find((o) => o.id === orderId);
        if (!order) return;

        // Notify customer
        if (status === 'ready') {
          useInAppNotificationsStore.getState().addCustomerNotification(
            'ההזמנה שלך מוכנה!',
            `הזמנה #${orderId.slice(-4)} מחכה לך. בואו לאסוף!`,
            'order_ready',
            orderId
          );
        } else if (status === 'completed') {
          useInAppNotificationsStore.getState().addCustomerNotification(
            'תודה שבחרתם בנו!',
            `הזמנה #${orderId.slice(-4)} הושלמה. נשמח לראות אתכם שוב!`,
            'order_completed',
            orderId
          );
        }

        // Notify staff about status changes
        if (status === 'preparing') {
          useInAppNotificationsStore.getState().addStaffNotification(
            'הזמנה בהכנה',
            `הזמנה #${orderId.slice(-4)} התחילה בהכנה`,
            'order_placed',
            orderId
          );
        }

        // Sync to Supabase (non-blocking)
        ordersService.updateOrderStatus(orderId, status).catch((err) => {
          console.warn('[orders] Failed to sync status update:', err);
          set({ lastSyncError: err?.message ?? 'Failed to update status' });
        });
      },

      getUsual: () => {
        const { orders } = get();
        if (orders.length < 3) return null;

        const counts = new Map<string, { count: number; latest: OrderEntry }>();
        for (const order of orders) {
          const existing = counts.get(order.itemId);
          if (existing) {
            existing.count++;
            existing.latest = order;
          } else {
            counts.set(order.itemId, { count: 1, latest: order });
          }
        }

        let usual: OrderEntry | null = null;
        let maxDate = '';
        for (const [, data] of counts) {
          if (data.count >= 3 && data.latest.date > maxDate) {
            usual = data.latest;
            maxDate = data.latest.date;
          }
        }

        return usual;
      },

      getActiveOrders: () => {
        return get().fullOrders.filter(
          (o) => o.status === 'placed' || o.status === 'preparing' || o.status === 'ready'
        );
      },

      // Fetch user's order history from DB and merge with local
      fetchOrdersFromDB: async (userId) => {
        set({ syncing: true });
        try {
          const dbOrders = await ordersService.fetchUserOrders(userId);
          set((state) => {
            // Merge: DB is source of truth, keep local-only orders (not yet synced)
            const dbIds = new Set(dbOrders.map((o) => o.id));
            const localOnly = state.fullOrders.filter((o) => !dbIds.has(o.id));
            return {
              fullOrders: [...dbOrders, ...localOnly],
              syncing: false,
              lastSyncError: null,
            };
          });
        } catch (err: any) {
          console.warn('[orders] Failed to fetch from DB:', err);
          set({ syncing: false, lastSyncError: err?.message ?? 'Fetch failed' });
        }
      },

      // Fetch active orders from DB (for staff)
      fetchActiveFromDB: async () => {
        set({ syncing: true });
        try {
          const activeOrders = await ordersService.fetchActiveOrders();
          set((state) => {
            // Replace active orders with DB data, keep completed/cancelled local
            const localCompleted = state.fullOrders.filter(
              (o) => o.status === 'completed' || o.status === 'cancelled'
            );
            const dbIds = new Set(activeOrders.map((o) => o.id));
            const localCompletedNotInDB = localCompleted.filter((o) => !dbIds.has(o.id));
            return {
              fullOrders: [...activeOrders, ...localCompletedNotInDB],
              syncing: false,
              lastSyncError: null,
            };
          });
        } catch (err: any) {
          console.warn('[orders] Failed to fetch active from DB:', err);
          set({ syncing: false, lastSyncError: err?.message ?? 'Fetch failed' });
        }
      },

      // Apply a single order update from realtime subscription
      syncOrder: (order) => {
        set((state) => {
          const exists = state.fullOrders.some((o) => o.id === order.id);
          if (exists) {
            return {
              fullOrders: state.fullOrders.map((o) =>
                o.id === order.id ? order : o
              ),
            };
          }
          return {
            fullOrders: [...state.fullOrders, order],
          };
        });
      },
    }),
    {
      name: 'coffeebreak-order-history',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist transient state
      partialize: (state) => ({
        orders: state.orders,
        fullOrders: state.fullOrders,
      }),
    }
  )
);
