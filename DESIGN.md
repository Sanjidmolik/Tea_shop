# DESIGN — Cha Bazaar Design System

> Status legend: **IMPLEMENTED** · **PROPOSED** · **TBD** (see [PRD.md](PRD.md)).
> Related: [PRD.md](PRD.md) · [FEATURES.md](FEATURES.md) · [ARCHITECTURE.md](ARCHITECTURE.md)
>
> Source of truth: the `:root` tokens in `styles.css` and the motion rules in `animations.css`. If this document and the CSS disagree, the CSS wins. Update this file in the same commit.

## 1. Identity

**Concept (IMPLEMENTED):** the stencilled wooden chest that tea travels in from the estate to the auction house. The hero shows one CSS-drawn chest as the single bold element; everything else is a calm, legible catalogue.

**Principles**

1. **One bold object.** The tea chest is the memorable thing. Don't add competing hero graphics.
2. **Real tea vernacular.** Use grade codes (FTGFOP1, BOP, CTC), origins and brewing data instead of decoration.
3. **Quiet catalogue.** Flat white cards with a 1px border. No floating shadows or gradient washes.
4. **Left-aligned.** Content is left-aligned. Centred text is only used for the empty states and the confirmation modal.
5. **Plain words.** Sentence case, active verbs, and the same name for an action throughout ("Add to cart" → "Added to cart: …").

**Things to avoid** (they make the shop look templated): cream backgrounds with a terracotta accent, ALL-CAPS eyebrow labels above headings, identical rounded cards with grey shadows, a "→" on every link, and card hover-lift effects.

## 2. Colour (IMPLEMENTED)

| Token | Hex | Role |
|---|---|---|
| `--garden` | `#173F2E` | Deep tea-leaf green: nav, hero, footer, primary buttons, headings |
| `--garden-2` | `#20543D` | Hover and pressed green |
| `--bud` | `#9BBF4A` | New-bud green: cart count, progress bar, small highlights on green |
| `--liquor` | `#9A5B00` | Brewed-tea amber: main buy actions, grade codes, icons (v2: darkened for contrast) |
| `--liquor-2` | `#7F4B00` | Amber hover |
| `--paper` | `#F1F4EC` | Pale leaf-tint page background |
| `--ink` | `#1A2119` | Body text |
| `--ink-soft` | `#4E5A4C` | Secondary text |
| `--line` | `#D3DCC8` | Borders and dividers |
| `--ply` / `--ply-dark` | `#C9A273` / `#A67C4B` | Plywood, **only** on the tea chest |
| `--white` | `#FFFFFF` | Card and panel surfaces |

### Contrast (measured)

| Pair | Ratio | WCAG AA | Status |
|---|---|---|---|
| `--paper` on `--garden` | 10.57:1 | Pass | IMPLEMENTED |
| White on `--garden` (buttons) | 11.75:1 | Pass | IMPLEMENTED |
| `--ink-soft` on white | 7.26:1 | Pass | IMPLEMENTED |
| `--garden` on `--bud` (cart count) | 5.57:1 | Pass | IMPLEMENTED |
| White on `--liquor` (Checkout, Browse, Place order) | 5.43:1 | Pass | IMPLEMENTED (v2) |
| `--liquor` text on white (grade codes) | 5.43:1 | Pass | IMPLEMENTED (v2) |
| `--liquor` text on `--paper` | 4.88:1 | Pass | IMPLEMENTED (v2) |

**Done in v2 (P-08).** The colour still reads as tea amber.

Dark mode: **not implemented**. Not planned (TBD).

## 3. Typography (IMPLEMENTED)

| Role | Family | Weights | Notes |
|---|---|---|---|
| Display (wordmark, section titles, hero, modal titles, grade codes, chest markings) | **Big Shoulders Stencil** | 700, 800 | Always uppercase via CSS; `line-height: .95` |
| Body, UI and the Bengali চা on the chest | **Hind Siliguri** | 400, 500, 600 | Covers both Bengali and Latin |

Both load from Google Fonts with `display=swap`. Fallbacks: `"Arial Narrow", Impact, sans-serif` and `"Segoe UI", system-ui, sans-serif`.

### Type scale (ratio 4:3, base 17px)

| Token | Size | Use |
|---|---|---|
| `--step--1` | 0.8125rem / 13px | Origins, brew data, captions |
| `--step-0` | 1.0625rem / 17px | Body (`line-height: 1.6`) |
| `--step-1` | 1.375rem / 22px | Tea names, prices, hero lead, cart total |
| `--step-2` | 1.875rem / 30px | Cart panel title |
| `--step-3` | 2.5rem / 40px | Modal titles; section titles on phones |
| `--step-4` | 3.375rem / 54px | Section titles |
| `--step-hero` | `clamp(3rem, 7.2vw, 5.75rem)` | Hero headline (`max-width: 11ch`) |

Line length: the hero lead is capped at 34ch and About paragraphs at 58ch, keeping lines under 80 characters.

## 4. Spacing, radius and layout

| Item | Value | Status |
|---|---|---|
| Section vertical padding | `clamp(3rem, 6vw, 5–5.5rem)` | IMPLEMENTED |
| Hero padding | `clamp(3rem, 7vw, 6rem)` top, `clamp(3.5rem, 8vw, 7rem)` bottom | IMPLEMENTED |
| Grid gutters | Bootstrap `g-4` (1.5rem); `g-lg-5` (3rem) from 992px | IMPLEMENTED |
| Radius | `--radius-sm: 3px` (buttons, inputs, badges); `--radius: 6px` (cards, panels) | IMPLEMENTED |
| Spacing scale token | None. Bootstrap spacing utilities plus the values above | TBD whether to add one |

### Breakpoints (Bootstrap 5 defaults plus one custom)

| Width | Behaviour |
|---|---|
| < 576px | Search and sort stack full-width; category tabs scroll sideways; chest at 94% width; section titles 40px |
| ≥ 576px | Product grid 2 columns |
| ≥ 768px (md) | Nav links expand (hamburger below this) |
| ≥ 992px (lg) | Hero splits into headline + chest; grid 3 columns; About/Contact 2 columns |
| ≥ 1200px (xl) | Product grid 4 columns |

### Page layout

```
┌──────────────── nav (sticky, green) ───────────────┐
│ CHA BAZAAR   Teas  Our sourcing  Contact   [Cart n]│
├──────────────── hero (green) ──────────────────────┤
│ GARDEN TEA, PACKED            ┌──────────────┐     │
│ FRESH EVERY WEEK              │ tea chest    │     │
│ lead text                     │ stencilled   │     │
│ [Browse the teas] How we…     └──────────────┘     │
├──────────── promise strip / ticker (white) ────────┤
├──────────── THE TEAS  [search][sort] ──────────────┤
│ All 8  Black 4  Spiced 1  Green 2  Herbal 1        │
│ [card][card][card][card]                           │
├──────────── about (white): image | text ───────────┤
├──────────── contact: info | form ──────────────────┤
└──────────── footer (green) ────────────────────────┘
```

## 5. Components (IMPLEMENTED unless marked)

| Component | Class / ID | Notes |
|---|---|---|
| Navbar | `.site-nav` | Green, sticky; gains a shadow after 8px of scroll |
| Cart button | `.cart-btn`, `#cart-count` | Outline button with a bud-green count; pops on add |
| Hero | `.hero`, `.hero-title`, `.hero-lead` | Headline split into words by JS for the entrance animation; `aria-label` keeps the full text |
| Tea chest | `.chest`, `.chest-face`, `.stamp-*` | Pure CSS (gradients for grain and corner straps); a `<dl>` holds grade, nett weight and chest number |
| Promise strip | `.promises`, `.promise-list` | Becomes `.ticker` when motion is allowed |
| Section title | `.section-title` | Stencil, garden green |
| Category tabs | `.category-tabs`, `.category-tab` | Underline tabs with counts; `aria-pressed` marks the active one |
| Tea card | `.tea`, `.tea-img`, `.tea-grade`, `.tea-name`, `.tea-desc`, `.tea-brew`, `.tea-buy` | 4:3 image; grade in amber stencil; dashed divider above price and button |
| Buttons | `.btn-liquor` (buy actions), `.btn-garden` (primary), `.btn-outline-garden`, `.btn-link-muted` | All built on Bootstrap `.btn` CSS variables |
| Cart panel | `.cart-panel` (Bootstrap offcanvas), `.cart-item`, `.qty`, `.delivery-bar` | 420px wide, green header |
| Checkout modal | `#checkoutModal`, `.summary`, `.summary-list` | Form on the left, summary on the right; stacks on mobile |
| Confirmation | `#confirmModal`, `.confirm-chest` | Order ID styled as a stencilled chest label |
| Toast | `.app-toast` | Green, bottom-right, 2s |
| Footer | `.site-footer` | Wordmark and copyright |

**v2 components (IMPLEMENTED):** language toggle, setup notice (localhost only), card pack-size select and unit price, stock badges, quick-view modal with size chips, trust band with stencil "Fresh or replaced" stamp, review cards with stars and sample flags, delivery-area and payment choice cards, payment instructions panel, promo field, form alert, recent orders, floating WhatsApp button, motion pause button, footer grid, consent bar, policy page layout. Bangla mode swaps the stencil display face for Hind Siliguri (the stencil font has no Bangla glyphs).

**Originally PROPOSED components:** WhatsApp floating button (P-02), delivery-zone selector (P-03), testimonial block and guarantee badge (P-04), unit-price line and pack-size selector (P-05), bKash/Nagad payment chips (P-06), quick-view panel (P-07), motion pause button (P-09), stock badge (P-15).

## 6. UI states

| State | Where | Behaviour | Status |
|---|---|---|---|
| Empty search result | Product grid | Dashed box: 'No teas match "…" in <category>.' plus **Show all teas** | IMPLEMENTED |
| Empty cart | Cart panel | Bag icon, "Your cart is empty.", **Browse the teas**; Checkout and Empty cart disabled | IMPLEMENTED |
| Free-delivery progress | Cart panel | "Add ৳X more for free delivery." or "Your order ships free.", plus a bar | IMPLEMENTED |
| Form validation | Checkout, Contact | Bootstrap `.was-validated`; specific messages (e.g. "Enter an 11-digit number starting with 01."); focus moves to the first invalid field | IMPLEMENTED |
| Added to cart | Card button, cart count | Button shows "✓ Added" for 1.2s, count updates, screen-reader announcement (v2: toast and flying photo removed) | IMPLEMENTED |
| Order placed | Confirmation modal | Order ID, call-back message, amount due and payment method | IMPLEMENTED |
| Broken image | Any `<img>` | Swapped once for `Tea/MIX_tea.jpg` | IMPLEMENTED |
| Loading / sending | Checkout submit | Spinner + "Placing order…", button and close buttons disabled | IMPLEMENTED (v2) |
| Send failed | Checkout, Contact | Red alert explaining what happened, cart kept, WhatsApp / call buttons | IMPLEMENTED (v2) |
| Out of stock / low stock | Card, quick view | "Sold out" (button disabled) / "Only N left", from real `stock` only | IMPLEMENTED (v2) |

## 7. Motion (IMPLEMENTED in `animations.css` and `animations.js`)

| Moment | Effect | Trigger |
|---|---|---|
| Page load | Words rise in; lead and buttons fade up; chest drops in; chest markings stamp on in sequence | Load |
| Hero ambience | 14 drifting leaves (7 on phones), 14–26s loops | Continuous ⚠ A-09 |
| Chest tilt | Up to ±14° Y and ±10° X following the pointer | Pointer move (fine pointers only) |
| Ticker | Promise strip scrolls in a 32s loop; pauses on hover or focus | Continuous ⚠ A-09 |
| Section titles | Left-to-right clip-path wipe | Scroll into view |
| Cards | Staggered rise (70ms apart) | Scroll into view or a filter change |
| Add to cart | *(v2: removed; replaced by the "Added" button state)* | — |
| Cart rows | Slide in from the right | Render |
| Confirmation | Order label stamps on; title fades up | Modal opens |

**Rules:** everything except the "Added" label and the nav shadow is wrapped in `@media (prefers-reduced-motion: no-preference)`, and `animations.js` exits early when reduced motion is set. Easing: `--ease-out: cubic-bezier(.16,1,.3,1)`; stamps use `cubic-bezier(.2,.9,.3,1.3)`.

## 8. Accessibility

| Item | Status |
|---|---|
| Skip link to the teas | IMPLEMENTED |
| Visible focus: 3px amber outline | IMPLEMENTED |
| Labels on every input; visually hidden labels for search and sort | IMPLEMENTED |
| `aria-live` on the product grid and toast; `aria-pressed` on tabs | IMPLEMENTED |
| `aria-label` on icon buttons (remove, quantity, cart) | IMPLEMENTED |
| Reduced motion respected | IMPLEMENTED |
| Text contrast ≥ 4.5:1 everywhere | IMPLEMENTED (v2) |
| Pause, stop or hide for moving content | IMPLEMENTED (v2): pause button in the hero, remembered |
| Image `width`/`height` to prevent layout shift | IMPLEMENTED (v2) |
| Screen-reader testing (NVDA, VoiceOver) | TBD (see TESTING.md) |

## 9. Content and voice

- Currency is always `৳` with `en-US` digit grouping (`৳1,470`).
- Prices read "৳650" with "per 100g" underneath. **PROPOSED (P-05):** add a per-100g unit price.
- Error messages say how to fix the problem and never apologise.
- Placeholder content to replace (**TBD**): `hello@chabazaar.example`, "Dhaka, Bangladesh", "Saturday to Thursday, 10am to 8pm", and every price, grade and origin until the owner confirms them (PRD Q-3, Q-6).


## 10. Store navigation (v3)

| Component | Notes |
|---|---|
| Mega menu (`.mega-menu`) | Full-width panel under the nav, paper background, column titles in amber, a green promo card; stacks inside the mobile menu |
| Category tiles (`.cat-tile`) | White tiles with an amber Bootstrap icon, name and item count |
| Quick-pick chips (`.chip-link`) | Rounded links for common filters |
| Breadcrumbs (`.crumbs`) | "Home › Tea › Black tea" |
| Filter sidebar (`.filters`) | 15rem column on desktop; Bootstrap `offcanvas-lg` drawer below 992px |
| Quick view button (`.quick-view-btn`) | White pill over the card image; card title and image now open the product page |
| Photo placeholder (`.img-placeholder`) | Plywood-tint tile with a category icon and "Photo coming soon" in stencil |
| Sample listing | Dashed card border, amber "Sample listing" flag, grey "Coming soon" button |
| Product page (`.product-page`) | Two columns: image and buy box (size chips, quantity, amber Add to cart, delivery/payment/guarantee list), then details, reviews and related cards |
