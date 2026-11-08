// Renders tools/og-image.html to og-image.jpg (1200x630) for social sharing previews.
// Usage: node tools/render-og-image.js   (needs Playwright: npm install)
const path = require("path");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: "reduce" });
  await page.goto(`file://${path.join(__dirname, "og-image.html")}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(__dirname, "..", "og-image.jpg"), type: "jpeg", quality: 85 });
  await browser.close();
  console.log("Wrote og-image.jpg");
})();
