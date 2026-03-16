import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, Gift, Users, Sparkles, Tag, ChevronLeft } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { Deal } from '@/types';

type Props = {
  deal: Deal;
};

const dealIcons = {
  happy_hour: Clock,
  birthday: Gift,
  bring_friend: Users,
  seasonal: Sparkles,
  general: Tag,
};

export default function DealCard({ deal }: Props) {
  const router = useRouter();
  const Icon = dealIcons[deal.type];
  const colors = useThemeColors();
  const styles = getStyles(colors);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={() => router.push(`/deal/${deal.id}`)}
    >
      <ChevronLeft size={16} color={colors.inactive} />
      <View style={styles.textContent}>
        <Text style={styles.title}>{deal.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{deal.description}</Text>
      </View>
      <View style={styles.iconWrap}>
        <Icon size={22} color={colors.primary} />
      </View>
    </Pressable>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 3,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: 19,
  },
});
