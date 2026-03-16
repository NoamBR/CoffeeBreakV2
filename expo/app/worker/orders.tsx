import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useOrderHistoryStore } from '@/stores/orderHistoryStore';
import OrderCard from '@/components/admin/OrderCard';

export default function WorkerOrdersScreen() {
  const fullOrders = useOrderHistoryStore((s) => s.fullOrders);
  const updateOrderStatus = useOrderHistoryStore((s) => s.updateOrderStatus);
  const colors = useThemeColors();
  const styles = getStyles(colors);

  // Show active orders sorted FIFO (oldest first = most urgent)
  const activeOrders = [...fullOrders]
    .filter((o) => o.status === 'placed' || o.status === 'preparing' || o.status === 'ready')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {activeOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>☕</Text>
            <Text style={styles.emptyText}>אין הזמנות פעילות</Text>
            <Text style={styles.emptySubtext}>כשתיכנס הזמנה חדשה, היא תופיע כאן</Text>
          </View>
        ) : (
          activeOrders.map((order) => (
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
  wrapper: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingBottom: 40 },
  orderWrap: { marginBottom: 12 },
  emptyState: { alignItems: 'center', marginTop: 80, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  emptySubtext: { fontSize: 14, color: colors.textSecondary },
});
