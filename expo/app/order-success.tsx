import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleCheck, Home, MapPin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useCartStore } from '@/stores/cartStore';
import { useOrderHistoryStore } from '@/stores/orderHistoryStore';
import { useLoyaltyStore } from '@/stores/loyaltyStore';
import { useStreakStore } from '@/stores/streakStore';
import { useUserStore } from '@/stores/userStore';
import { getTier, getTierConfig } from '@/utils/tiers';
import { formatPrice } from '@/utils/formatPrice';
import { formatCustomization } from '@/data/customizations';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    pickupTime: string;
    notes: string;
    total: string;
    discount: string;
    paymentMethod: string;
    transactionId: string;
    last4: string;
  }>();

  const { items, clearCart, getSubtotal } = useCartStore();
  const addFullOrder = useOrderHistoryStore((s) => s.addFullOrder);
  const addStamp = useLoyaltyStore((s) => s.addStamp);
  const recordOrder = useStreakStore((s) => s.recordOrder);
  const incrementCoffees = useUserStore((s) => s.incrementCoffees);
  const user = useUserStore((s) => s.user);
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const orderNumber = useRef(
    'CB-' + Date.now().toString(36).toUpperCase().slice(-4)
  ).current;

  const processed = useRef(false);

  useEffect(() => {
    if (processed.current || items.length === 0) return;
    processed.current = true;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Count drink items for stamps
    const drinkCategories = ['hot_drinks', 'drinks'];
    // We don't have category in CartItem, so we add 1 stamp per order
    // (matching existing behavior where staff adds 1 stamp per visit)
    addStamp();
    recordOrder();
    incrementCoffees();

    // Save to order history (syncs to Supabase)
    const subtotal = getSubtotal();
    const discount = parseInt(params.discount || '0', 10);
    addFullOrder(
      {
        id: orderNumber,
        customerName: user?.name ?? '',
        customerPhone: user?.phone ?? '',
        items: items.map((item) => ({
          itemId: item.menuItemId,
          itemName: item.name,
          price: item.totalPrice,
          quantity: item.quantity,
          customizations: formatCustomization(item.customization),
        })),
        total: subtotal - discount,
        discount,
        pickupTime: params.pickupTime || 'בהקדם האפשרי',
        notes: params.notes || undefined,
        status: 'placed',
        payment: {
          method: (params.paymentMethod as any) || 'at_register',
          status: params.paymentMethod === 'credit_card' ? 'completed' : 'pending',
          transactionId: params.transactionId || undefined,
          last4: params.last4 || undefined,
          paidAt: params.paymentMethod === 'credit_card' ? new Date().toISOString() : undefined,
          amount: subtotal - discount,
        },
      },
      user?.id
    );

    clearCart();
  }, []);

  return (
    <View style={styles.wrapper}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <CircleCheck size={56} color={colors.success} />
        </View>

        <Text style={styles.title}>ההזמנה בוצעה בהצלחה!</Text>
        <Text style={styles.subtitle}>תודה שבחרתם בהפסקת קפה</Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>{orderNumber}</Text>
            <Text style={styles.detailLabel}>מספר הזמנה</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>{params.pickupTime || 'בהקדם האפשרי'}</Text>
            <Text style={styles.detailLabel}>זמן איסוף</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailValue, { color: colors.primary }]}>
              {formatPrice(parseInt(params.total || '0', 10))}
            </Text>
            <Text style={styles.detailLabel}>סה״כ לתשלום</Text>
          </View>
        </View>

        <View style={styles.stampNote}>
          <Text style={styles.stampNoteText}>
            +1 חותמת נאמנות נוספה אוטומטית
          </Text>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [styles.trackBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push({ pathname: '/order-track', params: { orderId: orderNumber } })}
        >
          <MapPin size={20} color={colors.white} />
          <Text style={styles.trackBtnText}>עקוב אחרי ההזמנה</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.homeBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Home size={20} color={colors.textSecondary} />
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  detailsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  stampNote: {
    marginTop: 20,
    backgroundColor: colors.accentLight,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  stampNoteText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    paddingBottom: 40,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    marginBottom: 10,
  },
  trackBtnText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentLight,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  homeBtnText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
