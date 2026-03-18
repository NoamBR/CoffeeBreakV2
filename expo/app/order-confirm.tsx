import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, MessageSquare, ChevronDown, CreditCard, Store, Smartphone, Wallet, Lock } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useCartStore } from '@/stores/cartStore';
import { useUserStore } from '@/stores/userStore';
import { getTier, getTierConfig } from '@/utils/tiers';
import { formatPrice } from '@/utils/formatPrice';
import { PaymentMethod } from '@/types';
import { PAYMENT_METHODS } from '@/constants/payment';
import { initiateCardPayment } from '@/services/paymentService';

function generateTimeSlots(): string[] {
  const slots: string[] = ['בהקדם האפשרי'];
  const now = new Date();
  const minutes = now.getMinutes();
  const nextSlot = new Date(now);
  nextSlot.setMinutes(Math.ceil(minutes / 15) * 15 + 15, 0, 0);

  for (let i = 0; i < 8; i++) {
    const slot = new Date(nextSlot.getTime() + i * 15 * 60 * 1000);
    const h = slot.getHours().toString().padStart(2, '0');
    const m = slot.getMinutes().toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
  }
  return slots;
}

const paymentIcons: Record<string, typeof CreditCard> = {
  'store': Store,
  'credit-card': CreditCard,
  'smartphone': Smartphone,
  'apple': Wallet,
  'wallet': Wallet,
};

export default function OrderConfirmScreen() {
  const router = useRouter();
  const { items, getSubtotal } = useCartStore();
  const user = useUserStore((s) => s.user);
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const [selectedTime, setSelectedTime] = useState('בהקדם האפשרי');
  const [notes, setNotes] = useState('');
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('at_register');

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const subtotal = getSubtotal();
  const tier = user ? getTier(user.totalCoffees) : 'bronze';
  const tierConfig = getTierConfig(tier);
  const discountPercent = tierConfig.discount;
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const total = subtotal - discountAmount;

  const [processing, setProcessing] = useState(false);

  const orderParams = {
    pickupTime: selectedTime,
    notes: notes.trim(),
    total: total.toString(),
    discount: discountAmount.toString(),
  };

  const handleConfirm = async () => {
    if (processing) return;

    // For pay-at-register, go straight to order success
    if (paymentMethod === 'at_register') {
      router.replace({
        pathname: '/order-success',
        params: { ...orderParams, paymentMethod: 'at_register' },
      });
      return;
    }

    // For credit card, initiate payment via PayMe
    if (paymentMethod === 'credit_card') {
      setProcessing(true);
      const orderId = 'CB-' + Date.now().toString(36).toUpperCase().slice(-4);

      const result = await initiateCardPayment({
        amount: total,
        orderId,
        customerName: user?.name || '',
        customerPhone: user?.phone || '',
        method: 'credit_card',
      });

      setProcessing(false);

      if (result.success && result.paymentUrl) {
        router.push({
          pathname: '/payment-webview',
          params: {
            paymentUrl: result.paymentUrl,
            orderId,
            ...orderParams,
          },
        });
      } else {
        Alert.alert('שגיאה', result.error || 'לא ניתן לפתוח עמוד תשלום כרגע');
      }
      return;
    }

    // Other methods — not yet available
    Alert.alert('בקרוב', 'שיטת תשלום זו תהיה זמינה בקרוב');
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Items summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פריטים ({items.length})</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemPrice}>{formatPrice(item.totalPrice)}</Text>
              <Text style={styles.itemName}>
                {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}
              </Text>
            </View>
          ))}
        </View>

        {/* Pickup time */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>זמן איסוף</Text>
          </View>
          <Pressable
            style={styles.timeSelector}
            onPress={() => setShowTimeSlots(!showTimeSlots)}
          >
            <ChevronDown size={18} color={colors.textSecondary} />
            <Text style={styles.timeSelectorText}>{selectedTime}</Text>
          </Pressable>
          {showTimeSlots && (
            <View style={styles.timeSlotsContainer}>
              {timeSlots.map((slot) => (
                <Pressable
                  key={slot}
                  style={[styles.timeSlot, selectedTime === slot && styles.timeSlotActive]}
                  onPress={() => {
                    setSelectedTime(slot);
                    setShowTimeSlots(false);
                  }}
                >
                  <Text
                    style={[styles.timeSlotText, selectedTime === slot && styles.timeSlotTextActive]}
                  >
                    {slot}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Payment method */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>אמצעי תשלום</Text>
          </View>
          {PAYMENT_METHODS.map((pm) => {
            const Icon = paymentIcons[pm.icon] || Store;
            const isSelected = paymentMethod === pm.key;
            const isDisabled = !pm.enabled;

            return (
              <Pressable
                key={pm.key}
                style={[
                  styles.paymentOption,
                  isSelected && styles.paymentOptionSelected,
                  isDisabled && styles.paymentOptionDisabled,
                ]}
                onPress={() => {
                  if (pm.enabled) setPaymentMethod(pm.key);
                }}
                disabled={isDisabled}
              >
                <View style={styles.paymentOptionContent}>
                  <View style={[
                    styles.paymentRadio,
                    isSelected && styles.paymentRadioSelected,
                  ]}>
                    {isSelected && <View style={styles.paymentRadioDot} />}
                  </View>
                  <Text style={[
                    styles.paymentLabel,
                    isDisabled && styles.paymentLabelDisabled,
                  ]}>
                    {pm.label}
                  </Text>
                  {isDisabled && (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>בקרוב</Text>
                    </View>
                  )}
                </View>
                <Icon
                  size={20}
                  color={isDisabled ? colors.inactive : isSelected ? colors.primary : colors.textSecondary}
                />
              </Pressable>
            );
          })}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageSquare size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>הערות להזמנה</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            placeholder="בקשות מיוחדות, אלרגיות..."
            placeholderTextColor={colors.inactive}
            value={notes}
            onChangeText={setNotes}
            maxLength={200}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Price summary */}
        <View style={styles.section}>
          <View style={styles.priceRow}>
            <Text style={styles.priceValue}>{formatPrice(subtotal)}</Text>
            <Text style={styles.priceLabel}>סכום ביניים</Text>
          </View>
          {discountPercent > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceValue, { color: colors.success }]}>
                -{formatPrice(discountAmount)}
              </Text>
              <Text style={styles.priceLabel}>
                הנחת {tierConfig.name} ({discountPercent}%)
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            <Text style={styles.totalLabel}>סה״כ לתשלום</Text>
          </View>
        </View>

        {paymentMethod === 'at_register' && (
          <View style={styles.paymentNote}>
            <Text style={styles.paymentNoteText}>התשלום מתבצע בקופה בעת האיסוף</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {paymentMethod === 'credit_card' && (
          <View style={styles.secureNote}>
            <Lock size={12} color={colors.primary} />
            <Text style={styles.secureNoteText}>תשלום מאובטח באמצעות ישראכרט</Text>
          </View>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.confirmBtn,
            pressed && !processing && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            processing && { opacity: 0.7 },
          ]}
          onPress={handleConfirm}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.confirmBtnText}>
              {paymentMethod === 'credit_card' ? 'לתשלום' : 'אישור הזמנה'} · {formatPrice(total)}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'flex-end',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accentLight,
    borderRadius: 10,
    padding: 14,
  },
  timeSelectorText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    justifyContent: 'flex-end',
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  timeSlotActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accentLight,
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timeSlotTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  // ── Payment method ──
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.accentLight,
  },
  paymentOptionDisabled: {
    opacity: 0.5,
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  paymentRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentRadioSelected: {
    borderColor: colors.primary,
  },
  paymentRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  paymentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  paymentLabelDisabled: {
    color: colors.inactive,
  },
  comingSoonBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
  },
  // ── Notes ──
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'right',
    minHeight: 70,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  paymentNote: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  paymentNoteText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    paddingBottom: 32,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  secureNoteText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
