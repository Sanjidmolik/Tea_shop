# AGENTS — Rules for AI Coding Assistants

> Applies to any AI agent (Claude Code, Copilot, Cursor, etc.) working in this repository. Human contributors should follow it too.
> Related: [ARCHITECTURE.md](ARCHITECTURE.md) · [DESIGN.md](DESIGN.md) · [API.md](API.md) · [TESTING.md](TESTING.md) · [PLAN.md](PLAN.md)

## 0. Read first

Before changing anything, read: `README.md`, `ARCHITECTURE.md`, `DESIGN.md`, the relevant section of `FEATURES.md`, and the files you are about to touch. **Never edit a file you haven't read in this session.**

## 1. Hard rules (MUST / MUST NOT)

1. **MUST NOT change the stack without written owner approval.** That includes adding a framework (React, Vue, Tailwind…), a bundler, `package.json` runtime dependencies, TypeScript, a back end, a database or a payment gateway. Propose it in an issue or a chat message and wait.
2. **MUST NOT make destructive changes without approval.** That includes deleting files, removing features, rewriting git history, force-pushing, renaming DOM IDs, changing `localStorage` key names, and changing the cart or order data format without a migration.
3. **MUST NOT put secrets in the repository.** No API keys, tokens, passwords, bKash/Nagad credentials or private Sheet IDs with edit links. Everything in this repo is public.
4. **MUST NOT invent facts.** Don't make up endpoints, phone numbers, prices, policies, reviews or integrations. Use `TBD` and ask.
5. **MUST NOT fabricate customer reviews or testimonials.** P-04 uses only real quotes supplied by the owner.
6. **MUST keep the shop working without `animations.js`.** Core behaviour belongs in `app.js`; motion belongs in `animations.*`.
7. **MUST respect `prefers-reduced-motion`.** New animation goes inside the existing reduced-motion guards.
8. **MUST escape all dynamic text** inserted with `innerHTML`, using `escapeHtml()`, or use `textContent`.
9. **MUST NOT push to `main` directly or merge pull requests.** Work on the assigned branch and open a PR only when asked.
10. **MUST NOT install MCP servers, packages or browser extensions automatically** (see MCP.md).

## 2. Protected functionality

These work today (IMPLEMENTED) and must keep working after every change. Run TESTING.md §5 to check.

| Area | What must keep working |
|---|---|
| Catalogue | 8 teas render with image, grade, origin, brew data, price and Add to cart |
| Filters | Search (name, category, description, grade, origin), sort (5 options), category tabs with counts, empty state with Show all teas |
| Cart | Add (per pack size), +/−, − at 1 removes, remove, Empty cart (with confirmation), totals, delivery by area, free-delivery bar, cross-tab sync, persists across reload, reorder |
| Checkout | Disabled when the cart is empty; validation incl. delivery area; phone normalisation; one request per attempt (`clientRequestId`); **confirmation only after server `ok:true`**; errors keep the cart and offer WhatsApp/phone; cart emptied only after success |
| Contact | Validation; sends to the server; never reports success without the server |
| Layout | No horizontal scroll from 320px to 1920px wide |
| Accessibility | Skip link, focus outlines, labels, `aria-*` attributes listed in DESIGN.md §8 |
| Motion | Disabled under reduced motion; the cards' heading reveal works (see DEBUGGING.md, clip-path gotcha) |

### Protected contracts

- **DOM IDs and hook classes** listed in API.md §2. Don't rename them without updating every reference in the same commit.
- **`localStorage` keys and formats** in DATABASE.md §3 (cart is `{sku, qty}`).
- **`catalog.js` must stay strict JSON** after `window.CHA_CATALOG =` (the order server parses it). Never rename a SKU.
- **Server rules must match:** `deliveryFee` in `shared.js` and `deliveryFee_` in `Code.gs`.
- **Never show fake reviews, ratings, stock or discounts.** Reviews come only from `catalog.js` `reviews`; promo codes only from the Sheet.
- **Script order:** Bootstrap bundle → `config.js` → `catalog.js` → `i18n.js` → `shared.js` → `analytics.js` → `app.js` → `store.js` → `animations.js`.
- **Sample listings** (`"sample": true` in `catalog.js`) must stay unbuyable in the browser *and* on the server until the owner replaces them with real data.
- **URLs** `index.html?shop=…`, `?product=…` and `#tea/<slug>` are public links; keep them working.
- **Design tokens** in `:root` of `styles.css`. Change values there, not with one-off hex codes.

## 3. How to work

1. **Pick a planned item.** Work comes from PLAN.md / FEATURES.md (IDs `P-xx`). If a request isn't in the plan, confirm the scope first.
2. **Ask about TBDs** (phone numbers, endpoints, rates) instead of guessing.
3. **Make the smallest change** that meets the acceptance criteria in FEATURES.md. No drive-by refactors.
4. **Match the existing style:** 2-space indentation, `const`/arrow functions, double quotes, sections marked with `// ---- Name ----` comments, BEM-ish class names, sentence-case UI text.
5. **Follow DESIGN.md:** tokens, type scale, voice, and the "Things to avoid" list.
6. **Test:**
   - Run the checks in TESTING.md that cover your change.
   - For UI changes, look at it at 390px and 1280px wide.
   - Check that there are no console errors.
   - Check with reduced motion on.
7. **Update the docs in the same commit:** change the feature status from PROPOSED to IMPLEMENTED in FEATURES.md and PRD.md, and update DATABASE.md and API.md if contracts changed.
8. **Commit** with a clear message describing what changed and why. Don't include model names in commit messages.

## 4. When to stop and ask

Stop and ask the owner before:

- Any action in §1 rules 1, 2 or 9
- Choosing between Google Sheets, email or WhatsApp for orders (PRD Q-1)
- Showing or changing prices, delivery fees or policies
- Adding any third-party script (analytics, chat widgets, pixels), because it affects privacy and performance
- Any change that sends customer data anywhere new
- Anything you can't test

## 5. Definition of done

- Acceptance criteria in FEATURES.md are met
- The relevant TESTING.md checks pass and protected functionality still works
- No console errors; no horizontal scroll at 390px
- WCAG AA contrast for any new colours
- Docs updated; status labels accurate
- Work committed on the assigned branch and pushed


## 6. Tests to run (v2)

`npm test` must pass before every commit that touches code: static checks, 27 server tests and the browser suite. Add a test when you fix a bug. Never weaken a test to make it pass.
