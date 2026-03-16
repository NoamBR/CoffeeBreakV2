import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FavoritesState = {
  favoriteIds: string[];
  toggleFavorite: (itemId: string) => void;
  isFavorite: (itemId: string) => boolean;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],

      toggleFavorite: (itemId) => {
        const { favoriteIds } = get();
        if (favoriteIds.includes(itemId)) {
          set({ favoriteIds: favoriteIds.filter((id) => id !== itemId) });
        } else {
          set({ favoriteIds: [...favoriteIds, itemId] });
        }
      },

      isFavorite: (itemId) => get().favoriteIds.includes(itemId),
    }),
    {
      name: 'coffeebreak-favorites',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
