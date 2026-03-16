import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Gift, Users, Sparkles, Tag } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { deals } from '@/data/deals';

const dealIcons = {
  happy_hour: Clock,
  birthday: Gift,
  bring_friend: Users,
  seasonal: Sparkles,
  general: Tag,
};

export default function DealDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deal = deals.find((d) => d.id === id);
  const colors = useThemeColors();
  const styles = getStyles(colors);

  if (!deal) {
    return (
      <View style={styles.center}>
        <Text>מבצע לא נמצא</Text>
      </View>
    );
  }

  const Icon = dealIcons[deal.type];

  return (
    <>
      <Stack.Screen options={{ title: deal.title }} />
      <ScrollView style={styles.wrapper} showsVerticalScrollIndicator={false}>
        {/* Hero header with icon */}
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          style={styles.hero}
        >
          <View style={styles.iconCircle}>
            <Icon size={32} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>{deal.title}</Text>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.description}>{deal.description}</Text>

          {deal.validUntil && (
            <View style={styles.validRow}>
              <Clock size={16} color={colors.textSecondary} />
              <Text style={styles.validText}>
                בתוקף עד {new Date(deal.validUntil).toLocaleDateString('he-IL')}
              </Text>
            </View>
          )}

          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>איך מנצלים?</Text>
            <Text style={styles.tipText}>
              הראו את המסך הזה לצוות שלנו בקופה ותהנו מההטבה!
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
  },
  content: {
    padding: 24,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: 26,
    marginBottom: 20,
  },
  validRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginBottom: 24,
  },
  validText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tipCard: {
    backgroundColor: colors.accentLight,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
    textAlign: 'right',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'right',
    lineHeight: 22,
  },
});
