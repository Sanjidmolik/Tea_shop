# API — Cha Bazaar Interfaces

> Status legend: **IMPLEMENTED** · **PROPOSED** · **TBD** (see [PRD.md](PRD.md)).
> Related: [ARCHITECTURE.md](ARCHITECTURE.md) · [DATABASE.md](DATABASE.md) · [INTEGRATIONS.md](INTEGRATIONS.md) · [AUTH_SECURITY.md](AUTH_SECURITY.md)

## 1. Existing HTTP endpoints

**None.** Cha Bazaar has no back end and makes no `fetch` or XHR calls. The only network requests are static asset loads:

| Request | Host | Purpose | Status |
|---|---|---|---|
| `GET /npm/bootstrap@5.3.3/dist/css/bootstrap.min.css` | cdn.jsdelivr.net | Styles | IMPLEMENTED |
| `GET /npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js` | cdn.jsdelivr.net | Offcanvas, modal, toast, collapse | IMPLEMENTED |
| `GET /npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css` (+ font files) | cdn.jsdelivr.net | Icons | IMPLEMENTED |
| `GET /css2?family=Big+Shoulders+Stencil…&family=Hind+Siliguri…` | fonts.googleapis.com / fonts.gstatic.com | Fonts | IMPLEMENTED |
| `GET /photo-1523906630133-f6934a1ab2b9?...` | images.unsplash.com | Premium Estate Blend image | IMPLEMENTED (licence TBD, A-14) |
| Local files: `styles.css`, `animations.css`, `app.js`, `animations.js`, `Tea/*.jpg` | same origin | App | IMPLEMENTED |

## 2. Existing internal JavaScript interface (IMPLEMENTED)

These are top-level functions in `app.js` (classic script, global scope). They are the "API" other code and tests should use. Signatures are exactly as in the source.

| Function | Signature | Returns / effect |
|---|---|---|
| `formatPrice` | `(n: number) → string` | `formatPrice(1470)` → `"৳1,470"` |
| `escapeHtml` | `(s: any) → string` | Escapes `& < > " '` |
| `readJSON` | `(key, fallback) → any` | Parsed `localStorage` value, or `fallback` |
| `writeJSON` | `(key, value) → void` | Silently ignores storage errors |
| `readCart` | `() → Array<Product & {qty}>` | Cart joined with `products`; invalid rows dropped |
| `writeCart` | `(cart: Array<{id, qty}>) → void` | Saves `{id, qty}` only, then `renderCart()` |
| `addToCart` | `(productId: number) → void` | +1 or new line; toast; count pop |
| `setQty` | `(productId, qty) → void` | `qty ≤ 0` removes the line |
| `removeFromCart` | `(productId) → void` | |
| `clearCart` | `() → void` | |
| `cartCount` | `(cart?) → number` | Total units |
| `cartSubtotal` | `(cart?) → number` | Taka |
| `deliveryFee` | `(subtotal) → number` | `0` if subtotal is 0 or ≥ 1500, else `60` |
| `applyFilters` | `() → void` | Reads search, sort and `activeCategory`; calls `renderProducts` |
| `renderProducts` | `(list) → void` | |
| `renderCategories` | `() → void` | |
| `renderCart` | `() → void` | |
| `renderCheckoutSummary` | `() → void` | |
| `generateOrderId` | `() → string` | `"CB-" + base36(Date.now()) + 2 random base-36 chars` |
| `showToast` | `(msg: string) → void` | |

### DOM contract (IMPLEMENTED)

`app.js` and `animations.js` find elements by these IDs. **Renaming any of them breaks the app** (see AGENTS.md):

`cart-count`, `free-delivery-amount`, `products`, `searchInput`, `sortSelect`, `category-filters`, `product-grid`, `contactForm`, `contactName`, `contactEmail`, `contactMessage`, `cartOffcanvas`, `cart-items`, `cart-subtotal`, `cart-delivery`, `cart-total`, `checkoutBtn`, `clearCartBtn`, `checkoutModal`, `checkoutForm`, `custName`, `custPhone`, `custEmail`, `custAddress`, `custCity`, `payCod`, `payMobile`, `custNotes`, `checkout-summary`, `confirmModal`, `confirm-order-id`, `confirm-message`, `appToast`, `appToastBody`, `year`.

Classes used as hooks: `.add-to-cart`, `.decrease`, `.increase`, `.remove`, `[data-category]`, `[data-id]`, `#resetFilters`, `.hero-title`, `.hero`, `.chest-face`, `.promises`, `.promise-list`, `.section-title`, `.tea`, `.tea-img`, `.cart-btn`, `.site-nav`, `.confirm`.

## 3. Proposed endpoints

### 3.1 Order and message endpoint: Google Apps Script web app (PROPOSED, P-01 / P-13)

| Item | Value |
|---|---|
| URL | `https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec` (**TBD**) |
| Method | `POST` |
| Request content type | `text/plain;charset=utf-8` whose body is a JSON string. This avoids a CORS preflight, which Apps Script can't answer. *Verify during P-01.* |
| Response | `application/json` from `ContentService` |
| Auth | None (public web app, "Execute as: me, Access: Anyone"). Abuse controls are in AUTH_SECURITY.md §5 |
| Idempotency | The client sends a `clientRequestId`; the server ignores duplicates for 10 minutes (PROPOSED) |

#### `action: "order"`: request

```json
{
  "action": "order",
  "clientRequestId": "b7f1c2e4-6a2d-4c1e-9f0e-1c2d3e4f5a6b",
  "customer": {
    "name": "Rahim Uddin",
    "phone": "01712345678",
    "email": "",
    "address": "House 12, Road 5, Dhanmondi",
    "city": "Dhaka",
    "notes": "Call when you reach the gate"
  },
  "zone": "inside_dhaka",
  "payment": "cash",
  "items": [
    { "id": 2, "qty": 2 },
    { "id": 3, "qty": 1 }
  ],
  "website": ""
}
```

- Only `id` and `qty` are sent. **Prices and totals from the client are ignored.**
- `website` is a honeypot field; it must be empty.
- `zone` values: `inside_dhaka`, `outside_dhaka` (P-03; rates TBD).
- `payment` values: `cash`, `bkash`, `nagad` (P-06). All are paid on delivery in Phase 1.

#### `action: "order"`: success `200`

```json
{
  "ok": true,
  "orderId": "CB-20261107-0042",
  "subtotal": 1180,
  "delivery": 60,
  "total": 1240,
  "message": "Order placed"
}
```

#### `action: "order"`: errors

Apps Script web apps always return HTTP 200, so errors are signalled in the body:

```json
{ "ok": false, "error": "invalid_phone", "field": "phone", "message": "Enter an 11-digit number starting with 01." }
```

| `error` | Meaning | Client behaviour |
|---|---|---|
| `invalid_request` | Malformed JSON or unknown action | Generic error + WhatsApp fallback |
| `invalid_phone`, `invalid_name`, `invalid_address`, `invalid_city` | Field validation failed | Mark the field invalid and focus it |
| `invalid_items` | Empty cart, unknown `id`, or `qty` not an integer from 1 to 50 | Ask the shopper to refresh the cart |
| `rate_limited` | Too many requests | "Please wait a minute and try again." |
| `server_error` | Unexpected | Generic error + WhatsApp fallback |
| *(network failure / timeout after 15s)* | — | Generic error + WhatsApp fallback; **don't** empty the cart |

#### `action: "contact"`: request / response

```json
{ "action": "contact", "name": "Nadia", "email": "nadia@example.com", "message": "Do you deliver to Sylhet?", "website": "" }
```

```json
{ "ok": true, "message": "Message sent" }
```

#### Example client call (PROPOSED, not in code)

```js
const res = await fetch(ORDER_ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(15000)
});
const data = await res.json();
```

#### Example `curl` (PROPOSED)

```bash
curl -L -X POST "https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec" -H "Content-Type: text/plain;charset=utf-8" --data '{"action":"order","customer":{"name":"Test","phone":"01712345678","address":"Road 1","city":"Dhaka"},"zone":"inside_dhaka","payment":"cash","items":[{"id":1,"qty":1}],"website":""}'
```

`-L` is required because Apps Script responds with a redirect.

### 3.2 WhatsApp click-to-chat link (PROPOSED, P-02)

This isn't an API call; it's a link that opens WhatsApp:

```
https://wa.me/<WHATSAPP_NUMBER>?text=<url-encoded message>
```

Example fallback message (URL-encode before use):

```
Hi Cha Bazaar, I'd like to order:
2× Assam Breakfast Blend (200g)
1× Masala Chai (200g)
Name: Rahim Uddin
Phone: 01712345678
Address: House 12, Road 5, Dhanmondi, Dhaka
```

`WHATSAPP_NUMBER` is in international format without `+`, e.g. `8801XXXXXXXXX` (**TBD**, PRD Q-2).

### 3.3 Online payment API (PROPOSED, Phase 4, needs approval)

bKash and Nagad online checkout need **server-side** merchant credentials and callbacks, so they can't be done safely from a static site. No endpoint is defined until the owner approves a back end (PLAN.md Phase 4, P-22). See INTEGRATIONS.md.

## 4. Versioning

TBD. Phase 1 has a single Apps Script deployment; publishing a new deployment changes the URL, so update `ORDER_ENDPOINT` in the same commit.
