import storeInfo from '@/data/storeInfo';
import { DayHours } from '@/types';

const dayMap: Record<number, keyof typeof storeInfo.hours> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

export function getTodayHours(): DayHours {
  const dayIndex = new Date().getDay();
  return storeInfo.hours[dayMap[dayIndex]];
}

export function isStoreOpen(): boolean {
  return true; // 24/7
}

export function getStatusText(): string {
  return 'פתוח 24/7';
}
