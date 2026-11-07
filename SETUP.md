# SETUP — Running Cha Bazaar Locally

> Related: [README.md](README.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [DEBUGGING.md](DEBUGGING.md) · [TESTING.md](TESTING.md)

Cha Bazaar is a static site. There is **nothing to install or build**; you only need a browser. A local web server is recommended so the page behaves the same as it will on a real host.

## 1. Requirements

| Need | Why | Required? |
|---|---|---|
| A modern browser (Chrome, Edge, Firefox or Safari, latest version) | Runs the site | Yes |
| Internet connection | Bootstrap, icons and fonts load from CDNs | Yes |
| Git | Clone and update the repo | Recommended |
| Python 3 **or** Node.js | Local web server | Recommended |
| Node.js 18+ | Automated tests, local order server (`npm test`, `npm run serve`) | For development |
| Python 3 + Pillow | Re-making WebP images (`npm run images`) | Only when adding photos |
| VS Code with the *Live Server* extension | Auto-reload while editing | Optional |

## 2. Get the code

Using Git (all operating systems):

```bash
git clone https://github.com/Sanjidmolik/Tea_shop.git
```

```bash
cd Tea_shop
```

Without Git: on GitHub click **Code → Download ZIP**, then unzip it.

## 3. Run it

### Windows

1. Install Python 3 from https://www.python.org/downloads/ and tick **"Add python.exe to PATH"** during installation.
2. Open **PowerShell** in the project folder (in File Explorer, Shift + right-click → *Open PowerShell window here*).
3. Start the server:

```powershell
py -m http.server 8000
```

4. Open http://localhost:8000 in your browser.
5. Press `Ctrl + C` in PowerShell to stop the server.

If `py` isn't found, try `python -m http.server 8000`.

### macOS

macOS includes Python 3 once the Command Line Tools are installed (`xcode-select --install`).

```bash
python3 -m http.server 8000
```

Open http://localhost:8000 and press `Ctrl + C` to stop.

### Linux

Most distributions include Python 3.

```bash
python3 -m http.server 8000
```

If it's missing, install it: on Debian/Ubuntu, `sudo apt install python3`; on Fedora, `sudo dnf install python3`.

### Alternative: Node.js (any OS)

Install Node.js LTS from https://nodejs.org, then run the following from the project folder:

```bash
npx serve .
```

This downloads the `serve` tool temporarily; it doesn't add anything to the project.

### Alternative: open the file directly

Double-clicking `index.html` also works (`file://`). The cart, checkout and animation behave the same. Use a local server if anything looks different from the live site.

### Alternative: VS Code Live Server

Install the *Live Server* extension, right-click `index.html`, then choose **Open with Live Server**.

## 4. Check it works

1. The green hero shows the tea chest and the "Garden tea" headline.
2. 8 tea cards appear under **The teas**.
3. Click **Add to cart**: the cart count goes up and the button briefly shows "Added".
4. Open the browser console (`F12` → Console). There should be no red errors.

If something is wrong, see [DEBUGGING.md](DEBUGGING.md).

## 5. Editing (layout and text)

| To change… | Edit |
|---|---|
| Products, prices, pack sizes, stock, delivery charges | `catalog.js` |
| Contact details, payment numbers | `config.js` |
| Bangla text | `i18n.js` (and the `data-lang-block="bn"` parts of the policy pages) |
| Colours, fonts, spacing | `:root` in `styles.css` |
| Text on the page | `index.html` |
| Animation | `animations.css`, `animations.js` |

Refresh the browser after saving. Use a hard refresh (`Ctrl + Shift + R`, or `Cmd + Shift + R` on Mac) if the old version still shows.

**Reset your test data:** in DevTools go to **Application → Local Storage → http://localhost:8000**, then delete the `tea-shop-…` and `cha-…` keys.

**New product photos:** put the JPEG in `Tea/`, run `npm run images` (needs Python with `pip install Pillow`), then reference `Tea/webp/<name>-card.webp` and `-large.webp` in `catalog.js`.

## 6. Deploying (GitHub Pages)

1. Merge your changes into `main`.
2. In the repo, go to **Settings → Pages → Build and deployment**.
3. Set **Source** to *Deploy from a branch*, then choose `main` and `/ (root)` and save.
4. After a minute or two the site is at `https://sanjidmolik.github.io/Tea_shop/`. Then set the Apps Script `CATALOG_URL` to `https://sanjidmolik.github.io/Tea_shop/catalog.js` and place a test order.
5. Using your own domain? Update `SITE_URL` in `config.js`, the canonical and `og:` URLs in the five HTML files, `robots.txt`, `sitemap.xml` and `CATALOG_URL`.

## 7. Business settings (`config.js`)

Open `config.js` in any text editor and replace each `YOUR_…` value:

| Setting | Example | What it switches on |
|---|---|---|
| `ORDER_ENDPOINT` | `https://script.google.com/macros/s/AKfy…/exec` | Real orders and contact messages ([apps-script/README.md](apps-script/README.md)) |
| `BUSINESS_PHONE` | `8801712345678` | Tap-to-call links |
| `WHATSAPP_NUMBER` | `8801712345678` | Floating WhatsApp button, WhatsApp links |
| `FACEBOOK_URL` | `https://www.facebook.com/yourpage` | Facebook links |
| `BUSINESS_EMAIL` | `hello@yourdomain.com` | E-mail link |
| `BKASH_NUMBER` / `BKASH_ACCOUNT_TYPE` | `01712345678` / `Merchant` or `Personal` | bKash payment steps ("Payment" vs "Send Money") |
| `NAGAD_NUMBER` / `NAGAD_ACCOUNT_TYPE` | as above | Nagad payment steps |
| `BUSINESS_ADDRESS`, `OPENING_HOURS` | English and Bangla text | Contact section and footer |
| `RETURN_WINDOW_DAYS` | `7` | Returns text |
| `ANALYTICS` | `{ provider: "plausible", plausibleDomain: "chabazaar.com" }` | Optional analytics |

Phone numbers can be written as `8801712345678`, `+8801712345678` or `01712345678`. Anything left as `YOUR_…` stays hidden from customers. On your own computer, a yellow **Setup needed** bar lists what's missing.

Products, prices, pack sizes, stock and delivery charges are in `catalog.js`. Read the comment at the top first: the file must stay strict JSON, because the order server reads it too. Run `npm run check` after editing it (or open the site and check the browser console for errors).

## 8. Testing with a working order server on your computer

```bash
npm install
```

```bash
npx playwright install chromium
```

```bash
npm run serve
```

This serves the site at http://localhost:8790 **and** a local copy of the order server at `/exec`, running the real `Code.gs` with an in-memory "sheet". To place test orders in the browser, temporarily set `ORDER_ENDPOINT: "http://localhost:8790/exec"` in `config.js`, and don't commit that change.

Run all automated tests:

```bash
npm test
```

On Windows, run these in PowerShell; the commands are the same.

## 9. Environment variables

None. Business settings are in `config.js`, products in `catalog.js`, and server settings are Apps Script **script properties** (`CATALOG_URL`, `OWNER_EMAIL`). Never add secrets to any file in this repo.
