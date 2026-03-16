import { Stack, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useAdminStore } from '@/stores/adminStore';

export default function WorkerLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const mountTime = useRef(Date.now());
  const colors = useThemeColors();

  // Re-read on every render to get latest state
  const isAuth = useAdminStore((s) => s.isWorkerAuthenticated);
  const isManager = useAdminStore((s) => s.isManagerAuthenticated);

  useEffect(() => {
    // Give store time to hydrate + state to propagate
    const timer = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isAuth && !isManager) {
      router.replace('/(tabs)/profile');
    }
  }, [ready, isAuth, isManager]);

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
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerTitleAlign: 'center',
        headerBackTitle: 'חזרה',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'תחנת עבודה' }} />
      <Stack.Screen name="orders" options={{ title: 'הזמנות' }} />
      <Stack.Screen name="stamp" options={{ title: 'חותמות' }} />
      <Stack.Screen name="notifications" options={{ title: 'התראות' }} />
    </Stack>
  );
}
