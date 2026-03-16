import { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Stamp, Lock, Coffee, ScanLine, Check, X, RefreshCw, Camera } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useLoyaltyStore } from '@/stores/loyaltyStore';
import { useUserStore } from '@/stores/userStore';
import { useStreakStore } from '@/stores/streakStore';
import { useSettingsStore } from '@/stores/settingsStore';
import * as vouchersService from '@/services/vouchersService';
import { parseTokenizedPayload } from '@/utils/tokenizedVoucher';
import BarcodeScanner from '@/components/BarcodeScanner';
import { Voucher } from '@/types';

type Mode = 'stamp' | 'voucher';
type VoucherStep = 'input' | 'preview' | 'result';

export default function StampScannerScreen() {
  const { stamps, stampsGoal, addStamp } = useLoyaltyStore();
  const { incrementCoffees, user } = useUserStore();
  const { recordOrder } = useStreakStore();
  const staffPin = useSettingsStore((s) => s.staffPin);
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const [pinVisible, setPinVisible] = useState(true);
  const [pin, setPin] = useState('');
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('stamp');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherStep, setVoucherStep] = useState<VoucherStep>('input');
  const [validatedVoucher, setValidatedVoucher] = useState<Voucher | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [voucherResult, setVoucherResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const successScale = useRef(new Animated.Value(0)).current;
  const pinRef = useRef<TextInput>(null);

  // Handle scanned QR data (may be tokenized or raw barcode)
  const handleCameraScan = useCallback((data: string) => {
    setShowCamera(false);

    // Parse tokenized payload (barcode|timestamp|token) or raw barcode
    const parsed = parseTokenizedPayload(data);

    if (!parsed.valid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessages: Record<string, string> = {
        expired: 'קוד QR פג תוקף — בקשו מהלקוח לרענן',
        invalid_token: 'קוד QR לא תקין',
        invalid_format: 'פורמט לא מזוהה',
      };
      setVoucherResult({
        success: false,
        message: errorMessages[parsed.error ?? 'invalid_format'] ?? 'שגיאה',
      });
      setVoucherStep('result');
      return;
    }

    // Auto-populate and validate
    setVoucherCode(parsed.barcode);
    setVoucherStep('input');
    // Trigger validation immediately
    setTimeout(() => {
      handleVoucherValidateWithCode(parsed.barcode);
    }, 100);
  }, []);

  const handleUnlock = () => {
    if (pin === staffPin) {
      setPinVisible(false);
      setPin('');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPin('');
      Alert.alert('קוד שגוי', 'נסו שנית.');
    }
  };

  const handleStamp = () => {
    const rewardEarned = addStamp();
    incrementCoffees();
    const { milestone } = recordOrder();

    if (milestone === 7) {
      addStamp();
    }

    Haptics.notificationAsync(
      rewardEarned
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );

    if (rewardEarned) {
      setLastResult('משקה חינם!');
    } else if (milestone === 7) {
      setLastResult('7 ימים רצופים + חותמת בונוס!');
    } else {
      setLastResult(`חותמת ${stamps + 1}/${stampsGoal}`);
    }

    setTimeout(() => setLastResult(null), 3000);
  };

  // Validate with explicit barcode (used by camera scan)
  const handleVoucherValidateWithCode = async (barcode: string) => {
    if (!barcode) return;
    setIsValidating(true);
    setVoucherResult(null);
    try {
      const result = await vouchersService.validateVoucher(barcode);
      if (!result.valid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const errorMessages: Record<string, string> = {
          not_found: 'קופון לא נמצא',
          already_redeemed: result.redeemed_at
            ? `קופון כבר מומש ב-${new Date(result.redeemed_at).toLocaleDateString('he-IL')}`
            : 'קופון כבר מומש',
          expired: 'קופון פג תוקף',
          invalid_status: 'קופון לא תקין',
        };
        setVoucherResult({
          success: false,
          message: errorMessages[result.error ?? 'not_found'] ?? 'שגיאה לא ידועה',
        });
        setVoucherStep('result');
        return;
      }
      setValidatedVoucher(result.voucher!);
      setVoucherStep('preview');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setVoucherResult({
        success: false,
        message: 'אין חיבור לאינטרנט — בדקו את הרשת ונסו שנית',
      });
      setVoucherStep('result');
    } finally {
      setIsValidating(false);
    }
  };

  // Step 1: Validate voucher (read-only server check)
  const handleVoucherValidate = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;

    setIsValidating(true);
    setVoucherResult(null);

    try {
      const result = await vouchersService.validateVoucher(code);

      if (!result.valid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const errorMessages: Record<string, string> = {
          not_found: 'קופון לא נמצא',
          already_redeemed: result.redeemed_at
            ? `קופון כבר מומש ב-${new Date(result.redeemed_at).toLocaleDateString('he-IL')}`
            : 'קופון כבר מומש',
          expired: 'קופון פג תוקף',
          invalid_status: 'קופון לא תקין',
        };
        setVoucherResult({
          success: false,
          message: errorMessages[result.error ?? 'not_found'] ?? 'שגיאה לא ידועה',
        });
        setVoucherStep('result');
        return;
      }

      // Show preview for confirmation
      setValidatedVoucher(result.voucher!);
      setVoucherStep('preview');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setVoucherResult({
        success: false,
        message: 'אין חיבור לאינטרנט — בדקו את הרשת ונסו שנית',
      });
      setVoucherStep('result');
    } finally {
      setIsValidating(false);
    }
  };

  // Step 2: Confirm redemption (atomic server mutation)
  const handleVoucherRedeem = async () => {
    if (!validatedVoucher) return;

    setIsRedeeming(true);

    try {
      const result = await vouchersService.redeemVoucher(validatedVoucher.barcode);

      if (!result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const errorMessages: Record<string, string> = {
          not_found: 'קופון לא נמצא',
          already_redeemed: 'קופון כבר מומש ע"י עובד אחר',
          expired: 'קופון פג תוקף',
          invalid_status: 'קופון לא תקין',
        };
        setVoucherResult({
          success: false,
          message: errorMessages[result.error ?? 'not_found'] ?? 'שגיאה לא ידועה',
        });
        setVoucherStep('result');
        return;
      }

      // Triple haptic burst celebration
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 150);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 300);

      // Success scale animation
      successScale.setValue(0);
      Animated.spring(successScale, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }).start();

      setVoucherResult({
        success: true,
        message: `${validatedVoucher.title} — מומש בהצלחה!`,
      });
      setVoucherStep('result');
      setVoucherCode('');
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setVoucherResult({
        success: false,
        message: 'שגיאת רשת — סרקו שוב לבדוק אם המימוש הצליח',
      });
      setVoucherStep('result');
    } finally {
      setIsRedeeming(false);
    }
  };

  const resetVoucherFlow = () => {
    setVoucherStep('input');
    setValidatedVoucher(null);
    setVoucherResult(null);
    setVoucherCode('');
  };

  if (pinVisible) {
    return (
      <View style={styles.pinScreen}>
        <Lock size={48} color={colors.primary} />
        <Text style={styles.pinTitle}>קוד צוות</Text>
        <TextInput
          ref={pinRef}
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
          style={({ pressed }) => [styles.unlockBtn, pin.length < 4 && styles.unlockBtnDisabled, pressed && { opacity: 0.8 }]}
          onPress={handleUnlock}
          disabled={pin.length < 4}
        >
          <Text style={styles.unlockBtnText}>כניסה</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Mode tabs */}
      <View style={styles.modeTabs}>
        <Pressable
          style={[styles.modeTab, mode === 'stamp' && styles.modeTabActive]}
          onPress={() => { setMode('stamp'); resetVoucherFlow(); }}
        >
          <Stamp size={16} color={mode === 'stamp' ? colors.white : colors.textSecondary} />
          <Text style={[styles.modeTabText, mode === 'stamp' && styles.modeTabTextActive]}>
            חותמת
          </Text>
        </Pressable>
        <Pressable
          style={[styles.modeTab, mode === 'voucher' && styles.modeTabActiveGold]}
          onPress={() => { setMode('voucher'); setLastResult(null); }}
        >
          <ScanLine size={16} color={mode === 'voucher' ? colors.white : colors.textSecondary} />
          <Text style={[styles.modeTabText, mode === 'voucher' && styles.modeTabTextActive]}>
            סריקת קופון
          </Text>
        </Pressable>
      </View>

      {mode === 'stamp' ? (
        <>
          {/* User info */}
          <View style={styles.userInfo}>
            <Coffee size={20} color={colors.primary} />
            <Text style={styles.userName}>{user?.name ?? 'אורח'}</Text>
            <Text style={styles.userStamps}>{stamps}/{stampsGoal} חותמות</Text>
          </View>

          {/* Big stamp button */}
          <Pressable
            style={({ pressed }) => [styles.stampBtn, pressed && styles.stampBtnPressed]}
            onPress={handleStamp}
          >
            <Stamp size={64} color={colors.white} />
            <Text style={styles.stampBtnText}>הוסף חותמת</Text>
          </Pressable>

          {/* Result feedback */}
          {lastResult && (
            <View style={styles.resultBanner}>
              <Text style={styles.resultText}>{lastResult}</Text>
            </View>
          )}
        </>
      ) : (
        <>
          {/* Voucher flow */}
          <View style={styles.voucherSection}>
            {voucherStep === 'input' && (
              <>
                <ScanLine size={48} color="#C8872B" />
                <Text style={styles.voucherTitle}>סריקת קופון</Text>
                <Text style={styles.voucherDesc}>סרקו QR או הקלידו קוד ידנית</Text>

                {/* Camera scan button */}
                <Pressable
                  style={({ pressed }) => [styles.cameraScanBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => setShowCamera(true)}
                >
                  <Camera size={22} color="#FFFFFF" />
                  <Text style={styles.cameraScanBtnText}>סרוק QR עם מצלמה</Text>
                </Pressable>

                <View style={styles.orDivider}>
                  <View style={[styles.orLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.orText, { color: colors.textSecondary }]}>או</Text>
                  <View style={[styles.orLine, { backgroundColor: colors.border }]} />
                </View>

                <TextInput
                  style={styles.voucherInput}
                  value={voucherCode}
                  onChangeText={setVoucherCode}
                  placeholder="VCH-XXXX-XXXX"
                  placeholderTextColor={colors.inactive}
                  autoCapitalize="characters"
                  textAlign="center"
                  onSubmitEditing={handleVoucherValidate}
                  editable={!isValidating}
                />

                <Pressable
                  style={({ pressed }) => [
                    styles.searchBtn,
                    (!voucherCode.trim() || isValidating) && styles.searchBtnDisabled,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={handleVoucherValidate}
                  disabled={!voucherCode.trim() || isValidating}
                >
                  {isValidating ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.searchBtnText}>בדוק קופון</Text>
                  )}
                </Pressable>
              </>
            )}

            {voucherStep === 'preview' && validatedVoucher && (
              <>
                {/* Voucher preview card */}
                <View style={styles.previewCard}>
                  <Check size={32} color={colors.success} />
                  <Text style={styles.previewTitle}>{validatedVoucher.title}</Text>
                  <Text style={styles.previewDesc}>{validatedVoucher.description}</Text>

                  <View style={styles.previewDetails}>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>סוג:</Text>
                      <Text style={styles.previewValue}>{voucherTypeLabel(validatedVoucher.type)}</Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewLabel}>ברקוד:</Text>
                      <Text style={styles.previewBarcode}>{validatedVoucher.barcode}</Text>
                    </View>
                    {validatedVoucher.value && (
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>ערך:</Text>
                        <Text style={styles.previewValue}>{validatedVoucher.value}%</Text>
                      </View>
                    )}
                    {validatedVoucher.expiresAt && (
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>תוקף:</Text>
                        <Text style={styles.previewValue}>
                          {new Date(validatedVoucher.expiresAt).toLocaleDateString('he-IL')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Action buttons */}
                <Pressable
                  style={({ pressed }) => [
                    styles.redeemBtn,
                    isRedeeming && styles.searchBtnDisabled,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={handleVoucherRedeem}
                  disabled={isRedeeming}
                >
                  {isRedeeming ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.redeemBtnText}>ממש קופון</Text>
                  )}
                </Pressable>

                <Pressable style={styles.cancelBtn} onPress={resetVoucherFlow}>
                  <Text style={styles.cancelBtnText}>ביטול</Text>
                </Pressable>
              </>
            )}

            {voucherStep === 'result' && voucherResult && (
              <>
                <Animated.View style={[
                  styles.voucherResultBanner,
                  !voucherResult.success && styles.voucherResultError,
                  voucherResult.success && {
                    transform: [{ scale: successScale.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
                    opacity: successScale,
                  },
                ]}>
                  {voucherResult.success ? (
                    <Animated.View style={{
                      transform: [{ scale: successScale.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1.3, 1] }) }],
                    }}>
                      <Check size={48} color={colors.success} />
                    </Animated.View>
                  ) : (
                    <X size={28} color={colors.error} />
                  )}
                  <Text style={[
                    styles.voucherResultText,
                    !voucherResult.success && styles.voucherResultTextError,
                    voucherResult.success && styles.voucherResultTextSuccess,
                  ]}>
                    {voucherResult.message}
                  </Text>
                </Animated.View>

                <Pressable style={styles.newScanBtn} onPress={resetVoucherFlow}>
                  <RefreshCw size={16} color="#C8872B" />
                  <Text style={styles.newScanBtnText}>סריקה חדשה</Text>
                </Pressable>
              </>
            )}
          </View>
        </>
      )}

      {/* Lock button */}
      <Pressable style={styles.lockBtn} onPress={() => setPinVisible(true)}>
        <Lock size={16} color={colors.textSecondary} />
        <Text style={styles.lockBtnText}>נעל מסך</Text>
      </Pressable>

      {/* Full-screen camera scanner overlay */}
      {showCamera && (
        <View style={StyleSheet.absoluteFill}>
          <BarcodeScanner
            onScan={handleCameraScan}
            onClose={() => setShowCamera(false)}
          />
        </View>
      )}
    </View>
  );
}

function voucherTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    free_coffee: 'קפה חינם',
    discount_percent: 'הנחה באחוזים',
    free_pastry: 'מאפה חינם',
    free_upgrade: 'שדרוג גודל',
    birthday_gift: 'מתנת יום הולדת',
  };
  return labels[type] ?? type;
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 },
  pinScreen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  pinTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  pinInput: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, backgroundColor: colors.white, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32, width: '100%', letterSpacing: 12, borderWidth: 2, borderColor: colors.border, textAlign: 'center' },
  unlockBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  unlockBtnDisabled: { opacity: 0.4 },
  unlockBtnText: { fontSize: 18, fontWeight: '700', color: colors.white },

  // Mode tabs
  modeTabs: { flexDirection: 'row', gap: 10, marginBottom: 32, width: '100%' },
  modeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border },
  modeTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeTabActiveGold: { backgroundColor: '#C8872B', borderColor: '#C8872B' },
  modeTabText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  modeTabTextActive: { color: colors.white },

  // Stamp mode
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 40, backgroundColor: colors.white, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  userName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  userStamps: { fontSize: 14, color: colors.textSecondary },
  stampBtn: { width: 200, height: 200, borderRadius: 100, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  stampBtnPressed: { transform: [{ scale: 0.95 }], opacity: 0.9 },
  stampBtnText: { fontSize: 20, fontWeight: '800', color: colors.white },
  resultBanner: { marginTop: 32, backgroundColor: colors.success + '15', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.success },
  resultText: { fontSize: 18, fontWeight: '700', color: colors.success, textAlign: 'center' },

  // Voucher mode
  voucherSection: { alignItems: 'center', gap: 12, width: '100%' },
  voucherTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  voucherDesc: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  cameraScanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#C8872B', paddingVertical: 16, borderRadius: 14, width: '100%', shadowColor: '#C8872B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  cameraScanBtnText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  orDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', marginVertical: 4 },
  orLine: { flex: 1, height: 1 },
  orText: { fontSize: 13, fontWeight: '600' },
  voucherInput: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, backgroundColor: colors.white, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, width: '100%', letterSpacing: 2, borderWidth: 2, borderColor: '#E8D5B8', textAlign: 'center' },
  searchBtn: { backgroundColor: '#C8872B', paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center', marginTop: 4, minHeight: 50, justifyContent: 'center' },
  searchBtnDisabled: { opacity: 0.4 },
  searchBtnText: { fontSize: 18, fontWeight: '700', color: colors.white },

  // Preview card
  previewCard: { backgroundColor: colors.white, borderRadius: 16, padding: 24, width: '100%', alignItems: 'center', gap: 8, borderWidth: 2, borderColor: colors.success, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  previewTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  previewDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  previewDetails: { marginTop: 12, width: '100%', gap: 8 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  previewValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  previewBarcode: { fontSize: 14, fontWeight: '800', color: '#C8872B', letterSpacing: 1 },

  // Redeem button
  redeemBtn: { backgroundColor: colors.success, paddingVertical: 16, borderRadius: 12, width: '100%', alignItems: 'center', marginTop: 8, minHeight: 54, justifyContent: 'center' },
  redeemBtnText: { fontSize: 20, fontWeight: '800', color: colors.white },
  cancelBtn: { paddingVertical: 12 },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },

  // Result
  voucherResultBanner: { marginTop: 16, alignItems: 'center', gap: 12, backgroundColor: colors.success + '15', paddingHorizontal: 24, paddingVertical: 24, borderRadius: 16, borderWidth: 1.5, borderColor: colors.success, width: '100%' },
  voucherResultError: { backgroundColor: colors.error + '15', borderColor: colors.error },
  voucherResultText: { fontSize: 18, fontWeight: '700', color: colors.success, textAlign: 'center', lineHeight: 26 },
  voucherResultTextSuccess: { fontSize: 22, fontWeight: '800' },
  voucherResultTextError: { color: colors.error },
  newScanBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, backgroundColor: '#FEF4E5', borderWidth: 1, borderColor: '#E8D5B8' },
  newScanBtnText: { fontSize: 16, fontWeight: '700', color: '#C8872B' },

  lockBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 32, paddingVertical: 10 },
  lockBtnText: { fontSize: 14, color: colors.textSecondary },
});
