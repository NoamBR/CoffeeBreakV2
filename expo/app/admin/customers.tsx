import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Coffee, Award, Flame, Users, Gift, Star } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useUserStore } from '@/stores/userStore';
import { useLoyaltyStore } from '@/stores/loyaltyStore';
import { useStreakStore } from '@/stores/streakStore';
import { useReferralStore } from '@/stores/referralStore';
import { useOrderHistoryStore } from '@/stores/orderHistoryStore';
import { getTier, getTierConfig } from '@/utils/tiers';
import TierBadge from '@/components/TierBadge';

export default function CustomersScreen() {
  const user = useUserStore((s) => s.user);
  const { stamps, stampsGoal, totalRewards, addStamp } = useLoyaltyStore();
  const { incrementCoffees } = useUserStore();
  const { currentStreak, longestStreak } = useStreakStore();
  const { referralCount } = useReferralStore();
  const fullOrders = useOrderHistoryStore((s) => s.fullOrders);
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const tier = getTier(user?.totalCoffees ?? 0);
  const tierConfig = getTierConfig(tier);

  const handleBonusStamp = () => {
    addStamp();
    incrementCoffees();
    Alert.alert('חותמת בונוס נוספה!', `${stamps + 1}/${stampsGoal}`);
  };

  const handleBonusReward = () => {
    useLoyaltyStore.setState((s) => ({ totalRewards: s.totalRewards + 1 }));
    Alert.alert('מתנה נוספה!', 'נוספה מתנה ללקוח.');
  };

  const handleResetStamps = () => {
    Alert.alert('איפוס חותמות', 'האם לאפס את החותמות?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'אפס',
        style: 'destructive',
        onPress: () => useLoyaltyStore.setState({ stamps: 0 }),
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>אין לקוח רשום במכשיר זה</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.slice(0, 2)}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <TierBadge />
        {user.phone && <Text style={styles.phone}>{user.phone}</Text>}
        {user.birthday && <Text style={styles.detail}>יום הולדת: {user.birthday}</Text>}
        <Text style={styles.detail}>לקוח מאז: {new Date(user.joinedAt).toLocaleDateString('he-IL')}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.stat}>
          <Coffee size={18} color={colors.primary} />
          <Text style={styles.statValue}>{user.totalCoffees}</Text>
          <Text style={styles.statLabel}>קפה</Text>
        </View>
        <View style={styles.stat}>
          <Award size={18} color="#F5A623" />
          <Text style={styles.statValue}>{totalRewards}</Text>
          <Text style={styles.statLabel}>מתנות</Text>
        </View>
        <View style={styles.stat}>
          <Star size={18} color={tierConfig.color} />
          <Text style={styles.statValue}>{stamps}/{stampsGoal}</Text>
          <Text style={styles.statLabel}>חותמות</Text>
        </View>
        <View style={styles.stat}>
          <Flame size={18} color="#F5A623" />
          <Text style={styles.statValue}>{currentStreak}</Text>
          <Text style={styles.statLabel}>סטריק</Text>
        </View>
      </View>

      <View style={styles.extraStats}>
        <Text style={styles.extraStat}>שיא סטריק: {longestStreak} ימים</Text>
        <Text style={styles.extraStat}>הזמנות חבר: {referralCount}</Text>
        <Text style={styles.extraStat}>הזמנות מלאות: {fullOrders.length}</Text>
      </View>

      {/* Admin Actions */}
      <Text style={styles.sectionTitle}>פעולות מנהל</Text>
      <View style={styles.actionsCol}>
        <Pressable style={styles.actionBtn} onPress={handleBonusStamp}>
          <Text style={styles.actionBtnText}>הוסף חותמת בונוס</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={handleBonusReward}>
          <Text style={styles.actionBtnText}>הוסף מתנה</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleResetStamps}>
          <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>אפס חותמות</Text>
        </Pressable>
      </View>

      {/* Recent Orders */}
      {fullOrders.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>הזמנות אחרונות</Text>
          {[...fullOrders].reverse().slice(0, 10).map((order) => (
            <View key={order.id} style={styles.orderRow}>
              <Text style={styles.orderTotal}>₪{order.total}</Text>
              <View style={styles.orderInfo}>
                <Text style={styles.orderItems}>
                  {order.items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}
                </Text>
                <Text style={styles.orderDate}>
                  {new Date(order.date).toLocaleDateString('he-IL')} {new Date(order.date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: colors.textSecondary },
  profileCard: { backgroundColor: colors.white, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { fontSize: 24, fontWeight: '800', color: colors.white },
  name: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  phone: { fontSize: 14, color: colors.textSecondary, marginTop: 6 },
  detail: { fontSize: 12, color: colors.inactive, marginTop: 2 },
  statsGrid: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stat: { flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textSecondary },
  extraStats: { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginTop: 12, gap: 4, borderWidth: 1, borderColor: colors.border },
  extraStat: { fontSize: 13, color: colors.textSecondary, textAlign: 'right' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, textAlign: 'right', marginTop: 24, marginBottom: 10 },
  actionsCol: { gap: 8 },
  actionBtn: { backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  actionBtnDanger: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.error },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: colors.white },
  actionBtnTextDanger: { color: colors.error },
  orderRow: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  orderInfo: { flex: 1, alignItems: 'flex-end' },
  orderItems: { fontSize: 13, color: colors.textPrimary, textAlign: 'right' },
  orderDate: { fontSize: 11, color: colors.inactive, marginTop: 2 },
  orderTotal: { fontSize: 16, fontWeight: '700', color: colors.primary },
});
