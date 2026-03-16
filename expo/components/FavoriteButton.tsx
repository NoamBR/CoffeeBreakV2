import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useFavoritesStore } from '@/stores/favoritesStore';
import * as Haptics from 'expo-haptics';

type Props = {
  itemId: string;
  size?: number;
};

export default function FavoriteButton({ itemId, size = 22, compact = false }: Props & { compact?: boolean }) {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const favorited = isFavorite(itemId);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(itemId);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={compact ? styles.buttonCompact : styles.button}
      hitSlop={8}
    >
      <Heart
        size={size}
        color={favorited ? colors.error : colors.white}
        fill={favorited ? colors.error : 'transparent'}
        strokeWidth={2}
      />
    </Pressable>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  button: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  buttonCompact: {
    padding: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
