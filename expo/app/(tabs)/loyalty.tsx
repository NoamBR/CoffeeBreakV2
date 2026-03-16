import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Award, TrendingUp, Lock, X } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useLoyaltyStore } from '@/stores/loyaltyStore';
import { useUserStore } from '@/stores/userStore';
import { useStreakStore } from '@/stores/streakStore';
import { getTier, getTierConfig } from '@/utils/tiers';
import { useSettingsStore } from '@/stores/settingsStore';
import LoyaltyCard from '@/components/LoyaltyCard';
import TierProgressCard from '@/components/TierProgressCard';
import ScratchCard from '@/components/ScratchCard';
import TierUpModal from '@/components/TierUpModal';
import { TierConfig } from '@/utils/tiers';
import type { ColorScheme } from '@/constants/colors';

export default function LoyaltyScreen() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { totalRewards, history, addStamp } = useLoyaltyStore();
  const { incrementCoffees, user } = useUserStore();
  const staffPin = useSettingsStore((s) => s.staffPin);
  const { recordOrder } = useStreakStore();
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pin, setPin] = useState('');
  const pinRef = useRef<TextInput>(null);
  const [tierUpVisible, setTierUpVisible] = useState(false);
  const [newTierConfig, setNewTierConfig] = useState<TierConfig | null>(null);

  const isGuest = !user || user.name === 'אורח' || !user.phone;

  const openPinModal = () => {
    if (isGuest) {
      Alert.alert(
        'נדרשת הרשמה',
        'כדי לצבור חותמות, יש להירשם עם שם וטלפון בפרופיל.',
      );
      return;
    }
    setPin('');
    setPinModalVisible(true);
    setTimeout(() => pinRef.current?.focus(), 300);
  };

  const handlePinSubmit = () => {
    if (pin === staffPin) {
      setPinModalVisible(false);
      setPin('');

      const prevTier = getTier(user?.totalCoffees ?? 0);

      const rewardEarned = addStamp();
      incrementCoffees();

      const { milestone } = recordOrder();
      if (milestone === 7) {
        addStamp();
      }

      const newTier = getTier((user?.totalCoffees ?? 0) + 1);
      if (newTier !== prevTier) {
        setNewTierConfig(getTierConfig(newTier));
        setTimeout(() => setTierUpVisible(true), 500);
      }

      if (rewardEarned) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('מזל טוב!', 'הגעת למשקה חינם! הראה מסך זה לצוות.');
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (milestone === 3) {
          Alert.alert('כל הכבוד!', '3 ימים רצופים!');
        } else if (milestone === 7) {
          Alert.alert('מדהים!', '7 ימים רצופים! קיבלת חותמת בונוס!');
        } else {
          Alert.alert('חותמת נוספה!', 'תודה שבחרת בנו');
        }
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPin('');
      Alert.alert('קוד שגוי', 'הקוד שהוזן אינו נכון. פנה לצוות.');
    }
  };

  const recentHistory = [...history].reverse().slice(0, 20);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TierProgressCard />

        <View style={styles.spacer} />

        <LoyaltyCard />

        <Pressable
          style={({ pressed }) => [
            styles.stampBtn,
            isGuest && styles.stampBtnDisabled,
            pressed && !isGuest && styles.stampBtnPressed,
          ]}
          onPress={openPinModal}
        >
          <Lock size={20} color={colors.white} />
          <Text style={styles.stampBtnText}>
            {isGuest ? 'הירשמו כדי לצבור חותמות' : 'הוספת חותמת (צוות)'}
          </Text>
        </Pressable>
        <Text style={styles.stampHint}>
          {isGuest
            ? 'עדכנו את הפרטים בפרופיל כדי להתחיל לצבור'
            : 'בקשו מהצוות להזין קוד להוספת חותמת'}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Award size={24} color={colors.accent} />
            <Text style={styles.statNumber}>{totalRewards}</Text>
            <Text style={styles.statLabel}>מתנות שנוצלו</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={24} color={colors.accent} />
            <Text style={styles.statNumber}>{user?.totalCoffees ?? 0}</Text>
            <Text style={styles.statLabel}>כוסות קפה</Text>
          </View>
        </View>

        {recentHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>היסטוריה</Text>
            {recentHistory.map((event, idx) => (
              <View key={idx} style={styles.historyItem}>
                <Text style={styles.historyDate}>
                  {new Date(event.date).toLocaleDateString('he-IL')}
                </Text>
                <Text style={styles.historyType}>
                  {event.type === 'stamp' ? 'חותמת' : 'מתנה!'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <ScratchCard />

      <TierUpModal
        visible={tierUpVisible}
        tier={newTierConfig}
        onDismiss={() => setTierUpVisible(false)}
      />

      <Modal
        visible={pinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable
              style={styles.modalClose}
              onPress={() => setPinModalVisible(false)}
            >
              <X size={24} color={colors.textSecondary} />
            </Pressable>

            <Lock size={40} color={colors.accent} />
            <Text style={styles.modalTitle}>קוד צוות</Text>
            <Text style={styles.modalSubtitle}>בקשו מאיש הצוות להזין את הקוד</Text>

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
              onSubmitEditing={handlePinSubmit}
            />

            <Pressable
              style={({ pressed }) => [
                styles.pinSubmitBtn,
                pin.length < 4 && styles.pinSubmitBtnDisabled,
                pressed && styles.pinSubmitBtnPressed,
              ]}
              onPress={handlePinSubmit}
              disabled={pin.length < 4}
            >
              <Text style={styles.pinSubmitText}>אישור</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  spacer: {
    height: 16,
  },
  stampBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  stampBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  stampBtnDisabled: {
    backgroundColor: colors.inactive,
  },
  stampBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  stampHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  historySection: {
    marginTop: 24,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  historyType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 32,
    width: '100%',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  pinInput: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    backgroundColor: colors.accentLight,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 24,
    width: '100%',
    letterSpacing: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  pinSubmitBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  pinSubmitBtnDisabled: {
    opacity: 0.4,
  },
  pinSubmitBtnPressed: {
    opacity: 0.8,
  },
  pinSubmitText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },
});
