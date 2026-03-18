const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PRODUCTS_DIR = path.join(__dirname, '..', 'assets', 'images', 'products');
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'social', 'designed');
const LOGO_PATH = path.join(__dirname, '..', '..', '412370589_1004438273972847_355115865115592453_n.jpg');

const BRAND_COLOR = '#1a8a8a';
const BRAND_DARK = '#0d4f4f';
const BRAND_LIGHT = '#e8f5f5';

// Warm potato/food colors
const POTATO_GOLD = '#c8952e';
const POTATO_CREAM = '#f5e6c8';
const POTATO_BROWN = '#8b6914';

async function getTransparentLogo(size = 120) {
  const raw = await sharp(LOGO_PATH).png().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = Buffer.from(raw.data);
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] > 220 && pixels[i+1] > 220 && pixels[i+2] > 220) pixels[i+3] = 0;
  }
  return sharp(pixels, { raw: { width: raw.info.width, height: raw.info.height, channels: 4 } })
    .resize(size, null, { fit: 'inside' }).png().toBuffer();
}

// ====== Generate product-style baked potato on grey concrete background ======
async function generatePotatoProductImage(toppingName, toppingSvg, outputName) {
  const W = 1080, H = 1080;

  // Create the grey concrete-style background matching croissant images
  const bg = Buffer.from(`<svg width="${W}" height="${H}">
    <defs>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <linearGradient id="concrete" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#e8e6e3"/>
        <stop offset="0.3" stop-color="#e2e0dc"/>
        <stop offset="0.7" stop-color="#dddbd7"/>
        <stop offset="1" stop-color="#e5e3df"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#concrete)"/>
  </svg>`);

  // Create the baked potato illustration
  const potatoW = 580, potatoH = 380;
  const potatoSvg = Buffer.from(`<svg width="${potatoW}" height="${potatoH}" xmlns="http://www.w3.org/2000/svg">
    <!-- Potato shadow -->
    <ellipse cx="${potatoW/2}" cy="${potatoH - 30}" rx="250" ry="25" fill="black" fill-opacity="0.08"/>

    <!-- Potato skin - outer -->
    <ellipse cx="${potatoW/2}" cy="${potatoH/2}" rx="260" ry="140" fill="#a0723c" stroke="#8b6914" stroke-width="2"/>

    <!-- Potato skin texture -->
    <ellipse cx="${potatoW/2}" cy="${potatoH/2}" rx="255" ry="136" fill="#b8863e"/>
    <ellipse cx="${potatoW/2 - 30}" cy="${potatoH/2 - 10}" rx="240" ry="125" fill="#c49545"/>

    <!-- Split opening -->
    <ellipse cx="${potatoW/2}" cy="${potatoH/2 - 20}" rx="200" ry="90" fill="#f5e6c8"/>
    <ellipse cx="${potatoW/2}" cy="${potatoH/2 - 25}" rx="185" ry="80" fill="#faf0dc"/>

    <!-- Fluffy potato interior texture -->
    <ellipse cx="${potatoW/2 - 40}" cy="${potatoH/2 - 30}" rx="60" ry="40" fill="#fff5e6" fill-opacity="0.7"/>
    <ellipse cx="${potatoW/2 + 50}" cy="${potatoH/2 - 35}" rx="50" ry="35" fill="#fff5e6" fill-opacity="0.5"/>

    <!-- Cream/tahini sauce base -->
    <ellipse cx="${potatoW/2}" cy="${potatoH/2 - 20}" rx="170" ry="65" fill="#e8d5b0" fill-opacity="0.8"/>
    <ellipse cx="${potatoW/2 + 20}" cy="${potatoH/2 - 25}" rx="140" ry="50" fill="#f0dfc0" fill-opacity="0.6"/>

    <!-- Toppings -->
    ${toppingSvg}

    <!-- Fork -->
    <line x1="${potatoW/2 + 10}" y1="${potatoH/2 - 100}" x2="${potatoW/2 + 15}" y2="20" stroke="#333" stroke-width="4" stroke-linecap="round"/>
    <line x1="${potatoW/2 + 3}" y1="${potatoH/2 - 100}" x2="${potatoW/2 + 6}" y2="${potatoH/2 - 70}" stroke="#333" stroke-width="2.5"/>
    <line x1="${potatoW/2 + 17}" y1="${potatoH/2 - 100}" x2="${potatoW/2 + 24}" y2="${potatoH/2 - 70}" stroke="#333" stroke-width="2.5"/>
  </svg>`);

  // Scattered crumbs (matching croissant style)
  const crumbs = Buffer.from(`<svg width="${W}" height="${H}">
    <circle cx="180" cy="200" r="4" fill="#c49545" fill-opacity="0.6"/>
    <circle cx="820" cy="350" r="3" fill="#c49545" fill-opacity="0.5"/>
    <circle cx="750" cy="780" r="5" fill="#c49545" fill-opacity="0.4"/>
    <circle cx="200" cy="750" r="3" fill="#c49545" fill-opacity="0.5"/>
    <circle cx="350" cy="850" r="2.5" fill="#c49545" fill-opacity="0.4"/>
    <circle cx="880" cy="220" r="3.5" fill="#c49545" fill-opacity="0.3"/>
    <circle cx="650" cy="180" r="2" fill="#c49545" fill-opacity="0.5"/>
    <circle cx="150" cy="500" r="3" fill="#c49545" fill-opacity="0.3"/>

    <!-- Flour dust spots -->
    <circle cx="800" cy="600" r="30" fill="white" fill-opacity="0.06"/>
    <circle cx="250" cy="300" r="25" fill="white" fill-opacity="0.05"/>
    <circle cx="700" cy="250" r="20" fill="white" fill-opacity="0.04"/>
    <circle cx="350" cy="700" r="35" fill="white" fill-opacity="0.05"/>

    <!-- Herb sprig (rosemary style) -->
    <g transform="translate(720, 700) rotate(-30)">
      <line x1="0" y1="0" x2="120" y2="-20" stroke="#5a7a3a" stroke-width="2"/>
      <ellipse cx="20" cy="-8" rx="8" ry="3" fill="#6b8e3a" transform="rotate(-20, 20, -8)"/>
      <ellipse cx="35" cy="-12" rx="8" ry="3" fill="#6b8e3a" transform="rotate(-15, 35, -12)"/>
      <ellipse cx="50" cy="-14" rx="7" ry="3" fill="#6b8e3a" transform="rotate(-10, 50, -14)"/>
      <ellipse cx="65" cy="-16" rx="7" ry="2.5" fill="#6b8e3a" transform="rotate(-8, 65, -16)"/>
      <ellipse cx="80" cy="-18" rx="6" ry="2.5" fill="#6b8e3a" transform="rotate(-5, 80, -18)"/>
      <ellipse cx="95" cy="-19" rx="5" ry="2" fill="#6b8e3a" transform="rotate(-3, 95, -19)"/>
      <ellipse cx="25" cy="-2" rx="8" ry="3" fill="#5a7a3a" transform="rotate(15, 25, -2)"/>
      <ellipse cx="40" cy="-5" rx="7" ry="3" fill="#5a7a3a" transform="rotate(12, 40, -5)"/>
      <ellipse cx="55" cy="-8" rx="7" ry="2.5" fill="#5a7a3a" transform="rotate(8, 55, -8)"/>
      <ellipse cx="70" cy="-10" rx="6" ry="2.5" fill="#5a7a3a" transform="rotate(5, 70, -10)"/>
      <ellipse cx="85" cy="-12" rx="5" ry="2" fill="#5a7a3a" transform="rotate(3, 85, -12)"/>
    </g>

    <!-- Small salt/spice dots -->
    <circle cx="420" cy="180" r="1.5" fill="white" fill-opacity="0.4"/>
    <circle cx="430" cy="185" r="1" fill="white" fill-opacity="0.3"/>
    <circle cx="680" cy="850" r="1.5" fill="white" fill-opacity="0.4"/>
    <circle cx="320" cy="280" r="1" fill="white" fill-opacity="0.35"/>
  </svg>`);

  await sharp(bg)
    .composite([
      { input: potatoSvg, left: (W - potatoW) / 2, top: (H - potatoH) / 2 - 20 },
      { input: crumbs, left: 0, top: 0 }
    ])
    .png()
    .toFile(path.join(PRODUCTS_DIR, `${outputName}.png`));

  console.log(`  ✅ Product image: ${outputName}`);
  return path.join(PRODUCTS_DIR, `${outputName}.png`);
}

// ====== DESIGN: Bottom Bar for potato ======
async function designPotatoBar(imgPath, text, subtext, outputName) {
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

// ====== DESIGN: Circle Spotlight for potato ======
async function designPotatoCircle(imgPath, title, subtitle, outputName, bgColor = BRAND_LIGHT) {
  const W = 1080, H = 1080;
  const circleR = 320;
  const logo = await getTransparentLogo(80);

  const productImg = await sharp(imgPath)
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

// ====== DESIGN: New Item Badge for potato ======
async function designPotatoNewBadge(imgPath, itemName, outputName) {
  const W = 1080, H = 1080;
  const img = await sharp(imgPath).resize(W, H, { fit: 'cover' }).toBuffer();
  const logo = await getTransparentLogo(80);

  const badge = Buffer.from(`<svg width="200" height="200">
    <circle cx="100" cy="100" r="90" fill="${POTATO_GOLD}" fill-opacity="0.92"/>
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

// ====== DESIGN: Menu Card for potato toppings ======
async function designPotatoMenu(imgPath, title, items, outputName) {
  const W = 1080, H = 1080;
  const imgH = 540;

  const img = await sharp(imgPath).resize(W, imgH, { fit: 'cover' }).toBuffer();
  const logo = await getTransparentLogo(70);

  let itemsSvg = '';
  items.forEach((item, i) => {
    const y = 40 + i * 55;
    itemsSvg += `
      <text x="${W - 60}" y="${y}" font-family="Arial, sans-serif" font-size="22" fill="${BRAND_DARK}" direction="rtl" text-anchor="end">${item.name}</text>
      <text x="60" y="${y}" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="${POTATO_GOLD}" text-anchor="start">${item.price}</text>
      <line x1="60" y1="${y + 12}" x2="${W - 60}" y2="${y + 12}" stroke="#eee" stroke-width="1"/>
    `;
  });

  const menuPanel = Buffer.from(`<svg width="${W}" height="${H - imgH}">
    <rect width="${W}" height="${H - imgH}" fill="white"/>
    ${itemsSvg}
  </svg>`);

  const titleOverlay = Buffer.from(`<svg width="${W}" height="60">
    <rect width="${W}" height="60" fill="${POTATO_GOLD}"/>
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

// ====== TOPPING DEFINITIONS ======
const TOPPINGS = {
  classic: `
    <!-- Black olives -->
    <circle cx="220" cy="170" r="12" fill="#2a2a2a"/><circle cx="220" cy="170" r="5" fill="#1a1a1a"/>
    <circle cx="310" cy="155" r="11" fill="#2a2a2a"/><circle cx="310" cy="155" r="4.5" fill="#1a1a1a"/>
    <circle cx="370" cy="175" r="10" fill="#333"/><circle cx="370" cy="175" r="4" fill="#1a1a1a"/>
    <circle cx="260" cy="190" r="9" fill="#2a2a2a"/><circle cx="260" cy="190" r="3.5" fill="#1a1a1a"/>
    <!-- Green onions -->
    <rect x="200" y="160" width="25" height="5" rx="2" fill="#4a8c3f" transform="rotate(-15, 200, 160)"/>
    <rect x="280" y="145" width="20" height="5" rx="2" fill="#5a9c4f" transform="rotate(10, 280, 145)"/>
    <rect x="340" y="168" width="22" height="5" rx="2" fill="#4a8c3f" transform="rotate(-5, 340, 168)"/>
    <rect x="250" y="180" width="18" height="4" rx="2" fill="#5a9c4f" transform="rotate(20, 250, 180)"/>
    <!-- Crumbled feta -->
    <rect x="230" y="150" width="8" height="6" rx="1" fill="white" fill-opacity="0.9" transform="rotate(15, 230, 150)"/>
    <rect x="290" y="170" width="7" height="5" rx="1" fill="white" fill-opacity="0.85" transform="rotate(-10, 290, 170)"/>
    <rect x="350" y="155" width="6" height="7" rx="1" fill="white" fill-opacity="0.9" transform="rotate(25, 350, 155)"/>
    <rect x="270" y="165" width="5" height="6" rx="1" fill="#f5f5f0" fill-opacity="0.9"/>
    <rect x="320" y="180" width="7" height="5" rx="1" fill="white" fill-opacity="0.85" transform="rotate(-15, 320, 180)"/>
  `,
  mushroom: `
    <!-- Mushroom slices -->
    <path d="M210 165 Q220 145 230 165 L225 175 L215 175 Z" fill="#c4a882" stroke="#a08860" stroke-width="0.5"/>
    <path d="M280 155 Q293 135 306 155 L300 167 L286 167 Z" fill="#c4a882" stroke="#a08860" stroke-width="0.5"/>
    <path d="M345 170 Q355 152 365 170 L361 180 L349 180 Z" fill="#c4a882" stroke="#a08860" stroke-width="0.5"/>
    <path d="M250 178 Q260 162 270 178 L266 186 L254 186 Z" fill="#b89870" stroke="#a08860" stroke-width="0.5"/>
    <!-- Melted cheese -->
    <ellipse cx="290" cy="165" rx="120" ry="45" fill="#f5d060" fill-opacity="0.4"/>
    <ellipse cx="270" cy="160" rx="80" ry="30" fill="#f0c840" fill-opacity="0.3"/>
  `,
  corn: `
    <!-- Sweet corn kernels -->
    <circle cx="220" cy="165" r="5" fill="#f5d040"/><circle cx="232" cy="160" r="5" fill="#f0c830"/>
    <circle cx="244" cy="168" r="4.5" fill="#f5d040"/><circle cx="255" cy="155" r="5" fill="#ebc530"/>
    <circle cx="267" cy="163" r="4.5" fill="#f5d040"/><circle cx="278" cy="158" r="5" fill="#f0c830"/>
    <circle cx="290" cy="166" r="4.5" fill="#f5d040"/><circle cx="302" cy="160" r="5" fill="#ebc530"/>
    <circle cx="314" cy="168" r="4.5" fill="#f5d040"/><circle cx="326" cy="155" r="5" fill="#f0c830"/>
    <circle cx="338" cy="163" r="4.5" fill="#f5d040"/><circle cx="350" cy="170" r="5" fill="#ebc530"/>
    <circle cx="240" cy="178" r="4" fill="#f5d040"/><circle cx="260" cy="175" r="4.5" fill="#f0c830"/>
    <circle cx="300" cy="178" r="4" fill="#f5d040"/><circle cx="320" cy="176" r="4.5" fill="#ebc530"/>
    <!-- Red pepper diced -->
    <rect x="225" y="150" width="8" height="6" rx="1" fill="#d43030" transform="rotate(10, 225, 150)"/>
    <rect x="295" y="148" width="7" height="5" rx="1" fill="#c82828" transform="rotate(-15, 295, 148)"/>
    <rect x="345" y="158" width="6" height="7" rx="1" fill="#d43030" transform="rotate(5, 345, 158)"/>
    <!-- Parsley -->
    <ellipse cx="270" cy="145" rx="6" ry="3" fill="#3a7a2a" transform="rotate(-20, 270, 145)"/>
    <ellipse cx="310" cy="150" rx="5" ry="3" fill="#3a7a2a" transform="rotate(15, 310, 150)"/>
  `,
  broccoli: `
    <!-- Broccoli florets -->
    <g transform="translate(215, 155)">
      <circle cx="0" cy="0" r="10" fill="#3a7a2a"/><circle cx="8" cy="-5" r="8" fill="#4a8c3f"/>
      <circle cx="-6" cy="-5" r="7" fill="#3a7a2a"/><circle cx="2" cy="-10" r="6" fill="#5a9c4f"/>
      <rect x="-2" y="5" width="4" height="10" rx="1" fill="#5a7a3a"/>
    </g>
    <g transform="translate(290, 150)">
      <circle cx="0" cy="0" r="9" fill="#4a8c3f"/><circle cx="7" cy="-4" r="7" fill="#3a7a2a"/>
      <circle cx="-5" cy="-4" r="6" fill="#4a8c3f"/><circle cx="2" cy="-8" r="5" fill="#5a9c4f"/>
      <rect x="-2" y="4" width="4" height="8" rx="1" fill="#5a7a3a"/>
    </g>
    <g transform="translate(355, 165)">
      <circle cx="0" cy="0" r="8" fill="#3a7a2a"/><circle cx="6" cy="-4" r="6" fill="#4a8c3f"/>
      <circle cx="-4" cy="-3" r="5" fill="#3a7a2a"/>
      <rect x="-1.5" y="3" width="3" height="7" rx="1" fill="#5a7a3a"/>
    </g>
    <!-- Tahini drizzle -->
    <path d="M200 170 Q250 160 300 172 Q350 164 380 175" fill="none" stroke="#e8d5a0" stroke-width="4" stroke-opacity="0.7" stroke-linecap="round"/>
    <!-- Sesame seeds -->
    <ellipse cx="245" cy="168" rx="3" ry="1.5" fill="#d4c090" transform="rotate(30, 245, 168)"/>
    <ellipse cx="310" cy="162" rx="3" ry="1.5" fill="#d4c090" transform="rotate(-20, 310, 162)"/>
    <ellipse cx="340" cy="172" rx="2.5" ry="1.5" fill="#d4c090" transform="rotate(45, 340, 172)"/>
  `,
  supreme: `
    <!-- Mushroom slices -->
    <path d="M210 168 Q218 155 226 168 L223 175 L213 175 Z" fill="#c4a882"/>
    <path d="M330 162 Q338 150 346 162 L343 169 L333 169 Z" fill="#c4a882"/>
    <!-- Black olives -->
    <circle cx="250" cy="160" r="10" fill="#2a2a2a"/><circle cx="250" cy="160" r="4" fill="#1a1a1a"/>
    <circle cx="360" cy="172" r="9" fill="#2a2a2a"/><circle cx="360" cy="172" r="3.5" fill="#1a1a1a"/>
    <!-- Corn -->
    <circle cx="275" cy="168" r="4" fill="#f5d040"/><circle cx="285" cy="163" r="4" fill="#f0c830"/>
    <circle cx="295" cy="170" r="3.5" fill="#f5d040"/>
    <!-- Green onions -->
    <rect x="230" y="152" width="18" height="4" rx="2" fill="#4a8c3f" transform="rotate(-10, 230, 152)"/>
    <rect x="310" y="158" width="15" height="4" rx="2" fill="#5a9c4f" transform="rotate(15, 310, 158)"/>
    <!-- Feta -->
    <rect x="265" y="150" width="7" height="5" rx="1" fill="white" fill-opacity="0.9" transform="rotate(20, 265, 150)"/>
    <rect x="340" y="155" width="6" height="6" rx="1" fill="white" fill-opacity="0.85"/>
    <!-- Beet sauce drizzle -->
    <path d="M220 175 Q270 165 320 178 Q350 170 380 180" fill="none" stroke="#a01040" stroke-width="3" stroke-opacity="0.6" stroke-linecap="round"/>
  `
};

// ====== MAIN ======
async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('\n🥔 Creating baked potato product images & designed posts...\n');

  // Step 1: Generate product images for each topping variant
  console.log('📌 Product images (croissant-style background):');
  const classicPath = await generatePotatoProductImage('Classic', TOPPINGS.classic, 'potato-classic-cream-olives');
  const mushroomPath = await generatePotatoProductImage('Mushroom', TOPPINGS.mushroom, 'potato-mushroom-cheese');
  const cornPath = await generatePotatoProductImage('Corn', TOPPINGS.corn, 'potato-corn-pepper');
  const broccoliPath = await generatePotatoProductImage('Broccoli', TOPPINGS.broccoli, 'potato-broccoli-tahini');
  const supremePath = await generatePotatoProductImage('Supreme', TOPPINGS.supreme, 'potato-supreme-loaded');

  // Step 2: Apply design treatments
  console.log('\n📌 Bottom Bar designs:');
  await designPotatoBar(classicPath, 'תפוח אדמה מוקרם', 'שמנת, זיתים שחורים, בצל ירוק ופטה', 'design-potato-classic-bar');
  await designPotatoBar(supremePath, 'הפולי לואדד', 'כל התוספות | הכי עמוס שיש', 'design-potato-supreme-bar');

  console.log('\n📌 Circle Spotlight:');
  await designPotatoCircle(classicPath, 'תפוח אדמה קלאסי', 'שמנת חמוצה, זיתים, בצל ירוק ופטה מפוררת', 'design-circle-potato-classic');
  await designPotatoCircle(mushroomPath, 'תפוח אדמה פטריות', 'פטריות מוקפצות וגבינה מותכת', 'design-circle-potato-mushroom', '#f5f0e0');
  await designPotatoCircle(broccoliPath, 'תפוח אדמה ברוקולי', 'ברוקולי, טחינה ושומשום', 'design-circle-potato-broccoli', '#e8f0e0');

  console.log('\n📌 New Item Badge:');
  await designPotatoNewBadge(cornPath, 'תפוח אדמה תירס ופלפל', 'design-potato-new-corn');
  await designPotatoNewBadge(supremePath, 'הפולי לואדד - חדש!', 'design-potato-new-supreme');

  console.log('\n📌 Potato Toppings Menu:');
  await designPotatoMenu(classicPath, 'תפריט תפוח אדמה מוקרם', [
    { name: 'קלאסי - שמנת, זיתים, בצל ירוק, פטה', price: '35 ש"ח' },
    { name: 'פטריות וגבינה מותכת', price: '38 ש"ח' },
    { name: 'תירס ופלפל אדום', price: '35 ש"ח' },
    { name: 'ברוקולי וטחינה', price: '35 ש"ח' },
    { name: 'פולי לואדד - הכל', price: '42 ש"ח' },
    { name: 'תוספת גבינה', price: '+5 ש"ח' },
    { name: 'תוספת פטריות', price: '+5 ש"ח' },
    { name: 'תוספת אבוקדו', price: '+8 ש"ח' },
  ], 'design-menu-potato');

  const count = fs.readdirSync(OUTPUT_DIR).filter(f => f.startsWith('design-potato') || f.startsWith('design-circle-potato') || f.startsWith('design-menu-potato')).length;
  console.log(`\n========================================`);
  console.log(`Done! Created 5 product images + ${count} designed posts`);
  console.log(`========================================\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
