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
3. Click **Add to cart**: the cart count goes up.
4. Open the browser console (`F12` → Console). There should be no red errors.

If something is wrong, see [DEBUGGING.md](DEBUGGING.md).

## 5. Editing

| To change… | Edit |
|---|---|
| Products, prices, delivery rules | Top of `app.js` |
| Colours, fonts, spacing | `:root` in `styles.css` |
| Text on the page | `index.html` |
| Animation | `animations.css`, `animations.js` |

Refresh the browser after saving. Use a hard refresh (`Ctrl + Shift + R`, or `Cmd + Shift + R` on Mac) if the old version still shows.

**Reset your test data:** in DevTools go to **Application → Local Storage → http://localhost:8000**, then delete `tea-shop-cart` and `tea-shop-orders`.

## 6. Deploying (GitHub Pages)

1. Merge your changes into `main`.
2. In the repo, go to **Settings → Pages → Build and deployment**.
3. Set **Source** to *Deploy from a branch*, then choose `main` and `/ (root)` and save.
4. After a minute or two the site is at `https://sanjidmolik.github.io/Tea_shop/`. Whether Pages is enabled and which domain to use are TBD.

## 7. Environment variables

None. Configuration is in constants at the top of `app.js` (see ARCHITECTURE.md §5). Never add secrets to any file in this repo.

## 8. Proposed setup additions (not done yet)

| Item | Feature | Notes |
|---|---|---|
| Google Apps Script project and Sheet | P-01 | Setup steps go in INTEGRATIONS.md §3.1 |
| `package.json` with Playwright as a **dev** dependency | P-23 | Needs approval (AGENTS.md §1) |
