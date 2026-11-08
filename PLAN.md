# PLAN — Cha Bazaar Implementation Roadmap

> Status legend: **IMPLEMENTED** · **PROPOSED** · **TBD** (see [PRD.md](PRD.md)).
> Related: [PRD.md](PRD.md) §9 (audit) · [FEATURES.md](FEATURES.md) (steps and acceptance criteria) · [AGENTS.md](AGENTS.md)
>
> **Status 2026-11-07 (v2):** Phases 1–3 are implemented in code, except P-14 (owner action) and the CSP part of P-24. What remains is mostly **owner input and deployment**: see §3 (inputs) and the launch checklist in §10. Phase 4 is still not approved.

## 1. Where we are

| Done (IMPLEMENTED) | Blocking launch |
|---|---|
| F-01 to F-12: catalogue, filters, cart, checkout UI, confirmation, contact UI, brand, motion, responsive layout | Orders don't reach the owner (A-01); no phone or WhatsApp (A-02); wrong delivery pricing outside Dhaka (A-03); vague payment labels (A-06); contrast failures (A-08); unverified image licences (A-14) |

## 2. Phase overview

```mermaid
flowchart LR
  P0[Phase 0<br/>Owner inputs] --> P1[Phase 1<br/>Launch blockers]
  P1 --> L((Soft launch))
  L --> P2[Phase 2<br/>Trust and conversion]
  P2 --> P3[Phase 3<br/>Growth]
  P3 -.needs approval.-> P4[Phase 4<br/>Own back end and online payment]
```

## 3. Phase 0: owner inputs (prerequisite)

Phase 1 can't be finished without these. They come from PRD §11.

| # | Input | Unblocks |
|---|---|---|
| Q-1 | Order destination (recommended: Google Sheet + email alert, with WhatsApp as fallback) | P-01, P-13 |
| Q-2 | Phone and WhatsApp numbers | P-02 |
| Q-3 | Contact email, address, opening hours | P-02 |
| Q-4 | Delivery fees and times inside and outside Dhaka | P-03 |
| Q-6 | Confirmed prices, pack sizes, grades and origins | Launch content |
| Q-7 | Which mobile-banking services are accepted, and the numbers | P-06 |
| Q-8 | Image licences or replacement photos | P-14 |
| — | A Google account that will own the Sheet and Apps Script | P-01 |

## 4. Phase 1: launch blockers

Order matters: P-01 first because it carries the most risk.

| Order | ID | Item | Audit | Size | Depends on |
|---|---|---|---|---|---|
| 1 | **P-01** | Send orders to the Google Sheet through Apps Script; server-side totals; loading and error states; WhatsApp fallback; stop storing full personal data locally | A-01 | L | Q-1, P-02 (for the fallback) |
| 2 | **P-02** | Phone (`tel:`) link, floating WhatsApp button, Facebook link; real contact details | A-02 | S | Q-2, Q-3 |
| 3 | **P-03** | Delivery zone selector (Inside / Outside Dhaka) with fees and delivery estimates; replaces the flat ৳60 | A-03 | M | Q-4 |
| 4 | **P-06** | Payment options become Cash / bKash / Nagad (all on delivery) | A-06 | S | Q-7 |
| 5 | **P-08** | Darken amber to pass 4.5:1 | A-08 | S | — |
| 6 | **P-13** | Send contact-form messages to the Sheet | A-13 | S | P-01 endpoint |
| 7 | **P-14** | Confirm image licences or replace the photos | A-14 | S | Q-8 |

**Exit criteria (soft launch):**
- The product acceptance criteria in PRD §8 are met.
- A real test order made from a phone appears in the Sheet within a minute.
- An email alert arrives for that order.

## 5. Phase 2: trust and conversion (first week after launch)

| ID | Item | Audit | Size |
|---|---|---|---|
| P-04 | Testimonials (real ones only), freshness guarantee, Delivery, Returns and Privacy pages or sections | A-04 | M |
| P-05 | Price per 100g; multiple pack sizes (`variants`) | A-05 | M–L (changes the cart format; needs a migration) |
| P-09 | Pause control for the ticker and leaves | A-09 | S |
| P-10 | WebP images at about 600px, with `width`/`height` set | A-10 | S |
| P-11 | Remove the add-to-cart toast | A-11 | XS |
| P-12 | Open Graph tags, `Product` structured data, canonical URL, social image | A-12 | S |
| P-24 | Subresource Integrity hashes and a Content-Security-Policy | AUTH_SECURITY.md | S |
| P-23 | Automated E2E smoke tests with Playwright (dev-only tooling; **needs approval** because it adds `package.json`) | TESTING.md | M |

## 6. Phase 3: growth

| ID | Item | Audit | Size |
|---|---|---|---|
| P-07 | Quick-view panel and `#tea/<slug>` share links | A-07 | M |
| P-15 | Stock badges, read from the Sheet `Products` tab | A-15 | M |
| P-16 | Sampler bundle | A-16 | S |
| P-17 | Promo codes, validated server-side | A-17 | M |
| P-18 | Remember details (opt-in) | A-18 | S |
| P-19 | Privacy-friendly analytics | A-19 | S (needs owner choice) |
| P-20 | Bangla language toggle | A-20 | L |
| P-21 | "Reorder" from the confirmation | A-21 | S |

## 7. Phase 4: optional, needs explicit approval

| ID | Item | Why it needs approval |
|---|---|---|
| P-22 | Own API server and database (DATABASE.md §5); online bKash/Nagad payment | Changes the stack; costs money; handles payments and credentials |

## 8. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Apps Script quota or outage | Orders lost | WhatsApp fallback; the cart is kept when sending fails; email alert per order |
| Spam orders to a public endpoint | Fake orders | Honeypot, server-side validation, rate limit, owner calls to confirm (AUTH_SECURITY.md §5) |
| Price list duplicated in `app.js` and Apps Script | Wrong totals | One server-side `Products` tab as the source; P-01 adds a check that the totals match |
| Cart format change in P-05 | Existing carts break | Migrate or drop invalid rows (`readCart()` already does) |
| CDN blocked | Site broken | P-24 plus an optional local Bootstrap copy (TBD) |

## 9. Tracking

Feature statuses live in FEATURES.md. When an item ships, update its status to IMPLEMENTED in FEATURES.md, PRD.md §4 and this plan in the same commit (AGENTS.md §3, step 7).


## 10. Launch checklist (after v2)

| # | Task | Who | Guide |
|---|---|---|---|
| 1 | Create the Google Sheet, paste `Code.gs`, set `CATALOG_URL` and `OWNER_EMAIL`, run `setup` and `checkSetup`, deploy the web app | Owner | [apps-script/README.md](apps-script/README.md) |
| 2 | Fill `config.js`: `ORDER_ENDPOINT`, `BUSINESS_PHONE`, `WHATSAPP_NUMBER`, `FACEBOOK_URL`, `BUSINESS_EMAIL`, `BKASH_NUMBER`/`NAGAD_NUMBER` and account types, address, hours, `RETURN_WINDOW_DAYS` | Owner | [SETUP.md](SETUP.md) §7 |
| 3 | Confirm prices, pack sizes, grades, origins, tasting notes and ingredients in `catalog.js`; add prices for extra pack sizes if wanted | Owner | `catalog.js` header |
| 4 | Decide whether free delivery over ৳1,500 also applies outside Dhaka (currently no) | Owner | `catalog.js` `freeOver` |
| 5 | Review the four policy pages (English and Bangla) | Owner | `delivery.html` etc. |
| 6 | Native-speaker check of the Bangla text | Owner | `i18n.js`, policy pages |
| 7 | Confirm photo licences or replace photos; host the Premium image locally (P-14) | Owner | `npm run images` |
| 8 | Publish with GitHub Pages; place a real test order from a phone; delete test rows | Owner | README "Deploy" |
| 9 | Optional: analytics provider, promo codes, genuine reviews, sampler bundle | Owner | FEATURES.md notes |

## 11. Storefront redesign (v4): started 2026-11-08

Brief: Adagio-standard catalogue, navigation and merchandising, keeping Cha Bazaar's identity. Full assessment and conflicts: [ASSESSMENT.md](ASSESSMENT.md).

| Phase | Scope | Status |
|---|---|---|
| 1 | Inspect code and docs; current-state assessment; conflicts C-1 to C-10 | **Done**: ASSESSMENT.md |
| 2 | Announcement bar, navbar, mega menus, footer | Waiting for decisions C-3, C-7 |
| 3 | Taxonomy, schema additions, category landing pages | Waiting for C-1, C-2, C-3 |
| 4 | Product cards, homepage collections | Waiting for C-4 |
| 5 | Product pages, quick view, search | Waiting for C-1, C-5 |
| 6 | Cart/checkout verification, live order test, mobile | Needs the Apps Script deployed by the owner |
| 7 | SEO, accessibility, performance, final tests | — |

Note: the v3 store layout (commit `62f25c9`) is on the branch but not yet merged into `main`.
