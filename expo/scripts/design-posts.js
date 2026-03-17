const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BRANDED_DIR = path.join(__dirname, '..', 'assets', 'social', 'branded');
const PRODUCTS_DIR = path.join(__dirname, '..', 'assets', 'images', 'products');
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'social', 'designed');
const LOGO_PATH = path.join(__dirname, '..', '..', '412370589_1004438273972847_355115865115592453_n.jpg');

const BRAND_COLOR = '#1a8a8a'; // teal from logo
const BRAND_LIGHT = '#e8f5f5';
const BRAND_DARK = '#0d4f4f';

async function getTransparentLogo(size = 120) {
  const raw = await sharp(LOGO_PATH).png().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = Buffer.from(raw.data);
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] > 220 && pixels[i+1] > 220 && pixels[i+2] > 220) pixels[i+3] = 0;
  }
  return sharp(pixels, { raw: { width: raw.info.width, height: raw.info.height, channels: 4 } })
    .resize(size, null, { fit: 'inside' }).png().toBuffer();
}

// ====== DESIGN 1: Minimal Bottom Bar ======
async function designBottomBar(imgPath, text, subtext, outputName) {
  const W = 1080, H = 1080;
  const img = await sharp(imgPath).resize(W, H, { fit: 'cover' }).toBuffer();
  const logo = await getTransparentLogo(80);

  const barH = 140;
  const bar = Buffer.from(`<svg width="${W}" height="${barH}">
    <rect width="${W}" height="${barH}" fill="black" fill-opacity="0.55" rx="0"/>
    <text x="${W/2}" y="55" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle" direction="rtl">${text}</text>
    <text x="${W/2}" y="95" font-family="Arial, sans-serif" font-size="20" fill="#ddd" text-anchor="middle" direction="rtl">${subtext}</text>
  </svg>`);

  await sharp(img)
    .composite([
      { input: bar, top: H - barH, left: 0 },
      { input: logo, top: 20, left: W - 100 }
    ])
    .toFile(path.join(OUTPUT_DIR, `${outputName}.png`));
  console.log(`  ✅ ${outputName}`);
}

// ====== DESIGN 2: Split Layout ======
async function designSplit(imgPath, title, lines, outputName, colorBg = BRAND_COLOR) {
  const W = 1080, H = 1080;
  const halfW = W / 2;

  const img = await sharp(imgPath).resize(halfW, H, { fit: 'cover' }).toBuffer();
  const logo = await getTransparentLogo(100);

  let textSvg = '';
  lines.forEach((line, i) => {
    textSvg += `<text x="${halfW/2}" y="${280 + i * 50}" font-family="Arial, sans-serif" font-size="22" fill="white" text-anchor="middle" direction="rtl">${line}</text>`;
  });

  const rightPanel = Buffer.from(`<svg width="${halfW}" height="${H}">
    <rect width="${halfW}" height="${H}" fill="${colorBg}"/>
    <text x="${halfW/2}" y="200" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="white" text-anchor="middle" direction="rtl">${title}</text>
    <line x1="${halfW/2 - 60}" y1="230" x2="${halfW/2 + 60}" y2="230" stroke="white" stroke-width="2" stroke-opacity="0.6"/>
    ${textSvg}
    <text x="${halfW/2}" y="${H - 80}" font-family="Arial, sans-serif" font-size="18" fill="white" fill-opacity="0.7" text-anchor="middle">@coffeebreak_ashkelon</text>
  </svg>`);

  const base = await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 26, g: 138, b: 138, alpha: 255 } }
  }).png().toBuffer();

  await sharp(base)
    .composite([
      { input: img, left: 0, top: 0 },
      { input: rightPanel, left: halfW, top: 0 },
      { input: logo, left: halfW + (halfW - 100) / 2, top: H - 180 }
    ])
    .toFile(path.join(OUTPUT_DIR, `${outputName}.png`));
  console.log(`  ✅ ${outputName}`);
}

// ====== DESIGN 3: Quote Overlay ======
async function designQuote(imgPath, quote, outputName) {
  const W = 1080, H = 1080;
  const img = await sharp(imgPath).resize(W, H, { fit: 'cover' }).toBuffer();
  const logo = await getTransparentLogo(80);

  const overlay = Buffer.from(`<svg width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="black" fill-opacity="0.45"/>
    <text x="${W/2}" y="${H/2 - 20}" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle" direction="rtl">"${quote}"</text>
    <line x1="${W/2 - 80}" y1="${H/2 + 20}" x2="${W/2 + 80}" y2="${H/2 + 20}" stroke="${BRAND_COLOR}" stroke-width="3"/>
    <text x="${W/2}" y="${H/2 + 65}" font-family="Arial, sans-serif" font-size="24" fill="#ccc" text-anchor="middle" direction="rtl">הפסקת קפה</text>
  </svg>`);

  await sharp(img)
    .composite([
      { input: overlay, top: 0, left: 0 },
      { input: logo, top: H - 100, left: W - 100 }
    ])
    .toFile(path.join(OUTPUT_DIR, `${outputName}.png`));
  console.log(`  ✅ ${outputName}`);
}

// ====== DESIGN 4: New Item Badge ======
async function designNewBadge(imgPath, itemName, outputName) {
  const W = 1080, H = 1080;
  const img = await sharp(imgPath).resize(W, H, { fit: 'cover' }).toBuffer();
  const logo = await getTransparentLogo(80);

  const badge = Buffer.from(`<svg width="200" height="200">
    <circle cx="100" cy="100" r="90" fill="${BRAND_COLOR}" fill-opacity="0.9"/>
    <text x="100" y="90" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle">!</text>
    <text x="100" y="125" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle" direction="rtl">חדש</text>
  </svg>`);

  const nameBar = Buffer.from(`<svg width="${W}" height="70">
    <rect width="${W}" height="70" fill="white" fill-opacity="0.9"/>
    <text x="${W/2}" y="48" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="${BRAND_DARK}" text-anchor="middle" direction="rtl">${itemName}</text>
  </svg>`);

  await sharp(img)
    .composite([
      { input: badge, top: 30, left: 30 },
      { input: nameBar, top: H - 70, left: 0 },
      { input: logo, top: 30, left: W - 100 }
    ])
    .toFile(path.join(OUTPUT_DIR, `${outputName}.png`));
  console.log(`  ✅ ${outputName}`);
}

// ====== DESIGN 5: Promo Banner ======
async function designPromo(imgPath, promoText, subText, outputName) {
  const W = 1080, H = 1080;
  const img = await sharp(imgPath).resize(W, H, { fit: 'cover' }).toBuffer();
  const logo = await getTransparentLogo(80);

  const banner = Buffer.from(`<svg width="${W}" height="180">
    <rect width="${W}" height="180" fill="${BRAND_COLOR}" fill-opacity="0.92"/>
    <text x="${W/2}" y="75" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="white" text-anchor="middle" direction="rtl">${promoText}</text>
    <text x="${W/2}" y="130" font-family="Arial, sans-serif" font-size="26" fill="white" fill-opacity="0.85" text-anchor="middle" direction="rtl">${subText}</text>
  </svg>`);

  await sharp(img)
    .composite([
      { input: banner, top: (H - 180) / 2, left: 0 },
      { input: logo, top: 20, left: W - 100 }
    ])
    .toFile(path.join(OUTPUT_DIR, `${outputName}.png`));
  console.log(`  ✅ ${outputName}`);
}

// ====== DESIGN 6: Menu Card ======
async function designMenuCard(imgPath, title, items, outputName) {
  const W = 1080, H = 1080;
  const imgH = 540;

  const img = await sharp(imgPath).resize(W, imgH, { fit: 'cover' }).toBuffer();
  const logo = await getTransparentLogo(70);

  let itemsSvg = '';
  items.forEach((item, i) => {
    const y = 40 + i * 55;
    itemsSvg += `
      <text x="60" y="${y}" font-family="Arial, sans-serif" font-size="22" fill="${BRAND_DARK}" direction="rtl" text-anchor="start">${item.name}</text>
      <text x="${W - 60}" y="${y}" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="${BRAND_COLOR}" text-anchor="end">${item.price}</text>
      <line x1="60" y1="${y + 12}" x2="${W - 60}" y2="${y + 12}" stroke="#eee" stroke-width="1"/>
    `;
  });

  const menuPanel = Buffer.from(`<svg width="${W}" height="${H - imgH}">
    <rect width="${W}" height="${H - imgH}" fill="white"/>
    <text x="${W/2}" y="-20" font-family="Arial, sans-serif" font-size="0" fill="white" text-anchor="middle">.</text>
    ${itemsSvg}
  </svg>`);

  const titleOverlay = Buffer.from(`<svg width="${W}" height="60">
    <rect width="${W}" height="60" fill="${BRAND_COLOR}"/>
    <text x="${W/2}" y="42" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle" direction="rtl">${title}</text>
  </svg>`);

  const base = await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 255 } }
  }).png().toBuffer();

  await sharp(base)
    .composite([
      { input: img, top: 0, left: 0 },
      { input: titleOverlay, top: imgH - 60, left: 0 },
      { input: menuPanel, top: imgH, left: 0 },
      { input: logo, top: H - 80, left: W / 2 - 35 }
    ])
    .toFile(path.join(OUTPUT_DIR, `${outputName}.png`));
  console.log(`  ✅ ${outputName}`);
}

// ====== DESIGN 7: Story with Gradient ======
async function designStory(imgPath, title, subtitle, outputName) {
  const W = 1080, H = 1920;
  const img = await sharp(imgPath).resize(W, H, { fit: 'cover' }).toBuffer();
  const logo = await getTransparentLogo(120);

  const gradient = Buffer.from(`<svg width="${W}" height="${H}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="black" stop-opacity="0.6"/>
        <stop offset="0.3" stop-color="black" stop-opacity="0"/>
        <stop offset="0.7" stop-color="black" stop-opacity="0"/>
        <stop offset="1" stop-color="black" stop-opacity="0.7"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <text x="${W/2}" y="160" font-family="Arial, sans-serif" font-size="52" font-weight="bold" fill="white" text-anchor="middle" direction="rtl">${title}</text>
    <text x="${W/2}" y="${H - 180}" font-family="Arial, sans-serif" font-size="30" fill="white" fill-opacity="0.85" text-anchor="middle" direction="rtl">${subtitle}</text>
    <text x="${W/2}" y="${H - 120}" font-family="Arial, sans-serif" font-size="20" fill="white" fill-opacity="0.6" text-anchor="middle">@coffeebreak_ashkelon</text>
  </svg>`);

  await sharp(img)
    .composite([
      { input: gradient, top: 0, left: 0 },
      { input: logo, top: H - 280, left: (W - 120) / 2 }
    ])
    .toFile(path.join(OUTPUT_DIR, `${outputName}.png`));
  console.log(`  ✅ ${outputName}`);
}

// ====== DESIGN 8: Circular Product Spotlight ======
async function designCircleSpotlight(productImgPath, title, subtitle, outputName, bgColor = BRAND_LIGHT) {
  const W = 1080, H = 1080;
  const circleR = 320;
  const logo = await getTransparentLogo(80);

  const productImg = await sharp(productImgPath)
    .resize(circleR * 2, circleR * 2, { fit: 'cover' })
    .toBuffer();

  const circleMask = Buffer.from(`<svg width="${circleR*2}" height="${circleR*2}">
    <circle cx="${circleR}" cy="${circleR}" r="${circleR}" fill="white"/>
  </svg>`);

  const circleImg = await sharp(productImg)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png().toBuffer();

  const bgSvg = Buffer.from(`<svg width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${bgColor}"/>
    <circle cx="${W/2}" cy="${H/2 - 60}" r="${circleR + 8}" fill="none" stroke="${BRAND_COLOR}" stroke-width="4" stroke-opacity="0.3"/>
    <text x="${W/2}" y="${H/2 + circleR + 40}" font-family="Arial, sans-serif" font-size="38" font-weight="bold" fill="${BRAND_DARK}" text-anchor="middle" direction="rtl">${title}</text>
    <text x="${W/2}" y="${H/2 + circleR + 85}" font-family="Arial, sans-serif" font-size="22" fill="#666" text-anchor="middle" direction="rtl">${subtitle}</text>
  </svg>`);

  await sharp(bgSvg)
    .composite([
      { input: circleImg, left: (W - circleR * 2) / 2, top: H / 2 - 60 - circleR },
      { input: logo, top: 30, left: W / 2 - 40 }
    ])
    .toFile(path.join(OUTPUT_DIR, `${outputName}.png`));
  console.log(`  ✅ ${outputName}`);
}

// ====== MAIN ======
async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const B = (name) => path.join(BRANDED_DIR, name);
  const P = (name) => path.join(PRODUCTS_DIR, name);

  console.log('\n🎨 Creating designed Instagram posts...\n');

  // --- Bottom Bar designs ---
  console.log('📌 Bottom Bar style:');
  await designBottomBar(B('promo-signature-pastries.png'), 'המאפים שלנו', 'אפייה טרייה כל בוקר | אשקלון', 'design-signature-bar');
  await designBottomBar(B('promo-dessert-party.png'), 'קינוחים', 'הזמנות לאירועים ומסיבות', 'design-desserts-bar');
  await designBottomBar(B('promo-breakfast-table.png'), 'ארוחת בוקר', 'שקשוקה, פוקצ\'ה, אסאי וקפה', 'design-breakfast-bar');

  // --- Split Layout ---
  console.log('\n📌 Split Layout style:');
  await designSplit(B('promo-croissant-collection.png'), 'קרואסונים', ['חמאה', 'שקדים', 'פטל', 'מוקה', 'שוקולד', 'סלמון'], 'design-croissants-split');
  await designSplit(B('promo-drinks-lineup.png'), 'משקאות', ['אספרסו', 'הפוך', 'אמריקנו', 'שוקו', 'מאצ\'ה', 'חם / קר'], 'design-drinks-split');
  await designSplit(B('promo-sandwich-lunch.png'), 'כריכים', ['סלמון', 'אבוקדו', 'ביצה', 'טונה', 'אומלט'], 'design-sandwich-split', '#2d5a3d');

  // --- Quote Overlay ---
  console.log('\n📌 Quote style:');
  await designQuote(B('promo-coffee-and-3.png'), 'הבוקר מתחיל כאן', 'design-quote-morning');
  await designQuote(B('promo-couple-sharing.png'), 'הפסקה קטנה, הנאה גדולה', 'design-quote-break');
  await designQuote(B('promo-green-garden.png'), 'טרי. טבעי. שלנו.', 'design-quote-fresh');

  // --- New Item Badge ---
  console.log('\n📌 New Item Badge:');
  await designNewBadge(B('promo-new-items.png'), 'פריטים חדשים בתפריט', 'design-new-items');
  await designNewBadge(B('promo-chocolate-lovers.png'), 'קולקציית שוקולד', 'design-new-chocolate');

  // --- Promo Banner ---
  console.log('\n📌 Promo Banner:');
  await designPromo(B('promo-best-sellers.png'), 'קפה + מאפה = 20 ש"ח', 'כל יום, כל הבוקר', 'design-promo-combo');
  await designPromo(B('promo-coffee-and-3.png'), 'הקפה החמישי עלינו', 'כרטיסיית נאמנות', 'design-promo-loyalty');
  await designPromo(B('promo-acai-healthy.png'), 'בריאות בכל ביס', 'אסאי, מאצ\'ה, מיצים טריים', 'design-promo-healthy');

  // --- Menu Card ---
  console.log('\n📌 Menu Card:');
  await designMenuCard(B('promo-croissant-collection.png'), 'תפריט קרואסונים', [
    { name: 'קרואסון חמאה', price: '14 ש"ח' },
    { name: 'קרואסון שקדים', price: '18 ש"ח' },
    { name: 'קרואסון פטל', price: '18 ש"ח' },
    { name: 'קרואסון מוקה', price: '18 ש"ח' },
    { name: 'פאן שוקולד', price: '16 ש"ח' },
    { name: 'פאן סוויס', price: '16 ש"ח' },
    { name: 'סינבון קלאסי', price: '18 ש"ח' },
    { name: 'מאפה ברולה תות', price: '22 ש"ח' },
  ], 'design-menu-pastries');

  await designMenuCard(B('promo-drinks-lineup.png'), 'תפריט משקאות', [
    { name: 'אספרסו', price: '10 ש"ח' },
    { name: 'הפוך קטן', price: '12 ש"ח' },
    { name: 'הפוך גדול', price: '14 ש"ח' },
    { name: 'אמריקנו', price: '12-14 ש"ח' },
    { name: 'קפה קר', price: '15 ש"ח' },
    { name: 'מאצ\'ה חם', price: '22 ש"ח' },
    { name: 'מאצ\'ה קר', price: '25 ש"ח' },
    { name: 'שוקו חם / קר', price: '12-15 ש"ח' },
  ], 'design-menu-drinks');

  // --- Story Gradient ---
  console.log('\n📌 Story designs:');
  await designStory(B('story-full-table.png'), 'בוקר טוב', 'מאפים טריים וקפה חם מחכים לכם', 'design-story-morning');
  await designStory(B('story-dessert-heaven.png'), 'קינוחים', 'עוגות ומאפים מתוקים כל יום', 'design-story-desserts');
  await designStory(B('story-breakfast-spread.png'), 'ארוחת בוקר', 'שקשוקה, פוקצ\'ה, אסאי, כריך וקפה', 'design-story-breakfast');
  await designStory(B('story-healthy-morning.png'), 'בריאות', 'אסאי, מאצ\'ה, סלט ומיצים טריים', 'design-story-healthy');

  // --- Circle Spotlight ---
  console.log('\n📌 Circle Spotlight:');
  await designCircleSpotlight(P('croissant-butter.png'), 'קרואסון חמאה', 'מאפה שמרים עשיר ונימוח | 14 ש"ח', 'design-circle-croissant');
  await designCircleSpotlight(P('brulee-strawberry-pastry.png'), 'מאפה ברולה תות', 'קרם פטיסייר, תותים וסוכר מקורמל', 'design-circle-brulee');
  await designCircleSpotlight(P('toffifee-cube.png'), 'קוביית טופיפי', 'בצק קרואסון במילוי טופיפי', 'design-circle-toffifee');

  const count = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png')).length;
  console.log(`\n========================================`);
  console.log(`Done! ${count} designed posts created`);
  console.log(`========================================\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
