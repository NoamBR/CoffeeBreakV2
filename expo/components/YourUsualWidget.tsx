import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Zap, Coffee } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useOrderHistoryStore } from '@/stores/orderHistoryStore';
import { useCartStore } from '@/stores/cartStore';
import { menuItems } from '@/data/menu';
import { formatPrice } from '@/utils/formatPrice';
import type { ColorScheme } from '@/constants/colors';

export default function YourUsualWidget() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const usual = useOrderHistoryStore((s) => s.getUsual());
  const addItem = useCartStore((s) => s.addItem);

  // Animations
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const containerSlide = useRef(new Animated.Value(20)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const zapRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide-in entrance (runs for both states)
    Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(containerSlide, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    if (!usual) return;

    // Subtle zap icon pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(zapRotate, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(zapRotate, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [usual]);

  const menuItem = usual ? menuItems.find((m) => m.id === usual.itemId) : null;

  const handlePressIn = () => {
    Animated.spring(btnScale, {
      toValue: 0.92,
      tension: 200,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(btnScale, {
      toValue: 1,
      tension: 200,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const handleOrder = () => {
    if (!menuItem) return;
    addItem(menuItem, 1);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/cart');
  };

  const zapRotateInterpolate = zapRotate.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '-8deg', '0deg'],
  });

  // Empty state — no usual yet
  if (!usual || !menuItem) {
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
        <Text style={styles.sectionTitle}>הרגיל שלך</Text>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <Coffee size={28} color={colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>עדיין אין לך קפה קבוע?</Text>
          <Text style={styles.emptySubtitle}>הזמינו ונזכור בשבילכם</Text>
          <Pressable
            style={styles.emptyBtn}
            onPress={() => router.push('/(tabs)/menu')}
          >
            <Text style={styles.emptyBtnText}>לתפריט</Text>
            <Coffee size={16} color={colors.white} />
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  const image = menuItem.image;

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
      <Text style={styles.sectionTitle}>הרגיל שלך</Text>
      <View style={styles.card}>
        <View style={styles.cardTop}>
          {image && (
            <Image
              source={typeof image === 'number' ? image : { uri: image }}
              style={styles.thumb}
              contentFit="cover"
            />
          )}
          <View style={styles.info}>
            <Text style={styles.itemName}>{usual.itemName}</Text>
            {usual.customizations && (
              <Text style={styles.customizations}>{usual.customizations}</Text>
            )}
            <Text style={styles.price}>{formatPrice(usual.price)}</Text>
          </View>
        </View>
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable
            style={styles.orderBtn}
            onPress={handleOrder}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Animated.View style={{ transform: [{ rotate: zapRotateInterpolate }] }}>
              <Zap size={18} color={colors.white} fill={colors.white} />
            </Animated.View>
            <Text style={styles.orderBtnText}>הזמינו עכשיו</Text>
          </Pressable>
        </Animated.View>
      </View>
      <Text style={styles.hint}>לחצו והקפה כבר בדרך</Text>
    </Animated.View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  // Hero card
  card: {
    backgroundColor: colors.accentLight,
    borderRadius: 18,
    padding: 20,
    gap: 16,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  info: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  customizations: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  price: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.accent,
    marginTop: 4,
  },
  orderBtn: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  orderBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  hint: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  // Empty state
  emptyCard: {
    backgroundColor: colors.accentLight,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});
