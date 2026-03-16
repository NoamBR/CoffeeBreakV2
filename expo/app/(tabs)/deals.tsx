import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Trophy, Star, Flame, Coffee, Gift, Percent, Sparkles,
  Lock, Check, Crown, Zap, Ticket, ChevronLeft,
} from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useUserStore } from '@/stores/userStore';
import { useLoyaltyStore } from '@/stores/loyaltyStore';
import { useStreakStore } from '@/stores/streakStore';
import { useReferralStore } from '@/stores/referralStore';
import { getTier, getTierConfig, getNextTierProgress } from '@/utils/tiers';
import VoucherCard from '@/components/VoucherCard';
import type { ColorScheme } from '@/constants/colors';
import { Voucher } from '@/types';

type Achievement = {
  id: string;
  title: string;
  description: string;
  reward: string;
  icon: typeof Trophy;
  unlocked: boolean;
  progress?: string;
  color: string;
};

export default function DealsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const user = useUserStore((s) => s.user);
  const { totalRewards, stamps, stampsGoal, totalStampsEver, prizes } = useLoyaltyStore();
  const { currentStreak, longestStreak } = useStreakStore();
  const referralCount = useReferralStore((s) => s.referralCount);
  const vouchers = useReferralStore((s) => s.vouchers);
  const activeVouchers = useMemo(() => vouchers.filter((v) => v.status === 'active' && !v.redeemedAt), [vouchers]);

  const totalCoffees = user?.totalCoffees ?? 0;
  const tier = getTier(totalCoffees);
  const tierConfig = getTierConfig(tier);
  const { nextTier, ordersRemaining } = getNextTierProgress(totalCoffees);

  const achievements: Achievement[] = [
    {
      id: 'tier-discount',
      title: tierConfig.discount > 0
        ? `הנחת ${tierConfig.name} — ${tierConfig.discount}%`
        : 'הנחת דרגה',
      description: tierConfig.discount > 0
        ? `כלקוח ${tierConfig.name}, נהנים מ-${tierConfig.discount}% הנחה על כל הזמנה!`
        : `עליית דרגה ל${getTierConfig('silver').name} תפתח ${getTierConfig('silver').discount}% הנחה`,
      reward: tierConfig.discount > 0 ? `${tierConfig.discount}% הנחה` : '5% הנחה',
      icon: Crown,
      unlocked: tierConfig.discount > 0,
      progress: tierConfig.discount === 0 ? `${totalCoffees}/20 הזמנות` : undefined,
      color: tierConfig.color,
    },
    {
      id: 'streak-3',
      title: 'סטריק 3 ימים',
      description: '3 ימים רצופים של ביקורים — כל הכבוד!',
      reward: 'הכרה מיוחדת',
      icon: Flame,
      unlocked: longestStreak >= 3,
      progress: longestStreak < 3 ? `${currentStreak}/3 ימים` : undefined,
      color: colors.gold,
    },
    {
      id: 'streak-7',
      title: 'סטריק שבועי',
      description: '7 ימים רצופים = חותמת בונוס אוטומטית!',
      reward: 'חותמת בונוס',
      icon: Zap,
      unlocked: longestStreak >= 7,
      progress: longestStreak < 7 ? `${currentStreak}/7 ימים` : undefined,
      color: colors.gold,
    },
    {
      id: 'stamps-5',
      title: 'הקפה הראשון חינם',
      description: 'אספת 5 חותמות וקיבלת משקה חינם!',
      reward: 'משקה חינם',
      icon: Coffee,
      unlocked: totalStampsEver >= 5,
      progress: totalStampsEver < 5 ? `${totalStampsEver}/5 חותמות` : undefined,
      color: colors.primary,
    },
    {
      id: 'stamps-15',
      title: 'לקוח מסור',
      description: '15 חותמות = 3 משקאות חינם שנהנית מהם!',
      reward: 'כרטיס גירוד מיוחד',
      icon: Star,
      unlocked: totalStampsEver >= 15,
      progress: totalStampsEver < 15 ? `${totalStampsEver}/15 חותמות` : undefined,
      color: colors.primary,
    },
    {
      id: 'referral-1',
      title: 'שגריר קפה',
      description: 'הזמנת חבר ושניכם נהניתם!',
      reward: 'חותמת בונוס',
      icon: Gift,
      unlocked: referralCount >= 1,
      progress: referralCount < 1 ? 'הזמן חבר ראשון' : undefined,
      color: colors.success,
    },
    ...(nextTier ? [{
      id: 'next-tier',
      title: `עלה לדרגת ${nextTier.name}`,
      description: `עוד ${ordersRemaining} הזמנות ותפתח ${nextTier.discount}% הנחה קבועה!`,
      reward: `${nextTier.discount}% הנחה`,
      icon: Trophy,
      unlocked: false,
      progress: `${totalCoffees}/${nextTier.minOrders} הזמנות`,
      color: nextTier.color,
    }] : []),
    {
      id: 'scratch-collector',
      title: 'אספן הפתעות',
      description: `אספת ${prizes.length} פרסים מכרטיסי גירוד!`,
      reward: 'פרסים מיוחדים',
      icon: Sparkles,
      unlocked: prizes.length >= 3,
      progress: prizes.length < 3 ? `${prizes.length}/3 פרסים` : undefined,
      color: colors.highlight,
    },
  ];

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  const handleVoucherPress = (voucher: Voucher) => {
    router.push({ pathname: '/voucher-display', params: { id: voucher.id } });
  };

  return (
    <ScrollView style={styles.wrapper} showsVerticalScrollIndicator={false}>
      {/* My Vouchers */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Pressable
            style={styles.viewAllBtn}
            onPress={() => router.push('/vouchers')}
          >
            <ChevronLeft size={14} color={colors.accent} />
            <Text style={styles.viewAllText}>הכל</Text>
          </Pressable>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>הקופונים שלי</Text>
        </View>

        {activeVouchers.length > 0 ? (
          <>
            {activeVouchers.slice(0, 3).map((v) => (
              <View key={v.id} style={styles.voucherSeparator}>
                <VoucherCard voucher={v} onPress={handleVoucherPress} />
              </View>
            ))}
            {activeVouchers.length > 3 && (
              <Pressable
                style={styles.showMoreBtn}
                onPress={() => router.push('/vouchers')}
              >
                <Text style={styles.showMoreText}>
                  עוד {activeVouchers.length - 3} קופונים
                </Text>
                <ChevronLeft size={14} color={colors.accent} />
              </Pressable>
            )}
          </>
        ) : (
          <View style={styles.emptyVouchers}>
            <Ticket size={32} color={colors.inactive} />
            <Text style={styles.emptyVouchersText}>
              אין קופונים פעילים כרגע
            </Text>
            <Text style={styles.emptyVouchersHint}>
              צברו חותמות, גרדו כרטיסים, או הזמינו חברים כדי לקבל קופונים
            </Text>
          </View>
        )}
      </View>

      {/* Achievements */}
      {unlocked.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>ההטבות שלי</Text>
          {unlocked.map((a) => (
            <View key={a.id} style={styles.achievementCard}>
              <LinearGradient
                colors={[a.color, a.color + 'CC']}
                style={styles.achievementIcon}
              >
                <a.icon size={20} color={colors.white} />
              </LinearGradient>
              <View style={styles.achievementContent}>
                <View style={styles.achievementHeader}>
                  <View style={styles.unlockedBadge}>
                    <Check size={10} color={colors.white} />
                    <Text style={styles.unlockedBadgeText}>פעיל</Text>
                  </View>
                  <Text style={styles.achievementTitle}>{a.title}</Text>
                </View>
                <Text style={styles.achievementDesc}>{a.description}</Text>
                <View style={styles.rewardTag}>
                  <Text style={styles.rewardTagText}>{a.reward}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {locked.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>השגים לפתיחה</Text>
          {locked.map((a) => (
            <View key={a.id} style={[styles.achievementCard, styles.achievementLocked]}>
              <View style={styles.lockedIcon}>
                <Lock size={18} color={colors.inactive} />
              </View>
              <View style={styles.achievementContent}>
                <Text style={[styles.achievementTitle, { color: colors.textSecondary }]}>
                  {a.title}
                </Text>
                <Text style={styles.achievementDesc}>{a.description}</Text>
                {a.progress && (
                  <View style={styles.progressRow}>
                    <Text style={styles.progressText}>{a.progress}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 14,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  achievementLocked: {
    opacity: 0.75,
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  achievementDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: 18,
    marginBottom: 6,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  unlockedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  rewardTag: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
  rewardTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.highlight,
  },
  progressRow: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  voucherSeparator: {
    marginBottom: 12,
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    backgroundColor: colors.accentLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
  emptyVouchers: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyVouchersText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyVouchersHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 24,
  },
  bottomSpacer: {
    height: 40,
  },
});
