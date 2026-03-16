import { View, Text, StyleSheet } from 'react-native';
import { Coffee, Award } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useLoyaltyStore } from '@/stores/loyaltyStore';

type Props = {
  compact?: boolean;
};

export default function LoyaltyCard({ compact = false }: Props) {
  const { stamps, stampsGoal, totalRewards } = useLoyaltyStore();
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const cups = Array.from({ length: stampsGoal }, (_, i) => i);
  const progress = (stamps / stampsGoal) * 100;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <LinearGradient
            colors={[colors.accentLight, colors.accentLight]}
            style={styles.titleIcon}
          >
            <Award size={16} color={colors.accent} />
          </LinearGradient>
          <Text style={styles.title}>כרטיס נאמנות</Text>
        </View>
        {totalRewards > 0 && (
          <LinearGradient
            colors={[colors.accent, colors.gold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rewardBadge}
          >
            <Text style={styles.rewardBadgeText}>{totalRewards} מתנות</Text>
          </LinearGradient>
        )}
      </View>

      {/* Stamps row */}
      <View style={styles.stampsRow}>
        {cups.map((i) => (
          <View key={i} style={compact ? styles.stampWrapCompact : styles.stampWrap}>
            {i < stamps ? (
              <LinearGradient
                colors={colors.stampGradient}
                style={[styles.stamp, compact && styles.stampCompact]}
              >
                <Coffee
                  size={compact ? 16 : 20}
                  color={colors.white}
                />
              </LinearGradient>
            ) : (
              <View style={[styles.stamp, styles.stampEmpty, compact && styles.stampCompact]}>
                <Coffee
                  size={compact ? 16 : 20}
                  color={colors.inactive}
                />
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Progress section */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={[colors.gold, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${progress}%` }]}
          />
        </View>
        <LinearGradient
          colors={[colors.accentLight, colors.accentLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.progressLabel}
        >
          <Text style={styles.progressText}>
            {stamps}/{stampsGoal} — עוד {stampsGoal - stamps} עד למשקה חינם!
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  containerCompact: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  rewardBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  rewardBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  stampsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  stampWrap: {},
  stampWrapCompact: {},
  stamp: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampEmpty: {
    backgroundColor: colors.accentLight,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  stampCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  progressSection: {
    gap: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
  },
});
