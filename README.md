# Cha Bazaar — Tea Shop

A single-page online tea shop for Bangladesh. You can browse estate teas from Sylhet, Assam and Darjeeling, build a cart, and check out with cash or mobile banking on delivery. It's built with plain HTML, CSS and JavaScript on top of Bootstrap 5, with no build step.

> ⚠ **Not ready to take real orders yet.** Orders are saved only in the customer's browser and never reach the shop owner. Fixing this is the first item in [PLAN.md](PLAN.md) (P-01).

## Features

**IMPLEMENTED**
- Catalogue of 8 teas with grade, origin, pack size, price (৳) and brewing guide
- Search, 5 sort options, and category tabs with counts
- Cart in a slide-out panel: quantity controls, saved in `localStorage`, synced across tabs
- ৳60 delivery, free from ৳1,500, with a progress bar
- Checkout with validation (Bangladeshi mobile number, address, city, payment method) and an order confirmation with an order ID
- Contact form (validation only; **messages aren't sent**)
- A tea-chest visual identity with animation that respects reduced-motion settings
- Responsive from phones to desktops; skip link, focus styles and labelled controls

**PROPOSED** (see [FEATURES.md](FEATURES.md)): sending orders to Google Sheets, WhatsApp and a phone number, delivery zones, bKash/Nagad labels, trust content, price per 100g, quick view, image optimisation, SEO metadata, and more.

## Tech stack

| Part | Technology |
|---|---|
| Page | `index.html` (single page) |
| Styles | `styles.css` (design tokens + components), `animations.css` |
| Logic | `app.js` (vanilla JS), `animations.js` (optional motion layer) |
| UI library | Bootstrap 5.3.3 + Bootstrap Icons 1.11.3, from the jsDelivr CDN |
| Fonts | Big Shoulders Stencil, Hind Siliguri (Google Fonts) |
| Storage | Browser `localStorage` |

There is no `package.json`, back end or database. An internet connection is needed for the CDN files and fonts.

## Quick start

```bash
git clone https://github.com/Sanjidmolik/Tea_shop.git
```

```bash
cd Tea_shop
```

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. You can also just double-click `index.html`. Full instructions for Windows, macOS and Linux are in [SETUP.md](SETUP.md).

## Commands

| Task | Command |
|---|---|
| Serve locally (macOS/Linux) | `python3 -m http.server 8000` |
| Serve locally (Windows) | `py -m http.server 8000` |
| Serve with Node (any OS, optional) | `npx serve .` |
| Build | None needed |
| Tests | No automated tests yet; see [TESTING.md](TESTING.md) |

## Project structure

```
index.html      page markup
styles.css      design tokens and component styles
animations.css  motion (reduced-motion safe)
app.js          catalogue data, cart, filters, checkout
animations.js   optional motion layer
Tea/            product photos
*.md            documentation
```

## Customise

- **Products and prices:** the `products` array at the top of `app.js`. Put images in `Tea/`; file names are case-sensitive.
- **Currency and delivery rules:** the `CURRENCY`, `DELIVERY_FEE` and `FREE_DELIVERY_THRESHOLD` constants in `app.js`.
- **Colours and type:** the `:root` variables in `styles.css` (see [DESIGN.md](DESIGN.md)).
- **Turn off animation:** remove the `animations.css` and `animations.js` lines from `index.html`.

## Deploy

Upload the files to any static host. For GitHub Pages: open the repo's **Settings → Pages**, choose **Deploy from a branch**, then `main` and `/ (root)`. Whether Pages is enabled is TBD.

## Documentation

| Document | Purpose |
|---|---|
| [PRD.md](PRD.md) | Goals, users, requirements, full audit findings |
| [DESIGN.md](DESIGN.md) | Colours, type, components, states, motion, accessibility |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Stack, structure, data flow, configuration |
| [DATABASE.md](DATABASE.md) | Browser storage formats and the proposed Google Sheet |
| [API.md](API.md) | Internal JS interface, DOM contract, proposed endpoints |
| [FEATURES.md](FEATURES.md) | Every feature with steps and acceptance criteria |
| [PLAN.md](PLAN.md) | Roadmap, starting with launch blockers |
| [SETUP.md](SETUP.md) | Windows, macOS and Linux setup |
| [TESTING.md](TESTING.md) | Unit, integration, E2E and manual QA plans |
| [DEBUGGING.md](DEBUGGING.md) | Troubleshooting guide |
| [AUTH_SECURITY.md](AUTH_SECURITY.md) | Security requirements and OWASP mapping |
| [INTEGRATIONS.md](INTEGRATIONS.md) | Current and planned third-party services |
| [MCP.md](MCP.md) | Optional MCP tools for AI-assisted development |
| [AGENTS.md](AGENTS.md) | Rules for AI coding assistants |

## Licence

TBD. Product photo licences also need to be confirmed (see PRD A-14).
