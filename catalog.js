/*
  Cha Bazaar catalogue: the single source of truth for products, prices, pack sizes,
  stock and delivery charges.

  The website loads this file, AND the Google Apps Script order server downloads it to
  re-calculate every order. So the part after "window.CHA_CATALOG =" MUST stay strict JSON:
    - double quotes only, no trailing commas, no comments inside the braces
    - keep comments in this header block only
  Run `npm test` (or open the site) after editing to check it still parses.

  Fields
    products[].variants[]   one entry per pack size
      sku       unique code; never reuse or rename a SKU (old carts point to it)
      weightG   pack weight in grams (used for "price per 100g")
      price     taka; set to null to hide a size until you have a real price
      stock     null = not tracked (shown as available); 0 = sold out;
                1..lowStockThreshold = "Only N left"
    products[].type          "tea" (default) or "bundle" (shown in the Sampler section)
    delivery.zones[].freeOver  subtotal (taka) from which that zone's delivery is free; null = never free
    reviews[]               ONLY genuine customer reviews: { "name", "rating" (1-5), "text", "date" (YYYY-MM-DD), "productId" (optional) }
*/
window.CHA_CATALOG =
{
  "currency": "BDT",
  "lowStockThreshold": 5,
  "delivery": {
    "zones": [
      {
        "id": "inside_dhaka",
        "label": { "en": "Inside Dhaka", "bn": "ঢাকার ভেতরে" },
        "fee": 60,
        "freeOver": 1500,
        "estimate": { "en": "1–2 days", "bn": "১–২ দিন" }
      },
      {
        "id": "outside_dhaka",
        "label": { "en": "Outside Dhaka", "bn": "ঢাকার বাইরে" },
        "fee": 120,
        "freeOver": null,
        "estimate": { "en": "3–5 days", "bn": "৩–৫ দিন" }
      }
    ]
  },
  "products": [
    {
      "id": 1,
      "slug": "darjeeling",
      "name": "Darjeeling First Flush",
      "category": "Black",
      "grade": "FTGFOP1",
      "origin": "Darjeeling, India",
      "description": "Spring's first picking. Light, floral and bright, with a muscatel finish.",
      "tastingNotes": "Floral, bright, muscatel grape",
      "ingredients": "Black tea (Darjeeling first flush)",
      "brew": { "temp": 85, "mins": 3 },
      "image": {
        "card": "Tea/webp/darjeeling-card.webp",
        "large": "Tea/webp/darjeeling-large.webp",
        "fallback": "Tea/darjeeling.jpg",
        "alt": "Loose Darjeeling first flush tea leaves in a white bowl"
      },
      "variants": [
        { "sku": "CB-DARJ-100", "weightG": 100, "price": 650, "stock": null }
      ]
    },
    {
      "id": 2,
      "slug": "assam",
      "name": "Assam Breakfast Blend",
      "category": "Black",
      "grade": "BOP",
      "origin": "Assam, India",
      "description": "Bold and malty. Strong enough to take milk and sugar.",
      "tastingNotes": "Malty, bold, brisk",
      "ingredients": "Black tea (Assam)",
      "brew": { "temp": 100, "mins": 4 },
      "image": {
        "card": "Tea/webp/Assam_Tea-card.webp",
        "large": "Tea/webp/Assam_Tea-large.webp",
        "fallback": "Tea/Assam_Tea.jpg",
        "alt": "A heap of dark, twisted Assam black tea leaves"
      },
      "variants": [
        { "sku": "CB-ASSM-200", "weightG": 200, "price": 380, "stock": null }
      ]
    },
    {
      "id": 3,
      "slug": "masala-chai",
      "name": "Masala Chai",
      "category": "Spiced",
      "grade": "CTC",
      "origin": "Sylhet, Bangladesh",
      "description": "Sylhet CTC with cardamom, ginger, cinnamon and clove. Simmer with milk.",
      "tastingNotes": "Warming, spiced, rich with milk",
      "ingredients": "Black tea (Sylhet CTC), cardamom, ginger, cinnamon, clove",
      "brew": { "temp": 100, "mins": 5 },
      "image": {
        "card": "Tea/webp/Masala_tea-card.webp",
        "large": "Tea/webp/Masala_tea-large.webp",
        "fallback": "Tea/Masala_tea.jpg",
        "alt": "Granular CTC tea mixed with ground spices"
      },
      "variants": [
        { "sku": "CB-MSLA-200", "weightG": 200, "price": 420, "stock": null }
      ]
    },
    {
      "id": 4,
      "slug": "green-tea",
      "name": "Green Tea",
      "category": "Green",
      "grade": "Leaf",
      "origin": "Sylhet, Bangladesh",
      "description": "Fresh and grassy, with a clean, light cup. Don't use boiling water.",
      "tastingNotes": "Grassy, fresh, clean",
      "ingredients": "Green tea",
      "brew": { "temp": 80, "mins": 2 },
      "image": {
        "card": "Tea/webp/Green-Tea-Leaves-2-card.webp",
        "large": "Tea/webp/Green-Tea-Leaves-2-large.webp",
        "fallback": "Tea/Green-Tea-Leaves-2.jpg",
        "alt": "Loose green tea leaves on a white dish"
      },
      "variants": [
        { "sku": "CB-GRN-100", "weightG": 100, "price": 450, "stock": null }
      ]
    },
    {
      "id": 5,
      "slug": "jasmine",
      "name": "Jasmine Green Tea",
      "category": "Green",
      "grade": "Leaf",
      "origin": "Fujian, China",
      "description": "Green tea layered with jasmine blossoms until it takes on their scent.",
      "tastingNotes": "Fragrant, floral, sweet",
      "ingredients": "Green tea scented with jasmine blossoms",
      "brew": { "temp": 80, "mins": 3 },
      "image": {
        "card": "Tea/webp/Loose_Jasmine_Tea_Leaves-card.webp",
        "large": "Tea/webp/Loose_Jasmine_Tea_Leaves-large.webp",
        "fallback": "Tea/Loose_Jasmine_Tea_Leaves.jpg",
        "alt": "Long, twisted jasmine green tea leaves"
      },
      "variants": [
        { "sku": "CB-JSMN-100", "weightG": 100, "price": 520, "stock": null }
      ]
    },
    {
      "id": 6,
      "slug": "premium-blend",
      "name": "Premium Estate Blend",
      "category": "Black",
      "grade": "OP",
      "origin": "Sylhet and Assam",
      "description": "Our house blend of long-leaf Sylhet and Assam. Smooth and full without bitterness.",
      "tastingNotes": "Smooth, full-bodied, low bitterness",
      "ingredients": "Black tea (Sylhet and Assam long leaf)",
      "brew": { "temp": 95, "mins": 4 },
      "image": {
        "card": "https://images.unsplash.com/photo-1523906630133-f6934a1ab2b9?w=600&h=450&fit=crop&fm=webp&q=75",
        "large": "https://images.unsplash.com/photo-1523906630133-f6934a1ab2b9?w=1000&fit=max&fm=webp&q=75",
        "fallback": "Tea/MIX_tea.jpg",
        "alt": "Premium Estate Blend loose leaf tea"
      },
      "variants": [
        { "sku": "CB-PREM-250", "weightG": 250, "price": 950, "stock": null }
      ]
    },
    {
      "id": 7,
      "slug": "chamomile",
      "name": "Chamomile Calm",
      "category": "Herbal",
      "grade": "Whole flower",
      "origin": "Egypt",
      "description": "Whole chamomile flowers. Caffeine-free, for the evening.",
      "tastingNotes": "Honeyed, apple-like, soothing",
      "ingredients": "Chamomile flowers. Caffeine-free",
      "brew": { "temp": 100, "mins": 5 },
      "image": {
        "card": "Tea/webp/calming-herbal-tea-blend-chamomile-600nw-2568834187-card.webp",
        "large": "Tea/webp/calming-herbal-tea-blend-chamomile-600nw-2568834187-large.webp",
        "fallback": "Tea/calming-herbal-tea-blend-chamomile-600nw-2568834187.jpg",
        "alt": "Dried whole chamomile flowers"
      },
      "variants": [
        { "sku": "CB-CHAM-050", "weightG": 50, "price": 480, "stock": null },
        { "sku": "CB-CHAM-100", "weightG": 100, "price": null, "stock": null },
        { "sku": "CB-CHAM-250", "weightG": 250, "price": null, "stock": null }
      ]
    },
    {
      "id": 8,
      "slug": "mixed-tea",
      "name": "Everyday Mixed Tea",
      "category": "Black",
      "grade": "CTC",
      "origin": "Sylhet, Bangladesh",
      "description": "The strong, quick-brewing tea of every Dhaka tea stall.",
      "tastingNotes": "Strong, brisk, full colour",
      "ingredients": "Black tea (Sylhet CTC and dust)",
      "brew": { "temp": 100, "mins": 3 },
      "image": {
        "card": "Tea/webp/MIX_tea-card.webp",
        "large": "Tea/webp/MIX_tea-large.webp",
        "fallback": "Tea/MIX_tea.jpg",
        "alt": "Loose black tea blend"
      },
      "variants": [
        { "sku": "CB-MIXD-200", "weightG": 200, "price": 350, "stock": null }
      ]
    }
  ],
  "reviews": []
}
;
