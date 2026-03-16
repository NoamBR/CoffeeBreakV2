import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { ShoppingCart } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { menuItems } from '@/data/menu';
import { formatPrice } from '@/utils/formatPrice';
import FavoriteButton from '@/components/FavoriteButton';
import CustomizationModal from '@/components/CustomizationModal';

export default function MenuItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = menuItems.find((m) => m.id === id);
  const [customizeVisible, setCustomizeVisible] = useState(false);
  const colors = useThemeColors();
  const styles = getStyles(colors);

  if (!item) {
    return (
      <View style={styles.center}>
        <Text>פריט לא נמצא</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: item.name }} />
      <ScrollView style={styles.wrapper} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={typeof item.image === 'number' ? item.image : { uri: item.image }} style={styles.image} contentFit="cover" />
          <View style={styles.favoriteBtn}>
            <FavoriteButton itemId={item.id} size={24} />
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{item.name}</Text>
            {item.nameEn && <Text style={styles.nameEn}>{item.nameEn}</Text>}
          </View>

          <View style={styles.badges}>
            {item.isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.badgeText}>חדש!</Text>
              </View>
            )}
            {item.featured && (
              <View style={styles.featuredBadge}>
                <Text style={styles.badgeText}>מומלץ</Text>
              </View>
            )}
          </View>

          <Text style={styles.description}>{item.description}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Add to cart button */}
      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [styles.addToCartBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          onPress={() => setCustomizeVisible(true)}
        >
          <ShoppingCart size={20} color={colors.white} />
          <Text style={styles.addToCartText}>הוסף לעגלה</Text>
        </Pressable>
      </View>

      <CustomizationModal
        item={item}
        visible={customizeVisible}
        onClose={() => setCustomizeVisible(false)}
      />
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
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 280,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  content: {
    padding: 24,
  },
  titleRow: {
    marginBottom: 8,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  nameEn: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'flex-end',
  },
  newBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredBadge: {
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: 24,
    marginBottom: 24,
  },
  priceRow: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    paddingBottom: 32,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
  },
  addToCartText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
