# AUTH & SECURITY — Cha Bazaar

> Status legend: **IMPLEMENTED** · **PROPOSED** · **TBD** (see [PRD.md](PRD.md)).
> Related: [ARCHITECTURE.md](ARCHITECTURE.md) · [API.md](API.md) · [DATABASE.md](DATABASE.md) · [INTEGRATIONS.md](INTEGRATIONS.md) · [AGENTS.md](AGENTS.md)

## 1. Authentication and permissions

| Item | Status |
|---|---|
| Customer accounts, login, sessions, passwords | **None.** Not implemented, and not planned for Phases 1–3 |
| Admin panel | **None.** In Phase 1 the owner manages orders in the Google Sheet, protected by their Google account (PROPOSED) |
| Roles | TBD. A Phase 1 proposal follows |

### Proposed Phase 1 permissions model

| Actor | Can | Cannot |
|---|---|---|
| Shopper (anonymous) | Browse; manage their own cart in their browser; submit orders and messages to the public endpoint | Read any order, message or Sheet data |
| Apps Script web app (runs as the owner) | Append rows to the Sheet; send email alerts to the owner | Anything beyond the Sheet and email (keep OAuth scopes minimal) |
| Owner (Google account, 2-step verification **required**) | Read and edit the Sheet; redeploy the script | — |
| Staff | TBD; share the Sheet as view or edit as needed | Must not get script-edit rights without need |

Adding customer login is a stack change and needs owner approval (AGENTS.md §1).

## 2. Current security posture (IMPLEMENTED)

| Control | Where | Notes |
|---|---|---|
| Output escaping | `escapeHtml()` used on all product and user strings inserted with `innerHTML` | Contact and checkout values go into `textContent` or the order object |
| Input validation | HTML constraint validation: required fields, BD mobile `pattern`, `type="email"` | **Client-side only.** It can be bypassed, which matters once orders are sent (§5) |
| Safe storage parsing | `readJSON` wraps `JSON.parse` in try/catch; `readCart` drops invalid rows | |
| No secrets | The repo contains no keys or tokens | Must stay this way |
| HTTPS | Depends on the host. GitHub Pages serves HTTPS | Enforce HTTPS: TBD |
| Third-party code | Bootstrap and Icons pinned to exact versions on jsDelivr | **No SRI hashes** (P-24) |

### Known weaknesses

| # | Weakness | Risk | Fix |
|---|---|---|---|
| W-1 | Full personal data (name, phone, address) is kept indefinitely in `localStorage` | Anyone using the same device can read it | P-01 step 6; privacy policy (P-04) |
| W-2 | CDN scripts have no `integrity` attribute | A compromised CDN could inject code | P-24 |
| W-3 | No Content-Security-Policy | Limits defence in depth against XSS | P-24 |
| W-4 | Prices and totals are calculated in the browser | Harmless today; unsafe once orders are sent | Server recalculation (P-01, FR-22) |
| W-5 | Images are hotlinked from Unsplash | Privacy (third-party request) and availability | P-14 |

## 3. Validation rules

| Field | Client (IMPLEMENTED) | Server (PROPOSED, P-01) |
|---|---|---|
| Name | required | 2–80 chars, trimmed, control characters stripped |
| Phone | `(\+?88)?01[3-9]\d{8}` after removing spaces and dashes | Same regex; normalise to `01XXXXXXXXX` |
| Email | optional, `type=email` | Optional; ≤ 120 chars; basic format |
| Address | required | 5–300 chars |
| City | required | 2–60 chars (replaced by the zone in P-03) |
| Notes | optional | ≤ 300 chars |
| Items | from the cart | 1–30 lines; `id` in the price list; `qty` an integer from 1 to 50 |
| Zone, payment | — | Must be one of the allowed values (API.md §3.1) |
| Honeypot `website` | hidden field, empty | Must be empty, otherwise reject silently |

**Spreadsheet formula injection (PROPOSED):** before writing to the Sheet, the server prefixes any value starting with `=`, `+`, `-` or `@` with `'`. This stops a malicious "name" from running as a formula when the owner opens the Sheet.

## 4. Hardening for the static site (PROPOSED, P-24)

1. Add `integrity="sha384-…"` and `crossorigin="anonymous"` to every jsDelivr `<link>` and `<script>`. Take the hashes from jsDelivr; don't hand-compute them.
2. Add a CSP `<meta>` tag. Starting point, to be tested before shipping:

```
default-src 'self';
script-src 'self' https://cdn.jsdelivr.net;
style-src 'self' https://cdn.jsdelivr.net https://fonts.googleapis.com 'unsafe-inline';
font-src https://cdn.jsdelivr.net https://fonts.gstatic.com;
img-src 'self' data: https://images.unsplash.com;
connect-src 'self' https://script.google.com https://script.googleusercontent.com;
frame-ancestors 'none'
```

`'unsafe-inline'` for styles is currently needed because the JS sets inline `style` attributes; review it later. `frame-ancestors` is ignored in `<meta>` and only works as an HTTP header, and GitHub Pages can't set headers (TBD).

3. Add `rel="noopener"` to any future `target="_blank"` links (WhatsApp, Facebook).

## 5. Protecting the proposed order endpoint (P-01)

The Apps Script web app is public, so anyone can send requests to it.

| Threat | Control |
|---|---|
| Spam or bot orders | Honeypot; `CacheService` rate limit (for example 5 orders per 10 minutes, keyed by phone number); the owner calls to confirm before dispatch |
| Price tampering | Ignore client prices; recalculate from the server price list |
| Duplicate submits | Disable the button while sending; `clientRequestId` checked for 10 minutes |
| Race conditions on the Sheet | `LockService.getScriptLock()` around the append |
| Oversized payloads | Reject request bodies over 10 KB |
| Data exposure | `doGet` returns nothing sensitive; the Sheet isn't shared publicly |
| Script owner account takeover | Google 2-step verification; minimal OAuth scopes |

## 6. OWASP Top 10 (2021) mapping

| OWASP risk | Relevance today | Control | Status |
|---|---|---|---|
| A01 Broken Access Control | No server data yet. Later: the Sheet must not be public | Keep the Sheet private; the script runs as the owner and only appends | PROPOSED |
| A02 Cryptographic Failures | Personal data in transit to the endpoint | HTTPS only (GitHub Pages and Apps Script both use HTTPS) | PROPOSED |
| A03 Injection (XSS, formula injection) | `innerHTML` rendering; Sheet formulas | `escapeHtml` (IMPLEMENTED); formula prefixing (PROPOSED); CSP (PROPOSED) | Partly IMPLEMENTED |
| A04 Insecure Design | Trusting client totals | Server recalculation (FR-22) | PROPOSED |
| A05 Security Misconfiguration | Web app access settings; no CSP | Review the deployment settings; P-24 | PROPOSED |
| A06 Vulnerable and Outdated Components | Bootstrap 5.3.3, Icons 1.11.3 | Pinned versions; check for advisories each quarter; SRI | Partly IMPLEMENTED |
| A07 Identification and Authentication Failures | No auth exists | Owner's Google account uses 2-step verification | PROPOSED |
| A08 Software and Data Integrity Failures | CDN scripts without SRI | P-24 | PROPOSED |
| A09 Security Logging and Monitoring Failures | No logs | The Sheet row is the audit log; Apps Script execution log; email alert per order | PROPOSED |
| A10 Server-Side Request Forgery | Not applicable (the server doesn't fetch user-supplied URLs) | Keep it that way | — |

## 7. Payments

Phase 1 is **pay on delivery only** (cash, or bKash/Nagad paid to the rider or on a call). The site never handles card numbers, PINs or OTPs. Online payment (P-22) needs a server, merchant credentials kept in server-side secrets, signature verification of payment callbacks, and owner approval. See INTEGRATIONS.md §3.4.

## 8. Privacy

- Collect only what's needed for delivery (name, phone, address, city, optional email and note).
- Publish a privacy notice (P-04) explaining what's collected, where it's stored (Google Sheet), for how long (TBD), and how to request deletion.
- Analytics (P-19) must not receive personal data.

## 9. Reporting a vulnerability

TBD. Suggested: email the owner's contact address (PRD Q-3). Don't open public issues for security problems.
