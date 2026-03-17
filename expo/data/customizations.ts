import { MilkType, SugarLevel, DrinkSize, BreadType, FoodExtra, MenuCategory } from '@/types';

export const milkOptions: { value: MilkType; label: string; priceAdd: number }[] = [
  { value: 'regular', label: 'חלב רגיל', priceAdd: 0 },
  { value: 'soy', label: 'חלב סויה', priceAdd: 2 },
  { value: 'oat', label: 'חלב שיבולת שועל', priceAdd: 2 },
  { value: 'almond', label: 'חלב שקדים', priceAdd: 2 },
  { value: 'decaf', label: 'נטול קפאין', priceAdd: 2 },
  { value: 'one_percent', label: 'חלב 1%', priceAdd: 2 },
];

export const sugarOptions: { value: SugarLevel; label: string }[] = [
  { value: 'none', label: 'ללא סוכר' },
  { value: 'half', label: 'חצי סוכר' },
  { value: 'regular', label: 'רגיל' },
  { value: 'extra', label: 'סוכר נוסף' },
];

export const sizeOptions: { value: DrinkSize; label: string; priceAdd: number }[] = [
  { value: 'small', label: 'קטן', priceAdd: 0 },
  { value: 'large', label: 'גדול', priceAdd: 3 },
];

export const breadOptions: { value: BreadType; label: string; priceAdd: number }[] = [
  { value: 'chalah', label: 'חלה', priceAdd: 0 },
  { value: 'picnic', label: 'פיקניק', priceAdd: 2 },
  { value: 'sourdough', label: 'מחמצת', priceAdd: 2 },
  { value: 'croissant', label: 'קרואסון', priceAdd: 2 },
  { value: 'pretzel', label: 'פרצל', priceAdd: 2 },
  { value: 'spelt', label: 'כוסמין', priceAdd: 2 },
];

export const breadLabels: Record<BreadType, string> = {
  chalah: 'חלה',
  picnic: 'פיקניק',
  sourdough: 'מחמצת',
  croissant: 'קרואסון',
  pretzel: 'פרצל',
  spelt: 'כוסמין',
};

export const foodExtras: FoodExtra[] = [
  { id: 'extra-cheese', name: 'תוספת גבינה', price: 5 },
  { id: 'extra-egg', name: 'תוספת ביצה', price: 5 },
  { id: 'extra-avocado', name: 'תוספת אבוקדו', price: 8 },
  { id: 'gluten-free', name: 'לחם ללא גלוטן', price: 5 },
];

export const milkLabels: Record<MilkType, string> = {
  regular: 'חלב רגיל',
  oat: 'שיבולת שועל',
  almond: 'שקדים',
  soy: 'סויה',
  decaf: 'נטול קפאין',
  one_percent: '1%',
};

export const sugarLabels: Record<SugarLevel, string> = {
  none: 'ללא סוכר',
  half: 'חצי סוכר',
  regular: 'רגיל',
  extra: 'סוכר נוסף',
};

export const sizeLabels: Record<DrinkSize, string> = {
  small: 'קטן',
  large: 'גדול',
};

export type CustomizationConfig = {
  showMilk: boolean;
  showSugar: boolean;
  showSize: boolean;
  showBread: boolean;
  showExtras: boolean;
  showNotes: boolean;
};

export function getCustomizationConfig(category: MenuCategory): CustomizationConfig {
  const isDrink = category === 'hot_drinks' || category === 'drinks';
  const isFood = ['sandwich', 'salad', 'breakfast', 'specials'].includes(category);
  const isSandwich = category === 'sandwich';
  return {
    showMilk: isDrink,
    showSugar: isDrink,
    showSize: isDrink,
    showBread: isSandwich,
    showExtras: isFood,
    showNotes: true,
  };
}

export function formatCustomization(customization?: {
  milkType?: MilkType;
  sugarLevel?: SugarLevel;
  size?: DrinkSize;
  breadType?: BreadType;
  extras?: string[];
  notes?: string;
}): string {
  if (!customization) return '';
  const parts: string[] = [];
  if (customization.milkType && customization.milkType !== 'regular') {
    parts.push(milkLabels[customization.milkType]);
  }
  if (customization.sugarLevel && customization.sugarLevel !== 'regular') {
    parts.push(sugarLabels[customization.sugarLevel]);
  }
  if (customization.size === 'large') {
    parts.push('גדול');
  }
  if (customization.breadType && customization.breadType !== 'chalah') {
    parts.push(breadLabels[customization.breadType]);
  }
  if (customization.extras?.length) {
    const extraNames = customization.extras.map(
      (id) => foodExtras.find((e) => e.id === id)?.name ?? id
    );
    parts.push(...extraNames);
  }
  if (customization.notes) {
    parts.push(customization.notes);
  }
  return parts.join(' · ');
}
