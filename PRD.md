# PRD — Cha Bazaar Product Requirements

> **Status legend** used in every Cha Bazaar document
> - **IMPLEMENTED**: verified in the current source code (commit `1b25d2e`, branch `claude/zealous-wozniak-iioncf`)
> - **PROPOSED**: not built yet; needs owner approval before work starts
> - **TBD**: information the project owner still has to provide
>
> Related: [FEATURES.md](FEATURES.md) · [PLAN.md](PLAN.md) · [DESIGN.md](DESIGN.md) · [ARCHITECTURE.md](ARCHITECTURE.md)

## 1. Product summary

Cha Bazaar is a single-page online tea shop for customers in Bangladesh. It sells loose-leaf and blended teas from Sylhet, Assam, Darjeeling and elsewhere, priced in Bangladeshi taka (৳), with cash or mobile-banking payment on delivery.

**Current state (v2, 2026-11-07):** a static front end (HTML, CSS, vanilla JavaScript, Bootstrap 5) plus a Google Apps Script order server that writes to a Google Sheet. Real order submission, delivery areas, bKash/Nagad (manual), trust pages, pack sizes, quick view, Bangla and SEO are implemented. **Going live still needs the owner's business details and a one-time server deployment** (see §11 and [apps-script/README.md](apps-script/README.md)).

## 2. Business goals

| ID | Goal | Measure | Status |
|---|---|---|---|
| G-1 | Take real orders online | Every placed order reaches the owner within 1 minute | PROPOSED (blocked by A-01) |
| G-2 | Build trust with first-time buyers | Conversion rate; % of orders from new customers | PROPOSED; target values TBD |
| G-3 | Raise average order value | Average order value vs. ৳1,500 free-delivery threshold | Partly IMPLEMENTED (free-delivery bar) |
| G-4 | Have a distinctive brand that isn't mistaken for a template | Qualitative; brand recall | IMPLEMENTED (tea-chest identity, see DESIGN.md) |
| G-5 | Work well on mobile data | Page weight; Largest Contentful Paint under 2.5 s on 4G | PROPOSED (images too heavy, A-10) |

## 3. Target customers

| Persona | Description | Needs |
|---|---|---|
| Everyday tea drinker (Dhaka) | Buys strong CTC or mixed tea for daily *dudh cha* | Low price, quick delivery, cash on delivery |
| Tea enthusiast | Wants Darjeeling, green or jasmine teas and cares about grade and origin | Tea details (grade, origin, brewing), freshness |
| Gift buyer | Buys for family, Eid or the office | Bundles, nice packaging, delivery outside Dhaka |
| Office/bulk buyer | Orders for offices or events | Contact channel, bulk pricing (TBD) |

Exact customer research: **TBD**.

## 4. Scope

### 4.1 Implemented features (summary; details in FEATURES.md)

| ID | Feature | Status |
|---|---|---|
| F-01 | Product catalogue: 8 teas with grade, origin, pack size, price and brewing guide | IMPLEMENTED |
| F-02 | Search by name, category, description, grade and origin | IMPLEMENTED |
| F-03 | Sort: featured, price ascending/descending, name A–Z/Z–A | IMPLEMENTED |
| F-04 | Category filter tabs with counts (All, Black, Spiced, Green, Herbal) | IMPLEMENTED |
| F-05 | Cart: add, change quantity, remove, empty; saved in `localStorage`; synced across tabs | IMPLEMENTED |
| F-06 | Delivery by area (Inside Dhaka ৳60 / Outside Dhaka ৳120), free inside Dhaka from ৳1,500, with progress bar | IMPLEMENTED (v2) |
| F-07 | Checkout: name, BD mobile, email, delivery area, address, Cash on delivery / bKash / Nagad, note, promo, remember-me; validated in the browser and on the server | IMPLEMENTED (v2) |
| F-08 | Order confirmation, shown only after the server confirms the order | IMPLEMENTED (v2, via P-01) |
| F-09 | Contact form, saved to the Sheet `Messages` tab | IMPLEMENTED (v2, via P-13) |
| F-10 | Motion layer (hero, ticker, reveals, fly-to-cart) honouring reduced motion | IMPLEMENTED |
| F-11 | Broken-image fallback | IMPLEMENTED |
| F-12 | Responsive layout and accessibility basics (skip link, focus styles, labels) | IMPLEMENTED |

Proposed features P-01 to P-24 and their v2 status are listed in [FEATURES.md](FEATURES.md#index). All of P-01 to P-13 and P-15 to P-21 and P-23 are now IMPLEMENTED; P-14 (photo licences) needs the owner; P-22 (online payment) is not approved; P-24 is partly done (SRI, no CSP yet).

### 4.2 Out of scope (for now)

- Customer accounts and login (no authentication exists or is planned for Phase 1; see AUTH_SECURITY.md)
- Online card payment
- Multi-vendor or marketplace features
- Native mobile apps

## 5. User stories

| ID | As a… | I want to… | So that… | Feature | Status |
|---|---|---|---|---|---|
| US-01 | shopper | browse teas with photos, prices and pack sizes | I can choose what to buy | F-01 | IMPLEMENTED |
| US-02 | shopper | search and filter by type | I can find a tea quickly | F-02, F-04 | IMPLEMENTED |
| US-03 | shopper | see grade, origin and brewing guide | I know what I'm buying | F-01 | IMPLEMENTED |
| US-04 | shopper | add teas to a cart and change quantities | I can build an order | F-05 | IMPLEMENTED |
| US-05 | shopper | see how far I am from free delivery | I can decide to add more | F-06 | IMPLEMENTED |
| US-06 | shopper | check out with my address and pay on delivery | I don't need a card | F-07 | IMPLEMENTED (UI) |
| US-07 | shop owner | receive every order with customer details | I can deliver it | P-01 | IMPLEMENTED (needs deployment) |
| US-08 | shopper | call or WhatsApp the shop | I can ask before paying cash | P-02 | IMPLEMENTED (needs numbers) |
| US-09 | shopper outside Dhaka | see the correct delivery fee and time | there are no surprises | P-03 | IMPLEMENTED |
| US-10 | first-time shopper | see reviews and a freshness guarantee | I trust the shop | P-04 | IMPLEMENTED (needs genuine reviews) |
| US-11 | shopper | compare price per 100g and choose pack sizes | I get fair value | P-05 | IMPLEMENTED |
| US-12 | shopper | know that bKash and Nagad are accepted | I can pay the way I prefer | P-06 | IMPLEMENTED |
| US-13 | shopper | open a tea's details and share its link | I can learn more and show others | P-07 | IMPLEMENTED |
| US-14 | shop owner | receive contact-form messages | I can answer questions | P-13 | IMPLEMENTED (needs deployment) |
| US-15 | shopper with motion sensitivity | pause moving content | the page is comfortable to use | P-09 | IMPLEMENTED |

## 6. Functional requirements

### 6.1 Implemented

| ID | Requirement | Source |
|---|---|---|
| FR-01 | The catalogue renders from the `products` array in `app.js` | `app.js` lines 11–38 |
| FR-02 | Search matches `name`, `category`, `description`, `grade` and `origin`, case-insensitively | `applyFilters()` |
| FR-03 | The cart stores only `{ id, qty }`; name, price and image always come from the catalogue | `readCart()`, `writeCart()` |
| FR-04 | Pressing − at quantity 1 removes the item | `setQty()` |
| FR-05 | Delivery is ৳0 for an empty cart or a subtotal ≥ ৳1,500, otherwise ৳60 | `deliveryFee()` |
| FR-06 | Checkout requires name, mobile (`(\+?88)?01[3-9]\d{8}`), address and city; email is optional but must be valid if given | `index.html` checkout form |
| FR-07 | Spaces and dashes are stripped from the mobile number as the user types | `app.js` `custPhone` input handler |
| FR-08 | A placed order gets an ID `CB-<base36 timestamp><2 random base36 chars>`, is appended to `tea-shop-orders`, and the cart is emptied | `generateOrderId()`, checkout submit handler |
| FR-09 | Checkout and Empty cart buttons are disabled when the cart is empty | `renderCart()` |
| FR-10 | Cart changes in one tab update other open tabs | `storage` event listener |
| FR-11 | All animation is skipped when `prefers-reduced-motion: reduce` is set | `animations.js`, `animations.css` |

### 6.2 Proposed

| ID | Requirement | Feature |
|---|---|---|
| — | *v2: FR-20 to FR-25 are all IMPLEMENTED; FR-24 shows price per 100g except on 100g packs* | |
| FR-20 | Every placed order is sent to the owner's order store (Google Sheet, TBD) and the customer only sees "Order placed" after it succeeds | P-01 |
| FR-21 | If sending fails, the customer sees a clear error and a WhatsApp fallback with the order pre-filled | P-01, P-02 |
| FR-22 | The server recalculates totals from its own price list; client prices are never trusted | P-01 |
| FR-23 | Delivery fee depends on the zone (Inside Dhaka / Outside Dhaka; rates TBD) | P-03 |
| FR-24 | Each card shows price per 100g | P-05 |
| FR-25 | Contact-form messages are delivered to the owner | P-13 |

## 7. Non-functional requirements

| ID | Category | Requirement | Status |
|---|---|---|---|
| NFR-01 | Performance | Total image weight under 400 KB on first load; each card image ≤ 60 KB WebP | PROPOSED (currently ~776 KB of local JPEGs) |
| NFR-02 | Performance | No layout shift from images (`width`/`height` set) | PROPOSED |
| NFR-03 | Accessibility | WCAG 2.2 AA: contrast ≥ 4.5:1 for text, keyboard operable, pausable motion | Partly IMPLEMENTED; see A-08, A-09 |
| NFR-04 | Compatibility | Latest two versions of Chrome, Edge, Firefox and Safari; Android Chrome; iOS Safari | IMPLEMENTED for Chromium (tested); others TBD |
| NFR-05 | Responsiveness | No horizontal scroll from 320px to 1920px wide | IMPLEMENTED (tested at 390px and 1280px) |
| NFR-06 | Privacy | Customer personal data is only sent to the owner's order store over HTTPS | PROPOSED |
| NFR-07 | Security | No secrets in front-end code; all external input escaped before rendering | IMPLEMENTED (`escapeHtml`); see AUTH_SECURITY.md |
| NFR-08 | Hosting | Runs as static files with no build step | IMPLEMENTED |
| NFR-09 | Maintainability | Products, prices and delivery rules editable in one place | IMPLEMENTED (top of `app.js`) |

## 8. Acceptance criteria (product level)

The product is **launch-ready** when all of these are true (v2 status in brackets):

1. A test order placed on the live site appears in the owner's order store with all customer fields and items (P-01). *[Code done and tested against the real `Code.gs`; needs deployment]*
2. A real phone number and WhatsApp button are visible on every screen size (P-02). *[Code done; needs the numbers in `config.js`]*
3. The delivery fee matches the chosen zone (P-03). *[Done]*
4. Checkout names bKash and Nagad as accepted on-delivery options (P-06). *[Done; numbers needed]*
5. All text meets 4.5:1 contrast (P-08). *[Done: amber now `#9A5B00`]*
6. All placeholder content (email, hours, prices, grades, origins) has been replaced or confirmed by the owner (see the TBD list in §11).
7. The tests in [TESTING.md](TESTING.md) §5 (E2E) and §6 (manual QA) pass.

Feature-level criteria are in [FEATURES.md](FEATURES.md).

## 9. E-commerce audit findings (complete)

Audit performed on 2026-11-07 against the current build. Grades are per area.

| Area | Grade | Summary |
|---|---|---|
| Visual design and brand | A− | Memorable, specific to tea, consistent |
| Product presentation | B | Good tea data; missing reviews, stock status, detail view |
| Cart and checkout | C+ | Smooth flow, but orders go nowhere |
| Trust and conversion | D | No phone, policies, reviews or social proof |
| Accessibility | B− | Good basics; two contrast failures and motion that can't be paused |
| Performance and SEO | C | Heavy images, no metadata |

### Findings

> **v2 status:** A-01 to A-13 are fixed in code (A-01, A-02 and A-13 need deployment or business details). A-14 (photo licences) is still open; it needs the owner. Nice-to-haves A-15 to A-21 are implemented.


| ID | Severity | Finding | Evidence | Fix → feature |
|---|---|---|---|---|
| A-01 | 🔴 Critical | Orders never reach the owner | Orders are written only to the customer's `localStorage` (`tea-shop-orders`) | Send orders to Google Sheets, email or WhatsApp → **P-01** |
| A-02 | 🔴 Critical | No phone number or WhatsApp | The contact section has only a placeholder email `hello@chabazaar.example` | Tap-to-call, floating WhatsApp, Facebook link → **P-02** |
| A-03 | 🟠 High | Flat ৳60 delivery doesn't match the local norm | `DELIVERY_FEE = 60` for every address | Inside/Outside Dhaka zones and delivery estimates → **P-03** |
| A-04 | 🟠 High | No trust signals | No reviews, guarantee, returns, terms or privacy pages | Testimonials, guarantee, policy pages → **P-04** |
| A-05 | 🟠 High | Prices are hard to compare across 50–250g packs | ৳480 for 50g Chamomile looks cheaper than ৳950 for 250g | Price per 100g; multiple pack sizes → **P-05** |
| A-06 | 🟠 High | "Mobile banking" is too vague | Checkout radio label | Name bKash and Nagad, with logos → **P-06** |
| A-07 | 🟠 High | No product detail view or shareable link | Cards only | Quick-view panel and `#tea/<slug>` links → **P-07** |
| A-08 | 🟡 Medium | Amber fails contrast | White on `#C27A14` = 3.45:1; amber text on white = 3.45:1 (needs 4.5:1) | Darken amber to about `#9A5B00` → **P-08** |
| A-09 | 🟡 Medium | Endless motion with no pause control | Ticker pauses only on mouse hover; leaves never stop (WCAG 2.2.2) | Pause button or limited loops → **P-09** |
| A-10 | 🟡 Medium | Heavy images, no dimensions | `Assam_Tea.jpg` 307 KB, `Loose_Jasmine_Tea_Leaves.jpg` 213 KB; no `width`/`height` | WebP at about 600px; set dimensions → **P-10** |
| A-11 | 🟡 Medium | Too much add-to-cart feedback | Fly-to-cart + count pop + "Added" + toast | Drop the add-to-cart toast → **P-11** |
| A-12 | 🟡 Medium | No SEO or social metadata | No Open Graph tags, structured data or canonical URL | Add them → **P-12** |
| A-13 | 🟡 Medium | Contact form sends nothing | Submit only resets the form and shows a toast | Deliver messages → **P-13** *(found while writing these docs)* |
| A-14 | 🟡 Medium | Image licensing unverified | `calming-herbal-tea-blend-chamomile-600nw-2568834187.jpg` looks like a stock-photo preview; Premium image is hotlinked from Unsplash | Confirm licences or replace with own photos → **P-14** *(found while writing these docs)* |

### Nice-to-have opportunities

| ID | Opportunity | Feature |
|---|---|---|
| A-15 | "Sold out" and "Only 3 left" on cards | P-15 |
| A-16 | Sampler bundle ("Try 3 teas") | P-16 |
| A-17 | Promo code field | P-17 |
| A-18 | Remember the shopper's details for next time | P-18 |
| A-19 | Privacy-friendly analytics | P-19 |
| A-20 | Bangla language toggle | P-20 |
| A-21 | "Reorder" from the confirmation | P-21 |

### What already works well

Distinctive brand; useful tea data (grade, origin, brewing); free-delivery progress bar; checkout validation for Bangladeshi mobile numbers with a visible summary; skip link, focus outlines and reduced-motion support.

## 10. Release criteria and priorities

See [PLAN.md](PLAN.md). Launch blockers (Phase 1) are P-01, P-02, P-03, P-06, P-08, P-13 and P-14. Engineering items that support the product but are not user-facing features: P-23 (automated E2E tests, needs approval) and P-24 (SRI and CSP hardening); see [FEATURES.md](FEATURES.md).

## 11. Open questions (TBD)

| # | Question | Needed for |
|---|---|---|
| Q-1 | Where should orders go: Google Sheet, email, WhatsApp, or a combination? | P-01 |
| Q-2 | Business phone and WhatsApp numbers | P-02 |
| Q-3 | Real contact email, address and opening hours | P-02, F-09 |
| Q-4 | Delivery rates and times inside and outside Dhaka | P-03 |
| Q-5 | Return, refund and freshness policy text | P-04 |
| Q-6 | Confirmed prices, pack sizes, grades and origins for each tea | F-01, P-05 |
| Q-7 | bKash/Nagad merchant or personal numbers, and whether online payment is wanted later | P-06, P-22 |
| Q-8 | Licences for the current product photos | P-14 |
| Q-9 | Domain name and hosting (is GitHub Pages enabled?) | P-12, SETUP.md |
| Q-10 | Analytics preference | P-19 |
