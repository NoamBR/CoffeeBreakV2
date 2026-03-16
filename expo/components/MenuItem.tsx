import { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Plus, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { MenuItem as MenuItemType } from '@/types';
import { formatPrice } from '@/utils/formatPrice';
import { useCartStore } from '@/stores/cartStore';
import FavoriteButton from '@/components/FavoriteButton';

type Props = {
  item: MenuItemType;
};

export default function MenuItemCard({ item }: Props) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const colors = useThemeColors();
  const styles = getStyles(colors);

  // ── Add-to-cart animation state ──
  const [added, setAdded] = useState(false);
  const btnScale = useRef(new Animated.Value(1)).current;
  const addTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQuickAdd = useCallback(() => {
    if (added) return; // prevent double-tap during animation

    addItem(item, 1);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Show checkmark state
    setAdded(true);

    // Bounce animation
    btnScale.setValue(0.6);
    Animated.spring(btnScale, {
      toValue: 1,
      tension: 200,
      friction: 6,
      useNativeDriver: true,
    }).start();

    // Reset after 800ms
    if (addTimeoutRef.current) clearTimeout(addTimeoutRef.current);
    addTimeoutRef.current = setTimeout(() => {
      setAdded(false);
    }, 800);
  }, [added, item]);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={() => router.push(`/menu/${item.id}`)}
    >
      <View style={styles.imageContainer}>
        <Image source={typeof item.image === 'number' ? item.image : { uri: item.image }} style={styles.image} contentFit="cover" />
        <View style={styles.favoriteBtn}>
          <FavoriteButton itemId={item.id} size={14} compact />
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          {item.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>חדש!</Text>
            </View>
          )}
        </View>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <View style={styles.bottomRow}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable
              style={[
                styles.quickAddBtn,
                added && { backgroundColor: colors.success },
              ]}
              onPress={(e) => {
                e.stopPropagation?.();
                handleQuickAdd();
              }}
              hitSlop={6}
            >
              {added ? (
                <Check size={16} color={colors.white} strokeWidth={3} />
              ) : (
                <Plus size={16} color={colors.white} />
              )}
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Pressable>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 110,
  },
  image: {
    width: 100,
    height: 110,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 4,
    left: 4,
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
    flex: 1,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'right',
    lineHeight: 18,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'right',
    flex: 1,
  },
  quickAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
