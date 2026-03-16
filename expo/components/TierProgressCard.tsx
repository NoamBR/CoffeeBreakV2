import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Star, Check, Circle } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useUserStore } from '@/stores/userStore';
import { getTier, getTierConfig, getNextTierProgress, getAllTiers } from '@/utils/tiers';

export default function TierProgressCard() {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const totalCoffees = useUserStore((s) => s.user?.totalCoffees ?? 0);
  const tier = getTier(totalCoffees);
  const config = getTierConfig(tier);
  const { nextTier, progress, ordersRemaining } = getNextTierProgress(totalCoffees);
  const allTiers = getAllTiers();

  // ── Animations ──
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const containerSlide = useRef(new Animated.Value(16)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const dotScales = useRef(allTiers.map(() => new Animated.Value(0))).current;
  const perkOpacities = useRef(config.perks.map(() => new Animated.Value(0))).current;

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

    // Staggered dot pop-in
    dotScales.forEach((scale, i) => {
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 6,
        delay: 200 + i * 150,
        useNativeDriver: true,
      }).start();
    });

    // Progress bar fill (non-native for width animation)
    Animated.timing(progressWidth, {
      toValue: progress * 100,
      duration: 1000,
      delay: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Staggered perk reveal
    perkOpacities.forEach((opacity, i) => {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: 800 + i * 100,
        useNativeDriver: true,
      }).start();
    });
  }, [totalCoffees]);

  const progressWidthInterp = progressWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerOpacity,
          transform: [{ translateY: containerSlide }],
        },
      ]}
    >
      {/* Current Tier */}
      <View style={styles.header}>
        <View style={[styles.tierBadge, { backgroundColor: config.color }]}>
          <Star size={16} color={config.textColor} fill={config.textColor} />
          <Text style={[styles.tierName, { color: config.textColor }]}>{config.name}</Text>
        </View>
        <Text style={styles.title}>דרגת VIP</Text>
      </View>

      {/* Progress Dots */}
      <View style={styles.dotsRow}>
        {allTiers.map((t, i) => {
          const isReached = totalCoffees >= t.minOrders;
          return (
            <Animated.View
              key={t.key}
              style={[styles.dotItem, { transform: [{ scale: dotScales[i] }] }]}
            >
              <View
                style={[
                  styles.dot,
                  isReached && {
                    backgroundColor: t.color,
                    borderColor: t.color,
                    // Glow for reached tiers
                    shadowColor: t.color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.4,
                    shadowRadius: 6,
                    elevation: 3,
                  },
                ]}
              >
                {isReached && <Star size={12} color={t.textColor} fill={t.textColor} />}
              </View>
              <Text style={[styles.dotLabel, isReached && styles.dotLabelActive]}>
                {t.name}
              </Text>
              {i < allTiers.length - 1 && (
                <View style={[styles.connector, isReached && styles.connectorActive]} />
              )}
            </Animated.View>
          );
        })}
      </View>

      {/* Progress Bar */}
      {nextTier && (
        <>
          <Text style={styles.progressText}>
            {totalCoffees}/{nextTier.minOrders} הזמנות — עוד {ordersRemaining} ל{nextTier.name}!
          </Text>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidthInterp,
                  backgroundColor: config.color,
                },
              ]}
            />
          </View>
        </>
      )}
      {!nextTier && (
        <Text style={styles.maxTierText}>
          הגעת לפסגה! אתם בדרגה הגבוהה ביותר
        </Text>
      )}

      {/* Current Perks */}
      <Text style={styles.perksTitle}>ההטבות שלך</Text>
      {config.perks.map((perk, i) => (
        <Animated.View
          key={i}
          style={[
            styles.perkRow,
            { opacity: perkOpacities[i] || 1 },
          ]}
        >
          <Text style={styles.perkText}>{perk}</Text>
          <Check size={16} color={colors.success} />
        </Animated.View>
      ))}

      {/* Next Tier Perks */}
      {nextTier && (
        <>
          <Text style={styles.nextPerksTitle}>בדרגת {nextTier.name} תקבלו</Text>
          {nextTier.perks.map((perk, i) => (
            <View key={i} style={styles.perkRow}>
              <Text style={styles.nextPerkText}>{perk}</Text>
              <Circle size={16} color={colors.inactive} />
            </View>
          ))}
        </>
      )}
    </Animated.View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tierName: {
    fontSize: 13,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 0,
    marginBottom: 16,
    position: 'relative',
  },
  dotItem: {
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  dotLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  dotLabelActive: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  connector: {
    position: 'absolute',
    top: 15,
    left: -20,
    width: 40,
    height: 2,
    backgroundColor: colors.border,
  },
  connectorActive: {
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 8,
  },
  maxTierText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.accentLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  perksTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingVertical: 4,
  },
  perkText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  nextPerksTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextPerkText: {
    fontSize: 14,
    color: colors.inactive,
  },
});
