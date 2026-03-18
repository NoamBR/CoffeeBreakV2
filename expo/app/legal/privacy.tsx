import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';

export default function PrivacyPolicyScreen() {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  return (
    <>
      <Stack.Screen options={{ title: 'מדיניות פרטיות' }} />
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>מדיניות פרטיות — הפסקת קפה</Text>
          <Text style={styles.updated}>עדכון אחרון: 18 במרץ 2026</Text>

          <Text style={styles.sectionTitle}>מי אנחנו</Text>
          <Text style={styles.body}>
            "הפסקת קפה" היא בית קפה הממוקם בטיילת הצפונית, אשקלון, ישראל. האפליקציה שלנו מאפשרת ללקוחות לנהל את מועדון הנאמנות, לגלוש בתפריט, לבצע הזמנות ולממש קופונים.
          </Text>

          <Text style={styles.sectionTitle}>מידע שאנו אוספים</Text>
          <Text style={styles.subTitle}>מידע שאתם מספקים</Text>
          <Text style={styles.body}>
            {'\u2022'} מספר טלפון — לצורך אימות חשבון באמצעות קוד OTP ב-WhatsApp{'\n'}
            {'\u2022'} שם מלא — להתאמה אישית של חוויית השימוש{'\n'}
            {'\u2022'} תאריך לידה (אופציונלי) — לשליחת הטבות יום הולדת
          </Text>

          <Text style={styles.subTitle}>מידע שנאסף אוטומטית</Text>
          <Text style={styles.body}>
            {'\u2022'} היסטוריית הזמנות — לצורך מעקב נאמנות, חותמות, ו"הרגיל שלך"{'\n'}
            {'\u2022'} נתוני נאמנות — חותמות, דרגת VIP, רצפים, קופונים{'\n'}
            {'\u2022'} מזהה מכשיר — מזהה אנונימי לצורכי אבטחה
          </Text>

          <Text style={styles.subTitle}>מידע שאיננו אוספים</Text>
          <Text style={styles.body}>
            {'\u2022'} אין מעקב מיקום{'\n'}
            {'\u2022'} אין גישה לאנשי קשר{'\n'}
            {'\u2022'} אין שימוש ב-IDFA או מעקב פרסומי{'\n'}
            {'\u2022'} אין אחסון פרטי כרטיס אשראי באפליקציה
          </Text>

          <Text style={styles.sectionTitle}>עיבוד תשלומים</Text>
          <Text style={styles.body}>
            תשלומי כרטיס אשראי מעובדים באמצעות PayMe (ישראכרט) — ספק תשלומים מאושר העומד בתקני PCI DSS. פרטי כרטיס האשראי מוזנים ישירות בעמוד המאובטח של PayMe ואינם עוברים דרך האפליקציה או השרתים שלנו.
          </Text>

          <Text style={styles.sectionTitle}>אחסון מידע</Text>
          <Text style={styles.body}>
            המידע מאוחסן בשרתי Supabase המאובטחים. הגישה למידע מוגבלת בהתאם להרשאות Row Level Security.
          </Text>

          <Text style={styles.sectionTitle}>שיתוף מידע עם צדדים שלישיים</Text>
          <Text style={styles.body}>
            איננו מוכרים או משתפים מידע אישי עם צדדים שלישיים, למעט:{'\n'}
            {'\u2022'} PayMe/ישראכרט — לעיבוד תשלומים בלבד{'\n'}
            {'\u2022'} Meta Cloud API — לשליחת קודי OTP ב-WhatsApp בלבד{'\n'}
            {'\u2022'} Supabase — לאחסון מידע מאובטח
          </Text>

          <Text style={styles.sectionTitle}>זכויותיכם</Text>
          <Text style={styles.body}>
            בהתאם לחוק הגנת הפרטיות, יש לכם זכות:{'\n'}
            {'\u2022'} לגשת למידע האישי שלכם{'\n'}
            {'\u2022'} לתקן מידע שגוי{'\n'}
            {'\u2022'} למחוק את חשבונכם ואת כל המידע הקשור אליו{'\n'}
            {'\u2022'} לבטל הסכמה לקבלת הודעות שיווקיות
          </Text>

          <Text style={styles.sectionTitle}>יצירת קשר</Text>
          <Text style={styles.body}>
            לבקשות בנושא פרטיות:{'\n'}
            אימייל: privacy@coffeebreak.app{'\n'}
            הפסקת קפה, טיילת הצפונית, אשקלון
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24 },
  heading: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, textAlign: 'right', marginBottom: 4 },
  updated: { fontSize: 12, color: colors.textSecondary, textAlign: 'right', marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, textAlign: 'right', marginTop: 24, marginBottom: 8 },
  subTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, textAlign: 'right', marginTop: 12, marginBottom: 4 },
  body: { fontSize: 14, lineHeight: 22, color: colors.textSecondary, textAlign: 'right' },
});
