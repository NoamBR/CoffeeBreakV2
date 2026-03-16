import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert, Switch } from 'react-native';
import { Plus, Edit3, Trash2, X } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useDealsOverrideStore } from '@/stores/dealsOverrideStore';
import { Deal, DealType } from '@/types';

const DEAL_TYPES: { key: DealType; label: string }[] = [
  { key: 'general', label: 'כללי' },
  { key: 'happy_hour', label: 'Happy Hour' },
  { key: 'birthday', label: 'יום הולדת' },
  { key: 'bring_friend', label: 'הביאו חבר' },
  { key: 'seasonal', label: 'עונתי' },
];

export default function DealsEditorScreen() {
  const { getEffectiveDeals, setOverride, addDeal, removeDeal, overrides } = useDealsOverrideStore();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [dealType, setDealType] = useState<DealType>('general');
  const [validUntil, setValidUntil] = useState('');
  const [isNewDeal, setIsNewDeal] = useState(false);
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const deals = getEffectiveDeals();

  const openEdit = (deal: Deal) => {
    setEditDeal(deal);
    setTitle(deal.title);
    setDesc(deal.description);
    setDealType(deal.type);
    setValidUntil(deal.validUntil ?? '');
    setIsNewDeal(false);
    setEditModalVisible(true);
  };

  const openAddNew = () => {
    setEditDeal(null);
    setTitle('');
    setDesc('');
    setDealType('general');
    setValidUntil('');
    setIsNewDeal(true);
    setEditModalVisible(true);
  };

  const handleSave = () => {
    if (!title.trim() || !desc.trim()) return;

    if (isNewDeal) {
      addDeal({
        id: `deal-custom-${Date.now()}`,
        title: title.trim(),
        description: desc.trim(),
        type: dealType,
        validUntil: validUntil || undefined,
      });
    } else if (editDeal) {
      setOverride(editDeal.id, {
        title: title.trim(),
        description: desc.trim(),
        type: dealType,
        validUntil: validUntil || undefined,
      });
    }
    setEditModalVisible(false);
  };

  const handleDelete = (deal: Deal) => {
    Alert.alert('מחיקת מבצע', `למחוק את "${deal.title}"?`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: () => {
          if (deal.id.startsWith('deal-custom-')) {
            removeDeal(deal.id);
          } else {
            setOverride(deal.id, { disabled: true });
          }
        },
      },
    ]);
  };

  const handleToggle = (deal: Deal) => {
    const isDisabled = overrides[deal.id]?.disabled;
    setOverride(deal.id, { disabled: !isDisabled });
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {deals.map((deal) => (
          <View key={deal.id} style={styles.dealRow}>
            <View style={styles.dealActions}>
              <Pressable onPress={() => openEdit(deal)} style={styles.iconBtn}>
                <Edit3 size={16} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => handleDelete(deal)} style={styles.iconBtn}>
                <Trash2 size={16} color={colors.error} />
              </Pressable>
            </View>
            <View style={styles.dealInfo}>
              <Text style={styles.dealTitle}>{deal.title}</Text>
              <Text style={styles.dealDesc} numberOfLines={2}>{deal.description}</Text>
              {deal.validUntil && (
                <Text style={styles.dealValid}>עד {deal.validUntil}</Text>
              )}
            </View>
          </View>
        ))}

        <Pressable style={styles.addBtn} onPress={openAddNew}>
          <Plus size={18} color={colors.primary} />
          <Text style={styles.addBtnText}>הוסף מבצע חדש</Text>
        </Pressable>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setEditModalVisible(false)}>
                <X size={24} color={colors.textSecondary} />
              </Pressable>
              <Text style={styles.modalTitle}>{isNewDeal ? 'מבצע חדש' : 'עריכת מבצע'}</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView>
              <Text style={styles.fieldLabel}>כותרת</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} textAlign="right" />

              <Text style={styles.fieldLabel}>תיאור</Text>
              <TextInput style={[styles.input, styles.inputMulti]} value={desc} onChangeText={setDesc} textAlign="right" multiline />

              <Text style={styles.fieldLabel}>סוג</Text>
              <View style={styles.typeRow}>
                {DEAL_TYPES.map((t) => (
                  <Pressable
                    key={t.key}
                    style={[styles.typeChip, dealType === t.key && styles.typeChipActive]}
                    onPress={() => setDealType(t.key)}
                  >
                    <Text style={[styles.typeChipText, dealType === t.key && styles.typeChipTextActive]}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>תוקף עד (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={validUntil} onChangeText={setValidUntil} textAlign="right" placeholder="ריק = ללא הגבלה" placeholderTextColor={colors.inactive} />
            </ScrollView>

            <Pressable style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]} onPress={handleSave}>
              <Text style={styles.saveBtnText}>שמור</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingBottom: 40 },
  dealRow: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  dealInfo: { flex: 1, alignItems: 'flex-end' },
  dealTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  dealDesc: { fontSize: 13, color: colors.textSecondary, textAlign: 'right', marginTop: 2 },
  dealValid: { fontSize: 11, color: colors.inactive, marginTop: 4 },
  dealActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed', marginTop: 12 },
  addBtnText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, textAlign: 'right', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: colors.background, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  typeChipActive: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  typeChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  typeChipTextActive: { color: colors.white },
  saveBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
});
