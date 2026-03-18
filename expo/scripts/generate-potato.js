const fs = require('fs');
const path = require('path');

const API_KEY = 'REDACTED';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${API_KEY}`;
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'images', 'products');

const STYLE_SUFFIX = `Shot from directly above, flat lay top-down perspective, pulled back slightly to show the full item with generous space around it on the surface. Placed on a clean light gray concrete surface. A small sprig of fresh rosemary, a light dusting of flour, or a few natural crumbs around the item. Soft, even, diffused natural light with no harsh shadows. The food must look REAL and authentic - natural imperfections, real textures, not AI-perfect. Like a real photo taken at a high-end Israeli street food stand. Shot with a professional DSLR camera, shallow depth of field. No text, no watermarks, no logos, no human hands. No wrapper, no paper, no gloves - just the potato directly on the surface.`;

const potatoes = [
  {
    id: 'potato-classic-cream-olives',
    prompt: `A large baked potato (תפוח אדמה מוקרם) split wide open, generously filled with smooth white sour cream/tahini sauce pooling inside, topped with sliced black olives, chopped bright green onion pieces, and crumbled white feta cheese scattered across the top. The potato skin is golden-brown and rustic. The filling is overflowing and generous. A black plastic fork stuck upright in the center of the potato. ${STYLE_SUFFIX}`
  },
  {
    id: 'potato-mushroom-cheese',
    prompt: `A large baked potato (תפוח אדמה מוקרם) split wide open, loaded with sautéed sliced brown mushrooms, melted stretchy yellow cheese on top, and a base of white cream sauce. The potato skin is golden-brown and crispy. Generous overflowing portions. A black plastic fork stuck upright in the center. ${STYLE_SUFFIX}`
  },
  {
    id: 'potato-corn-pepper',
    prompt: `A large baked potato (תפוח אדמה מוקרם) split wide open, piled high with bright golden sweet corn kernels, small diced red bell pepper pieces, chopped fresh green parsley, and a generous swirl of white sour cream underneath. The potato skin is golden-brown. Colorful and vibrant toppings. A black plastic fork stuck upright in the center. ${STYLE_SUFFIX}`
  },
  {
    id: 'potato-broccoli-tahini',
    prompt: `A large baked potato (תפוח אדמה מוקרם) split wide open, loaded with bright green steamed broccoli florets, drizzled with smooth beige tahini sauce, sprinkled with white sesame seeds and a dash of red paprika. The potato skin is golden-brown. Fresh and healthy looking. A black plastic fork stuck upright in the center. ${STYLE_SUFFIX}`
  },
  {
    id: 'potato-supreme-loaded',
    prompt: `A large baked potato (תפוח אדמה מוקרם) split wide open, FULLY LOADED with ALL toppings: white sour cream base, sautéed mushrooms, black olives, sweet corn, crumbled white feta cheese, chopped green onions, and a drizzle of pink beet sauce on top. Massively overflowing, the most loaded generous potato possible. The potato skin is golden-brown. A black plastic fork stuck upright in the center. ${STYLE_SUFFIX}`
  }
];

async function generateImage(product) {
  const outputPath = path.join(OUTPUT_DIR, `${product.id}.png`);

  console.log(`🥔 Generating ${product.id}...`);

  const body = JSON.stringify({
    contents: [{
      parts: [{ text: product.prompt }]
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
      console.error(`  ❌ API error for ${product.id}: ${response.status} - ${errText}`);
      return false;
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData);

    if (!imagePart) {
      console.error(`  ❌ No image returned for ${product.id}`);
      const textPart = parts.find(p => p.text);
      if (textPart) console.error(`  Response text: ${textPart.text}`);
      return false;
    }

    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
    fs.writeFileSync(outputPath, imageBuffer);
    console.log(`  ✅ ${product.id} (${(imageBuffer.length / 1024).toFixed(0)}KB)`);
    return true;
  } catch (err) {
    clearTimeout(timeout);
    console.error(`  ❌ Error for ${product.id}: ${err.message}`);
    return false;
  }
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('\n🥔 Generating photorealistic baked potato product images...\n');

  let success = 0;
  for (const potato of potatoes) {
    const ok = await generateImage(potato);
    if (ok) success++;
    // Small delay between requests
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`\n========================================`);
  console.log(`Done! ${success}/${potatoes.length} potato images generated`);
  console.log(`========================================\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
