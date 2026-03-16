import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';
import { LightColors, DarkColors, type ColorScheme } from '@/constants/colors';

export function useThemeColors(): ColorScheme {
  const preference = useThemeStore((s) => s.preference);
  return preference === 'dark' ? DarkColors : LightColors;
}
