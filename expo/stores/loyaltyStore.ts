import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoyaltyCard, StampEvent } from '@/types';
import { useReferralStore } from './referralStore';

export type ScratchPrize = 'bonus_stamp' | 'discount_10' | 'free_upgrade' | 'free_pastry';

export const prizeLabels: Record<ScratchPrize, string> = {
  bonus_stamp: 'חותמת בונוס!',
  discount_10: '10% הנחה על ההזמנה הבאה!',
  free_upgrade: 'שדרוג גודל חינם!',
  free_pastry: 'מאפה חינם!',
};

type LoyaltyState = LoyaltyCard & {
  totalStampsEver: number;
  hasScratchCard: boolean;
  currentPrize: ScratchPrize | null;
  prizes: ScratchPrize[];
  addStamp: () => boolean; // returns true if reward earned
  claimReward: () => void;
  revealScratchCard: () => ScratchPrize;
  dismissScratchCard: () => void;
};

const STAMPS_GOAL = 5;

function rollPrize(): ScratchPrize {
  const roll = Math.random();
  if (roll < 0.4) return 'bonus_stamp';
  if (roll < 0.7) return 'discount_10';
  if (roll < 0.9) return 'free_upgrade';
  return 'free_pastry';
}

export const useLoyaltyStore = create<LoyaltyState>()(
  persist(
    (set, get) => ({
      stamps: 0,
      totalRewards: 0,
      stampsGoal: STAMPS_GOAL,
      history: [],
      totalStampsEver: 0,
      hasScratchCard: false,
      currentPrize: null,
      prizes: [],

      addStamp: () => {
        const { stamps, stampsGoal, totalStampsEver } = get();
        const newStamps = stamps + 1;
        const newTotalStamps = totalStampsEver + 1;
        const event: StampEvent = {
          date: new Date().toISOString(),
          type: 'stamp',
        };

        // Check if scratch card should be awarded (every 3rd stamp)
        const shouldAwardScratch = newTotalStamps % 3 === 0;

        if (newStamps >= stampsGoal) {
          set((state) => ({
            stamps: 0,
            totalRewards: state.totalRewards + 1,
            totalStampsEver: newTotalStamps,
            hasScratchCard: shouldAwardScratch || state.hasScratchCard,
            history: [...state.history, event, { date: new Date().toISOString(), type: 'reward_claimed' }],
          }));
          // Create voucher for free coffee reward
          useReferralStore.getState().addVoucher('free_coffee', 'קפה חינם — כרטיס נאמנות', 'קפה חינם! אספת 5 חותמות בכרטיס הנאמנות.');
          return true;
        }

        set((state) => ({
          stamps: newStamps,
          totalStampsEver: newTotalStamps,
          hasScratchCard: shouldAwardScratch || state.hasScratchCard,
          history: [...state.history, event],
        }));
        return false;
      },

      claimReward: () => {
        set((state) => ({
          totalRewards: Math.max(0, state.totalRewards - 1),
        }));
      },

      revealScratchCard: () => {
        const prize = rollPrize();
        set((state) => ({
          currentPrize: prize,
          prizes: [...state.prizes, prize],
        }));
        // Create voucher for redeemable prizes
        const voucherStore = useReferralStore.getState();
        if (prize === 'discount_10') {
          voucherStore.addVoucher('discount_percent', '10% הנחה — כרטיס גירוד', 'זכית ב-10% הנחה מכרטיס גירוד!', 10);
        } else if (prize === 'free_upgrade') {
          voucherStore.addVoucher('free_upgrade', 'שדרוג גודל — כרטיס גירוד', 'זכית בשדרוג גודל חינם מכרטיס גירוד!');
        } else if (prize === 'free_pastry') {
          voucherStore.addVoucher('free_pastry', 'מאפה חינם — כרטיס גירוד', 'זכית במאפה חינם מכרטיס גירוד!');
        }
        // Auto-apply bonus stamp
        if (prize === 'bonus_stamp') {
          const { stamps, stampsGoal } = get();
          if (stamps + 1 >= stampsGoal) {
            set((state) => ({
              stamps: 0,
              totalRewards: state.totalRewards + 1,
            }));
          } else {
            set((state) => ({ stamps: state.stamps + 1 }));
          }
        }
        return prize;
      },

      dismissScratchCard: () => {
        set({ hasScratchCard: false, currentPrize: null });
      },
    }),
    {
      name: 'coffeebreak-loyalty',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
