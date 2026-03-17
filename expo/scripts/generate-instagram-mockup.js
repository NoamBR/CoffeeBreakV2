const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BRANDED_DIR = path.join(__dirname, '..', 'assets', 'social', 'branded');
const LOGO_PATH = path.join(__dirname, '..', '..', '412370589_1004438273972847_355115865115592453_n.jpg');
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'social', 'mockups');

async function createMockup(images, mockupName, variant = 0) {
  const PHONE_W = 1080;
  const PHONE_H = 1920;
  const GRID_COLS = 3;
  const GRID_GAP = 3;
  const HEADER_H = 340;
  const TAB_H = 50;
  const STATUS_H = 44;
  const NAV_H = 50;

  const gridW = PHONE_W;
  const cellSize = Math.floor((gridW - (GRID_COLS - 1) * GRID_GAP) / GRID_COLS);
  const rows = Math.ceil(images.length / GRID_COLS);

  const totalH = PHONE_H;

  // Create white background
  const composites = [];

  // Status bar
  composites.push({
    input: Buffer.from(`<svg width="${PHONE_W}" height="${STATUS_H}">
      <rect width="${PHONE_W}" height="${STATUS_H}" fill="white"/>
      <text x="30" y="30" font-family="Arial" font-size="14" font-weight="bold" fill="#333">9:41</text>
      <text x="${PHONE_W - 80}" y="30" font-family="Arial" font-size="13" fill="#333">100%</text>
    </svg>`),
    top: 0, left: 0
  });

  // Profile header background
  composites.push({
    input: Buffer.from(`<svg width="${PHONE_W}" height="${HEADER_H}">
      <rect width="${PHONE_W}" height="${HEADER_H}" fill="white"/>
    </svg>`),
    top: STATUS_H, left: 0
  });

  // Top bar with account name
  composites.push({
    input: Buffer.from(`<svg width="${PHONE_W}" height="44">
      <text x="20" y="30" font-family="Arial" font-size="20" font-weight="bold" fill="#262626" direction="rtl" text-anchor="start">coffeebreak_ashkelon</text>
      <text x="${PHONE_W - 30}" y="30" font-family="Arial" font-size="24" fill="#262626">≡</text>
    </svg>`),
    top: STATUS_H, left: 0
  });

  // Profile picture (logo)
  const logoClean = await sharp(LOGO_PATH)
    .resize(86, 86, { fit: 'cover' })
    .png()
    .toBuffer();

  // Circle mask for profile pic
  const circleMask = Buffer.from(`<svg width="86" height="86"><circle cx="43" cy="43" r="43" fill="white"/></svg>`);
  const profilePic = await sharp(logoClean)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Profile pic border ring
  composites.push({
    input: Buffer.from(`<svg width="96" height="96">
      <circle cx="48" cy="48" r="47" fill="none" stroke="#dbdbdb" stroke-width="2"/>
    </svg>`),
    top: STATUS_H + 54, left: 20
  });

  composites.push({
    input: profilePic,
    top: STATUS_H + 59, left: 25
  });

  // Stats
  const stats = [
    { num: '847', label: 'posts' },
    { num: '12.4K', label: 'followers' },
    { num: '234', label: 'following' }
  ];

  const statsX = 180;
  const statsSpacing = 100;
  for (let i = 0; i < stats.length; i++) {
    composites.push({
      input: Buffer.from(`<svg width="90" height="45">
        <text x="45" y="18" font-family="Arial" font-size="16" font-weight="bold" fill="#262626" text-anchor="middle">${stats[i].num}</text>
        <text x="45" y="36" font-family="Arial" font-size="13" fill="#8e8e8e" text-anchor="middle">${stats[i].label}</text>
      </svg>`),
      top: STATUS_H + 72, left: statsX + i * statsSpacing
    });
  }

  // Bio
  composites.push({
    input: Buffer.from(`<svg width="${PHONE_W}" height="90">
      <text x="20" y="18" font-family="Arial" font-size="14" font-weight="bold" fill="#262626">הפסקת קפה ☕</text>
      <text x="20" y="38" font-family="Arial" font-size="13" fill="#262626">Coffee Shop &amp; Boutique Bakery</text>
      <text x="20" y="56" font-family="Arial" font-size="13" fill="#262626">📍 Ashkelon | 🕐 Sun-Thu 7:00-19:00</text>
      <text x="20" y="74" font-family="Arial" font-size="13" fill="#00376b">coffeebreak-ashkelon.com</text>
    </svg>`),
    top: STATUS_H + 150, left: 0
  });

  // Edit Profile / Share button
  composites.push({
    input: Buffer.from(`<svg width="${PHONE_W - 40}" height="34">
      <rect x="0" y="0" width="${(PHONE_W - 50) / 2}" height="34" rx="8" fill="#efefef"/>
      <text x="${(PHONE_W - 50) / 4}" y="23" font-family="Arial" font-size="13" font-weight="600" fill="#262626" text-anchor="middle">Edit Profile</text>
      <rect x="${(PHONE_W - 50) / 2 + 10}" y="0" width="${(PHONE_W - 50) / 2}" height="34" rx="8" fill="#efefef"/>
      <text x="${(PHONE_W - 50) / 2 + 10 + (PHONE_W - 50) / 4}" y="23" font-family="Arial" font-size="13" font-weight="600" fill="#262626" text-anchor="middle">Share Profile</text>
    </svg>`),
    top: STATUS_H + 250, left: 20
  });

  // Grid / Reels / Tagged tabs
  composites.push({
    input: Buffer.from(`<svg width="${PHONE_W}" height="${TAB_H}">
      <line x1="0" y1="0" x2="${PHONE_W}" y2="0" stroke="#dbdbdb" stroke-width="1"/>
      <rect x="0" y="0" width="${PHONE_W / 3}" height="${TAB_H}" fill="white"/>
      <line x1="0" y1="${TAB_H - 1}" x2="${PHONE_W / 3}" y2="${TAB_H - 1}" stroke="#262626" stroke-width="2"/>
      <text x="${PHONE_W / 6}" y="32" font-family="Arial" font-size="22" fill="#262626" text-anchor="middle">⊞</text>
      <text x="${PHONE_W / 2}" y="32" font-family="Arial" font-size="22" fill="#8e8e8e" text-anchor="middle">▶</text>
      <text x="${PHONE_W * 5 / 6}" y="32" font-family="Arial" font-size="22" fill="#8e8e8e" text-anchor="middle">◻</text>
    </svg>`),
    top: STATUS_H + HEADER_H - 50, left: 0
  });

  // Grid images
  const gridTop = STATUS_H + HEADER_H;
  for (let i = 0; i < images.length && i < 12; i++) {
    const row = Math.floor(i / GRID_COLS);
    const col = i % GRID_COLS;

    const imgBuf = await sharp(images[i])
      .resize(cellSize, cellSize, { fit: 'cover' })
      .png()
      .toBuffer();

    composites.push({
      input: imgBuf,
      top: gridTop + row * (cellSize + GRID_GAP),
      left: col * (cellSize + GRID_GAP)
    });
  }

  // Bottom nav bar
  const navTop = PHONE_H - NAV_H;
  composites.push({
    input: Buffer.from(`<svg width="${PHONE_W}" height="${NAV_H}">
      <rect width="${PHONE_W}" height="${NAV_H}" fill="white"/>
      <line x1="0" y1="0" x2="${PHONE_W}" y2="0" stroke="#dbdbdb" stroke-width="1"/>
      <text x="${PHONE_W * 0.1}" y="32" font-family="Arial" font-size="24" fill="#262626" text-anchor="middle">⌂</text>
      <text x="${PHONE_W * 0.3}" y="32" font-family="Arial" font-size="24" fill="#8e8e8e" text-anchor="middle">🔍</text>
      <text x="${PHONE_W * 0.5}" y="32" font-family="Arial" font-size="24" fill="#8e8e8e" text-anchor="middle">⊕</text>
      <text x="${PHONE_W * 0.7}" y="32" font-family="Arial" font-size="24" fill="#8e8e8e" text-anchor="middle">♡</text>
      <text x="${PHONE_W * 0.9}" y="32" font-family="Arial" font-size="24" fill="#262626" text-anchor="middle">●</text>
    </svg>`),
    top: navTop, left: 0
  });

  // Create final image
  await sharp({
    create: {
      width: PHONE_W,
      height: PHONE_H,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 255 }
    }
  })
    .composite(composites)
    .png()
    .toFile(path.join(OUTPUT_DIR, `${mockupName}.png`));

  console.log(`✅ ${mockupName}.png`);
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Get all square branded images
  const allImages = fs.readdirSync(BRANDED_DIR)
    .filter(f => f.startsWith('promo-') && f.endsWith('.png'))
    .map(f => path.join(BRANDED_DIR, f));

  console.log(`\n📱 Creating Instagram mockups from ${allImages.length} images...\n`);

  // Mockup 1: Best content mix (first 12)
  await createMockup(allImages.slice(0, 12), 'ig-mockup-feed-1');

  // Mockup 2: Different selection (next 12)
  await createMockup(allImages.slice(6, 18), 'ig-mockup-feed-2');

  // Mockup 3: Another mix
  await createMockup(allImages.slice(12, 24), 'ig-mockup-feed-3');

  // Mockup 4: Curated best (hand-picked indices)
  const curated = [
    'promo-signature-pastries.png',
    'promo-green-garden.png',
    'promo-dessert-party.png',
    'promo-coffee-and-3.png',
    'promo-shakshuka-morning.png',
    'promo-chocolate-lovers.png',
    'promo-hand-reaching.png',
    'promo-juice-bar.png',
    'promo-sliced-open.png',
    'promo-acai-healthy.png',
    'promo-couple-sharing.png',
    'promo-friday-special.png',
  ].map(f => path.join(BRANDED_DIR, f)).filter(f => fs.existsSync(f));

  if (curated.length >= 9) {
    await createMockup(curated, 'ig-mockup-curated');
  }

  console.log(`\n✅ Done! Mockups saved to: ${OUTPUT_DIR}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
