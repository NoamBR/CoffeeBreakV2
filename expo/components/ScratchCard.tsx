import { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Dimensions, PanResponder, Animated, Easing } from 'react-native';
import Svg, { Defs, Mask, Rect, Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Gift, Sparkles } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useLoyaltyStore, prizeLabels, ScratchPrize } from '@/stores/loyaltyStore';

// ── Dimensions ─────────────────────────────
const CARD_WIDTH = Dimensions.get('window').width - 96;
const CARD_HEIGHT = 160;
const SCRATCH_DIAMETER = 48; // smooth brush diameter
const REVEAL_THRESHOLD = 0.45;

// Hidden grid just for coverage estimation (not rendered)
const EST_CELL = 12;
const EST_COLS = Math.ceil(CARD_WIDTH / EST_CELL);
const EST_ROWS = Math.ceil(CARD_HEIGHT / EST_CELL);
const EST_TOTAL = EST_COLS * EST_ROWS;

// ── Confetti ──
const CONFETTI_COUNT = 24;
const CONFETTI_COLORS = ['#1A73E8', '#5B9CF4', '#F5A623', '#FFD700', '#FFFFFF', '#4CAF50'];

function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const startX = Math.random() * (CARD_WIDTH + 40) - 20;

  useEffect(() => {
    const xDrift = (Math.random() - 0.5) * 80;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 300 + Math.random() * 100,
        duration: 1800 + Math.random() * 800,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: xDrift,
        duration: 1800 + Math.random() * 800,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 2000,
        delay: delay + 800,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: Math.random() * 4 - 2,
        duration: 2000,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotateInterp = rotate.interpolate({
    inputRange: [-2, 2],
    outputRange: ['-180deg', '180deg'],
  });

  const size = 6 + Math.random() * 6;
  const isCircle = Math.random() > 0.5;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: -10,
        width: size,
        height: isCircle ? size : size * 2.5,
        borderRadius: isCircle ? size / 2 : 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate: rotateInterp }],
      }}
    />
  );
}

// ── Types for smooth scratch strokes ──
type Point = { x: number; y: number };

export default function ScratchCard() {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const { hasScratchCard, currentPrize, revealScratchCard, dismissScratchCard } =
    useLoyaltyStore();
  const [revealed, setRevealed] = useState(false);
  const [prize, setPrize] = useState<ScratchPrize | null>(null);
  const [scratchStarted, setScratchStarted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const prizeRef = useRef<ScratchPrize | null>(null);
  const hapticCounter = useRef(0);

  // ── Smooth stroke tracking ──
  // Each stroke is an array of points from a single finger gesture
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const strokesRef = useRef<Point[][]>([]);
  const currentStrokeRef = useRef<Point[]>([]);

  // Hidden grid for coverage estimation only
  const coveredRef = useRef<Set<number>>(new Set());
  const [coveragePercent, setCoveragePercent] = useState(0);

  // ── Reveal animations ──
  const revealScale = useRef(new Animated.Value(0.3)).current;
  const revealOpacity = useRef(new Animated.Value(0)).current;
  const giftBounce = useRef(new Animated.Value(0)).current;
  const prizeTextSlide = useRef(new Animated.Value(30)).current;
  const prizeTextOpacity = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(20)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  // ── Card entrance ──
  const cardScale = useRef(new Animated.Value(0.85)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (hasScratchCard) {
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 65,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hasScratchCard]);

  // Roll prize on first render
  if (hasScratchCard && !prizeRef.current && !revealed) {
    prizeRef.current = useLoyaltyStore.getState().revealScratchCard();
    setPrize(prizeRef.current);
  }

  // Mark coverage cells hit by a point (for threshold only — not rendered)
  const markCoverage = useCallback((x: number, y: number) => {
    const radius = SCRATCH_DIAMETER / 2;
    let changed = false;
    for (let r = 0; r < EST_ROWS; r++) {
      for (let c = 0; c < EST_COLS; c++) {
        const cx = c * EST_CELL + EST_CELL / 2;
        const cy = r * EST_CELL + EST_CELL / 2;
        const dx = cx - x;
        const dy = cy - y;
        if (dx * dx + dy * dy < radius * radius) {
          const idx = r * EST_COLS + c;
          if (!coveredRef.current.has(idx)) {
            coveredRef.current.add(idx);
            changed = true;
          }
        }
      }
    }
    return changed;
  }, []);

  // Also fill coverage between two consecutive points (line interpolation)
  const markCoverageLine = useCallback((p1: Point, p2: Point) => {
    const dist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    const steps = Math.ceil(dist / (EST_CELL / 2));
    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 0 : s / steps;
      const x = p1.x + (p2.x - p1.x) * t;
      const y = p1.y + (p2.y - p1.y) * t;
      markCoverage(x, y);
    }
  }, [markCoverage]);

  const addPoint = useCallback((localX: number, localY: number, isStart: boolean) => {
    if (localX < 0 || localY < 0 || localX > CARD_WIDTH || localY > CARD_HEIGHT) return;

    const point: Point = { x: localX, y: localY };

    if (isStart) {
      // Begin a new stroke
      currentStrokeRef.current = [point];
      markCoverage(localX, localY);
    } else {
      // Continue current stroke
      const prev = currentStrokeRef.current;
      if (prev.length > 0) {
        markCoverageLine(prev[prev.length - 1], point);
      } else {
        markCoverage(localX, localY);
      }
      currentStrokeRef.current = [...currentStrokeRef.current, point];
    }

    // Update rendered strokes
    const allStrokes = [...strokesRef.current];
    // Replace or add current stroke
    if (isStart) {
      allStrokes.push([point]);
    } else {
      allStrokes[allStrokes.length - 1] = [...currentStrokeRef.current];
    }
    strokesRef.current = allStrokes;
    setStrokes([...allStrokes]);

    // Coverage & haptics
    const pct = Math.round((coveredRef.current.size / EST_TOTAL) * 100);
    setCoveragePercent(pct);

    hapticCounter.current++;
    if (hapticCounter.current % 4 === 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (coveredRef.current.size / EST_TOTAL >= REVEAL_THRESHOLD) {
      handleReveal();
    }
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        setScratchStarted(true);
        addPoint(e.nativeEvent.locationX, e.nativeEvent.locationY, true);
      },
      onPanResponderMove: (e) => {
        addPoint(e.nativeEvent.locationX, e.nativeEvent.locationY, false);
      },
    })
  ).current;

  // Build smooth SVG path from a list of points
  const buildSmoothPath = (points: Point[]): string => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    // Start at first point
    let d = `M ${points[0].x} ${points[0].y}`;

    if (points.length === 2) {
      d += ` L ${points[1].x} ${points[1].y}`;
      return d;
    }

    // Use quadratic bezier curves through midpoints for smooth interpolation
    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      d += ` Q ${points[i].x} ${points[i].y} ${midX} ${midY}`;
    }

    // Line to last point
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;

    return d;
  };

  const handleReveal = () => {
    if (revealed) return;
    setRevealed(true);
    setShowConfetti(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(revealScale, {
          toValue: 1,
          tension: 80,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(revealOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(giftBounce, {
          toValue: -15,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(giftBounce, {
          toValue: 0,
          tension: 100,
          friction: 4,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.spring(prizeTextSlide, {
          toValue: 0,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(prizeTextOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 400);

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
    }, 700);
  };

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(cardScale, {
        toValue: 0.85,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dismissScratchCard();
      setRevealed(false);
      setPrize(null);
      prizeRef.current = null;
      setStrokes([]);
      strokesRef.current = [];
      currentStrokeRef.current = [];
      coveredRef.current = new Set();
      setCoveragePercent(0);
      setScratchStarted(false);
      setShowConfetti(false);
      hapticCounter.current = 0;
      revealScale.setValue(0.3);
      revealOpacity.setValue(0);
      giftBounce.setValue(0);
      prizeTextSlide.setValue(30);
      prizeTextOpacity.setValue(0);
      btnSlide.setValue(20);
      btnOpacity.setValue(0);
      cardScale.setValue(0.85);
      cardOpacity.setValue(0);
    });
  };

  if (!hasScratchCard) return null;

  return (
    <Modal visible={hasScratchCard} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: cardScale }],
              opacity: cardOpacity,
            },
          ]}
        >
          {/* Confetti layer */}
          {showConfetti && (
            <View style={styles.confettiContainer}>
              {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
                <ConfettiParticle
                  key={i}
                  delay={i * 40}
                  color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
                />
              ))}
            </View>
          )}

          <Sparkles size={36} color={colors.primary} />
          <Text style={styles.heading}>יש לך כרטיס גירוד!</Text>

          {!revealed ? (
            <>
              <Text style={styles.sub}>
                {scratchStarted
                  ? `${coveragePercent}% נגרד — ממשיכים!`
                  : 'העבירו את האצבע כדי לגרד'}
              </Text>

              <View style={styles.scratchContainer} {...panResponder.panHandlers}>
                {/* Prize layer (behind) */}
                <View style={styles.prizeLayer}>
                  <Gift size={36} color={colors.primary} />
                  <Text style={styles.prizeUnderText}>
                    {prize ? prizeLabels[prize] : ''}
                  </Text>
                </View>

                {/* Smooth SVG cover with mask-based scratch */}
                <View style={styles.coverLayer} pointerEvents="none">
                  <Svg width={CARD_WIDTH} height={CARD_HEIGHT}>
                    <Defs>
                      <Mask id="scratchMask">
                        {/* White = cover visible */}
                        <Rect
                          x="0"
                          y="0"
                          width={CARD_WIDTH}
                          height={CARD_HEIGHT}
                          fill="white"
                        />
                        {/* Black strokes = scratched away (smooth!) */}
                        {strokes.map((strokePoints, i) => {
                          if (strokePoints.length === 1) {
                            // Single tap → draw a circle
                            return (
                              <Circle
                                key={`c-${i}`}
                                cx={strokePoints[0].x}
                                cy={strokePoints[0].y}
                                r={SCRATCH_DIAMETER / 2}
                                fill="black"
                              />
                            );
                          }
                          // Multi-point stroke → smooth bezier path
                          const d = buildSmoothPath(strokePoints);
                          return (
                            <Path
                              key={`p-${i}`}
                              d={d}
                              stroke="black"
                              strokeWidth={SCRATCH_DIAMETER}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              fill="none"
                            />
                          );
                        })}
                      </Mask>
                    </Defs>
                    {/* The cover: solid color, masked by scratch strokes */}
                    <Rect
                      x="0"
                      y="0"
                      width={CARD_WIDTH}
                      height={CARD_HEIGHT}
                      fill={colors.primary}
                      mask="url(#scratchMask)"
                    />
                  </Svg>
                </View>

                {/* "Scratch here" hint */}
                {!scratchStarted && (
                  <View style={styles.hintOverlay} pointerEvents="none">
                    <Text style={styles.hintText}>גרדו כאן!</Text>
                    <Text style={styles.hintSub}>מה מסתתר מתחת?</Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <>
              <Animated.View
                style={[
                  styles.revealedPrize,
                  {
                    transform: [
                      { scale: revealScale },
                      { translateY: giftBounce },
                    ],
                    opacity: revealOpacity,
                  },
                ]}
              >
                <Gift size={56} color={colors.primary} />
                <Text style={styles.revealHeading}>זכיתם!</Text>
              </Animated.View>

              <Animated.View
                style={{
                  opacity: prizeTextOpacity,
                  transform: [{ translateY: prizeTextSlide }],
                }}
              >
                <Text style={styles.revealPrizeText}>
                  {prize ? prizeLabels[prize] : ''}
                </Text>
              </Animated.View>

              <Animated.View
                style={{
                  opacity: btnOpacity,
                  transform: [{ translateY: btnSlide }],
                  width: '100%',
                  alignItems: 'center',
                }}
              >
                <Pressable
                  style={({ pressed }) => [styles.dismissBtn, pressed && styles.dismissBtnPressed]}
                  onPress={handleDismiss}
                >
                  <Text style={styles.dismissText}>אחלה, תודה!</Text>
                </Pressable>
              </Animated.View>
            </>
          )}
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
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },

  // ── Scratch area ──
  scratchContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.accentLight,
  },
  prizeLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  prizeUnderText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  coverLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  hintOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  hintSub: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  // ── Revealed state ──
  revealedPrize: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  revealHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  revealPrizeText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  dismissBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginTop: 4,
  },
  dismissBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  dismissText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
});
