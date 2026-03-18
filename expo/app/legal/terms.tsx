import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ColorScheme } from '@/constants/colors';

export default function TermsOfServiceScreen() {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  return (
    <>
      <Stack.Screen options={{ title: 'תנאי שימוש' }} />
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>תנאי שימוש — הפסקת קפה</Text>
          <Text style={styles.updated}>עדכון אחרון: 18 במרץ 2026</Text>

          <Text style={styles.sectionTitle}>כללי</Text>
          <Text style={styles.body}>
            תנאי שימוש אלו חלים על השימוש באפליקציית "הפסקת קפה" המופעלת על ידי הפסקת קפה, טיילת הצפונית, אשקלון, ישראל. השימוש באפליקציה מהווה הסכמה לתנאים אלו.
          </Text>

          <Text style={styles.sectionTitle}>השירותים</Text>
          <Text style={styles.body}>
            האפליקציה מספקת:{'\n'}
            {'\u2022'} מועדון נאמנות דיגיטלי (חותמות, דרגות VIP, קופונים){'\n'}
            {'\u2022'} גלישה בתפריט בית הקפה{'\n'}
            {'\u2022'} ביצוע הזמנות מראש לאיסוף בחנות{'\n'}
            {'\u2022'} מימוש קופונים והטבות
          </Text>

          <Text style={styles.sectionTitle}>חשבון משתמש</Text>
          <Text style={styles.body}>
            {'\u2022'} הרשמה מתבצעת באמצעות מספר טלפון ואימות OTP{'\n'}
            {'\u2022'} אתם אחראים לשמירה על אבטחת חשבונכם{'\n'}
            {'\u2022'} ניתן להשתמש באפליקציה כאורח ללא הרשמה (עם תכונות מוגבלות)
          </Text>

          <Text style={styles.sectionTitle}>מועדון נאמנות</Text>
          <Text style={styles.body}>
            {'\u2022'} חותמות נאמנות ניתנות בעת רכישה בחנות בלבד{'\n'}
            {'\u2022'} חותמות אינן ניתנות להעברה בין חשבונות{'\n'}
            {'\u2022'} הפסקת קפה שומרת לעצמה את הזכות לשנות את תנאי מועדון הנאמנות
          </Text>

          <Text style={styles.sectionTitle}>קופונים והטבות</Text>
          <Text style={styles.body}>
            {'\u2022'} קופונים תקפים לתקופה המצוינת עליהם{'\n'}
            {'\u2022'} קופון ניתן למימוש פעם אחת בלבד{'\n'}
            {'\u2022'} הפסקת קפה רשאית לבטל קופונים שהושגו בדרכים לא תקינות{'\n'}
            {'\u2022'} המימוש מתבצע בחנות על ידי צוות העובדים בלבד
          </Text>

          <Text style={styles.sectionTitle}>הזמנות ותשלומים</Text>
          <Text style={styles.body}>
            {'\u2022'} מחירים המוצגים באפליקציה כוללים מע"מ{'\n'}
            {'\u2022'} הפסקת קפה רשאית לעדכן מחירים ללא הודעה מוקדמת{'\n'}
            {'\u2022'} תשלום בכרטיס אשראי מעובד על ידי PayMe (ישראכרט){'\n'}
            {'\u2022'} הזמנות ניתנות לביטול לפני תחילת ההכנה
          </Text>

          <Text style={styles.sectionTitle}>מוצרים פיזיים</Text>
          <Text style={styles.body}>
            כל המוצרים המוזמנים דרך האפליקציה הם מוצרים פיזיים (קפה, מאפים, ארוחות) הנאספים בחנות. האפליקציה אינה מוכרת מוצרים דיגיטליים.
          </Text>

          <Text style={styles.sectionTitle}>שימוש אסור</Text>
          <Text style={styles.body}>
            {'\u2022'} שימוש בצילומי מסך של קופונים (מנגנון אבטחה מונע זאת){'\n'}
            {'\u2022'} ניסיון לזייף חותמות או קופונים{'\n'}
            {'\u2022'} שיתוף פרטי חשבון עובדים{'\n'}
            {'\u2022'} כל שימוש המפר את תנאי השימוש
          </Text>

          <Text style={styles.sectionTitle}>הגבלת אחריות</Text>
          <Text style={styles.body}>
            האפליקציה מסופקת "כמות שהיא" (AS IS). הפסקת קפה אינה אחראית לנזקים הנובעים משימוש באפליקציה, לרבות הפסד נתונים או חוסר זמינות זמני.
          </Text>

          <Text style={styles.sectionTitle}>יצירת קשר</Text>
          <Text style={styles.body}>
            הפסקת קפה{'\n'}
            טיילת הצפונית, אשקלון, ישראל{'\n'}
            info@coffeebreak.app
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
  body: { fontSize: 14, lineHeight: 22, color: colors.textSecondary, textAlign: 'right' },
});
