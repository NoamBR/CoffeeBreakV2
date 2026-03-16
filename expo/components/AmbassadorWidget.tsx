import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Share, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Crown, Lock, Share2, Ticket, Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useUserStore } from '@/stores/userStore';
import { useReferralStore } from '@/stores/referralStore';
import { getTier } from '@/utils/tiers';

export default function AmbassadorWidget() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const {
    isAmbassador,
    referralCode,
    referralCount,
    vouchers,
    joinAmbassador,
    generateCode,
  } = useReferralStore();

  const totalCoffees = user?.totalCoffees ?? 0;
  const tier = getTier(totalCoffees);
  const isSilverPlus = tier === 'silver' || tier === 'gold';
  const activeVouchers = vouchers.filter((v) => !v.redeemedAt).length;

  // ── Animations ──
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const containerSlide = useRef(new Animated.Value(16)).current;
  const ctaPulse = useRef(new Animated.Value(1)).current;
  const shimmerPos = useRef(new Animated.Value(-1)).current;
  const codeFade = useRef(new Animated.Value(0)).current;
  const codeScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Container entrance
    Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(containerSlide, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // CTA pulse (for join button)
    if (!isAmbassador && isSilverPlus) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(ctaPulse, {
            toValue: 1.04,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ctaPulse, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Shimmer on active card header
    if (isAmbassador) {
      Animated.loop(
        Animated.sequence([
          Animated.delay(3000),
          Animated.timing(shimmerPos, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(shimmerPos, {
            toValue: -1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Code pop-in
      Animated.parallel([
        Animated.timing(codeFade, {
          toValue: 1,
          duration: 500,
          delay: 300,
          useNativeDriver: true,
        }),
        Animated.spring(codeScale, {
          toValue: 1,
          tension: 80,
          friction: 6,
          delay: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isAmbassador, isSilverPlus]);

  const shimmerTranslateX = shimmerPos.interpolate({
    inputRange: [-1, 1],
    outputRange: [-80, 200],
  });

  // ── Bronze — locked state ──
  if (!isSilverPlus) {
    const progress = Math.min(totalCoffees / 20, 1);
    return (
      <Animated.View
        style={[
          styles.lockedCard,
          {
            opacity: containerOpacity,
            transform: [{ translateY: containerSlide }],
          },
        ]}
      >
        <View style={styles.lockedHeader}>
          <Lock size={20} color={colors.inactive} />
          <Text style={styles.lockedTitle}>שגריר קפה</Text>
        </View>
        <Text style={styles.lockedDesc}>
          הגיעו לדרגת כסף ותזכו ב-2 קפה חינם + קוד הזמנה!
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {totalCoffees}/20 הזמנות — עוד {Math.max(0, 20 - totalCoffees)} לפתיחה
        </Text>
      </Animated.View>
    );
  }

  // ── Silver+ but not yet joined ──
  if (!isAmbassador) {
    const handleJoin = () => {
      if (user?.id) generateCode(user.id);
      joinAmbassador();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    return (
      <Animated.View
        style={[
          {
            opacity: containerOpacity,
            transform: [{ translateY: containerSlide }],
          },
        ]}
      >
        <LinearGradient
          colors={[colors.accent, colors.gold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.joinCard}
        >
          <Crown size={32} color={colors.white} />
          <Text style={styles.joinTitle}>שגריר קפה</Text>
          <Text style={styles.joinDesc}>
            הצטרפו לתוכנית השגרירים וקבלו 2 קפה חינם מיד!{'\n'}
            על כל חבר — עוד קפה חינם לשניכם
          </Text>
          <Animated.View style={{ transform: [{ scale: ctaPulse }] }}>
            <Pressable
              style={({ pressed }) => [styles.joinBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
              onPress={handleJoin}
            >
              <Text style={styles.joinBtnText}>הצטרפו עכשיו — 2 קפה חינם!</Text>
            </Pressable>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    );
  }

  // ── Active ambassador ──
  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      message: `הצטרפו להפסקת קפה! ☕ הורידו את האפליקציה וקבלו משקה ראשון חינם. קוד הזמנה: ${referralCode}`,
    });
  };

  return (
    <Animated.View
      style={[
        styles.activeCard,
        {
          opacity: containerOpacity,
          transform: [{ translateY: containerSlide }],
        },
      ]}
    >
      <View style={{ overflow: 'hidden' }}>
        <LinearGradient
          colors={[colors.accent, colors.gold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.activeHeader}
        >
          {/* Shimmer sweep */}
          <Animated.View
            style={[
              styles.headerShimmer,
              { transform: [{ translateX: shimmerTranslateX }, { skewX: '-20deg' }] },
            ]}
            pointerEvents="none"
          />
          <Crown size={18} color={colors.white} />
          <Text style={styles.activeBadge}>שגריר קפה</Text>
        </LinearGradient>
      </View>

      {/* Referral code */}
      <Animated.View
        style={[
          styles.codeBox,
          {
            opacity: codeFade,
            transform: [{ scale: codeScale }],
          },
        ]}
      >
        <Text style={styles.codeLabel}>קוד ההזמנה שלך</Text>
        <Text style={styles.codeValue}>{referralCode}</Text>
      </Animated.View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Users size={16} color={colors.accent} />
          <Text style={styles.statValue}>{referralCount}</Text>
          <Text style={styles.statLabel}>חברים הצטרפו</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ticket size={16} color={colors.accent} />
          <Text style={styles.statValue}>{activeVouchers}</Text>
          <Text style={styles.statLabel}>קופונים פעילים</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          onPress={handleShare}
        >
          <Share2 size={16} color={colors.white} />
          <Text style={styles.shareBtnText}>שתפו חבר</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.vouchersBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          onPress={() => router.push('/vouchers')}
        >
          <Ticket size={16} color={colors.accent} />
          <Text style={styles.vouchersBtnText}>הקופונים שלי</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  // Locked state
  lockedCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.8,
  },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  lockedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  lockedDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.inactive,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },

  // Join state
  joinCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  joinTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
  },
  joinDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },
  joinBtn: {
    backgroundColor: colors.white,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginTop: 6,
  },
  joinBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },

  // Active state
  activeCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  headerShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  activeBadge: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  codeBox: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  codeValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  vouchersBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accentLight,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vouchersBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
});
