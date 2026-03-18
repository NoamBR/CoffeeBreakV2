import { useState, useRef, useEffect } from 'react';
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Coffee, ChevronDown, Search, ArrowLeft, Gift, Star, Sparkles, MessageCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';

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
type Step = 'welcome' | 'phone' | 'otp' | 'details';

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>('welcome');
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const otpInputRef = useRef<TextInput>(null);

  const { completeOnboarding } = useUserStore();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const fullPhone = `${country.dial}${phoneNumber.replace(/^0+/, '')}`;
  const isPhoneValid = phoneNumber.replace(/\D/g, '').length >= 7;
  const isOtpValid = otpCode.replace(/\D/g, '').length === 6;
  const isNameValid = name.trim().length >= 2;

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);

  // ── Send OTP via WhatsApp ─────────────────────────────────
  const handleSendOtp = async () => {
    if (!isPhoneValid || loading) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone: fullPhone },
      });

      if (error || data?.error) {
        Alert.alert('שגיאה', data?.error || 'לא הצלחנו לשלוח קוד. נסו שוב.');
        setLoading(false);
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep('otp');
      setResendTimer(60);
      setTimeout(() => otpInputRef.current?.focus(), 300);
    } catch (err) {
      console.error('OTP send error:', err);
      Alert.alert('שגיאה', 'בעיה בחיבור. בדקו את האינטרנט ונסו שוב.');
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!isOtpValid || loading) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { phone: fullPhone, code: otpCode.trim() },
      });

      if (error || !data?.verified) {
        Alert.alert('קוד שגוי', data?.error || 'הקוד שהוזן אינו תקין. נסו שוב.');
        setOtpCode('');
        setLoading(false);
        return;
      }

      setVerifiedUserId(data.userId || null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('details');
    } catch (err) {
      console.error('OTP verify error:', err);
      Alert.alert('שגיאה', 'בעיה באימות. נסו שוב.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone: fullPhone },
      });

      if (error || data?.error) {
        Alert.alert('שגיאה', 'לא הצלחנו לשלוח קוד חדש. נסו שוב.');
      } else {
        setResendTimer(60);
        setOtpCode('');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      Alert.alert('שגיאה', 'בעיה בחיבור.');
    } finally {
      setLoading(false);
    }
  };

  // ── Finish onboarding ─────────────────────────────────────
  const handleFinish = () => {
    if (!isNameValid) return;

    completeOnboarding(name.trim(), fullPhone, birthday.trim() || undefined);

    // Use server-generated user ID if available
    if (verifiedUserId) {
      useUserStore.getState().updateUser({ id: verifiedUserId });
    }

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
      {/* Background photo for welcome step */}
      {step === 'welcome' && (
        <Image
          source={require('../assets/social/story-full-table.png')}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      )}
      <LinearGradient
        colors={step === 'welcome'
          ? ['rgba(44,24,16,0.7)', 'rgba(61,43,31,0.85)']
          : [colors.primaryDark, colors.primary]
        }
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* ── Step: Welcome ── */}
            {step === 'welcome' && (
              <View style={styles.centered}>
                <Image
                  source={require('../assets/images/logo.png')}
                  style={styles.logoImage}
                  contentFit="contain"
                />
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
                  נשלח לך קוד אימות בוואטסאפ
                </Text>

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
                    (!isPhoneValid || loading) && styles.primaryBtnDisabled,
                    pressed && isPhoneValid && !loading && styles.primaryBtnPressed,
                  ]}
                  onPress={handleSendOtp}
                  disabled={!isPhoneValid || loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <View style={styles.waBtnContent}>
                      <MessageCircle size={20} color={colors.primary} />
                      <Text style={styles.primaryBtnText}>שלח קוד בוואטסאפ</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            )}

            {/* ── Step: OTP Verification ── */}
            {step === 'otp' && (
              <View style={styles.centered}>
                <Pressable style={styles.backBtn} onPress={() => { setStep('phone'); setOtpCode(''); }}>
                  <ArrowLeft size={24} color={colors.white} />
                </Pressable>

                <Text style={styles.stepTitle}>הזינו את הקוד</Text>
                <Text style={styles.stepSubtitle}>
                  שלחנו קוד בן 6 ספרות ל-{'\n'}
                  <Text style={{ fontWeight: '700' }}>{fullPhone}</Text>
                </Text>

                <TextInput
                  ref={otpInputRef}
                  style={styles.otpInput}
                  placeholder="000000"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={otpCode}
                  onChangeText={(text) => {
                    const digits = text.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(digits);
                  }}
                  keyboardType="number-pad"
                  textAlign="center"
                  maxLength={6}
                  autoFocus
                />

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    (!isOtpValid || loading) && styles.primaryBtnDisabled,
                    pressed && isOtpValid && !loading && styles.primaryBtnPressed,
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={!isOtpValid || loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text style={styles.primaryBtnText}>אימות</Text>
                  )}
                </Pressable>

                <Pressable
                  style={styles.resendBtn}
                  onPress={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                >
                  <Text style={[
                    styles.resendText,
                    resendTimer > 0 && { opacity: 0.4 },
                  ]}>
                    {resendTimer > 0
                      ? `שלח שוב בעוד ${resendTimer} שניות`
                      : 'לא קיבלתי קוד — שלח שוב'}
                  </Text>
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
                      maxLength={50}
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
    alignSelf: 'flex-start',
    marginBottom: 24,
    padding: 4,
  },

  // ── Welcome step ──
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 24,
    alignSelf: 'center',
  },
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

  // ── WhatsApp button ──
  waBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // ── OTP step ──
  otpInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    letterSpacing: 12,
    textAlign: 'center',
    marginBottom: 24,
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  resendText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
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
