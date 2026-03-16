import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Flame } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useStreakStore } from '@/stores/streakStore';

const DAY_LABELS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export default function StreakWidget() {
  const { currentStreak, weekDays } = useStreakStore();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const todayIndex = new Date().getDay();

  // ── Animations ──
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flameScale = useRef(new Animated.Value(1)).current;
  const flameRotate = useRef(new Animated.Value(0)).current;
  const dotScales = useRef(DAY_LABELS.map(() => new Animated.Value(0))).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const containerTranslate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    // Entrance fade + slide
    Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(containerTranslate, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered dot entrance — each dot bounces in sequence
    const dotAnimations = dotScales.map((scale, i) =>
      Animated.spring(scale, {
        toValue: 1,
        tension: 120,
        friction: 6,
        delay: i * 60,
        useNativeDriver: true,
      })
    );
    Animated.stagger(60, dotAnimations).start();

    // Pulsing current-day dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Flame flicker — subtle scale + rotation wobble
    if (currentStreak > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(flameScale, {
              toValue: 1.12,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(flameRotate, {
              toValue: 1,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(flameScale, {
              toValue: 0.95,
              duration: 500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(flameRotate, {
              toValue: -1,
              duration: 500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(flameScale, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(flameRotate, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }
  }, [currentStreak]);

  const flameRotateInterpolate = flameRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-4deg', '0deg', '4deg'],
  });

  const daysToBonus = Math.max(0, 7 - currentStreak);

  // ── Micro-copy: Dynamic motivation ──
  let motivationText: string;
  let rewardDesc: string;

  if (currentStreak === 0) {
    motivationText = 'היום מתחילים!';
    rewardDesc = '7 ימים רצופים = חותמת בונוס';
  } else if (currentStreak >= 7) {
    motivationText = 'אלוף! חותמת בונוס בדרך אליך';
    rewardDesc = 'ממשיכים? הסטריק הזה אגדי';
  } else if (daysToBonus === 1) {
    motivationText = 'עוד יום אחד בלבד!';
    rewardDesc = 'מחר מגיע לך בונוס. אל תוותרו';
  } else {
    motivationText = `עוד ${daysToBonus} ימים לבונוס!`;
    rewardDesc = '7 ימים רצופים = חותמת בונוס';
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerOpacity,
          transform: [{ translateY: containerTranslate }],
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.streakText}>
          {currentStreak > 0 ? `${currentStreak} ימים רצופים!` : 'התחילו סטריק!'}
        </Text>
        <Animated.View
          style={{
            transform: [
              { scale: flameScale },
              { rotate: flameRotateInterpolate },
            ],
          }}
        >
          <Flame
            size={22}
            color={currentStreak > 0 ? colors.gold : colors.inactive}
            fill={currentStreak >= 7 ? colors.gold : 'transparent'}
          />
        </Animated.View>
      </View>

      <View style={styles.dotsRow}>
        {DAY_LABELS.map((label, i) => {
          const isFilled = weekDays[i];
          const isToday = i === todayIndex;
          const dotScale = isToday && !isFilled ? pulseAnim : dotScales[i];

          return (
            <Animated.View
              key={i}
              style={[styles.dotCol, { transform: [{ scale: dotScale }] }]}
            >
              <View
                style={[
                  styles.dot,
                  isFilled && styles.dotFilled,
                  isToday && !isFilled && styles.dotCurrent,
                  // Glow effect for today's filled dot
                  isToday && isFilled && styles.dotTodayFilled,
                ]}
              >
                {isFilled && <Text style={styles.dotCheck}>✓</Text>}
              </View>
              <Text
                style={[
                  styles.dayLabel,
                  isToday && styles.dayLabelToday,
                  isFilled && styles.dayLabelFilled,
                ]}
              >
                {label}
              </Text>
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.motivationRow}>
        <Text style={styles.motivationText}>{motivationText}</Text>
        <Text style={styles.rewardDesc}>{rewardDesc}</Text>
      </View>
    </Animated.View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginBottom: 14,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  dotCol: {
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotCurrent: {
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  dotTodayFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  dotCheck: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '700',
  },
  dayLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  dayLabelToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  dayLabelFilled: {
    fontWeight: '700',
  },
  motivationRow: {
    alignItems: 'flex-end',
  },
  motivationText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rewardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
