import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { deals } from '@/data/deals';
import { resolveImageSource } from '@/utils/resolveAsset';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 80;

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
      {featuredDeals.map((deal) => (
        <Pressable
          key={deal.id}
          style={styles.card}
          onPress={() => router.push(`/deal/${deal.id}`)}
        >
          {deal.image ? (
            <>
              <Image
                source={resolveImageSource(deal.image)}
                style={styles.cardImage}
                contentFit="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.75)']}
                style={styles.cardOverlay}
              >
                <Text style={styles.title} numberOfLines={1}>{deal.title}</Text>
                <Text style={styles.subtitle} numberOfLines={2}>{deal.description}</Text>
              </LinearGradient>
            </>
          ) : (
            <LinearGradient
              colors={[colors.primaryDark, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fallbackGradient}
            >
              <Text style={styles.title} numberOfLines={1}>{deal.title}</Text>
              <Text style={styles.subtitle} numberOfLines={2}>{deal.description}</Text>
            </LinearGradient>
          )}
        </Pressable>
      ))}
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
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 18,
  },
  fallbackGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'right',
    marginTop: 4,
    lineHeight: 18,
  },
});
