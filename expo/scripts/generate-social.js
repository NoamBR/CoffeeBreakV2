const fs = require('fs');
const path = require('path');

const API_KEY = 'AIzaSyAwDmOzAkvzePrS8hx4BxcfpjUwyR10BAM';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${API_KEY}`;
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'social');

const STYLE = `Shot from HIGH ABOVE looking straight down, pulled back FAR to show the entire white table surface. All items arranged on a clean white table. Each item on its own small white plate or directly on the table. A hot coffee (latte with latte art) and an iced coffee (in tall glass with ice and straw) MUST be included in every shot. 5-8 food items visible. Small green herb sprigs (rosemary, mint, basil) and tiny green leaves scattered as decoration between items. Some crumbs and powdered sugar scattered naturally. Must look like a REAL photograph taken with a professional DSLR camera - natural imperfections, real food textures, authentic shadows, not AI-perfect. Ultra realistic, natural daylight, Israeli boutique bakery aesthetic. No text, no watermarks.`;

const posts = [
  // === PASTRY PROMOS ===
  {
    id: 'promo-pastry-spread',
    aspect: '1:1',
    prompt: `White table from high above: a butter croissant, an almond croissant, a pain au chocolat (round spiral laminated), a cinnamon roll with white icing, a raspberry striped croissant, a pistachio danish. A hot latte and an iced coffee on the table. 7 items total. ${STYLE}`
  },
  {
    id: 'promo-signature-pastries',
    aspect: '1:1',
    prompt: `White table from high above: a brûlée strawberry pastry (square base with caramelized disc and strawberry), a toffifee cube with white chocolate drizzle, a mascarpone strawberry tart with cream dome and fresh strawberries, a cruffin/deskiyot spiral pastry, a chocolate rugelach croissant, a pan swiss with white filling. A hot latte and an iced coffee. 8 items. ${STYLE}`
  },
  {
    id: 'promo-croissant-collection',
    aspect: '1:1',
    prompt: `White table from high above: 6 different croissants arranged in a circle - butter croissant, almond croissant, raspberry striped croissant, mocha striped croissant, chocolate pain au chocolat, and a croissant sandwich with salmon. A hot latte in the center and an iced coffee. ${STYLE}`
  },
  {
    id: 'promo-sweet-treats',
    aspect: '1:1',
    prompt: `White table from high above: a night cookie, an Amsterdam dark cookie, alfajores with coconut, brownies stacked, blondies, a slice of chocolate cake with ganache, kinder roll slices. A hot latte and an iced coffee. 8 items total. ${STYLE}`
  },

  // === SANDWICH & SAVORY PROMOS ===
  {
    id: 'promo-sandwich-spread',
    aspect: '1:1',
    prompt: `White table from high above: 5 different sandwiches each cut in half showing fillings - salmon on sourdough, avocado sandwich, egg salad sandwich, tuna sandwich, omelet sandwich. All with green lollo lettuce visible. A hot latte and an iced coffee. ${STYLE}`
  },
  {
    id: 'promo-breakfast-table',
    aspect: '1:1',
    prompt: `White table from high above: a shakshuka in a small cast iron skillet, focaccia bread with spreads in small bowls, an acai yogurt bowl with granola and berries, a croissant sandwich with omelet and parmesan, a fresh salad, a glass of orange juice. A hot latte and an iced coffee. 8 items. ${STYLE}`
  },
  {
    id: 'promo-savory-selection',
    aspect: '1:1',
    prompt: `White table from high above: a triangle bourekas with sesame seeds, a rectangular potato pastry with sesame, a croissant omelet parmesan sandwich, a Bulgarian cheese sandwich cut in half, a Caprese salad in a bowl, jachnun rolls with egg and tomato sauce. A hot latte and an iced coffee. 8 items. ${STYLE}`
  },

  // === DESSERT PROMOS ===
  {
    id: 'promo-dessert-table',
    aspect: '1:1',
    prompt: `White table from high above: a slice of white cheesecake, a slice of dark chocolate cake with ganache, a tiramisu on a plate, a lemon raspberry tart, mascarpone strawberry dessert, Dubai chocolate broken open showing pistachio. A hot latte and an iced coffee. 8 items. ${STYLE}`
  },
  {
    id: 'promo-crunch-cakes',
    aspect: '1:1',
    prompt: `White table from high above: 6 different sliced crunch/krantz yeast cakes showing their swirled interiors - chocolate, almond, pistachio (green), cinnamon walnut, nutella, halva pistachio. Each on a small plate. A hot latte and an iced coffee. 8 items. ${STYLE}`
  },

  // === DRINK PROMOS ===
  {
    id: 'promo-drinks-lineup',
    aspect: '1:1',
    prompt: `White table from high above: a lineup of 8 different drinks arranged in a pattern - espresso in small cup, hot latte with latte art, americano, hot chocolate, iced coffee, iced americano, iced chocolate, green iced matcha latte. Each in appropriate glass/cup. ${STYLE}`
  },
  {
    id: 'promo-juice-fresh',
    aspect: '1:1',
    prompt: `White table from high above: 3 fresh juices in tall glasses - orange juice (bright orange), carrot juice (deep orange), pomegranate juice (deep red). A halved orange, some carrots, and a halved pomegranate scattered around. A hot latte and an iced coffee. Clean, fresh, colorful. ${STYLE}`
  },

  // === MIXED/LIFESTYLE PROMOS ===
  {
    id: 'promo-best-sellers',
    aspect: '1:1',
    prompt: `White table from high above: the best sellers - a butter croissant, a shakshuka in a small skillet, a salmon sandwich cut in half showing the filling, a slice of cheesecake, a toffifee cube, a cinnamon roll. A hot latte and an iced coffee. Fresh mint and rosemary sprigs between items. 8 items total. ${STYLE}`
  },
  {
    id: 'promo-new-items',
    aspect: '1:1',
    prompt: `White table from high above: new menu items - a green matcha latte (hot), an iced green matcha, Dubai chocolate broken open showing green pistachio filling, crunch halva pistachio cake slice, raspberry striped croissant, mascarpone strawberry tart with cream dome and strawberries. Fresh basil leaves as deco. A hot regular latte and an iced coffee. 8 items. ${STYLE}`
  },
  {
    id: 'promo-weekend-brunch',
    aspect: '1:1',
    prompt: `White table from high above: a weekend brunch spread - an acai bowl, focaccia with spreads, a croissant sandwich, a fresh salad, a slice of cheesecake, a pain au chocolat, a glass of fresh orange juice. Rosemary and mint scattered. A hot latte and an iced coffee. 8 items. ${STYLE}`
  },

  // === CREATIVE VARIATIONS WITH HANDS/SLICING ===
  {
    id: 'promo-hand-reaching',
    aspect: '1:1',
    prompt: `White table from high above: 6 pastries on plates - butter croissant, almond croissant, cinnamon roll, pain au chocolat, raspberry croissant, toffifee cube. A hot latte and iced coffee. A woman's hand reaching to pick up the butter croissant from the plate. Fresh green mint leaves and small flowers scattered on the table. ${STYLE}`
  },
  {
    id: 'promo-sliced-open',
    aspect: '1:1',
    prompt: `White table from high above: 5 pastries each SLICED IN HALF showing their beautiful fillings inside - a pan swiss cut open showing white cream cheese, a pain au chocolat cut open showing dark chocolate inside, a raspberry croissant cut showing pink filling, a pistachio danish cut showing green filling, a brûlée pastry cut showing cream. A hot latte with latte art and an iced coffee. Fresh green herbs scattered. ${STYLE}`
  },
  {
    id: 'promo-spoon-dessert',
    aspect: '1:1',
    prompt: `White table from high above: desserts on plates - a tiramisu with a silver spoon scooping into it, a mascarpone strawberry tart with fresh sliced strawberries on top, a cheesecake slice, a chocolate cake slice, a lemon tart. A hot latte and an iced coffee. Small fresh mint sprigs and edible flowers scattered on table. ${STYLE}`
  },
  {
    id: 'promo-green-garden',
    aspect: '1:1',
    prompt: `White table from high above: 6 items arranged beautifully - an avocado salad bowl, a salmon sandwich cut in half, a fresh green juice, a croissant sandwich with green lollo lettuce, a shakshuka skillet, focaccia with olive oil. LOTS of green herbs, arugula leaves, mint, and small white flowers decorating the table between items. A hot latte and an iced coffee. Very green and fresh aesthetic. ${STYLE}`
  },
  {
    id: 'promo-couple-sharing',
    aspect: '1:1',
    prompt: `White table from high above: two people's hands visible from opposite sides of the table, one hand holding a coffee cup, the other hand breaking a croissant open. Between them: 6 pastries on plates, iced coffees, a salad, a sandwich cut in half. Green herbs and small flower petals scattered. Romantic coffee date vibe. ${STYLE}`
  },
  {
    id: 'promo-morning-ritual',
    aspect: '1:1',
    prompt: `White table from high above: a morning coffee ritual - a newspaper partially visible, a hot latte with latte art, an iced coffee, 3 pastries (butter croissant, pain au chocolat, almond croissant) each on small white plates, a small jar of jam, a fresh orange juice. Green mint sprigs and a tiny succulent plant in a pot as decoration. Clean, calm, premium morning. ${STYLE}`
  },

  // === STORY FORMAT (9:16) ===
  {
    id: 'story-full-table',
    aspect: '9:16',
    prompt: `Vertical format. White table from high above showing a FULL spread: 6-8 different pastries on plates, iced coffees, a sandwich, a small salad, desserts. Green herbs, mint, and small white flowers scattered between items. A hand reaching for one item. Shot from far above to show the entire table. ${STYLE}`
  },
  {
    id: 'story-breakfast-spread',
    aspect: '9:16',
    prompt: `Vertical format. White table from high above: shakshuka in skillet, focaccia, acai bowl, croissant, salmon sandwich cut in half, fresh juice, hot latte and iced coffee. Fresh rosemary and basil sprigs as decoration. 8 items spread across the long table. Shot from far above. ${STYLE}`
  },
  {
    id: 'story-dessert-heaven',
    aspect: '9:16',
    prompt: `Vertical format. White table from high above: cheesecake slice, chocolate cake slice, tiramisu with a spoon in it, lemon tart, mascarpone strawberry tart, brownies, Dubai chocolate broken open, cinnamon roll. Hot latte and iced coffee. Mint leaves and edible flowers scattered. 8+ desserts. Shot from far above. ${STYLE}`
  },
  {
    id: 'story-sliced-pastries',
    aspect: '9:16',
    prompt: `Vertical format. White table from high above: 8 pastries each cut in half showing their fillings - butter croissant layers, chocolate rugelach swirl, cinnamon roll spiral, pan swiss cream, raspberry croissant pink filling, pistachio danish green filling, toffifee cube caramel, almond croissant cream. Hot latte and iced coffee. Green herbs scattered. Shot from far above. ${STYLE}`
  },

  // === MORE CREATIVE VARIATIONS ===
  {
    id: 'promo-coffee-and-3',
    aspect: '1:1',
    prompt: `White wooden rustic table from high above: just 3 pastries on small ceramic plates - a golden butter croissant, an almond croissant with powdered sugar, and a pain au chocolat. A large hot latte with beautiful heart latte art in the center, and an iced coffee with a metal straw. Fresh rosemary sprigs, mint leaves, and tiny white wildflowers scattered between items. Breadcrumbs on the table. Warm morning sunlight. ${STYLE}`
  },
  {
    id: 'promo-krantz-slices',
    aspect: '1:1',
    prompt: `White wooden table from high above: 6 slices of different krantz/crunch yeast cakes arranged in a circle, each showing their beautiful swirled interior - chocolate swirl, pistachio green swirl, cinnamon walnut swirl, nutella swirl, almond swirl, halva pistachio swirl. A hot latte in the center. Fresh mint leaves and small purple edible flowers scattered. ${STYLE}`
  },
  {
    id: 'promo-sandwich-lunch',
    aspect: '1:1',
    prompt: `White wooden table from high above: 4 sandwiches each cut diagonally in half showing their colorful fillings - salmon with cream cheese on sourdough, avocado sandwich with green lettuce, egg salad sandwich, tuna sandwich. Each on a white plate. A bowl of fresh green salad with cherry tomatoes. An iced coffee and a hot latte. Arugula leaves, basil, and rosemary scattered. ${STYLE}`
  },
  {
    id: 'promo-dessert-party',
    aspect: '1:1',
    prompt: `White wooden table from high above: a dessert celebration - a whole cheesecake with one slice cut and pulled out, a chocolate cake slice, a tiramisu with cocoa powder and a spoon, mascarpone strawberry tarts with fresh red strawberries, brownies stacked, a lemon tart. Hot latte and iced coffee. Mint leaves, edible pansies (purple and yellow), and powdered sugar dusted on table. ${STYLE}`
  },
  {
    id: 'promo-shakshuka-morning',
    aspect: '1:1',
    prompt: `White wooden table from high above: a shakshuka in a small black cast iron skillet with 2 eggs, a wooden board with sliced focaccia bread, small bowls of tahini and hot sauce, a fresh green salad, a butter croissant on a plate. Hot latte with latte art and an iced coffee. Fresh parsley, cilantro, and mint scattered. Olive oil drizzle visible. ${STYLE}`
  },
  {
    id: 'promo-acai-healthy',
    aspect: '1:1',
    prompt: `White wooden table from high above: a beautiful purple acai bowl topped with sliced banana, strawberries, granola, and coconut flakes. Next to it: a green matcha latte, a fresh orange juice, a croissant sandwich with avocado and lettuce, a small fruit salad bowl. Hot latte and iced coffee. LOTS of fresh mint, basil leaves, and small white flowers. Very fresh and healthy vibe. ${STYLE}`
  },
  {
    id: 'promo-chocolate-lovers',
    aspect: '1:1',
    prompt: `White wooden table from high above: chocolate heaven - a pain au chocolat, a chocolate rugelach croissant, a nutella disc/cruffin spiral, brownies stacked, a slice of chocolate cake with ganache, Dubai chocolate broken open showing green pistachio filling, a chocolate krantz cake slice. Hot latte and iced coffee. Cocoa powder dusted, mint leaves, dark chocolate shavings scattered. ${STYLE}`
  },
  {
    id: 'promo-friday-special',
    aspect: '1:1',
    prompt: `White wooden table from high above: a Friday morning Israeli spread - jachnun rolls with a halved boiled egg and tomato sauce in a ramekin, a triangle cheese bourekas with sesame, a butter croissant, a cinnamon roll, a fresh salad bowl, a glass of fresh orange juice. Hot latte and iced coffee. Fresh herbs, flowers, and a small olive branch as decoration. Festive, warm, welcoming. ${STYLE}`
  },
  {
    id: 'promo-grab-and-go',
    aspect: '1:1',
    prompt: `White wooden table from high above: a woman's hand with a ring grabbing a butter croissant from a table with 5 other pastries - almond croissant, pain au chocolat, cinnamon roll, raspberry croissant, toffifee cube. A takeaway coffee cup and an iced coffee in a tall glass. Fresh rosemary, mint, small white daisies scattered. Morning rush energy. ${STYLE}`
  },
  {
    id: 'promo-juice-bar',
    aspect: '1:1',
    prompt: `White wooden table from high above: 3 fresh juices in tall glasses arranged in a row - bright orange juice, deep orange carrot juice, deep ruby red pomegranate juice. Around them: a halved orange, carrot sticks, a halved pomegranate with seeds visible. A hot latte and an iced coffee. Fresh mint sprigs, basil leaves, and tiny edible flowers. Very colorful and fresh. ${STYLE}`
  },

  // === MORE STORY FORMAT ===
  {
    id: 'story-coffee-date',
    aspect: '9:16',
    prompt: `Vertical format. White wooden table from high above: two people's hands visible - one holding a hot latte cup, the other reaching for a pastry. Between them: 4 pastries on plates, 2 iced coffees, a slice of cheesecake, a salad bowl. Fresh green herbs, rosemary, mint, and small white flowers scattered. Romantic, warm, natural light from window. ${STYLE}`
  },
  {
    id: 'story-healthy-morning',
    aspect: '9:16',
    prompt: `Vertical format. White wooden table from high above: a purple acai bowl with toppings, a shakshuka in a skillet, focaccia on a board, a salmon sandwich, a fresh green salad, a glass of orange juice, a green matcha latte, a hot latte, an iced coffee. LOTS of green herbs - mint, basil, arugula, rosemary scattered everywhere. Very green, fresh, healthy. ${STYLE}`
  },
];

async function generateImage(prompt, aspectRatio) {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio, imageSize: '2K' }
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
    if (!res.ok) throw new Error(`API error ${res.status}: ${JSON.stringify(json.error || json).substring(0, 200)}`);

    for (const c of (json.candidates || [])) {
      for (const p of (c.content?.parts || [])) {
        if (p.inlineData || p.inline_data) {
          return Buffer.from((p.inlineData || p.inline_data).data, 'base64');
        }
      }
    }
    throw new Error('No image data');
  } finally { clearTimeout(timeout); }
}

const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`\n📸 Generating ${posts.length} social media posts...\n`);
  let success = 0, failed = 0;
  const errors = [];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const outputPath = path.join(OUTPUT_DIR, `${post.id}.png`);

    if (fs.existsSync(outputPath)) {
      console.log(`[${i+1}/${posts.length}] SKIP ${post.id}`);
      success++; continue;
    }

    console.log(`[${i+1}/${posts.length}] Generating: ${post.id} (${post.aspect})...`);
    let retries = 3;
    while (retries > 0) {
      try {
        const buf = await generateImage(post.prompt, post.aspect);
        fs.writeFileSync(outputPath, buf);
        console.log(`  ✅ ${post.id}.png (${(buf.length/1024).toFixed(0)} KB)`);
        success++; break;
      } catch (err) {
        retries--;
        if (retries > 0) { console.log(`  ⚠️ ${err.message.substring(0,80)}. Retry in 5s (${retries})`); await delay(5000); }
        else { console.log(`  ❌ ${post.id}: ${err.message.substring(0,80)}`); errors.push(post.id); failed++; }
      }
    }
    if (i < posts.length - 1) await delay(2000);
  }

  console.log(`\n========================================`);
  console.log(`Done! ${success}/${posts.length} succeeded, ${failed} failed`);
  if (errors.length) console.log('Failed:', errors.join(', '));
  console.log(`========================================\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
