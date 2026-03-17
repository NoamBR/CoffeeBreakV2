const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const LOGO_PATH = path.join(__dirname, '..', '..', '412370589_1004438273972847_355115865115592453_n.jpg');
const SOCIAL_DIR = path.join(__dirname, '..', 'assets', 'social');
const OUTPUT_DIR = path.join(SOCIAL_DIR, 'branded');

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Remove white background from logo - make it transparent
  const rawLogo = await sharp(LOGO_PATH).png().toBuffer();
  const logoTransparent = await sharp(rawLogo)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = logoTransparent;
  const pixels = Buffer.from(data);

  // Replace white/near-white pixels with transparent
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i+1], b = pixels[i+2];
    // If pixel is white or very light gray, make transparent
    if (r > 220 && g > 220 && b > 220) {
      pixels[i+3] = 0; // set alpha to 0
    }
  }

  const cleanLogo = await sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();

  const files = fs.readdirSync(SOCIAL_DIR)
    .filter(f => f.endsWith('.png') && !f.startsWith('.'));

  console.log(`\n🏷️  Adding logo (no bg) to ${files.length} social images...\n`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const inputPath = path.join(SOCIAL_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);

    try {
      const meta = await sharp(inputPath).metadata();
      const imgW = meta.width;
      const imgH = meta.height;

      // Logo size: ~18% of image width
      const logoW = Math.round(imgW * 0.18);

      const logoResized = await sharp(cleanLogo)
        .resize(logoW, null, { fit: 'inside' })
        .png()
        .toBuffer();

      const logoMeta = await sharp(logoResized).metadata();

      // Place logo in bottom-right corner
      const margin = Math.round(imgW * 0.03);

      await sharp(inputPath)
        .composite([
          {
            input: logoResized,
            left: imgW - logoMeta.width - margin,
            top: imgH - logoMeta.height - margin,
          }
        ])
        .toFile(outputPath);

      console.log(`[${i + 1}/${files.length}] ✅ ${file}`);
    } catch (err) {
      console.log(`[${i + 1}/${files.length}] ❌ ${file}: ${err.message}`);
    }
  }

  console.log(`\n✅ Done! Branded images saved to: ${OUTPUT_DIR}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
