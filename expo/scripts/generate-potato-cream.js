const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${API_KEY}`;
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'images', 'products');

// Reference images for style matching
const REF_DIR = path.join(__dirname, '..', '..');

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Load reference photos of the real baked potato in its wrapper
  const refImages = [];
  const refFiles = [
    '412370589_1004438273972847_355115865115592453_n.jpg' // logo for brand context
  ];

  const prompt = `A large baked potato (תפוח אדמה מוקרם / kumpir) split open, sitting inside a white branded deli paper wrapper/tray. The potato is held together by the paper wrapping. NO TOPPINGS AT ALL - only smooth creamy white sour cream sauce inside the potato. The cream sauce is NOT covering the whole potato - it is pooling inside the split and melting/dripping down the sides of the potato naturally. The potato itself should have a warm CREAMY golden-brown skin color, not grey - warm tones. The interior flesh of the potato is fluffy and light yellowish-cream colored. A black plastic fork stuck upright in the center. The white deli paper wrapper is crinkled around the potato like street food packaging (like a torino/kumpir paper tray). Shot from a 45-degree angle (NOT top down - angled like someone holding it or it sitting on a counter), slightly above looking down at an angle. Clean light gray concrete surface background. Soft diffused natural light. The food must look REAL and authentic - natural imperfections, real textures. Ultra realistic professional food photography. No text, no watermarks, no logos, no human hands, no gloves.`;

  console.log('🥔 Generating cream-only baked potato in paper wrapper...\n');

  const body = JSON.stringify({
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: '1:1',
        imageSize: '2K'
      }
    }
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ API error: ${response.status} - ${errText}`);
      return;
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData);

    if (!imagePart) {
      console.error('❌ No image returned');
      const textPart = parts.find(p => p.text);
      if (textPart) console.error(`Response: ${textPart.text}`);
      return;
    }

    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
    const outputPath = path.join(OUTPUT_DIR, 'potato-cream-only.png');
    fs.writeFileSync(outputPath, imageBuffer);
    console.log(`✅ potato-cream-only.png (${(imageBuffer.length / 1024).toFixed(0)}KB)`);
  } catch (err) {
    clearTimeout(timeout);
    console.error(`❌ Error: ${err.message}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
