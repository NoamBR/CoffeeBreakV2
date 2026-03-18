import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '@/lib/secureStorage';
import { Deal } from '@/types';
import { deals as baseDeals } from '@/data/deals';

type DealOverride = Partial<Deal> & { disabled?: boolean };

type DealsOverrideState = {
  overrides: Record<string, DealOverride>;
  customDeals: Deal[];
  setOverride: (dealId: string, changes: DealOverride) => void;
  clearOverride: (dealId: string) => void;
  addDeal: (deal: Deal) => void;
  removeDeal: (dealId: string) => void;
  getEffectiveDeals: () => Deal[];
};

export const useDealsOverrideStore = create<DealsOverrideState>()(
  persist(
    (set, get) => ({
      overrides: {},
      customDeals: [],

      setOverride: (dealId, changes) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            [dealId]: { ...state.overrides[dealId], ...changes },
          },
        })),

      clearOverride: (dealId) =>
        set((state) => {
          const { [dealId]: _, ...rest } = state.overrides;
          return { overrides: rest };
        }),

      addDeal: (deal) =>
        set((state) => ({
          customDeals: [...state.customDeals, deal],
        })),

      removeDeal: (dealId) =>
        set((state) => ({
          customDeals: state.customDeals.filter((d) => d.id !== dealId),
          overrides: (() => {
            const { [dealId]: _, ...rest } = state.overrides;
            return rest;
          })(),
        })),

      getEffectiveDeals: () => {
        const { overrides, customDeals } = get();

        const baseWithOverrides = baseDeals
          .map((deal) => {
            const override = overrides[deal.id];
            if (!override) return deal;
            if (override.disabled) return null;
            return { ...deal, ...override };
          })
          .filter(Boolean) as Deal[];

        const visibleCustom = customDeals.filter((deal) => {
          const override = overrides[deal.id];
          return !override?.disabled;
        });

        return [...baseWithOverrides, ...visibleCustom];
      },
    }),
    {
      name: 'coffeebreak-deals-overrides',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
