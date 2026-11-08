# Cha Bazaar — Tea Shop

A Bangladeshi online tea shop. You can browse estate teas from Sylhet, Assam and Darjeeling, choose pack sizes, and order with cash on delivery, bKash or Nagad. Orders go to a private Google Sheet through a Google Apps Script server that re-checks every price. The site is plain HTML, CSS and JavaScript on Bootstrap 5, with **no build step**. It's available in English and Bangla.

> **Before going live**, fill in `config.js` and deploy the order server (`apps-script/README.md`). Until `ORDER_ENDPOINT` is set, checkout refuses to place orders and points customers to WhatsApp or phone. It never pretends an order went through.

## Features

| Area | What it does |
|---|---|
| Store layout (v3) | Tea / Teaware / Gifts mega menus; category pages (`?shop=black-tea`) with a filter sidebar (origin, caffeine, flavour, price), search and sort; full product pages (`?product=darjeeling`) with related products; home page with category tiles, featured teas, gifts and teaware; 15 clearly marked **sample listings** (not for sale) as templates |
| Catalogue | 8 teas with grade, origin, tasting notes, ingredients and brewing guide; pack sizes; price per 100g; sold-out and low-stock labels (from real stock numbers only) |
| Quick view | Click a tea for full details, pack size, quantity and **Copy link**. Links like `#tea/darjeeling` open it directly; back/forward work |
| Cart | Pack-size aware, saved in the browser, synced across tabs, free-delivery progress, reorder from recent orders |
| Checkout | Name, BD mobile, email (optional), **delivery area** (Inside Dhaka ৳60, 1–2 days; Outside Dhaka ৳120, 3–5 days), address, **Cash on delivery / bKash / Nagad** with manual payment steps, rider note, promo code, opt-in "remember me" |
| Real orders | Sent to Google Sheets via Apps Script. The server validates, re-prices from `catalog.js`, blocks duplicates and spam, and returns an order ID like `CB-261107-0001`. Confirmation is shown **only** after the server confirms |
| Contact | Tap-to-call, floating WhatsApp button (message includes the cart), Facebook, email; the contact form saves to the Sheet |
| Trust | Freshness guarantee, delivery/payment/returns summary, review section (shows genuine reviews only), four policy pages |
| Bangla | Language toggle; UI, checkout, messages and policies translated; product names and ৳ kept as they are |
| Accessibility | WCAG AA contrast, keyboard support, Escape closes panels, labelled controls, pause button for moving content, reduced-motion support |
| SEO | Titles, descriptions, canonical URLs, Open Graph and Twitter tags, social image, Product JSON-LD (BDT, no fake ratings or availability), `sitemap.xml`, `robots.txt` |
| Performance | WebP images (card images 16–65 KB), fixed image sizes, lazy loading, SRI-pinned CDN files, no framework |
| Analytics | Optional Plausible or GA4 (GA4 only after consent); tracks views, add to cart, checkout started, orders and abandonment, never personal data |

## Quick start (your computer)

```bash
git clone https://github.com/Sanjidmolik/Tea_shop.git
```

```bash
cd Tea_shop
```

```bash
python3 -m http.server 8000
```

Open http://localhost:8000. A yellow **Setup needed** bar lists any settings still missing. It only appears on your own computer, never on the live site. Windows and macOS details are in [SETUP.md](SETUP.md).

## Configure

| File | What to change |
|---|---|
| `config.js` | Order server URL, phone, WhatsApp, Facebook, email, bKash/Nagad numbers, return window, analytics |
| `catalog.js` | Departments, categories, filters, collections, products (incl. sample listings to replace), sizes and prices, stock, delivery charges, genuine reviews. **Keep it strict JSON** (see the comment at the top) |
| `apps-script/` | The order server. Follow `apps-script/README.md` once |

Phone numbers use the international format without `+`, e.g. `8801712345678`.

## Commands

| Task | Command |
|---|---|
| Serve the site | `python3 -m http.server 8000` (Windows: `py -m http.server 8000`) |
| Serve with a working local order server | `npm run serve`, then set `ORDER_ENDPOINT` to `http://localhost:8790/exec` while testing |
| Install test tools (once) | `npm install` and `npx playwright install chromium` |
| All tests | `npm test` |
| Static checks only | `npm run check` |
| Re-make WebP images after adding photos | `npm run images` (needs Python + Pillow) |
| Re-make the social image | `npm run og-image` |
| Build | None needed |

## Project structure

```
index.html            shop page
delivery.html  returns.html  privacy.html  terms.html   policy pages (English + Bangla)
config.js             business settings (public, no secrets)
catalog.js            products, prices, pack sizes, stock, delivery charges, reviews
i18n.js               English and Bangla text
shared.js             helpers shared by every page (contact links, language, delivery)
app.js                cart, product cards, quick view, checkout, contact
store.js              menus, home sections, shop listing + filters, product pages, URLs
analytics.js          optional Plausible / GA4
animations.js / .css  optional motion layer (shop works without it)
styles.css            design tokens and components
apps-script/          Google Apps Script order server + deployment guide
tests/                static checks, server tests, browser tests, local mock server
tools/                image optimiser, social-image renderer
Tea/                  original photos; Tea/webp/ optimised copies
og-image.jpg  robots.txt  sitemap.xml
```

## Dependencies

- **Runtime:** Bootstrap 5.3.3 and Bootstrap Icons 1.11.3 (jsDelivr, pinned with SRI hashes); Google Fonts (Big Shoulders Stencil, Hind Siliguri). No npm packages.
- **Development only:** Playwright (tests and social image), Python Pillow (image optimiser).

## Deploy

1. Deploy the order server: [apps-script/README.md](apps-script/README.md).
2. Fill in `config.js`.
3. Merge into `main`.
4. In the repo, open **Settings → Pages**, choose *Deploy from a branch*, then `main` and `/ (root)`.
5. Place a test order from your phone and check the Sheet.

If you use your own domain, update `SITE_URL` in `config.js`, the canonical/OG URLs in the five HTML files, `robots.txt` and `sitemap.xml`.

## Documentation

[PRD](PRD.md) · [DESIGN](DESIGN.md) · [ARCHITECTURE](ARCHITECTURE.md) · [DATABASE](DATABASE.md) · [API](API.md) · [FEATURES](FEATURES.md) · [PLAN](PLAN.md) · [SETUP](SETUP.md) · [TESTING](TESTING.md) · [DEBUGGING](DEBUGGING.md) · [AUTH_SECURITY](AUTH_SECURITY.md) · [INTEGRATIONS](INTEGRATIONS.md) · [MCP](MCP.md) · [AGENTS](AGENTS.md) · [Order server](apps-script/README.md)

## Licence

TBD. Product photo licences must also be confirmed before launch (see PRD A-14).
