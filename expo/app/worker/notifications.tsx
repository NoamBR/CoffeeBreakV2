import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Bell, Check, Trash2 } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import { useInAppNotificationsStore } from '@/stores/inAppNotificationsStore';

export default function WorkerNotificationsScreen() {
  const { staffNotifications, markRead, markAllRead, clearAll } = useInAppNotificationsStore();
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const unreadCount = staffNotifications.filter((n) => !n.read).length;

  return (
    <View style={styles.wrapper}>
      {/* Header actions */}
      {staffNotifications.length > 0 && (
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <Pressable style={styles.headerBtn} onPress={() => markAllRead('staff')}>
              <Check size={14} color={colors.primary} />
              <Text style={styles.headerBtnText}>סמן הכל כנקרא</Text>
            </Pressable>
          )}
          <Pressable style={styles.headerBtn} onPress={() => clearAll('staff')}>
            <Trash2 size={14} color={colors.error} />
            <Text style={[styles.headerBtnText, { color: colors.error }]}>נקה הכל</Text>
          </Pressable>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {staffNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={40} color={colors.inactive} />
            <Text style={styles.emptyText}>אין התראות</Text>
          </View>
        ) : (
          staffNotifications.map((notif) => (
            <Pressable
              key={notif.id}
              style={[styles.notifCard, !notif.read && styles.notifUnread]}
              onPress={() => markRead(notif.id, 'staff')}
            >
              <View style={styles.notifHeader}>
                {!notif.read && <View style={styles.unreadDot} />}
                <Text style={styles.notifTitle}>{notif.title}</Text>
              </View>
              <Text style={styles.notifBody}>{notif.body}</Text>
              <Text style={styles.notifTime}>
                {new Date(notif.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                {' · '}
                {new Date(notif.createdAt).toLocaleDateString('he-IL')}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  list: { padding: 16, paddingBottom: 40 },
  notifCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifUnread: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.accentLight,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  notifBody: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: 6,
  },
  notifTime: {
    fontSize: 11,
    color: colors.inactive,
    textAlign: 'left',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
