import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Home, Clock, Package } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useOrderHistoryStore } from '@/stores/orderHistoryStore';
import { subscribeToOrders } from '@/services/ordersService';
import OrderStatusTracker from '@/components/OrderStatusTracker';
import { formatPrice } from '@/utils/formatPrice';
import type { ColorScheme } from '@/constants/colors';
import type { FullOrder } from '@/types';

export default function OrderTrackScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const fullOrders = useOrderHistoryStore((s) => s.fullOrders);
  const updateOrderStatus = useOrderHistoryStore((s) => s.updateOrderStatus);

  const order = fullOrders.find((o) => o.id === orderId);

  // Subscribe to real-time order updates
  useEffect(() => {
    if (!orderId) return;

    const handleOrder = (o: FullOrder) => {
      if (o.id === orderId) {
        updateOrderStatus(orderId, o.status);
      }
    };

    const unsubscribe = subscribeToOrders(handleOrder, handleOrder);

    return () => {
      unsubscribe?.();
    };
  }, [orderId]);

  if (!order) {
    return (
      <View style={styles.center}>
        <Package size={48} color={colors.inactive} />
        <Text style={styles.notFoundText}>הזמנה לא נמצאה</Text>
        <Pressable
          style={[styles.homeBtn, { marginTop: 16 }]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.homeBtnText}>חזרה לדף הבית</Text>
        </Pressable>
      </View>
    );
  }

  const isCompleted = order.status === 'completed';
  const isReady = order.status === 'ready';

  const statusMessages: Record<string, string> = {
    placed: 'ההזמנה התקבלה ומחכה להכנה',
    preparing: 'הבריסטה מכינ/ה את ההזמנה שלכם',
    ready: 'ההזמנה מוכנה! בואו לאסוף',
    completed: 'ההזמנה נאספה — תודה!',
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Order number header */}
        <View style={styles.header}>
          <Text style={styles.orderNumber}>{order.id}</Text>
          <Text style={styles.orderLabel}>מספר הזמנה</Text>
        </View>

        {/* Status tracker */}
        <View style={styles.trackerCard}>
          <OrderStatusTracker status={order.status} />
          <Text style={[
            styles.statusMessage,
            isReady && styles.statusMessageReady,
          ]}>
            {statusMessages[order.status] ?? 'בבדיקה...'}
          </Text>
        </View>

        {/* Order details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>פרטי ההזמנה</Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>
                  {item.quantity > 1 ? `${item.itemName} ×${item.quantity}` : item.itemName}
                </Text>
                {item.customizations ? (
                  <Text style={styles.itemCustom}>{item.customizations}</Text>
                ) : null}
              </View>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
            <Text style={styles.totalLabel}>סה״כ</Text>
          </View>
        </View>

        {/* Pickup time */}
        <View style={styles.pickupCard}>
          <Clock size={18} color={colors.textSecondary} />
          <Text style={styles.pickupText}>
            זמן איסוף: {order.pickupTime}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom action */}
      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [styles.homeBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Home size={20} color={colors.white} />
          <Text style={styles.homeBtnText}>חזרה לדף הבית</Text>
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
    gap: 4,
  },
  orderNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 2,
  },
  orderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  trackerCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statusMessage: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  statusMessageReady: {
    color: colors.success,
    fontWeight: '800',
    fontSize: 17,
  },
  detailsCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  itemCustom: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  pickupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: colors.accentLight,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  pickupText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    paddingBottom: 40,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
  },
  homeBtnText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
