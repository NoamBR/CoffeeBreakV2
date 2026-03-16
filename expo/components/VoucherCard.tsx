import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Coffee, Percent, Cookie, ArrowUpCircle, Gift, Ticket } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { Voucher } from '@/types';

const voucherIcons = {
  free_coffee: Coffee,
  discount_percent: Percent,
  free_pastry: Cookie,
  free_upgrade: ArrowUpCircle,
  birthday_gift: Gift,
};

type Props = {
  voucher: Voucher;
  onPress?: (voucher: Voucher) => void;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

export default function VoucherCard({ voucher, onPress }: Props) {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const Icon = voucherIcons[voucher.type] || Ticket;
  const isRedeemed = voucher.status === 'redeemed' || !!voucher.redeemedAt;
  const isExpired = voucher.status === 'expired';
  const isPending = voucher.barcode.startsWith('LOCAL-');
  const isInactive = isRedeemed || isExpired;

  return (
    <Pressable
      style={[styles.card, isInactive && styles.cardRedeemed]}
      onPress={() => !isInactive && onPress?.(voucher)}
      disabled={isInactive}
    >
      <LinearGradient
        colors={isInactive ? [colors.border, colors.inactive] : [colors.accent, colors.gold]}
        style={styles.iconCircle}
      >
        <Icon size={20} color={colors.white} />
      </LinearGradient>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, isInactive && styles.textRedeemed]}>{voucher.title}</Text>
          {isPending && (
            <View style={styles.syncBadge}>
              <Text style={styles.syncBadgeText}>ממתין לסנכרון</Text>
            </View>
          )}
          {isExpired && (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredBadgeText}>פג תוקף</Text>
            </View>
          )}
        </View>
        <Text style={styles.description} numberOfLines={1}>{voucher.description}</Text>
        <View style={styles.bottomRow}>
          <View style={[styles.barcodeBadge, isInactive && styles.barcodeBadgeRedeemed]}>
            <Text style={[styles.barcodeText, isInactive && styles.barcodeTextRedeemed]}>
              {isPending ? '...' : voucher.barcode}
            </Text>
          </View>
          {isRedeemed ? (
            <Text style={styles.redeemedText}>מומש {formatDate(voucher.redeemedAt!)}</Text>
          ) : isExpired && voucher.expiresAt ? (
            <Text style={styles.expiredText}>פג {formatDate(voucher.expiresAt)}</Text>
          ) : voucher.expiresAt ? (
            <Text style={styles.earnedText}>עד {formatDate(voucher.expiresAt)}</Text>
          ) : (
            <Text style={styles.earnedText}>{formatDate(voucher.earnedAt)}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardRedeemed: {
    opacity: 0.6,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'flex-end',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    width: '100%',
  },
  syncBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFDA6A',
  },
  syncBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#997404',
  },
  expiredBadge: {
    backgroundColor: '#F8D7DA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F1AEB5',
  },
  expiredBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#842029',
  },
  expiredText: {
    fontSize: 11,
    color: colors.error,
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  textRedeemed: {
    color: colors.textSecondary,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  barcodeBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  barcodeBadgeRedeemed: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  barcodeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1,
  },
  barcodeTextRedeemed: {
    color: colors.inactive,
  },
  earnedText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  redeemedText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
  },
});
