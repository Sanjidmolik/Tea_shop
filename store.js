// Cha Bazaar — store navigation: mega menus, home sections, shop listing with filters,
// product pages and URL routing. Loaded after app.js (uses its card and cart helpers).
//
// URLs (all served by index.html, so they work on GitHub Pages and from a file):
//   index.html                         home
//   index.html?shop=tea                a department (tea, teaware, gifts) or "all"
//   index.html?shop=black-tea          a category
//   ...&origin=sylhet&caffeine=none&flavour=floral,malty&price=under-400&q=green&sort=price-asc
//   index.html?product=darjeeling      product page
//   any URL + #tea/<slug>              quick view on top of the current page
// Everything (departments, categories, filters, collections) comes from catalog.js.

// ---- Catalogue structure ----
const DEPARTMENTS = CATALOG.departments || [];
const CATEGORIES = CATALOG.categories || [];
const FILTER_DEFS = CATALOG.filters || {};
const FILTER_KEYS = [
  { key: "origin", field: "region", options: FILTER_DEFS.regions || [], title: "filters.origin" },
  { key: "caffeine", field: "caffeine", options: FILTER_DEFS.caffeine || [], title: "filters.caffeine" },
  { key: "flavour", field: "flavours", options: FILTER_DEFS.flavours || [], title: "filters.flavour" },
  { key: "price", field: null, options: FILTER_DEFS.prices || [], title: "filters.price" }
];
const categoriesOf = (dept) => CATEGORIES.filter((c) => c.department === dept);
const productsInScope = (scope) => {
  if (!scope || scope === "all") return products;
  if (DEPARTMENT_BY_ID.has(scope)) return products.filter((p) => p.department === scope);
  if (CATEGORY_BY_ID.has(scope)) return products.filter((p) => p.category === scope);
  return [];
};
const scopeDepartment = (scope) => (DEPARTMENT_BY_ID.has(scope) ? scope : CATEGORY_BY_ID.get(scope)?.department || null);
const scopeLabel = (scope) => (scope === "all" || !scope ? t("shop.all") : DEPARTMENT_BY_ID.has(scope) ? departmentLabel(scope) : categoryLabel(scope));
const scopeIntro = (scope) => localized((DEPARTMENT_BY_ID.get(scope) || CATEGORY_BY_ID.get(scope))?.intro) || "";

const BASE_DESCRIPTION = document.querySelector('meta[name="description"]')?.content || "";
const canonicalEl = document.querySelector('link[rel="canonical"]');
const BASE_CANONICAL = canonicalEl?.href || "";

// ---- Route ----
const readRoute = () => {
  const q = new URLSearchParams(location.search);
  if (q.get("product")) return { view: "product", slug: q.get("product") };
  if (q.has("shop")) {
    const filters = {};
    FILTER_KEYS.forEach(({ key }) => { filters[key] = (q.get(key) || "").split(",").filter(Boolean); });
    return { view: "shop", scope: q.get("shop") || "all", filters, q: q.get("q") || "", sort: q.get("sort") || "featured" };
  }
  return { view: "home" };
};
let route = readRoute();

const routeUrl = (r) => {
  if (r.view === "product") return shopHref({ product: r.slug });
  if (r.view === "shop") {
    const params = { shop: r.scope };
    FILTER_KEYS.forEach(({ key }) => { if (r.filters[key]?.length) params[key] = r.filters[key].join(","); });
    if (r.q) params.q = r.q;
    if (r.sort && r.sort !== "featured") params.sort = r.sort;
    return shopHref(params);
  }
  return "index.html";
};

// Navigate inside the page without reloading. replace=true keeps the history clean (filters, search).
const navigate = (url, { replace = false, keepScroll = false } = {}) => {
  const target = new URL(url, location.href);
  const hash = target.hash;
  history[replace ? "replaceState" : "pushState"](null, "", `${target.pathname}${target.search}`);
  route = readRoute();
  renderRoute();
  if (hash && hash.length > 1) {
    location.hash = hash; // section links like #contact, or #tea/<slug> quick views
  } else if (!keepScroll) {
    window.scrollTo(0, 0);
    document.getElementById("main").focus({ preventScroll: true });
  }
};

// Same-page links (index.html?..., index.html#...) are handled without a reload.
const samePage = (url) => {
  const norm = (p) => p.replace(/index\.html$/, "");
  return url.origin === location.origin && norm(url.pathname) === norm(location.pathname);
};
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!a || a.target === "_blank" || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (a.closest(".dropdown-menu")) bootstrap.Dropdown.getInstance(a.closest(".dropdown").querySelector("[data-bs-toggle]"))?.hide();
  const url = new URL(a.getAttribute("href"), location.href);
  if (!samePage(url)) return;
  if (url.search === location.search && url.hash) return; // plain in-page anchor, let the browser handle it
  if (url.search === location.search && !url.hash) return;
  e.preventDefault();
  if (a.closest("#navContent.show")) bootstrap.Collapse.getInstance("#navContent")?.hide();
  navigate(url.href);
});
window.addEventListener("popstate", () => {
  const next = readRoute();
  const same = JSON.stringify(next) === JSON.stringify(route);
  route = next;
  if (!same) renderRoute();
});

// ---- Page title, description and canonical per view ----
const setMeta = (title, description, url) => {
  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute("content", description || BASE_DESCRIPTION);
  if (canonicalEl) canonicalEl.href = url || BASE_CANONICAL;
};
const siteUrl = () => (isSet(CFG.SITE_URL) ? CFG.SITE_URL : `${location.origin}${location.pathname.replace(/index\.html$/, "")}`);

// ---- Mega menus and footer links ----
const megaLink = (href, label) => `<li><a class="dropdown-item" href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`;
const renderMegaMenus = () => {
  document.querySelectorAll("[data-mega]").forEach((menu) => {
    const dept = menu.dataset.mega;
    const cats = categoriesOf(dept);
    const col = (title, items) => `<div class="mega-col"><h2 class="mega-title">${escapeHtml(title)}</h2><ul class="list-unstyled">${items}</ul></div>`;
    let cols = col(t("mega.byType"), cats.map((c) => megaLink(shopHref({ shop: c.id }), localized(c.label))).join("") +
      megaLink(shopHref({ shop: dept }), t("mega.shopAll", { name: departmentLabel(dept) })));
    if (dept === "tea") {
      const used = (field, key, opts) => opts.filter((o) => products.some((p) => p.department === "tea" && [].concat(p[field] || []).includes(o.id)));
      cols += col(t("filters.origin"), used("region", "origin", FILTER_DEFS.regions || []).map((o) => megaLink(shopHref({ shop: "tea", origin: o.id }), localized(o.label))).join(""));
      cols += col(t("filters.caffeine"), used("caffeine", "caffeine", FILTER_DEFS.caffeine || []).map((o) => megaLink(shopHref({ shop: "tea", caffeine: o.id }), localized(o.label))).join(""));
      cols += col(t("filters.flavour"), used("flavours", "flavour", FILTER_DEFS.flavours || []).map((o) => megaLink(shopHref({ shop: "tea", flavour: o.id }), localized(o.label))).join(""));
    }
    const intro = localized(DEPARTMENT_BY_ID.get(dept)?.intro);
    menu.innerHTML = `<div class="container"><div class="mega-grid">${cols}
      <div class="mega-promo"><p class="mega-promo-title">${escapeHtml(departmentLabel(dept))}</p><p>${escapeHtml(intro)}</p>
      <a class="btn btn-liquor btn-sm" href="${escapeHtml(shopHref({ shop: dept }))}">${escapeHtml(t("mega.shopAll", { name: departmentLabel(dept) }))}</a></div></div></div>`;
  });
};

// ---- Home sections ----
const renderHome = () => {
  document.getElementById("category-tiles").innerHTML = CATEGORIES.map((c) => {
    const n = productsInScope(c.id).length;
    return `<a class="cat-tile" href="${escapeHtml(shopHref({ shop: c.id }))}">
      <i class="bi ${escapeHtml(c.icon || "bi-cup-hot")}" aria-hidden="true"></i>
      <span class="cat-tile-name">${escapeHtml(localized(c.label))}</span>
      <span class="cat-tile-meta">${escapeHtml(departmentLabel(c.department))}, ${escapeHtml(n === 1 ? t("shop.count1") : t("shop.count", { n }))}</span>
    </a>`;
  }).join("");
  const shortcut = (params, label) => `<a class="chip-link" href="${escapeHtml(shopHref(params))}">${escapeHtml(label)}</a>`;
  document.getElementById("shop-by-links").innerHTML = `
    <span class="shop-by-label">${escapeHtml(t("home.quick"))}</span>
    ${(FILTER_DEFS.caffeine || []).filter((o) => o.id === "none").map((o) => shortcut({ shop: "tea", caffeine: o.id }, localized(o.label))).join("")}
    ${(FILTER_DEFS.regions || []).filter((o) => o.id === "sylhet").map((o) => shortcut({ shop: "tea", origin: o.id }, t("home.fromBd"))).join("")}
    ${(FILTER_DEFS.flavours || []).filter((o) => ["malty", "floral", "spiced"].includes(o.id)).map((o) => shortcut({ shop: "tea", flavour: o.id }, localized(o.label))).join("")}
    ${shortcut({ shop: "tea", sort: "price-asc" }, t("home.budget"))}`;

  const collection = (CATALOG.collections || []).find((c) => c.id === "featured");
  const featured = products.filter((p) => (p.collections || []).includes("featured"));
  const title = document.querySelector('[data-collection-title="featured"]');
  if (collection && title) title.textContent = localized(collection.label);
  document.getElementById("featured-grid").innerHTML = featured.slice(0, 4).map((p, i) => cardHtml(p, i, CARD_COLS, "home")).join("");
  document.getElementById("gift-grid").innerHTML = products.filter((p) => p.department === "gifts").slice(0, 4).map((p) => cardHtml(p, 99, CARD_COLS, "gift")).join("");
  document.getElementById("teaware-grid").innerHTML = products.filter((p) => p.department === "teaware").slice(0, 4).map((p) => cardHtml(p, 99, CARD_COLS, "ware")).join("");
};

// ---- Shop listing ----
const grid = document.getElementById("product-grid");
const categoryEl = document.getElementById("category-filters");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const filterGroupsEl = document.getElementById("filter-groups");
const SHOP_COLS = "col-12 col-sm-6 col-xl-4";

const matchesFilter = (p, def, values) => {
  if (!values.length) return true;
  if (def.key === "price") {
    const v = defaultVariant(p);
    return !!v && values.some((id) => {
      const band = def.options.find((o) => o.id === id);
      return band && v.price >= band.min && (band.max == null || v.price <= band.max);
    });
  }
  return values.some((id) => [].concat(p[def.field] || []).includes(id));
};
const searchText = (p) => [p.name, categoryLabel(p.category), departmentLabel(p.department), p.description, p.grade, p.origin, p.tastingNotes, p.ingredients, p.details]
  .filter(Boolean).join(" ").toLowerCase();

const filteredProducts = (r, except) => {
  const q = r.q.trim().toLowerCase();
  return productsInScope(r.scope).filter((p) =>
    (!q || searchText(p).includes(q)) &&
    FILTER_KEYS.every((def) => def.key === except || matchesFilter(p, def, r.filters[def.key])));
};

const sortProducts = (list, sort) => {
  const price = (p) => defaultVariant(p)?.price ?? Infinity;
  const unit = (p) => { const v = defaultVariant(p); return v && typeof v.weightG === "number" ? unitPrice(v) : Infinity; };
  const real = (p) => (isSample(p) ? 1 : 0); // real products before sample listings in "Our picks"
  switch (sort) {
    case "price-asc": return list.sort((a, b) => price(a) - price(b));
    case "price-desc": return list.sort((a, b) => price(b) - price(a));
    case "unit-asc": return list.sort((a, b) => unit(a) - unit(b));
    case "name-asc": return list.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc": return list.sort((a, b) => b.name.localeCompare(a.name));
    default: return list.sort((a, b) => real(a) - real(b));
  }
};

const renderCrumbs = (el, items) => {
  el.innerHTML = items.map((it, i) => i === items.length - 1
    ? `<li aria-current="page">${escapeHtml(it.label)}</li>`
    : `<li><a href="${escapeHtml(it.href)}">${escapeHtml(it.label)}</a></li>`).join("");
};

const renderFilterGroups = () => {
  const base = productsInScope(route.scope);
  filterGroupsEl.innerHTML = FILTER_KEYS.map((def) => {
    // Only show options that exist in this department/category; counts respect the other filters
    const pool = filteredProducts(route, def.key);
    const opts = def.options.filter((o) => base.some((p) => matchesFilter(p, def, [o.id])));
    if (!opts.length) return "";
    return `<fieldset class="filter-group">
      <legend>${escapeHtml(t(def.title))}</legend>
      ${opts.map((o) => {
        const id = `f-${def.key}-${o.id}`;
        const n = pool.filter((p) => matchesFilter(p, def, [o.id])).length;
        return `<div class="form-check">
          <input class="form-check-input" type="checkbox" id="${id}" data-filter="${def.key}" value="${escapeHtml(o.id)}" ${route.filters[def.key].includes(o.id) ? "checked" : ""}>
          <label class="form-check-label" for="${id}">${escapeHtml(localized(o.label))} <span class="count">${n}</span></label>
        </div>`;
      }).join("")}
    </fieldset>`;
  }).join("") || `<p class="text-body-secondary">${escapeHtml(t("filters.none"))}</p>`;
};

const renderCategoryChips = () => {
  const dept = scopeDepartment(route.scope);
  const chips = !dept
    ? DEPARTMENTS.map((d) => ({ id: d.id, label: localized(d.label), n: productsInScope(d.id).length }))
    : [{ id: dept, label: t("shop.allIn", { name: departmentLabel(dept) }), n: productsInScope(dept).length },
       ...categoriesOf(dept).map((c) => ({ id: c.id, label: localized(c.label), n: productsInScope(c.id).length }))];
  categoryEl.innerHTML = chips.map((c) => `<button type="button" class="category-tab" data-category="${escapeHtml(c.id)}"
    aria-pressed="${c.id === route.scope}">${escapeHtml(c.label)}<span class="count">${c.n}</span></button>`).join("");
};

const applyFilters = () => {
  if (route.view !== "shop") return;
  const list = sortProducts(filteredProducts(route), route.sort);
  const active = FILTER_KEYS.reduce((n, d) => n + route.filters[d.key].length, 0) + (route.q ? 1 : 0);
  document.getElementById("result-count").textContent = t("shop.results", { n: list.length });
  document.getElementById("filter-count").textContent = active ? `(${active})` : "";
  document.getElementById("clearFilters").hidden = !active;
  if (!list.length) {
    grid.innerHTML = `<div class="col-12"><div class="empty-state">
      <p class="mb-2">${escapeHtml(route.q ? t("shop.none", { q: route.q }) : t("shop.noneFilters"))}</p>
      <button type="button" class="btn btn-outline-garden btn-sm" id="resetFilters">${escapeHtml(t("shop.showAll"))}</button>
    </div></div>`;
    return;
  }
  grid.innerHTML = list.map((p, i) => cardHtml(p, i, SHOP_COLS, "shop")).join("");
};

const renderShop = () => {
  const scope = route.scope;
  const known = scope === "all" || DEPARTMENT_BY_ID.has(scope) || CATEGORY_BY_ID.has(scope);
  if (!known) { navigate(shopHref({ shop: "all" }), { replace: true }); return; }
  const dept = scopeDepartment(scope);
  const crumbs = [{ label: t("crumbs.home"), href: "index.html" }];
  if (dept && dept !== scope) crumbs.push({ label: departmentLabel(dept), href: shopHref({ shop: dept }) });
  crumbs.push({ label: scopeLabel(scope) });
  renderCrumbs(document.getElementById("shop-crumbs"), crumbs);
  document.getElementById("shopTitle").textContent = scopeLabel(scope);
  document.getElementById("shop-intro").textContent = scopeIntro(scope);
  searchInput.value = route.q;
  sortSelect.value = route.sort;
  sortSelect.querySelector('[value="unit-asc"]').hidden = dept !== "tea";
  renderCategoryChips();
  renderFilterGroups();
  applyFilters();
  const label = scopeLabel(scope);
  setMeta(`${label} | Cha Bazaar`, scopeIntro(scope) || BASE_DESCRIPTION, `${siteUrl()}?shop=${encodeURIComponent(scope)}`);
};

const updateShopUrl = () => {
  history.replaceState(null, "", routeUrl(route));
  renderFilterGroups();
  applyFilters();
};
searchInput.addEventListener("input", () => { route.q = searchInput.value; updateShopUrl(); });
sortSelect.addEventListener("change", () => { route.sort = sortSelect.value; updateShopUrl(); });
filterGroupsEl.addEventListener("change", (e) => {
  const box = e.target.closest("[data-filter]");
  if (!box) return;
  const list = route.filters[box.dataset.filter];
  if (box.checked) list.push(box.value); else list.splice(list.indexOf(box.value), 1);
  updateShopUrl();
  document.getElementById(box.id)?.focus();
});
categoryEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-category]");
  if (!btn) return;
  navigate(routeUrl({ ...route, scope: btn.dataset.category }), { keepScroll: true });
});
const clearAll = () => {
  FILTER_KEYS.forEach(({ key }) => { route.filters[key] = []; });
  route.q = "";
  searchInput.value = "";
  updateShopUrl();
};
document.getElementById("clearFilters").addEventListener("click", clearAll);
grid.addEventListener("click", (e) => { if (e.target.closest("#resetFilters")) clearAll(); });

// ---- Product page ----
const productPageEl = document.getElementById("product-page");
let pageQty = 1;

const productReviews = (p) => (Array.isArray(CATALOG.reviews) ? CATALOG.reviews : [])
  .filter((r) => r && r.productId === p.id && r.text && r.rating >= 1 && r.rating <= 5);

const renderProductPage = () => {
  const p = products.find((x) => x.slug === route.slug);
  if (!p) {
    productPageEl.innerHTML = `<div class="empty-state my-5"><h1 class="h3">${escapeHtml(t("pp.notFound"))}</h1>
      <a class="btn btn-garden mt-2" href="${escapeHtml(shopHref({ shop: "all" }))}">${escapeHtml(t("shop.showAll"))}</a></div>`;
    setMeta(`${t("pp.notFound")} | Cha Bazaar`);
    return;
  }
  const v = currentVariant(p);
  const options = pricedVariants(p);
  const reviews = productReviews(p);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const related = products.filter((x) => x.id !== p.id && x.category === p.category)
    .concat(products.filter((x) => x.id !== p.id && x.category !== p.category && x.department === p.department))
    .slice(0, 4);
  const zone = ZONES[0];
  productPageEl.innerHTML = `
    <nav aria-label="${escapeHtml(t("crumbs.label"))}"><ol class="crumbs" id="product-crumbs"></ol></nav>
    <div class="row g-4 g-lg-5 product-main">
      <div class="col-lg-6">${imgTag(p, "large", 'class="pp-img" decoding="async" fetchpriority="high"')}</div>
      <div class="col-lg-6">
        ${sampleFlag(p)}
        <p class="tea-grade">${p.grade ? `<span class="grade">${escapeHtml(p.grade)}</span><span class="origin">${escapeHtml(p.origin || "")}</span>` : `<span class="origin">${escapeHtml(categoryLabel(p.category))}</span>`}</p>
        <h1 class="pp-title">${escapeHtml(p.name)}</h1>
        ${reviews.length ? `<p class="pp-rating">${stars(avg)} <a href="#pp-reviews">${escapeHtml(t("reviews.summary", { avg: avg.toFixed(1), n: reviews.length }))}</a></p>` : ""}
        <p class="pp-desc">${escapeHtml(p.description)}</p>
        ${isSample(p) ? `<p class="pay-instructions">${escapeHtml(t("sample.explain"))}</p>` : ""}
        ${v ? `
        <fieldset class="qv-sizes" ${options.length < 2 ? "hidden" : ""}>
          <legend class="form-label">${escapeHtml(t(p.department === "tea" ? "variant.label" : "variant.size"))}</legend>
          <div class="size-chips">
            ${options.map((o) => `<label class="size-chip">
              <input type="radio" name="pp-size" value="${escapeHtml(o.sku)}" ${o.sku === v.sku ? "checked" : ""} ${o.stock === 0 ? "disabled" : ""}>
              <span>${escapeHtml(variantLabel(o))}<small>${formatPrice(o.price)}</small></span>
            </label>`).join("")}
          </div>
        </fieldset>
        <p class="tea-price pp-price">${priceBlock(v)}</p>
        ${stockBadge(v)}
        <div class="qv-buy">
          <div class="qty" role="group" aria-label="${escapeHtml(t("qv.qty"))}">
            <button type="button" data-pp-qty="-1" aria-label="${escapeHtml(t("cart.less"))}">−</button>
            <span id="pp-qty" aria-live="polite">${pageQty}</span>
            <button type="button" data-pp-qty="1" aria-label="${escapeHtml(t("cart.more"))}">+</button>
          </div>
          <button type="button" class="btn btn-liquor btn-lg" id="pp-add" data-sku="${escapeHtml(v.sku)}" ${isBuyable(v) ? "" : "disabled"}>${escapeHtml(buyLabel(p, v))}</button>
        </div>` : `<p class="text-body-secondary">${escapeHtml(t("stock.unpriced"))}</p>`}
        <ul class="pp-assure">
          ${zone ? `<li><i class="bi bi-truck" aria-hidden="true"></i>${escapeHtml(ZONES.map((z) => t("delivery.line", { area: localized(z.label), fee: formatPrice(z.fee), eta: localized(z.estimate) })).join(" "))}</li>` : ""}
          <li><i class="bi bi-cash-coin" aria-hidden="true"></i>${escapeHtml(t("promise.payment"))}</li>
          <li><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i><a href="returns.html">${escapeHtml(t("trust.guarantee"))}</a></li>
        </ul>
        ${whatsappLink(t("wa.productQuestion", { name: p.name })) ? `<a class="btn btn-link-muted btn-sm px-0" href="${escapeHtml(whatsappLink(t("wa.productQuestion", { name: p.name })))}" target="_blank" rel="noopener"><i class="bi bi-whatsapp" aria-hidden="true"></i> ${escapeHtml(t("pp.ask"))}</a>` : ""}
      </div>
    </div>

    <div class="row g-4 g-lg-5 pp-more">
      <section class="col-lg-6" aria-labelledby="pp-about-title">
        <h2 class="pp-h2" id="pp-about-title">${escapeHtml(p.department === "tea" ? t("pp.aboutTea") : t("pp.about"))}</h2>
        <dl class="qv-facts">${productFacts(p)}${p.origin ? `<div><dt>${escapeHtml(t("filters.origin"))}</dt><dd>${escapeHtml(p.origin)}</dd></div>` : ""}</dl>
      </section>
      <section class="col-lg-6" id="pp-reviews" aria-labelledby="pp-reviews-title">
        <h2 class="pp-h2" id="pp-reviews-title">${escapeHtml(t("reviews.title"))}</h2>
        ${reviews.length ? reviews.map((r) => `<figure class="review mb-3">${stars(r.rating)}<blockquote><p>${escapeHtml(r.text)}</p></blockquote>
          <figcaption>${escapeHtml(r.name)}</figcaption></figure>`).join("") : `<p class="text-body-secondary">${escapeHtml(t("pp.noReviews"))}</p>`}
      </section>
    </div>

    ${related.length ? `<section class="pp-related" aria-labelledby="pp-related-title">
      <h2 class="section-title" id="pp-related-title">${escapeHtml(t("pp.related"))}</h2>
      <div class="row g-4">${related.map((x) => cardHtml(x, 99, CARD_COLS, "related")).join("")}</div>
    </section>` : ""}`;

  renderCrumbs(document.getElementById("product-crumbs"), [
    { label: t("crumbs.home"), href: "index.html" },
    { label: departmentLabel(p.department), href: shopHref({ shop: p.department }) },
    { label: categoryLabel(p.category), href: shopHref({ shop: p.category }) },
    { label: p.name }
  ]);
  setMeta(`${p.name} | Cha Bazaar`, p.description, `${siteUrl()}?product=${encodeURIComponent(p.slug)}`);
  chaTrack("view_item", { sku: v?.sku, name: p.name });
};

productPageEl.addEventListener("change", (e) => {
  if (e.target.name !== "pp-size") return;
  const p = products.find((x) => x.slug === route.slug);
  selectedSku.set(p.id, e.target.value);
  renderProductPage();
  productPageEl.querySelector(`input[name="pp-size"][value="${CSS.escape(e.target.value)}"]`)?.focus();
});
productPageEl.addEventListener("click", (e) => {
  const step = e.target.closest("[data-pp-qty]");
  if (step) {
    pageQty = Math.max(1, Math.min(MAX_QTY, pageQty + Number(step.dataset.ppQty)));
    productPageEl.querySelector("#pp-qty").textContent = pageQty;
    return;
  }
  const add = e.target.closest("#pp-add");
  if (add && !add.disabled && addToCart(add.dataset.sku, pageQty)) flashAdded(add);
});

// ---- Render the current view ----
const renderRoute = () => {
  renderMegaMenus();
  renderFooterShop();
  document.querySelectorAll("[data-view]").forEach((el) => { el.hidden = el.dataset.view !== route.view; });
  document.querySelectorAll(".site-nav .nav-link").forEach((a) => a.classList.remove("active"));
  if (route.view === "shop" || route.view === "product") {
    const dept = route.view === "shop" ? scopeDepartment(route.scope) : products.find((x) => x.slug === route.slug)?.department;
    document.querySelector(`.site-nav [data-mega="${dept}"]`)?.previousElementSibling?.classList.add("active");
  }
  if (route.view === "shop") renderShop();
  else if (route.view === "product") { pageQty = 1; renderProductPage(); }
  else { renderHome(); setMeta(BASE_TITLE, BASE_DESCRIPTION, BASE_CANONICAL); }
};

// Re-render every visible grid (e.g. after a size change in quick view)
const refreshCards = () => {
  if (route.view === "shop") applyFilters();
  else if (route.view === "product") renderProductPage();
  else renderHome();
};

// ---- Init ----
renderRoute();
routeFromHash();
