import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { ColorScheme } from "@/constants/colors";
import { useUserStore } from "@/stores/userStore";

export default function Index() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const colors = useThemeColors();
  const styles = getStyles(colors);

  useEffect(() => {
    // Wait for Zustand to hydrate from AsyncStorage
    const unsub = useUserStore.persist.onFinishHydration(() => {
      setReady(true);
    });

    // If already hydrated (sync storage or second render)
    if (useUserStore.persist.hasHydrated()) {
      setReady(true);
    }

    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    const { isOnboarded } = useUserStore.getState();
    if (isOnboarded) {
      router.replace("/(tabs)");
    } else {
      router.replace("/onboarding");
    }
  }, [ready]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
