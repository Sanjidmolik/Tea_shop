/**
 * Cha Bazaar order server — Google Apps Script web app bound to the "Cha Bazaar Orders" Google Sheet.
 *
 * What it does
 *   POST { action: "order" }      validate, re-price from the live catalog.js, save to "Orders" + "Order Items"
 *   POST { action: "checkPromo" } preview a promo code from the "Promos" tab (server decides the discount)
 *   POST { action: "contact" }    save a website message to "Messages"
 *   GET                           health check: { ok: true, service, version }
 *
 * Security
 *   - Never trusts prices, totals or delivery fees from the browser: everything is recalculated from
 *     catalog.js downloaded from CATALOG_URL (the same file the website uses).
 *   - Validates every field; rejects honeypot submissions; rate-limits per phone and globally;
 *     ignores duplicate submissions (same clientRequestId) for 6 hours; locks while writing.
 *   - Neutralises spreadsheet formulas in customer text (=, +, -, @ prefixes).
 *   - No secrets are needed in the website. Script properties hold the settings below.
 *
 * Script properties (Project Settings → Script properties)
 *   CATALOG_URL   required  e.g. https://sanjidmolik.github.io/Tea_shop/catalog.js
 *   OWNER_EMAIL   optional  e-mail address that receives a message for every order and website message
 *
 * Deployment: see apps-script/README.md. Run setup() once before deploying.
 */

const VERSION = "1.0.0";
const TZ = "Asia/Dhaka";

const SHEET = { orders: "Orders", items: "Order Items", messages: "Messages", promos: "Promos" };

const HEADERS = {
  orders: ["Order ID", "Order date", "Status", "Customer name", "Phone", "Email", "Delivery address",
    "Delivery area", "Delivery estimate", "Products", "Total quantity", "Subtotal (BDT)", "Discount (BDT)",
    "Promo code", "Delivery charge (BDT)", "Total (BDT)", "Payment method", "Customer note", "Language", "Request ID"],
  items: ["Order ID", "Order date", "SKU", "Product", "Pack size (g)", "Quantity", "Unit price (BDT)", "Line total (BDT)"],
  messages: ["Received", "Status", "Name", "Email or phone", "Message", "Language"],
  promos: ["Code", "Type (percent or fixed)", "Value", "Minimum subtotal (BDT)", "Maximum discount (BDT)",
    "Active (TRUE/FALSE)", "Starts (optional date)", "Ends (optional date)", "Note"]
};

const LIMITS = {
  maxBodyChars: 10000,
  maxLines: 30,
  maxQty: 50,
  ordersPerPhone: 3,       // per 10 minutes
  messagesPerSender: 3,    // per 10 minutes
  requestsGlobal: 120,     // per 10 minutes, all actions
  windowSeconds: 600,
  dedupeSeconds: 21600     // 6 hours (CacheService maximum)
};

const PAYMENT_LABELS = { cod: "Cash on delivery", bkash: "bKash (manual)", nagad: "Nagad (manual)" };
const PHONE_RE = /^01[3-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

function doGet() {
  return json_({ ok: true, service: "cha-bazaar-orders", version: VERSION });
}

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) || "";
    if (!raw || raw.length > LIMITS.maxBodyChars) return json_(fail_("invalid_request"));
    let body;
    try { body = JSON.parse(raw); } catch (err) { return json_(fail_("invalid_request")); }
    if (!body || typeof body !== "object") return json_(fail_("invalid_request"));
    if (!countWithin_("global", LIMITS.requestsGlobal)) return json_(fail_("rate_limited"));

    switch (body.action) {
      case "order": return json_(handleOrder_(body));
      case "checkPromo": return json_(handlePromoCheck_(body));
      case "contact": return json_(handleContact_(body));
      default: return json_(fail_("invalid_request"));
    }
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_(fail_("server_error"));
  }
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

function handleOrder_(body) {
  if (body.website) return fail_("rejected"); // honeypot filled: almost certainly a bot

  const requestId = str_(body.clientRequestId);
  if (!/^[\w-]{8,64}$/.test(requestId)) return fail_("invalid_request");

  const cache = CacheService.getScriptCache();
  const seen = cache.get("req:" + requestId);
  if (seen) return JSON.parse(seen); // same submission again (double click, retry): same answer

  // ---- Validate customer ----
  const c = body.customer || {};
  const name = clean_(c.name, 80);
  if (name.length < 2) return fail_("invalid_name", { field: "name" });
  const phone = normalisePhone_(c.phone);
  if (!PHONE_RE.test(phone)) return fail_("invalid_phone", { field: "phone" });
  const email = clean_(c.email, 120);
  if (email && !EMAIL_RE.test(email)) return fail_("invalid_email", { field: "email" });
  const address = clean_(c.address, 300);
  if (address.length < 5) return fail_("invalid_address", { field: "address" });
  const notes = clean_(c.notes, 300);
  const payment = str_(body.payment);
  if (!PAYMENT_LABELS[payment]) return fail_("invalid_payment", { field: "payment" });
  const lang = body.lang === "bn" ? "bn" : "en";

  // ---- Price everything from the catalogue ----
  const catalog = getCatalog_();
  if (!catalog) return fail_("catalog_unavailable");
  const zone = (catalog.delivery && catalog.delivery.zones || []).filter(function (z) { return z.id === body.area; })[0];
  if (!zone) return fail_("invalid_area", { field: "area" });

  const priced = priceItems_(catalog, body.items);
  if (!priced.ok) return priced;

  let discount = 0;
  let promoCode = "";
  if (str_(body.promoCode)) {
    const promo = evaluatePromo_(body.promoCode, priced.subtotal);
    if (!promo.ok) return promo;
    discount = promo.discount;
    promoCode = promo.code;
  }

  const delivery = deliveryFee_(zone, priced.subtotal);
  const total = priced.subtotal - discount + delivery;

  if (typeof body.expectedTotal === "number" && Math.round(body.expectedTotal) !== total) {
    return fail_("total_changed", { subtotal: priced.subtotal, discount: discount, delivery: delivery, total: total });
  }

  if (!countWithin_("phone:" + phone, LIMITS.ordersPerPhone)) return fail_("rate_limited");

  // ---- Write (one order at a time) ----
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const again = cache.get("req:" + requestId);
    if (again) return JSON.parse(again);

    const now = new Date();
    const orderId = nextOrderId_(now);
    const when = Utilities.formatDate(now, TZ, "yyyy-MM-dd HH:mm:ss");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const orders = sheet_(ss, "orders");
    const items = sheet_(ss, "items");

    const productsText = priced.lines.map(function (l) {
      return l.qty + " × " + l.name + " " + l.weightG + "g @ ৳" + l.unitPrice + " = ৳" + l.lineTotal;
    }).join("\n");
    const totalQty = priced.lines.reduce(function (s, l) { return s + l.qty; }, 0);

    orders.appendRow([
      orderId, when, "New", cell_(name), cell_(phone), cell_(email), cell_(address),
      zone.label && zone.label.en || zone.id, zone.estimate && zone.estimate.en || "",
      cell_(productsText), totalQty, priced.subtotal, discount, cell_(promoCode), delivery, total,
      PAYMENT_LABELS[payment], cell_(notes), lang, requestId
    ]);
    priced.lines.forEach(function (l) {
      items.appendRow([orderId, when, l.sku, cell_(l.name), l.weightG, l.qty, l.unitPrice, l.lineTotal]);
    });

    const result = {
      ok: true,
      orderId: orderId,
      createdAt: now.toISOString(),
      area: zone.id,
      subtotal: priced.subtotal,
      discount: discount,
      delivery: delivery,
      total: total,
      payment: payment
    };
    cache.put("req:" + requestId, JSON.stringify(result), LIMITS.dedupeSeconds);

    notifyOwner_("New order " + orderId + " (৳" + total + ")", [
      "Order: " + orderId, "Date: " + when, "Name: " + name, "Phone: " + phone, email ? "Email: " + email : "",
      "Address: " + address, "Area: " + (zone.label && zone.label.en || zone.id), "Payment: " + PAYMENT_LABELS[payment],
      "", productsText, "", "Subtotal: ৳" + priced.subtotal, discount ? "Discount (" + promoCode + "): -৳" + discount : "",
      "Delivery: ৳" + delivery, "Total: ৳" + total, notes ? "\nNote: " + notes : ""
    ].filter(function (x) { return x !== ""; }).join("\n"));

    return result;
  } finally {
    lock.releaseLock();
  }
}

/** Merge duplicate SKUs, check they exist, have a price and stock, and price them. */
function priceItems_(catalog, rawItems) {
  if (!Array.isArray(rawItems) || !rawItems.length || rawItems.length > LIMITS.maxLines) return fail_("invalid_items");
  const index = {};
  (catalog.products || []).forEach(function (p) {
    (p.variants || []).forEach(function (v) { index[v.sku] = { product: p, variant: v }; });
  });
  const qtyBySku = {};
  const order = [];
  for (let i = 0; i < rawItems.length; i++) {
    const it = rawItems[i] || {};
    const sku = str_(it.sku);
    const qty = it.qty;
    if (!index[sku] || typeof qty !== "number" || qty % 1 !== 0 || qty < 1 || qty > LIMITS.maxQty) {
      return fail_("invalid_items", index[sku] ? { sku: sku } : {});
    }
    if (!(sku in qtyBySku)) { qtyBySku[sku] = 0; order.push(sku); }
    qtyBySku[sku] += qty;
    if (qtyBySku[sku] > LIMITS.maxQty) return fail_("invalid_items", { sku: sku });
  }
  const lines = [];
  let subtotal = 0;
  for (let j = 0; j < order.length; j++) {
    const sku = order[j];
    const hit = index[sku];
    const v = hit.variant;
    if (typeof v.price !== "number" || v.price <= 0) return fail_("invalid_items", { sku: sku });
    if (v.stock === 0) return fail_("sold_out", { sku: sku });
    if (typeof v.stock === "number" && qtyBySku[sku] > v.stock) return fail_("insufficient_stock", { sku: sku, available: v.stock });
    const lineTotal = v.price * qtyBySku[sku];
    subtotal += lineTotal;
    lines.push({ sku: sku, name: hit.product.name, weightG: v.weightG, qty: qtyBySku[sku], unitPrice: v.price, lineTotal: lineTotal });
  }
  return { ok: true, lines: lines, subtotal: subtotal };
}

/** Same rule as deliveryFee() in shared.js. */
function deliveryFee_(zone, subtotal) {
  if (subtotal <= 0) return 0;
  if (zone.freeOver !== null && zone.freeOver !== undefined && subtotal >= zone.freeOver) return 0;
  return zone.fee;
}

/** Order IDs look like CB-261107-0042 (date in Dhaka time + running number). Call inside the lock. */
function nextOrderId_(now) {
  const props = PropertiesService.getScriptProperties();
  const n = Number(props.getProperty("ORDER_SEQ") || 0) + 1;
  props.setProperty("ORDER_SEQ", String(n));
  return "CB-" + Utilities.formatDate(now, TZ, "yyMMdd") + "-" + ("000" + n).slice(-Math.max(4, String(n).length));
}

// ---------------------------------------------------------------------------
// Promo codes (Promos tab; there are none until the owner adds rows)
// ---------------------------------------------------------------------------

function handlePromoCheck_(body) {
  const catalog = getCatalog_();
  if (!catalog) return fail_("catalog_unavailable");
  const priced = priceItems_(catalog, body.items);
  if (!priced.ok) return priced;
  const promo = evaluatePromo_(body.code, priced.subtotal);
  if (!promo.ok) return promo;
  return { ok: true, code: promo.code, discount: promo.discount };
}

function evaluatePromo_(rawCode, subtotal) {
  const code = str_(rawCode).trim().toUpperCase();
  if (!/^[A-Z0-9_-]{2,30}$/.test(code)) return fail_("invalid_promo");
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.promos);
  if (!sh || sh.getLastRow() < 2) return fail_("invalid_promo");
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.promos.length).getValues();
  const today = new Date();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[0]).trim().toUpperCase() !== code) continue;
    const active = r[5] === true || String(r[5]).toUpperCase() === "TRUE";
    if (!active) return fail_("invalid_promo");
    if (r[6] && new Date(r[6]) > today) return fail_("invalid_promo");
    if (r[7] && endOfDay_(new Date(r[7])) < today) return fail_("invalid_promo");
    const min = Number(r[3]) || 0;
    if (subtotal < min) return fail_("promo_min_subtotal", { minSubtotal: min });
    const type = String(r[1]).trim().toLowerCase();
    const value = Number(r[2]);
    if (!(value > 0)) return fail_("invalid_promo");
    let discount = type === "percent" ? Math.round(subtotal * Math.min(value, 100) / 100) : type === "fixed" ? Math.round(value) : 0;
    const max = Number(r[4]);
    if (max > 0) discount = Math.min(discount, max);
    discount = Math.max(0, Math.min(discount, subtotal));
    if (!discount) return fail_("invalid_promo");
    return { ok: true, code: code, discount: discount };
  }
  return fail_("invalid_promo");
}

// ---------------------------------------------------------------------------
// Website messages
// ---------------------------------------------------------------------------

function handleContact_(body) {
  if (body.website) return fail_("rejected");
  const name = clean_(body.name, 80);
  if (name.length < 2) return fail_("invalid_name", { field: "name" });
  const replyRaw = clean_(body.reply, 120);
  const phone = normalisePhone_(replyRaw);
  if (!EMAIL_RE.test(replyRaw) && !PHONE_RE.test(phone)) return fail_("invalid_reply", { field: "reply" });
  const message = clean_(body.message, 1000);
  if (message.length < 2) return fail_("invalid_message", { field: "message" });
  if (!countWithin_("msg:" + replyRaw.toLowerCase(), LIMITS.messagesPerSender)) return fail_("rate_limited");

  const when = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd HH:mm:ss");
  sheet_(SpreadsheetApp.getActiveSpreadsheet(), "messages")
    .appendRow([when, "New", cell_(name), cell_(replyRaw), cell_(message), body.lang === "bn" ? "bn" : "en"]);
  notifyOwner_("Website message from " + name, "From: " + name + "\nReply to: " + replyRaw + "\n\n" + message);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Catalogue (single source of truth: the website's catalog.js)
// ---------------------------------------------------------------------------

function getCatalog_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get("catalog");
  if (hit) return JSON.parse(hit);
  const url = PropertiesService.getScriptProperties().getProperty("CATALOG_URL");
  if (url) {
    try {
      const res = UrlFetchApp.fetch(url + (url.indexOf("?") < 0 ? "?" : "&") + "v=" + Date.now(), { muteHttpExceptions: true, followRedirects: true });
      if (res.getResponseCode() === 200) {
        const catalog = parseCatalog_(res.getContentText());
        const text = JSON.stringify(catalog);
        cache.put("catalog", text, 600);           // fresh copy for 10 minutes
        cache.put("catalog_backup", text, 21600);  // fallback for 6 hours if the site is unreachable
        return catalog;
      }
      console.warn("CATALOG_URL returned HTTP " + res.getResponseCode());
    } catch (err) {
      console.warn("Could not load catalogue: " + err);
    }
  } else {
    console.error("Script property CATALOG_URL is not set.");
  }
  const backup = cache.get("catalog_backup");
  return backup ? JSON.parse(backup) : null;
}

/** catalog.js has a line starting "window.CHA_CATALOG =" followed by strict JSON and a final ";" */
function parseCatalog_(text) {
  const m = /^window\.CHA_CATALOG\s*=/m.exec(text);
  const end = text.lastIndexOf(";");
  if (!m || end < m.index) throw new Error("catalog.js format not recognised");
  const catalog = JSON.parse(text.slice(m.index + m[0].length, end));
  if (!catalog || !Array.isArray(catalog.products) || !catalog.delivery) throw new Error("catalog.js is missing products or delivery");
  return catalog;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function fail_(error, extra) {
  const out = { ok: false, error: error };
  if (extra) Object.keys(extra).forEach(function (k) { out[k] = extra[k]; });
  return out;
}

function str_(v) { return typeof v === "string" ? v : v === undefined || v === null ? "" : String(v); }

/** Trim, drop control characters, collapse long whitespace, cut to max length. */
function clean_(v, max) {
  return str_(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/[ \t]{2,}/g, " ").trim().slice(0, max);
}

/** Stop customer text being run as a spreadsheet formula. */
function cell_(v) {
  const s = str_(v);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

/** "+880 1712-345678" / "8801712345678" / "01712345678" -> "01712345678" */
function normalisePhone_(v) {
  let d = str_(v).replace(/[^\d]/g, "");
  if (d.indexOf("880") === 0) d = d.slice(2);
  else if (d.indexOf("88") === 0 && d.length === 13) d = d.slice(2);
  return d;
}

/** Simple rolling counter in CacheService. Returns false once the limit is exceeded. */
function countWithin_(key, limit) {
  const cache = CacheService.getScriptCache();
  const bucket = "rl:" + key + ":" + Math.floor(Date.now() / 1000 / LIMITS.windowSeconds);
  const n = Number(cache.get(bucket) || 0) + 1;
  cache.put(bucket, String(n), LIMITS.windowSeconds);
  return n <= limit;
}

function endOfDay_(d) { d.setHours(23, 59, 59, 999); return d; }

function sheet_(ss, key) {
  let sh = ss.getSheetByName(SHEET[key]);
  if (!sh) {
    sh = ss.insertSheet(SHEET[key]);
    sh.appendRow(HEADERS[key]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function notifyOwner_(subject, text) {
  const to = PropertiesService.getScriptProperties().getProperty("OWNER_EMAIL");
  if (!to) return;
  try {
    MailApp.sendEmail({ to: to, subject: "[Cha Bazaar] " + subject, body: text });
  } catch (err) {
    console.warn("E-mail not sent: " + err); // the order is already saved; never fail it because of e-mail
  }
}

// ---------------------------------------------------------------------------
// One-time setup and checks (run from the Apps Script editor)
// ---------------------------------------------------------------------------

/** Creates the four tabs with headers. Safe to run more than once. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEET).forEach(function (key) {
    const sh = sheet_(ss, key);
    if (sh.getLastRow() === 0) sh.appendRow(HEADERS[key]);
    sh.getRange(1, 1, 1, HEADERS[key].length).setFontWeight("bold");
    sh.setFrozenRows(1);
  });
  ss.setSpreadsheetTimeZone(TZ);
  console.log("Tabs ready: " + Object.keys(SHEET).map(function (k) { return SHEET[k]; }).join(", "));
}

/** Checks the catalogue can be downloaded and shows what the server will charge. */
function checkSetup() {
  const props = PropertiesService.getScriptProperties();
  console.log("CATALOG_URL = " + (props.getProperty("CATALOG_URL") || "(not set!)"));
  console.log("OWNER_EMAIL = " + (props.getProperty("OWNER_EMAIL") || "(not set: no e-mail alerts)"));
  CacheService.getScriptCache().remove("catalog");
  const catalog = getCatalog_();
  if (!catalog) throw new Error("Catalogue could not be loaded. Check CATALOG_URL and that the site is published.");
  catalog.products.forEach(function (p) {
    p.variants.forEach(function (v) {
      console.log(v.sku + "  " + p.name + " " + v.weightG + "g  " + (v.price === null ? "(no price: hidden)" : "৳" + v.price) + (v.stock === 0 ? "  SOLD OUT" : ""));
    });
  });
  catalog.delivery.zones.forEach(function (z) {
    console.log("Delivery " + z.id + ": ৳" + z.fee + (z.freeOver !== null ? ", free from ৳" + z.freeOver : ""));
  });
}
