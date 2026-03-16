import { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { PackageCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useOrderHistoryStore } from '@/stores/orderHistoryStore';
import type { ColorScheme } from '@/constants/colors';

export default function OrderReadyBanner() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const router = useRouter();
  const fullOrders = useOrderHistoryStore((s) => s.fullOrders);
  const readyOrders = useMemo(
    () => fullOrders.filter((o) => o.status === 'ready'),
    [fullOrders]
  );
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (readyOrders.length > 0) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Pulse
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();

      // Haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 200);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 400);

      return () => pulse.stop();
    } else {
      slideAnim.setValue(-100);
    }
  }, [readyOrders.length]);

  if (readyOrders.length === 0) return null;

  const latestReady = readyOrders[0];

  return (
    <Animated.View style={[
      styles.banner,
      { transform: [{ translateY: slideAnim }, { scale: pulseAnim }] },
    ]}>
      <Pressable
        style={styles.bannerContent}
        onPress={() => router.push({ pathname: '/order-track', params: { orderId: latestReady.id } })}
      >
        <View style={styles.iconCircle}>
          <PackageCheck size={22} color="#FFFFFF" />
        </View>
        <View style={styles.textSection}>
          <Text style={styles.bannerTitle}>ההזמנה מוכנה!</Text>
          <Text style={styles.bannerSub}>
            הזמנה {latestReady.id} מחכה לכם
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  banner: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bannerSub: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
});
