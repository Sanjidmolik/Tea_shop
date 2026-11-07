# ARCHITECTURE — Cha Bazaar

> Status legend: **IMPLEMENTED** · **PROPOSED** · **TBD** (see [PRD.md](PRD.md)).
> Related: [DATABASE.md](DATABASE.md) · [API.md](API.md) · [INTEGRATIONS.md](INTEGRATIONS.md) · [AUTH_SECURITY.md](AUTH_SECURITY.md)

## 1. Technology stack (IMPLEMENTED, verified)

| Layer | Technology | Version | Loaded from |
|---|---|---|---|
| Markup | HTML5, single page | — | `index.html` |
| Styling | CSS3 with custom properties | — | `styles.css`, `animations.css` |
| UI framework | Bootstrap (CSS and JS bundle with Popper) | 5.3.3 | `cdn.jsdelivr.net` |
| Icons | Bootstrap Icons (web font) | 1.11.3 | `cdn.jsdelivr.net` |
| Fonts | Big Shoulders Stencil, Hind Siliguri | Google Fonts | `fonts.googleapis.com` |
| Logic | Vanilla JavaScript (ES2020: `?.`, `??`; classic scripts, not modules) | — | `app.js`, `animations.js` |
| Persistence | Browser `localStorage` | — | See DATABASE.md |
| Browser APIs used | `localStorage`, `storage` event, `IntersectionObserver`, `MutationObserver`, Web Animations API, `matchMedia`, Constraint Validation API | — | — |

**Not present:** `package.json`, Node dependencies, bundler or build step, framework (React/Vue), back end, database server, authentication, payment gateway, environment variables, automated tests, CI.

Hosting: static files. Whether GitHub Pages is enabled for `sanjidmolik/tea_shop` is **TBD** (PRD Q-9).

## 2. Folder structure (IMPLEMENTED)

```
Tea_shop/
├── index.html          # The whole page: nav, hero, shop, about, contact, cart, checkout, confirmation, toast
├── styles.css          # Design tokens (:root) and all component styles
├── animations.css      # Motion styles, only under prefers-reduced-motion: no-preference
├── app.js              # Catalogue data, cart, filters, checkout, contact form (core logic)
├── animations.js       # Motion layer; loaded after app.js; optional
├── Tea/                # Product images (7 JPEGs, ~776 KB total)
│   ├── Assam_Tea.jpg
│   ├── Green-Tea-Leaves-2.jpg
│   ├── Loose_Jasmine_Tea_Leaves.jpg
│   ├── MIX_tea.jpg
│   ├── Masala_tea.jpg
│   ├── calming-herbal-tea-blend-chamomile-600nw-2568834187.jpg
│   └── darjeeling.jpg
└── *.md                # Project documentation (this set of 15 files)
```

**Important:** file names are case-sensitive on GitHub Pages and Linux. The first build had a broken `Assam_tea.jpg` reference for exactly this reason.

## 3. Application architecture

```mermaid
flowchart TB
  subgraph Browser
    HTML[index.html<br/>static markup + IDs]
    CSS[styles.css + animations.css]
    subgraph app.js
      DATA[products array<br/>config constants]
      CART[Cart module<br/>readCart / writeCart / setQty]
      RENDER[Renderers<br/>renderProducts / renderCart / renderCheckoutSummary]
      FILTER[applyFilters<br/>search + sort + category]
      CHECKOUT[Checkout handler<br/>validate → build order → save]
    end
    ANIM[animations.js<br/>observes DOM, adds motion]
    LS[(localStorage<br/>tea-shop-cart<br/>tea-shop-orders)]
  end
  CDN[jsDelivr CDN<br/>Bootstrap 5.3.3 + Icons]
  GF[Google Fonts]
  UNS[Unsplash<br/>1 hotlinked image]

  HTML --> app.js
  HTML --> ANIM
  CDN --> HTML
  GF --> HTML
  UNS -.image.-> RENDER
  DATA --> FILTER --> RENDER
  CART <--> LS
  CHECKOUT --> LS
  CART --> RENDER
  ANIM -.MutationObserver.-> RENDER
```

### Script load order (matters)

1. `bootstrap.bundle.min.js`: `app.js` calls `bootstrap.Toast`, `bootstrap.Offcanvas` and `bootstrap.Modal` at load time, so Bootstrap must load first.
2. `app.js`: renders the catalogue and cart immediately.
3. `animations.js`: wraps an IIFE around the already-rendered DOM. It is safe to remove; the shop works without it.

### Key design decisions (IMPLEMENTED)

| Decision | Reason |
|---|---|
| The cart stores only `{id, qty}` | Price and name changes in `products` apply automatically; stale IDs are dropped |
| All HTML from data goes through `escapeHtml()` | Prevents XSS if product data ever comes from outside the code |
| Event delegation on `#product-grid` and `#cart-items` | The grid is re-rendered on every filter change |
| Animation lives in separate files | It can be switched off by deleting two lines; core logic stays simple |
| No build step | Anyone can edit and deploy by uploading files |

## 4. Data flow

### 4.1 Add to cart (IMPLEMENTED)

```mermaid
sequenceDiagram
  actor U as Shopper
  participant G as #product-grid
  participant A as app.js
  participant LS as localStorage
  participant M as animations.js
  U->>G: click "Add to cart"
  G->>A: delegated click → addToCart(id)
  A->>LS: readCart() / writeCart([{id,qty}])
  A->>A: renderCart() → badge, totals, delivery bar
  A->>U: toast "Added to cart: …"
  G->>M: same click → "Added" label + flyToCart()
```

### 4.2 Checkout (IMPLEMENTED: local only)

```mermaid
sequenceDiagram
  actor U as Shopper
  participant C as Cart panel
  participant F as #checkoutForm
  participant A as app.js
  participant LS as localStorage
  U->>C: Checkout
  C->>F: renderCheckoutSummary(), open modal
  U->>F: fill details, Place order
  F->>A: submit → checkValidity()
  alt invalid
    A->>F: .was-validated, focus first invalid field
  else valid
    A->>A: build order {id, customer, items, totals}
    A->>LS: append to tea-shop-orders
    A->>LS: clearCart()
    A->>U: confirmation modal with order ID
  end
  Note over A,LS: ⚠ The order never leaves the browser (A-01)
```

### 4.3 Checkout (PROPOSED, P-01)

```mermaid
sequenceDiagram
  actor U as Shopper
  participant A as app.js
  participant GAS as Google Apps Script web app (PROPOSED)
  participant S as Google Sheet "Orders" (PROPOSED)
  U->>A: Place order
  A->>A: validate, disable button, show "Placing order…"
  A->>GAS: POST {action:"order", items:[{id,qty}], customer, zone}
  GAS->>GAS: validate, recompute prices and totals, generate order ID
  GAS->>S: append row
  GAS-->>A: {ok:true, orderId, total}
  A->>U: confirmation
  alt network or server error
    A->>U: error + "Send order on WhatsApp" with pre-filled text
  end
```

Endpoint contract: [API.md](API.md). Sheet layout: [DATABASE.md](DATABASE.md).

## 5. Configuration and environment variables

**IMPLEMENTED:** there are no environment variables (no build step to inject them). Configuration is a set of constants at the top of `app.js`:

| Constant | Value | Purpose |
|---|---|---|
| `CURRENCY` | `"৳"` | Price prefix |
| `DELIVERY_FEE` | `60` | Flat delivery fee in taka |
| `FREE_DELIVERY_THRESHOLD` | `1500` | Free delivery from this subtotal |
| `FALLBACK_IMAGE` | `"Tea/MIX_tea.jpg"` | Replaces broken images |
| `CART_KEY` | `"tea-shop-cart"` | `localStorage` key |
| `ORDERS_KEY` | `"tea-shop-orders"` | `localStorage` key |

**PROPOSED** additions (still public constants, not secrets):

| Name | Example | For |
|---|---|---|
| `ORDER_ENDPOINT` | `https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec` (TBD) | P-01, P-13 |
| `WHATSAPP_NUMBER` | `8801XXXXXXXXX` (TBD) | P-02 |
| `DELIVERY_ZONES` | `{ inside_dhaka: { fee: TBD }, outside_dhaka: { fee: TBD } }` | P-03 |

⚠ Anything in front-end code is public. Secrets (Apps Script owner credentials, bKash/Nagad API keys) must **never** be placed in these files. See [AUTH_SECURITY.md](AUTH_SECURITY.md).

## 6. Limitations (current)

1. No server, so orders and contact messages aren't delivered (A-01, A-13).
2. Product data is hard-coded; editing prices needs a code change and redeploy.
3. Prices and totals are calculated in the browser. That's fine while nothing is charged, but a server must recalculate them once orders are sent (FR-22).
4. The site depends on three third-party hosts (jsDelivr, Google Fonts, Unsplash). If jsDelivr is blocked, `bootstrap` is undefined and `app.js` stops at the toast setup (see DEBUGGING.md).
5. No Subresource Integrity (SRI) hashes on CDN files (see AUTH_SECURITY.md, P-24).
6. Personal data from past orders stays in the customer's browser storage indefinitely.

## 7. Target architecture (PROPOSED, phased)

```mermaid
flowchart LR
  subgraph Phase1[Phase 1: launch, no own server]
    SITE[Static site<br/>GitHub Pages] -->|POST JSON| GAS[Apps Script web app]
    GAS --> SHEET[(Google Sheet)]
    GAS -->|email alert| OWNER[Owner Gmail]
    SITE -->|wa.me link| WA[WhatsApp]
  end
  subgraph Phase4[Phase 4: optional, needs approval]
    SITE2[Static or SSR site] --> API[Own API server]
    API --> DB[(Relational DB)]
    API --> PAY[bKash / Nagad gateway]
  end
```

Changing to Phase 4 changes the stack and **requires explicit owner approval** (see [AGENTS.md](AGENTS.md)).
