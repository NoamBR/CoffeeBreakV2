import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ClipboardList, Stamp, FileEdit, Megaphone,
  Users, BarChart3, Settings, Bell, Coffee, Banknote, LogOut,
} from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useAdminStore } from '@/stores/adminStore';
import { useAnalytics } from '@/hooks/useAnalytics';
import StatCard from '@/components/admin/StatCard';
import QuickAction from '@/components/admin/QuickAction';
import { formatPrice } from '@/utils/formatPrice';

export default function AdminDashboard() {
  const router = useRouter();
  const logout = useAdminStore((s) => s.logout);
  const { today } = useAnalytics();
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const handleLogout = () => {
    logout();
    router.replace('/(tabs)/profile');
  };

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* KPIs */}
      <Text style={styles.sectionTitle}>סיכום היום</Text>
      <View style={styles.statsGrid}>
        <StatCard
          icon={<ClipboardList size={20} color={colors.primary} />}
          value={today.orders}
          label="הזמנות"
          color={colors.primary}
        />
        <StatCard
          icon={<Coffee size={20} color="#F5A623" />}
          value={today.stamps}
          label="חותמות"
          color="#F5A623"
        />
      </View>
      <View style={styles.statsGrid}>
        <StatCard
          icon={<Banknote size={20} color={colors.success} />}
          value={formatPrice(today.revenue)}
          label="הכנסות"
          color={colors.success}
        />
        <StatCard
          icon={<Stamp size={20} color="#E53935" />}
          value={today.rewards}
          label="מתנות"
          color="#E53935"
        />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>פעולות מהירות</Text>
      <View style={styles.actionsGrid}>
        <QuickAction
          icon={<ClipboardList size={22} color={colors.primary} />}
          label="הזמנות"
          onPress={() => router.push('/admin/orders')}
        />
        <QuickAction
          icon={<Stamp size={22} color="#F5A623" />}
          label="חותמת"
          onPress={() => router.push('/admin/stamp-scanner')}
        />
      </View>
      <View style={styles.actionsGrid}>
        <QuickAction
          icon={<FileEdit size={22} color={colors.primary} />}
          label="תפריט"
          onPress={() => router.push('/admin/menu-editor')}
        />
        <QuickAction
          icon={<Megaphone size={22} color="#9C27B0" />}
          label="מבצעים"
          onPress={() => router.push('/admin/deals-editor')}
        />
      </View>
      <View style={styles.actionsGrid}>
        <QuickAction
          icon={<Users size={22} color={colors.primary} />}
          label="לקוחות"
          onPress={() => router.push('/admin/customers')}
        />
        <QuickAction
          icon={<BarChart3 size={22} color={colors.success} />}
          label="ניתוח"
          onPress={() => router.push('/admin/analytics')}
        />
      </View>
      <View style={styles.actionsGrid}>
        <QuickAction
          icon={<Bell size={22} color="#F5A623" />}
          label="הודעות"
          onPress={() => router.push('/admin/notifications')}
        />
        <QuickAction
          icon={<Settings size={22} color={colors.textSecondary} />}
          label="הגדרות"
          onPress={() => router.push('/admin/settings')}
        />
      </View>

      {/* Logout */}
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={18} color={colors.error} />
        <Text style={styles.logoutText}>יציאה מניהול</Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 12,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
});
