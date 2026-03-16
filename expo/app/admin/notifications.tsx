import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { Send, Clock, Trash2 } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';
import {
  useNotificationsStore,
  NOTIFICATION_TEMPLATES,
  NotificationTarget,
} from '@/stores/notificationsStore';

const TARGETS: { key: NotificationTarget; label: string }[] = [
  { key: 'all', label: 'כל הלקוחות' },
  { key: 'bronze', label: 'ברונזה' },
  { key: 'silver', label: 'כסף' },
  { key: 'gold', label: 'זהב' },
  { key: 'birthday', label: 'יום הולדת החודש' },
];

export default function NotificationsScreen() {
  const { history, sendNotification, clearHistory } = useNotificationsStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<NotificationTarget>('all');
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const handleSend = () => {
    if (!title.trim() || !body.trim()) return;
    sendNotification(title.trim(), body.trim(), target);
    Alert.alert('הודעה נשלחה!', 'ההודעה נשמרה (תישלח כשנחבר Push).');
    setTitle('');
    setBody('');
  };

  const applyTemplate = (t: typeof NOTIFICATION_TEMPLATES[number]) => {
    setTitle(t.title);
    setBody(t.body);
  };

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Compose */}
      <Text style={styles.sectionTitle}>שליחת הודעה</Text>

      {/* Templates */}
      <Text style={styles.subTitle}>תבניות מוכנות</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templatesRow}>
        {NOTIFICATION_TEMPLATES.map((t) => (
          <Pressable key={t.id} style={styles.templateChip} onPress={() => applyTemplate(t)}>
            <Text style={styles.templateChipText}>{t.title}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>כותרת</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} textAlign="right" placeholder="כותרת ההודעה" placeholderTextColor={colors.inactive} />

        <Text style={styles.fieldLabel}>תוכן</Text>
        <TextInput style={[styles.input, styles.inputMulti]} value={body} onChangeText={setBody} textAlign="right" multiline placeholder="תוכן ההודעה..." placeholderTextColor={colors.inactive} />

        <Text style={styles.fieldLabel}>קהל יעד</Text>
        <View style={styles.targetsRow}>
          {TARGETS.map((t) => (
            <Pressable
              key={t.key}
              style={[styles.targetChip, target === t.key && styles.targetChipActive]}
              onPress={() => setTarget(t.key)}
            >
              <Text style={[styles.targetChipText, target === t.key && styles.targetChipTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.sendBtn, (!title.trim() || !body.trim()) && styles.sendBtnDisabled, pressed && { opacity: 0.8 }]}
          onPress={handleSend}
          disabled={!title.trim() || !body.trim()}
        >
          <Send size={18} color={colors.white} />
          <Text style={styles.sendBtnText}>שלח הודעה</Text>
        </Pressable>
      </View>

      {/* History */}
      {history.length > 0 && (
        <>
          <View style={styles.historyHeader}>
            <Pressable onPress={() => {
              Alert.alert('מחיקת היסטוריה', 'למחוק את כל ההיסטוריה?', [
                { text: 'ביטול', style: 'cancel' },
                { text: 'מחק', style: 'destructive', onPress: clearHistory },
              ]);
            }}>
              <Trash2 size={16} color={colors.error} />
            </Pressable>
            <Text style={styles.sectionTitle}>היסטוריה</Text>
          </View>
          {history.map((notif) => (
            <View key={notif.id} style={styles.historyCard}>
              <Text style={styles.historyTitle}>{notif.title}</Text>
              <Text style={styles.historyBody}>{notif.body}</Text>
              <View style={styles.historyMeta}>
                <Text style={styles.historyTarget}>
                  {TARGETS.find((t) => t.key === notif.target)?.label ?? notif.target}
                </Text>
                <View style={styles.historyTime}>
                  <Clock size={12} color={colors.inactive} />
                  <Text style={styles.historyTimeText}>
                    {new Date(notif.sentAt).toLocaleDateString('he-IL')}{' '}
                    {new Date(notif.sentAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
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
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, textAlign: 'right', marginTop: 8, marginBottom: 10 },
  subTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textAlign: 'right', marginBottom: 8 },
  templatesRow: { gap: 8, marginBottom: 16 },
  templateChip: { backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  templateChipText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  card: { backgroundColor: colors.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textAlign: 'right', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: colors.background, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  targetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  targetChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  targetChipActive: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  targetChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  targetChipTextActive: { color: colors.white },
  sendBtn: { flexDirection: 'row', backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 },
  historyCard: { backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  historyTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, textAlign: 'right' },
  historyBody: { fontSize: 13, color: colors.textSecondary, textAlign: 'right', marginTop: 4 },
  historyMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  historyTarget: { fontSize: 11, fontWeight: '600', color: colors.primary, backgroundColor: colors.accentLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  historyTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyTimeText: { fontSize: 11, color: colors.inactive },
});
