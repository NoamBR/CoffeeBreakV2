import { View, Text, StyleSheet } from 'react-native';
import { Coffee, Gift, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useUserStore } from '@/stores/userStore';
import { useLoyaltyStore } from '@/stores/loyaltyStore';
import { useStreakStore } from '@/stores/streakStore';

export default function QuickStatsWidget() {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const user = useUserStore((s) => s.user);
  const { totalRewards, stamps, stampsGoal } = useLoyaltyStore();
  const { currentStreak } = useStreakStore();

  const coffees = user?.totalCoffees ?? 0;
  const stampsLeft = stampsGoal - stamps;

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <LinearGradient
            colors={[colors.accentLight, colors.accentLight]}
            style={styles.iconCircle}
          >
            <Coffee size={18} color={colors.accent} />
          </LinearGradient>
          <Text style={styles.statValue}>{coffees}</Text>
          <Text style={styles.statLabel}>כוסות</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <LinearGradient
            colors={[colors.accentLight, colors.accentLight]}
            style={styles.iconCircle}
          >
            <Gift size={18} color={colors.accent} />
          </LinearGradient>
          <Text style={styles.statValue}>{totalRewards}</Text>
          <Text style={styles.statLabel}>מתנות</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <LinearGradient
            colors={[colors.accentLight, colors.accentLight]}
            style={styles.iconCircle}
          >
            <Flame size={18} color={colors.accent} />
          </LinearGradient>
          <Text style={styles.statValue}>{currentStreak}</Text>
          <Text style={styles.statLabel}>סטריק</Text>
        </View>
      </View>
      <LinearGradient
        colors={[colors.accentLight, colors.accentLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.milestoneRow}
      >
        <Text style={styles.milestoneText}>
          {stampsLeft > 0
            ? `עוד ${stampsLeft} חותמות למשקה חינם!`
            : 'יש לך משקה חינם!'}
        </Text>
      </LinearGradient>
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.accent,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  milestoneRow: {
    marginTop: 14,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  milestoneText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
  },
});
