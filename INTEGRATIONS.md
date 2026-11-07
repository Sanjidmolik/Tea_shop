# INTEGRATIONS — Cha Bazaar Third-Party Services

> Status legend: **IMPLEMENTED** · **PROPOSED** · **TBD** (see [PRD.md](PRD.md)).
> Related: [API.md](API.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [AUTH_SECURITY.md](AUTH_SECURITY.md) · [PLAN.md](PLAN.md)

## 1. Summary

| Integration | Purpose | Status | Feature |
|---|---|---|---|
| jsDelivr CDN: Bootstrap 5.3.3 | UI components and JS | IMPLEMENTED | — |
| jsDelivr CDN: Bootstrap Icons 1.11.3 | Icons | IMPLEMENTED | — |
| Google Fonts | Big Shoulders Stencil, Hind Siliguri | IMPLEMENTED | — |
| Unsplash (hotlinked image) | Premium Estate Blend photo | IMPLEMENTED (licence TBD) | P-14 |
| GitHub | Source hosting | IMPLEMENTED | — |
| GitHub Pages | Hosting | TBD (not verified as enabled) | — |
| Google Sheets + Apps Script | Order and message store, owner alerts | PROPOSED | P-01, P-13 |
| Gmail (via Apps Script `MailApp`) | Email alert per order | PROPOSED | P-01 |
| WhatsApp click-to-chat | Contact and order fallback | PROPOSED | P-02, P-01 |
| Phone (`tel:`) | Call the shop | PROPOSED | P-02 |
| Facebook page link | Social proof and contact | PROPOSED | P-02 |
| bKash / Nagad: pay on delivery (labels only) | Payment choice | PROPOSED | P-06 |
| bKash / Nagad: online payment APIs | Online payment | PROPOSED, **needs approval** | P-22 |
| Analytics (Plausible, Umami or GA4) | Funnel measurement | PROPOSED; tool TBD | P-19 |
| Formspree | Alternative to Apps Script for messages | PROPOSED (alternative) | P-13 |
| Courier (Pathao, Steadfast, RedX, etc.) | Delivery booking | TBD; not planned | — |
| Playwright | Automated tests (dev only) | PROPOSED, needs approval | P-23 |

## 2. Implemented integrations

### 2.1 Bootstrap and Bootstrap Icons (jsDelivr)
- Loaded in `index.html` from `cdn.jsdelivr.net` at pinned versions 5.3.3 and 1.11.3.
- `app.js` depends on `bootstrap.Toast`, `bootstrap.Offcanvas` and `bootstrap.Modal`.
- **Failure mode:** if jsDelivr is blocked, `bootstrap` is undefined and the script stops (DEBUGGING.md §3).
- **Planned:** SRI hashes (P-24).

### 2.2 Google Fonts
- One stylesheet request with `display=swap`; falls back to system fonts.
- Privacy note: visitors' IP addresses reach Google. Self-hosting the fonts is optional (TBD).

### 2.3 Unsplash
- One hotlinked image URL in `products[5].image`. Licence and attribution are unverified (A-14); plan to host it locally (P-10, P-14).

## 3. Planned integrations

### 3.1 Google Sheets + Apps Script (P-01, P-13)

**Why:** free, no server, and the owner already knows spreadsheets. The trade-offs are quotas and modest throughput, which are fine for a small shop.

**Setup steps (to do during P-01):**
1. Using the owner's Google account (with 2-step verification), create the Sheet `Cha Bazaar Orders` with the `Orders`, `Messages` and optional `Products` tabs (DATABASE.md §3.1).
2. Open **Extensions → Apps Script**. Write `doPost(e)` following API.md §3.1 and the controls in AUTH_SECURITY.md §5.
3. Set the script time zone to `Asia/Dhaka`.
4. Choose **Deploy → New deployment → Web app**: *Execute as: Me*, *Who has access: Anyone*.
5. Copy the `/exec` URL into `ORDER_ENDPOINT` in `app.js` (it's public, not a secret).
6. Make a **test** deployment and a test copy of the Sheet for development (MCP.md §3).
7. Run TESTING.md §4 (integration tests).

**Limits:** Apps Script quotas apply, such as daily email recipients and script runtime. Check the current numbers in Google's documentation before launch (TBD).

### 3.2 WhatsApp click-to-chat (P-02, P-01 fallback)
- Link format `https://wa.me/<number>?text=<encoded>` (API.md §3.2). There's no API key, cost or approval.
- Used for the floating button, the contact list, and the "Send order on WhatsApp" fallback.
- **WhatsApp Business API** (automated messages) is **not planned**. It needs a provider, Meta approval and a server.

### 3.3 bKash and Nagad: pay on delivery (P-06)
- Phase 1 only renames the payment options; the money is collected by the rider or by a manual transfer that the owner checks.
- Inputs needed: whether to accept each one, and the merchant or personal number to show (PRD Q-7).
- Logos: only if the providers' brand guidelines allow it (TBD).

### 3.4 bKash and Nagad: online payment (P-22, Phase 4, needs approval)
- Both offer merchant checkout APIs that need a merchant account, **server-side** credentials, payment callbacks, and signature or status verification.
- **Can't be done safely from this static site**, because the credentials would be public. It requires the Phase 4 back end (ARCHITECTURE.md §7).
- Endpoints, credentials and sandbox details: TBD (from the providers' merchant onboarding).

### 3.5 Analytics (P-19)
| Option | Notes |
|---|---|
| Plausible or Umami | Cookie-less, privacy-friendly; Plausible is paid, Umami can be self-hosted |
| Google Analytics 4 | Free; needs a cookie or consent notice depending on policy |

Events to track: `view_item_list`, `add_to_cart`, `begin_checkout`, `purchase` (only after a server confirms the order). Never send names, phones or addresses. The owner chooses the tool (PRD Q-10).

### 3.6 Formspree (alternative for P-13)
An email-forwarding form endpoint that's simple to set up, if the owner prefers email over the Sheet for contact messages. The free tier has limits (TBD).

## 4. Integration rules

1. Every new third-party script or request needs owner approval (AGENTS.md §4).
2. Pin versions and add SRI hashes to CDN assets.
3. No secrets in the front end. Anything needing a secret goes server-side (Apps Script properties or the Phase 4 back end).
4. Document every integration here, with its status, before merging.
