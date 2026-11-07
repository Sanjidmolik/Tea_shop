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
