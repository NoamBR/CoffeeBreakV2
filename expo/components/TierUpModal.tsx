import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Animated, Easing, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Star, Check } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { TierConfig } from '@/utils/tiers';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ── Confetti ──
const CONFETTI_COUNT = 30;

function ConfettiPiece({ delay, color }: { delay: number; color: string }) {
  const translateY = useRef(new Animated.Value(-30)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const startX = Math.random() * SCREEN_WIDTH * 0.8;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 350 + Math.random() * 150,
        duration: 2200 + Math.random() * 800,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: (Math.random() - 0.5) * 100,
        duration: 2200,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 2500,
        delay: delay + 600,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: Math.random() * 6 - 3,
        duration: 2500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const size = 5 + Math.random() * 7;
  const isCircle = Math.random() > 0.5;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: -15,
        width: size,
        height: isCircle ? size : size * 2.5,
        borderRadius: isCircle ? size / 2 : 2,
        backgroundColor: color,
        opacity,
        transform: [
          { translateY },
          { translateX },
          {
            rotate: rotate.interpolate({
              inputRange: [-3, 3],
              outputRange: ['-270deg', '270deg'],
            }),
          },
        ],
      }}
    />
  );
}

type Props = {
  visible: boolean;
  tier: TierConfig | null;
  onDismiss: () => void;
};

export default function TierUpModal({ visible, tier, onDismiss }: Props) {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  // ── Animations ──
  const cardScale = useRef(new Animated.Value(0.5)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const headingOpacity = useRef(new Animated.Value(0)).current;
  const headingSlide = useRef(new Animated.Value(20)).current;
  const perkOpacities = useRef<Animated.Value[]>([]).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(15)).current;

  // Ensure enough perk animated values
  const perks = tier?.perks ?? [];
  while (perkOpacities.length < perks.length) {
    perkOpacities.push(new Animated.Value(0));
  }

  useEffect(() => {
    if (!visible || !tier) return;

    // Reset all
    cardScale.setValue(0.5);
    cardOpacity.setValue(0);
    iconScale.setValue(0);
    iconRotate.setValue(0);
    headingOpacity.setValue(0);
    headingSlide.setValue(20);
    btnOpacity.setValue(0);
    btnSlide.setValue(15);
    perkOpacities.forEach((o) => o.setValue(0));

    // 1. Card bounces in
    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 65,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Icon spins + scales (celebration)
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 80,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(iconRotate, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    // 3. Heading slides in
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(headingSlide, {
          toValue: 0,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(headingOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 500);

    // 4. Perks cascade in
    perks.forEach((_, i) => {
      setTimeout(() => {
        Animated.timing(perkOpacities[i], {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }, 800 + i * 120);
    });

    // 5. Button appears last
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(btnSlide, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(btnOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 800 + perks.length * 120 + 100);
  }, [visible, tier]);

  if (!tier) return null;

  const iconRotateInterp = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const confettiColors = [tier.color, '#F5A623', '#FFD700', '#1A73E8', '#FFFFFF', '#4CAF50'];

  const handleDismiss = () => {
    // Exit animation
    Animated.parallel([
      Animated.timing(cardScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Confetti */}
        <View style={styles.confettiLayer}>
          {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
            <ConfettiPiece
              key={i}
              delay={i * 50}
              color={confettiColors[i % confettiColors.length]}
            />
          ))}
        </View>

        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: cardScale }],
              opacity: cardOpacity,
            },
          ]}
        >
          {/* Tier Icon */}
          <Animated.View
            style={[
              styles.iconCircle,
              { backgroundColor: tier.color },
              {
                transform: [
                  { scale: iconScale },
                  { rotate: iconRotateInterp },
                ],
              },
            ]}
          >
            <Star size={40} color={tier.textColor} fill={tier.textColor} />
          </Animated.View>

          {/* Heading */}
          <Animated.View
            style={{
              opacity: headingOpacity,
              transform: [{ translateY: headingSlide }],
              alignItems: 'center',
            }}
          >
            <Text style={styles.heading}>מזל טוב!</Text>
            <Text style={styles.subheading}>עליתם לדרגת {tier.name}!</Text>
          </Animated.View>

          {/* Perks */}
          <View style={styles.perks}>
            <Text style={styles.perksTitle}>ההטבות החדשות שלכם:</Text>
            {perks.map((perk, i) => (
              <Animated.View
                key={i}
                style={[styles.perkRow, { opacity: perkOpacities[i] || 0 }]}
              >
                <Text style={styles.perkText}>{perk}</Text>
                <Check size={16} color={colors.success} />
              </Animated.View>
            ))}
          </View>

          {/* CTA */}
          <Animated.View
            style={{
              opacity: btnOpacity,
              transform: [{ translateY: btnSlide }],
            }}
          >
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: tier.color },
                pressed && styles.btnPressed,
              ]}
              onPress={handleDismiss}
            >
              <Text style={[styles.btnText, { color: tier.textColor }]}>יאללה, קדימה!</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  perks: {
    width: '100%',
    marginBottom: 20,
  },
  perksTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingVertical: 4,
  },
  perkText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  btnText: {
    fontSize: 18,
    fontWeight: '800',
  },
});
