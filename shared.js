// Cha Bazaar — helpers shared by every page (shop and policy pages).
// Needs config.js, catalog.js and i18n.js to be loaded first.

const CFG = window.CHA_CONFIG || {};
const CATALOG = window.CHA_CATALOG || { products: [], delivery: { zones: [] }, reviews: [] };
const CURRENCY = "৳";

// A config value counts as set when it is not empty and is not a "YOUR_..." placeholder.
const isSet = (v) => (typeof v === "string" ? v.trim() !== "" && !v.trim().startsWith("YOUR_") : v != null);
const IS_DEV = location.protocol === "file:" || ["localhost", "127.0.0.1", "[::1]", ""].includes(location.hostname);

const formatPrice = (n) => `${CURRENCY}${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const localized = (v) => (v && typeof v === "object" ? v[getLang()] ?? v.en : v ?? "");

const readJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const writeJSON = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
};
const removeKey = (key) => { try { localStorage.removeItem(key); } catch { /* ignore */ } };

// ---- Phone and contact links ----
const digitsOnly = (s) => String(s ?? "").replace(/\D/g, "");
// "01712345678", "+8801712345678" or "8801712345678" -> "8801712345678"
const intlNumber = (n) => {
  const d = digitsOnly(n);
  if (d.length === 11 && d.startsWith("0")) return `88${d}`;
  return d;
};
// "8801712345678" -> "01712-345678"
const displayNumber = (n) => {
  const d = intlNumber(n);
  const local = d.startsWith("880") ? `0${d.slice(3)}` : d;
  return local.length === 11 ? `${local.slice(0, 5)}-${local.slice(5)}` : local;
};
const telLink = () => (isSet(CFG.BUSINESS_PHONE) ? `tel:+${intlNumber(CFG.BUSINESS_PHONE)}` : null);
const whatsappLink = (text) =>
  isSet(CFG.WHATSAPP_NUMBER)
    ? `https://wa.me/${intlNumber(CFG.WHATSAPP_NUMBER)}${text ? `?text=${encodeURIComponent(text)}` : ""}`
    : null;

const applyContactLinks = (root = document) => {
  const links = {
    phone: telLink() && { href: telLink(), text: displayNumber(CFG.BUSINESS_PHONE) },
    whatsapp: whatsappLink(t("wa.greeting")) && { href: whatsappLink(t("wa.greeting")) },
    facebook: isSet(CFG.FACEBOOK_URL) && { href: CFG.FACEBOOK_URL },
    email: isSet(CFG.BUSINESS_EMAIL) && { href: `mailto:${CFG.BUSINESS_EMAIL}`, text: CFG.BUSINESS_EMAIL }
  };
  root.querySelectorAll("[data-contact]").forEach((el) => { el.hidden = !links[el.dataset.contact]; });
  root.querySelectorAll("[data-link]").forEach((a) => {
    const l = links[a.dataset.link];
    if (!l) return;
    a.href = l.href;
    if (l.text) a.textContent = l.text;
  });
};

// ---- Delivery ----
const ZONES = (CATALOG.delivery && CATALOG.delivery.zones) || [];
const zoneById = (id) => ZONES.find((z) => z.id === id) || null;
// Fee for a zone; null when no zone is chosen. Must match apps-script/Code.gs.
const deliveryFee = (subtotal, zoneId) => {
  const z = zoneById(zoneId);
  if (!z) return null;
  if (subtotal <= 0) return 0;
  if (z.freeOver != null && subtotal >= z.freeOver) return 0;
  return z.fee;
};

// ---- Text that depends on config or catalogue ----
const applyFills = (root = document) => {
  const freeZone = ZONES.find((z) => z.freeOver != null);
  const fills = {
    address: localized(CFG.BUSINESS_ADDRESS),
    hours: localized(CFG.OPENING_HOURS),
    "free-delivery-promise": freeZone
      ? t("promise.free", { area: localized(freeZone.label), amount: formatPrice(freeZone.freeOver) })
      : t("promise.times"),
    "delivery-summary": ZONES.map((z) => t("delivery.line", {
      area: localized(z.label), fee: formatPrice(z.fee), eta: localized(z.estimate)
    })).join(" "),
    "returns-summary": t("trust.returnsText", { days: CFG.RETURN_WINDOW_DAYS ?? 7 }),
    "return-days": String(CFG.RETURN_WINDOW_DAYS ?? 7)
  };
  root.querySelectorAll("[data-fill]").forEach((el) => {
    const v = fills[el.dataset.fill];
    if (v != null && v !== "") el.textContent = v;
  });
  // Delivery table on the policy page, straight from catalog.js
  root.querySelectorAll('[data-fill-table="delivery"]').forEach((el) => {
    el.innerHTML = `<table class="table">
      <thead><tr><th scope="col">${escapeHtml(t("table.area"))}</th><th scope="col">${escapeHtml(t("table.fee"))}</th><th scope="col">${escapeHtml(t("table.eta"))}</th></tr></thead>
      <tbody>${ZONES.map((z) => `<tr><th scope="row">${escapeHtml(localized(z.label))}</th>
        <td>${formatPrice(z.fee)}${z.freeOver != null ? `<br><small>${escapeHtml(t("area.free", { amount: formatPrice(z.freeOver) }))}</small>` : ""}</td>
        <td>${escapeHtml(localized(z.estimate))}</td></tr>`).join("")}</tbody>
    </table>`;
  });
};

// ---- Footer "Shop" column (shop and policy pages) ----
const renderFooterShop = () => {
  const cats = CATALOG.categories || [];
  const html = (CATALOG.departments || []).map((d) => {
    const first = cats.filter((c) => c.department === d.id).slice(0, 3);
    return `<li><a href="index.html?shop=${encodeURIComponent(d.id)}"><strong>${escapeHtml(localized(d.label))}</strong></a></li>` +
      first.map((c) => `<li><a href="index.html?shop=${encodeURIComponent(c.id)}">${escapeHtml(localized(c.label))}</a></li>`).join("");
  }).join("");
  document.querySelectorAll("[data-footer-shop]").forEach((ul) => { ul.innerHTML = html; });
};

// ---- Language ----
const LANG_KEY = "cha-lang";
const setLang = (lang) => {
  writeJSON(LANG_KEY, lang);
  setCurrentLang(lang);
  document.documentElement.lang = lang;
  applyI18n();
  applyFills();
  applyContactLinks();
  renderFooterShop();
  document.querySelectorAll("[data-lang-toggle]").forEach((b) => {
    const next = lang === "en" ? "bn" : "en";
    b.textContent = next === "bn" ? "বাংলা" : "English";
    b.lang = next;
    b.setAttribute("aria-label", next === "bn" ? "বাংলায় দেখুন (View in Bangla)" : "View in English (ইংরেজিতে দেখুন)");
  });
  document.dispatchEvent(new CustomEvent("cha:lang", { detail: { lang } }));
};
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-lang-toggle]")) setLang(getLang() === "en" ? "bn" : "en");
});

// ---- Setup notice (only on your own computer, never on the live site) ----
const missingConfig = () => [
  ["ORDER_ENDPOINT", "online orders and contact messages"],
  ["BUSINESS_PHONE", "phone links"],
  ["WHATSAPP_NUMBER", "WhatsApp button and links"],
  ["FACEBOOK_URL", "Facebook link"],
  ["BUSINESS_EMAIL", "email link"],
  ["BKASH_NUMBER", "bKash payment instructions"],
  ["NAGAD_NUMBER", "Nagad payment instructions"]
].filter(([k]) => !isSet(CFG[k]));

const showSetupNotice = () => {
  const missing = missingConfig();
  if (!IS_DEV || !missing.length) return;
  let dismissed = false;
  try { dismissed = sessionStorage.getItem("cha-setup-dismissed") === "1"; } catch { /* ignore */ }
  console.warn("[Cha Bazaar] Not set up yet in config.js:", missing.map(([k, what]) => `${k} (${what})`).join(", "));
  if (dismissed) return;
  const bar = document.createElement("div");
  bar.className = "setup-bar";
  bar.setAttribute("role", "note");
  bar.innerHTML = `<strong>Setup needed (visible only on your computer):</strong> set
    ${missing.map(([k, what]) => `<code>${k}</code> <span>(${what})</span>`).join(", ")} in <code>config.js</code>.
    <button type="button" aria-label="Hide setup notice">×</button>`;
  bar.querySelector("button").addEventListener("click", () => {
    bar.remove();
    try { sessionStorage.setItem("cha-setup-dismissed", "1"); } catch { /* ignore */ }
  });
  document.body.prepend(bar);
};

// ---- Init (runs on every page) ----
setLang(readJSON(LANG_KEY, "en") === "bn" ? "bn" : "en");
showSetupNotice();
document.querySelectorAll("#year").forEach((el) => { el.textContent = new Date().getFullYear(); });
