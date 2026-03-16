import { useMemo } from 'react';
import { useOrderHistoryStore } from '@/stores/orderHistoryStore';
import { useLoyaltyStore } from '@/stores/loyaltyStore';
import { useUserStore } from '@/stores/userStore';

function isToday(dateStr: string): boolean {
  return dateStr.startsWith(new Date().toISOString().split('T')[0]);
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return d >= weekStart;
}

export function useAnalytics() {
  const fullOrders = useOrderHistoryStore((s) => s.fullOrders);
  const orders = useOrderHistoryStore((s) => s.orders);
  const history = useLoyaltyStore((s) => s.history);
  const totalRewards = useLoyaltyStore((s) => s.totalRewards);
  const user = useUserStore((s) => s.user);

  return useMemo(() => {
    // Today
    const todayOrders = fullOrders.filter((o) => isToday(o.date));
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const todayStamps = history.filter((e) => e.type === 'stamp' && isToday(e.date)).length;
    const todayRewards = history.filter((e) => e.type === 'reward_claimed' && isToday(e.date)).length;

    // This week
    const weekOrders = fullOrders.filter((o) => isThisWeek(o.date));
    const weekRevenue = weekOrders.reduce((sum, o) => sum + o.total, 0);
    const weekStamps = history.filter((e) => e.type === 'stamp' && isThisWeek(e.date)).length;

    // All time
    const totalOrders = fullOrders.length;
    const totalRevenue = fullOrders.reduce((sum, o) => sum + o.total, 0);
    const totalStamps = history.filter((e) => e.type === 'stamp').length;

    // Popular items
    const itemCounts = new Map<string, { name: string; count: number }>();
    for (const order of orders) {
      const existing = itemCounts.get(order.itemId);
      if (existing) {
        existing.count++;
      } else {
        itemCounts.set(order.itemId, { name: order.itemName, count: 1 });
      }
    }
    const popularItems = [...itemCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Peak hours
    const hourCounts: number[] = Array(24).fill(0);
    for (const order of fullOrders) {
      const hour = new Date(order.date).getHours();
      hourCounts[hour]++;
    }

    // Category breakdown
    const categoryCounts = new Map<string, number>();
    for (const order of orders) {
      const cat = order.itemId.split('-')[0] || 'other';
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
    }

    return {
      today: {
        orders: todayOrders.length,
        revenue: todayRevenue,
        stamps: todayStamps,
        rewards: todayRewards,
      },
      week: {
        orders: weekOrders.length,
        revenue: weekRevenue,
        stamps: weekStamps,
      },
      allTime: {
        orders: totalOrders,
        revenue: totalRevenue,
        stamps: totalStamps,
        rewards: totalRewards,
        coffees: user?.totalCoffees ?? 0,
      },
      popularItems,
      hourCounts,
      categoryCounts: [...categoryCounts.entries()],
    };
  }, [fullOrders, orders, history, totalRewards, user]);
}
