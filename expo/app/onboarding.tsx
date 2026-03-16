import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Coffee, ChevronDown, Search, ArrowLeft, Gift, Star, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useUserStore } from '@/stores/userStore';

// ── Country codes ──────────────────────────────────────────
type Country = { name: string; nameHe: string; code: string; dial: string; flag: string };

const COUNTRIES: Country[] = [
  { name: 'Israel', nameHe: 'ישראל', code: 'IL', dial: '+972', flag: '🇮🇱' },
  { name: 'United States', nameHe: 'ארה"ב', code: 'US', dial: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', nameHe: 'בריטניה', code: 'GB', dial: '+44', flag: '🇬🇧' },
  { name: 'France', nameHe: 'צרפת', code: 'FR', dial: '+33', flag: '🇫🇷' },
  { name: 'Germany', nameHe: 'גרמניה', code: 'DE', dial: '+49', flag: '🇩🇪' },
  { name: 'Russia', nameHe: 'רוסיה', code: 'RU', dial: '+7', flag: '🇷🇺' },
  { name: 'Ukraine', nameHe: 'אוקראינה', code: 'UA', dial: '+380', flag: '🇺🇦' },
  { name: 'Ethiopia', nameHe: 'אתיופיה', code: 'ET', dial: '+251', flag: '🇪🇹' },
  { name: 'Argentina', nameHe: 'ארגנטינה', code: 'AR', dial: '+54', flag: '🇦🇷' },
  { name: 'Brazil', nameHe: 'ברזיל', code: 'BR', dial: '+55', flag: '🇧🇷' },
  { name: 'Canada', nameHe: 'קנדה', code: 'CA', dial: '+1', flag: '🇨🇦' },
  { name: 'Australia', nameHe: 'אוסטרליה', code: 'AU', dial: '+61', flag: '🇦🇺' },
  { name: 'India', nameHe: 'הודו', code: 'IN', dial: '+91', flag: '🇮🇳' },
  { name: 'Italy', nameHe: 'איטליה', code: 'IT', dial: '+39', flag: '🇮🇹' },
  { name: 'Spain', nameHe: 'ספרד', code: 'ES', dial: '+34', flag: '🇪🇸' },
  { name: 'Turkey', nameHe: 'טורקיה', code: 'TR', dial: '+90', flag: '🇹🇷' },
  { name: 'South Africa', nameHe: 'דרום אפריקה', code: 'ZA', dial: '+27', flag: '🇿🇦' },
  { name: 'Morocco', nameHe: 'מרוקו', code: 'MA', dial: '+212', flag: '🇲🇦' },
  { name: 'Romania', nameHe: 'רומניה', code: 'RO', dial: '+40', flag: '🇷🇴' },
  { name: 'Poland', nameHe: 'פולין', code: 'PL', dial: '+48', flag: '🇵🇱' },
  { name: 'Mexico', nameHe: 'מקסיקו', code: 'MX', dial: '+52', flag: '🇲🇽' },
  { name: 'Colombia', nameHe: 'קולומביה', code: 'CO', dial: '+57', flag: '🇨🇴' },
  { name: 'Thailand', nameHe: 'תאילנד', code: 'TH', dial: '+66', flag: '🇹🇭' },
  { name: 'Jordan', nameHe: 'ירדן', code: 'JO', dial: '+962', flag: '🇯🇴' },
  { name: 'Egypt', nameHe: 'מצרים', code: 'EG', dial: '+20', flag: '🇪🇬' },
];

// ── Steps ──────────────────────────────────────────────────
type Step = 'welcome' | 'phone' | 'details';

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>('welcome');
  const [country, setCountry] = useState<Country>(COUNTRIES[0]); // Israel default
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const { completeOnboarding } = useUserStore();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const fullPhone = `${country.dial}${phoneNumber.replace(/^0+/, '')}`;
  const isPhoneValid = phoneNumber.replace(/\D/g, '').length >= 7;
  const isNameValid = name.trim().length >= 2;

  const handlePhoneContinue = () => {
    if (!isPhoneValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep('details');
  };

  const handleFinish = () => {
    if (!isNameValid) return;
    completeOnboarding(name.trim(), fullPhone, birthday.trim() || undefined);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  };

  const handleSkip = () => {
    completeOnboarding('אורח', '', undefined);
    router.replace('/(tabs)');
  };

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.nameHe.includes(countrySearch) ||
      c.dial.includes(countrySearch)
  );

  return (
    <View style={styles.wrapper}>
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* ── Step: Welcome ── */}
            {step === 'welcome' && (
              <View style={styles.centered}>
                <Coffee size={64} color={colors.white} />
                <Text style={styles.logo}>הפסקת קפה</Text>
                <Text style={styles.tagline}>הקפה הכי טוב באשקלון</Text>

                <View style={styles.welcomePerks}>
                  <View style={styles.perkRow}>
                    <Text style={styles.perkText}>הקפה ה-5 עלינו</Text>
                    <Coffee size={20} color="rgba(255,255,255,0.85)" />
                  </View>
                  <View style={styles.perkRow}>
                    <Text style={styles.perkText}>הפתעות ומבצעים בלעדיים</Text>
                    <Gift size={20} color="rgba(255,255,255,0.85)" />
                  </View>
                  <View style={styles.perkRow}>
                    <Text style={styles.perkText}>מועדון VIP עם הטבות</Text>
                    <Star size={20} color="rgba(255,255,255,0.85)" />
                  </View>
                  <View style={styles.perkRow}>
                    <Text style={styles.perkText}>מתנת יום הולדת</Text>
                    <Sparkles size={20} color="rgba(255,255,255,0.85)" />
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
                  onPress={() => setStep('phone')}
                >
                  <Text style={styles.primaryBtnText}>הרשמה / התחברות</Text>
                </Pressable>

                <Pressable style={styles.skipBtn} onPress={handleSkip}>
                  <Text style={styles.skipBtnText}>המשך כאורח</Text>
                </Pressable>
              </View>
            )}

            {/* ── Step: Phone ── */}
            {step === 'phone' && (
              <View style={styles.centered}>
                <Pressable style={styles.backBtn} onPress={() => setStep('welcome')}>
                  <ArrowLeft size={24} color={colors.white} />
                </Pressable>

                <Text style={styles.stepTitle}>מספר הטלפון שלך</Text>
                <Text style={styles.stepSubtitle}>
                  נשתמש בו לזיהוי החשבון שלך{'\n'}בעתיד נשלח קוד אימות ב-SMS
                </Text>

                {/* Phone input with country picker */}
                <View style={styles.phoneRow}>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="50-000-0000"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    textAlign="left"
                    autoFocus
                    maxLength={15}
                  />

                  <Pressable
                    style={styles.countryPicker}
                    onPress={() => setCountryPickerVisible(true)}
                  >
                    <ChevronDown size={14} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.countryDial}>{country.dial}</Text>
                    <Text style={styles.countryFlag}>{country.flag}</Text>
                  </Pressable>
                </View>

                <Text style={styles.phonePreview}>
                  {phoneNumber ? fullPhone : ''}
                </Text>

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    !isPhoneValid && styles.primaryBtnDisabled,
                    pressed && isPhoneValid && styles.primaryBtnPressed,
                  ]}
                  onPress={handlePhoneContinue}
                  disabled={!isPhoneValid}
                >
                  <Text style={styles.primaryBtnText}>המשך</Text>
                </Pressable>
              </View>
            )}

            {/* ── Step: Details ── */}
            {step === 'details' && (
              <ScrollView
                contentContainerStyle={styles.detailsScroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Pressable style={styles.backBtn} onPress={() => setStep('phone')}>
                  <ArrowLeft size={24} color={colors.white} />
                </Pressable>

                <Text style={styles.stepTitle}>כמעט שם!</Text>
                <Text style={styles.stepSubtitle}>ספרו לנו קצת על עצמכם</Text>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>שם מלא</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="איך קוראים לך?"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={name}
                      onChangeText={setName}
                      textAlign="right"
                      autoFocus
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>יום הולדת (אופציונלי)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="DD/MM"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={birthday}
                      onChangeText={setBirthday}
                      keyboardType="numbers-and-punctuation"
                      textAlign="right"
                      maxLength={5}
                    />
                    <Text style={styles.inputHint}>לקבלת מתנת יום הולדת</Text>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      !isNameValid && styles.primaryBtnDisabled,
                      pressed && isNameValid && styles.primaryBtnPressed,
                    ]}
                    onPress={handleFinish}
                    disabled={!isNameValid}
                  >
                    <Text style={styles.primaryBtnText}>בואו נתחיל!</Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>

      {/* ── Country Picker Modal ── */}
      <Modal
        visible={countryPickerVisible}
        animationType="slide"
        onRequestClose={() => setCountryPickerVisible(false)}
      >
        <SafeAreaView style={styles.pickerSafe}>
          <View style={styles.pickerHeader}>
            <Pressable onPress={() => setCountryPickerVisible(false)}>
              <Text style={styles.pickerDone}>סגור</Text>
            </Pressable>
            <Text style={styles.pickerTitle}>בחרו מדינה</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.searchRow}>
            <Search size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="חפשו מדינה או קוד..."
              placeholderTextColor={colors.inactive}
              value={countrySearch}
              onChangeText={setCountrySearch}
              textAlign="right"
              autoFocus
            />
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.countryRow,
                  item.code === country.code && styles.countryRowSelected,
                ]}
                onPress={() => {
                  setCountry(item);
                  setCountryPickerVisible(false);
                  setCountrySearch('');
                }}
              >
                <Text style={styles.countryRowDial}>{item.dial}</Text>
                <View style={styles.countryRowInfo}>
                  <Text style={styles.countryRowName}>{item.nameHe}</Text>
                  <Text style={styles.countryRowNameEn}>{item.name}</Text>
                </View>
                <Text style={styles.countryRowFlag}>{item.flag}</Text>
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────
const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // ── Back button ──
  backBtn: {
    alignSelf: 'flex-left',
    marginBottom: 24,
    padding: 4,
  },

  // ── Welcome step ──
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.white,
    marginTop: 16,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
    textAlign: 'center',
  },
  welcomePerks: {
    marginTop: 32,
    marginBottom: 40,
    gap: 14,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'flex-end',
  },
  perkText: {
    fontSize: 17,
    color: colors.white,
    textAlign: 'right',
    fontWeight: '600',
  },

  // ── Primary button ──
  primaryBtn: {
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  primaryBtnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },

  // ── Skip ──
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipBtnText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
  },

  // ── Phone step ──
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  countryFlag: {
    fontSize: 22,
  },
  countryDial: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    letterSpacing: 1,
  },
  phonePreview: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
    direction: 'ltr',
  },

  // ── Details step ──
  detailsScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  form: {
    gap: 18,
    marginTop: 8,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  inputHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'right',
    marginTop: 2,
  },

  // ── Country Picker Modal ──
  pickerSafe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  countryRowSelected: {
    backgroundColor: colors.accentLight,
  },
  countryRowFlag: {
    fontSize: 28,
  },
  countryRowInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  countryRowName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  countryRowNameEn: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  countryRowDial: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    minWidth: 50,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
  },
});
