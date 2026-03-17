import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ticket, Check, Clock, ShieldCheck } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useReferralStore } from '@/stores/referralStore';
import { useUserStore } from '@/stores/userStore';
import QRCode from '@/components/QRCode';
import { generateTokenizedPayload, TOKEN_ROTATE_INTERVAL } from '@/utils/tokenizedVoucher';
import type { ColorScheme } from '@/constants/colors';

// Safe optional imports for native modules (may not be available in Expo Go / web)
let Brightness: any = null;
let ScreenCapture: any = null;
try { Brightness = require('expo-brightness'); } catch {}
try { ScreenCapture = require('expo-screen-capture'); } catch {}

export default function VoucherDisplayScreen() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const voucher = useReferralStore((s) => s.vouchers.find((v) => v.id === id));
  const userPhone = useUserStore((s) => s.user?.phone ?? '');
  const originalBrightness = useRef<number | null>(null);
  const [qrPayload, setQrPayload] = useState('');
  const [countdown, setCountdown] = useState(TOKEN_ROTATE_INTERVAL / 1000);
  const [tokenError, setTokenError] = useState(false);

  // Request a signed token from the server (HMAC-SHA256)
  const refreshToken = useCallback(async () => {
    if (!voucher) return;
    try {
      // generateTokenizedPayload now calls the server Edge Function
      const payload = await generateTokenizedPayload(voucher.id);
      setQrPayload(payload);
      setCountdown(TOKEN_ROTATE_INTERVAL / 1000);
      setTokenError(false);
    } catch {
      setTokenError(true);
    }
  }, [voucher]);

  // Rotate token every 60s
  useEffect(() => {
    refreshToken();
    const tokenTimer = setInterval(refreshToken, TOKEN_ROTATE_INTERVAL);
    return () => clearInterval(tokenTimer);
  }, [refreshToken]);

  // Countdown timer
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? TOKEN_ROTATE_INTERVAL / 1000 : prev - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // Brightness boost + screenshot prevention on focus (native only)
  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        if (Brightness && Platform.OS !== 'web') {
          try {
            const current = await Brightness.getBrightnessAsync();
            if (mounted) originalBrightness.current = current;
            await Brightness.setBrightnessAsync(1);
          } catch {}
        }
        if (ScreenCapture && Platform.OS !== 'web') {
          try {
            await ScreenCapture.preventScreenCaptureAsync('voucher-display');
          } catch {}
        }
      })();

      return () => {
        mounted = false;
        if (Brightness && originalBrightness.current !== null) {
          Brightness.setBrightnessAsync(originalBrightness.current).catch(() => {});
        }
        if (ScreenCapture) {
          ScreenCapture.allowScreenCaptureAsync('voucher-display').catch(() => {});
        }
      };
    }, [])
  );

  if (!voucher) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>קופון לא נמצא</Text>
      </View>
    );
  }

  const isRedeemed = voucher.status === 'redeemed' || !!voucher.redeemedAt;
  const isExpired = voucher.status === 'expired';
  const isPending = false;
  const isActive = !isRedeemed && !isExpired && !isPending;

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={isRedeemed ? ['#6B7280', '#9CA3AF'] : isExpired ? ['#991B1B', '#DC2626'] : [colors.accent, colors.gold]}
        style={styles.header}
      >
        {isRedeemed ? (
          <Check size={40} color={colors.white} />
        ) : (
          <Ticket size={40} color={colors.white} />
        )}
        <Text style={styles.headerTitle}>{voucher.title}</Text>
        <Text style={styles.headerDesc}>{voucher.description}</Text>
        {isRedeemed && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              מומש {voucher.redeemedAt ? new Date(voucher.redeemedAt).toLocaleDateString('he-IL') : ''}
            </Text>
          </View>
        )}
        {isExpired && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>פג תוקף</Text>
          </View>
        )}
      </LinearGradient>

      <View style={styles.barcodeSection}>
        {isActive && tokenError && !qrPayload ? (
          <>
            <Text style={styles.barcodeLabel}>שגיאה ביצירת קוד</Text>
            <Pressable
              onPress={refreshToken}
              style={{ paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.accentLight, borderRadius: 12 }}
            >
              <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 16 }}>נסה שוב</Text>
            </Pressable>
          </>
        ) : isActive && qrPayload ? (
          <>
            <Text style={styles.barcodeLabel}>סרקו את הקוד</Text>
            <View style={styles.qrContainer}>
              {/* Watermark with user's phone for fraud prevention */}
              <View style={styles.watermark}>
                <Text style={styles.watermarkText}>{userPhone}</Text>
              </View>
              <QRCode value={qrPayload} size={220} />
            </View>
            <View style={styles.tokenTimer}>
              <ShieldCheck size={14} color={colors.success} />
              <Text style={styles.tokenTimerText}>
                קוד מתחדש בעוד {countdown} שניות
              </Text>
            </View>
            <Text style={styles.barcodeSubtext}>{voucher.barcode}</Text>
          </>
        ) : isPending ? (
          <>
            <Text style={styles.barcodeLabel}>קוד הקופון</Text>
            <View style={[styles.barcodeBox, styles.barcodeBoxPending]}>
              <Text style={styles.pendingText}>ממתין לסנכרון...</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.barcodeLabel}>קוד הקופון</Text>
            <View style={[styles.barcodeBox, isRedeemed && styles.barcodeBoxRedeemed]}>
              <Text style={[styles.barcodeText, isRedeemed && styles.barcodeTextRedeemed]}>
                {voucher.barcode}
              </Text>
            </View>
          </>
        )}

        {isActive && (
          <View style={styles.scanHint}>
            <Text style={styles.scanHintText}>הציגו למנהל לסריקה ומימוש</Text>
          </View>
        )}

        {voucher.expiresAt && !isRedeemed && !isExpired && (
          <View style={styles.expiryHint}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.expiryText}>
              בתוקף עד {new Date(voucher.expiresAt).toLocaleDateString('he-IL')}
            </Text>
          </View>
        )}
      </View>

      {voucher.value && (
        <View style={styles.valueBox}>
          <Text style={styles.valueText}>{voucher.value}% הנחה</Text>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 36,
    paddingHorizontal: 32,
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
  },
  headerDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  barcodeSection: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  barcodeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  qrContainer: {
    position: 'relative',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: colors.accent,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    zIndex: 1,
    alignItems: 'center',
    opacity: 0.06,
  },
  watermarkText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.black,
    letterSpacing: 4,
  },
  tokenTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tokenTimerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  barcodeSubtext: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  barcodeBox: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 40,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  barcodeBoxPending: {
    borderColor: '#FFDA6A',
  },
  barcodeText: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 4,
    textAlign: 'center',
  },
  pendingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#997404',
    textAlign: 'center',
  },
  scanHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  scanHintText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  barcodeBoxRedeemed: {
    borderColor: colors.border,
    opacity: 0.5,
  },
  barcodeTextRedeemed: {
    color: colors.textSecondary,
  },
  expiryHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  expiryText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  valueBox: {
    alignSelf: 'center',
    backgroundColor: colors.accentLight,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 14,
  },
  valueText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.accent,
  },
});
