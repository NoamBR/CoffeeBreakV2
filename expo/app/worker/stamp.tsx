import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Stamp, Lock, Coffee } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useLoyaltyStore } from '@/stores/loyaltyStore';
import { useUserStore } from '@/stores/userStore';
import { useStreakStore } from '@/stores/streakStore';
import { useSettingsStore } from '@/stores/settingsStore';

export default function WorkerStampScreen() {
  const { stamps, stampsGoal, addStamp } = useLoyaltyStore();
  const { incrementCoffees, user } = useUserStore();
  const { recordOrder } = useStreakStore();
  const staffPin = useSettingsStore((s) => s.staffPin);
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleUnlock = () => {
    if (pin === staffPin) {
      setUnlocked(true);
      setPin('');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPin('');
      Alert.alert('קוד שגוי');
    }
  };

  const handleStamp = () => {
    const rewardEarned = addStamp();
    incrementCoffees();
    const { milestone } = recordOrder();
    if (milestone === 7) addStamp();

    Haptics.notificationAsync(
      rewardEarned ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
    );

    setLastResult(
      rewardEarned ? 'משקה חינם!' : milestone === 7 ? 'סטריק 7 + בונוס!' : `חותמת ${stamps + 1}/${stampsGoal}`
    );
    setTimeout(() => setLastResult(null), 3000);
  };

  if (!unlocked) {
    return (
      <View style={styles.center}>
        <Lock size={48} color={colors.primary} />
        <Text style={styles.pinTitle}>קוד צוות</Text>
        <TextInput
          style={styles.pinInput}
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          placeholder="••••"
          placeholderTextColor={colors.inactive}
          textAlign="center"
          autoFocus
          onSubmitEditing={handleUnlock}
        />
        <Pressable
          style={[styles.btn, pin.length < 4 && { opacity: 0.4 }]}
          onPress={handleUnlock}
          disabled={pin.length < 4}
        >
          <Text style={styles.btnText}>כניסה</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <View style={styles.userRow}>
        <Coffee size={18} color={colors.primary} />
        <Text style={styles.userName}>{user?.name ?? 'אורח'}</Text>
        <Text style={styles.userStamps}>{stamps}/{stampsGoal}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.stampBtn, pressed && { transform: [{ scale: 0.93 }], opacity: 0.85 }]}
        onPress={handleStamp}
      >
        <Stamp size={56} color={colors.white} />
        <Text style={styles.stampBtnText}>הוסף חותמת</Text>
      </Pressable>

      {lastResult && (
        <View style={styles.resultBanner}>
          <Text style={styles.resultText}>{lastResult}</Text>
        </View>
      )}

      <Pressable style={styles.lockBtn} onPress={() => setUnlocked(false)}>
        <Lock size={14} color={colors.textSecondary} />
        <Text style={styles.lockBtnText}>נעל</Text>
      </Pressable>
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  pinTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  pinInput: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, backgroundColor: colors.white, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, width: '100%', letterSpacing: 12, borderWidth: 2, borderColor: colors.border, textAlign: 'center' },
  btn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  btnText: { fontSize: 18, fontWeight: '700', color: colors.white },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
  userName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  userStamps: { fontSize: 14, color: colors.textSecondary },
  stampBtn: { width: 180, height: 180, borderRadius: 90, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  stampBtnText: { fontSize: 18, fontWeight: '800', color: colors.white },
  resultBanner: { backgroundColor: colors.success + '15', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.success },
  resultText: { fontSize: 16, fontWeight: '700', color: colors.success },
  lockBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8 },
  lockBtnText: { fontSize: 13, color: colors.textSecondary },
});
