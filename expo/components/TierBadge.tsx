import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Star } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { getTier, getTierConfig } from '@/utils/tiers';
import { useUserStore } from '@/stores/userStore';

type Props = {
  size?: 'small' | 'normal';
};

export default function TierBadge({ size = 'normal' }: Props) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const totalCoffees = useUserStore((s) => s.user?.totalCoffees ?? 0);
  const tier = getTier(totalCoffees);
  const config = getTierConfig(tier);
  const isSmall = size === 'small';

  // ── Shine sweep animation ──
  const shinePosition = useRef(new Animated.Value(-1)).current;
  const entranceScale = useRef(new Animated.Value(0.8)).current;
  const entranceOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance pop
    Animated.parallel([
      Animated.spring(entranceScale, {
        toValue: 1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(entranceOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Repeating shine sweep (every 4 seconds)
    Animated.loop(
      Animated.sequence([
        Animated.delay(4000),
        Animated.timing(shinePosition, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shinePosition, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const shineTranslateX = shinePosition.interpolate({
    inputRange: [-1, 1],
    outputRange: [-60, 120],
  });

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: config.color },
        isSmall && styles.badgeSmall,
        {
          transform: [{ scale: entranceScale }],
          opacity: entranceOpacity,
        },
      ]}
    >
      {/* Shine overlay */}
      <Animated.View
        style={[
          styles.shine,
          {
            transform: [{ translateX: shineTranslateX }, { skewX: '-20deg' }],
          },
        ]}
        pointerEvents="none"
      />

      <Star size={isSmall ? 12 : 14} color={config.textColor} fill={config.textColor} />
      <Text style={[styles.text, { color: config.textColor }, isSmall && styles.textSmall]}>
        {config.name}
      </Text>
    </Animated.View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 11,
  },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: colors.overlay,
  },
});
