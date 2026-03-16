import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Clock, Check, X, ChefHat, Timer } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { FullOrder } from '@/types';
import { formatPrice } from '@/utils/formatPrice';

type Props = {
  order: FullOrder;
  onMarkPreparing?: () => void;
  onMarkReady?: () => void;
  onMarkCompleted?: () => void;
  onCancel?: () => void;
};

function getStatusConfig(colors: ColorScheme): Record<string, { text: string; color: string }> {
  return {
    placed: { text: 'ממתינה', color: '#F5A623' },
    preparing: { text: 'בהכנה', color: '#9C27B0' },
    ready: { text: 'מוכנה', color: colors.primary },
    completed: { text: 'הושלמה', color: colors.success },
    cancelled: { text: 'בוטלה', color: colors.error },
  };
}

function getWaitingMinutes(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

function formatWaiting(minutes: number): string {
  if (minutes < 1) return 'עכשיו';
  if (minutes < 60) return `${minutes} דק\'`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} שע\' ${m > 0 ? `${m} דק\'` : ''}`;
}

// Urgency tiers for visual cues
function getUrgencyConfig(minutes: number): { borderColor: string; timerColor: string; level: 'ok' | 'warning' | 'urgent' } {
  if (minutes < 3) return { borderColor: '#4CAF50', timerColor: '#4CAF50', level: 'ok' };
  if (minutes < 7) return { borderColor: '#F5A623', timerColor: '#F5A623', level: 'warning' };
  return { borderColor: '#D4442A', timerColor: '#D4442A', level: 'urgent' };
}

export default function OrderCard({ order, onMarkPreparing, onMarkReady, onMarkCompleted, onCancel }: Props) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const statusConfig = getStatusConfig(colors);

  const status = statusConfig[order.status] ?? statusConfig.placed;
  const placedTime = new Date(order.date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  const isWaiting = order.status === 'placed' || order.status === 'preparing';

  // Live elapsed timer (updates every 15s)
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!isWaiting) return;
    const interval = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(interval);
  }, [isWaiting]);

  const waitingMinutes = Math.floor((now - new Date(order.date).getTime()) / 60000);
  const urgency = isWaiting ? getUrgencyConfig(waitingMinutes) : null;
  const isUrgent = isWaiting && waitingMinutes >= 7;

  // Format elapsed as MM:SS
  const elapsedSec = Math.floor((now - new Date(order.date).getTime()) / 1000);
  const elapsedStr = `${Math.floor(elapsedSec / 60)}:${(elapsedSec % 60).toString().padStart(2, '0')}`;

  return (
    <View style={[
      styles.card,
      isWaiting && urgency && { borderColor: urgency.borderColor, borderWidth: 2 },
      isUrgent && styles.cardUrgentPulse,
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.orderId}>#{order.id.slice(-4)}</Text>
          {order.customerName && (
            <Text style={styles.customerName}>{order.customerName}</Text>
          )}
        </View>
      </View>

      {/* Time row */}
      <View style={styles.timeRow}>
        {isWaiting && urgency && (
          <View style={[styles.waitingBadge, { backgroundColor: urgency.borderColor + '18' }]}>
            <Timer size={12} color={urgency.timerColor} />
            <Text style={[styles.waitingText, { color: urgency.timerColor }]}>
              {elapsedStr}
            </Text>
            {waitingMinutes >= 3 && (
              <Text style={[styles.waitingLabel, { color: urgency.timerColor }]}>
                {urgency.level === 'urgent' ? 'דחוף!' : 'ממתין'}
              </Text>
            )}
          </View>
        )}
        <View style={styles.timeInfo}>
          <Text style={styles.timeLabel}>{placedTime}</Text>
          <Clock size={12} color={colors.textSecondary} />
        </View>
      </View>

      {/* Pickup time */}
      {order.pickupTime && (
        <View style={styles.pickupRow}>
          <Text style={styles.pickupText}>איסוף: {order.pickupTime}</Text>
        </View>
      )}

      {/* Items */}
      <View style={styles.items}>
        {order.items.map((item, i) => (
          <Text key={i} style={styles.itemText}>
            {item.quantity}x {item.itemName}
            {item.customizations ? ` (${item.customizations})` : ''}
          </Text>
        ))}
      </View>

      {order.notes && <Text style={styles.notes}>הערות: {order.notes}</Text>}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.total}>{formatPrice(order.total)}</Text>
        {order.discount > 0 && (
          <Text style={styles.discount}>-{order.discount}% הנחה</Text>
        )}

        <View style={styles.actions}>
          {order.status === 'placed' && onMarkPreparing && (
            <Pressable style={[styles.actionBtn, styles.preparingBtn]} onPress={onMarkPreparing}>
              <ChefHat size={14} color={colors.white} />
              <Text style={styles.actionBtnText}>בהכנה</Text>
            </Pressable>
          )}
          {(order.status === 'placed' || order.status === 'preparing') && onMarkReady && (
            <Pressable style={[styles.actionBtn, styles.readyBtn]} onPress={onMarkReady}>
              <Check size={14} color={colors.white} />
              <Text style={styles.actionBtnText}>מוכנה</Text>
            </Pressable>
          )}
          {order.status === 'ready' && onMarkCompleted && (
            <Pressable style={[styles.actionBtn, styles.completedBtn]} onPress={onMarkCompleted}>
              <Check size={14} color={colors.white} />
              <Text style={styles.actionBtnText}>הושלמה</Text>
            </Pressable>
          )}
          {order.status !== 'completed' && order.status !== 'cancelled' && onCancel && (
            <Pressable style={[styles.actionBtn, styles.cancelBtn]} onPress={onCancel}>
              <X size={14} color={colors.error} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardUrgent: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  cardUrgentPulse: {
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  customerName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  waitingBadgeUrgent: {
    backgroundColor: '#FFEBEE',
  },
  waitingText: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  waitingLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  pickupRow: {
    marginBottom: 8,
  },
  pickupText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'right',
  },
  items: {
    gap: 4,
    marginBottom: 10,
  },
  itemText: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  notes: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  total: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  discount: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  preparingBtn: {
    backgroundColor: '#9C27B0',
  },
  readyBtn: {
    backgroundColor: colors.primary,
  },
  completedBtn: {
    backgroundColor: colors.success,
  },
  cancelBtn: {
    backgroundColor: colors.error + '15',
    borderWidth: 1,
    borderColor: colors.error,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
});
