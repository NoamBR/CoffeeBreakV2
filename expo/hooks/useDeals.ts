import { useDealsOverrideStore } from '@/stores/dealsOverrideStore';
import { Deal } from '@/types';

export function useDeals() {
  const getEffectiveDeals = useDealsOverrideStore((s) => s.getEffectiveDeals);
  const deals = getEffectiveDeals();

  const getById = (id: string): Deal | undefined =>
    deals.find((d) => d.id === id);

  const getActive = (): Deal[] =>
    deals.filter((d) => !d.validUntil || new Date(d.validUntil) >= new Date());

  return { deals, getById, getActive };
}
