import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>מדיניות פרטיות — הפסקת קפה</title>
<style>
  body { font-family: -apple-system, Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 24px; background: #F8FAFC; color: #0F172A; direction: rtl; line-height: 1.7; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  h2 { font-size: 18px; margin-top: 28px; color: #1E3A8A; }
  h3 { font-size: 15px; margin-top: 16px; }
  p, li { font-size: 15px; color: #334155; }
  .updated { font-size: 13px; color: #64748B; margin-bottom: 24px; }
  ul { padding-right: 20px; }
</style>
</head>
<body>
<h1>מדיניות פרטיות — הפסקת קפה</h1>
<p class="updated">עדכון אחרון: 18 במרץ 2026</p>

<h2>מי אנחנו</h2>
<p>"הפסקת קפה" היא בית קפה הממוקם בטיילת הצפונית, אשקלון, ישראל. האפליקציה שלנו מאפשרת ללקוחות לנהל את מועדון הנאמנות, לגלוש בתפריט, לבצע הזמנות ולממש קופונים.</p>

<h2>מידע שאנו אוספים</h2>
<h3>מידע שאתם מספקים</h3>
<ul>
<li>מספר טלפון — לצורך אימות חשבון באמצעות קוד OTP ב-WhatsApp</li>
<li>שם מלא — להתאמה אישית של חוויית השימוש</li>
<li>תאריך לידה (אופציונלי) — לשליחת הטבות יום הולדת</li>
</ul>

<h3>מידע שנאסף אוטומטית</h3>
<ul>
<li>היסטוריית הזמנות — לצורך מעקב נאמנות, חותמות, ו"הרגיל שלך"</li>
<li>נתוני נאמנות — חותמות, דרגת VIP, רצפים, קופונים</li>
<li>מזהה מכשיר — מזהה אנונימי לצורכי אבטחה</li>
</ul>

<h3>מידע שאיננו אוספים</h3>
<ul>
<li>אין מעקב מיקום</li>
<li>אין גישה לאנשי קשר</li>
<li>אין שימוש ב-IDFA או מעקב פרסומי</li>
<li>אין אחסון פרטי כרטיס אשראי באפליקציה</li>
</ul>

<h2>עיבוד תשלומים</h2>
<p>תשלומי כרטיס אשראי מעובדים באמצעות PayMe (ישראכרט) — ספק תשלומים מאושר העומד בתקני PCI DSS. פרטי כרטיס האשראי מוזנים ישירות בעמוד המאובטח של PayMe ואינם עוברים דרך האפליקציה או השרתים שלנו.</p>

<h2>אחסון מידע</h2>
<p>המידע מאוחסן בשרתי Supabase המאובטחים. הגישה למידע מוגבלת בהתאם להרשאות Row Level Security.</p>

<h2>שיתוף מידע עם צדדים שלישיים</h2>
<p>איננו מוכרים או משתפים מידע אישי עם צדדים שלישיים, למעט:</p>
<ul>
<li>PayMe/ישראכרט — לעיבוד תשלומים בלבד</li>
<li>Meta Cloud API — לשליחת קודי OTP ב-WhatsApp בלבד</li>
<li>Supabase — לאחסון מידע מאובטח</li>
</ul>

<h2>זכויותיכם</h2>
<p>בהתאם לחוק הגנת הפרטיות, יש לכם זכות:</p>
<ul>
<li>לגשת למידע האישי שלכם</li>
<li>לתקן מידע שגוי</li>
<li>למחוק את חשבונכם ואת כל המידע הקשור אליו</li>
<li>לבטל הסכמה לקבלת הודעות שיווקיות</li>
</ul>

<h2>יצירת קשר</h2>
<p>לבקשות בנושא פרטיות:<br>
אימייל: privacy@coffeebreak.app<br>
הפסקת קפה, טיילת הצפונית, אשקלון</p>
</body>
</html>`;

serve(() => new Response(html, {
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
}));
