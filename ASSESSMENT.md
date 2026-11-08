# Storefront redesign: Phase 1 assessment (2026-11-08)

> Phase 1 of the storefront brief: inspect the project, record what exists, and list what must change and where the brief conflicts with the current architecture or rules.
> Related: [PLAN.md](PLAN.md) §11 · [FEATURES.md](FEATURES.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [AGENTS.md](AGENTS.md)

## 1. What was inspected

- **Source:** all HTML, CSS and JS on branch `claude/zealous-wozniak-iioncf` (commit `62f25c9`), plus `apps-script/Code.gs`, tests and docs.
- **`main`:** `origin/main` (merge `1ce7467`).
- **Live site and adagio.com:** **could not be opened from this session.** The network blocks both `sanjidmolik.github.io` and `www.adagio.com`. Statements about the live site below come from the code on `main`.

## 2. Deployment status: important

| Item | Finding |
|---|---|
| What `main` (GitHub Pages) contains | v2: real-order checkout, delivery areas, bKash/Nagad, trust/policy pages, Bangla, SEO. **Not** the v3 store layout (mega menus, `?shop=`/`?product=` pages, sample listings) |
| v3 store layout (commit `62f25c9`) | Pushed to the branch **after** PR #2 was merged; **not merged into `main`** |
| Are orders reaching the business? | **No.** `ORDER_ENDPOINT` in `config.js` on `main` is still `YOUR_APPS_SCRIPT_URL`. The live checkout correctly refuses to place orders and offers WhatsApp/phone, but those links are hidden too, because the numbers are placeholders. **Today a live customer has no working way to order** |
| Order server code | Implemented (`apps-script/Code.gs`) and tested (27 tests on simulated Google services). Never deployed to a real Google account. Deployment needs the owner's account (apps-script/README.md) |

## 3. Feature inventory: brief vs code

Status: ✅ exists and tested · 🟡 exists partly · ❌ missing · ⛔ blocked by missing data or a decision

| Area | Requested | Status | Notes |
|---|---|---|---|
| Brand, hero, tea-chest identity | Keep | ✅ | |
| Announcement bar (configurable) | New | ❌ | Easy; config-driven |
| Navbar: Shop All, Black, Green, Herbal, Flavoured, Collections, Gifts, Teaware | Restructure | 🟡 | Today: Tea / Teaware / Gifts mega menus (click). Needs hover + click, Escape, mobile accordion |
| Search in navbar with suggestions and thumbnails | New | 🟡 | Search exists only on the shop listing (`?q=`) |
| Account, Wishlist | Only if implemented | ❌ | Not implemented, so omitted as the brief says |
| Two-level taxonomy (e.g. Black tea → Assam) | New | 🟡 | One level today. See conflict C-2 |
| Products in several categories | New | ❌ | Each product has one `category`. Needs `categoryIds` |
| Category landing pages at `/collections/<slug>` | New URLs | 🟡 | Pages exist at `index.html?shop=<slug>`. See conflict C-1 |
| Category banner, subcategory links, related categories | New | ❌ | |
| Filters: price, type, origin, flavour, weight, availability | Extend | 🟡 | Price, origin, caffeine, flavour exist; weight and availability missing |
| Homepage: 15 sections | Extend | 🟡 | Exists: hero, shop by category, featured, gifts, teaware, trust, reviews (genuine-only, hidden), about, contact. Missing: best sellers, new arrivals, premium, explore by origin, why us, brewing guide, newsletter |
| Reusable product card | Extend | 🟡 | One card exists (image, grade, origin, size, price, ৳/100g, stock, quick view, add). Missing: quantity selector, image hover |
| Product page at `/products/<slug>` | New URL | 🟡 | Exists at `index.html?product=<slug>` with sizes, quantity, add to cart, delivery, details, reviews, related. Missing: gallery, Buy Now, storage |
| Catalogue schema | Review | 🟡 | Clean but single-category; no dates or short/long description. See C-6 |
| Cart and checkout | Preserve | ✅ | Tested: sizes, quantities, delivery areas, COD/bKash/Nagad, BD phone validation, saved details, promo (server-side), confirmation only after server OK |
| Order submission | Verify | ⛔ | Code tested; **not deployed** (see §2) |
| Contact form | Verify | ✅ code / ⛔ live | Same server; same deployment gap |
| Footer: Shop / Customer service / About / Connect / bottom | Extend | 🟡 | Today: brand, Shop, Contact, Policies |
| FAQ, Our Story, Quality, Brewing Guide pages | New | ⛔ | No content exists. See C-7 |
| Instagram | New | ❌ | Config placeholder needed |
| Newsletter | New | ⛔ | Stores e-mail addresses: a new data destination. See C-8 |
| SEO: titles, meta, canonical, OG, JSON-LD, sitemap, robots | Extend | 🟡 | Exists (per-view titles and canonicals set by JS). Real per-page HTML would need C-1 |
| Mobile: hamburger, filters drawer, footer accordion, gallery | Extend | 🟡 | Hamburger and filter drawer exist; no footer accordion or gallery |
| Accessibility, reduced motion | Keep | ✅ | WCAG AA contrast, keyboard, pause control |
| Licensed product photos only | Rule | ⛔ | See C-9 |

## 4. Conflicts and decisions needed

**C-1 · Path URLs on GitHub Pages.** `/collections/black-tea` and `/products/darjeeling` need a server that sends every path to one page. GitHub Pages can't do that. The options:

| Option | URLs | SEO | Cost |
|---|---|---|---|
| **A. Pre-generated static pages (recommended)** | Real folders: `collections/black-tea/index.html`, `products/darjeeling/index.html`, made from `catalog.js` by a dev-only Node script (`npm run pages`), committed like the WebP images | Best: each page has real HTML, title, meta and JSON-LD with HTTP 200 | Re-run the script after catalogue changes; the future admin panel would run it too. **This adds a generation step, so it needs your approval** |
| B. Keep today's query URLs | `index.html?shop=black-tea`, `?product=darjeeling` | OK: Google runs the JavaScript, but the URLs are less clean | None |
| C. `404.html` redirect trick | Pretty URLs | Poor: pages are first served with HTTP 404 | Not recommended |

With option A, the old `?shop=`/`?product=` links keep working by redirecting to the new paths.

**C-2 · Subcategories with almost no products.** Your rule is "only show categories supported by actual products". Mapping your 8 real teas:

| Proposed | Real products |
|---|---|
| Black tea → Assam / Darjeeling / Breakfast / Premium | 1 / 1 / 1 (Assam Breakfast) / 1 (Premium Estate) |
| Green tea → Jasmine / Sencha / Premium green | 1 / 0 / 0 |
| Herbal → Chamomile / Peppermint / Hibiscus | 1 / 0 (sample only) / 0 |
| Flavoured → Floral / Fruity / Spiced | Jasmine (floral), Masala Chai (spiced), Darjeeling (fruity notes; not a flavoured tea) |

Single-product subcategories make the shop look empty. **Recommendation:** use Black, Green, Herbal and Flavoured as the main categories. Turn Assam, Darjeeling and Sylhet into **origin landing pages** ("Explore by origin"). Add a subcategory only once it has 3 or more real products. The system will support subcategories either way, and they appear automatically when products exist.

**C-3 · Sample listings vs "do not create fake inventory".** You asked for 15 sample products last time; this brief says not to show fake inventory and to show only real-product categories. You also say "do not delete existing products". **Options:**
- (a) Keep them in the catalogue but **hide them on the live site** (shown only on your computer, like the sample reviews). **Recommended.**
- (b) Keep them visible, labelled "Sample listing".
- (c) Delete them.

With (a), Teaware, Gifts, Oolong and White tea have no real products, so they disappear from the live navigation until real products are added.

**C-4 · Best Sellers, New Arrivals, Customer Favorites, Premium.** There is no sales data, no reviews and no product dates, and inventing rankings isn't allowed. **Proposal:** these become collections that you choose by hand (a tag on each product). Each section and menu link appears only when it has products. Please tell me which teas belong in each, or leave them hidden for now.

**C-5 · Gallery, storage instructions, 250g/500g sizes, Buy Now.**
- **Gallery:** needs more than one licensed photo per tea. It will appear automatically when you add photos.
- **Storage instructions:** none are on record. I won't invent them; supply one line, or I'll leave the section hidden.
- **Extra sizes:** only with your confirmed prices.
- **Buy Now:** fine. It adds the item and opens checkout.

**C-6 · Catalogue schema.** The brief suggests snake_case field names (`short_description`, `category_ids`…). Renaming working fields would break the order server, carts and tests for no gain. **Proposal:** keep the existing names and **add** the missing ones in the same style: `categoryIds` (multiple categories), `shortDescription`, `createdAt`/`updatedAt`, per-variant stock, and `images[]` for galleries. Old fields keep working, and `npm test` verifies the catalogue.

**C-7 · FAQ, Our Story, Quality, Brewing Guide pages.**
- **Brewing guide:** can be built honestly from the brew data you already have (temperature and time per tea).
- **FAQ, Our Story, Quality:** need your text. I can create the pages with clearly marked placeholder sections hidden from the live site, or wait for content.

**C-8 · Newsletter.** Collecting e-mail addresses is a new use of customer data (AGENTS.md §4). The proposal is a `Subscribers` tab via the existing order server, with a consent line and privacy-policy update. **Needs your approval**, or the section stays out.

**C-9 · Photo licences.**
- `calming-herbal-tea-blend-chamomile-600nw-2568834187.jpg` has the file-name pattern of a stock-photo preview.
- The Premium Estate Blend image is hotlinked from Unsplash.

Your rule 8 forbids unlicensed photos. Please confirm both licences, or I'll swap them for the branded "Photo coming soon" tile until you have your own photos.

**C-10 · Visual redesign scope.** The brief asks for a premium editorial look while preserving the identity. I'll evolve the current tea-chest design: same logo, palette and type, with refined spacing, an editorial home page and calmer cards. I won't replace it with a new theme.

## 5. Proposed phase plan

Each phase is tested, recorded in PLAN.md, and reported with changed files and anything incomplete.

| Phase | Work | Blocked by |
|---|---|---|
| 2 | Announcement bar; new navbar (Shop All, Black, Green, Herbal, Flavoured, Collections, Gifts, Teaware, search, cart); hover+click mega menus with Escape and mobile accordion; new footer (Shop / Customer service / About / Connect / payment methods) with mobile accordion | C-3 (which menu items show), C-7 (About links) |
| 3 | Schema additions (C-6); two-level taxonomy and multi-category mapping; category landing pages with banner, subcategories, count, sort, filters (adds weight and availability) and related categories | C-1, C-2, C-3 |
| 4 | Card polish (quantity, hover); reusable collection sections; homepage order from the brief, showing only sections with real data | C-4 |
| 5 | Product pages (gallery-ready, Buy Now, delivery estimate); quick view; search suggestions with thumbnails and a results page with `?q=` | C-1, C-5 |
| 6 | Cart and checkout regression; live order test (**needs the deployed Apps Script**); mobile pass | Owner deploys server |
| 7 | SEO (per-page HTML if C-1 is A), sitemap, accessibility audit, performance, full tests | C-1 |
