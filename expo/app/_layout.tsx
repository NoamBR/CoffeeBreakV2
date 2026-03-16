import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { I18nManager } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useThemeStore } from "@/stores/themeStore";
import { useThemeColors } from "@/hooks/useThemeColors";

void SplashScreen.preventAutoHideAsync();

// Force RTL for Hebrew
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);
}

const queryClient = new QueryClient();

export default function RootLayout() {
  const isDark = useThemeStore((s) => s.preference === 'dark');
  const colors = useThemeColors();

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{
          headerBackTitle: "חזור",
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { color: colors.textPrimary },
          contentStyle: { backgroundColor: colors.background },
        }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="menu/[id]" options={{ headerShown: true }} />
          <Stack.Screen name="deal/[id]" options={{ headerShown: true }} />
          <Stack.Screen name="cart" options={{ title: "העגלה שלי", headerShown: true }} />
          <Stack.Screen name="order-confirm" options={{ title: "אישור הזמנה", headerShown: true }} />
          <Stack.Screen name="order-success" options={{ headerShown: false }} />
          <Stack.Screen name="order-track" options={{ title: "מעקב הזמנה", headerShown: true }} />
          <Stack.Screen name="order-history" options={{ title: "היסטוריית הזמנות", headerShown: true }} />
          <Stack.Screen name="vouchers" options={{ title: "הקופונים שלי", headerShown: true }} />
          <Stack.Screen name="voucher-display" options={{ title: "קופון", headerShown: true }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          <Stack.Screen name="worker" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ title: "לא נמצא" }} />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
