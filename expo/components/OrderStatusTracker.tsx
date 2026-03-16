import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ClipboardList, ChefHat, PackageCheck } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import type { OrderStatus } from '@/types';

type Props = {
  status: OrderStatus;
};

const steps = [
  { key: 'placed', label: 'התקבלה', icon: ClipboardList },
  { key: 'preparing', label: 'בהכנה', icon: ChefHat },
  { key: 'ready', label: 'מוכנה!', icon: PackageCheck },
] as const;

function getStepIndex(status: OrderStatus): number {
  if (status === 'placed') return 0;
  if (status === 'preparing') return 1;
  if (status === 'ready' || status === 'completed') return 2;
  return 0;
}

export default function OrderStatusTracker({ status }: Props) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const activeIndex = getStepIndex(status);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = index < activeIndex;
        const isActive = index === activeIndex;
        const Icon = step.icon;

        return (
          <View key={step.key} style={styles.stepWrapper}>
            {/* Connector line */}
            {index > 0 && (
              <View style={[
                styles.connector,
                (isCompleted || isActive) && styles.connectorActive,
              ]} />
            )}

            {/* Step circle */}
            <Animated.View style={[
              styles.stepCircle,
              isCompleted && styles.stepCircleCompleted,
              isActive && styles.stepCircleActive,
              isActive && { transform: [{ scale: pulseAnim }] },
            ]}>
              <Icon
                size={22}
                color={isCompleted || isActive ? colors.white : colors.inactive}
              />
            </Animated.View>

            {/* Label */}
            <Text style={[
              styles.stepLabel,
              (isCompleted || isActive) && styles.stepLabelActive,
              isActive && styles.stepLabelCurrent,
            ]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 0,
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    top: 24,
    right: '50%',
    width: '100%',
    height: 3,
    backgroundColor: colors.border,
    zIndex: -1,
  },
  connectorActive: {
    backgroundColor: colors.success,
  },
  stepCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  stepCircleCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inactive,
    marginTop: 8,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.textPrimary,
  },
  stepLabelCurrent: {
    fontWeight: '800',
    color: colors.primary,
  },
});
