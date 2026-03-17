import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  Animated,
} from 'react-native';
import { X, Minus, Plus, Check } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { MenuItem, ItemCustomization, MilkType, SugarLevel, DrinkSize, BreadType } from '@/types';
import {
  getCustomizationConfig,
  milkOptions,
  sugarOptions,
  sizeOptions,
  breadOptions,
  foodExtras,
} from '@/data/customizations';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/utils/formatPrice';

type Props = {
  item: MenuItem;
  visible: boolean;
  onClose: () => void;
};

export default function CustomizationModal({ item, visible, onClose }: Props) {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const config = getCustomizationConfig(item.category);
  const addItem = useCartStore((s) => s.addItem);

  const [milkType, setMilkType] = useState<MilkType>('regular');
  const [sugarLevel, setSugarLevel] = useState<SugarLevel>('regular');
  const [size, setSize] = useState<DrinkSize>('small');
  const [breadType, setBreadType] = useState<BreadType>('chalah');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const btnScale = useRef(new Animated.Value(1)).current;

  const totalPrice = useMemo(() => {
    let unit = item.price;
    if (config.showMilk) {
      const milkOpt = milkOptions.find((m) => m.value === milkType);
      if (milkOpt) unit += milkOpt.priceAdd;
    }
    if (config.showSize) {
      const sizeOpt = sizeOptions.find((s) => s.value === size);
      if (sizeOpt) unit += sizeOpt.priceAdd;
    }
    if (config.showBread) {
      const breadOpt = breadOptions.find((b) => b.value === breadType);
      if (breadOpt) unit += breadOpt.priceAdd;
    }
    if (config.showExtras) {
      for (const id of selectedExtras) {
        const extra = foodExtras.find((e) => e.id === id);
        if (extra) unit += extra.price;
      }
    }
    return unit * quantity;
  }, [item.price, milkType, size, breadType, selectedExtras, quantity, config]);

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleAdd = () => {
    if (adding) return;

    const customization: ItemCustomization = {};
    if (config.showMilk) customization.milkType = milkType;
    if (config.showSugar) customization.sugarLevel = sugarLevel;
    if (config.showSize) customization.size = size;
    if (config.showBread) customization.breadType = breadType;
    if (config.showExtras && selectedExtras.length > 0) customization.extras = selectedExtras;
    if (notes.trim()) customization.notes = notes.trim();

    addItem(item, quantity, Object.keys(customization).length > 0 ? customization : undefined);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Show "נוסף!" confirmation before closing
    setAdding(true);
    btnScale.setValue(0.9);
    Animated.spring(btnScale, {
      toValue: 1,
      tension: 200,
      friction: 6,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      setAdding(false);
      resetAndClose();
    }, 600);
  };

  const resetAndClose = () => {
    setMilkType('regular');
    setSugarLevel('regular');
    setSize('small');
    setBreadType('chalah');
    setSelectedExtras([]);
    setNotes('');
    setQuantity(1);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable onPress={resetAndClose} hitSlop={8}>
              <X size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>התאמה אישית</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Item preview */}
            <View style={styles.itemPreview}>
              <Image source={item.image} style={styles.itemImage} contentFit="cover" />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
              </View>
            </View>

            {/* Milk */}
            {config.showMilk && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>סוג חלב</Text>
                <View style={styles.optionGrid}>
                  {milkOptions.map((opt) => (
                    <Pressable
                      key={opt.value}
                      style={[styles.optionChip, milkType === opt.value && styles.optionChipActive]}
                      onPress={() => setMilkType(opt.value)}
                    >
                      <Text
                        style={[styles.optionText, milkType === opt.value && styles.optionTextActive]}
                      >
                        {opt.label}
                        {opt.priceAdd > 0 ? ` (+${formatPrice(opt.priceAdd)})` : ''}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Sugar */}
            {config.showSugar && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>סוכר</Text>
                <View style={styles.optionGrid}>
                  {sugarOptions.map((opt) => (
                    <Pressable
                      key={opt.value}
                      style={[styles.optionChip, sugarLevel === opt.value && styles.optionChipActive]}
                      onPress={() => setSugarLevel(opt.value)}
                    >
                      <Text
                        style={[styles.optionText, sugarLevel === opt.value && styles.optionTextActive]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Size */}
            {config.showSize && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>גודל</Text>
                <View style={styles.optionGrid}>
                  {sizeOptions.map((opt) => (
                    <Pressable
                      key={opt.value}
                      style={[styles.optionChip, size === opt.value && styles.optionChipActive]}
                      onPress={() => setSize(opt.value)}
                    >
                      <Text
                        style={[styles.optionText, size === opt.value && styles.optionTextActive]}
                      >
                        {opt.label}
                        {opt.priceAdd > 0 ? ` (+${formatPrice(opt.priceAdd)})` : ''}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Bread */}
            {config.showBread && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>סוג לחם</Text>
                <View style={styles.optionGrid}>
                  {breadOptions.map((opt) => (
                    <Pressable
                      key={opt.value}
                      style={[styles.optionChip, breadType === opt.value && styles.optionChipActive]}
                      onPress={() => setBreadType(opt.value)}
                    >
                      <Text
                        style={[styles.optionText, breadType === opt.value && styles.optionTextActive]}
                      >
                        {opt.label}
                        {opt.priceAdd > 0 ? ` (+${formatPrice(opt.priceAdd)})` : ''}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Extras */}
            {config.showExtras && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>תוספות</Text>
                <View style={styles.optionGrid}>
                  {foodExtras.map((extra) => {
                    const selected = selectedExtras.includes(extra.id);
                    return (
                      <Pressable
                        key={extra.id}
                        style={[styles.optionChip, selected && styles.optionChipActive]}
                        onPress={() => toggleExtra(extra.id)}
                      >
                        <Text style={[styles.optionText, selected && styles.optionTextActive]}>
                          {extra.name} (+{formatPrice(extra.price)})
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Notes */}
            {config.showNotes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>הערות</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="בקשות מיוחדות..."
                  placeholderTextColor={colors.inactive}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={2}
                />
              </View>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Bottom bar */}
          <View style={styles.bottomBar}>
            <View style={styles.quantityRow}>
              <Pressable
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus size={18} color={colors.primary} />
              </Pressable>
              <Text style={styles.qtyText}>{quantity}</Text>
              <Pressable
                style={styles.qtyBtn}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Plus size={18} color={colors.primary} />
              </Pressable>
            </View>
            <Animated.View style={{ flex: 1, transform: [{ scale: btnScale }] }}>
              <Pressable
                style={[styles.addButton, adding && { backgroundColor: colors.success }]}
                onPress={handleAdd}
              >
                {adding ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Check size={18} color={colors.white} strokeWidth={3} />
                    <Text style={styles.addButtonText}>נוסף!</Text>
                  </View>
                ) : (
                  <Text style={styles.addButtonText}>
                    הוסף לעגלה · {formatPrice(totalPrice)}
                  </Text>
                )}
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  body: {
    paddingHorizontal: 20,
  },
  itemPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 14,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  itemInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 10,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  optionChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accentLight,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  optionTextActive: {
    color: colors.primary,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'right',
    minHeight: 60,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 14,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  qtyBtn: {
    padding: 4,
  },
  qtyText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  addButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
