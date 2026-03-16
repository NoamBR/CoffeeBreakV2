import { useEffect } from 'react';
import { useOrderHistoryStore } from '@/stores/orderHistoryStore';
import { subscribeToOrders } from '@/services/ordersService';

/**
 * Hook for staff screens to subscribe to real-time order updates.
 * Fetches active orders on mount, then listens for inserts/updates.
 */
export function useRealtimeOrders() {
  const fetchActiveFromDB = useOrderHistoryStore((s) => s.fetchActiveFromDB);
  const syncOrder = useOrderHistoryStore((s) => s.syncOrder);
  const syncing = useOrderHistoryStore((s) => s.syncing);

  useEffect(() => {
    // Initial fetch
    fetchActiveFromDB();

    // Subscribe to real-time changes
    const unsubscribe = subscribeToOrders(
      (newOrder) => syncOrder(newOrder),
      (updatedOrder) => syncOrder(updatedOrder)
    );

    return unsubscribe;
  }, [fetchActiveFromDB, syncOrder]);

  return { syncing };
}
