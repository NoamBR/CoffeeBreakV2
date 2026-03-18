import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { Save } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useSettingsStore } from '@/stores/settingsStore';

export default function SettingsScreen() {
  const settings = useSettingsStore();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const sStyles = getSettingStyles(colors);

  const [staffPin, setStaffPin] = useState(settings.staffPin);
  const [stampsGoal, setStampsGoal] = useState(settings.stampsGoal.toString());
  const [silverThreshold, setSilverThreshold] = useState(settings.tierThresholds.silver.toString());
  const [goldThreshold, setGoldThreshold] = useState(settings.tierThresholds.gold.toString());
  const [bronzeDiscount, setBronzeDiscount] = useState(settings.tierDiscounts.bronze.toString());
  const [silverDiscount, setSilverDiscount] = useState(settings.tierDiscounts.silver.toString());
  const [goldDiscount, setGoldDiscount] = useState(settings.tierDiscounts.gold.toString());
  const [streakBonus, setStreakBonus] = useState(settings.streakBonusDay.toString());

  const handleSave = () => {
    settings.updateSetting('staffPin', staffPin || '1234');
    settings.updateSetting('stampsGoal', parseInt(stampsGoal) || 5);
    settings.updateSetting('tierThresholds', {
      silver: parseInt(silverThreshold) || 20,
      gold: parseInt(goldThreshold) || 50,
    });
    settings.updateSetting('tierDiscounts', {
      bronze: parseInt(bronzeDiscount) || 0,
      silver: parseInt(silverDiscount) || 5,
      gold: parseInt(goldDiscount) || 10,
    });
    settings.updateSetting('streakBonusDay', parseInt(streakBonus) || 7);

    Alert.alert('נשמר!', 'ההגדרות עודכנו בהצלחה.');
  };

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* PINs */}
      <Text style={styles.sectionTitle}>קודי גישה</Text>
      <View style={styles.card}>
        <SettingRow label="קוד צוות (חותמות)" value={staffPin} onChangeText={setStaffPin} keyboardType="number-pad" maxLength={4} styles={sStyles} />
      </View>

      {/* Loyalty */}
      <Text style={styles.sectionTitle}>נאמנות</Text>
      <View style={styles.card}>
        <SettingRow label="חותמות למתנה" value={stampsGoal} onChangeText={setStampsGoal} keyboardType="number-pad" styles={sStyles} />
        <SettingRow label="יום סטריק לבונוס" value={streakBonus} onChangeText={setStreakBonus} keyboardType="number-pad" styles={sStyles} />
      </View>

      {/* Tiers */}
      <Text style={styles.sectionTitle}>דרגות VIP — סף הזמנות</Text>
      <View style={styles.card}>
        <SettingRow label="כסף (הזמנות)" value={silverThreshold} onChangeText={setSilverThreshold} keyboardType="number-pad" styles={sStyles} />
        <SettingRow label="זהב (הזמנות)" value={goldThreshold} onChangeText={setGoldThreshold} keyboardType="number-pad" styles={sStyles} />
      </View>

      <Text style={styles.sectionTitle}>דרגות VIP — הנחות (%)</Text>
      <View style={styles.card}>
        <SettingRow label="ברונזה %" value={bronzeDiscount} onChangeText={setBronzeDiscount} keyboardType="number-pad" styles={sStyles} />
        <SettingRow label="כסף %" value={silverDiscount} onChangeText={setSilverDiscount} keyboardType="number-pad" styles={sStyles} />
        <SettingRow label="זהב %" value={goldDiscount} onChangeText={setGoldDiscount} keyboardType="number-pad" styles={sStyles} />
      </View>

      {/* Save */}
      <Pressable style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]} onPress={handleSave}>
        <Save size={18} color={colors.white} />
        <Text style={styles.saveBtnText}>שמור הגדרות</Text>
      </Pressable>

      {/* Reset */}
      <Pressable
        style={styles.resetBtn}
        onPress={() => {
          Alert.alert('איפוס', 'לאפס את כל ההגדרות לברירת מחדל?', [
            { text: 'ביטול', style: 'cancel' },
            { text: 'אפס', style: 'destructive', onPress: () => settings.resetToDefaults() },
          ]);
        }}
      >
        <Text style={styles.resetBtnText}>איפוס לברירת מחדל</Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function SettingRow({ label, value, onChangeText, keyboardType = 'default', maxLength, styles }: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'number-pad' | 'numeric';
  maxLength?: number;
  styles: ReturnType<typeof getSettingStyles>;
}) {
  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        textAlign="center"
      />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const getSettingStyles = (colors: ColorScheme) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    minWidth: 80,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, textAlign: 'right', marginTop: 20, marginBottom: 8 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border },
  saveBtn: { flexDirection: 'row', backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
  resetBtn: { alignItems: 'center', marginTop: 16, paddingVertical: 12 },
  resetBtnText: { fontSize: 14, color: colors.error, fontWeight: '600' },
});
