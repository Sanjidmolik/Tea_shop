// End-to-end tests in a real browser (Playwright + Chromium), against the local mock server.
//   node tests/e2e.test.js
// Optional: CDN_MIRROR=/path/to/node_modules serves Bootstrap from a local copy when the
// network blocks cdn.jsdelivr.net (e.g. in a sandbox). Normal runs use the real CDN.
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { start } = require("./mock-server");

const PORT = 8791;
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
let BASE, SHOP, browser;

const TEST_CONFIG = {
  ORDER_ENDPOINT: `http://localhost:${PORT}/exec`,
  BUSINESS_PHONE: "8801700000000",
  WHATSAPP_NUMBER: "8801800000000",
  FACEBOOK_URL: "https://www.facebook.com/example-test-page",
  BUSINESS_EMAIL: "test@example.test",
  BKASH_NUMBER: "01900000000",
  NAGAD_NUMBER: "01600000000"
};

const configJs = (over) => {
  let src = fs.readFileSync(path.join(__dirname, "..", "config.js"), "utf8");
  for (const [k, v] of Object.entries(over)) src = src.replace(new RegExp(`${k}: ("[^"]*"|[^,\\n]+)`), `${k}: ${JSON.stringify(v)}`);
  return src;
};

const catalogJs = (mutate) => {
  const text = fs.readFileSync(path.join(__dirname, "..", "catalog.js"), "utf8");
  const m = /^window\.CHA_CATALOG\s*=/m.exec(text);
  const c = JSON.parse(text.slice(m.index + m[0].length, text.lastIndexOf(";")));
  mutate(c);
  return `window.CHA_CATALOG =\n${JSON.stringify(c)}\n;`;
};

async function newPage({ config = TEST_CONFIG, catalog, viewport = { width: 1280, height: 860 }, reducedMotion = "no-preference", storage } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion });
  const page = await context.newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/ERR_|Failed to load resource/.test(m.text())) page.errors.push(m.text()); });
  page.on("dialog", (d) => d.accept());
  if (process.env.CDN_MIRROR) {
    await page.route(/cdn\.jsdelivr\.net/, (r) => {
      const u = new URL(r.request().url());
      r.fulfill({ path: path.join(process.env.CDN_MIRROR, u.pathname.replace(/^\/npm\/([^@]+)@[^/]+/, "$1")) });
    });
  }
  await page.route(/images\.unsplash\.com|plausible\.io|googletagmanager/, (r) => r.abort());
  if (config) await page.route("**/config.js", (r) => r.fulfill({ contentType: "text/javascript", body: configJs(config) }));
  if (catalog) await page.route("**/catalog.js", (r) => r.fulfill({ contentType: "text/javascript", body: catalog }));
  if (storage) await page.addInitScript((s) => { if (!sessionStorage.getItem("seeded")) { Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, v)); sessionStorage.setItem("seeded", "1"); } }, storage);
  return page;
}

const mock = (p, body) => fetch(`${BASE}__mock/${p}`, { method: body === undefined ? "GET" : "POST", body: body === undefined ? undefined : JSON.stringify(body) }).then((r) => r.text());
const rows = async (sheet = "Orders") => JSON.parse(await mock(`rows?sheet=${encodeURIComponent(sheet)}`));
// Wait until a Bootstrap modal has finished opening (focus moved inside it)
const modalReady = (page, id) => page.waitForFunction((i) => { const m = document.getElementById(i); return m.classList.contains("show") && m.contains(document.activeElement); }, id);
const OPEN_CART = ".cart-btn";

async function addTwoTeasAndCheckout(page, area = "inside_dhaka") {
  await page.locator('.add-to-cart[data-sku="CB-ASSM-200"]').click();
  await page.locator('.add-to-cart[data-sku="CB-ASSM-200"]').click();
  await page.click(OPEN_CART);
  await page.waitForSelector("#cartOffcanvas.show");
  await page.click("#checkoutBtn");
  await modalReady(page, "checkoutModal");
  if (area) await page.check(`input[name="area"][value="${area}"]`);
}

async function fillCustomer(page, phone = "01712345678") {
  await page.fill("#custName", "Test Customer");
  await page.fill("#custPhone", phone);
  await page.fill("#custAddress", "House 1, Road 1, Test Area, Dhaka");
}

// ---------------------------------------------------------------------------

test("1. Homepage loads without errors", async () => {
  const page = await newPage();
  await page.goto(BASE);
  await page.waitForSelector("#featured-grid .tea");
  assert.ok(await page.isVisible("#category-tiles .cat-tile"));
  await page.goto(SHOP);
  await page.waitForSelector("#product-grid .tea");
  assert.strictEqual(await page.locator("#product-grid .tea:not(.is-sample)").count(), 8, "8 real teas");
  assert.deepStrictEqual(page.errors, []);
});

test("2. Product cards show grade, price, pack size and price per 100g; images have dimensions", async () => {
  const page = await newPage();
  await page.goto(SHOP);
  const card = page.locator('.tea[data-product="2"]');
  assert.match(await card.innerText(), /BOP/);
  assert.match(await card.locator(".tea-price").innerText(), /৳380[\s\S]*per 200g pack[\s\S]*৳190 per 100g/);
  const imgs = await page.$$eval("#product-grid img", (els) => els.map((i) => [i.getAttribute("width"), i.getAttribute("height"), i.alt, i.currentSrc || i.src]));
  imgs.forEach(([w, h, alt]) => { assert.ok(w && h, "width/height set"); assert.ok(alt.length > 5, "meaningful alt"); });
  assert.ok(imgs.filter(([, , , src]) => src.endsWith(".webp")).length >= 7, "WebP card images");
  const lazy = await page.$$eval("#product-grid img", (els) => els.filter((i) => i.loading === "lazy").length);
  assert.ok(lazy >= 4, "below-the-fold images are lazy");
  const broken = await page.$$eval("#product-grid img", (els) => els.filter((i) => i.complete && i.naturalWidth === 0).length);
  assert.strictEqual(broken, 0);
});

test("3. Product quick view opens with details and #tea/<slug> URL", async () => {
  const page = await newPage();
  await page.goto(SHOP);
  const listTitle = await page.title();
  await page.click('.tea[data-product="1"] .quick-view-btn');
  await page.waitForSelector("#teaModal.show");
  assert.strictEqual(new URL(page.url()).hash, "#tea/darjeeling");
  await modalReady(page, "teaModal");
  const text = await page.locator("#teaModal").textContent();
  for (const s of ["Darjeeling First Flush", "FTGFOP1", "Darjeeling, India", "Tasting notes", "Ingredients", "How to brew", "85°C", "৳650", "Add to cart"]) assert.ok(text.includes(s), s);
  assert.strictEqual(await page.title(), "Darjeeling First Flush | Cha Bazaar");
  await page.click('#teaModal [data-qv-qty="1"]');
  await page.click("#qv-add");
  assert.strictEqual(await page.textContent("#cart-count"), "2");
  await page.keyboard.press("Escape");
  await page.waitForSelector("#teaModal", { state: "hidden" });
  await page.waitForFunction(() => location.hash === "", null, { timeout: 3000 });
  assert.strictEqual(await page.title(), listTitle, "title restored");
});

test("4. Pack sizes update price, unit price, cart and checkout", async () => {
  const catalog = catalogJs((c) => { c.products.find((p) => p.slug === "chamomile").variants[1].price = 900; });
  const page = await newPage({ catalog });
  await page.goto(SHOP);
  const select = page.locator("#shop-size-7");
  assert.deepStrictEqual(await select.locator("option").allInnerTexts(), ["50g, ৳480", "100g, ৳900"], "unpriced 250g stays hidden");
  await select.selectOption("CB-CHAM-100");
  const price = await page.locator('.tea[data-product="7"] .tea-price').innerText();
  assert.match(price, /৳900[\s\S]*per 100g pack/);
  assert.ok(!/৳900 per 100g$/m.test(price), "no repeated unit price for a 100g pack");
  await page.click('.add-to-cart[data-sku="CB-CHAM-100"]');
  const cart = JSON.parse(await page.evaluate(() => localStorage.getItem("tea-shop-cart")));
  assert.deepStrictEqual(cart, [{ sku: "CB-CHAM-100", qty: 1 }]);
  await page.click(OPEN_CART);
  assert.match(await page.locator("#cart-items").innerText(), /Chamomile Calm[\s\S]*100g, ৳900 each/);
  await page.click("#checkoutBtn");
  await page.waitForSelector("#checkoutModal.show");
  assert.match(await page.locator("#checkout-summary").innerText(), /Chamomile Calm 100g × 1[\s\S]*৳900/);
});

test("5. Add to cart: count updates with one subtle confirmation (no toast, no flying image)", async () => {
  const page = await newPage();
  await page.goto(BASE);
  const btn = page.locator('.add-to-cart[data-sku="CB-DARJ-100"]');
  await btn.click();
  assert.strictEqual(await page.textContent("#cart-count"), "1");
  assert.match(await btn.innerText(), /Added/);
  assert.strictEqual(await page.locator(".toast.show").count(), 0);
  assert.strictEqual(await page.locator(".fly-img").count(), 0);
  await page.waitForTimeout(150);
  assert.match(await page.textContent("#sr-status"), /Added to cart: Darjeeling First Flush 100g/);
});

test("6. Cart quantities update and − at 1 removes", async () => {
  const page = await newPage();
  await page.goto(BASE);
  await page.click('.add-to-cart[data-sku="CB-DARJ-100"]');
  await page.click(OPEN_CART);
  await page.waitForSelector("#cartOffcanvas.show");
  await page.click('#cart-items .increase[data-sku="CB-DARJ-100"]');
  assert.strictEqual(await page.textContent("#cart-count"), "2");
  assert.strictEqual(await page.textContent("#cart-subtotal"), "৳1,300");
  await page.click('#cart-items .decrease[data-sku="CB-DARJ-100"]');
  await page.click('#cart-items .decrease[data-sku="CB-DARJ-100"]');
  assert.strictEqual(await page.textContent("#cart-count"), "0");
  assert.ok(await page.isDisabled("#checkoutBtn"));
});

test("7. Inside Dhaka delivery is ৳60", async () => {
  const page = await newPage();
  await page.goto(BASE);
  await addTwoTeasAndCheckout(page, "inside_dhaka");
  assert.strictEqual(await page.textContent("#summary-delivery"), "৳60");
  assert.strictEqual(await page.textContent("#summary-total"), "৳820");
  assert.match(await page.locator("#area-options").innerText(), /Inside Dhaka[\s\S]*৳60, 1–2 days/);
});

test("8. Outside Dhaka delivery is ৳120 and total updates immediately", async () => {
  const page = await newPage();
  await page.goto(BASE);
  await addTwoTeasAndCheckout(page, "inside_dhaka");
  await page.check('input[name="area"][value="outside_dhaka"]');
  assert.strictEqual(await page.textContent("#summary-delivery"), "৳120");
  assert.strictEqual(await page.textContent("#summary-total"), "৳880");
  assert.match(await page.locator("#area-options").innerText(), /Outside Dhaka[\s\S]*৳120, 3–5 days/);
});

test("9. Checkout validation, including delivery area", async () => {
  await mock("reset", {});
  const page = await newPage();
  await page.goto(BASE);
  await addTwoTeasAndCheckout(page, null);
  await page.click("#placeOrderBtn");
  assert.ok(await page.locator("#checkoutForm.was-validated").count());
  assert.strictEqual(await page.evaluate(() => document.activeElement.id), "custName");
  assert.ok(await page.locator("#areaGroup.is-invalid").count(), "area required");
  assert.strictEqual((await rows()).posts, 0, "nothing sent");
});

test("10. Invalid phone numbers are rejected in the browser", async () => {
  const page = await newPage();
  await page.goto(BASE);
  await addTwoTeasAndCheckout(page);
  await fillCustomer(page, "12345");
  await page.click("#placeOrderBtn");
  assert.strictEqual(await page.evaluate(() => document.activeElement.id), "custPhone");
  assert.ok(await page.isVisible("text=Enter an 11-digit number starting with 01."));
  await page.fill("#custPhone", "017 1234-5678");
  assert.strictEqual(await page.inputValue("#custPhone"), "01712345678");
});

test("11. Order is saved to the Sheet with all fields; confirmation shows the server order ID", async () => {
  await mock("reset", {});
  const page = await newPage();
  await page.goto(BASE);
  await addTwoTeasAndCheckout(page, "outside_dhaka");
  await fillCustomer(page);
  await page.check('input[name="payment"][value="bkash"]');
  await page.click("#placeOrderBtn");
  await page.waitForSelector("#confirmModal.show");
  const { rows: orders } = await rows();
  assert.strictEqual(orders.length, 1);
  const [id, date, status, name, phone, , address, area, eta, productsText, qty, subtotal, discount, , delivery, total, payment] = orders[0];
  assert.match(id, /^CB-\d{6}-0001$/);
  assert.match(date, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  assert.deepStrictEqual([status, name, phone, address, area, eta], ["New", "Test Customer", "01712345678", "House 1, Road 1, Test Area, Dhaka", "Outside Dhaka", "3–5 days"]);
  assert.match(productsText, /2 × Assam Breakfast Blend 200g @ ৳380 = ৳760/);
  assert.deepStrictEqual([qty, subtotal, discount, delivery, total, payment], [2, 760, 0, 120, 880, "bKash (manual)"]);
  const items = (await rows("Order Items")).rows;
  assert.deepStrictEqual(items[0].slice(2), ["CB-ASSM-200", "Assam Breakfast Blend", "200g", 2, 380, 760]);
  assert.strictEqual(await page.textContent("#confirm-order-id"), id);
  assert.match(await page.textContent("#confirm-message"), /01712345678[\s\S]*3–5 days[\s\S]*৳880/);
  assert.match(await page.locator("#confirm-payment").innerText(), /bKash[\s\S]*01900-000000[\s\S]*৳880[\s\S]*CB-/);
  assert.strictEqual(await page.textContent("#cart-count"), "0");
  const history = JSON.parse(await page.evaluate(() => localStorage.getItem("tea-shop-orders")));
  assert.strictEqual(history[0].id, id);
  assert.ok(!JSON.stringify(history).includes("Test Customer"), "no personal data in local history");
});

test("12. Repeated clicks create exactly one order", async () => {
  await mock("reset", {});
  await mock("mode", { delayMs: 800 });
  const page = await newPage();
  await page.goto(BASE);
  await addTwoTeasAndCheckout(page);
  await fillCustomer(page);
  await page.click("#placeOrderBtn");
  assert.ok(await page.isDisabled("#placeOrderBtn"), "button disabled while sending");
  assert.match(await page.textContent("#placeOrderBtn"), /Placing order/);
  await page.locator("#placeOrderBtn").click({ force: true, trial: false }).catch(() => {});
  await page.evaluate(() => document.getElementById("checkoutForm").requestSubmit());
  await page.waitForSelector("#confirmModal.show");
  const r = await rows();
  assert.strictEqual(r.rows.length, 1);
  assert.strictEqual(r.posts, 1, "only one request sent");
  await mock("mode", {});
});

test("13. No confirmation unless the server confirms (server error, network drop, endpoint not set)", async () => {
  await mock("reset", {});
  for (const fail of ["500", "drop"]) {
    await mock("mode", { fail });
    const page = await newPage();
    await page.goto(BASE);
    await addTwoTeasAndCheckout(page);
    await fillCustomer(page);
    await page.click("#placeOrderBtn");
    await page.waitForSelector("#checkout-error:not([hidden])");
    assert.match(await page.textContent("#checkout-error"), /couldn't confirm your order/);
    assert.ok(await page.isVisible("#checkout-error >> text=Order on WhatsApp"));
    assert.strictEqual(await page.locator("#confirmModal.show").count(), 0);
    assert.strictEqual(await page.textContent("#cart-count"), "2", "cart kept");
    await page.context().close();
  }
  await mock("mode", {});
  const page = await newPage({ config: { ...TEST_CONFIG, ORDER_ENDPOINT: "YOUR_APPS_SCRIPT_URL" } });
  await page.goto(BASE);
  await addTwoTeasAndCheckout(page);
  await fillCustomer(page);
  await page.click("#placeOrderBtn");
  assert.match(await page.textContent("#checkout-error"), /isn't switched on yet/);
  assert.strictEqual(await page.locator("#confirmModal.show").count(), 0);
  assert.strictEqual((await rows()).rows.length, 0);
});

test("13b. Server-side rejections are shown (sold out after page load, changed total)", async () => {
  await mock("reset", {});
  const page = await newPage();
  // Browser thinks Assam costs ৳300; the server (real catalogue) says ৳380
  await page.route("**/catalog.js", (r) => r.fulfill({ contentType: "text/javascript", body: catalogJs((c) => { c.products[1].variants[0].price = 300; }) }));
  await page.goto(BASE);
  await addTwoTeasAndCheckout(page);
  await fillCustomer(page);
  await page.click("#placeOrderBtn");
  await page.waitForSelector("#checkout-error:not([hidden])");
  assert.match(await page.textContent("#checkout-error"), /new total is ৳820/);
  assert.strictEqual((await rows()).rows.length, 0);
});

test("14. WhatsApp links carry the right number and message", async () => {
  await mock("reset", {});
  const page = await newPage();
  await page.goto(BASE);
  assert.ok(await page.isVisible("#waFloat"));
  await page.click('.add-to-cart[data-sku="CB-MSLA-200"]');
  await page.evaluate(() => document.getElementById("waFloat").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })) );
  const href = await page.getAttribute("#waFloat", "href");
  assert.ok(href.startsWith("https://wa.me/8801800000000?text="));
  assert.match(decodeURIComponent(href), /1 × Masala Chai \(200g\)/);
  assert.strictEqual(await page.getAttribute('#contact [data-link="phone"]', "href"), "tel:+8801700000000");
  assert.strictEqual(await page.textContent('#contact [data-link="phone"]'), "01700-000000");
  await page.click(OPEN_CART);
  await page.click("#checkoutBtn");
  await page.check('input[name="area"][value="inside_dhaka"]');
  await fillCustomer(page);
  await page.click("#placeOrderBtn");
  await page.waitForSelector("#confirmModal.show");
  const ask = decodeURIComponent(await page.getAttribute("#confirm-whatsapp", "href"));
  assert.match(ask, /^https:\/\/wa\.me\/8801800000000\?text=.*order CB-\d{6}-\d{4}/);
});

test("14b. Unset contact details are hidden, never shown as placeholders", async () => {
  const page = await newPage({ config: {} });
  await page.goto(BASE);
  assert.ok(await page.isHidden("#waFloat"));
  assert.ok(await page.isHidden('#contact [data-contact="phone"]'));
  assert.ok(!(await page.content()).includes(">YOUR_"));
  assert.ok(await page.isVisible(".setup-bar"), "setup notice on localhost");
});

test("15. Payment methods: Cash on delivery, bKash, Nagad with manual instructions", async () => {
  const page = await newPage();
  await page.goto(BASE);
  await addTwoTeasAndCheckout(page);
  const labels = await page.locator("#paymentGroup .choice-title").allInnerTexts();
  assert.deepStrictEqual(labels.map((s) => s.trim()), ["Cash on delivery", "bKash", "Nagad"]);
  assert.ok(await page.isHidden("#pay-instructions"));
  await page.check('input[name="payment"][value="nagad"]');
  const text = await page.locator("#pay-instructions").innerText();
  assert.match(text, /How to pay with Nagad[\s\S]*01600-000000[\s\S]*order ID[\s\S]*never ask for your PIN/);
  assert.ok(!/online payment is active|pay online now/i.test(text));
});

test("16. Mobile layout: no horizontal scroll; floating WhatsApp clear of checkout", async () => {
  const page = await newPage({ viewport: { width: 360, height: 780 } });
  await page.goto(BASE);
  assert.strictEqual(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  const box = await page.locator("#waFloat").boundingBox();
  assert.ok(box.width >= 44 && box.height >= 44, "touch target ≥ 44px");
  await addTwoTeasAndCheckout(page);
  assert.strictEqual(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
});

test("17. Keyboard: open quick view with Enter, close with Escape, focus returns", async () => {
  const page = await newPage();
  await page.goto(BASE);
  await page.goto(SHOP);
  await page.focus('.tea[data-product="2"] .quick-view-btn');
  await page.keyboard.press("Enter");
  await modalReady(page, "teaModal");
  await page.keyboard.press("Escape");
  await page.waitForSelector("#teaModal", { state: "hidden" });
  await page.waitForFunction(() => document.activeElement.className === "quick-view-btn", null, { timeout: 3000 });
  await page.focus("#checkoutBtn").catch(() => {});
  // Every button and link has an accessible name
  const unnamed = await page.$$eval("button, a[href]", (els) => els.filter((e) => e.offsetParent !== null && !e.closest("[aria-hidden=true]") && !(e.getAttribute("aria-label") || e.textContent.trim())).map((e) => e.outerHTML.slice(0, 80)));
  assert.deepStrictEqual(unnamed, []);
});

test("18. Motion: pause control works; reduced motion disables animation", async () => {
  let page = await newPage();
  await page.goto(BASE);
  await page.waitForSelector(".motion-toggle");
  await page.click(".motion-toggle");
  assert.ok(await page.evaluate(() => document.documentElement.classList.contains("motion-paused")));
  const state = await page.$eval(".leaf", (el) => getComputedStyle(el).animationPlayState);
  assert.strictEqual(state, "paused");
  assert.strictEqual(await page.getAttribute(".motion-toggle", "aria-pressed"), "true");
  await page.reload();
  assert.ok(await page.evaluate(() => document.documentElement.classList.contains("motion-paused")), "remembered");
  await page.context().close();
  page = await newPage({ reducedMotion: "reduce" });
  await page.goto(BASE);
  assert.strictEqual(await page.evaluate(() => document.documentElement.classList.contains("motion")), false);
  assert.strictEqual(await page.locator(".leaf, .motion-toggle").count(), 0);
});

test("19. Shareable product URLs: direct link, back/forward, invalid slug, copy link", async () => {
  const page = await newPage();
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(`${BASE}#tea/assam`);
  await modalReady(page, "teaModal");
  assert.strictEqual(await page.textContent("#teaModalTitle"), "Assam Breakfast Blend");
  await page.click("#qv-share");
  assert.match(await page.textContent("#qv-share"), /Link copied/);
  assert.strictEqual(await page.evaluate(() => navigator.clipboard.readText()), `${BASE}index.html?product=assam`);
  await page.click('#teaModal .btn-close');
  await page.waitForSelector("#teaModal", { state: "hidden" });
  // Back / forward
  await page.click('#featured-grid .tea[data-product="1"] .quick-view-btn');
  await modalReady(page, "teaModal");
  await page.goBack();
  await page.waitForSelector("#teaModal", { state: "hidden" });
  await page.goForward();
  await page.waitForSelector("#teaModal.show");
  assert.strictEqual(await page.textContent("#teaModalTitle"), "Darjeeling First Flush");
  // Invalid
  await page.goto(`${BASE}#tea/not-a-tea`);
  await page.waitForSelector(".toast.show");
  assert.match(await page.textContent("#appToastBody"), /couldn't find that tea/);
  assert.strictEqual(new URL(page.url()).hash, "");
  // Existing section links still work
  await page.click('a.nav-link[href="index.html#contact"]');
  assert.strictEqual(new URL(page.url()).hash, "#contact");
  assert.strictEqual(await page.locator("#teaModal.show").count(), 0);
});

test("20. SEO metadata and honest structured data", async () => {
  const page = await newPage();
  await page.goto(BASE);
  const meta = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content,
    canonical: document.querySelector('link[rel="canonical"]')?.href,
    og: ["og:title", "og:description", "og:image", "og:url"].map((p) => document.querySelector(`meta[property="${p}"]`)?.content),
    twitter: document.querySelector('meta[name="twitter:card"]')?.content,
    ld: JSON.parse(document.getElementById("structured-data").textContent)
  }));
  assert.match(meta.title, /Cha Bazaar/);
  assert.ok(meta.description.length > 50);
  assert.strictEqual(meta.canonical, "https://sanjidmolik.github.io/Tea_shop/");
  meta.og.forEach((v) => assert.ok(v));
  assert.strictEqual(meta.twitter, "summary_large_image");
  const productsLd = meta.ld["@graph"].filter((n) => n["@type"] === "Product");
  assert.strictEqual(productsLd.length, 8, "one per priced pack size");
  productsLd.forEach((p) => {
    assert.strictEqual(p.offers.priceCurrency, "BDT");
    assert.ok(p.sku && p.image && p.description);
    assert.ok(!("availability" in p.offers), "no availability claimed without stock data");
    assert.ok(!("aggregateRating" in p) && !("review" in p), "no ratings");
  });
  for (const f of ["robots.txt", "sitemap.xml", "og-image.jpg"]) assert.strictEqual((await page.request.get(BASE + f)).status(), 200, f);
  for (const f of ["delivery.html", "returns.html", "privacy.html", "terms.html"]) {
    const r = await page.request.get(BASE + f);
    assert.strictEqual(r.status(), 200, f);
    assert.match(await r.text(), /<link rel="canonical" href="https:\/\/sanjidmolik\.github\.io\/Tea_shop\//);
  }
});

test("21. Bangla language toggle translates UI and keeps ৳ and product names", async () => {
  const page = await newPage();
  await page.goto(BASE);
  await page.click("[data-lang-toggle]");
  assert.strictEqual(await page.getAttribute("html", "lang"), "bn");
  assert.strictEqual(await page.textContent('a.nav-link[data-i18n="nav.tea"]'), "চা");
  assert.match(await page.textContent(".add-to-cart >> nth=0"), /কার্টে যোগ করুন/);
  assert.match(await page.textContent('.tea[data-product="1"] .tea-name'), /Darjeeling First Flush/);
  assert.match(await page.textContent('.tea[data-product="1"] .tea-price'), /৳650/);
  await addTwoTeasAndCheckout(page);
  assert.match(await page.locator("#area-options").innerText(), /ঢাকার ভেতরে[\s\S]*৳60, ১–২ দিন/);
  await page.reload();
  assert.strictEqual(await page.getAttribute("html", "lang"), "bn", "remembered");
  await page.click("[data-lang-toggle]");
  assert.strictEqual(await page.textContent('a.nav-link[data-i18n="nav.tea"]'), "Tea");
  assert.deepStrictEqual(page.errors, []);
});

test("22. Policy pages render in both languages with live delivery data", async () => {
  const page = await newPage();
  await page.goto(`${BASE}delivery.html`);
  const table = await page.locator('[data-lang-block="en"] [data-fill-table="delivery"]').innerText();
  assert.match(table, /Inside Dhaka\s+৳60[\s\S]*1–2 days[\s\S]*Outside Dhaka\s+৳120[\s\S]*3–5 days/);
  await page.click("[data-lang-toggle]");
  assert.ok(await page.isVisible('[data-lang-block="bn"] >> text=আমরা কোথায় ডেলিভারি দিই'));
  assert.ok(await page.isHidden('[data-lang-block="en"].policy-body'));
  await page.click("[data-lang-toggle]");
  await page.goto(`${BASE}returns.html`);
  assert.ok(await page.isVisible("text=Not fresh? We replace it."));
  assert.deepStrictEqual(page.errors, []);
});

test("23. Contact form sends to the server, or offers alternatives when not set up", async () => {
  await mock("reset", {});
  let page = await newPage();
  await page.goto(BASE);
  await page.fill("#contactName", "Nadia");
  await page.fill("#contactEmail", "not-an-email");
  await page.fill("#contactMessage", "Do you deliver to Sylhet?");
  await page.click('#contactForm button[type="submit"]');
  assert.strictEqual(await page.evaluate(() => document.activeElement.id), "contactEmail");
  await page.fill("#contactEmail", "01712345678");
  await page.click('#contactForm button[type="submit"]');
  await page.waitForSelector("#contact-status.is-ok");
  assert.strictEqual((await rows("Messages")).rows.length, 1);
  await page.context().close();
  page = await newPage({ config: { ...TEST_CONFIG, ORDER_ENDPOINT: "YOUR_APPS_SCRIPT_URL" } });
  await page.goto(BASE);
  await page.fill("#contactName", "Nadia");
  await page.fill("#contactEmail", "nadia@example.com");
  await page.fill("#contactMessage", "Hello");
  await page.click('#contactForm button[type="submit"]');
  assert.match(await page.textContent("#contact-status"), /can't be sent from the website yet/);
  assert.ok(!(await page.locator("#contact-status.is-ok").count()));
});

test("24. Remember details (opt-in), reorder, and migration of old carts and orders", async () => {
  await mock("reset", {});
  const oldCart = JSON.stringify([{ id: 2, qty: 1 }, { id: 99, qty: 1 }]);
  const oldOrders = JSON.stringify([{ id: "CB-OLD", createdAt: "2026-01-01T00:00:00Z", customer: { name: "X", phone: "01700000000" }, items: [{ id: 1, name: "Darjeeling", price: 650, qty: 1 }], total: 710 }]);
  const page = await newPage({ storage: { "tea-shop-cart": oldCart, "tea-shop-orders": oldOrders } });
  await page.goto(BASE);
  assert.strictEqual(await page.textContent("#cart-count"), "1", "old cart migrated, unknown item dropped");
  const migrated = await page.evaluate(() => [localStorage.getItem("tea-shop-cart"), localStorage.getItem("tea-shop-orders")]);
  assert.deepStrictEqual(JSON.parse(migrated[0]), [{ sku: "CB-ASSM-200", qty: 1 }]);
  assert.ok(!migrated[1].includes("01700000000"), "personal data stripped from old local orders");
  await page.click(OPEN_CART);
  await page.click("#checkoutBtn");
  await page.check('input[name="area"][value="inside_dhaka"]');
  await fillCustomer(page);
  await page.check("#rememberMe");
  await page.click("#placeOrderBtn");
  await modalReady(page, "confirmModal");
  await page.click('#confirmModal [data-bs-dismiss="modal"]');
  await page.waitForSelector("#confirmModal", { state: "hidden" });
  // Reorder from history
  await page.click(OPEN_CART);
  await page.waitForSelector("#recent-orders:not([hidden])");
  await page.click("[data-reorder]");
  assert.strictEqual(await page.textContent("#cart-count"), "1");
  // Saved details prefill, and can be forgotten
  await page.click("#checkoutBtn");
  await page.waitForSelector("#checkoutModal.show");
  assert.strictEqual(await page.inputValue("#custName"), "Test Customer");
  assert.ok(await page.isChecked('input[name="area"][value="inside_dhaka"]'));
  await page.click("#forgetMe");
  assert.strictEqual(await page.evaluate(() => localStorage.getItem("tea-shop-customer")), null);
});

test("25. Sold-out and low-stock labels, sampler section and reviews only from real data", async () => {
  const catalog = catalogJs((c) => {
    c.products[0].variants[0].stock = 0;
    c.products[1].variants[0].stock = 3;
    c.reviews = [{ name: "Real Customer", rating: 4, text: "Genuine review text.", date: "2026-10-01" }];
  });
  const page = await newPage({ catalog });
  await page.goto(SHOP);
  assert.ok(await page.isDisabled('.add-to-cart[data-sku="CB-DARJ-100"]'));
  assert.match(await page.textContent('.tea[data-product="1"] .stock-badge'), /Sold out/);
  assert.match(await page.textContent('.tea[data-product="2"] .stock-badge'), /Only 3 left/);
  await page.goto(BASE);
  assert.match(await page.textContent("#reviews-summary"), /4\.0 out of 5 from 1 reviews/);
  assert.strictEqual(await page.locator(".review.is-sample").count(), 0);
  const ld = await page.evaluate(() => JSON.parse(document.getElementById("structured-data").textContent));
  const darj = ld["@graph"].find((n) => n.sku === "CB-DARJ-100");
  assert.strictEqual(darj.offers.availability, "https://schema.org/OutOfStock");
  assert.ok(!ld["@graph"].some((n) => n.aggregateRating), "reviews never added to structured data");
});

test("26. Sample reviews are labelled and appear only in development", async () => {
  const page = await newPage();
  await page.goto(BASE);
  assert.strictEqual(await page.locator(".review.is-sample").count(), 2);
  assert.match(await page.textContent("#reviews"), /Sample, not a real review/);
  const live = await newPage({ config: { ...TEST_CONFIG, SHOW_SAMPLE_REVIEWS_IN_DEV: false } });
  await live.goto(BASE);
  assert.ok(await live.isHidden("#reviews"));
});


test("27. Mega menu and category pages (Adagio-style organisation)", async () => {
  const page = await newPage();
  await page.goto(BASE);
  await page.click('a.nav-link[data-i18n="nav.tea"]');
  const menu = page.locator('.mega-menu[data-mega="tea"]');
  await menu.waitFor();
  const text = await menu.innerText();
  for (const s of ["Shop by type", "Black tea", "Oolong", "Origin", "Sylhet, Bangladesh", "Caffeine", "Caffeine-free", "Flavour", "Floral"]) assert.ok(text.includes(s), s);
  await menu.locator("a", { hasText: "Black tea" }).first().click();
  await page.waitForSelector('[data-view="shop"]:not([hidden])');
  assert.match(page.url(), /\?shop=black-tea$/);
  assert.strictEqual(await page.title(), "Black tea | Cha Bazaar");
  assert.match(await page.locator("#shop-crumbs").innerText(), /Home[\s\S]*Tea[\s\S]*Black tea/);
  assert.strictEqual(await page.locator("#product-grid .tea").count(), 6);
  assert.strictEqual(await page.getAttribute('[data-category="black-tea"]', "aria-pressed"), "true");
  // Category chip -> sibling category; back returns
  await page.click('[data-category="herbal"]');
  await page.waitForFunction(() => location.search === "?shop=herbal");
  assert.strictEqual(await page.textContent("#shopTitle"), "Herbal and caffeine-free");
  await page.goBack();
  await page.waitForFunction(() => location.search === "?shop=black-tea");
  assert.strictEqual(await page.textContent("#shopTitle"), "Black tea");
  // Teaware and gifts departments
  await page.goto(`${BASE}?shop=teaware`);
  assert.strictEqual(await page.locator("#product-grid .tea").count(), 5);
  await page.goto(`${BASE}?shop=gifts`);
  assert.strictEqual(await page.locator("#product-grid .tea").count(), 3);
  // Unknown category falls back to all products
  await page.goto(`${BASE}?shop=nope`);
  await page.waitForFunction(() => location.search === "?shop=all");
  assert.deepStrictEqual(page.errors, []);
});

test("28. Filters: caffeine, origin, flavour, price, search; URL keeps state; clear", async () => {
  const page = await newPage();
  await page.goto(`${SHOP}&caffeine=none`);
  assert.strictEqual(await page.textContent("#result-count"), "3 products");
  assert.ok(await page.isChecked("#f-caffeine-none"));
  await page.uncheck("#f-caffeine-none");
  await page.check("#f-origin-sylhet");
  assert.match(page.url(), /origin=sylhet/);
  assert.doesNotMatch(page.url(), /caffeine=/);
  const names = await page.locator("#product-grid .tea-name").allInnerTexts();
  assert.ok(names.includes("Masala Chai") && !names.includes("Assam Breakfast Blend"));
  await page.check("#f-flavour-malty");
  await page.check("#f-price-under-400");
  assert.deepStrictEqual((await page.locator("#product-grid .tea-name").allInnerTexts()).sort(), ["Everyday Mixed Tea"]);
  await page.click("#clearFilters");
  assert.strictEqual(await page.locator("#product-grid .tea").count(), 15);
  await page.fill("#searchInput", "jasmine");
  assert.match(page.url(), /q=jasmine/);
  assert.strictEqual(await page.locator("#product-grid .tea").count(), 1);
  await page.fill("#searchInput", "zzz");
  await page.click("#resetFilters");
  assert.strictEqual(await page.locator("#product-grid .tea").count(), 15);
  // Mobile: filters live in a drawer
  const m = await newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(SHOP);
  assert.ok(await m.isHidden("#filter-groups"));
  await m.click('[data-bs-toggle="offcanvas"][data-bs-target="#shop-filters"]');
  await m.waitForSelector("#shop-filters.show");
  await m.check("#f-caffeine-none");
  assert.strictEqual(await m.textContent("#result-count"), "3 products");
  assert.strictEqual(await m.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
});

test("29. Product pages: details, sizes, add to cart, related, SEO, not found", async () => {
  const page = await newPage();
  await page.goto(SHOP);
  await page.click('.tea[data-product="1"] .tea-link');
  await page.waitForSelector('[data-view="product"]:not([hidden]) .pp-title');
  assert.match(page.url(), /\?product=darjeeling$/);
  assert.strictEqual(await page.textContent(".pp-title"), "Darjeeling First Flush");
  assert.strictEqual(await page.title(), "Darjeeling First Flush | Cha Bazaar");
  assert.match(await page.getAttribute('link[rel="canonical"]', "href"), /\?product=darjeeling$/);
  assert.match(await page.locator("#product-crumbs").innerText(), /Home[\s\S]*Tea[\s\S]*Black tea[\s\S]*Darjeeling First Flush/);
  const about = await page.locator(".pp-more").innerText();
  for (const s of ["Tasting notes", "Ingredients", "How to brew", "Caffeine", "Medium", "No reviews yet."]) assert.ok(about.includes(s), s);
  assert.ok(await page.locator(".pp-related .tea").count() >= 3);
  await page.click('[data-pp-qty="1"]');
  await page.click("#pp-add");
  assert.strictEqual(await page.textContent("#cart-count"), "2");
  await page.goBack();
  await page.waitForSelector('[data-view="shop"]:not([hidden])');
  await page.goto(`${BASE}?product=no-such-tea`);
  assert.match(await page.textContent("#product-page"), /couldn't find that product/);
  assert.deepStrictEqual(page.errors, []);
});

test("30. Sample listings are clearly marked and can never be bought", async () => {
  await mock("reset", {});
  const page = await newPage({ storage: { "tea-shop-cart": JSON.stringify([{ sku: "CB-S-EARL-100", qty: 1 }, { sku: "CB-ASSM-200", qty: 1 }]) } });
  await page.goto(BASE);
  assert.strictEqual(await page.textContent("#cart-count"), "1", "sample item ignored in cart");
  const gift = page.locator("#gift-grid .tea").first();
  assert.match(await gift.innerText(), /Sample listing[\s\S]*Coming soon/);
  assert.ok(await gift.locator(".add-to-cart").isDisabled());
  assert.ok(await gift.locator(".img-placeholder").isVisible());
  await page.goto(`${BASE}?product=glass-teapot`);
  assert.match(await page.textContent("#product-page"), /sample listing/i);
  assert.ok(await page.isDisabled("#pp-add"));
  assert.match(await page.locator(".qv-sizes legend").innerText(), /^Size$/);
  const ld = await page.evaluate(() => JSON.parse(document.getElementById("structured-data").textContent));
  assert.ok(!ld["@graph"].some((n) => /^CB-S-/.test(n.sku || "")), "samples not in structured data");
});

// ---------------------------------------------------------------------------
(async () => {
  const srv = await start(PORT);
  BASE = srv.url;
  SHOP = `${BASE}?shop=tea`;
  browser = await chromium.launch();
  const only = process.argv[2];
  let failed = 0, ran = 0;
  for (const { name, fn } of tests) {
    if (only && !name.startsWith(only)) continue;
    ran++;
    try { await fn(); console.log(`  ✓ ${name}`); }
    catch (err) { failed++; console.log(`  ✗ ${name}\n    ${String(err.message).split("\n").slice(0, 14).join("\n    ")}`); }
    finally { for (const c of browser.contexts()) await c.close(); }
  }
  await browser.close();
  srv.server.close();
  console.log(`\nEnd-to-end tests: ${ran - failed} passed, ${failed} failed`);
  process.exitCode = failed ? 1 : 0;
})();
