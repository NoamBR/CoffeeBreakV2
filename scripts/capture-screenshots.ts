/**
 * App Store Screenshot Capture Script
 *
 * Generates screenshots for both required iPhone sizes:
 *   - 6.7" (1284x2778) — iPhone 14 Pro Max
 *   - 6.5" (1242x2688) — iPhone 11 Pro Max
 *
 * Usage:
 *   npx playwright install chromium   # first time only
 *   npx tsx scripts/capture-screenshots.ts
 *
 * Output:
 *   expo/assets/screenshots/output/6.7/ss1.png ... ss6.png
 *   expo/assets/screenshots/output/6.5/ss1.png ... ss6.png
 */

import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const TEMPLATE = path.resolve(
  __dirname,
  "../expo/assets/screenshots/appstore-final.html"
);
const OUTPUT_BASE = path.resolve(
  __dirname,
  "../expo/assets/screenshots/output"
);

const SCREENSHOT_IDS = ["ss1", "ss2", "ss3", "ss4", "ss5", "ss6"];

const SIZES = [
  { name: "6.7", width: 1284, height: 2778 },
  { name: "6.5", width: 1242, height: 2688 },
];

async function main() {
  const browser = await chromium.launch();

  for (const size of SIZES) {
    const outputDir = path.join(OUTPUT_BASE, size.name);
    fs.mkdirSync(outputDir, { recursive: true });

    console.log(`\nCapturing ${size.name}" (${size.width}x${size.height})...`);

    for (const id of SCREENSHOT_IDS) {
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
        deviceScaleFactor: 1,
      });

      const page = await context.newPage();
      await page.goto(`file://${TEMPLATE}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);

      // Isolate the target screenshot at full size
      await page.evaluate(
        ({ targetId, w, h }) => {
          document.querySelectorAll(".ss").forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (el.id === targetId) {
              htmlEl.style.transform = "none";
              htmlEl.style.marginRight = "0";
              htmlEl.style.marginBottom = "0";
              htmlEl.style.flexShrink = "0";
              htmlEl.style.width = w + "px";
              htmlEl.style.height = h + "px";
            } else {
              htmlEl.style.display = "none";
            }
          });
          document.body.style.gap = "0";
          document.body.style.padding = "0";
          document.body.style.overflow = "hidden";
        },
        { targetId: id, w: size.width, h: size.height }
      );

      const outputPath = path.join(outputDir, `${id}.png`);

      await page.screenshot({
        path: outputPath,
        type: "png",
        clip: { x: 0, y: 0, width: size.width, height: size.height },
      });

      console.log(`  ${id} → ${outputPath}`);
      await context.close();
    }
  }

  await browser.close();
  console.log(`\nDone! Screenshots saved to ${OUTPUT_BASE}`);
}

main().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
