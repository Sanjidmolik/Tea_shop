# API — Cha Bazaar Interfaces

> Status legend: **IMPLEMENTED** · **PROPOSED** · **TBD** (see [PRD.md](PRD.md)).
> Related: [ARCHITECTURE.md](ARCHITECTURE.md) · [DATABASE.md](DATABASE.md) · [INTEGRATIONS.md](INTEGRATIONS.md) · [AUTH_SECURITY.md](AUTH_SECURITY.md) · [apps-script/README.md](apps-script/README.md)

## 1. Order server endpoint (IMPLEMENTED in `apps-script/Code.gs`; needs deployment)

| Item | Value |
|---|---|
| URL | Your Apps Script web-app URL ending in `/exec`, set as `ORDER_ENDPOINT` in `config.js` (**TBD** until deployed) |
| Methods | `GET` (health check), `POST` (actions) |
| Request body | A JSON string sent with `Content-Type: text/plain;charset=utf-8`. Plain text avoids a CORS preflight, which Apps Script can't answer |
| Response | JSON, always HTTP 200 (Apps Script can't set status codes); check `ok` |
| Auth | None (public web app, *Execute as: Me*, *Access: Anyone*). Protection is described in AUTH_SECURITY.md §5 |
| Max body | 10,000 characters |
| Client timeout | 20 s (`REQUEST_TIMEOUT_MS` in `app.js`) |

### 1.1 `GET /exec`

```json
{ "ok": true, "service": "cha-bazaar-orders", "version": "1.0.0" }
```

### 1.2 `POST { "action": "order" }`

Request (built by `app.js`; only SKUs and quantities are trusted):

```json
{
  "action": "order",
  "clientRequestId": "b7f1c2e4-6a2d-4c1e-9f0e-1c2d3e4f5a6b",
  "customer": {
    "name": "Rahim Uddin",
    "phone": "01712345678",
    "email": "",
    "address": "House 12, Road 5, Dhanmondi, Dhaka",
    "notes": "Call when you reach the gate"
  },
  "area": "inside_dhaka",
  "payment": "bkash",
  "promoCode": "",
  "items": [
    { "sku": "CB-ASSM-200", "qty": 2 },
    { "sku": "CB-MSLA-200", "qty": 1 }
  ],
  "expectedTotal": 1240,
  "lang": "en",
  "website": ""
}
```

| Field | Rules (server) |
|---|---|
| `clientRequestId` | 8–64 chars `[A-Za-z0-9_-]`. One per checkout attempt; retries reuse it |
| `customer.name` | 2–80 chars after cleaning |
| `customer.phone` | Spaces and `+88`/`88` removed, then must match `^01[3-9]\d{8}$` |
| `customer.email` | Optional; ≤ 120 chars; e-mail format |
| `customer.address` | 5–300 chars |
| `customer.notes` | ≤ 300 chars |
| `area` | A `delivery.zones[].id` from `catalog.js` (`inside_dhaka`, `outside_dhaka`) |
| `payment` | `cod`, `bkash` or `nagad` |
| `items` | 1–30 lines; `sku` must exist, have a price and stock; `qty` integer 1–50 (duplicates merged, max 50 per SKU) |
| `promoCode` | Optional; checked against the `Promos` tab |
| `expectedTotal` | Optional. If it differs from the server total, the order is **not** saved and `total_changed` is returned |
| `website` | Honeypot; must be empty |

Success:

```json
{
  "ok": true,
  "orderId": "CB-261107-0042",
  "createdAt": "2026-11-07T14:28:41.123Z",
  "area": "inside_dhaka",
  "subtotal": 1180,
  "discount": 0,
  "delivery": 60,
  "total": 1240,
  "payment": "bkash"
}
```

Sending the same `clientRequestId` again within 6 hours returns this same response and writes nothing.

### 1.3 `POST { "action": "checkPromo" }`

```json
{ "action": "checkPromo", "code": "EID10", "items": [{ "sku": "CB-PREM-250", "qty": 1 }] }
```

```json
{ "ok": true, "code": "EID10", "discount": 95 }
```

### 1.4 `POST { "action": "contact" }`

```json
{ "action": "contact", "name": "Nadia", "reply": "nadia@example.com", "message": "Do you deliver to Sylhet?", "lang": "en", "website": "" }
```

```json
{ "ok": true }
```

`reply` must be an e-mail address or a BD mobile number.

### 1.5 Errors

```json
{ "ok": false, "error": "invalid_phone", "field": "phone" }
```

| `error` | Meaning | Extra fields | Browser behaviour |
|---|---|---|---|
| `invalid_request` | Bad JSON, unknown action, bad `clientRequestId`, oversized | — | Generic error + WhatsApp/phone |
| `rejected` | Honeypot filled | — | Generic error |
| `invalid_name` / `invalid_phone` / `invalid_email` / `invalid_address` / `invalid_area` / `invalid_payment` | Field validation | `field` | Marks the field, focuses it |
| `invalid_reply` / `invalid_message` | Contact form validation | `field` | Error text with alternatives |
| `invalid_items` | Empty, unknown or unpriced SKU, bad quantity | `sku` (sometimes) | "Something in your cart has changed" |
| `sold_out` | Pack has `stock: 0` | `sku` | Names the tea |
| `insufficient_stock` | More than `stock` | `sku`, `available` | Names the tea and how many are left |
| `invalid_promo` / `promo_min_subtotal` | Promo not valid / subtotal too low | `minSubtotal` | Shown under the promo field |
| `total_changed` | Server total ≠ `expectedTotal` | `subtotal`, `discount`, `delivery`, `total` | Shows the new total; customer presses Place order again |
| `rate_limited` | Too many requests | — | "Please wait a few minutes" |
| `catalog_unavailable` | `CATALOG_URL` unreachable and no cached copy | — | Generic error + WhatsApp/phone |
| `server_error` | Unexpected exception (see Executions log) | — | Generic error + WhatsApp/phone |
| *(network error / timeout / HTTP ≠ 200)* | — | — | "We couldn't confirm your order…" + WhatsApp/phone; cart kept; retry is safe |

### 1.6 Example `curl`

```bash
curl -L -H "Content-Type: text/plain;charset=utf-8" --data '{"action":"order","clientRequestId":"test-0001-abcd","customer":{"name":"Test","phone":"01712345678","address":"Road 1, Dhaka"},"area":"inside_dhaka","payment":"cod","items":[{"sku":"CB-ASSM-200","qty":1}],"website":""}' "https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec"
```

`-L` is needed because Apps Script answers with a redirect.

## 2. Links that open other apps (IMPLEMENTED)

| Link | Format | Built by |
|---|---|---|
| Phone | `tel:+8801XXXXXXXXX` | `telLink()` in `shared.js` |
| WhatsApp | `https://wa.me/8801XXXXXXXXX?text=<encoded>` | `whatsappLink(text)` in `shared.js` |

WhatsApp messages: a greeting (contact links), the current cart (floating button), the order (checkout failure fallback), or "a question about order CB-…" (confirmation).

## 3. Internal JavaScript interface (IMPLEMENTED)

Classic scripts; top-level functions are globals in this order: `config.js` → `catalog.js` → `i18n.js` → `shared.js` → `analytics.js` → `app.js` → `animations.js`.

| File | Function | Purpose |
|---|---|---|
| `i18n.js` | `t(key, vars?, fallback?)`, `getLang()`, `applyI18n(root?)` | Translations |
| `shared.js` | `isSet(v)` | Config value set (not empty, not `YOUR_…`) |
| | `formatPrice(n)` | `৳1,470` |
| | `escapeHtml(s)`, `readJSON`, `writeJSON`, `removeKey` | Helpers |
| | `intlNumber(n)`, `displayNumber(n)`, `telLink()`, `whatsappLink(text)` | Phone links |
| | `zoneById(id)`, `deliveryFee(subtotal, zoneId)` | Delivery (same rule as `deliveryFee_` in `Code.gs`) |
| | `setLang(lang)` | Switch language; fires `cha:lang` |
| `analytics.js` | `chaTrack(name, props)` | No-op unless analytics is configured |
| `app.js` | `readCart()` | `[{ sku, qty, product, variant, price, lineTotal }]` (invalid or unbuyable rows dropped) |
| | `addToCart(sku, qty?)`, `setQty(sku, qty)`, `removeFromCart(sku)`, `clearCart()` | Cart |
| | `cartCount()`, `cartSubtotal()` | Totals |
| | `defaultVariant(p)`, `pricedVariants(p)`, `unitPrice(v)`, `stockState(v)`, `isBuyable(v)` | Catalogue |
| | `applyFilters()`, `renderCart()`, `openQuickView(p)`, `routeFromHash()` | UI |
| | `postToServer(payload)` | POST to `ORDER_ENDPOINT` with timeout |

Events: `cha:lang` (on `document`) after a language change.

### DOM contract

Renaming any of these breaks the scripts (see AGENTS.md).

- **Shop:** `cart-count`, `searchInput`, `sortSelect`, `category-filters`, `product-grid`, `samplers`, `sampler-grid`, `trust`, `reviews`, `reviews-summary`, `review-list`, `products`
- **Contact:** `contactForm`, `contactName`, `contactEmail`, `contactMessage`, `contactWebsite`, `contact-status`
- **Cart:** `cartOffcanvas`, `cart-items`, `recent-orders`, `cart-subtotal`, `cart-delivery`, `cart-total`, `cart-total-label`, `checkoutBtn`, `clearCartBtn`
- **Quick view:** `teaModal`, `teaModalTitle`, `teaModalBody`
- **Checkout:** `checkoutModal`, `checkoutForm`, `custName`, `custPhone`, `custEmail`, `areaGroup`, `area-options`, `custAddress`, `paymentGroup`, `pay-instructions`, `custNotes`, `rememberMe`, `forgetMe`, `custWebsite`, `checkout-summary`, `promoCode`, `applyPromo`, `promo-status`, `checkout-error`, `placeOrderBtn`
- **Confirmation:** `confirmModal`, `confirm-order-id`, `confirm-message`, `confirm-payment`, `confirm-whatsapp`
- **Other:** `waFloat`, `sr-status`, `appToast`, `appToastBody`, `year`

Attribute hooks:

- **Text and links:** `data-i18n`, `data-i18n-attr`, `data-fill`, `data-fill-table`, `data-contact`, `data-link`, `data-lang-toggle`, `data-lang-block`
- **Cart and filter controls:** `data-sku`, `data-category`, `data-reorder`, `data-qv-qty`

Removed in v2: `custCity`, `payCod`, `payMobile`, `free-delivery-amount` (replaced by delivery areas, payment values `cod/bkash/nagad`, and `data-fill`).

## 4. Static files fetched by the server (IMPLEMENTED)

The server downloads `CATALOG_URL` (your live `catalog.js`) with a cache-busting `?v=` parameter, caches it for 10 minutes, and keeps a 6-hour backup copy.

## 5. Proposed

| Item | Status |
|---|---|
| Online payment APIs (bKash/Nagad merchant checkout) | PROPOSED; needs its own server (PLAN Phase 4, P-22) |
| Endpoint to read live stock from the Sheet | PROPOSED; stock currently lives in `catalog.js` |

## 6. Versioning

`VERSION` in `Code.gs` (currently `1.0.0`). Update the deployment with **Manage deployments → Edit → New version** to keep the same URL.
