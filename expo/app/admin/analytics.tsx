import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TrendingUp, Coffee, Award, Banknote } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useAnalytics } from '@/hooks/useAnalytics';
import { formatPrice } from '@/utils/formatPrice';
import StatCard from '@/components/admin/StatCard';

export default function AnalyticsScreen() {
  const { today, week, allTime, popularItems, hourCounts } = useAnalytics();
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const maxHour = Math.max(...hourCounts, 1);
  const peakHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .filter((h) => h.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Today */}
      <Text style={styles.sectionTitle}>היום</Text>
      <View style={styles.statsGrid}>
        <StatCard icon={<TrendingUp size={18} color={colors.primary} />} value={today.orders} label="הזמנות" />
        <StatCard icon={<Banknote size={18} color={colors.success} />} value={formatPrice(today.revenue)} label="הכנסות" />
      </View>
      <View style={styles.statsGrid}>
        <StatCard icon={<Coffee size={18} color="#F5A623" />} value={today.stamps} label="חותמות" />
        <StatCard icon={<Award size={18} color="#E53935" />} value={today.rewards} label="מתנות" />
      </View>

      {/* This Week */}
      <Text style={styles.sectionTitle}>השבוע</Text>
      <View style={styles.statsGrid}>
        <StatCard icon={<TrendingUp size={18} color={colors.primary} />} value={week.orders} label="הזמנות" />
        <StatCard icon={<Banknote size={18} color={colors.success} />} value={formatPrice(week.revenue)} label="הכנסות" />
      </View>

      {/* All Time */}
      <Text style={styles.sectionTitle}>מאז ומעולם</Text>
      <View style={styles.statsGrid}>
        <StatCard icon={<TrendingUp size={18} color={colors.primary} />} value={allTime.orders} label="הזמנות" />
        <StatCard icon={<Banknote size={18} color={colors.success} />} value={formatPrice(allTime.revenue)} label="הכנסות" />
      </View>
      <View style={styles.statsGrid}>
        <StatCard icon={<Coffee size={18} color="#F5A623" />} value={allTime.stamps} label="חותמות" />
        <StatCard icon={<Award size={18} color="#E53935" />} value={allTime.rewards} label="מתנות" />
      </View>

      {/* Popular Items */}
      {popularItems.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>פריטים פופולריים</Text>
          {popularItems.map((item, i) => (
            <View key={i} style={styles.popularRow}>
              <Text style={styles.popularCount}>{item.count}x</Text>
              <View style={styles.popularBar}>
                <View
                  style={[
                    styles.popularFill,
                    { width: `${(item.count / popularItems[0].count) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.popularName}>{item.name}</Text>
              <Text style={styles.popularRank}>#{i + 1}</Text>
            </View>
          ))}
        </>
      )}

      {/* Peak Hours */}
      {peakHours.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>שעות שיא</Text>
          {peakHours.map((h) => (
            <View key={h.hour} style={styles.hourRow}>
              <Text style={styles.hourCount}>{h.count}</Text>
              <View style={styles.hourBar}>
                <View style={[styles.hourFill, { width: `${(h.count / maxHour) * 100}%` }]} />
              </View>
              <Text style={styles.hourLabel}>{String(h.hour).padStart(2, '0')}:00</Text>
            </View>
          ))}
        </>
      )}

      {popularItems.length === 0 && peakHours.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>עדיין אין נתונים. ההזמנות יתחילו להופיע כאן.</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, textAlign: 'right', marginTop: 20, marginBottom: 10 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  popularRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  popularRank: { fontSize: 12, fontWeight: '700', color: colors.inactive, width: 24, textAlign: 'center' },
  popularName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, width: 100, textAlign: 'right' },
  popularBar: { flex: 1, height: 20, backgroundColor: colors.accentLight, borderRadius: 4, overflow: 'hidden' },
  popularFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  popularCount: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, width: 30, textAlign: 'center' },
  hourRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  hourLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, width: 50, textAlign: 'right' },
  hourBar: { flex: 1, height: 18, backgroundColor: colors.accentLight, borderRadius: 4, overflow: 'hidden' },
  hourFill: { height: '100%', backgroundColor: '#F5A623', borderRadius: 4 },
  hourCount: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, width: 24, textAlign: 'center' },
  emptyState: { marginTop: 40, alignItems: 'center' },
  emptyText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
});
