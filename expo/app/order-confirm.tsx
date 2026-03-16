import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, MessageSquare, ChevronDown } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useCartStore } from '@/stores/cartStore';
import { useUserStore } from '@/stores/userStore';
import { getTier, getTierConfig } from '@/utils/tiers';
import { formatPrice } from '@/utils/formatPrice';

function generateTimeSlots(): string[] {
  const slots: string[] = ['בהקדם האפשרי'];
  const now = new Date();
  const minutes = now.getMinutes();
  // Round up to next 15-minute slot
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

export default function OrderConfirmScreen() {
  const router = useRouter();
  const { items, getSubtotal } = useCartStore();
  const user = useUserStore((s) => s.user);
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const [selectedTime, setSelectedTime] = useState('בהקדם האפשרי');
  const [notes, setNotes] = useState('');
  const [showTimeSlots, setShowTimeSlots] = useState(false);

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const subtotal = getSubtotal();
  const tier = user ? getTier(user.totalCoffees) : 'bronze';
  const tierConfig = getTierConfig(tier);
  const discountPercent = tierConfig.discount;
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const total = subtotal - discountAmount;

  const handleConfirm = () => {
    router.replace({
      pathname: '/order-success',
      params: {
        pickupTime: selectedTime,
        notes: notes.trim(),
        total: total.toString(),
        discount: discountAmount.toString(),
      },
    });
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

        <View style={styles.paymentNote}>
          <Text style={styles.paymentNoteText}>התשלום מתבצע בקופה בעת האיסוף</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmBtnText}>אישור הזמנה · {formatPrice(total)}</Text>
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
