import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Gift, Users, Sparkles, Tag } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { deals } from '@/data/deals';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 80;

const dealIcons = {
  happy_hour: Clock,
  birthday: Gift,
  bring_friend: Users,
  seasonal: Sparkles,
  general: Tag,
};

export default function HeroBanner() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const featuredDeals = deals.slice(0, 3);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      snapToInterval={CARD_WIDTH + 12}
      decelerationRate="fast"
    >
      {featuredDeals.map((deal) => {
        const Icon = dealIcons[deal.type];
        return (
          <Pressable
            key={deal.id}
            style={styles.card}
            onPress={() => router.push(`/deal/${deal.id}`)}
          >
            <LinearGradient
              colors={[colors.primaryDark, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <View style={styles.iconCircle}>
                <Icon size={20} color={colors.primary} />
              </View>
              <Text style={styles.title} numberOfLines={1}>{deal.title}</Text>
              <Text style={styles.subtitle} numberOfLines={2}>{deal.description}</Text>
            </LinearGradient>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradient: {
    padding: 18,
    minHeight: 130,
    justifyContent: 'flex-end',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    alignSelf: 'flex-end',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 12,
    color: colors.overlay,
    textAlign: 'right',
    marginTop: 4,
    lineHeight: 18,
  },
});
