import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { menuItems, menuCategories } from '@/data/menu';
import MenuItemCard from '@/components/MenuItem';
import MenuSearchBar from '@/components/MenuSearchBar';
import { MenuCategory } from '@/types';
import { useFavoritesStore } from '@/stores/favoritesStore';
import type { ColorScheme } from '@/constants/colors';

type CategoryFilter = MenuCategory | 'favorites';

export default function MenuScreen() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('pastry');
  const [searchText, setSearchText] = useState('');
  const { favoriteIds } = useFavoritesStore();

  const filteredItems = useMemo(() => {
    let items = menuItems;

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.nameEn && item.nameEn.toLowerCase().includes(q))
      );
      return items;
    }

    if (activeCategory === 'favorites') {
      return items.filter((item) => favoriteIds.includes(item.id));
    }

    return items.filter((item) => item.category === activeCategory);
  }, [activeCategory, searchText, favoriteIds]);

  return (
    <View style={styles.wrapper}>
      <MenuSearchBar value={searchText} onChangeText={setSearchText} />

      {!searchText.trim() && (
        <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          <Pressable
            style={[styles.categoryTab, activeCategory === 'favorites' && styles.categoryTabActive]}
            onPress={() => setActiveCategory('favorites')}
          >
            <View style={styles.favTabContent}>
              <Heart
                size={14}
                color={activeCategory === 'favorites' ? colors.white : colors.error}
                fill={activeCategory === 'favorites' ? colors.white : colors.error}
              />
              <Text
                style={[
                  styles.categoryTabText,
                  activeCategory === 'favorites' && styles.categoryTabTextActive,
                ]}
              >
                מועדפים
              </Text>
            </View>
          </Pressable>

          {menuCategories.map((cat) => (
            <Pressable
              key={cat.key}
              style={[styles.categoryTab, activeCategory === cat.key && styles.categoryTabActive]}
              onPress={() => setActiveCategory(cat.key)}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  activeCategory === cat.key && styles.categoryTabTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        </View>
      )}

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <MenuItemCard item={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchText.trim()
              ? 'לא נמצאו תוצאות'
              : activeCategory === 'favorites'
                ? 'אין מועדפים עדיין — לחצו על ❤ כדי להוסיף'
                : 'אין פריטים בקטגוריה זו'}
          </Text>
        }
      />
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 14,
  },
  categoriesWrapper: {
    flexShrink: 0,
  },
  categories: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryTabActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  categoryTabTextActive: {
    color: colors.white,
  },
  favTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  separator: {
    height: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 40,
    fontSize: 16,
  },
});
