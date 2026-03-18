import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '@/lib/secureStorage';
import { MenuItem } from '@/types';
import { menuItems as baseMenuItems } from '@/data/menu';

type MenuOverride = Partial<MenuItem> & { hidden?: boolean };

type MenuOverrideState = {
  overrides: Record<string, MenuOverride>;
  customItems: MenuItem[];
  setOverride: (itemId: string, changes: MenuOverride) => void;
  clearOverride: (itemId: string) => void;
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  getEffectiveMenu: () => MenuItem[];
};

export const useMenuOverrideStore = create<MenuOverrideState>()(
  persist(
    (set, get) => ({
      overrides: {},
      customItems: [],

      setOverride: (itemId, changes) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            [itemId]: { ...state.overrides[itemId], ...changes },
          },
        })),

      clearOverride: (itemId) =>
        set((state) => {
          const { [itemId]: _, ...rest } = state.overrides;
          return { overrides: rest };
        }),

      addItem: (item) =>
        set((state) => ({
          customItems: [...state.customItems, item],
        })),

      removeItem: (itemId) =>
        set((state) => ({
          customItems: state.customItems.filter((i) => i.id !== itemId),
          overrides: (() => {
            const { [itemId]: _, ...rest } = state.overrides;
            return rest;
          })(),
        })),

      getEffectiveMenu: () => {
        const { overrides, customItems } = get();

        const baseWithOverrides = baseMenuItems
          .map((item) => {
            const override = overrides[item.id];
            if (!override) return item;
            if (override.hidden) return null;
            return { ...item, ...override };
          })
          .filter(Boolean) as MenuItem[];

        const visibleCustom = customItems.filter((item) => {
          const override = overrides[item.id];
          return !override?.hidden;
        });

        return [...baseWithOverrides, ...visibleCustom];
      },
    }),
    {
      name: 'coffeebreak-menu-overrides',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
