// Cha Bazaar — shop logic: catalogue, cart, quick view, checkout and contact.
// Loaded after config.js, catalog.js, i18n.js, shared.js and analytics.js.
// Products, pack sizes, prices and delivery charges come from catalog.js.

// ---- Storage keys ----
const CART_KEY = "tea-shop-cart";          // [{ sku, qty }]
const ORDERS_KEY = "tea-shop-orders";      // recent order history, no personal data
const CUSTOMER_KEY = "tea-shop-customer";  // saved details, only with consent
const AREA_KEY = "tea-shop-area";          // last chosen delivery area
const FALLBACK_IMAGE = "Tea/MIX_tea.jpg";
const MAX_QTY = 50;
const REQUEST_TIMEOUT_MS = 20000;

// ---- Catalogue helpers ----
const products = CATALOG.products;
const LOW_STOCK = CATALOG.lowStockThreshold ?? 5;
const CATEGORY_BY_ID = new Map((CATALOG.categories || []).map((c) => [c.id, c]));
const DEPARTMENT_BY_ID = new Map((CATALOG.departments || []).map((d) => [d.id, d]));

const SKU_INDEX = new Map();
products.forEach((p) => p.variants.forEach((v) => SKU_INDEX.set(v.sku, { product: p, variant: v })));

const isSample = (p) => p && p.sample === true;
const hasPrice = (v) => typeof v.price === "number" && v.price > 0;
const pricedVariants = (p) => p.variants.filter(hasPrice);
// Sample listings (placeholder data) can be viewed but never bought.
const isBuyable = (v) => hasPrice(v) && v.stock !== 0 && !isSample(SKU_INDEX.get(v.sku)?.product);
const defaultVariant = (p) => pricedVariants(p).find((v) => v.stock !== 0) || pricedVariants(p)[0] || null;
const unitPrice = (v) => Math.round((v.price / v.weightG) * 100);
const weightLabel = (g) => (g >= 1000 ? `${g / 1000}kg` : `${g}g`);
// "200g" for tea, or the size label ("600 ml", "Set of 6") for teaware and gifts. Same rule as sizeLabel_() in Code.gs.
const variantLabel = (v) => (typeof v.weightG === "number" ? weightLabel(v.weightG) : localized(v.label) || "");
const itemName = (p, v) => `${p.name} ${variantLabel(v)}`.trim();
const stockState = (v) => {
  if (v.stock === 0) return "soldout";
  if (Number.isInteger(v.stock) && v.stock <= LOW_STOCK) return "low";
  return "ok";
};
const categoryLabel = (id) => localized(CATEGORY_BY_ID.get(id)?.label) || id;
const departmentLabel = (id) => localized(DEPARTMENT_BY_ID.get(id)?.label) || id;
const categoryIcon = (id) => CATEGORY_BY_ID.get(id)?.icon || "bi-cup-hot";
const shopHref = (params) => `index.html?${new URLSearchParams(params).toString()}`;
const productHref = (p) => shopHref({ product: p.slug });

// Which size is selected on each card / in quick view / on the product page (UI state only)
const selectedSku = new Map();
const currentVariant = (p) => SKU_INDEX.get(selectedSku.get(p.id))?.variant || defaultVariant(p);

// ---- Cart storage ----
// Older carts stored { id, qty }; those are moved to the product's default pack size.
const readRawCart = () => {
  const raw = readJSON(CART_KEY, []);
  if (!Array.isArray(raw)) return [];
  let migrated = false;
  const rows = raw.map((r) => {
    if (r && r.sku == null && r.id != null) {
      migrated = true;
      const p = products.find((x) => x.id === r.id);
      return { sku: p && defaultVariant(p)?.sku, qty: r.qty };
    }
    return r;
  });
  if (migrated) writeJSON(CART_KEY, rows.filter((r) => r && r.sku));
  return rows;
};

const readCart = () =>
  readRawCart()
    .filter((r) => r && SKU_INDEX.has(r.sku) && Number.isInteger(r.qty) && r.qty > 0)
    .map((r) => {
      const { product, variant } = SKU_INDEX.get(r.sku);
      const qty = Math.min(r.qty, MAX_QTY);
      return { sku: r.sku, qty, product, variant, price: variant.price, lineTotal: (variant.price || 0) * qty };
    })
    .filter((i) => isBuyable(i.variant));

const writeCart = (cart) => {
  writeJSON(CART_KEY, cart.map(({ sku, qty }) => ({ sku, qty })));
  renderCart();
};

// ---- Status messages ----
const toastEl = document.getElementById("appToast");
const toastBody = document.getElementById("appToastBody");
const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3000 });
const showToast = (msg) => { toastBody.textContent = msg; toast.show(); };
const srStatus = document.getElementById("sr-status");
const announce = (msg) => { srStatus.textContent = ""; setTimeout(() => { srStatus.textContent = msg; }, 50); };

// ---- Cart operations ----
const addToCart = (sku, qty = 1) => {
  const hit = SKU_INDEX.get(sku);
  if (!hit || !isBuyable(hit.variant)) { showToast(t("cart.unavailable")); return false; }
  const cart = readCart();
  const item = cart.find((i) => i.sku === sku);
  if (item) item.qty = Math.min(MAX_QTY, item.qty + qty);
  else cart.push({ sku, qty: Math.min(MAX_QTY, qty) });
  writeCart(cart);
  announce(t("cart.added", { name: itemName(hit.product, hit.variant) }));
  chaTrack("add_to_cart", { sku, name: hit.product.name, price: hit.variant.price, qty });
  return true;
};

const setQty = (sku, qty) => {
  const cart = readCart()
    .map((i) => (i.sku === sku ? { ...i, qty: Math.min(MAX_QTY, qty) } : i))
    .filter((i) => i.qty > 0);
  writeCart(cart);
};

const removeFromCart = (sku) => writeCart(readCart().filter((i) => i.sku !== sku));
const clearCart = () => writeCart([]);

const cartCount = (cart = readCart()) => cart.reduce((sum, i) => sum + i.qty, 0);
const cartSubtotal = (cart = readCart()) => cart.reduce((sum, i) => sum + i.lineTotal, 0);

// Brief "Added" state on the button that was pressed (the single visual confirmation).
const flashAdded = (btn) => {
  clearTimeout(btn._addedTimer);
  btn.classList.add("added");
  btn.innerHTML = `<i class="bi bi-check-lg" aria-hidden="true"></i> ${escapeHtml(t("cart.addedShort"))}`;
  btn._addedTimer = setTimeout(() => {
    btn.classList.remove("added");
    btn.textContent = t("cart.add");
  }, 1200);
};

// ---- Product cards (used by every grid: home sections, shop listing, related products) ----
const CARD_COLS = "col-12 col-sm-6 col-lg-4 col-xl-3";

const imgTag = (p, size, extra = "") => {
  const [w, h] = size === "card" ? [600, 450] : [1000, 750];
  if (!p.image) {
    return `<div class="img-placeholder ${size === "card" ? "tea-img" : "qv-img"}" role="img" aria-label="${escapeHtml(t("img.coming", { name: p.name }))}">
      <i class="bi ${escapeHtml(categoryIcon(p.category))}" aria-hidden="true"></i><span>${escapeHtml(t("img.soon"))}</span></div>`;
  }
  return `<img src="${escapeHtml(p.image[size] || p.image.fallback)}" width="${w}" height="${h}"
    alt="${escapeHtml(p.image.alt || p.name)}" data-fallback-src="${escapeHtml(p.image.fallback || FALLBACK_IMAGE)}" ${extra}>`;
};

const priceBlock = (v) => `
  <span class="price-now">${formatPrice(v.price)}</span>
  <small>${escapeHtml(typeof v.weightG === "number" ? t("price.pack", { size: variantLabel(v) }) : variantLabel(v))}</small>
  ${typeof v.weightG === "number" && v.weightG !== 100 ? `<small class="unit-price">${escapeHtml(t("price.per100", { price: formatPrice(unitPrice(v)) }))}</small>` : ""}`;

const stockBadge = (v) => {
  const s = stockState(v);
  if (s === "soldout") return `<span class="stock-badge soldout">${escapeHtml(t("stock.soldOut"))}</span>`;
  if (s === "low") return `<span class="stock-badge low">${escapeHtml(t("stock.low", { n: v.stock }))}</span>`;
  return "";
};
const sampleFlag = (p) => (isSample(p) ? `<span class="sample-flag" title="${escapeHtml(t("sample.title"))}">${escapeHtml(t("sample.flag"))}</span>` : "");
const buyLabel = (p, v) => (isSample(p) ? t("sample.soon") : isBuyable(v) ? t("cart.add") : t("stock.soldOut"));

const variantPicker = (p, v, context) => {
  const options = pricedVariants(p);
  if (options.length < 2) return "";
  const id = `${context}-size-${p.id}`;
  return `
    <label class="visually-hidden" for="${id}">${escapeHtml(t(p.department === "tea" ? "variant.label" : "variant.size"))}</label>
    <select class="form-select form-select-sm variant-select" id="${id}" data-product="${p.id}">
      ${options.map((o) => `<option value="${escapeHtml(o.sku)}" ${o.sku === v.sku ? "selected" : ""}>${escapeHtml(variantLabel(o))}, ${formatPrice(o.price)}${o.stock === 0 ? ` (${escapeHtml(t("stock.soldOut"))})` : ""}</option>`).join("")}
    </select>`;
};

const cardHtml = (p, i = 99, cols = CARD_COLS, context = "card") => {
  const v = currentVariant(p);
  if (!v) return "";
  const buyable = isBuyable(v);
  const meta = p.department === "tea" && p.grade
    ? `<span class="grade">${escapeHtml(p.grade)}</span><span class="origin">${escapeHtml(p.origin || "")}</span>`
    : `<span class="origin">${escapeHtml(categoryLabel(p.category))}</span>`;
  return `
    <div class="${cols}">
      <article class="tea${isSample(p) ? " is-sample" : ""}" data-product="${p.id}">
        <div class="tea-media">
          <a class="tea-img-link" href="${escapeHtml(productHref(p))}" tabindex="-1" aria-hidden="true">
            ${imgTag(p, "card", `class="tea-img" ${i < 4 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"`)}
          </a>
          <button type="button" class="quick-view-btn" data-quickview="${escapeHtml(p.slug)}" aria-label="${escapeHtml(t("qv.open", { name: p.name }))}">
            <i class="bi bi-eye" aria-hidden="true"></i> <span>${escapeHtml(t("qv.button"))}</span>
          </button>
        </div>
        <div class="tea-body">
          <p class="tea-grade">${meta}</p>
          <h3 class="tea-name"><a class="tea-link" href="${escapeHtml(productHref(p))}">${escapeHtml(p.name)}</a></h3>
          <p class="tea-desc">${escapeHtml(p.description)}</p>
          ${p.brew ? `<ul class="tea-brew" aria-label="${escapeHtml(t("brew.label"))}">
            <li><i class="bi bi-thermometer-half" aria-hidden="true"></i>${p.brew.temp}°C</li>
            <li><i class="bi bi-hourglass-split" aria-hidden="true"></i>${escapeHtml(t("brew.mins", { n: p.brew.mins }))}</li>
          </ul>` : ""}
          ${variantPicker(p, v, context)}
          <div class="tea-buy">
            <p class="tea-price mb-0">${priceBlock(v)}</p>
            <div class="tea-actions">
              ${sampleFlag(p)}${stockBadge(v)}
              <button class="btn btn-garden add-to-cart" data-sku="${escapeHtml(v.sku)}" ${buyable ? "" : "disabled"}
                aria-label="${escapeHtml(buyable ? t("cart.addAria", { name: itemName(p, v) }) : `${buyLabel(p, v)}: ${itemName(p, v)}`)}">${escapeHtml(buyLabel(p, v))}</button>
            </div>
          </div>
        </div>
      </article>
    </div>`;
};

// Replace a broken image with its JPEG original, then with the shop fallback.
document.addEventListener("error", (e) => {
  const img = e.target;
  if (img.tagName !== "IMG") return;
  if (img.dataset.fallbackSrc && !img.dataset.triedFallback) {
    img.dataset.triedFallback = "1";
    img.src = img.dataset.fallbackSrc;
  } else if (!img.dataset.triedShopFallback) {
    img.dataset.triedShopFallback = "1";
    img.src = FALLBACK_IMAGE;
  }
}, true);

// Card interactions anywhere on the page (delegated, because grids are re-rendered)
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-to-cart");
  if (btn && !btn.disabled && addToCart(btn.dataset.sku)) flashAdded(btn);
  const qv = e.target.closest("[data-quickview]");
  if (qv) {
    quickViewOpenedByApp = true;
    location.hash = `#tea/${qv.dataset.quickview}`;
  }
});
document.addEventListener("change", (e) => {
  const sel = e.target.closest(".variant-select");
  if (!sel) return;
  const p = products.find((x) => x.id === Number(sel.dataset.product));
  selectedSku.set(p.id, sel.value);
  // Update the card's contents in place (keeps the column and any animation state)
  const col = sel.closest("[class*='col-']");
  const tmp = document.createElement("div");
  tmp.innerHTML = cardHtml(p, 99, col.className, sel.id.split("-size-")[0]);
  col.replaceChildren(...tmp.firstElementChild.childNodes);
  document.getElementById(sel.id)?.focus();
});

// ---- Cart panel ----
const cartItemsEl = document.getElementById("cart-items");
const cartSubtotalEl = document.getElementById("cart-subtotal");
const cartDeliveryEl = document.getElementById("cart-delivery");
const cartTotalEl = document.getElementById("cart-total");
const cartTotalLabelEl = document.getElementById("cart-total-label");
const cartCountEl = document.getElementById("cart-count");
const checkoutBtn = document.getElementById("checkoutBtn");
const clearCartBtn = document.getElementById("clearCartBtn");
const recentOrdersEl = document.getElementById("recent-orders");

const savedArea = () => {
  const a = readJSON(AREA_KEY, null);
  return zoneById(a) ? a : null;
};

const renderCart = () => {
  const cart = readCart();
  const subtotal = cartSubtotal(cart);
  const area = savedArea();
  const delivery = deliveryFee(subtotal, area);

  cartCountEl.textContent = cartCount(cart);
  cartSubtotalEl.textContent = formatPrice(subtotal);
  if (area) {
    cartDeliveryEl.textContent = subtotal && !delivery ? t("cart.free") : formatPrice(delivery);
    cartTotalLabelEl.textContent = t("cart.total");
    cartTotalEl.textContent = formatPrice(subtotal + delivery);
  } else {
    const fees = ZONES.map((z) => z.fee);
    cartDeliveryEl.textContent = subtotal
      ? t("cart.deliveryRange", { min: formatPrice(Math.min(...fees)), max: formatPrice(Math.max(...fees)) })
      : formatPrice(0);
    cartTotalLabelEl.textContent = subtotal ? t("cart.totalBeforeDelivery") : t("cart.total");
    cartTotalEl.textContent = formatPrice(subtotal);
  }
  checkoutBtn.disabled = !cart.length;
  clearCartBtn.disabled = !cart.length;
  renderRecentOrders();

  if (!cart.length) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <i class="bi bi-bag d-block mb-2" aria-hidden="true"></i>
        <p>${escapeHtml(t("cart.emptyText"))}</p>
        <button type="button" class="btn btn-outline-garden" data-bs-dismiss="offcanvas">${escapeHtml(t("hero.cta"))}</button>
      </div>`;
    return;
  }

  // Free-delivery progress, for the chosen area (or the first area that offers it)
  const freeZone = area ? zoneById(area) : ZONES.find((z) => z.freeOver != null);
  let deliveryNote = "";
  if (freeZone && freeZone.freeOver != null) {
    const remaining = freeZone.freeOver - subtotal;
    const progress = Math.min(100, Math.round((subtotal / freeZone.freeOver) * 100));
    deliveryNote = `
      <div class="delivery-note">
        ${escapeHtml(remaining > 0
          ? t("cart.freeMore", { amount: formatPrice(remaining), area: localized(freeZone.label) })
          : t("cart.freeYes", { area: localized(freeZone.label) }))}
        <div class="delivery-bar" aria-hidden="true"><span style="width:${progress}%"></span></div>
      </div>`;
  }

  cartItemsEl.innerHTML = deliveryNote + cart.map((item) => {
    const name = item.product.name;
    const size = variantLabel(item.variant);
    return `
    <div class="cart-item">
      <img src="${escapeHtml(item.product.image.card || item.product.image.fallback)}" width="64" height="64" alt=""
        data-fallback-src="${escapeHtml(item.product.image.fallback || FALLBACK_IMAGE)}">
      <div>
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div class="cart-item-name">${escapeHtml(name)}</div>
            <div class="cart-item-meta">${escapeHtml(t("cart.itemMeta", { price: formatPrice(item.price), size }))}</div>
          </div>
          <button class="remove" data-sku="${escapeHtml(item.sku)}" aria-label="${escapeHtml(t("cart.remove", { name: `${name} ${size}` }))}">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-2">
          <div class="qty" role="group" aria-label="${escapeHtml(t("cart.qtyOf", { name }))}">
            <button class="decrease" data-sku="${escapeHtml(item.sku)}" aria-label="${escapeHtml(t("cart.less"))}">−</button>
            <span>${item.qty}</span>
            <button class="increase" data-sku="${escapeHtml(item.sku)}" aria-label="${escapeHtml(t("cart.more"))}" ${item.qty >= MAX_QTY ? "disabled" : ""}>+</button>
          </div>
          <span class="fw-semibold">${formatPrice(item.lineTotal)}</span>
        </div>
      </div>
    </div>`;
  }).join("");
};

cartItemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".decrease, .increase, .remove");
  if (!btn) return;
  const sku = btn.dataset.sku;
  const item = readCart().find((i) => i.sku === sku);
  if (!item) return;
  if (btn.classList.contains("decrease")) setQty(sku, item.qty - 1); // reaching 0 removes the item
  else if (btn.classList.contains("increase")) setQty(sku, item.qty + 1);
  else removeFromCart(sku);
});

clearCartBtn.addEventListener("click", () => {
  if (confirm(t("cart.confirmEmpty"))) clearCart();
});

// ---- Order history (no personal data) and reorder ----
const readHistory = () => {
  const raw = readJSON(ORDERS_KEY, []);
  if (!Array.isArray(raw)) return [];
  // Older versions stored full customer details here and never sent the order; strip and mark them.
  let changed = false;
  const clean = raw.map((o) => {
    if (o && o.customer) {
      changed = true;
      return {
        id: o.id, createdAt: o.createdAt, total: o.total, local: true,
        items: (o.items || []).map((i) => {
          if (i.sku) return { sku: i.sku, qty: i.qty };
          const p = products.find((x) => x.id === i.id);
          return { sku: p && defaultVariant(p)?.sku, qty: i.qty };
        }).filter((i) => i.sku)
      };
    }
    return o;
  }).filter((o) => o && o.id);
  if (changed) writeJSON(ORDERS_KEY, clean);
  return clean;
};

const renderRecentOrders = () => {
  const history = readHistory().filter((o) => !o.local).slice(-3).reverse();
  recentOrdersEl.hidden = !history.length;
  if (!history.length) return;
  const locale = getLang() === "bn" ? "bn-BD" : "en-GB";
  recentOrdersEl.innerHTML = `<h3>${escapeHtml(t("orders.recent"))}</h3>` + history.map((o) => `
    <div class="recent-order">
      <div>
        <strong>${escapeHtml(o.id)}</strong>
        <small>${escapeHtml(new Date(o.createdAt).toLocaleDateString(locale))}, ${formatPrice(o.total)}</small>
      </div>
      <button type="button" class="btn btn-outline-garden btn-sm" data-reorder="${escapeHtml(o.id)}">${escapeHtml(t("orders.reorder"))}</button>
    </div>`).join("");
};

recentOrdersEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-reorder]");
  if (!btn) return;
  const order = readHistory().find((o) => o.id === btn.dataset.reorder);
  if (!order) return;
  const cart = readCart();
  let skipped = 0;
  order.items.forEach((i) => {
    const hit = SKU_INDEX.get(i.sku);
    if (!hit || !isBuyable(hit.variant)) { skipped++; return; }
    const line = cart.find((c) => c.sku === i.sku);
    if (line) line.qty = Math.min(MAX_QTY, line.qty + i.qty);
    else cart.push({ sku: i.sku, qty: Math.min(MAX_QTY, i.qty) });
  });
  writeCart(cart);
  const msg = skipped ? t("orders.reorderPartial", { n: skipped }) : t("orders.reorderDone");
  showToast(msg);
});

// ---- Quick view and #tea/<slug> links ----
const teaModalEl = document.getElementById("teaModal");
const teaModal = bootstrap.Modal.getOrCreateInstance(teaModalEl);
const teaModalTitle = document.getElementById("teaModalTitle");
const teaModalBody = document.getElementById("teaModalBody");
const BASE_TITLE = document.title;
let quickViewProduct = null;
let quickViewOpenedByApp = false;
let quickViewReturnFocus = null;
let quickViewQty = 1;
let quickViewPrevTitle = document.title;

const productUrl = (p) => new URL(productHref(p), location.href).href; // shareable product page

// Facts list shared by quick view and the product page
const productFacts = (p) => {
  const rows = [];
  const add = (label, value) => { if (value) rows.push(`<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`); };
  add(t("qv.notes"), p.tastingNotes);
  add(t("qv.ingredients"), p.ingredients);
  if (p.brew) add(t("qv.brew"), t("qv.brewText", { temp: p.brew.temp, mins: p.brew.mins }));
  if (p.caffeine) add(t("filters.caffeine"), localized((CATALOG.filters?.caffeine || []).find((c) => c.id === p.caffeine)?.label));
  add(t("qv.details"), p.details);
  return rows.join("");
};

const renderQuickView = (p) => {
  const v = currentVariant(p);
  const options = pricedVariants(p);
  teaModalTitle.textContent = p.name;
  teaModalBody.innerHTML = `
    <div class="row g-4">
      <div class="col-md-6">
        ${imgTag(p, "large", 'class="qv-img" decoding="async"')}
      </div>
      <div class="col-md-6">
        ${sampleFlag(p)}
        <p class="tea-grade">${p.grade ? `<span class="grade">${escapeHtml(p.grade)}</span><span class="origin">${escapeHtml(p.origin || "")}</span>` : `<span class="origin">${escapeHtml(categoryLabel(p.category))}</span>`}</p>
        <p>${escapeHtml(p.description)}</p>
        <dl class="qv-facts">${productFacts(p)}</dl>
        ${v ? `
        <fieldset class="qv-sizes" ${options.length < 2 ? "hidden" : ""}>
          <legend class="form-label">${escapeHtml(t(p.department === "tea" ? "variant.label" : "variant.size"))}</legend>
          <div class="size-chips">
            ${options.map((o) => `<label class="size-chip">
              <input type="radio" name="qv-size" value="${escapeHtml(o.sku)}" ${o.sku === v.sku ? "checked" : ""} ${o.stock === 0 ? "disabled" : ""}>
              <span>${escapeHtml(variantLabel(o))}<small>${formatPrice(o.price)}</small></span>
            </label>`).join("")}
          </div>
        </fieldset>
        <p class="tea-price qv-price">${priceBlock(v)}</p>
        ${stockBadge(v)}
        <div class="qv-buy">
          <div class="qty" role="group" aria-label="${escapeHtml(t("qv.qty"))}">
            <button type="button" data-qv-qty="-1" aria-label="${escapeHtml(t("cart.less"))}">−</button>
            <span id="qv-qty" aria-live="polite">${quickViewQty}</span>
            <button type="button" data-qv-qty="1" aria-label="${escapeHtml(t("cart.more"))}">+</button>
          </div>
          <button type="button" class="btn btn-garden" id="qv-add" data-sku="${escapeHtml(v.sku)}" ${isBuyable(v) ? "" : "disabled"}>${escapeHtml(buyLabel(p, v))}</button>
        </div>` : `<p class="text-body-secondary">${escapeHtml(t("stock.unpriced"))}</p>`}
        <a class="btn btn-outline-garden btn-sm mt-3 me-2" href="${escapeHtml(productHref(p))}" id="qv-details">${escapeHtml(t("qv.details"))}</a>
        <button type="button" class="btn btn-link-muted btn-sm px-0 mt-3" id="qv-share">
          <i class="bi bi-link-45deg" aria-hidden="true"></i> <span>${escapeHtml(t("qv.share"))}</span>
        </button>
      </div>
    </div>`;
};

const openQuickView = (p) => {
  const isOpen = teaModalEl.classList.contains("show");
  if (!isOpen || (quickViewProduct && quickViewProduct.id !== p.id)) quickViewQty = 1;
  quickViewProduct = p;
  renderQuickView(p);
  if (!isOpen) quickViewPrevTitle = document.title;
  document.title = `${p.name} | Cha Bazaar`;
  if (!isOpen) {
    quickViewReturnFocus = document.activeElement;
    teaModal.show();
  }
  chaTrack("view_item", { sku: currentVariant(p)?.sku, name: p.name });
};

teaModalBody.addEventListener("change", (e) => {
  if (e.target.name !== "qv-size") return;
  selectedSku.set(quickViewProduct.id, e.target.value);
  renderQuickView(quickViewProduct);
  teaModalBody.querySelector(`input[name="qv-size"][value="${CSS.escape(e.target.value)}"]`)?.focus();
  refreshCards(); // keep the grids behind the modal on the same size
});

teaModalBody.addEventListener("click", async (e) => {
  const step = e.target.closest("[data-qv-qty]");
  if (step) {
    quickViewQty = Math.max(1, Math.min(MAX_QTY, quickViewQty + Number(step.dataset.qvQty)));
    teaModalBody.querySelector("#qv-qty").textContent = quickViewQty;
    return;
  }
  const add = e.target.closest("#qv-add");
  if (add && !add.disabled) {
    if (addToCart(add.dataset.sku, quickViewQty)) flashAdded(add);
    return;
  }
  const share = e.target.closest("#qv-share");
  if (share) {
    const url = productUrl(quickViewProduct);
    let ok = false;
    try { await navigator.clipboard.writeText(url); ok = true; } catch {
      const tmp = document.createElement("textarea");
      tmp.value = url; tmp.setAttribute("readonly", ""); tmp.style.position = "fixed"; tmp.style.opacity = "0";
      document.body.appendChild(tmp); tmp.select();
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      tmp.remove();
    }
    const label = share.querySelector("span");
    label.textContent = ok ? t("qv.copied") : url;
    announce(ok ? t("qv.copied") : url);
    if (ok) setTimeout(() => { label.textContent = t("qv.share"); }, 2000);
  }
});

const clearTeaHash = () => history.replaceState(null, "", `${location.pathname}${location.search}`);

teaModalEl.addEventListener("hidden.bs.modal", () => {
  document.title = quickViewPrevTitle;
  quickViewProduct = null;
  if (location.hash.startsWith("#tea/")) {
    if (quickViewOpenedByApp) history.back();
    else clearTeaHash();
  }
  quickViewOpenedByApp = false;
  if (quickViewReturnFocus && document.contains(quickViewReturnFocus) && quickViewReturnFocus !== document.body) quickViewReturnFocus.focus();
});

// Close the quick view. Bootstrap ignores hide() while the opening animation runs,
// so also close it once it has finished opening (unless a tea link is active again).
const hideQuickView = () => {
  teaModal.hide();
  teaModalEl.addEventListener("shown.bs.modal", () => {
    if (!location.hash.startsWith("#tea/")) teaModal.hide();
  }, { once: true });
};

const routeFromHash = () => {
  const m = location.hash.match(/^#tea\/([\w-]+)$/);
  if (m) {
    const p = products.find((x) => x.slug === m[1]);
    if (p) { openQuickView(p); return; }
    clearTeaHash();
    quickViewOpenedByApp = false;
    if (teaModalEl.classList.contains("show")) hideQuickView();
    showToast(t("qv.notFound"));
    return;
  }
  if (teaModalEl.classList.contains("show")) {
    quickViewOpenedByApp = false; // navigation already left the tea URL
    hideQuickView();
  }
};
window.addEventListener("hashchange", routeFromHash);

// ---- Checkout ----
const cartOffcanvas = bootstrap.Offcanvas.getOrCreateInstance("#cartOffcanvas");
const checkoutModalEl = document.getElementById("checkoutModal");
const checkoutModal = bootstrap.Modal.getOrCreateInstance(checkoutModalEl);
const confirmModal = bootstrap.Modal.getOrCreateInstance("#confirmModal");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutSummaryEl = document.getElementById("checkout-summary");
const areaOptionsEl = document.getElementById("area-options");
const areaGroup = document.getElementById("areaGroup");
const payInstructionsEl = document.getElementById("pay-instructions");
const checkoutErrorEl = document.getElementById("checkout-error");
const placeOrderBtn = document.getElementById("placeOrderBtn");
const promoInput = document.getElementById("promoCode");
const promoStatusEl = document.getElementById("promo-status");
const rememberMe = document.getElementById("rememberMe");
const forgetMeBtn = document.getElementById("forgetMe");
const phoneInput = document.getElementById("custPhone");

let submitting = false;
let orderRequestId = null;
let orderPlaced = false;
let appliedPromo = null; // { code, discount } confirmed by the server

const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
  : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)));

const selectedArea = () => checkoutForm.querySelector('input[name="area"]:checked')?.value || null;
const selectedPayment = () => checkoutForm.querySelector('input[name="payment"]:checked')?.value || "cod";

const renderAreaOptions = () => {
  const current = selectedArea() || savedArea();
  areaOptionsEl.innerHTML = ZONES.map((z, i) => `
    <label class="choice">
      <input class="form-check-input" type="radio" name="area" value="${escapeHtml(z.id)}" ${i === 0 ? "required" : ""} ${z.id === current ? "checked" : ""}>
      <span class="choice-body">
        <span class="choice-title">${escapeHtml(localized(z.label))}</span>
        <span class="choice-meta">${escapeHtml(t("area.meta", { fee: formatPrice(z.fee), eta: localized(z.estimate) }))}${z.freeOver != null ? `. ${escapeHtml(t("area.free", { amount: formatPrice(z.freeOver) }))}` : ""}</span>
      </span>
    </label>`).join("");
};

const payNumberText = (method) => {
  const num = method === "bkash" ? CFG.BKASH_NUMBER : CFG.NAGAD_NUMBER;
  const type = method === "bkash" ? CFG.BKASH_ACCOUNT_TYPE : CFG.NAGAD_ACCOUNT_TYPE;
  const brand = method === "bkash" ? "bKash" : "Nagad";
  if (!isSet(num)) return t("pay.numberLater", { brand });
  return t(type === "Personal" ? "pay.sendMoney" : "pay.payment", { brand, number: displayNumber(num) });
};

const paymentInstructions = (method, orderId, total) => {
  if (method !== "bkash" && method !== "nagad") return "";
  const brand = method === "bkash" ? "bKash" : "Nagad";
  return `
    <p class="mb-1"><strong>${escapeHtml(t("pay.howTitle", { brand }))}</strong></p>
    <ol class="mb-0">
      <li>${escapeHtml(t("pay.step1"))}</li>
      <li>${escapeHtml(payNumberText(method))}${total != null ? ` ${escapeHtml(t("pay.amount", { amount: formatPrice(total) }))}` : ""}</li>
      <li>${escapeHtml(orderId ? t("pay.refId", { id: orderId }) : t("pay.ref"))}</li>
    </ol>
    <p class="small mb-0 mt-1">${escapeHtml(t("pay.noGateway"))}</p>`;
};

const renderPayInstructions = () => {
  const html = paymentInstructions(selectedPayment());
  payInstructionsEl.hidden = !html;
  payInstructionsEl.innerHTML = html;
};

const checkoutTotals = () => {
  const cart = readCart();
  const subtotal = cartSubtotal(cart);
  const discount = appliedPromo ? Math.min(appliedPromo.discount, subtotal) : 0;
  const delivery = deliveryFee(subtotal, selectedArea());
  return { cart, subtotal, discount, delivery, total: delivery == null ? null : subtotal - discount + delivery };
};

const renderCheckoutSummary = () => {
  const { cart, subtotal, discount, delivery, total } = checkoutTotals();
  checkoutSummaryEl.innerHTML = cart.map((i) => `
      <li><span>${escapeHtml(itemName(i.product, i.variant))} × ${i.qty}
        <small class="d-block text-body-secondary">${escapeHtml(t("summary.each", { price: formatPrice(i.price) }))}</small></span>
        <span>${formatPrice(i.lineTotal)}</span></li>`).join("") + `
      <li class="muted"><span>${escapeHtml(t("cart.subtotal"))}</span><span>${formatPrice(subtotal)}</span></li>
      ${discount ? `<li class="muted"><span>${escapeHtml(t("summary.discount", { code: appliedPromo.code }))}</span><span>−${formatPrice(discount)}</span></li>` : ""}
      <li class="muted"><span>${escapeHtml(t("cart.delivery"))}</span><span id="summary-delivery">${delivery == null ? escapeHtml(t("summary.chooseArea")) : delivery ? formatPrice(delivery) : escapeHtml(t("cart.free"))}</span></li>
      <li class="total"><span>${escapeHtml(t("summary.total"))}</span><span id="summary-total">${total == null ? "—" : formatPrice(total)}</span></li>`;
};

const setCheckoutError = (html) => {
  checkoutErrorEl.hidden = !html;
  checkoutErrorEl.innerHTML = html || "";
};

const orderWhatsAppText = () => {
  const { cart, total } = checkoutTotals();
  const lines = cart.map((i) => `${i.qty} × ${i.product.name} (${variantLabel(i.variant)})`);
  const area = zoneById(selectedArea());
  return [t("wa.orderIntro"), ...lines,
    area ? `${t("co.area")}: ${localized(area.label)}` : "",
    total != null ? `${t("summary.total")}: ${formatPrice(total)}` : ""].filter(Boolean).join("\n");
};

const fallbackContactHtml = () => {
  const wa = whatsappLink(orderWhatsAppText());
  const tel = telLink();
  const parts = [];
  if (wa) parts.push(`<a class="btn btn-sm btn-outline-garden" href="${escapeHtml(wa)}" target="_blank" rel="noopener"><i class="bi bi-whatsapp" aria-hidden="true"></i> ${escapeHtml(t("err.waOrder"))}</a>`);
  if (tel) parts.push(`<a class="btn btn-sm btn-outline-garden" href="${escapeHtml(tel)}"><i class="bi bi-telephone" aria-hidden="true"></i> ${escapeHtml(t("err.call", { number: displayNumber(CFG.BUSINESS_PHONE) }))}</a>`);
  return parts.length ? `<div class="d-flex flex-wrap gap-2 mt-2">${parts.join("")}</div>` : "";
};

const prefillCustomer = () => {
  const saved = readJSON(CUSTOMER_KEY, null);
  forgetMeBtn.hidden = !saved;
  if (!saved) return;
  rememberMe.checked = true;
  const set = (id, v) => { const el = document.getElementById(id); if (el && !el.value && v) el.value = v; };
  set("custName", saved.name); set("custPhone", saved.phone); set("custEmail", saved.email); set("custAddress", saved.address);
  if (saved.area && zoneById(saved.area)) writeJSON(AREA_KEY, saved.area);
};

forgetMeBtn.addEventListener("click", () => {
  removeKey(CUSTOMER_KEY);
  ["custName", "custPhone", "custEmail", "custAddress"].forEach((id) => { document.getElementById(id).value = ""; });
  rememberMe.checked = false;
  forgetMeBtn.hidden = true;
  announce(t("co.forgotten"));
});

checkoutBtn.addEventListener("click", () => {
  if (!readCart().length) return;
  orderRequestId = uuid();
  orderPlaced = false;
  appliedPromo = null;
  promoInput.value = "";
  promoStatusEl.textContent = "";
  prefillCustomer();
  renderAreaOptions();
  renderPayInstructions();
  renderCheckoutSummary();
  setCheckoutError("");
  areaGroup.classList.remove("is-invalid");
  checkoutForm.classList.remove("was-validated");
  cartOffcanvas.hide();
  checkoutModal.show();
  chaTrack("begin_checkout", { value: cartSubtotal(), items: cartCount() });
});

checkoutForm.addEventListener("change", (e) => {
  if (e.target.name === "area") {
    writeJSON(AREA_KEY, e.target.value);
    areaGroup.classList.remove("is-invalid");
    renderCheckoutSummary();
    renderCart();
  }
  if (e.target.name === "payment") renderPayInstructions();
});

phoneInput.addEventListener("input", () => { phoneInput.value = phoneInput.value.replace(/[\s-]/g, ""); });

checkoutModalEl.addEventListener("hide.bs.modal", (e) => {
  if (submitting) e.preventDefault(); // don't close while an order is being sent
});
checkoutModalEl.addEventListener("hidden.bs.modal", () => {
  if (!orderPlaced && readCart().length) chaTrack("checkout_abandoned", { value: cartSubtotal() });
});

// ---- Talking to the order server (Google Apps Script) ----
const postToServer = async (payload) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    // text/plain avoids a CORS preflight, which Apps Script cannot answer.
    const res = await fetch(CFG.ORDER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: ctrl.signal
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
};

const setSubmitting = (on) => {
  submitting = on;
  placeOrderBtn.disabled = on;
  placeOrderBtn.querySelector(".spinner-border").hidden = !on;
  placeOrderBtn.querySelector(".btn-label").textContent = on ? t("co.placing") : t("co.place");
  checkoutForm.setAttribute("aria-busy", String(on));
  checkoutModalEl.querySelectorAll('[data-bs-dismiss="modal"]').forEach((b) => { b.disabled = on; });
};

const FIELD_FOR_ERROR = { invalid_name: "custName", invalid_phone: "custPhone", invalid_email: "custEmail", invalid_address: "custAddress", invalid_area: "areaGroup" };

const markInvalid = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.tagName === "FIELDSET") el.classList.add("is-invalid");
  else { el.setCustomValidity(t("err.checkField")); el.addEventListener("input", () => el.setCustomValidity(""), { once: true }); }
  checkoutForm.classList.add("was-validated");
  (el.tagName === "FIELDSET" ? el.querySelector("input") : el).focus();
};

const describeServerError = (data) => {
  const hit = data.sku && SKU_INDEX.get(data.sku);
  const name = hit ? itemName(hit.product, hit.variant) : "";
  switch (data.error) {
    case "sold_out": return t("err.soldOut", { name });
    case "insufficient_stock": return t("err.stock", { name, n: data.available });
    case "invalid_items": return t("err.items");
    case "invalid_promo": return t("err.promo");
    case "promo_min_subtotal": return t("err.promoMin", { amount: formatPrice(data.minSubtotal) });
    case "rate_limited": return t("err.rate");
    case "total_changed": return t("err.totalChanged", { total: formatPrice(data.total) });
    default: return FIELD_FOR_ERROR[data.error] ? t("err.checkField") : t("err.generic");
  }
};

checkoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (submitting) return; // ignore repeated clicks while sending
  setCheckoutError("");

  areaGroup.classList.toggle("is-invalid", !selectedArea());
  if (!checkoutForm.checkValidity()) {
    checkoutForm.classList.add("was-validated");
    checkoutForm.querySelector(":invalid")?.focus();
    return;
  }

  const { cart, total } = checkoutTotals();
  if (!cart.length) { checkoutModal.hide(); return; }

  if (!isSet(CFG.ORDER_ENDPOINT)) {
    setCheckoutError(`<p class="mb-0">${escapeHtml(t("err.notReady"))}</p>${fallbackContactHtml()}`);
    return;
  }

  const val = (id) => document.getElementById(id).value.trim();
  const payload = {
    action: "order",
    clientRequestId: orderRequestId || (orderRequestId = uuid()),
    customer: { name: val("custName"), phone: phoneInput.value, email: val("custEmail"), address: val("custAddress"), notes: val("custNotes") },
    area: selectedArea(),
    payment: selectedPayment(),
    promoCode: appliedPromo ? appliedPromo.code : "",
    items: cart.map(({ sku, qty }) => ({ sku, qty })),
    expectedTotal: total,
    lang: getLang(),
    website: document.getElementById("custWebsite").value
  };

  setSubmitting(true);
  let data;
  try {
    data = await postToServer(payload);
  } catch {
    setSubmitting(false);
    // The order may or may not have arrived. Trying again re-sends the same request ID,
    // so the server will not create a second order.
    setCheckoutError(`<p class="mb-0">${escapeHtml(t("err.network"))}</p>${fallbackContactHtml()}`);
    return;
  }
  setSubmitting(false);

  if (!data || data.ok !== true || !data.orderId) {
    const err = data || {};
    if (err.error === "total_changed" && appliedPromo && typeof err.discount === "number") {
      appliedPromo = { ...appliedPromo, discount: err.discount };
    }
    if (err.error === "invalid_promo" || err.error === "promo_min_subtotal") appliedPromo = null;
    renderCheckoutSummary();
    const showFallback = !err.error || ["server_error", "invalid_request", "catalog_unavailable"].includes(err.error);
    setCheckoutError(`<p class="mb-0">${escapeHtml(describeServerError(err))}</p>${showFallback ? fallbackContactHtml() : ""}`);
    if (FIELD_FOR_ERROR[err.error]) markInvalid(FIELD_FOR_ERROR[err.error]);
    return;
  }

  // ---- Confirmed by the server ----
  orderPlaced = true;
  const history = readHistory();
  history.push({ id: data.orderId, createdAt: data.createdAt || new Date().toISOString(), total: data.total, items: payload.items });
  writeJSON(ORDERS_KEY, history.slice(-10));

  if (rememberMe.checked) {
    writeJSON(CUSTOMER_KEY, { name: payload.customer.name, phone: payload.customer.phone, email: payload.customer.email, address: payload.customer.address, area: payload.area });
  } else removeKey(CUSTOMER_KEY);

  chaTrack("purchase", { orderId: data.orderId, value: data.total, payment: payload.payment, area: payload.area });
  clearCart();
  checkoutForm.reset();
  checkoutForm.classList.remove("was-validated");
  orderRequestId = null;

  const zone = zoneById(data.area || payload.area);
  document.getElementById("confirm-order-id").textContent = data.orderId;
  document.getElementById("confirm-message").textContent = t("conf.message", {
    phone: payload.customer.phone, eta: zone ? localized(zone.estimate) : "", total: formatPrice(data.total)
  });
  const confirmPay = document.getElementById("confirm-payment");
  confirmPay.innerHTML = paymentInstructions(payload.payment, data.orderId, data.total);
  confirmPay.hidden = !confirmPay.innerHTML.trim();
  const wa = whatsappLink(t("wa.orderQuestion", { id: data.orderId }));
  const waBtn = document.getElementById("confirm-whatsapp");
  waBtn.hidden = !wa;
  if (wa) waBtn.href = wa;

  checkoutModal.hide();
  confirmModal.show();
});

// ---- Promo codes (checked by the server; nothing is decided in the browser) ----
document.getElementById("applyPromo").addEventListener("click", async () => {
  const code = promoInput.value.trim().toUpperCase();
  promoStatusEl.className = "promo-status";
  if (!code) { appliedPromo = null; promoStatusEl.textContent = ""; renderCheckoutSummary(); return; }
  if (!isSet(CFG.ORDER_ENDPOINT)) { promoStatusEl.textContent = t("promo.unavailable"); promoStatusEl.classList.add("is-error"); return; }
  promoStatusEl.textContent = t("promo.checking");
  try {
    const data = await postToServer({ action: "checkPromo", code, items: readCart().map(({ sku, qty }) => ({ sku, qty })) });
    if (data.ok) {
      appliedPromo = { code: data.code, discount: data.discount };
      promoStatusEl.textContent = t("promo.applied", { amount: formatPrice(data.discount) });
      promoStatusEl.classList.add("is-ok");
    } else {
      appliedPromo = null;
      promoStatusEl.textContent = describeServerError(data);
      promoStatusEl.classList.add("is-error");
    }
  } catch {
    appliedPromo = null;
    promoStatusEl.textContent = t("promo.unavailable");
    promoStatusEl.classList.add("is-error");
  }
  renderCheckoutSummary();
});

// ---- Contact form (sent to the same server; never pretends to send) ----
const contactForm = document.getElementById("contactForm");
const contactStatus = document.getElementById("contact-status");
const contactReply = document.getElementById("contactEmail");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^(\+?88)?01[3-9]\d{8}$/;

const setContactStatus = (html, kind) => {
  contactStatus.hidden = !html;
  contactStatus.className = `form-alert${kind === "ok" ? " is-ok" : ""}`;
  contactStatus.innerHTML = html || "";
};

contactReply.addEventListener("input", () => {
  const v = contactReply.value.trim().replace(/[\s-]/g, "");
  contactReply.setCustomValidity(!v || EMAIL_RE.test(v) || PHONE_RE.test(v) ? "" : t("err.reply"));
});

const contactAlternatives = () => {
  const wa = whatsappLink(t("wa.greeting"));
  const tel = telLink();
  return [wa && `<a href="${escapeHtml(wa)}" target="_blank" rel="noopener">WhatsApp</a>`,
    tel && `<a href="${escapeHtml(tel)}">${escapeHtml(displayNumber(CFG.BUSINESS_PHONE))}</a>`].filter(Boolean).join(" · ");
};

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setContactStatus("");
  contactReply.dispatchEvent(new Event("input"));
  if (!contactForm.checkValidity()) {
    contactForm.classList.add("was-validated");
    contactForm.querySelector(":invalid")?.focus();
    return;
  }
  if (!isSet(CFG.ORDER_ENDPOINT)) {
    setContactStatus(`${escapeHtml(t("contact.notReady"))} ${contactAlternatives()}`);
    return;
  }
  const btn = contactForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = t("contact.sending");
  try {
    const data = await postToServer({
      action: "contact",
      name: document.getElementById("contactName").value.trim(),
      reply: contactReply.value.trim(),
      message: document.getElementById("contactMessage").value.trim(),
      lang: getLang(),
      website: document.getElementById("contactWebsite").value
    });
    if (!data.ok) throw new Error(data.error || "failed");
    contactForm.reset();
    contactForm.classList.remove("was-validated");
    setContactStatus(escapeHtml(t("contact.sent")), "ok");
  } catch (err) {
    setContactStatus(`${escapeHtml(err.message === "rate_limited" ? t("err.rate") : t("contact.failed"))} ${contactAlternatives()}`);
  } finally {
    btn.disabled = false;
    btn.textContent = t("contact.send");
  }
});

// ---- Reviews (only genuine reviews from catalog.js; labelled samples in development) ----
const SAMPLE_REVIEWS = [
  { name: "Sample reviewer", rating: 5, text: "Sample text to preview the layout. Replace with real customer reviews in catalog.js.", date: "2026-01-01" },
  { name: "Sample reviewer", rating: 4, text: "Another sample review. It is shown only on your own computer, never on the live site.", date: "2026-01-02" }
];

const stars = (n) => {
  const r = Math.max(0, Math.min(5, Math.round(n)));
  return `<span class="stars" role="img" aria-label="${escapeHtml(t("reviews.rated", { n: r }))}">${"★".repeat(r)}<span class="stars-off">${"★".repeat(5 - r)}</span></span>`;
};

const renderReviews = () => {
  const real = Array.isArray(CATALOG.reviews) ? CATALOG.reviews.filter((r) => r && r.text && r.rating >= 1 && r.rating <= 5) : [];
  const sample = !real.length && IS_DEV && CFG.SHOW_SAMPLE_REVIEWS_IN_DEV === true;
  const list = real.length ? real : sample ? SAMPLE_REVIEWS : [];
  const wrap = document.getElementById("reviews");
  wrap.hidden = !list.length;
  if (!list.length) return;
  const summary = document.getElementById("reviews-summary");
  const locale = getLang() === "bn" ? "bn-BD" : "en-GB";
  if (real.length) {
    const avg = real.reduce((s, r) => s + r.rating, 0) / real.length;
    summary.innerHTML = `${stars(avg)} ${escapeHtml(t("reviews.summary", { avg: avg.toFixed(1), n: real.length }))}`;
  } else summary.innerHTML = `<span class="sample-flag">${escapeHtml(t("reviews.sampleNote"))}</span>`;
  document.getElementById("review-list").innerHTML = list.map((r) => {
    const product = r.productId && products.find((p) => p.id === r.productId);
    return `
    <div class="col-md-6 col-lg-4">
      <figure class="review${sample ? " is-sample" : ""}">
        ${sample ? `<span class="sample-flag">${escapeHtml(t("reviews.sample"))}</span>` : ""}
        ${stars(r.rating)}
        <blockquote><p>${escapeHtml(r.text)}</p></blockquote>
        <figcaption>${escapeHtml(r.name)}${product ? `, ${escapeHtml(product.name)}` : ""}${r.date ? ` <time datetime="${escapeHtml(r.date)}">${escapeHtml(new Date(r.date).toLocaleDateString(locale, { month: "short", year: "numeric" }))}</time>` : ""}</figcaption>
      </figure>
    </div>`;
  }).join("");
};

// ---- Structured data for search engines (no ratings, no invented stock) ----
const injectStructuredData = () => {
  const site = isSet(CFG.SITE_URL) ? CFG.SITE_URL : `${location.origin}${location.pathname}`;
  const abs = (src) => new URL(src, site).href;
  const graph = [{
    "@type": "OnlineStore",
    "@id": `${site}#store`,
    name: "Cha Bazaar",
    url: site,
    image: abs("og-image.jpg"),
    address: { "@type": "PostalAddress", addressLocality: "Dhaka", addressCountry: "BD" },
    ...(isSet(CFG.BUSINESS_PHONE) ? { telephone: `+${intlNumber(CFG.BUSINESS_PHONE)}` } : {}),
    ...(isSet(CFG.FACEBOOK_URL) ? { sameAs: [CFG.FACEBOOK_URL] } : {})
  }];
  products.filter((p) => !isSample(p)).forEach((p) => {
    pricedVariants(p).forEach((v) => {
      const offer = {
        "@type": "Offer", price: v.price.toFixed(2), priceCurrency: "BDT", url: `${site}?product=${p.slug}`,
        seller: { "@id": `${site}#store` }
      };
      // Availability only when real stock data exists
      if (v.stock === 0) offer.availability = "https://schema.org/OutOfStock";
      else if (Number.isInteger(v.stock)) offer.availability = "https://schema.org/InStock";
      graph.push({
        "@type": "Product",
        name: itemName(p, v),
        description: p.description,
        ...(p.image ? { image: abs(p.image.large || p.image.fallback) } : {}),
        sku: v.sku,
        category: CATEGORY_BY_ID.get(p.category)?.label?.en || p.category,
        ...(typeof v.weightG === "number" ? { weight: { "@type": "QuantitativeValue", value: v.weightG, unitCode: "GRM" } } : {}),
        offers: offer
      });
    });
  });
  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.id = "structured-data";
  el.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  document.head.appendChild(el);
};

// ---- Floating WhatsApp button (message includes the current cart) ----
const waFloat = document.getElementById("waFloat");
const updateWaFloat = () => {
  const cart = readCart();
  const text = cart.length
    ? [t("wa.cartIntro"), ...cart.map((i) => `${i.qty} × ${i.product.name} (${variantLabel(i.variant)})`)].join("\n")
    : t("wa.greeting");
  const link = whatsappLink(text);
  waFloat.hidden = !link;
  if (link) waFloat.href = link;
};
waFloat.addEventListener("click", updateWaFloat);

// ---- Language changes re-render everything built in JavaScript ----
document.addEventListener("cha:lang", () => {
  renderRoute(); // store.js: menus, current view and grids
  renderCart();
  renderReviews();
  updateWaFloat();
  if (quickViewProduct) renderQuickView(quickViewProduct);
  if (checkoutModalEl.classList.contains("show")) { renderAreaOptions(); renderPayInstructions(); renderCheckoutSummary(); }
});

// ---- Sync cart across tabs ----
window.addEventListener("storage", (e) => { if (e.key === CART_KEY || e.key === AREA_KEY) renderCart(); });

// ---- Init (catalogue views, menus and the #tea/ quick view are started by store.js) ----
renderCart();
renderReviews();
updateWaFloat();
injectStructuredData();
