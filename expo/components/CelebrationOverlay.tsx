import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { Gift, Star, Coffee, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';

type CelebrationType = 'reward' | 'tier_up' | 'scratch_card' | 'streak';

type Props = {
  type: CelebrationType;
  title: string;
  subtitle: string;
  onDismiss: () => void;
};

const { width, height } = Dimensions.get('window');

const iconMap = {
  reward: Coffee,
  tier_up: Star,
  scratch_card: Gift,
  streak: Sparkles,
};

const colorMap = {
  reward: '#4CAF50',
  tier_up: '#F5A623',
  scratch_card: '#C8872B',
  streak: '#FF6B35',
};

// Simple confetti particle
function ConfettiParticle({ delay, x }: { delay: number; x: number }) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, { toValue: height * 0.7, duration: 2000, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.delay(1400),
          Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
        Animated.timing(rotate, { toValue: 3, duration: 2000, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94', '#C8872B'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        opacity,
        transform: [
          { translateY },
          { rotate: rotate.interpolate({ inputRange: [0, 3], outputRange: ['0deg', '1080deg'] }) },
        ],
      }}
    />
  );
}

export default function CelebrationOverlay({ type, title, subtitle, onDismiss }: Props) {
  const colors = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const Icon = iconMap[type];
  const accentColor = colorMap[type];

  useEffect(() => {
    // Haptic celebration
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 400);

    Animated.parallel([
      Animated.timing(bgOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 5, useNativeDriver: true }),
    ]).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(bgOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  // Generate confetti particles
  const confetti = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: Math.random() * 500,
    x: Math.random() * width,
  }));

  return (
    <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>
      {/* Confetti */}
      {confetti.map((c) => (
        <ConfettiParticle key={c.id} delay={c.delay} x={c.x} />
      ))}

      <Pressable style={styles.touchArea} onPress={dismiss}>
        <Animated.View style={[
          styles.card,
          { transform: [{ scale: scaleAnim }] },
        ]}>
          <View style={[styles.iconCircle, { backgroundColor: accentColor }]}>
            <Icon size={40} color="#FFFFFF" />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          <Text style={[styles.tapHint, { color: colors.inactive }]}>לחצו להמשך</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 100,
  },
  touchArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  tapHint: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },
});
