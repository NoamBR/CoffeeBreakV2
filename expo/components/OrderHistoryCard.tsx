import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { FullOrder } from '@/types';
import { formatPrice } from '@/utils/formatPrice';

type Props = {
  order: FullOrder;
  onReorder: (order: FullOrder) => void;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} · ${hours}:${mins}`;
}

export default function OrderHistoryCard({ order, onReorder }: Props) {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(order.date)}</Text>
        <Text style={styles.orderNumber}>{order.id}</Text>
      </View>

      <View style={styles.items}>
        {order.items.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.itemName}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.reorderBtn, pressed && { opacity: 0.75 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onReorder(order);
          }}
        >
          <RotateCcw size={14} color={colors.primary} />
          <Text style={styles.reorderText}>הזמן שוב</Text>
        </Pressable>
        <View style={styles.totalRow}>
          <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
          <Text style={styles.totalLabel}>סה״כ</Text>
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  date: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  items: {
    gap: 6,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  reorderText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
