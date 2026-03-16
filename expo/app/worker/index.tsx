import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ClipboardList, Stamp, Bell, LogOut } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useAdminStore } from '@/stores/adminStore';
import { useOrderHistoryStore } from '@/stores/orderHistoryStore';
import { useInAppNotificationsStore } from '@/stores/inAppNotificationsStore';
import StatCard from '@/components/admin/StatCard';
import QuickAction from '@/components/admin/QuickAction';

export default function WorkerDashboard() {
  const router = useRouter();
  const logout = useAdminStore((s) => s.logout);
  const fullOrders = useOrderHistoryStore((s) => s.fullOrders);
  const staffNotifs = useInAppNotificationsStore((s) => s.staffNotifications);
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const activeOrders = fullOrders.filter(
    (o) => o.status === 'placed' || o.status === 'preparing' || o.status === 'ready'
  );
  const staffUnread = staffNotifs.filter((n) => !n.read).length;

  const placedCount = activeOrders.filter((o) => o.status === 'placed').length;
  const preparingCount = activeOrders.filter((o) => o.status === 'preparing').length;
  const readyCount = activeOrders.filter((o) => o.status === 'ready').length;

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.content}>
      {/* Alert for new orders */}
      {placedCount > 0 && (
        <Pressable style={styles.alertBanner} onPress={() => router.push('/worker/orders')}>
          <Text style={styles.alertText}>{placedCount} הזמנות חדשות ממתינות!</Text>
          <Bell size={18} color={colors.white} />
        </Pressable>
      )}

      {/* Stats */}
      <Text style={styles.sectionTitle}>סטטוס הזמנות</Text>
      <View style={styles.statsRow}>
        <StatCard
          icon={<ClipboardList size={18} color="#F5A623" />}
          value={placedCount}
          label="ממתינות"
          color="#F5A623"
        />
        <StatCard
          icon={<ClipboardList size={18} color="#9C27B0" />}
          value={preparingCount}
          label="בהכנה"
          color="#9C27B0"
        />
        <StatCard
          icon={<ClipboardList size={18} color={colors.primary} />}
          value={readyCount}
          label="מוכנות"
          color={colors.primary}
        />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>פעולות</Text>
      <View style={styles.actionsRow}>
        <QuickAction
          icon={<ClipboardList size={24} color={colors.primary} />}
          label="הזמנות"
          onPress={() => router.push('/worker/orders')}
        />
        <QuickAction
          icon={<Stamp size={24} color="#F5A623" />}
          label="חותמת"
          onPress={() => router.push('/worker/stamp')}
        />
      </View>
      <View style={styles.actionsRow}>
        <QuickAction
          icon={
            <View>
              <Bell size={24} color={colors.primary} />
              {staffUnread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{staffUnread}</Text>
                </View>
              )}
            </View>
          }
          label="התראות"
          onPress={() => router.push('/worker/notifications')}
        />
        <QuickAction
          icon={<LogOut size={24} color={colors.error} />}
          label="יציאה"
          onPress={() => { logout(); router.replace('/(tabs)/profile'); }}
        />
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#F5A623',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  alertText: { fontSize: 16, fontWeight: '700', color: colors.white },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, textAlign: 'right', marginBottom: 12, marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: colors.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: colors.white },
});
