/*
  Cha Bazaar business settings.

  Everything in this file is PUBLIC (anyone can read it in their browser).
  Never put passwords, API keys, Google credentials or bKash/Nagad PINs here.

  Values that still start with "YOUR_" count as "not set up":
    - unset phone, WhatsApp, Facebook and email links are hidden from customers
    - with ORDER_ENDPOINT unset, checkout refuses to place orders and offers
      WhatsApp or a call instead (it never pretends an order went through)
  When you open the site on your own computer (localhost or a file), a setup bar lists
  whatever is still missing.

  Products, prices, pack sizes and delivery charges live in catalog.js, not here.
*/
window.CHA_CONFIG = {
  // Live website address, with a trailing slash. Used for share links and SEO.
  SITE_URL: "https://sanjidmolik.github.io/Tea_shop/",

  // Google Apps Script web-app URL ending in /exec (see apps-script/README.md)
  ORDER_ENDPOINT: "YOUR_APPS_SCRIPT_URL",

  // Phone numbers: Bangladeshi mobile in international format without "+" or spaces,
  // e.g. "8801712345678"
  BUSINESS_PHONE: "YOUR_PHONE_NUMBER",
  WHATSAPP_NUMBER: "YOUR_WHATSAPP_NUMBER",
  FACEBOOK_URL: "YOUR_FACEBOOK_PAGE_URL",
  BUSINESS_EMAIL: "YOUR_EMAIL_ADDRESS",
  BUSINESS_ADDRESS: { en: "Dhaka, Bangladesh", bn: "ঢাকা, বাংলাদেশ" },
  OPENING_HOURS: { en: "Saturday to Thursday, 10am to 8pm", bn: "শনিবার থেকে বৃহস্পতিবার, সকাল ১০টা থেকে রাত ৮টা" },

  // Manual mobile payments (no online gateway is connected).
  // Customers pay after your confirmation call, or on delivery, using the order ID as reference.
  BKASH_NUMBER: "YOUR_BKASH_NUMBER",
  BKASH_ACCOUNT_TYPE: "Merchant", // "Merchant" (customer uses Payment) or "Personal" (customer uses Send Money)
  NAGAD_NUMBER: "YOUR_NAGAD_NUMBER",
  NAGAD_ACCOUNT_TYPE: "Merchant",

  // Policy settings shown on the policy pages (confirm before launch)
  RETURN_WINDOW_DAYS: 7,

  // Optional analytics. provider: "" (off), "plausible" or "ga4".
  // GA4 only loads after the visitor accepts the analytics notice.
  ANALYTICS: {
    provider: "",
    plausibleDomain: "",  // e.g. "chabazaar.com"
    ga4MeasurementId: ""  // e.g. "G-XXXXXXXXXX"
  },

  // Development only: show clearly labelled SAMPLE reviews when running on
  // localhost or from a file. Never shown on the live site.
  SHOW_SAMPLE_REVIEWS_IN_DEV: true
};
