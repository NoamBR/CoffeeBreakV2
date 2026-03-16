export type ColorScheme = {
  primary: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  background: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  success: string;
  gold: string;
  border: string;
  overlay: string;
  white: string;
  black: string;
  error: string;
  inactive: string;
  highlight: string;
  headerGradient: [string, string];
  stampGradient: [string, string];
};

export const LightColors: ColorScheme = {
  primary: '#2563EB',
  primaryDark: '#1E40AF',
  accent: '#3B82F6',
  accentLight: '#EFF6FF',
  background: '#F8FAFC',
  card: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  success: '#4CAF50',
  gold: '#F59E0B',
  border: '#E2E8F0',
  overlay: 'rgba(15,23,42,0.5)',
  white: '#FFFFFF',
  black: '#0F172A',
  error: '#DC2626',
  inactive: '#94A3B8',
  highlight: '#3B82F6',
  headerGradient: ['#1E40AF', '#2563EB'],
  stampGradient: ['#2563EB', '#1E40AF'],
};

export const DarkColors: ColorScheme = {
  primary: '#D4A04A',
  primaryDark: '#2C1810',
  accent: '#E8B86D',
  accentLight: '#3D2B1F',
  background: '#1A1210',
  card: '#2A1F1A',
  textPrimary: '#F5EDE4',
  textSecondary: '#B8A99A',
  success: '#66BB6A',
  gold: '#E8B86D',
  border: '#3D2B1F',
  overlay: 'rgba(0,0,0,0.7)',
  white: '#F5EDE4',
  black: '#1A1210',
  error: '#EF5350',
  inactive: '#6B5D52',
  highlight: '#D4A04A',
  headerGradient: ['#2C1810', '#3D2B1F'],
  stampGradient: ['#D4A04A', '#C8872B'],
};