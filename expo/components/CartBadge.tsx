import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';

type Props = {
  count: number;
};

export default function CartBadge({ count }: Props) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevCount = useRef(count);

  useEffect(() => {
    // Bounce when count increases
    if (count > prevCount.current && count > 0) {
      scaleAnim.setValue(1.4);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 150,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
    prevCount.current = count;
  }, [count]);

  if (count <= 0) return null;

  return (
    <Animated.View style={[styles.badge, { transform: [{ scale: scaleAnim }] }]}>
      <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
    </Animated.View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  text: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
