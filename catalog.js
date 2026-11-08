/*
  Cha Bazaar catalogue: the single source of truth for the shop's structure and products.
  It is built to be edited by an admin panel later; until then, edit it by hand.

  The website loads this file, AND the Google Apps Script order server downloads it to
  re-calculate every order. So the part after the line starting window.CHA_CATALOG MUST stay
  strict JSON: double quotes only, no trailing commas, no comments inside the braces.
  Run `npm run check` after editing.

  Structure (Adagio-style organisation: department > category, plus filters and collections)
    departments[]   top menu groups: tea, teaware, gifts
    categories[]    { id, department, icon (Bootstrap icon), label, intro } shown in the Shop menu
    filters         caffeine, flavours, regions, prices: the options in the shop sidebar
    collections[]   hand-picked groups shown on the home page (e.g. "featured")
    products[]
      department, category       must match ids above
      caffeine, flavours, region optional, used by the filters (tea only)
      collections                e.g. ["featured"]
      sample: true               PLACEHOLDER listing with a predicted price. Shown with a
                                 "Sample listing" label and cannot be bought (the order server
                                 refuses it). Replace with real data, then remove "sample".
      image                      { card, large, fallback, alt } or null (shows a placeholder)
      variants[]                 one per size
        sku       unique; never reuse or rename (carts and orders point to it)
        weightG   grams, for tea (gives "price per 100g"); omit for teaware/gifts
        label     { en, bn } size name for non-tea items, e.g. "600 ml", "Set of 6"
        price     taka; null hides the size until you have a real price
        stock     null = not tracked; 0 = sold out; 1..lowStockThreshold = "Only N left"
    delivery.zones[].freeOver    subtotal from which that zone is free; null = never
    reviews[]                    ONLY genuine reviews: { name, rating 1-5, text, date YYYY-MM-DD, productId? }
*/
window.CHA_CATALOG =
{
  "currency": "BDT",
  "lowStockThreshold": 5,
  "departments": [
    {
      "id": "tea",
      "label": {
        "en": "Tea",
        "bn": "চা"
      },
      "intro": {
        "en": "Estate teas from Bangladesh, India and beyond, packed fresh every week.",
        "bn": "বাংলাদেশ, ভারত ও অন্যান্য দেশের বাগানের চা, প্রতি সপ্তাহে টাটকা প্যাক করা।"
      }
    },
    {
      "id": "teaware",
      "label": {
        "en": "Teaware",
        "bn": "চায়ের সরঞ্জাম"
      },
      "intro": {
        "en": "Pots, cups and tools for brewing a better cup.",
        "bn": "ভালো চা বানানোর জন্য পট, কাপ ও সরঞ্জাম।"
      }
    },
    {
      "id": "gifts",
      "label": {
        "en": "Gifts",
        "bn": "উপহার"
      },
      "intro": {
        "en": "Sampler boxes and gift sets for every tea lover.",
        "bn": "চা-প্রেমীদের জন্য স্যাম্পলার বক্স ও গিফট সেট।"
      }
    }
  ],
  "categories": [
    {
      "id": "black-tea",
      "department": "tea",
      "icon": "bi-cup-hot",
      "label": {
        "en": "Black tea",
        "bn": "কালো চা"
      },
      "intro": {
        "en": "Strong, malty and brisk. The everyday cup of Bangladesh.",
        "bn": "কড়া ও মল্টি স্বাদ। বাংলাদেশের প্রতিদিনের চা।"
      }
    },
    {
      "id": "green-tea",
      "department": "tea",
      "icon": "bi-flower1",
      "label": {
        "en": "Green tea",
        "bn": "সবুজ চা"
      },
      "intro": {
        "en": "Fresh, light and grassy. Brew with water below boiling.",
        "bn": "হালকা ও টাটকা স্বাদ। ফুটন্ত পানির চেয়ে কম গরম পানিতে বানান।"
      }
    },
    {
      "id": "chai",
      "department": "tea",
      "icon": "bi-fire",
      "label": {
        "en": "Chai and spiced",
        "bn": "চা ও মসলা চা"
      },
      "intro": {
        "en": "Black tea with whole spices, made to simmer with milk.",
        "bn": "আস্ত মসলা মেশানো কালো চা, দুধে ফুটিয়ে খাওয়ার জন্য।"
      }
    },
    {
      "id": "herbal",
      "department": "tea",
      "icon": "bi-moon-stars",
      "label": {
        "en": "Herbal and caffeine-free",
        "bn": "ভেষজ ও ক্যাফেইনমুক্ত"
      },
      "intro": {
        "en": "Flowers, herbs and spices for any time of day.",
        "bn": "দিনের যেকোনো সময়ের জন্য ফুল, ভেষজ ও মসলা।"
      }
    },
    {
      "id": "oolong",
      "department": "tea",
      "icon": "bi-tsunami",
      "label": {
        "en": "Oolong",
        "bn": "উলং চা"
      },
      "intro": {
        "en": "Partly oxidised teas between green and black.",
        "bn": "সবুজ ও কালো চায়ের মাঝামাঝি, আংশিক জারিত চা।"
      }
    },
    {
      "id": "white-tea",
      "department": "tea",
      "icon": "bi-snow",
      "label": {
        "en": "White tea",
        "bn": "সাদা চা"
      },
      "intro": {
        "en": "Delicate young buds and leaves, lightly processed.",
        "bn": "কোমল কুঁড়ি ও পাতা, খুব কম প্রক্রিয়াজাত।"
      }
    },
    {
      "id": "teapots",
      "department": "teaware",
      "icon": "bi-cup-straw",
      "label": {
        "en": "Teapots",
        "bn": "টি-পট"
      },
      "intro": {
        "en": "Glass and ceramic pots for loose-leaf tea.",
        "bn": "খোলা পাতার চায়ের জন্য কাচ ও সিরামিকের পট।"
      }
    },
    {
      "id": "cups",
      "department": "teaware",
      "icon": "bi-cup",
      "label": {
        "en": "Cups and mugs",
        "bn": "কাপ ও মগ"
      },
      "intro": {
        "en": "From clay bhar to everyday mugs.",
        "bn": "মাটির ভাঁড় থেকে প্রতিদিনের মগ।"
      }
    },
    {
      "id": "infusers",
      "department": "teaware",
      "icon": "bi-funnel",
      "label": {
        "en": "Infusers and strainers",
        "bn": "ইনফিউজার ও ছাঁকনি"
      },
      "intro": {
        "en": "Brew loose leaf without the mess.",
        "bn": "ঝামেলা ছাড়া খোলা পাতার চা বানান।"
      }
    },
    {
      "id": "storage",
      "department": "teaware",
      "icon": "bi-box2",
      "label": {
        "en": "Storage tins",
        "bn": "চা রাখার কৌটা"
      },
      "intro": {
        "en": "Airtight tins that keep tea fresh.",
        "bn": "চা টাটকা রাখার বায়ুরোধী কৌটা।"
      }
    },
    {
      "id": "gift-sets",
      "department": "gifts",
      "icon": "bi-gift",
      "label": {
        "en": "Gift sets",
        "bn": "গিফট সেট"
      },
      "intro": {
        "en": "Tea and teaware boxed together.",
        "bn": "চা ও সরঞ্জাম একসাথে বাক্সে।"
      }
    },
    {
      "id": "samplers",
      "department": "gifts",
      "icon": "bi-grid-3x3-gap",
      "label": {
        "en": "Samplers",
        "bn": "স্যাম্পলার"
      },
      "intro": {
        "en": "Small packs of several teas to find your favourite.",
        "bn": "প্রিয় চা খুঁজে পেতে কয়েক রকম চায়ের ছোট প্যাক।"
      }
    }
  ],
  "filters": {
    "caffeine": [
      {
        "id": "high",
        "label": {
          "en": "High",
          "bn": "বেশি"
        }
      },
      {
        "id": "medium",
        "label": {
          "en": "Medium",
          "bn": "মাঝারি"
        }
      },
      {
        "id": "low",
        "label": {
          "en": "Low",
          "bn": "কম"
        }
      },
      {
        "id": "none",
        "label": {
          "en": "Caffeine-free",
          "bn": "ক্যাফেইনমুক্ত"
        }
      }
    ],
    "flavours": [
      {
        "id": "malty",
        "label": {
          "en": "Malty and bold",
          "bn": "মল্টি ও কড়া"
        }
      },
      {
        "id": "floral",
        "label": {
          "en": "Floral",
          "bn": "ফুলের সুবাস"
        }
      },
      {
        "id": "fruity",
        "label": {
          "en": "Fruity",
          "bn": "ফলের স্বাদ"
        }
      },
      {
        "id": "spiced",
        "label": {
          "en": "Spiced",
          "bn": "মসলাদার"
        }
      },
      {
        "id": "grassy",
        "label": {
          "en": "Grassy and fresh",
          "bn": "টাটকা ঘাসের স্বাদ"
        }
      },
      {
        "id": "smooth",
        "label": {
          "en": "Smooth",
          "bn": "মসৃণ"
        }
      },
      {
        "id": "citrus",
        "label": {
          "en": "Citrus",
          "bn": "লেবুর স্বাদ"
        }
      },
      {
        "id": "minty",
        "label": {
          "en": "Minty",
          "bn": "পুদিনা"
        }
      }
    ],
    "regions": [
      {
        "id": "sylhet",
        "label": {
          "en": "Sylhet, Bangladesh",
          "bn": "সিলেট, বাংলাদেশ"
        }
      },
      {
        "id": "assam",
        "label": {
          "en": "Assam, India",
          "bn": "আসাম, ভারত"
        }
      },
      {
        "id": "darjeeling",
        "label": {
          "en": "Darjeeling, India",
          "bn": "দার্জিলিং, ভারত"
        }
      },
      {
        "id": "china",
        "label": {
          "en": "China",
          "bn": "চীন"
        }
      },
      {
        "id": "other",
        "label": {
          "en": "Other origins",
          "bn": "অন্যান্য উৎস"
        }
      }
    ],
    "prices": [
      {
        "id": "under-400",
        "min": 0,
        "max": 399,
        "label": {
          "en": "Under ৳400",
          "bn": "৳৪০০-এর কম"
        }
      },
      {
        "id": "400-799",
        "min": 400,
        "max": 799,
        "label": {
          "en": "৳400 to ৳799",
          "bn": "৳৪০০ থেকে ৳৭৯৯"
        }
      },
      {
        "id": "800-plus",
        "min": 800,
        "max": null,
        "label": {
          "en": "৳800 and over",
          "bn": "৳৮০০ ও বেশি"
        }
      }
    ]
  },
  "collections": [
    {
      "id": "featured",
      "label": {
        "en": "Featured teas",
        "bn": "বাছাই করা চা"
      },
      "intro": {
        "en": "A few of our teas to start with.",
        "bn": "শুরু করার জন্য আমাদের কয়েকটি চা।"
      }
    }
  ],
  "delivery": {
    "zones": [
      {
        "id": "inside_dhaka",
        "label": {
          "en": "Inside Dhaka",
          "bn": "ঢাকার ভেতরে"
        },
        "fee": 60,
        "freeOver": 1500,
        "estimate": {
          "en": "1–2 days",
          "bn": "১–২ দিন"
        }
      },
      {
        "id": "outside_dhaka",
        "label": {
          "en": "Outside Dhaka",
          "bn": "ঢাকার বাইরে"
        },
        "fee": 120,
        "freeOver": null,
        "estimate": {
          "en": "3–5 days",
          "bn": "৩–৫ দিন"
        }
      }
    ]
  },
  "products": [
    {
      "id": 1,
      "slug": "darjeeling",
      "name": "Darjeeling First Flush",
      "category": "black-tea",
      "grade": "FTGFOP1",
      "origin": "Darjeeling, India",
      "description": "Spring's first picking. Light, floral and bright, with a muscatel finish.",
      "tastingNotes": "Floral, bright, muscatel grape",
      "ingredients": "Black tea (Darjeeling first flush)",
      "brew": {
        "temp": 85,
        "mins": 3
      },
      "image": {
        "card": "Tea/webp/darjeeling-card.webp",
        "large": "Tea/webp/darjeeling-large.webp",
        "fallback": "Tea/darjeeling.jpg",
        "alt": "Loose Darjeeling first flush tea leaves in a white bowl"
      },
      "variants": [
        {
          "sku": "CB-DARJ-100",
          "weightG": 100,
          "price": 650,
          "stock": null
        }
      ],
      "department": "tea",
      "caffeine": "medium",
      "flavours": [
        "floral",
        "fruity"
      ],
      "region": "darjeeling",
      "collections": [
        "featured"
      ]
    },
    {
      "id": 2,
      "slug": "assam",
      "name": "Assam Breakfast Blend",
      "category": "black-tea",
      "grade": "BOP",
      "origin": "Assam, India",
      "description": "Bold and malty. Strong enough to take milk and sugar.",
      "tastingNotes": "Malty, bold, brisk",
      "ingredients": "Black tea (Assam)",
      "brew": {
        "temp": 100,
        "mins": 4
      },
      "image": {
        "card": "Tea/webp/Assam_Tea-card.webp",
        "large": "Tea/webp/Assam_Tea-large.webp",
        "fallback": "Tea/Assam_Tea.jpg",
        "alt": "A heap of dark, twisted Assam black tea leaves"
      },
      "variants": [
        {
          "sku": "CB-ASSM-200",
          "weightG": 200,
          "price": 380,
          "stock": null
        }
      ],
      "department": "tea",
      "caffeine": "high",
      "flavours": [
        "malty"
      ],
      "region": "assam",
      "collections": [
        "featured"
      ]
    },
    {
      "id": 3,
      "slug": "masala-chai",
      "name": "Masala Chai",
      "category": "chai",
      "grade": "CTC",
      "origin": "Sylhet, Bangladesh",
      "description": "Sylhet CTC with cardamom, ginger, cinnamon and clove. Simmer with milk.",
      "tastingNotes": "Warming, spiced, rich with milk",
      "ingredients": "Black tea (Sylhet CTC), cardamom, ginger, cinnamon, clove",
      "brew": {
        "temp": 100,
        "mins": 5
      },
      "image": {
        "card": "Tea/webp/Masala_tea-card.webp",
        "large": "Tea/webp/Masala_tea-large.webp",
        "fallback": "Tea/Masala_tea.jpg",
        "alt": "Granular CTC tea mixed with ground spices"
      },
      "variants": [
        {
          "sku": "CB-MSLA-200",
          "weightG": 200,
          "price": 420,
          "stock": null
        }
      ],
      "department": "tea",
      "caffeine": "high",
      "flavours": [
        "spiced",
        "malty"
      ],
      "region": "sylhet",
      "collections": [
        "featured"
      ]
    },
    {
      "id": 4,
      "slug": "green-tea",
      "name": "Green Tea",
      "category": "green-tea",
      "grade": "Leaf",
      "origin": "Sylhet, Bangladesh",
      "description": "Fresh and grassy, with a clean, light cup. Don't use boiling water.",
      "tastingNotes": "Grassy, fresh, clean",
      "ingredients": "Green tea",
      "brew": {
        "temp": 80,
        "mins": 2
      },
      "image": {
        "card": "Tea/webp/Green-Tea-Leaves-2-card.webp",
        "large": "Tea/webp/Green-Tea-Leaves-2-large.webp",
        "fallback": "Tea/Green-Tea-Leaves-2.jpg",
        "alt": "Loose green tea leaves on a white dish"
      },
      "variants": [
        {
          "sku": "CB-GRN-100",
          "weightG": 100,
          "price": 450,
          "stock": null
        }
      ],
      "department": "tea",
      "caffeine": "medium",
      "flavours": [
        "grassy"
      ],
      "region": "sylhet",
      "collections": []
    },
    {
      "id": 5,
      "slug": "jasmine",
      "name": "Jasmine Green Tea",
      "category": "green-tea",
      "grade": "Leaf",
      "origin": "Fujian, China",
      "description": "Green tea layered with jasmine blossoms until it takes on their scent.",
      "tastingNotes": "Fragrant, floral, sweet",
      "ingredients": "Green tea scented with jasmine blossoms",
      "brew": {
        "temp": 80,
        "mins": 3
      },
      "image": {
        "card": "Tea/webp/Loose_Jasmine_Tea_Leaves-card.webp",
        "large": "Tea/webp/Loose_Jasmine_Tea_Leaves-large.webp",
        "fallback": "Tea/Loose_Jasmine_Tea_Leaves.jpg",
        "alt": "Long, twisted jasmine green tea leaves"
      },
      "variants": [
        {
          "sku": "CB-JSMN-100",
          "weightG": 100,
          "price": 520,
          "stock": null
        }
      ],
      "department": "tea",
      "caffeine": "medium",
      "flavours": [
        "floral"
      ],
      "region": "china",
      "collections": []
    },
    {
      "id": 6,
      "slug": "premium-blend",
      "name": "Premium Estate Blend",
      "category": "black-tea",
      "grade": "OP",
      "origin": "Sylhet and Assam",
      "description": "Our house blend of long-leaf Sylhet and Assam. Smooth and full without bitterness.",
      "tastingNotes": "Smooth, full-bodied, low bitterness",
      "ingredients": "Black tea (Sylhet and Assam long leaf)",
      "brew": {
        "temp": 95,
        "mins": 4
      },
      "image": {
        "card": "https://images.unsplash.com/photo-1523906630133-f6934a1ab2b9?w=600&h=450&fit=crop&fm=webp&q=75",
        "large": "https://images.unsplash.com/photo-1523906630133-f6934a1ab2b9?w=1000&fit=max&fm=webp&q=75",
        "fallback": "Tea/MIX_tea.jpg",
        "alt": "Premium Estate Blend loose leaf tea"
      },
      "variants": [
        {
          "sku": "CB-PREM-250",
          "weightG": 250,
          "price": 950,
          "stock": null
        }
      ],
      "department": "tea",
      "caffeine": "high",
      "flavours": [
        "smooth",
        "malty"
      ],
      "region": "sylhet",
      "collections": [
        "featured"
      ]
    },
    {
      "id": 7,
      "slug": "chamomile",
      "name": "Chamomile Calm",
      "category": "herbal",
      "grade": "Whole flower",
      "origin": "Egypt",
      "description": "Whole chamomile flowers. Caffeine-free, for the evening.",
      "tastingNotes": "Honeyed, apple-like, soothing",
      "ingredients": "Chamomile flowers. Caffeine-free",
      "brew": {
        "temp": 100,
        "mins": 5
      },
      "image": {
        "card": "Tea/webp/calming-herbal-tea-blend-chamomile-600nw-2568834187-card.webp",
        "large": "Tea/webp/calming-herbal-tea-blend-chamomile-600nw-2568834187-large.webp",
        "fallback": "Tea/calming-herbal-tea-blend-chamomile-600nw-2568834187.jpg",
        "alt": "Dried whole chamomile flowers"
      },
      "variants": [
        {
          "sku": "CB-CHAM-050",
          "weightG": 50,
          "price": 480,
          "stock": null
        },
        {
          "sku": "CB-CHAM-100",
          "weightG": 100,
          "price": null,
          "stock": null
        },
        {
          "sku": "CB-CHAM-250",
          "weightG": 250,
          "price": null,
          "stock": null
        }
      ],
      "department": "tea",
      "caffeine": "none",
      "flavours": [
        "floral"
      ],
      "region": "other",
      "collections": []
    },
    {
      "id": 8,
      "slug": "mixed-tea",
      "name": "Everyday Mixed Tea",
      "category": "black-tea",
      "grade": "CTC",
      "origin": "Sylhet, Bangladesh",
      "description": "The strong, quick-brewing tea of every Dhaka tea stall.",
      "tastingNotes": "Strong, brisk, full colour",
      "ingredients": "Black tea (Sylhet CTC and dust)",
      "brew": {
        "temp": 100,
        "mins": 3
      },
      "image": {
        "card": "Tea/webp/MIX_tea-card.webp",
        "large": "Tea/webp/MIX_tea-large.webp",
        "fallback": "Tea/MIX_tea.jpg",
        "alt": "Loose black tea blend"
      },
      "variants": [
        {
          "sku": "CB-MIXD-200",
          "weightG": 200,
          "price": 350,
          "stock": null
        }
      ],
      "department": "tea",
      "caffeine": "high",
      "flavours": [
        "malty"
      ],
      "region": "sylhet",
      "collections": []
    },
    {
      "id": 101,
      "slug": "earl-grey",
      "sample": true,
      "name": "Earl Grey",
      "department": "tea",
      "category": "black-tea",
      "description": "Black tea scented with bergamot. Bright and citrusy.",
      "image": null,
      "variants": [
        {
          "sku": "CB-S-EARL-050",
          "weightG": 50,
          "price": 260,
          "stock": null
        },
        {
          "sku": "CB-S-EARL-100",
          "weightG": 100,
          "price": 480,
          "stock": null
        },
        {
          "sku": "CB-S-EARL-250",
          "weightG": 250,
          "price": 1100,
          "stock": null
        }
      ],
      "collections": [],
      "grade": "OP",
      "origin": "Sylhet, Bangladesh",
      "region": "sylhet",
      "caffeine": "high",
      "flavours": [
        "citrus"
      ],
      "tastingNotes": "Bergamot, citrus, brisk",
      "ingredients": "Black tea, bergamot flavour",
      "brew": {
        "temp": 95,
        "mins": 4
      }
    },
    {
      "id": 102,
      "slug": "orthodox-black",
      "sample": true,
      "name": "Orthodox Black Tea",
      "department": "tea",
      "category": "black-tea",
      "description": "Whole-leaf black tea rolled the traditional way.",
      "image": null,
      "variants": [
        {
          "sku": "CB-S-ORTH-100",
          "weightG": 100,
          "price": 500,
          "stock": null
        },
        {
          "sku": "CB-S-ORTH-250",
          "weightG": 250,
          "price": 1150,
          "stock": null
        }
      ],
      "collections": [],
      "grade": "FBOP",
      "origin": "Sylhet, Bangladesh",
      "region": "sylhet",
      "caffeine": "high",
      "flavours": [
        "malty",
        "smooth"
      ],
      "tastingNotes": "Honeyed, malty, smooth",
      "ingredients": "Black tea",
      "brew": {
        "temp": 95,
        "mins": 4
      }
    },
    {
      "id": 103,
      "slug": "tulsi-green",
      "sample": true,
      "name": "Tulsi Green Tea",
      "department": "tea",
      "category": "green-tea",
      "description": "Green tea blended with holy basil leaves.",
      "image": null,
      "variants": [
        {
          "sku": "CB-S-TULS-100",
          "weightG": 100,
          "price": 420,
          "stock": null
        }
      ],
      "collections": [],
      "grade": "Leaf",
      "origin": "Sylhet, Bangladesh",
      "region": "sylhet",
      "caffeine": "low",
      "flavours": [
        "grassy",
        "minty"
      ],
      "tastingNotes": "Herbal, fresh, peppery",
      "ingredients": "Green tea, tulsi (holy basil)",
      "brew": {
        "temp": 80,
        "mins": 3
      }
    },
    {
      "id": 104,
      "slug": "classic-oolong",
      "sample": true,
      "name": "Classic Oolong",
      "department": "tea",
      "category": "oolong",
      "description": "Rolled oolong with a toasty, floral cup.",
      "image": null,
      "variants": [
        {
          "sku": "CB-S-OOLO-050",
          "weightG": 50,
          "price": 400,
          "stock": null
        },
        {
          "sku": "CB-S-OOLO-100",
          "weightG": 100,
          "price": 750,
          "stock": null
        }
      ],
      "collections": [],
      "grade": "Rolled leaf",
      "origin": "China",
      "region": "china",
      "caffeine": "medium",
      "flavours": [
        "floral",
        "smooth"
      ],
      "tastingNotes": "Toasty, orchid, smooth",
      "ingredients": "Oolong tea",
      "brew": {
        "temp": 90,
        "mins": 3
      }
    },
    {
      "id": 105,
      "slug": "white-peony",
      "sample": true,
      "name": "White Peony",
      "department": "tea",
      "category": "white-tea",
      "description": "Young buds and leaves with a soft, sweet cup.",
      "image": null,
      "variants": [
        {
          "sku": "CB-S-WPEO-050",
          "weightG": 50,
          "price": 850,
          "stock": null
        }
      ],
      "collections": [],
      "grade": "Bud and leaf",
      "origin": "China",
      "region": "china",
      "caffeine": "low",
      "flavours": [
        "floral",
        "fruity"
      ],
      "tastingNotes": "Honey, melon, hay",
      "ingredients": "White tea",
      "brew": {
        "temp": 80,
        "mins": 4
      }
    },
    {
      "id": 106,
      "slug": "ginger-lemon",
      "sample": true,
      "name": "Ginger Lemon Herbal",
      "department": "tea",
      "category": "herbal",
      "description": "Warming ginger with lemongrass and lemon peel.",
      "image": null,
      "variants": [
        {
          "sku": "CB-S-GILE-100",
          "weightG": 100,
          "price": 380,
          "stock": null
        }
      ],
      "collections": [],
      "grade": "Herbal blend",
      "origin": "Bangladesh",
      "region": "other",
      "caffeine": "none",
      "flavours": [
        "citrus",
        "spiced"
      ],
      "tastingNotes": "Zesty, warming",
      "ingredients": "Ginger, lemongrass, lemon peel. Caffeine-free",
      "brew": {
        "temp": 100,
        "mins": 6
      }
    },
    {
      "id": 107,
      "slug": "mint-herbal",
      "sample": true,
      "name": "Peppermint",
      "department": "tea",
      "category": "herbal",
      "description": "Whole peppermint leaves for a cool, clean cup.",
      "image": null,
      "variants": [
        {
          "sku": "CB-S-MINT-050",
          "weightG": 50,
          "price": 350,
          "stock": null
        }
      ],
      "collections": [],
      "grade": "Whole leaf",
      "origin": "Egypt",
      "region": "other",
      "caffeine": "none",
      "flavours": [
        "minty"
      ],
      "tastingNotes": "Cool, sweet, clean",
      "ingredients": "Peppermint leaves. Caffeine-free",
      "brew": {
        "temp": 100,
        "mins": 5
      }
    },
    {
      "id": 201,
      "slug": "glass-teapot",
      "sample": true,
      "name": "Glass Teapot with Infuser",
      "department": "teaware",
      "category": "teapots",
      "description": "Heat-resistant glass pot with a removable steel infuser.",
      "image": null,
      "variants": [
        {
          "sku": "CB-S-GPOT-600",
          "label": {
            "en": "600 ml",
            "bn": "৬০০ মি.লি."
          },
          "price": 1450,
          "stock": null
        },
        {
          "sku": "CB-S-GPOT-1000",
          "label": {
            "en": "1 litre",
            "bn": "১ লিটার"
          },
          "price": 1850,
          "stock": null
        }
      ],
      "collections": [],
      "details": "Borosilicate glass, stainless steel infuser"
    },
    {
      "id": 202,
      "slug": "clay-bhar",
      "sample": true,
      "name": "Clay Cups (Bhar)",
      "department": "teaware",
      "category": "cups",
      "description": "Handmade clay cups, the classic tea-stall way to drink cha.",
      "image": null,
      "variants": [
        {
          "sku": "CB-S-BHAR-6",
          "label": {
            "en": "Set of 6",
            "bn": "৬টির সেট"
          },
          "price": 450,
          "stock": null
        },
        {
          "sku": "CB-S-BHAR-12",
          "label": {
            "en": "Set of 12",
            "bn": "১২টির সেট"
          },
          "price": 800,
          "stock": null
        }
      ],
      "collections": [],
      "details": "Unglazed terracotta"
    },
    {
      "id": 203,
      "slug": "ceramic-mug",
      "sample": true,
      "name": "Ceramic Mug",
      "department": "teaware",
      "category": "cups",
      "description": "A sturdy everyday mug in garden green.",
      "image": null,
      "variants": [
        {
          "sku": "CB-S-MUG-350",
          "label": {
            "en": "350 ml",
            "bn": "৩৫০ মি.লি."
          },
          "price": 550,
          "stock": null
        }
      ],
      "collections": [],
      "details": "Stoneware, dishwasher safe"
    },
    {
      "id": 204,
      "slug": "steel-infuser",
      "sample": true,
      "name": "Mesh Tea Infuser",
      "department": "teaware",
      "category": "infusers",
      "description": "Fine stainless steel mesh basket that fits most mugs and pots.",
      "image": null,
      "variants": [
        {
          "sku": "CB-S-INFU-1",
          "label": {
            "en": "Single",
            "bn": "একটি"
          },
          "price": 250,
          "stock": null
        }
      ],
      "collections": [],
      "details": "Stainless steel"
    },
    {
      "id": 205,
      "slug": "storage-tin",
      "sample": true,
      "name": "Airtight Tea Tin",
      "department": "teaware",
      "category": "storage",
      "description": "Double-lid tin that keeps tea away from light, air and moisture.",
      "image": null,
      "variants": [
        {
          "sku": "CB-S-TIN-200",
          "label": {
            "en": "Holds 200g",
            "bn": "২০০ গ্রাম ধরে"
          },
          "price": 400,
          "stock": null
        }
      ],
      "collections": [],
      "details": "Tin-plated steel, double lid"
    },
    {
      "id": 301,
      "slug": "estate-sampler",
      "sample": true,
      "name": "Estate Sampler",
      "department": "gifts",
      "category": "samplers",
      "description": "Five of our teas in 20g packs: try them all before choosing.",
      "image": null,
      "variants": [
        {
          "sku": "CB-S-SAMP-5",
          "label": {
            "en": "5 × 20g",
            "bn": "৫ × ২০ গ্রাম"
          },
          "price": 990,
          "stock": null
        }
      ],
      "collections": [],
      "details": "Darjeeling, Assam, Masala Chai, Green Tea, Jasmine (20g each)"
    },
    {
      "id": 302,
      "slug": "gift-box",
      "sample": true,
      "name": "Tea Lover's Gift Box",
      "department": "gifts",
      "category": "gift-sets",
      "description": "Three teas and a mesh infuser in a gift box.",
      "image": null,
      "variants": [
        {
          "sku": "CB-S-GIFT-1",
          "label": {
            "en": "Gift box",
            "bn": "গিফট বক্স"
          },
          "price": 1990,
          "stock": null
        }
      ],
      "collections": [],
      "details": "3 × 100g teas, mesh infuser, gift box"
    },
    {
      "id": 303,
      "slug": "chai-set",
      "sample": true,
      "name": "Chai Set",
      "department": "gifts",
      "category": "gift-sets",
      "description": "Masala Chai with two clay cups, ready to give.",
      "image": null,
      "variants": [
        {
          "sku": "CB-S-CHAI-1",
          "label": {
            "en": "Set",
            "bn": "সেট"
          },
          "price": 890,
          "stock": null
        }
      ],
      "collections": [],
      "details": "200g Masala Chai, 2 clay cups"
    }
  ],
  "reviews": []
}
;
