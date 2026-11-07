# FEATURES — Cha Bazaar Feature Specifications

> Status legend: **IMPLEMENTED** · **PROPOSED** · **TBD** (see [PRD.md](PRD.md)).
> Related: [PRD.md](PRD.md) · [PLAN.md](PLAN.md) · [TESTING.md](TESTING.md) · [DESIGN.md](DESIGN.md) · [API.md](API.md)
>
> **Update (v2, 2026-11-07):** the e-commerce upgrade implemented P-01 to P-13, P-15 to P-21 and P-23, plus SRI from P-24. The original proposal text for each feature is kept below as its specification; see **Implementation notes (v2)** at the end for what was built, and where business information is still needed.
>
> IDs: **F-xx** = implemented features; **P-xx** = proposed features (P-01 to P-14 match audit findings A-01 to A-14 in PRD §9).
> "Steps" for implemented features describe how they work. For proposed features they are implementation steps.

## Index

| ID | Feature | Status | Phase |
|---|---|---|---|
| F-01 | Product catalogue | IMPLEMENTED | — |
| F-02 | Search | IMPLEMENTED | — |
| F-03 | Sort | IMPLEMENTED | — |
| F-04 | Category filter | IMPLEMENTED | — |
| F-05 | Cart | IMPLEMENTED | — |
| F-06 | Delivery fee and free-delivery bar | IMPLEMENTED | — |
| F-07 | Checkout form | IMPLEMENTED | — |
| F-08 | Order confirmation (local only) | IMPLEMENTED | — |
| F-09 | Contact form (UI only) | IMPLEMENTED | — |
| F-10 | Motion layer | IMPLEMENTED | — |
| F-11 | Image fallback | IMPLEMENTED | — |
| F-12 | Responsive layout and accessibility basics | IMPLEMENTED | — |
| P-01 | Send orders to the owner | IMPLEMENTED (deploy server) | 1 |
| P-02 | Phone, WhatsApp, Facebook | IMPLEMENTED (add numbers) | 1 |
| P-03 | Delivery zones | IMPLEMENTED | 1 |
| P-04 | Trust content and policies | IMPLEMENTED (owner review) | 2 |
| P-05 | Unit price and pack sizes | IMPLEMENTED | 2 |
| P-06 | bKash and Nagad labels | IMPLEMENTED (add numbers) | 1 |
| P-07 | Quick view and share links | IMPLEMENTED | 3 |
| P-08 | Contrast fix | IMPLEMENTED | 1 |
| P-09 | Motion pause control | IMPLEMENTED | 2 |
| P-10 | Image optimisation | IMPLEMENTED | 2 |
| P-11 | Remove the add-to-cart toast | IMPLEMENTED | 2 |
| P-12 | SEO and social metadata | IMPLEMENTED | 2 |
| P-13 | Deliver contact messages | IMPLEMENTED (deploy server) | 1 |
| P-14 | Image licence review | PROPOSED (owner action) | 1 |
| P-15 | Stock status | IMPLEMENTED | 3 |
| P-16 | Sampler bundle | IMPLEMENTED (no bundles yet) | 3 |
| P-17 | Promo codes | IMPLEMENTED | 3 |
| P-18 | Remember customer details | IMPLEMENTED | 3 |
| P-19 | Analytics | IMPLEMENTED (off by default) | 3 |
| P-20 | Bangla language toggle | IMPLEMENTED | 3 |
| P-21 | Reorder | IMPLEMENTED | 3 |
| P-22 | Own back end and online payment | PROPOSED (needs approval) | 4 |
| P-23 | Automated E2E tests | IMPLEMENTED | 2 |
| P-24 | SRI and CSP hardening | PARTLY (SRI done, CSP proposed) | 2 |

---

## Implemented features

### F-01 Product catalogue: IMPLEMENTED
**How it works:**
1. `products` in `app.js` holds 8 teas (fields in DATABASE.md §1).
2. `applyFilters()` → `renderProducts(list)` builds `<article class="tea">` cards.
3. Each card shows the image, grade, origin, name, description, brew temperature and time, price, pack size, and an **Add to cart** button with `data-id`.

**Acceptance criteria:**
- [x] 8 cards render on load in "Our picks first" order.
- [x] Every dynamic string is escaped.
- [x] Each button has `aria-label="Add <name> to cart"`.

### F-02 Search: IMPLEMENTED
**How it works:** typing in `#searchInput` triggers `applyFilters()`, which matches the lowercased query against name, category, description, grade and origin.

**Acceptance criteria:**
- [x] "assam" returns Assam Breakfast Blend and Premium Estate Blend (origin "Sylhet and Assam").
- [x] "ctc" returns the CTC teas.
- [x] No matches shows the empty state with **Show all teas**, which resets the search and category.

### F-03 Sort: IMPLEMENTED
**How it works:** `#sortSelect` offers `featured`, `price-asc`, `price-desc`, `name-asc` and `name-desc`.

**Acceptance criteria:**
- [x] Price low-to-high starts with ৳350 Everyday Mixed Tea. (v2 adds "Best value per 100g".)
- [x] Sorting works together with search and category.

### F-04 Category filter: IMPLEMENTED
**How it works:** `renderCategories()` builds tabs from the unique `category` values plus "All", each with a count. Clicking one sets `activeCategory` and re-renders.

**Acceptance criteria:**
- [x] Tabs read All 8, Black 4, Spiced 1, Green 2, Herbal 1.
- [x] The active tab has `aria-pressed="true"` and an amber underline.
- [x] On screens under 576px, tabs scroll sideways instead of wrapping.

### F-05 Cart: IMPLEMENTED
**How it works:**
1. `addToCart`, `setQty`, `removeFromCart` and `clearCart` all go through `writeCart()`, which saves `{sku, qty}` (v2: one line per pack size) and calls `renderCart()`.
2. The cart panel (Bootstrap offcanvas) lists items with quantity controls.
3. A `storage` listener re-renders when another tab changes the cart.

**Acceptance criteria:**
- [x] Adding the same tea twice gives qty 2, not two lines.
- [x] − at qty 1 removes the line.
- [x] **Empty cart** asks for confirmation first.
- [x] The cart survives a page reload.
- [x] Unknown IDs or invalid quantities in storage are ignored.

### F-06 Delivery fee and free-delivery bar: IMPLEMENTED
**How it works (v2):** `deliveryFee(subtotal, area)` in `shared.js` uses the zones in `catalog.js`: Inside Dhaka ৳60 (free from ৳1,500), Outside Dhaka ৳120. The cart shows progress toward free delivery; the server applies the same rule.

**Acceptance criteria:**
- [x] Subtotal ৳1,410 → delivery ৳60, total ৳1,470, "Add ৳90 more for free delivery."
- [x] Subtotal ৳1,500 → delivery "Free".

### F-07 Checkout form: IMPLEMENTED
**How it works:**
1. **Checkout** (disabled when the cart is empty) closes the cart panel and opens `#checkoutModal`, with the summary built by `renderCheckoutSummary()`.
2. Native constraint validation runs on the fields: name required; mobile matching `(\+?88)?01[3-9]\d{8}`; email optional; delivery area required; address required; payment (Cash on delivery / bKash / Nagad). The server validates again.
3. Spaces and dashes are stripped from the mobile number as the user types.

**Acceptance criteria:**
- [x] Submitting empty shows field-specific messages and focuses the first invalid field.
- [x] "017 1234-5678" is accepted (becomes `01712345678`).
- [x] "12345" is rejected with "Enter an 11-digit number starting with 01."

### F-08 Order confirmation: IMPLEMENTED (server-confirmed in v2)
**How it works (v2):** a valid submit sends the order to the Apps Script server; only after `ok:true` does the browser save `{id, createdAt, total, items}` (no personal data) to `tea-shop-orders`, empty the cart and open `#confirmModal` with the **server** order ID, total and payment steps.

**Acceptance criteria:**
- [x] The order ID matches `^CB-[0-9A-Z]+$`.
- [x] The cart count is 0 after ordering.
- [x] The owner receives the order (v2, P-01; after deployment).

### F-09 Contact form: IMPLEMENTED (sent to the Sheet in v2)
**How it works (v2):** name, email-or-phone and message are validated, then sent to the `Messages` tab (P-13). Success is shown only after the server confirms.

### F-10 Motion layer: IMPLEMENTED
**How it works:** see DESIGN.md §7. `animations.js` adds the `.motion` class to `<html>` only when reduced motion isn't requested.

**Acceptance criteria:**
- [x] With reduced motion on: no `.motion` class, no leaves, and all content visible.
- [x] Section titles reveal (the parent element is observed, because clipped elements never count as visible).
- [x] No horizontal scroll caused by the ticker or leaves.

### F-11 Image fallback: IMPLEMENTED
**How it works:** a capture-phase `error` listener swaps a broken `<img>` for `Tea/MIX_tea.jpg`, once only.

### F-12 Responsive layout and accessibility basics: IMPLEMENTED
**How it works:** Bootstrap grid with the breakpoints in DESIGN.md §4; skip link, focus outlines, labels and ARIA attributes in DESIGN.md §8.

**Acceptance criteria:**
- [x] No horizontal scroll at 390px and 1280px wide (tested).
- [x] Contrast ≥ 4.5:1 everywhere (v2, P-08).

---

## Proposed features

### P-01 Send orders to the owner: IMPLEMENTED · Phase 1 · audit A-01
**Inputs needed:** Q-1 (destination), a Google account, P-02's WhatsApp number for the fallback.

**Steps:**
1. Create the Google Sheet with the `Orders` tab (and optionally `Products`), as in DATABASE.md §2.
2. Write the Apps Script `doPost`:
   - parse the JSON
   - check the honeypot
   - validate the fields
   - recalculate prices from the server price list
   - generate the order ID
   - append the row
   - email the owner (`MailApp`)
   - return the JSON described in API.md §1
3. Add rate limiting with `CacheService` and a lock with `LockService` (AUTH_SECURITY.md §5).
4. Deploy as a web app and put the URL in the `ORDER_ENDPOINT` constant.
5. In `app.js`, make the submit handler `async`:
   - disable the button and show "Placing order…"
   - `fetch` with a 15s timeout
   - on `ok:true`, show the confirmation using the **server** order ID and total
   - on failure, keep the cart and show an error with a **Send order on WhatsApp** link (API.md §2)
6. After a successful send, store only `{id, createdAt, total}` locally.
7. Add a hidden honeypot field `website` to the form.

**Acceptance criteria:**
- [ ] A valid order appears as one row in the Sheet within 60s, with all fields.
- [ ] The owner gets an email per order.
- [ ] Tampering with prices in the browser doesn't change the Sheet totals.
- [ ] Offline or a server error shows the error and the WhatsApp link, and the cart isn't emptied.
- [ ] Double-clicking **Place order** creates only one row.
- [ ] Spam with the honeypot filled is rejected.
- [ ] No full personal data is left in `localStorage` after success.

### P-02 Phone, WhatsApp, Facebook: IMPLEMENTED · Phase 1 · audit A-02
**Steps:**
1. Add the `WHATSAPP_NUMBER` constant.
2. Contact list: `tel:` link, WhatsApp link and Facebook link.
3. Floating WhatsApp button, bottom-left, so it doesn't overlap the toast.
4. Replace the placeholder email, address and hours.

**Acceptance criteria:**
- [ ] Tapping the phone link on mobile opens the dialler.
- [ ] The WhatsApp button opens a chat with a pre-filled greeting.
- [ ] The button is visible at every width, doesn't cover the cart or checkout buttons, and has an accessible name.

### P-03 Delivery zones: IMPLEMENTED · Phase 1 · audit A-03
**Steps:**
1. Add `DELIVERY_ZONES` config with fees and estimates.
2. Checkout gets a required zone radio (Inside / Outside Dhaka) above City.
3. `deliveryFee(subtotal, zone)`; the cart panel shows "from ৳X" until a zone is chosen.
4. The server uses the same table (P-01).

**Acceptance criteria:**
- [ ] The fee and total update immediately when the zone changes.
- [ ] The free-delivery threshold rule is applied per the owner's policy (TBD).
- [ ] The confirmation shows the estimate.

### P-04 Trust content and policies: IMPLEMENTED · Phase 2 · audit A-04
**Steps:**
1. Testimonials block using **real** quotes supplied by the owner (AGENTS.md rule 5).
2. A one-line guarantee near the cart total.
3. Delivery, Returns and Privacy sections or pages, linked from the footer.

**Acceptance criteria:**
- [ ] The policies are reachable from the footer on every page.
- [ ] The privacy text describes the order data actually collected (DATABASE.md §4).

### P-05 Unit price and pack sizes: IMPLEMENTED · Phase 2 · audit A-05
**Steps:**
1. Add `weight_g`, then `variants`.
2. Show "৳X per 100g" on cards.
3. Add a pack-size selector.
4. Change the cart key to `{id, variant, qty}` and migrate old carts.

**Acceptance criteria:**
- [ ] Per-100g prices are correct for all teas.
- [ ] Old carts don't throw errors.
- [ ] The server price list matches.

### P-06 bKash and Nagad labels: IMPLEMENTED · Phase 1 · audit A-06
**Steps:** change the payment radios to Cash / bKash / Nagad, with values `cash`, `bkash`, `nagad`. Show official logos only if their brand guidelines allow it (TBD). The confirmation text names the chosen method.

**Acceptance criteria:**
- [ ] Each option has a label.
- [ ] The confirmation says "Pay ৳X by bKash when it arrives" (or the chosen method).

### P-07 Quick view and share links: IMPLEMENTED · Phase 3 · audit A-07
**Steps:**
1. Add `slug` to each product.
2. Clicking a card's image or name opens a modal with a large image, details and a quantity picker.
3. Update the URL to `#tea/<slug>`; opening that URL opens the modal.

**Acceptance criteria:**
- [ ] The link opens straight to the tea.
- [ ] Focus is trapped in the modal and returns to the card on close.
- [ ] Esc closes it.

### P-08 Contrast fix: IMPLEMENTED · Phase 1 · audit A-08
**Steps:** change `--liquor` to about `#9A5B00` and `--liquor-2` to about `#7F4B00`, then re-measure all pairs in DESIGN.md §2.

**Acceptance criteria:**
- [ ] White on amber ≥ 4.5:1.
- [ ] Amber text on white ≥ 4.5:1.
- [ ] Owner approves the new colour.

### P-09 Motion pause control: IMPLEMENTED · Phase 2 · audit A-09
**Steps:** a small, labelled **Pause animation** toggle that stops the ticker and leaves. Remember the choice in `localStorage`.

**Acceptance criteria:**
- [ ] Works with keyboard and touch.
- [ ] The state persists across reloads.
- [ ] Meets WCAG 2.2.2 (Pause, Stop, Hide).

### P-10 Image optimisation: IMPLEMENTED · Phase 2 · audit A-10
**Steps:**
1. Convert the images to WebP at about 600px wide (≤ 60 KB each), keeping JPEG fallbacks with `<picture>` (TBD).
2. Add `width` and `height` to every image.
3. Host the Premium image locally (see P-14).

**Acceptance criteria:**
- [ ] Total image weight on first load is under 400 KB.
- [ ] No layout shift from images.

### P-11 Remove the add-to-cart toast: IMPLEMENTED · Phase 2 · audit A-11
**Steps:** remove the `showToast` call from `addToCart`. Keep the toast for the contact form and errors.

**Acceptance criteria:**
- [ ] Adding to cart still gives the "Added" label and the count pop.
- [ ] Screen readers still hear an announcement (the count element needs `aria-live`, TBD).

### P-12 SEO and social metadata: IMPLEMENTED · Phase 2 · audit A-12
**Steps:** add Open Graph and Twitter tags, `Product`/`Offer` JSON-LD for each tea, a canonical URL, and a 1200×630 social image (TBD).

**Acceptance criteria:**
- [ ] The Facebook sharing debugger shows the title, description and image.
- [ ] Google's Rich Results Test validates the products.

### P-13 Deliver contact messages: IMPLEMENTED · Phase 1 · audit A-13
**Steps:** the contact form posts `action:"contact"` (API.md §1) and the server appends to the `Messages` tab. Add a loading state and an error state.

**Acceptance criteria:**
- [ ] The message appears in the Sheet.
- [ ] On failure the form isn't cleared.

### P-14 Image licence review: PROPOSED · Phase 1 · audit A-14
**Steps:** confirm a licence for each photo, or replace it with the shop's own photos. Download the Unsplash image and host it locally with credit if its licence requires one.

**Acceptance criteria:**
- [ ] Every image has a recorded source and licence in README.md.

### P-15 to P-21 Growth features: IMPLEMENTED · Phase 3

| ID | Steps (summary) | Acceptance criteria |
|---|---|---|
| P-15 Stock status | Read `stock` from the Sheet `Products` tab at load (read endpoint TBD); show "Sold out" or "Only N left"; disable Add to cart at 0 | Sold-out teas can't be added; the server rejects orders over stock |
| P-16 Sampler bundle | Add a bundle product made of 3 smaller packs | It appears in the catalogue and cart like any product |
| P-17 Promo codes | Code field in checkout; validated and applied **server-side** only | An invalid code shows an error; the discount appears in the Sheet total |
| P-18 Remember details | Opt-in checkbox; save to `tea-shop-customer`; prefill next time | No saving without opt-in; a "Forget me" link clears it |
| P-19 Analytics | Add the owner-chosen tool; track view, add to cart, checkout opened, order placed | No personal data sent; mentioned in the privacy policy |
| P-20 Bangla toggle | Text strings moved into a dictionary; a language switch saved locally | Every UI string is translated; the `lang` attribute updates |
| P-21 Reorder | A "Reorder" button in the confirmation and local history refills the cart | Unknown or sold-out items are skipped with a notice |

### P-22 Own back end and online payment: PROPOSED · Phase 4 · **needs approval**
Out of scope until approved. See ARCHITECTURE.md §7 and INTEGRATIONS.md §3.4.

### P-23 Automated E2E tests: IMPLEMENTED · Phase 2 · **needs approval**
See TESTING.md §5. Adds a dev-only `package.json` with Playwright.

### P-24 SRI and CSP hardening: PARTLY · Phase 2
See AUTH_SECURITY.md §4.

**Acceptance criteria:**
- [ ] All CDN tags have `integrity` and `crossorigin`.
- [ ] The CSP blocks inline script injection without breaking the site.


---

## Implementation notes (v2)

| ID | What was built | Where | Still needs |
|---|---|---|---|
| P-01 | Checkout POSTs `{action:"order"}` to Apps Script. The server validates, re-prices from the live `catalog.js`, applies delivery and promo, checks stock, de-duplicates by `clientRequestId` (6 h), rate-limits, writes `Orders` + `Order Items`, and e-mails the owner. The browser shows a loading state, blocks repeat clicks, shows confirmation only on `ok:true`, and offers WhatsApp/phone on failure. Local history keeps no personal data | `app.js` (checkout), `apps-script/Code.gs` | Deploy the server; set `ORDER_ENDPOINT` |
| P-02 | `tel:` links, floating WhatsApp with cart contents, WhatsApp "ask about this order" with order ID, Facebook and email links in contact and footer. Unset values are hidden | `shared.js`, `app.js`, `index.html` | `BUSINESS_PHONE`, `WHATSAPP_NUMBER`, `FACEBOOK_URL`, `BUSINESS_EMAIL` |
| P-03 | Delivery-area radios (Inside Dhaka ৳60, 1–2 days; Outside Dhaka ৳120, 3–5 days), required, with live totals; zones configurable in `catalog.js`; same rule on the server | `catalog.js` `delivery.zones`, `shared.js` `deliveryFee`, `Code.gs` `deliveryFee_` | Confirm whether free delivery over ৳1,500 should apply outside Dhaka (currently inside only) |
| P-04 | Guarantee band, delivery/payment/returns summary, review component (genuine reviews only; labelled samples only on localhost), four bilingual policy pages linked from the footer | `index.html` `#trust`, `delivery/returns/privacy/terms.html` | Real reviews; owner review of policy text and `RETURN_WINDOW_DAYS` |
| P-05 | Variants with `sku`, `weightG`, `price`, `stock`; card selector and quick-view chips; price per 100g calculated; cart stores `{sku, qty}`; old carts migrated | `catalog.js`, `app.js` | Prices for extra pack sizes (Chamomile 100g/250g are `null` and hidden) |
| P-06 | Cash on delivery / bKash / Nagad with manual payment steps (after confirmation call, order ID as reference); no gateway claimed | `index.html`, `app.js` `paymentInstructions` | `BKASH_NUMBER`, `NAGAD_NUMBER`, account types; official logos if permitted |
| P-07 | Quick-view modal; `#tea/<slug>` deep links; back/forward; invalid slug message; Copy link; page title per tea | `app.js` quick-view section | — |
| P-08 | `--liquor` → `#9A5B00` (5.4:1 on white) | `styles.css` | — |
| P-09 | Pause/play button in the hero (keyboard and touch, remembered); reduced motion respected | `animations.js`, `animations.css` | — |
| P-10 | WebP copies (cards 600×450, 16–65 KB; large ≤1000px), width/height on every image, lazy loading below the fold, JPEG fallback | `tools/optimize-images.py`, `Tea/webp/` | The Unsplash image is still hotlinked (see P-14) |
| P-11 | Add to cart now gives a count update plus an "Added" button state, with a screen-reader announcement. No toast or flying image | `app.js` `flashAdded` | — |
| P-12 | Titles, descriptions, canonical, Open Graph, Twitter, `og-image.jpg`, Product JSON-LD (BDT, SKU, no ratings, availability only with stock data), `sitemap.xml`, `robots.txt` | `index.html`, policy pages, `app.js` `injectStructuredData` | Update URLs if you move to your own domain |
| P-13 | Contact form posts `{action:"contact"}` to the `Messages` tab; shows alternatives when not set up | `app.js`, `Code.gs` | Deploy the server |
| P-15 | `stock` per pack: `0` = Sold out (disabled), `1–5` = "Only N left"; server enforces | `catalog.js`, `app.js`, `Code.gs` | Real stock numbers (stock is not reduced automatically) |
| P-16 | Sampler section renders products with `"type": "bundle"`; hidden while there are none | `index.html` `#samplers` | Define a bundle and its price |
| P-17 | Promo field; codes checked and applied only on the server from the `Promos` tab; none exist by default | `app.js`, `Code.gs` `evaluatePromo_` | Add codes to the Sheet if wanted |
| P-18 | Opt-in "Save my details on this device" + "Forget my saved details" | `app.js` | — |
| P-19 | Optional Plausible or GA4 (consent first): `view_item`, `add_to_cart`, `begin_checkout`, `purchase`, `checkout_abandoned` | `analytics.js` | Choose a provider |
| P-20 | Language toggle (remembered); all UI, checkout, errors and policies in Bangla; product names untranslated | `i18n.js`, policy pages | Native-speaker review of the Bangla text |
| P-21 | "Your recent orders" in the cart panel with Reorder (skips unavailable items) | `app.js` | — |
| P-23 | `npm test`: static checks, 25 server tests (real `Code.gs` on simulated Google services), browser tests | `tests/` | — |
| P-24 | SRI + `crossorigin` on all CDN files. CSP still proposed | `index.html`, policy pages | CSP |
