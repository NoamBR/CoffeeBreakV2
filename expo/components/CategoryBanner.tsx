import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { MenuCategory } from '@/types';

type CategoryFilter = MenuCategory | 'favorites';

const categoryBannerImages: Record<CategoryFilter, number> = {
  pastry: require('../assets/social/promo-signature-pastries.png'),
  sandwich: require('../assets/social/promo-sandwich-spread.png'),
  salad: require('../assets/social/promo-green-garden.png'),
  breakfast: require('../assets/social/promo-breakfast-table.png'),
  specials: require('../assets/social/promo-friday-special.png'),
  hot_drinks: require('../assets/social/promo-morning-ritual.png'),
  drinks: require('../assets/social/promo-juice-fresh.png'),
  dessert: require('../assets/social/promo-sweet-treats.png'),
  snacks: require('../assets/social/promo-grab-and-go.png'),
  favorites: require('../assets/social/promo-best-sellers.png'),
};

const categoryLabels: Record<CategoryFilter, string> = {
  pastry: 'מאפים',
  sandwich: 'כריכים',
  salad: 'סלטים',
  breakfast: 'ארוחות בוקר',
  specials: 'ספיישלים',
  hot_drinks: 'קפה ומשקאות',
  drinks: 'שתייה קלה',
  dessert: 'קינוחים',
  snacks: 'נשנושים',
  favorites: 'המועדפים שלך',
};

type Props = {
  category: CategoryFilter;
};

export default function CategoryBanner({ category }: Props) {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const image = categoryBannerImages[category];
  const label = categoryLabels[category];

  return (
    <View style={styles.container}>
      <Image source={image} style={styles.image} contentFit="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.overlay}
      >
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 16,
  },
  label: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
