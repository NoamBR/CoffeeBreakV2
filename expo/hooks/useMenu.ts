import { useMenuOverrideStore } from '@/stores/menuOverrideStore';
import { menuCategories } from '@/data/menu';
import { MenuItem, MenuCategory } from '@/types';

export function useMenu() {
  const getEffectiveMenu = useMenuOverrideStore((s) => s.getEffectiveMenu);
  const items = getEffectiveMenu();

  const getByCategory = (category: MenuCategory): MenuItem[] =>
    items.filter((item) => item.category === category);

  const getFeatured = (): MenuItem[] =>
    items.filter((item) => item.featured);

  const getById = (id: string): MenuItem | undefined =>
    items.find((item) => item.id === id);

  return { items, categories: menuCategories, getByCategory, getFeatured, getById };
}
