import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert, Switch } from 'react-native';
import { Plus, Edit3, Trash2, X, Eye, EyeOff } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useMenuOverrideStore } from '@/stores/menuOverrideStore';
import { menuCategories } from '@/data/menu';
import { MenuItem, MenuCategory } from '@/types';
import { formatPrice } from '@/utils/formatPrice';

export default function MenuEditorScreen() {
  const { getEffectiveMenu, setOverride, addItem, removeItem, overrides } = useMenuOverrideStore();
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('pastry');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editFeatured, setEditFeatured] = useState(false);
  const [editNew, setEditNew] = useState(false);
  const [isNewItem, setIsNewItem] = useState(false);
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const allItems = getEffectiveMenu();
  const categoryItems = allItems.filter((i) => i.category === activeCategory);
  const hiddenIds = Object.entries(overrides).filter(([, v]) => v.hidden).map(([k]) => k);

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setEditName(item.name);
    setEditDesc(item.description);
    setEditPrice(item.price.toString());
    setEditFeatured(item.featured ?? false);
    setEditNew(item.isNew ?? false);
    setIsNewItem(false);
    setEditModalVisible(true);
  };

  const openAddNew = () => {
    setEditItem(null);
    setEditName('');
    setEditDesc('');
    setEditPrice('');
    setEditFeatured(false);
    setEditNew(true);
    setIsNewItem(true);
    setEditModalVisible(true);
  };

  const handleSave = () => {
    if (!editName.trim() || !editPrice.trim()) return;
    const price = parseFloat(editPrice);
    if (isNaN(price)) return;

    if (isNewItem) {
      const newItem: MenuItem = {
        id: `custom-${Date.now()}`,
        name: editName.trim(),
        description: editDesc.trim(),
        price,
        category: activeCategory,
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
        featured: editFeatured,
        isNew: editNew,
      };
      addItem(newItem);
    } else if (editItem) {
      setOverride(editItem.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        price,
        featured: editFeatured,
        isNew: editNew,
      });
    }
    setEditModalVisible(false);
  };

  const handleDelete = (item: MenuItem) => {
    Alert.alert('מחיקת פריט', `למחוק את "${item.name}"?`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: () => {
          if (item.id.startsWith('custom-')) {
            removeItem(item.id);
          } else {
            setOverride(item.id, { hidden: true });
          }
        },
      },
    ]);
  };

  const toggleHidden = (itemId: string) => {
    const current = overrides[itemId]?.hidden ?? false;
    setOverride(itemId, { hidden: !current });
  };

  return (
    <View style={styles.wrapper}>
      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        {menuCategories.map((cat) => (
          <Pressable
            key={cat.key}
            style={[styles.catTab, activeCategory === cat.key && styles.catTabActive]}
            onPress={() => setActiveCategory(cat.key)}
          >
            <Text style={[styles.catText, activeCategory === cat.key && styles.catTextActive]}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Items */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {categoryItems.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemActions}>
              <Pressable onPress={() => openEdit(item)} style={styles.iconBtn}>
                <Edit3 size={16} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => handleDelete(item)} style={styles.iconBtn}>
                <Trash2 size={16} color={colors.error} />
              </Pressable>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <View style={styles.itemMeta}>
                <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                {item.featured && <Text style={styles.badge}>מומלץ</Text>}
                {item.isNew && <Text style={[styles.badge, styles.badgeNew]}>חדש</Text>}
              </View>
            </View>
          </View>
        ))}

        {/* Hidden items */}
        {hiddenIds.length > 0 && (
          <>
            <Text style={styles.hiddenTitle}>פריטים מוסתרים ({hiddenIds.length})</Text>
            {hiddenIds.map((id) => (
              <Pressable key={id} style={styles.hiddenRow} onPress={() => toggleHidden(id)}>
                <EyeOff size={14} color={colors.inactive} />
                <Text style={styles.hiddenText}>{id}</Text>
                <Text style={styles.restoreText}>שחזר</Text>
              </Pressable>
            ))}
          </>
        )}

        {/* Add New */}
        <Pressable style={styles.addBtn} onPress={openAddNew}>
          <Plus size={18} color={colors.primary} />
          <Text style={styles.addBtnText}>הוסף פריט חדש</Text>
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
              <Text style={styles.modalTitle}>
                {isNewItem ? 'פריט חדש' : 'עריכת פריט'}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.fieldLabel}>שם</Text>
              <TextInput style={styles.input} value={editName} onChangeText={setEditName} textAlign="right" />

              <Text style={styles.fieldLabel}>תיאור</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                value={editDesc}
                onChangeText={setEditDesc}
                textAlign="right"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.fieldLabel}>מחיר (₪)</Text>
              <TextInput
                style={styles.input}
                value={editPrice}
                onChangeText={setEditPrice}
                keyboardType="numeric"
                textAlign="right"
              />

              <View style={styles.switchRow}>
                <Switch value={editFeatured} onValueChange={setEditFeatured} />
                <Text style={styles.switchLabel}>מומלץ</Text>
              </View>

              <View style={styles.switchRow}>
                <Switch value={editNew} onValueChange={setEditNew} />
                <Text style={styles.switchLabel}>חדש</Text>
              </View>
            </ScrollView>

            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
              onPress={handleSave}
            >
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
  categories: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  catTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  catTabActive: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  catText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  catTextActive: { color: colors.white },
  list: { padding: 16, paddingBottom: 40 },
  itemRow: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  itemInfo: { flex: 1, alignItems: 'flex-end' },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  itemMeta: { flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center' },
  itemPrice: { fontSize: 14, fontWeight: '700', color: colors.primary },
  badge: { fontSize: 10, fontWeight: '700', color: colors.primary, backgroundColor: colors.accentLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeNew: { color: colors.success, backgroundColor: colors.success + '15' },
  itemActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6 },
  hiddenTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, textAlign: 'right', marginTop: 20, marginBottom: 8 },
  hiddenRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  hiddenText: { flex: 1, fontSize: 13, color: colors.inactive },
  restoreText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed', marginTop: 16 },
  addBtnText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  modalForm: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, textAlign: 'right', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: colors.background, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 14 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  saveBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
});
