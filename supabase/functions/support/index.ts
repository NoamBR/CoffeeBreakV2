import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>תמיכה — הפסקת קפה</title>
<style>
  body { font-family: -apple-system, Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 24px; background: #F8FAFC; color: #0F172A; direction: rtl; line-height: 1.7; }
  h1 { font-size: 24px; margin-bottom: 8px; }
  h2 { font-size: 18px; margin-top: 28px; color: #1E3A8A; }
  p, li { font-size: 15px; color: #334155; }
  a { color: #2563EB; }
  .card { background: #fff; border-radius: 12px; padding: 20px; margin-top: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
  .card h3 { font-size: 16px; margin: 0 0 8px; }
</style>
</head>
<body>
<h1>תמיכה — הפסקת קפה</h1>
<p>יש לכם שאלה, בעיה או הצעה? אנחנו כאן בשבילכם!</p>

<div class="card">
<h3>אימייל</h3>
<p><a href="mailto:info@coffeebreak.app">info@coffeebreak.app</a></p>
</div>

<div class="card">
<h3>WhatsApp</h3>
<p><a href="https://wa.me/972555170316">שלחו לנו הודעה בוואטסאפ</a></p>
</div>

<div class="card">
<h3>טלפון</h3>
<p><a href="tel:081234567">08-1234567</a></p>
</div>

<div class="card">
<h3>כתובת</h3>
<p>הפסקת קפה<br>טיילת הצפונית, אשקלון</p>
</div>

<h2>שאלות נפוצות</h2>

<h3>איך מצטרפים למועדון?</h3>
<p>הורידו את האפליקציה, אמתו את מספר הטלפון שלכם דרך WhatsApp, ואתם בפנים!</p>

<h3>איך מממשים קופון?</h3>
<p>הציגו את הקופון מהאפליקציה לצוות בית הקפה בעת ההזמנה.</p>

<h3>איך מוחקים את החשבון?</h3>
<p>בפרופיל האפליקציה, לחצו על "התנתק ומחק נתונים". כל המידע יימחק לצמיתות.</p>

<h3>איך יוצרים קשר בנושא פרטיות?</h3>
<p>שלחו אימייל ל-<a href="mailto:privacy@coffeebreak.app">privacy@coffeebreak.app</a></p>
</body>
</html>`;

serve(() => new Response(html, {
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
}));
