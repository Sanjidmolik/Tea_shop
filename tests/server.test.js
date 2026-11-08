// Unit tests for apps-script/Code.gs (run with: node tests/server.test.js)
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { createGas, ROOT } = require("./gas-mock");

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

const baseOrder = (over = {}) => ({
  action: "order",
  clientRequestId: `req-${Math.random().toString(36).slice(2, 12)}`,
  customer: { name: "Test Customer", phone: "01712345678", email: "", address: "House 1, Road 1, Test Area", notes: "" },
  area: "inside_dhaka",
  payment: "cod",
  items: [{ sku: "CB-ASSM-200", qty: 2 }],
  website: "",
  ...over
});

const readCatalog = () => {
  const text = fs.readFileSync(path.join(ROOT, "catalog.js"), "utf8");
  const m = /^window\.CHA_CATALOG\s*=/m.exec(text);
  return JSON.parse(text.slice(m.index + m[0].length, text.lastIndexOf(";")));
};
const catalogWith = (mutate) => {
  const c = readCatalog();
  mutate(c);
  return `window.CHA_CATALOG =\n${JSON.stringify(c, null, 2)}\n;`;
};

test("health check responds", () => {
  const g = createGas();
  assert.deepStrictEqual(g.get().ok, true);
});

test("valid order is saved with server-side totals (inside Dhaka ৳60)", () => {
  const g = createGas();
  g.context.setup();
  const r = g.post(baseOrder());
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  assert.match(r.orderId, /^CB-\d{6}-\d{4}$/);
  assert.strictEqual(r.subtotal, 760);
  assert.strictEqual(r.delivery, 60);
  assert.strictEqual(r.total, 820);
  const [row] = g.rows("Orders");
  assert.strictEqual(row[0], r.orderId);
  assert.strictEqual(row[2], "New");
  assert.strictEqual(row[4], "01712345678");
  assert.strictEqual(row[7], "Inside Dhaka");
  assert.match(row[9], /2 × Assam Breakfast Blend 200g @ ৳380 = ৳760/);
  assert.strictEqual(row[15], 820);
  assert.strictEqual(row[16], "Cash on delivery");
  const items = g.rows("Order Items");
  assert.deepStrictEqual(JSON.parse(JSON.stringify(items[0].slice(2))), ["CB-ASSM-200", "Assam Breakfast Blend", "200g", 2, 380, 760]);
});

test("outside Dhaka charges ৳120 and never free", () => {
  const g = createGas();
  const r = g.post(baseOrder({ area: "outside_dhaka", items: [{ sku: "CB-PREM-250", qty: 2 }] }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.delivery, 120);
  assert.strictEqual(r.total, 1900 + 120);
});

test("inside Dhaka is free from ৳1,500", () => {
  const g = createGas();
  const r = g.post(baseOrder({ items: [{ sku: "CB-PREM-250", qty: 2 }] }));
  assert.strictEqual(r.delivery, 0);
  assert.strictEqual(r.total, 1900);
});

test("client prices are ignored; mismatched expected total is refused", () => {
  const g = createGas();
  const r = g.post(baseOrder({ items: [{ sku: "CB-ASSM-200", qty: 1, price: 1 }], expectedTotal: 61 }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.error, "total_changed");
  assert.strictEqual(r.total, 440);
  assert.strictEqual(g.rows("Orders").length, 0);
});

test("matching expected total is accepted", () => {
  const g = createGas();
  assert.strictEqual(g.post(baseOrder({ expectedTotal: 820 })).ok, true);
});

test("duplicate submission returns the same order and writes once", () => {
  const g = createGas();
  const body = baseOrder();
  const a = g.post(body);
  const b = g.post(body);
  assert.strictEqual(a.orderId, b.orderId);
  assert.strictEqual(g.rows("Orders").length, 1);
});

test("order IDs are unique and sequential", () => {
  const g = createGas();
  const ids = [1, 2, 3].map((i) => g.post(baseOrder({ customer: { ...baseOrder().customer, phone: `0171234567${i}` } })).orderId);
  assert.strictEqual(new Set(ids).size, 3);
  assert.deepStrictEqual(ids.map((id) => id.slice(-4)), ["0001", "0002", "0003"]);
});

test("invalid phone numbers are rejected", () => {
  const g = createGas();
  for (const phone of ["12345", "01212345678", "0171234567", "abc"]) {
    const r = g.post(baseOrder({ customer: { ...baseOrder().customer, phone } }));
    assert.strictEqual(r.error, "invalid_phone", phone);
  }
  assert.strictEqual(g.post(baseOrder({ customer: { ...baseOrder().customer, phone: "+880 1712-345678" } })).ok, true);
});

test("missing name, address, area and payment are rejected", () => {
  const g = createGas();
  assert.strictEqual(g.post(baseOrder({ customer: { ...baseOrder().customer, name: " " } })).error, "invalid_name");
  assert.strictEqual(g.post(baseOrder({ customer: { ...baseOrder().customer, address: "x" } })).error, "invalid_address");
  assert.strictEqual(g.post(baseOrder({ area: "mars" })).error, "invalid_area");
  assert.strictEqual(g.post(baseOrder({ payment: "card" })).error, "invalid_payment");
  assert.strictEqual(g.post(baseOrder({ customer: { ...baseOrder().customer, email: "nope" } })).error, "invalid_email");
});

test("bad items are rejected (unknown SKU, unpriced size, bad quantities, empty)", () => {
  const g = createGas();
  assert.strictEqual(g.post(baseOrder({ items: [] })).error, "invalid_items");
  assert.strictEqual(g.post(baseOrder({ items: [{ sku: "NOPE", qty: 1 }] })).error, "invalid_items");
  assert.strictEqual(g.post(baseOrder({ items: [{ sku: "CB-CHAM-100", qty: 1 }] })).error, "invalid_items"); // price null
  assert.strictEqual(g.post(baseOrder({ items: [{ sku: "CB-ASSM-200", qty: 0 }] })).error, "invalid_items");
  assert.strictEqual(g.post(baseOrder({ items: [{ sku: "CB-ASSM-200", qty: 1.5 }] })).error, "invalid_items");
  assert.strictEqual(g.post(baseOrder({ items: [{ sku: "CB-ASSM-200", qty: 51 }] })).error, "invalid_items");
  assert.strictEqual(g.post(baseOrder({ items: [{ sku: "CB-ASSM-200", qty: 30 }, { sku: "CB-ASSM-200", qty: 30 }] })).error, "invalid_items");
});

test("duplicate SKUs are merged", () => {
  const g = createGas();
  const r = g.post(baseOrder({ items: [{ sku: "CB-ASSM-200", qty: 1 }, { sku: "CB-ASSM-200", qty: 1 }] }));
  assert.strictEqual(r.subtotal, 760);
  assert.strictEqual(g.rows("Order Items").length, 1);
});

test("sold-out and low-stock packs are enforced", () => {
  const g = createGas({ catalogText: catalogWith((c) => { c.products[0].variants[0].stock = 0; c.products[1].variants[0].stock = 2; }) });
  assert.strictEqual(g.post(baseOrder({ items: [{ sku: "CB-DARJ-100", qty: 1 }] })).error, "sold_out");
  const r = g.post(baseOrder({ items: [{ sku: "CB-ASSM-200", qty: 3 }] }));
  assert.strictEqual(r.error, "insufficient_stock");
  assert.strictEqual(r.available, 2);
});

test("variant prices come from the catalogue", () => {
  const g = createGas({ catalogText: catalogWith((c) => { c.products.find((p) => p.slug === "chamomile").variants[1].price = 900; }) });
  const r = g.post(baseOrder({ items: [{ sku: "CB-CHAM-100", qty: 1 }, { sku: "CB-CHAM-050", qty: 1 }] }));
  assert.strictEqual(r.subtotal, 1380);
});

test("sample listings cannot be ordered", () => {
  const g = createGas();
  const r = g.post(baseOrder({ items: [{ sku: "CB-S-EARL-100", qty: 1 }] }));
  assert.strictEqual(r.error, "sample_product");
  assert.strictEqual(r.sku, "CB-S-EARL-100");
  assert.strictEqual(g.rows("Orders").length, 0);
});

test("non-tea sizes use their label in the sheet", () => {
  const g = createGas({ catalogText: catalogWith((c) => { delete c.products.find((p) => p.slug === "glass-teapot").sample; }) });
  const r = g.post(baseOrder({ items: [{ sku: "CB-S-GPOT-600", qty: 1 }] }));
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  assert.match(g.rows("Orders")[0][9], /1 × Glass Teapot with Infuser 600 ml @ ৳1450/);
  assert.strictEqual(g.rows("Order Items")[0][4], "600 ml");
});

test("honeypot submissions are rejected and not saved", () => {
  const g = createGas();
  assert.strictEqual(g.post(baseOrder({ website: "http://spam" })).error, "rejected");
  assert.strictEqual(g.rows("Orders").length, 0);
});

test("rate limit per phone number", () => {
  const g = createGas();
  const results = [1, 2, 3, 4].map(() => g.post(baseOrder()).ok ? "ok" : "limited");
  assert.deepStrictEqual(results, ["ok", "ok", "ok", "limited"]);
});

test("malformed and oversized requests are rejected", () => {
  const g = createGas();
  assert.strictEqual(g.post("not json").error, "invalid_request");
  assert.strictEqual(g.post({ action: "nope" }).error, "invalid_request");
  assert.strictEqual(g.post("x".repeat(10001)).error, "invalid_request");
  assert.strictEqual(g.post(baseOrder({ clientRequestId: "short" })).error, "invalid_request");
});

test("spreadsheet formulas in customer text are neutralised", () => {
  const g = createGas();
  g.post(baseOrder({ customer: { ...baseOrder().customer, name: "=HYPERLINK(\"http://x\")", notes: "+cmd" } }));
  const [row] = g.rows("Orders");
  assert.ok(row[3].startsWith("'="));
  assert.ok(row[17].startsWith("'+"));
});

test("owner e-mail is sent only when OWNER_EMAIL is set", () => {
  const g = createGas();
  g.post(baseOrder());
  assert.strictEqual(g.mail.length, 0);
  g.props.set("OWNER_EMAIL", "owner@example.test");
  g.post(baseOrder({ customer: { ...baseOrder().customer, phone: "01812345678" } }));
  assert.strictEqual(g.mail.length, 1);
  assert.match(g.mail[0].subject, /New order CB-/);
});

test("catalogue failure does not create orders", () => {
  const g = createGas();
  g.setFetchStatus(500);
  assert.strictEqual(g.post(baseOrder()).error, "catalog_unavailable");
  assert.strictEqual(g.rows("Orders").length, 0);
});

test("catalogue is cached between requests", () => {
  const g = createGas();
  g.post(baseOrder());
  g.post(baseOrder({ customer: { ...baseOrder().customer, phone: "01812345678" } }));
  assert.strictEqual(g.fetches.length, 1);
});

test("no promo codes exist until the owner adds them", () => {
  const g = createGas();
  g.context.setup();
  assert.strictEqual(g.post({ action: "checkPromo", code: "ANY", items: [{ sku: "CB-ASSM-200", qty: 1 }] }).error, "invalid_promo");
});

test("promo codes from the Promos tab are applied server-side", () => {
  const g = createGas();
  g.context.setup();
  g.sheets.Promos.push(["TEST10", "percent", 10, 500, 100, true, "", "", "test"]);
  g.sheets.Promos.push(["OFF", "fixed", 50, 0, "", false, "", "", "inactive"]);
  const check = g.post({ action: "checkPromo", code: "test10", items: [{ sku: "CB-PREM-250", qty: 1 }] });
  assert.deepStrictEqual([check.ok, check.code, check.discount], [true, "TEST10", 95]);
  assert.strictEqual(g.post({ action: "checkPromo", code: "TEST10", items: [{ sku: "CB-MIXD-200", qty: 1 }] }).error, "promo_min_subtotal");
  assert.strictEqual(g.post({ action: "checkPromo", code: "OFF", items: [{ sku: "CB-MIXD-200", qty: 1 }] }).error, "invalid_promo");
  const r = g.post(baseOrder({ promoCode: "TEST10", items: [{ sku: "CB-PREM-250", qty: 2 }] }));
  assert.deepStrictEqual([r.subtotal, r.discount, r.delivery, r.total], [1900, 100, 0, 1800]); // capped at 100
});

test("contact messages are validated and saved", () => {
  const g = createGas();
  assert.strictEqual(g.post({ action: "contact", name: "A", reply: "x", message: "hi" }).ok, false);
  assert.strictEqual(g.post({ action: "contact", name: "Nadia", reply: "nadia@example.com", message: "Do you deliver to Sylhet?", website: "" }).ok, true);
  assert.strictEqual(g.post({ action: "contact", name: "Rafi", reply: "01712345678", message: "Bulk order?", website: "" }).ok, true);
  assert.strictEqual(g.post({ action: "contact", name: "Bot", reply: "a@b.cc", message: "spam", website: "x" }).error, "rejected");
  assert.strictEqual(g.rows("Messages").length, 2);
});

test("catalog.js is strict JSON after the assignment", () => {
  const c = readCatalog();
  assert.strictEqual(c.products.filter((p) => !p.sample).length, 8, "8 real products");
  const skus = c.products.flatMap((p) => p.variants.map((v) => v.sku));
  assert.strictEqual(new Set(skus).size, skus.length, "SKUs must be unique");
  const slugs = c.products.map((p) => p.slug);
  assert.strictEqual(new Set(slugs).size, slugs.length, "slugs must be unique");
  const catIds = new Set(c.categories.map((x) => x.id));
  const deptIds = new Set(c.departments.map((x) => x.id));
  c.products.forEach((p) => {
    assert.ok(deptIds.has(p.department), `${p.slug} department`);
    assert.ok(catIds.has(p.category), `${p.slug} category`);
    assert.strictEqual(c.categories.find((x) => x.id === p.category).department, p.department, `${p.slug} category/department`);
  });
  c.products.forEach((p) => p.variants.forEach((v) => {
    if (p.department === "tea") assert.ok(Number.isInteger(v.weightG) && v.weightG > 0, `${v.sku} weightG`);
    else assert.ok(v.label && v.label.en && v.label.bn, `${v.sku} label`);
    assert.ok(v.price === null || (typeof v.price === "number" && v.price > 0), `${v.sku} price`);
    assert.ok(v.stock === null || Number.isInteger(v.stock), `${v.sku} stock`);
  }));
  assert.deepStrictEqual(c.delivery.zones.map((z) => [z.id, z.fee]), [["inside_dhaka", 60], ["outside_dhaka", 120]]);
  (c.reviews || []).forEach((r) => assert.ok(r.name && r.text && r.rating >= 1 && r.rating <= 5));
});

(async () => {
  let failed = 0;
  for (const { name, fn } of tests) {
    try { await fn(); console.log(`  ✓ ${name}`); }
    catch (err) { failed++; console.log(`  ✗ ${name}\n    ${err.message}`); }
  }
  console.log(`\nServer tests: ${tests.length - failed} passed, ${failed} failed`);
  process.exitCode = failed ? 1 : 0;
})();
