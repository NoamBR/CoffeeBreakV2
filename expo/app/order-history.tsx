import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ClipboardList } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useOrderHistoryStore } from '@/stores/orderHistoryStore';
import { useCartStore } from '@/stores/cartStore';
import { menuItems } from '@/data/menu';
import { FullOrder } from '@/types';
import OrderHistoryCard from '@/components/OrderHistoryCard';
import * as Haptics from 'expo-haptics';

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { fullOrders } = useOrderHistoryStore();
  const addItem = useCartStore((s) => s.addItem);
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const sortedOrders = [...fullOrders].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleReorder = (order: FullOrder) => {
    for (const item of order.items) {
      const menuItem = menuItems.find((m) => m.id === item.itemId);
      if (menuItem) {
        addItem(menuItem, item.quantity);
      }
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/cart');
  };

  if (sortedOrders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ClipboardList size={64} color={colors.inactive} />
        <Text style={styles.emptyTitle}>עדיין לא ביצעתם הזמנות</Text>
        <Text style={styles.emptySubtitle}>ההזמנות שלכם יופיעו כאן</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={sortedOrders}
        keyExtractor={(item) => item.id + item.date}
        renderItem={({ item }) => (
          <OrderHistoryCard order={item} onReorder={handleReorder} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  separator: {
    height: 14,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
