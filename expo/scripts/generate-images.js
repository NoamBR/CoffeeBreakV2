const fs = require('fs');
const path = require('path');

const API_KEY = 'REDACTED';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${API_KEY}`;
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'images', 'products');

const STYLE_SUFFIX = `Shot from directly above, flat lay top-down perspective, pulled back slightly to show the full item with generous space around it on the surface. Placed on a clean light gray concrete surface. Boutique artisan bakery presentation - carefully styled with intention and effort. A small sprig of fresh herb, a light dusting of flour, or a few natural crumbs around the item to give it a crafted, boutique feel. Soft, even, diffused natural light with no harsh shadows. The food must look REAL and authentic - natural imperfections, real textures, not AI-perfect. Like a real photo taken at a high-end Israeli boutique bakery. Shot with a professional DSLR camera, shallow depth of field. No text, no watermarks, no logos, no human hands.`;

const products = [
  // === PASTRIES ===
  {
    id: 'croissant-butter',
    prompt: `A single golden, flaky butter croissant with perfectly layered, crispy pastry sheets. Rich buttery color with a shiny, caramelized top. Airy, light texture visible where the layers separate. ${STYLE_SUFFIX}`
  },
  {
    id: 'croissant-almond',
    prompt: `An almond croissant with a crispy golden exterior, filled with rich almond cream (frangipane), topped with sliced toasted almonds and a dusting of powdered sugar. ${STYLE_SUFFIX}`
  },
  {
    id: 'apple-pastry',
    prompt: `A triangle-shaped golden puff pastry apple turnover, cut in half and stacked showing the caramelized apple filling inside. Crispy flaky puff pastry layers visible, dusted with powdered sugar on top. The apple filling is visible from the cut side. Served on a white plate. ${STYLE_SUFFIX}`
  },
  {
    id: 'sweet-cheese-pastry',
    prompt: `A round golden-brown yeast pastry (Israeli gvinit) with the dough folded inward creating an X-cross pattern on top, exposing the sweet white cream cheese filling through the openings. Soft brioche-like dough, golden and shiny on top, on parchment paper. ${STYLE_SUFFIX}`
  },
  {
    id: 'pan-swiss',
    prompt: `A rectangular laminated pastry similar to pain au chocolat shape, with beautiful horizontal crispy golden lamination layers visible on the surface. Chocolate filling peeking out from one end. Placed on a small white ceramic plate. Real Israeli boutique bakery style. ${STYLE_SUFFIX}`
  },
  {
    id: 'pain-au-chocolat',
    prompt: `A single puffy, extra flaky pain au chocolat - rectangular shape but puffed up and tall with many visible laminated flaky layers. Golden-brown, very flaky and layered dough. Dark chocolate sticks visible poking out from both ends. Puffier and more laminated than usual, with crispy flaky layers separating. ${STYLE_SUFFIX}`
  },
  {
    id: 'cinnamon-roll-classic',
    prompt: `A single cinnamon roll with soft swirled dough and cinnamon filling, generously topped with thick white icing/glaze dripping down the sides. One individual roll, warm and gooey. ${STYLE_SUFFIX}`
  },
  {
    id: 'cinnamon-roll-toffee-pecan',
    prompt: `A single cinnamon roll with soft swirled dough and toffee cream filling, topped with toasted pecan pieces and drizzled with caramel toffee sauce. One individual roll, sticky and indulgent. ${STYLE_SUFFIX}`
  },
  {
    id: 'croissant-raspberry',
    prompt: `A butter croissant with distinctive red/pink raspberry-colored dough stripes running through the golden pastry layers. Classic croissant shape with alternating golden and red striped laminated dough. ${STYLE_SUFFIX}`
  },
  {
    id: 'croissant-mocha',
    prompt: `A butter croissant with distinctive brown/chocolate mocha-colored dough stripes running through the golden pastry layers. Classic croissant shape with alternating golden and brown striped laminated dough. ${STYLE_SUFFIX}`
  },
  {
    id: 'savory-potato-pastry',
    prompt: `A rectangular golden puff pastry (Israeli bourekas style) with flaky crispy layers and white sesame seeds sprinkled generously on top. Rectangular shape, golden and crispy with visible laminated puff pastry layers on the sides. ${STYLE_SUFFIX}`
  },
  {
    id: 'savory-cheese-pastry',
    prompt: `A triangle-shaped golden puff pastry bourekas with flaky crispy layers and white sesame seeds sprinkled on top. Triangle shape, golden and crispy with visible laminated puff pastry layers on the sides. Savory cheese filled. ${STYLE_SUFFIX}`
  },
  {
    id: 'brulee-strawberry-pastry',
    prompt: `A folded yeast pastry (like a folded croissant shape) with a small round brûlée disc on top - caramelized sugar custard disc with a fresh strawberry placed on top of it. The pastry is golden and flaky, the brûlée is glossy amber. ${STYLE_SUFFIX}`
  },
  {
    id: 'patisserie-disc',
    prompt: `A round spiral-shaped cruffin pastry (Israeli deskiyot) with visible swirled laminated layers, coated in a light vanilla glaze. Round shape with beautiful spiral layers visible from the side. Served on a small ceramic plate. ${STYLE_SUFFIX}`
  },
  {
    id: 'nutella-disc',
    prompt: `A round spiral-shaped cruffin pastry (Israeli deskiyot) with visible golden swirled laminated layers on the outside, filled with Nutella chocolate inside but the exterior is golden and crispy - NOT coated in chocolate on the outside. Round shape with golden spiral layers visible, Nutella only inside. Served on a small ceramic plate. ${STYLE_SUFFIX}`
  },
  {
    id: 'danish-pistachio-cranberry',
    prompt: `A single cinnamon-roll shaped pastry but with green pistachio cream filling instead of cinnamon, topped with dried cranberries scattered on top. Swirled roll shape like a cinnabon but green pistachio filling visible in the swirls with red cranberries. ${STYLE_SUFFIX}`
  },
  {
    id: 'chocolate-rugelach',
    prompt: `Traditional rolled rugelach pastries (3-4 pieces) with rich chocolate filling. Crescent-shaped, golden-brown with chocolate swirls visible in the spiral layers. Classic Jewish/Israeli pastry. ${STYLE_SUFFIX}`
  },
  {
    id: 'toffifee-cube',
    prompt: `A cube-shaped soft yeast pastry filled with rich toffee cream. Golden-brown exterior with a soft, pillowy texture. The toffee filling is visible where the pastry is slightly open. ${STYLE_SUFFIX}`
  },
  {
    id: 'mascarpone-strawberry-pastry',
    prompt: `A golden butter pastry (like a croissant) split open in half, with generous white mascarpone cream and fresh whole strawberries placed on top of the cream. The pastry is open-faced showing the filling. ${STYLE_SUFFIX}`
  },
  {
    id: 'danish-cream-patisserie',
    prompt: `An airy Danish pastry with a generous filling of smooth, rich pastry cream (crème pâtissière). Light, flaky golden layers with the yellow cream visible in the center. ${STYLE_SUFFIX}`
  },

  // === CRUNCH CAKES ===
  {
    id: 'crunch-chocolate',
    prompt: `An Israeli crunch yeast cake (krantz cake) - a braided/twisted yeast cake with chocolate layers, topped with crumbly streusel crunch topping. Sliced to show the beautiful swirled chocolate layers inside. Golden-brown with dark chocolate swirls. ${STYLE_SUFFIX}`
  },
  {
    id: 'crunch-almond',
    prompt: `An Israeli crunch yeast cake (krantz cake) - a braided/twisted yeast cake with almond cream layers, topped with sliced almonds and crumbly streusel crunch topping. Golden-brown with visible almond filling swirls. ${STYLE_SUFFIX}`
  },
  {
    id: 'crunch-cinnamon-walnut',
    prompt: `An Israeli crunch yeast cake (krantz cake) - a braided/twisted yeast cake with cinnamon and walnut layers, topped with crumbly streusel crunch and walnut pieces. Golden-brown with cinnamon swirl layers visible. ${STYLE_SUFFIX}`
  },
  {
    id: 'crunch-pistachio',
    prompt: `An Israeli crunch yeast cake (krantz cake) - a braided/twisted yeast cake with green pistachio cream layers, topped with crushed pistachios and crumbly streusel. The green pistachio filling is visible in the swirl layers. ${STYLE_SUFFIX}`
  },
  {
    id: 'crunch-nutella-walnut',
    prompt: `An Israeli crunch yeast cake (krantz cake) - a braided/twisted yeast cake with Nutella chocolate-hazelnut layers, topped with walnut pieces and crumbly chocolate streusel. Dark chocolate swirls visible. ${STYLE_SUFFIX}`
  },
  {
    id: 'crunch-halva-pistachio',
    prompt: `An Israeli crunch yeast cake (krantz cake) - a braided/twisted yeast cake with halva (tahini) and pistachio cream layers, topped with crushed pistachios and crumbly streusel. Unique golden-tan halva swirls with green pistachio bits visible. ${STYLE_SUFFIX}`
  },

  // === SANDWICHES ===
  {
    id: 'sandwich-bulgarian',
    prompt: `A fresh sandwich on artisan bread filled with crumbled Bulgarian white cheese (feta-style), fresh vegetables (tomatoes, cucumbers, green lollo lettuce), and a rich spread. Cut in half showing the colorful filling. ${STYLE_SUFFIX}`
  },
  {
    id: 'sandwich-egg-salad',
    prompt: `A fresh sandwich filled with creamy egg salad with green onions and herbs, served on fresh bread with green lollo lettuce and tomato slices. Cut in half showing the rich yellow egg filling. ${STYLE_SUFFIX}`
  },
  {
    id: 'sandwich-tuna',
    prompt: `A fresh tuna salad sandwich on artisan bread with crispy vegetables, green lollo lettuce and house spread. Cut in half showing the generous tuna filling. ${STYLE_SUFFIX}`
  },
  {
    id: 'sandwich-avocado',
    prompt: `A fresh sandwich with ripe avocado slices, green lollo lettuce, seasonal vegetables, and rich spread on fresh crusty bread. Cut in half showing vibrant green avocado layers. Healthy, fresh presentation. ${STYLE_SUFFIX}`
  },
  {
    id: 'sandwich-omelet',
    prompt: `A fresh sandwich with a fluffy golden omelet, green lollo lettuce, fresh vegetables, and homemade spread on artisan bread. Cut in half showing the thick, juicy omelet filling. ${STYLE_SUFFIX}`
  },
  {
    id: 'croissant-omelet-parmesan',
    prompt: `A flaky butter croissant split open and filled with a rich golden omelet, scraped/shaved parmesan cheese on top, and fresh green lollo lettuce. The croissant shows its laminated layers. ${STYLE_SUFFIX}`
  },
  {
    id: 'sandwich-salmon',
    prompt: `An open-faced sandwich - a single slice of sourdough bread on a wooden cutting board, spread with cream cheese, topped with folded smoked salmon slices, red onion rings, capers, and a fresh dill sprig. Elegant, boutique style. ${STYLE_SUFFIX}`
  },
  {
    id: 'sandwich-shakshuka',
    prompt: `A warm pita/frenha bread filled with spicy shakshuka (eggs poached in tomato sauce with spices). The red tomato sauce and eggs are visible inside the bread. Rustic, hearty presentation. ${STYLE_SUFFIX}`
  },

  // === SALADS ===
  {
    id: 'salad-caprese',
    prompt: `A classic Caprese salad with fresh sliced tomatoes, buffalo mozzarella, and fresh basil leaves, drizzled with olive oil and balsamic reduction. Beautiful red, white, and green presentation in a white bowl. ${STYLE_SUFFIX}`
  },
  {
    id: 'salad-bulgarian',
    prompt: `A fresh Bulgarian salad (Israeli/Mediterranean style) with diced tomatoes, cucumbers, crumbled white feta cheese, Kalamata olives, and red onion, dressed with olive oil and za'atar. Served in a white bowl. ${STYLE_SUFFIX}`
  },
  {
    id: 'salad-tuna',
    prompt: `A fresh tuna salad with green lollo lettuce, quality tuna chunks, hard-boiled egg halves, cherry tomatoes, cucumber, and red onion, dressed with olive oil and lemon. Served in a white bowl. ${STYLE_SUFFIX}`
  },
  {
    id: 'salad-baby-greens',
    prompt: `A fresh baby greens salad with green lollo lettuce and young mixed leaves, seasonal vegetables, dressed with house vinaigrette. Light, colorful, and refreshing presentation in a white bowl. ${STYLE_SUFFIX}`
  },

  // === BREAKFAST ===
  {
    id: 'shakshuka',
    prompt: `Traditional shakshuka - two eggs poached in a rich, spicy tomato sauce, served in a cast iron skillet with fresh bread on the side and a small personal salad. Vibrant red sauce with perfectly cooked eggs. ${STYLE_SUFFIX}`
  },
  {
    id: 'focaccia-spreads',
    prompt: `A freshly baked Italian focaccia bread, golden and crispy, served alongside small bowls of various homemade spreads (hummus, tahini, pesto). Artisan bread with olive oil dimples and herbs on top. ${STYLE_SUFFIX}`
  },
  {
    id: 'acai-yogurt-bowl',
    prompt: `A beautiful acai bowl or thick yogurt bowl topped with crunchy granola, fresh seasonal fruits (berries, banana slices, kiwi), and a drizzle of honey. Colorful, Instagram-worthy presentation in a ceramic bowl. ${STYLE_SUFFIX}`
  },
  {
    id: 'pizza-margherita',
    prompt: `A classic Margherita pizza with rich tomato sauce, melted mozzarella cheese, and fresh basil leaves, baked in a stone oven with a crispy, slightly charred crust. One slice slightly pulled away. ${STYLE_SUFFIX}`
  },

  // === SPECIALS ===
  {
    id: 'picnic-basket',
    prompt: `An elegant wicker picnic basket for two, filled with fresh pastries, boutique cheeses, artisan bread, homemade spreads, seasonal fruits, and a small bottle. Styled beautifully with a checkered cloth. Romantic outdoor café setting. ${STYLE_SUFFIX}`
  },
  {
    id: 'bourekas-treats',
    prompt: `Golden, crispy bourekas (phyllo/puff pastry triangles) with rich filling, served alongside a hard-boiled egg half, fresh tomato paste, and a small dish of spicy house sauce. Traditional Israeli breakfast treat. ${STYLE_SUFFIX}`
  },
  {
    id: 'jachnun-saturday',
    prompt: `Traditional Yemenite jachnun - dark golden rolled pastry served with grated fresh tomato dip, hard-boiled egg, and zhug (spicy green sauce). Rich, slow-baked Shabbat morning specialty. Rustic presentation. ${STYLE_SUFFIX}`
  },

  // === DESSERTS ===
  {
    id: 'chocolate-cake',
    prompt: `A rich, moist chocolate cake slice with a velvety texture, served warm with a drizzle of warm chocolate sauce. Dark, decadent, and indulgent. Single slice on a white plate. ${STYLE_SUFFIX}`
  },
  {
    id: 'dubai-chocolate',
    prompt: `Dubai-style chocolate bar - milk chocolate filled with rich green pistachio cream and crispy golden kadaif (shredded phyllo) threads. The chocolate is broken open showing the contrasting green pistachio and golden kadaif filling. Luxurious presentation. ${STYLE_SUFFIX}`
  },
  {
    id: 'lemon-raspberry-tart',
    prompt: `A small individual tart with a crispy pastry shell filled with tangy lemon curd, topped with fresh raspberries and delicate airy meringue kisses. Elegant pastry shop presentation. ${STYLE_SUFFIX}`
  },
  {
    id: 'tiramisu',
    prompt: `A slice of tiramisu cake served on a white plate - layers of espresso-soaked ladyfinger biscuits and rich mascarpone cream, dusted with cocoa powder on top. A clean square/rectangular slice showing the beautiful layers from the side. Not in a cup. ${STYLE_SUFFIX}`
  },
  {
    id: 'cheesecake',
    prompt: `A slice of baked cheesecake - rich, dense, and creamy with a velvety texture, on a crispy biscuit crumb base. Classic New York style, golden on top, smooth and creamy inside. On a white plate. ${STYLE_SUFFIX}`
  },
  {
    id: 'mascarpone-strawberries',
    prompt: `A slice of mascarpone strawberry cake served on a white plate - layers of light sponge cake with rich mascarpone cream and fresh strawberries between the layers, topped with strawberry coulis and a fresh strawberry. Not in a cup. ${STYLE_SUFFIX}`
  },

  // === COOKIES & TREATS ===
  {
    id: 'night-cookies',
    prompt: `Artisan night-baked cookies (2-3 cookies) with a perfect texture combining soft, gooey inside and delicate crispy edges. Chocolate chip cookies with visible melted chocolate chunks. Warm, fresh-from-the-oven appearance. ${STYLE_SUFFIX}`
  },
  {
    id: 'amsterdam-cookie',
    prompt: `A rich, thick Amsterdam-style cookie made with dark cocoa dough and filled with premium white chocolate chunks. Dark brown cookie with visible white chocolate pieces, soft and fudgy texture. ${STYLE_SUFFIX}`
  },
  {
    id: 'alfajores',
    prompt: `Two alfajores cookies - round, crumbly shortbread cookies sandwiched with rich dulce de leche (milk caramel), coated in shredded coconut. Golden, delicate, and sweet. ${STYLE_SUFFIX}`
  },
  {
    id: 'kinder-roll',
    prompt: `Rows of sliced Israeli ruladah kinder cookies on a baking tray seen from above. Each slice is a wide oval showing: dark brown chocolate cookie dough layers with cream/beige colored solid filling between them. A sliced Kinder bueno bar in the center. The slices look exactly like Israeli bakery ruladah - dark chocolate dough, cream colored filling, Kinder bar center, arranged in tight rows on parchment. Wide oval shape. ${STYLE_SUFFIX}`
  },
  {
    id: 'nutella-roll',
    prompt: `Rows of sliced Israeli ruladah nutella cookies on a baking tray seen from above. Each slice is a wide oval showing: light vanilla cookie dough layers with dark Nutella chocolate filling between them. A sliced Kinder bueno bar in the center. The slices look exactly like Israeli bakery ruladah - light dough, dark Nutella filling, Kinder bar center, arranged in tight rows on parchment. Wide oval shape. ${STYLE_SUFFIX}`
  },
  {
    id: 'brownies',
    prompt: `Rich, fudgy chocolate brownies (2-3 squares) with a crackly, slightly crispy top and dense, moist, fudgy interior. Deep dark chocolate color. Stacked presentation. ${STYLE_SUFFIX}`
  },
  {
    id: 'blondies',
    prompt: `Rich blondie squares (2-3 pieces) with a fudgy, chewy texture, featuring premium white chocolate chunks and a deep caramel/butterscotch flavor. Golden-brown color with a slightly crackly top. ${STYLE_SUFFIX}`
  },

  // === COFFEE & HOT/COLD DRINKS ===
  {
    id: 'espresso',
    prompt: `A single shot of espresso in a small white ceramic espresso cup on a saucer, with a perfect golden crema on top. Rich dark brown color. Boutique café presentation. ${STYLE_SUFFIX}`
  },
  {
    id: 'hafuch-small',
    prompt: `A small café latte (Israeli hafuch) in a ceramic cup, with beautiful latte art on the creamy milk foam surface. Warm, inviting coffee shop drink. ${STYLE_SUFFIX}`
  },
  {
    id: 'americano-small',
    prompt: `A small americano coffee in a white ceramic cup, smooth dark coffee with a thin crema layer on top. Clean, simple presentation. ${STYLE_SUFFIX}`
  },
  {
    id: 'hafuch-large',
    prompt: `A large café latte (Israeli hafuch) in a big ceramic cup, with beautiful latte art on the thick creamy milk foam. Warm and inviting. ${STYLE_SUFFIX}`
  },
  {
    id: 'americano-large',
    prompt: `A large americano coffee in a big white ceramic cup, smooth dark coffee with a thin crema layer. Generous size, clean presentation. ${STYLE_SUFFIX}`
  },
  {
    id: 'hot-chocolate-small',
    prompt: `A small cup of rich homemade hot chocolate, thick and velvety dark brown, in a white ceramic cup. Maybe a few mini marshmallows or cocoa powder dusted on top. ${STYLE_SUFFIX}`
  },
  {
    id: 'hot-chocolate-large',
    prompt: `A large cup of rich homemade hot chocolate, thick and creamy, in a big white ceramic cup. Velvety smooth texture with cocoa powder dusted on top. ${STYLE_SUFFIX}`
  },
  {
    id: 'tea',
    prompt: `A cup of tea in a white ceramic cup with a tea bag string hanging over the side, golden amber color liquid, with a small lemon wedge on the saucer. Clean, simple. ${STYLE_SUFFIX}`
  },
  {
    id: 'matcha-hot',
    prompt: `A hot matcha latte in a ceramic cup, vibrant green color with beautiful latte art on the foam. Japanese-style premium matcha with a rich green hue. ${STYLE_SUFFIX}`
  },
  {
    id: 'iced-coffee',
    prompt: `An iced coffee in a tall clear glass, espresso and cold milk over ice cubes, with a straw. Refreshing, layered look showing the coffee mixing with milk. ${STYLE_SUFFIX}`
  },
  {
    id: 'iced-americano',
    prompt: `An iced americano in a tall clear glass, dark coffee over ice cubes, refreshing and clean. Simple, elegant presentation. ${STYLE_SUFFIX}`
  },
  {
    id: 'iced-chocolate',
    prompt: `An iced chocolate drink in a tall clear glass, rich chocolate milk over ice cubes, creamy and refreshing. Dark brown color with a straw. ${STYLE_SUFFIX}`
  },
  {
    id: 'matcha-cold',
    prompt: `An iced matcha latte in a tall clear glass, vibrant green matcha mixed with cold milk over ice cubes. Beautiful green gradient, refreshing and trendy. ${STYLE_SUFFIX}`
  },

  // === SOFT DRINKS ===
  {
    id: 'juice-orange',
    prompt: `A glass of freshly squeezed orange juice, bright vibrant orange color, served in a clear glass. A halved orange and some orange slices scattered around the glass on the surface. Rich and vibrant. ${STYLE_SUFFIX}`
  },
  {
    id: 'juice-carrot',
    prompt: `A glass of freshly squeezed carrot juice, bright deep orange color, served in a clear glass. A few whole carrots and carrot slices scattered around the glass on the surface. Rich and vibrant. ${STYLE_SUFFIX}`
  },
  {
    id: 'juice-pomegranate',
    prompt: `A glass of freshly squeezed pomegranate juice, deep ruby red color, served in a clear glass. A halved pomegranate and some loose pomegranate seeds scattered around the glass on the surface. Rich and vibrant. ${STYLE_SUFFIX}`
  },
  {
    id: 'water-bottle',
    prompt: `A clear plastic bottle of mineral water with a simple clean label. Refreshing, clean, minimal presentation. ${STYLE_SUFFIX}`
  },
  {
    id: 'soda-water',
    prompt: `A glass of sparkling soda water with visible bubbles, served in a clear glass with ice. Refreshing and fizzy. ${STYLE_SUFFIX}`
  },
  {
    id: 'can-drink',
    prompt: `A generic cold soft drink can (no brand visible), condensation droplets on the outside, refreshing look. Simple aluminum can. ${STYLE_SUFFIX}`
  },
  {
    id: 'bottle-drink',
    prompt: `A generic cold soft drink bottle (no brand visible), condensation droplets on the outside. Simple plastic bottle with refreshing drink inside. ${STYLE_SUFFIX}`
  }
];

// Helper to make API request using fetch
async function generateImage(prompt) {
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
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${JSON.stringify(json.error || json)}`);
    }

    const candidates = json.candidates || [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData || part.inline_data) {
          const imageData = part.inlineData || part.inline_data;
          return Buffer.from(imageData.data, 'base64');
        }
      }
    }

    throw new Error('No image data in response: ' + JSON.stringify(json).substring(0, 500));
  } finally {
    clearTimeout(timeout);
  }
}

// Delay helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main
async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`\n🖼️  Generating ${products.length} product images...\n`);

  let success = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const outputPath = path.join(OUTPUT_DIR, `${product.id}.png`);

    // Skip if already generated
    if (fs.existsSync(outputPath)) {
      console.log(`[${i + 1}/${products.length}] SKIP ${product.id} (already exists)`);
      success++;
      continue;
    }

    console.log(`[${i + 1}/${products.length}] Generating: ${product.id}...`);

    let retries = 3;
    while (retries > 0) {
      try {
        const imageBuffer = await generateImage(product.prompt);
        fs.writeFileSync(outputPath, imageBuffer);
        console.log(`  ✅ Saved: ${product.id}.png (${(imageBuffer.length / 1024).toFixed(0)} KB)`);
        success++;
        break;
      } catch (err) {
        retries--;
        if (retries > 0) {
          console.log(`  ⚠️  Error: ${err.message}. Retrying in 5s... (${retries} left)`);
          await delay(5000);
        } else {
          console.log(`  ❌ FAILED: ${product.id} - ${err.message}`);
          errors.push({ id: product.id, error: err.message });
          failed++;
        }
      }
    }

    // Rate limit: wait 2s between requests
    if (i < products.length - 1) {
      await delay(2000);
    }
  }

  console.log(`\n========================================`);
  console.log(`Done! ${success} succeeded, ${failed} failed out of ${products.length}`);
  if (errors.length > 0) {
    console.log(`\nFailed products:`);
    errors.forEach(e => console.log(`  - ${e.id}: ${e.error}`));
  }
  console.log(`========================================\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
