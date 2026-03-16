import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useOrderHistoryStore } from '@/stores/orderHistoryStore';
import { useInAppNotificationsStore } from '@/stores/inAppNotificationsStore';
import { OrderStatus } from '@/types';
import OrderCard from '@/components/admin/OrderCard';

type StatusFilter = 'active' | 'completed';

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<StatusFilter>('active');
  const fullOrders = useOrderHistoryStore((s) => s.fullOrders);
  const updateOrderStatus = useOrderHistoryStore((s) => s.updateOrderStatus);
  const staffNotifs = useInAppNotificationsStore((s) => s.staffNotifications);
  const staffUnread = staffNotifs.filter((n) => !n.read).length;
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const activeOrders = [...fullOrders]
    .filter((o) => o.status === 'placed' || o.status === 'preparing' || o.status === 'ready')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // oldest first (FIFO)

  const completedOrders = [...fullOrders]
    .filter((o) => o.status === 'completed' || o.status === 'cancelled')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // newest first

  const filtered = activeTab === 'active' ? activeOrders : completedOrders;

  return (
    <View style={styles.wrapper}>
      {/* Notification badge */}
      {staffUnread > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>{staffUnread} הזמנות חדשות!</Text>
          <Bell size={16} color={colors.white} />
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            פעילות ({activeOrders.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            הושלמו ({completedOrders.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>
            {activeTab === 'active' ? 'אין הזמנות פעילות' : 'אין היסטוריית הזמנות'}
          </Text>
        ) : (
          filtered.map((order) => (
            <View key={order.id} style={styles.orderWrap}>
              <OrderCard
                order={order}
                onMarkPreparing={() => updateOrderStatus(order.id, 'preparing')}
                onMarkReady={() => updateOrderStatus(order.id, 'ready')}
                onMarkCompleted={() => updateOrderStatus(order.id, 'completed')}
                onCancel={() => updateOrderStatus(order.id, 'cancelled')}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
  },
  alertText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  orderWrap: {
    marginBottom: 12,
  },
  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 60,
    fontSize: 16,
  },
});
