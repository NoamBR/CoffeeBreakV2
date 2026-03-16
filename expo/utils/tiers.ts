export type TierKey = 'bronze' | 'silver' | 'gold';

export type TierConfig = {
  key: TierKey;
  name: string;
  minOrders: number;
  color: string;
  textColor: string;
  discount: number;
  perks: string[];
};

const tiers: TierConfig[] = [
  {
    key: 'bronze',
    name: 'ברונזה',
    minOrders: 0,
    color: '#CD7F32',
    textColor: '#FFFFFF',
    discount: 0,
    perks: [
      'חותמות נאמנות — הקפה ה-5 חינם',
      'כרטיס גירוד כל 3 חותמות',
      'מעקב סטריק יומי',
      'מתנת יום הולדת — משקה חינם',
    ],
  },
  {
    key: 'silver',
    name: 'כסף',
    minOrders: 20,
    color: '#A8A9AD',
    textColor: '#FFFFFF',
    discount: 5,
    perks: [
      'כל ההטבות של ברונזה',
      '5% הנחה על כל הזמנה',
      'מתנת יום הולדת כפולה — משקה + מאפה',
      'שדרוג גודל חינם פעם בשבוע',
      'גישה מוקדמת למבצעים',
    ],
  },
  {
    key: 'gold',
    name: 'זהב',
    minOrders: 50,
    color: '#F5A623',
    textColor: '#FFFFFF',
    discount: 10,
    perks: [
      'כל ההטבות של כסף',
      '10% הנחה על כל הזמנה',
      'מאפה חינם כל חודש',
      'תור מועדף — בלי המתנה',
      'הפתעות VIP ומבצעים בלעדיים',
    ],
  },
];

export function getTier(totalOrders: number): TierKey {
  if (totalOrders >= 50) return 'gold';
  if (totalOrders >= 20) return 'silver';
  return 'bronze';
}

export function getTierConfig(tier: TierKey): TierConfig {
  return tiers.find((t) => t.key === tier)!;
}

export function getNextTierProgress(totalOrders: number): {
  currentTier: TierConfig;
  nextTier: TierConfig | null;
  progress: number; // 0-1
  ordersRemaining: number;
} {
  const currentKey = getTier(totalOrders);
  const currentTier = getTierConfig(currentKey);

  if (currentKey === 'gold') {
    return { currentTier, nextTier: null, progress: 1, ordersRemaining: 0 };
  }

  const nextTier = currentKey === 'bronze' ? getTierConfig('silver') : getTierConfig('gold');
  const ordersInTier = totalOrders - currentTier.minOrders;
  const ordersNeeded = nextTier.minOrders - currentTier.minOrders;
  const progress = Math.min(ordersInTier / ordersNeeded, 1);
  const ordersRemaining = nextTier.minOrders - totalOrders;

  return { currentTier, nextTier, progress, ordersRemaining };
}

export function getAllTiers(): TierConfig[] {
  return tiers;
}
