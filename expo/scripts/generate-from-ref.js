const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${API_KEY}`;
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'images', 'products');

// Usage: node generate-from-ref.js <reference-image-path> <output-filename> [extra-prompt]
async function main() {
  const refImagePath = process.argv[2];
  const outputName = process.argv[3];
  const extraPrompt = process.argv[4] || '';

  if (!refImagePath || !outputName) {
    console.log('Usage: node generate-from-ref.js <reference-image> <output-name> [extra-prompt]');
    process.exit(1);
  }

  const outputPath = path.join(OUTPUT_DIR, `${outputName}.png`);
  const imageData = fs.readFileSync(refImagePath);
  const base64Image = imageData.toString('base64');
  const mimeType = refImagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const prompt = `Recreate this exact food item in the same style, same arrangement, same look - but place it on a clean light gray concrete surface. Shot from directly above, flat lay top-down perspective, pulled back slightly. Soft diffused natural light. The food must look EXACTLY like the reference photo - same shape, same layers, same colors, same proportions. Ultra realistic. No text, no watermarks, no logos, no human hands. ${extraPrompt}`;

  console.log(`Generating ${outputName} from reference image...`);

  const body = JSON.stringify({
    contents: [{
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Image
          }
        },
        { text: prompt }
      ]
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
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal
    });

    const json = await res.json();

    if (!res.ok) {
      console.error(`API error ${res.status}:`, JSON.stringify(json.error || json));
      process.exit(1);
    }

    const candidates = json.candidates || [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData || part.inline_data) {
          const imgData = part.inlineData || part.inline_data;
          const buffer = Buffer.from(imgData.data, 'base64');
          fs.writeFileSync(outputPath, buffer);
          console.log(`✅ Saved: ${outputName}.png (${(buffer.length / 1024).toFixed(0)} KB)`);
          return;
        }
      }
    }

    console.error('No image in response');
    process.exit(1);
  } finally {
    clearTimeout(timeout);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
