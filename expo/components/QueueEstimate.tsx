import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Users, Clock } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useOrderHistoryStore } from '@/stores/orderHistoryStore';
import type { ColorScheme } from '@/constants/colors';

const AVG_PREP_MINUTES = 3;

export default function QueueEstimate() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const fullOrders = useOrderHistoryStore((s) => s.fullOrders);

  // Only count orders that are placed or preparing (not ready)
  const queueSize = useMemo(
    () => fullOrders.filter((o) => o.status === 'placed' || o.status === 'preparing').length,
    [fullOrders]
  );

  if (queueSize === 0) {
    return (
      <View style={[styles.container, styles.containerEmpty]}>
        <Clock size={16} color={colors.success} />
        <Text style={[styles.estimate, { color: colors.success }]}>
          אין תור — הזמינו עכשיו!
        </Text>
      </View>
    );
  }

  const estimateMinutes = queueSize * AVG_PREP_MINUTES;
  const urgencyColor =
    estimateMinutes <= 5 ? colors.success :
    estimateMinutes <= 15 ? colors.gold :
    colors.error;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Users size={16} color={urgencyColor} />
        <Text style={[styles.queueCount, { color: urgencyColor }]}>
          {queueSize} הזמנות בתור
        </Text>
      </View>
      <View style={[styles.estimateBadge, { backgroundColor: urgencyColor + '18' }]}>
        <Clock size={14} color={urgencyColor} />
        <Text style={[styles.estimate, { color: urgencyColor }]}>
          ~{estimateMinutes} דקות המתנה
        </Text>
      </View>
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerEmpty: {
    justifyContent: 'center',
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  queueCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  estimateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  estimate: {
    fontSize: 13,
    fontWeight: '700',
  },
});
