import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Your blank app is ready.</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
  },
});
