import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '@/lib/secureStorage';

type StreakState = {
  currentStreak: number;
  longestStreak: number;
  lastOrderDate: string; // YYYY-MM-DD
  weekDays: boolean[]; // 7 booleans, Sun-Sat
  recordOrder: () => { milestone: number | null };
};

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function getCurrentDayIndex(): number {
  return new Date().getDay(); // 0=Sun, 6=Sat
}

function getWeekStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay()); // Go to Sunday
  return d.toISOString().split('T')[0];
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      currentStreak: 0,
      longestStreak: 0,
      lastOrderDate: '',
      weekDays: [false, false, false, false, false, false, false],

      recordOrder: () => {
        const today = getToday();
        const { lastOrderDate, currentStreak, longestStreak, weekDays } = get();

        // Already counted today
        if (lastOrderDate === today) {
          return { milestone: null };
        }

        let newStreak: number;
        if (lastOrderDate === getYesterday()) {
          newStreak = currentStreak + 1;
        } else {
          newStreak = 1;
        }

        const newLongest = Math.max(longestStreak, newStreak);

        // Update week days — reset if new week
        const dayIndex = getCurrentDayIndex();
        let newWeekDays = [...weekDays];

        // Reset week if today is Sunday and last order was before this week
        if (dayIndex === 0 && lastOrderDate < getWeekStart()) {
          newWeekDays = [false, false, false, false, false, false, false];
        }
        newWeekDays[dayIndex] = true;

        set({
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastOrderDate: today,
          weekDays: newWeekDays,
        });

        // Check milestones
        let milestone: number | null = null;
        if (newStreak === 3 || newStreak === 7 || newStreak === 14) {
          milestone = newStreak;
        }

        return { milestone };
      },
    }),
    {
      name: 'coffeebreak-streak',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
