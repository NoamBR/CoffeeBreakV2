import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Minus, Plus, Trash2, Coffee, ShoppingCart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useCartStore } from '@/stores/cartStore';
import { useUserStore } from '@/stores/userStore';
import { getTier, getTierConfig } from '@/utils/tiers';
import { formatPrice } from '@/utils/formatPrice';
import { formatCustomization } from '@/data/customizations';
import { CartItem } from '@/types';

export default function CartScreen() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const user = useUserStore((s) => s.user);
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const subtotal = getSubtotal();
  const tier = user ? getTier(user.totalCoffees) : 'bronze';
  const tierConfig = getTierConfig(tier);
  const discountPercent = tierConfig.discount;
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const total = subtotal - discountAmount;

  const renderItem = ({ item }: { item: CartItem }) => {
    const customText = formatCustomization(item.customization);
    return (
      <View style={styles.itemCard}>
        <Image
          source={typeof item.image === 'number' ? item.image : { uri: item.image }}
          style={styles.itemImage}
          contentFit="cover"
        />
        <View style={styles.itemContent}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          {customText ? (
            <Text style={styles.itemCustom} numberOfLines={1}>{customText}</Text>
          ) : null}
          <Text style={styles.itemPrice}>{formatPrice(item.totalPrice)}</Text>
          <View style={styles.itemActions}>
            <View style={styles.qtyRow}>
              <Pressable
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
                style={styles.qtyBtn}
              >
                <Minus size={14} color={colors.primary} />
              </Pressable>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <Pressable
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
                style={styles.qtyBtn}
              >
                <Plus size={14} color={colors.primary} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                removeItem(item.id);
              }}
              hitSlop={6}
            >
              <Trash2 size={18} color={colors.error} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ShoppingCart size={64} color={colors.inactive} />
        <Text style={styles.emptyTitle}>העגלה ריקה</Text>
        <Text style={styles.emptySubtitle}>הוסיפו פריטים מהתפריט</Text>
        <Pressable
          style={({ pressed }) => [styles.menuBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/(tabs)/menu')}
        >
          <Coffee size={18} color={colors.white} />
          <Text style={styles.menuBtnText}>לתפריט</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          <Text style={styles.summaryLabel}>סכום ביניים</Text>
        </View>
        {discountPercent > 0 && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              -{formatPrice(discountAmount)}
            </Text>
            <Text style={styles.summaryLabel}>
              הנחת {tierConfig.name} ({discountPercent}%)
            </Text>
          </View>
        )}
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          <Text style={styles.totalLabel}>סה״כ</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.orderBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          onPress={() => router.push('/order-confirm')}
        >
          <Text style={styles.orderBtnText}>הזמן עכשיו</Text>
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
  list: {
    padding: 20,
    paddingBottom: 16,
  },
  separator: {
    height: 12,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemImage: {
    width: 90,
    height: 90,
  },
  itemContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
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
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'right',
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  qtyBtn: {
    padding: 2,
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
  summary: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  orderBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  orderBtnText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
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
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 12,
  },
  menuBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
