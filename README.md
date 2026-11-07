# Cha Bazaar — Tea Shop

A small, dependency-free e-commerce frontend for a tea shop, built with HTML, Bootstrap 5 and vanilla JavaScript.

## Features

- Product catalogue with descriptions, pack sizes and prices (৳ BDT)
- Search, sort (price / name) and category filters
- Cart in a slide-out panel with quantity controls, saved in `localStorage` and synced across tabs
- Delivery fee with a free-delivery threshold
- Checkout form with validation (Bangladeshi mobile number, address, payment method)
- Order confirmation with an order ID; orders are saved in `localStorage` (`tea-shop-orders`)
- About and Contact sections, toast notifications, responsive layout

## Design

The look is based on the stencilled wooden chests tea travels in from the estate. The hero shows one of these chests, and the rest of the page is a calm catalogue.

- Colours: garden green `#173F2E`, bud green `#9BBF4A`, tea-liquor amber `#C27A14`, leaf-tint paper `#F1F4EC`
- Type: Big Shoulders Stencil for headings, Hind Siliguri (Bengali and Latin) for text
- Each tea shows its grade, origin and brewing temperature and time

All colours and the type scale are CSS variables at the top of `styles.css`.

### Animation

Motion lives in `animations.css` and `animations.js`:

- Hero: drifting tea leaves; the headline rises word by word; the chest drops in, gets stamped, and tilts toward the mouse
- A scrolling ticker for delivery and payment info
- Section headings wipe on like spray paint through a stencil; tea cards rise in on scroll and after filtering
- Add to cart: the tea's photo flies into the cart and the button reads "Added"
- The order confirmation label is stamped on

Visitors whose device asks for reduced motion get the static site. To turn animation off entirely, remove the two `animations.*` lines from `index.html`.

## Run

Open `index.html` in a browser, or serve the folder locally:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Customise

- Products: edit the `products` array at the top of `app.js`. Images go in `Tea/`.
- Currency, delivery fee and free-delivery threshold: constants at the top of `app.js`.

## Note

This is a frontend demo. There is no backend or payment processing: orders are kept only in the visitor's browser.
