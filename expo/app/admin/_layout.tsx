import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useAdminStore } from '@/stores/adminStore';

export default function AdminLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const colors = useThemeColors();

  const isAuth = useAdminStore((s) => s.isManagerAuthenticated);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isAuth) {
      router.replace('/(tabs)/profile');
    }
  }, [ready, isAuth]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.textPrimary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerTitleAlign: 'center',
        headerBackTitle: 'חזרה',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'ניהול הפסקת קפה' }} />
      <Stack.Screen name="orders" options={{ title: 'ניהול הזמנות' }} />
      <Stack.Screen name="menu-editor" options={{ title: 'עריכת תפריט' }} />
      <Stack.Screen name="deals-editor" options={{ title: 'עריכת מבצעים' }} />
      <Stack.Screen name="customers" options={{ title: 'לקוחות' }} />
      <Stack.Screen name="stamp-scanner" options={{ title: 'תחנת חותמות' }} />
      <Stack.Screen name="analytics" options={{ title: 'ניתוח נתונים' }} />
      <Stack.Screen name="settings" options={{ title: 'הגדרות' }} />
      <Stack.Screen name="notifications" options={{ title: 'הודעות' }} />
    </Stack>
  );
}
