import { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Alert } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowRight, X } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { PAYME_CONFIG } from '@/constants/payment';

export default function PaymentWebViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    paymentUrl: string;
    orderId: string;
    pickupTime: string;
    notes: string;
    total: string;
    discount: string;
  }>();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'ביטול תשלום',
      'בטוח שברצונך לבטל את התשלום?',
      [
        { text: 'המשך לשלם', style: 'cancel' },
        {
          text: 'בטל',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  }, [router]);

  const handleNavigationChange = useCallback((navState: WebViewNavigation) => {
    const { url } = navState;

    // Detect success redirect
    if (url.includes('payment-result') && url.includes('status=success')) {
      // Extract transaction details from URL if available
      const urlParams = new URL(url).searchParams;
      const transactionId = urlParams.get('transaction_id') || '';
      const last4 = urlParams.get('card_last4') || '';

      router.replace({
        pathname: '/order-success',
        params: {
          pickupTime: params.pickupTime || 'בהקדם האפשרי',
          notes: params.notes || '',
          total: params.total || '0',
          discount: params.discount || '0',
          paymentMethod: 'credit_card',
          transactionId,
          last4,
        },
      });
      return;
    }

    // Detect failure redirect
    if (url.includes('payment-result') && url.includes('status=failed')) {
      Alert.alert(
        'התשלום נכשל',
        'לא הצלחנו לבצע את החיוב. נסו שוב או בחרו תשלום בקופה.',
        [
          {
            text: 'חזרה',
            onPress: () => router.back(),
          },
        ]
      );
    }
  }, [router, params]);

  if (!params.paymentUrl) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>שגיאה בטעינת עמוד התשלום</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>חזרה</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'תשלום מאובטח',
          headerLeft: () => (
            <Pressable onPress={handleCancel} hitSlop={10}>
              <X size={22} color={colors.textPrimary} />
            </Pressable>
          ),
        }}
      />
      <View style={styles.wrapper}>
        {/* Secure payment badge */}
        <View style={styles.secureBadge}>
          <Text style={styles.secureBadgeText}>תשלום מאובטח באמצעות ישראכרט</Text>
        </View>

        <WebView
          ref={webViewRef}
          source={{ uri: params.paymentUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          originWhitelist={[...PAYME_CONFIG.allowedOrigins.map(o => o + '*'), 'rork-app://*']}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>טוען עמוד תשלום...</Text>
            </View>
          )}
        />

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>טוען עמוד תשלום...</Text>
          </View>
        )}
      </View>
    </>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  secureBadge: {
    backgroundColor: colors.accentLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  secureBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
