// Cha Bazaar — English / Bangla text.
// HTML elements carry data-i18n="key" (text) or data-i18n-attr="attr:key;attr2:key2".
// English text for HTML lives in the HTML itself (read once and remembered), so the
// "en" table below only needs strings that are created in JavaScript.
// Product names are never translated.

const I18N = {
  en: {
    "cat.All": "All", "cat.Black": "Black", "cat.Spiced": "Spiced", "cat.Green": "Green", "cat.Herbal": "Herbal",

    "promise.free": "Free delivery on orders over {amount} ({area})",
    "promise.times": "Delivery in 1–2 days inside Dhaka, 3–5 days outside",
    "delivery.line": "{area}: {fee}, {eta}.",
    "trust.returnsText": "Tell us within {days} days of delivery if something is wrong.",

    "shop.none": "No teas match “{q}”",
    "shop.noneIn": "in {cat}.",
    "shop.showAll": "Show all teas",
    "brew.label": "Brewing guide",
    "brew.mins": "{n} min",
    "price.pack": "per {size} pack",
    "price.per100": "{price} per 100g",
    "variant.label": "Pack size",
    "stock.soldOut": "Sold out",
    "stock.low": "Only {n} left",
    "stock.unpriced": "Price coming soon.",

    "cart.add": "Add to cart",
    "cart.addAria": "Add {name} to cart",
    "cart.added": "Added to cart: {name}",
    "cart.addedShort": "Added",
    "cart.unavailable": "That item isn't available right now.",
    "cart.emptyText": "Your cart is empty.",
    "cart.subtotal": "Subtotal",
    "cart.delivery": "Delivery",
    "cart.total": "Total",
    "cart.totalBeforeDelivery": "Total before delivery",
    "cart.deliveryRange": "{min}–{max}, chosen at checkout",
    "cart.free": "Free",
    "cart.freeMore": "Add {amount} more for free delivery ({area}).",
    "cart.freeYes": "Your order ships free ({area}).",
    "cart.itemMeta": "{size}, {price} each",
    "cart.remove": "Remove {name}",
    "cart.qtyOf": "Quantity of {name}",
    "cart.less": "One less",
    "cart.more": "One more",
    "cart.confirmEmpty": "Empty your cart? This removes every tea in it.",

    "orders.recent": "Your recent orders",
    "orders.reorder": "Reorder",
    "orders.reorderDone": "Added your previous order to the cart.",
    "orders.reorderPartial": "Added your previous order to the cart. {n} item(s) are no longer available and were skipped.",

    "qv.notes": "Tasting notes",
    "qv.ingredients": "Ingredients",
    "qv.brew": "How to brew",
    "qv.brewText": "{temp}°C water, steep for {mins} minutes.",
    "qv.qty": "Quantity",
    "qv.share": "Copy link to this tea",
    "qv.copied": "Link copied",
    "qv.notFound": "We couldn't find that tea. Here's our full range.",

    "area.meta": "{fee}, {eta}",
    "area.free": "Free over {amount}",
    "summary.each": "{price} each",
    "summary.discount": "Promo {code}",
    "summary.chooseArea": "Choose an area",
    "summary.total": "Total to pay",

    "co.area": "Delivery area",
    "co.place": "Place order",
    "co.placing": "Placing order…",
    "co.forgotten": "Your saved details were removed from this device.",

    "pay.howTitle": "How to pay with {brand}",
    "pay.step1": "We call you to confirm the order.",
    "pay.payment": "Use Payment in your {brand} app to our merchant number {number}.",
    "pay.sendMoney": "Use Send Money in your {brand} app to {number}.",
    "pay.numberLater": "We'll give you our {brand} number on the call.",
    "pay.amount": "Amount: {amount}.",
    "pay.ref": "Write your order ID as the reference.",
    "pay.refId": "Write {id} as the reference.",
    "pay.noGateway": "You can also pay the rider on delivery. We never ask for your PIN or OTP.",

    "promo.checking": "Checking code…",
    "promo.applied": "Code applied: {amount} off.",
    "promo.unavailable": "Promo codes can't be checked right now.",

    "err.notReady": "Online ordering isn't switched on yet, so this order has not been placed. Please order on WhatsApp or by phone.",
    "err.network": "We couldn't confirm your order. Check your connection and press Place order again. You won't be charged twice; if it already went through, we'll recognise it.",
    "err.generic": "Your order could not be placed. Please try again, or order on WhatsApp or by phone.",
    "err.checkField": "Please check this field.",
    "err.items": "Something in your cart has changed. Please review your cart and try again.",
    "err.soldOut": "{name} has just sold out. Remove it from your cart to continue.",
    "err.stock": "Only {n} of {name} left. Lower the quantity to continue.",
    "err.promo": "That promo code isn't valid.",
    "err.promoMin": "That code needs a subtotal of at least {amount}.",
    "err.rate": "Too many attempts. Please wait a few minutes and try again.",
    "err.totalChanged": "Prices or delivery charges have changed. The new total is {total}. Check your order and press Place order again.",
    "err.waOrder": "Order on WhatsApp",
    "err.call": "Call {number}",
    "err.reply": "Enter an email address or mobile number so we can reply.",

    "conf.message": "We'll call {phone} to confirm. Expected delivery: {eta}. Total to pay: {total}.",

    "contact.send": "Send message",
    "contact.sending": "Sending…",
    "contact.sent": "Message sent. We usually reply within a day.",
    "contact.failed": "Your message couldn't be sent. Please try again, or reach us here:",
    "contact.notReady": "Messages can't be sent from the website yet. Please reach us here:",

    "reviews.rated": "Rated {n} out of 5",
    "reviews.summary": "{avg} out of 5 from {n} reviews",
    "reviews.sample": "Sample, not a real review",
    "reviews.sampleNote": "Development preview: these are sample reviews and are never shown on the live site.",

    "wa.greeting": "Hi Cha Bazaar, I have a question.",
    "wa.cartIntro": "Hi Cha Bazaar, I'd like to ask about these teas:",
    "wa.orderIntro": "Hi Cha Bazaar, I'd like to order:",
    "wa.orderQuestion": "Hi Cha Bazaar, I have a question about order {id}."
  },

  bn: {
    "skip": "চায়ের তালিকায় যান",
    "nav.teas": "চা", "nav.promise": "আমাদের প্রতিশ্রুতি", "nav.sourcing": "আমাদের সংগ্রহ", "nav.contact": "যোগাযোগ",
    "nav.toggle": "মেনু খুলুন বা বন্ধ করুন",
    "cart.open": "কার্ট খুলুন", "cart.button": "কার্ট",

    "hero.title": "বাগানের চা, প্রতি সপ্তাহে টাটকা প্যাক",
    "hero.lead": "আমরা সিলেট, আসাম ও দার্জিলিংয়ের বাগান থেকে সরাসরি চা কিনি, হাতে প্যাক করি এবং আপনার দরজায় পৌঁছে দিই। পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।",
    "hero.cta": "চা দেখুন",
    "hero.link": "আমরা কীভাবে সংগ্রহ করি",
    "hero.chestAlt": "চা বাজারের নাম ছাপা একটি চায়ের বাক্সের ছবি",

    "promise.label": "ডেলিভারি ও পেমেন্ট",
    "promise.free": "{amount}-এর বেশি অর্ডারে ফ্রি ডেলিভারি ({area})",
    "promise.times": "ঢাকার ভেতরে ১–২ দিনে, বাইরে ৩–৫ দিনে ডেলিভারি",
    "promise.payment": "ক্যাশ, বিকাশ বা নগদে পেমেন্ট",
    "promise.packed": "অর্ডারের ৭ দিনের মধ্যে প্যাক করা হয়",
    "delivery.line": "{area}: {fee}, {eta}।",

    "shop.title": "আমাদের চা",
    "shop.searchLabel": "চা খুঁজুন",
    "shop.sortLabel": "চা সাজান",
    "shop.filterLabel": "চায়ের ধরন অনুযায়ী বাছাই",
    "sort.featured": "আমাদের পছন্দ আগে",
    "sort.priceAsc": "দাম, কম থেকে বেশি",
    "sort.priceDesc": "দাম, বেশি থেকে কম",
    "sort.unitAsc": "প্রতি ১০০ গ্রামে সবচেয়ে সাশ্রয়ী",
    "sort.nameAsc": "নাম, A থেকে Z",
    "sort.nameDesc": "নাম, Z থেকে A",
    "cat.All": "সব", "cat.Black": "কালো চা", "cat.Spiced": "মসলা চা", "cat.Green": "সবুজ চা", "cat.Herbal": "ভেষজ চা",
    "shop.none": "“{q}”-এর সাথে মেলে এমন কোনো চা নেই",
    "shop.noneIn": "({cat})।",
    "shop.showAll": "সব চা দেখুন",
    "brew.label": "চা বানানোর নিয়ম",
    "brew.mins": "{n} মিনিট",
    "price.pack": "প্রতি {size} প্যাক",
    "price.per100": "প্রতি ১০০ গ্রাম {price}",
    "variant.label": "প্যাকের আকার",
    "stock.soldOut": "স্টক শেষ",
    "stock.low": "আর মাত্র {n}টি আছে",
    "stock.unpriced": "দাম শিগগিরই জানানো হবে।",

    "samplers.title": "স্যাম্পলার বক্স",
    "samplers.lead": "কোনটা দিয়ে শুরু করবেন বুঝতে পারছেন না? ছোট প্যাকে কয়েকটি চা চেখে দেখুন।",

    "trust.title": "আমাদের প্রতিশ্রুতি",
    "trust.stamp": "টাটকা, নয়তো বদলে দেব",
    "trust.guarantee": "টাটকা না হলে আমরা বদলে দেব। আপনার সন্তুষ্টিই আমাদের অগ্রাধিকার।",
    "trust.guaranteeLink": "কীভাবে বদলে দেওয়া হয়",
    "trust.deliveryTitle": "সারা বাংলাদেশে ডেলিভারি",
    "trust.deliveryLink": "ডেলিভারি নীতিমালা",
    "trust.payTitle": "নিশ্চিত হয়ে পেমেন্ট করুন",
    "trust.payText": "ক্যাশ অন ডেলিভারি, অথবা আমরা ফোনে নিশ্চিত করার পর বিকাশ বা নগদে। কার্ডের প্রয়োজন নেই।",
    "trust.payLink": "পেমেন্টের শর্তাবলি",
    "trust.returnsTitle": "সহজ রিটার্ন",
    "trust.returnsText": "কোনো সমস্যা হলে ডেলিভারির {days} দিনের মধ্যে আমাদের জানান।",
    "trust.returnsLink": "রিটার্ন ও রিফান্ড নীতিমালা",

    "reviews.title": "গ্রাহকেরা যা বলেন",
    "reviews.rated": "৫-এর মধ্যে {n} রেটিং",
    "reviews.summary": "{n}টি রিভিউ থেকে ৫-এর মধ্যে {avg}",
    "reviews.sample": "নমুনা, আসল রিভিউ নয়",
    "reviews.sampleNote": "ডেভেলপমেন্ট প্রিভিউ: এগুলো নমুনা রিভিউ, লাইভ সাইটে কখনো দেখানো হয় না।",

    "about.title": "বাগান থেকে আপনার কেটলিতে",
    "about.text": "বেশিরভাগ চা দোকানে পৌঁছানোর আগে মাসের পর মাস গুদামে পড়ে থাকে। আমরা বাগান থেকে সরাসরি অল্প পরিমাণে কিনি, সিল করা বাক্সে রাখি, এবং সেই সপ্তাহে যা অর্ডার হয়েছে শুধু সেটুকুই প্যাক করি।",
    "about.p1t": "সরাসরি সংগ্রহ", "about.p1": "আমরা যেসব বাগান নিজেরা ঘুরে দেখেছি সেখান থেকে কিনি, মধ্যস্বত্বভোগীদের থেকে নয়।",
    "about.p2t": "কিছু মেশানো হয় না", "about.p2": "কোনো কৃত্রিম স্বাদ বা রং নেই। আমাদের মসলা চায়ের মসলা আস্ত, আমরা নিজেরাই গুঁড়ো করি।",
    "about.p3t": "সিল করা প্যাকেট", "about.p3": "প্রতিটি অর্ডার পুনরায় বন্ধ করা যায় এমন বায়ুরোধী প্যাকেটে পাঠানো হয়।",
    "about.imgAlt": "খোলা চা পাতা",

    "contact.title": "যেকোনো প্রশ্ন করুন",
    "contact.lead": "কোন চা নেবেন ঠিক করতে পারছেন না, বা অফিস বা অনুষ্ঠানের জন্য বেশি পরিমাণে চান? ফোন করুন, হোয়াটসঅ্যাপ করুন বা মেসেজ পাঠান।",
    "contact.whatsapp": "হোয়াটসঅ্যাপে চ্যাট করুন",
    "contact.facebook": "ফেসবুকে চা বাজার",
    "contact.name": "আপনার নাম",
    "contact.email": "ইমেইল বা ফোন নম্বর",
    "contact.message": "মেসেজ",
    "contact.send": "মেসেজ পাঠান",
    "contact.sending": "পাঠানো হচ্ছে…",
    "contact.sent": "মেসেজ পাঠানো হয়েছে। আমরা সাধারণত এক দিনের মধ্যে উত্তর দিই।",
    "contact.failed": "আপনার মেসেজ পাঠানো যায়নি। আবার চেষ্টা করুন, অথবা এখানে যোগাযোগ করুন:",
    "contact.notReady": "ওয়েবসাইট থেকে এখনো মেসেজ পাঠানো যায় না। অনুগ্রহ করে এখানে যোগাযোগ করুন:",

    "cart.title": "আপনার কার্ট",
    "cart.close": "কার্ট বন্ধ করুন",
    "cart.add": "কার্টে যোগ করুন",
    "cart.addAria": "{name} কার্টে যোগ করুন",
    "cart.added": "কার্টে যোগ হয়েছে: {name}",
    "cart.addedShort": "যোগ হয়েছে",
    "cart.unavailable": "এই পণ্যটি এখন পাওয়া যাচ্ছে না।",
    "cart.emptyText": "আপনার কার্ট খালি।",
    "cart.subtotal": "সাবটোটাল",
    "cart.delivery": "ডেলিভারি",
    "cart.total": "মোট",
    "cart.totalBeforeDelivery": "ডেলিভারি চার্জ ছাড়া মোট",
    "cart.deliveryRange": "{min}–{max}, চেকআউটে বাছাই করবেন",
    "cart.free": "ফ্রি",
    "cart.freeMore": "ফ্রি ডেলিভারির জন্য আরও {amount}-এর পণ্য যোগ করুন ({area})।",
    "cart.freeYes": "আপনার অর্ডারে ডেলিভারি ফ্রি ({area})।",
    "cart.itemMeta": "{size}, প্রতিটি {price}",
    "cart.remove": "{name} সরান",
    "cart.qtyOf": "{name}-এর পরিমাণ",
    "cart.less": "একটি কমান",
    "cart.more": "একটি বাড়ান",
    "cart.checkout": "চেকআউট",
    "cart.empty": "কার্ট খালি করুন",
    "cart.confirmEmpty": "কার্ট খালি করবেন? এতে কার্টের সব চা সরে যাবে।",

    "orders.recent": "আপনার সাম্প্রতিক অর্ডার",
    "orders.reorder": "আবার অর্ডার করুন",
    "orders.reorderDone": "আপনার আগের অর্ডার কার্টে যোগ হয়েছে।",
    "orders.reorderPartial": "আপনার আগের অর্ডার কার্টে যোগ হয়েছে। {n}টি পণ্য আর পাওয়া যায় না, তাই বাদ দেওয়া হয়েছে।",

    "qv.close": "বন্ধ করুন",
    "qv.notes": "স্বাদ",
    "qv.ingredients": "উপাদান",
    "qv.brew": "কীভাবে বানাবেন",
    "qv.brewText": "{temp}°C পানিতে {mins} মিনিট ভিজিয়ে রাখুন।",
    "qv.qty": "পরিমাণ",
    "qv.share": "এই চায়ের লিংক কপি করুন",
    "qv.copied": "লিংক কপি হয়েছে",
    "qv.notFound": "চা-টি খুঁজে পাওয়া যায়নি। আমাদের সব চা দেখুন।",

    "co.title": "চেকআউট",
    "co.close": "চেকআউট বন্ধ করুন",
    "co.where": "কোথায় ডেলিভারি দেব?",
    "co.name": "পুরো নাম",
    "co.phone": "মোবাইল নম্বর",
    "co.email": "ইমেইল",
    "co.optional": "ঐচ্ছিক",
    "co.area": "ডেলিভারি এলাকা",
    "co.address": "পুরো ঠিকানা",
    "co.addressHint": "বাড়ি, রোড, এলাকা, শহর",
    "co.payment": "পেমেন্ট",
    "co.notes": "রাইডারের জন্য নোট",
    "co.notesHint": "যেমন: গেটে পৌঁছে ফোন দেবেন",
    "co.remember": "পরের বারের জন্য এই ডিভাইসে আমার তথ্য সেভ করুন",
    "co.forget": "সেভ করা তথ্য মুছে ফেলুন",
    "co.forgotten": "আপনার সেভ করা তথ্য এই ডিভাইস থেকে মুছে ফেলা হয়েছে।",
    "co.yourOrder": "আপনার অর্ডার",
    "co.promo": "প্রোমো কোড",
    "co.apply": "প্রয়োগ করুন",
    "co.back": "কার্টে ফিরে যান",
    "co.place": "অর্ডার করুন",
    "co.placing": "অর্ডার করা হচ্ছে…",
    "area.meta": "{fee}, {eta}",
    "area.free": "{amount}-এর বেশি হলে ফ্রি",
    "summary.each": "প্রতিটি {price}",
    "summary.discount": "প্রোমো {code}",
    "summary.chooseArea": "এলাকা বাছাই করুন",
    "summary.total": "মোট পরিশোধ",

    "pay.cod": "ক্যাশ অন ডেলিভারি",
    "pay.codMeta": "রাইডারকে নগদ টাকা দিন",
    "pay.manualMeta": "আমাদের নিশ্চিতকরণ কলের পর নিজে পেমেন্ট করুন",
    "pay.howTitle": "{brand} দিয়ে কীভাবে পেমেন্ট করবেন",
    "pay.step1": "আমরা ফোন করে অর্ডার নিশ্চিত করব।",
    "pay.payment": "আপনার {brand} অ্যাপে Payment অপশন দিয়ে আমাদের মার্চেন্ট নম্বর {number}-এ পাঠান।",
    "pay.sendMoney": "আপনার {brand} অ্যাপে Send Money দিয়ে {number}-এ পাঠান।",
    "pay.numberLater": "ফোনে আমরা আমাদের {brand} নম্বর জানিয়ে দেব।",
    "pay.amount": "পরিমাণ: {amount}।",
    "pay.ref": "রেফারেন্সে আপনার অর্ডার আইডি লিখুন।",
    "pay.refId": "রেফারেন্সে {id} লিখুন।",
    "pay.noGateway": "চাইলে ডেলিভারির সময় রাইডারকেও পেমেন্ট করতে পারেন। আমরা কখনো আপনার পিন বা ওটিপি চাই না।",

    "promo.checking": "কোড যাচাই করা হচ্ছে…",
    "promo.applied": "কোড প্রয়োগ হয়েছে: {amount} ছাড়।",
    "promo.unavailable": "এই মুহূর্তে প্রোমো কোড যাচাই করা যাচ্ছে না।",

    "err.name": "আপনার নাম লিখুন।",
    "err.reply": "উত্তর দেওয়ার জন্য একটি ইমেইল ঠিকানা বা মোবাইল নম্বর লিখুন।",
    "err.message": "পাঠানোর আগে একটি মেসেজ লিখুন।",
    "err.coName": "ডেলিভারির জন্য নাম লিখুন।",
    "err.phone": "01 দিয়ে শুরু হওয়া ১১ সংখ্যার নম্বর লিখুন।",
    "err.email": "name@example.com-এর মতো একটি ইমেইল ঠিকানা লিখুন।",
    "err.area": "একটি ডেলিভারি এলাকা বাছাই করুন।",
    "err.address": "বাড়ি, রোড, এলাকা ও শহর লিখুন।",
    "err.notReady": "অনলাইনে অর্ডার এখনো চালু হয়নি, তাই এই অর্ডারটি করা হয়নি। অনুগ্রহ করে হোয়াটসঅ্যাপে বা ফোনে অর্ডার করুন।",
    "err.network": "আপনার অর্ডার নিশ্চিত করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার \"অর্ডার করুন\" চাপুন। দুবার চার্জ হবে না; অর্ডার আগেই পৌঁছে থাকলে আমরা তা চিনতে পারব।",
    "err.generic": "আপনার অর্ডার করা যায়নি। আবার চেষ্টা করুন, অথবা হোয়াটসঅ্যাপে বা ফোনে অর্ডার করুন।",
    "err.checkField": "এই ঘরটি আবার দেখুন।",
    "err.items": "আপনার কার্টে কিছু পরিবর্তন হয়েছে। কার্ট দেখে আবার চেষ্টা করুন।",
    "err.soldOut": "{name} এইমাত্র শেষ হয়ে গেছে। এগোতে এটি কার্ট থেকে সরান।",
    "err.stock": "{name} আর মাত্র {n}টি আছে। এগোতে পরিমাণ কমান।",
    "err.promo": "প্রোমো কোডটি সঠিক নয়।",
    "err.promoMin": "এই কোডের জন্য সাবটোটাল অন্তত {amount} হতে হবে।",
    "err.rate": "অনেকবার চেষ্টা করা হয়েছে। কয়েক মিনিট পরে আবার চেষ্টা করুন।",
    "err.totalChanged": "দাম বা ডেলিভারি চার্জ বদলেছে। নতুন মোট {total}। অর্ডার দেখে আবার \"অর্ডার করুন\" চাপুন।",
    "err.waOrder": "হোয়াটসঅ্যাপে অর্ডার করুন",
    "err.call": "{number}-এ ফোন করুন",

    "conf.order": "অর্ডার",
    "conf.title": "অর্ডার সম্পন্ন হয়েছে",
    "conf.message": "নিশ্চিত করতে আমরা {phone}-এ ফোন করব। আনুমানিক ডেলিভারি: {eta}। মোট পরিশোধ: {total}।",
    "conf.keep": "আরও দেখুন",
    "conf.ask": "এই অর্ডার নিয়ে প্রশ্ন করুন",

    "wa.float": "হোয়াটসঅ্যাপে চা বাজারের সাথে চ্যাট করুন",
    "wa.greeting": "হ্যালো চা বাজার, আমার একটি প্রশ্ন আছে।",
    "wa.cartIntro": "হ্যালো চা বাজার, আমি এই চাগুলো সম্পর্কে জানতে চাই:",
    "wa.orderIntro": "হ্যালো চা বাজার, আমি অর্ডার করতে চাই:",
    "wa.orderQuestion": "হ্যালো চা বাজার, অর্ডার {id} সম্পর্কে আমার একটি প্রশ্ন আছে।",
    "toast.dismiss": "বন্ধ করুন",

    "footer.tag": "বাগানের চা, ঢাকায় টাটকা প্যাক করা।",
    "footer.contact": "যোগাযোগ",
    "footer.policies": "নীতিমালা",
    "policy.delivery": "ডেলিভারি নীতিমালা",
    "policy.returns": "রিটার্ন ও রিফান্ড",
    "policy.privacy": "গোপনীয়তা নীতি",
    "policy.terms": "শর্তাবলি",
    "policy.back": "দোকানে ফিরে যান",
    "skip.policy": "নীতিমালায় যান",
    "table.area": "ডেলিভারি এলাকা",
    "table.fee": "চার্জ",
    "table.eta": "আনুমানিক সময়",
    "policy.updated": "সর্বশেষ হালনাগাদ",

    "motion.pause": "অ্যানিমেশন থামান",
    "motion.play": "অ্যানিমেশন চালু করুন"
  }
};
// English for keys that are also used outside the HTML
I18N.en["policy.back"] = "Back to the shop";
I18N.en["table.area"] = "Delivery area";
I18N.en["table.fee"] = "Charge";
I18N.en["table.eta"] = "Estimated time";
I18N.en["motion.pause"] = "Pause animation";
I18N.en["motion.play"] = "Play animation";

// Store navigation (v3)
I18N.en["skip.main"] = "Skip to main content";
I18N.en["shop.all"] = "All products";
I18N.en["shop.allIn"] = "All {name}";
I18N.en["shop.count"] = "{n} items";
I18N.en["shop.results"] = "{n} products";
I18N.en["shop.noneFilters"] = "No products match these filters.";
I18N.en["shop.catLabel"] = "Categories";
I18N.en["filters.title"] = "Filters";
I18N.en["filters.close"] = "Close filters";
I18N.en["filters.clear"] = "Clear filters";
I18N.en["filters.origin"] = "Origin";
I18N.en["filters.caffeine"] = "Caffeine";
I18N.en["filters.flavour"] = "Flavour";
I18N.en["filters.price"] = "Price";
I18N.en["filters.none"] = "No filters for this category.";
I18N.en["mega.byType"] = "Shop by type";
I18N.en["mega.shopAll"] = "Shop all {name}";
I18N.en["crumbs.home"] = "Home";
I18N.en["crumbs.label"] = "Breadcrumb";
I18N.en["home.quick"] = "Quick picks:";
I18N.en["home.fromBd"] = "Grown in Bangladesh";
I18N.en["home.budget"] = "Lowest price first";
I18N.en["img.soon"] = "Photo coming soon";
I18N.en["img.coming"] = "{name}: photo coming soon";
I18N.en["sample.flag"] = "Sample listing";
I18N.en["sample.title"] = "Placeholder product with a predicted price. Not for sale yet.";
I18N.en["sample.soon"] = "Coming soon";
I18N.en["sample.explain"] = "This is a sample listing: the product details and price are placeholders and it can't be ordered yet.";
I18N.en["qv.button"] = "Quick view";
I18N.en["qv.open"] = "Quick view: {name}";
I18N.en["qv.details"] = "View full details";
I18N.en["pp.notFound"] = "We couldn't find that product.";
I18N.en["pp.aboutTea"] = "About this tea";
I18N.en["pp.about"] = "About this product";
I18N.en["pp.noReviews"] = "No reviews yet.";
I18N.en["pp.related"] = "You may also like";
I18N.en["pp.ask"] = "Ask about this on WhatsApp";
I18N.en["wa.productQuestion"] = "Hi Cha Bazaar, I have a question about {name}.";
I18N.bn["skip.main"] = "মূল অংশে যান";
I18N.bn["nav.tea"] = "চা";
I18N.bn["nav.teaware"] = "চায়ের সরঞ্জাম";
I18N.bn["nav.gifts"] = "উপহার";
I18N.bn["home.shopBy"] = "ধরন অনুযায়ী কিনুন";
I18N.bn["home.allTea"] = "সব চা দেখুন";
I18N.bn["home.gifts"] = "উপহার ও স্যাম্পলার";
I18N.bn["home.allGifts"] = "সব উপহার দেখুন";
I18N.bn["home.teaware"] = "ঠিকভাবে বানান";
I18N.bn["home.allTeaware"] = "সব সরঞ্জাম দেখুন";
I18N.bn["home.quick"] = "দ্রুত বাছাই:";
I18N.bn["home.fromBd"] = "বাংলাদেশে উৎপাদিত";
I18N.bn["home.budget"] = "কম দাম আগে";
I18N.bn["shop.searchPh"] = "খুঁজুন";
I18N.bn["shop.all"] = "সব পণ্য";
I18N.bn["shop.allIn"] = "সব {name}";
I18N.bn["shop.count"] = "{n}টি পণ্য";
I18N.bn["shop.results"] = "{n}টি পণ্য";
I18N.bn["shop.noneFilters"] = "এই ফিল্টারের সাথে মেলে এমন কোনো পণ্য নেই।";
I18N.bn["shop.catLabel"] = "বিভাগ";
I18N.bn["filters.title"] = "ফিল্টার";
I18N.bn["filters.close"] = "ফিল্টার বন্ধ করুন";
I18N.bn["filters.clear"] = "ফিল্টার মুছুন";
I18N.bn["filters.origin"] = "উৎস";
I18N.bn["filters.caffeine"] = "ক্যাফেইন";
I18N.bn["filters.flavour"] = "স্বাদ";
I18N.bn["filters.price"] = "দাম";
I18N.bn["filters.none"] = "এই বিভাগে কোনো ফিল্টার নেই।";
I18N.bn["mega.byType"] = "ধরন অনুযায়ী";
I18N.bn["mega.shopAll"] = "সব {name} দেখুন";
I18N.bn["crumbs.home"] = "হোম";
I18N.bn["crumbs.label"] = "পথনির্দেশ";
I18N.bn["img.soon"] = "ছবি শিগগিরই আসছে";
I18N.bn["img.coming"] = "{name}: ছবি শিগগিরই আসছে";
I18N.bn["sample.flag"] = "নমুনা তালিকা";
I18N.bn["sample.title"] = "আনুমানিক দামের নমুনা পণ্য। এখনো বিক্রি হচ্ছে না।";
I18N.bn["sample.soon"] = "শিগগিরই আসছে";
I18N.bn["sample.explain"] = "এটি একটি নমুনা তালিকা: পণ্যের তথ্য ও দাম আনুমানিক, এবং এখনো অর্ডার করা যায় না।";
I18N.bn["qv.button"] = "এক নজরে";
I18N.bn["qv.open"] = "এক নজরে: {name}";
I18N.bn["qv.details"] = "বিস্তারিত দেখুন";
I18N.bn["pp.notFound"] = "পণ্যটি খুঁজে পাওয়া যায়নি।";
I18N.bn["pp.aboutTea"] = "এই চা সম্পর্কে";
I18N.bn["pp.about"] = "এই পণ্য সম্পর্কে";
I18N.bn["pp.noReviews"] = "এখনো কোনো রিভিউ নেই।";
I18N.bn["pp.related"] = "আপনার পছন্দ হতে পারে";
I18N.bn["pp.ask"] = "হোয়াটসঅ্যাপে এ বিষয়ে জিজ্ঞেস করুন";
I18N.bn["wa.productQuestion"] = "হ্যালো চা বাজার, {name} সম্পর্কে আমার একটি প্রশ্ন আছে।";
I18N.bn["footer.shop"] = "কেনাকাটা";
I18N.bn["shop.searchLabel"] = "দোকানে খুঁজুন";
I18N.bn["shop.sortLabel"] = "সাজান";

I18N.en["promise.payment"] = "Pay by cash, bKash or Nagad";
I18N.en["trust.guarantee"] = "Not fresh? We replace it. Your satisfaction is our priority.";
I18N.en["reviews.title"] = "What customers say";

I18N.en["variant.size"] = "Size";
I18N.en["shop.count1"] = "1 item";
I18N.bn["variant.size"] = "আকার";
I18N.bn["shop.count1"] = "১টি পণ্য";

let CURRENT_LANG = "en";
const getLang = () => CURRENT_LANG;
const setCurrentLang = (lang) => { CURRENT_LANG = I18N[lang] ? lang : "en"; };

// t("key", { var: value }, "fallback")
const t = (key, vars, fallback) => {
  const table = I18N[CURRENT_LANG] || I18N.en;
  let s = table[key] ?? I18N.en[key] ?? fallback ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
  return s;
};

// Swap translated text into the page. English originals are remembered on first run.
const applyI18n = (root = document) => {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    if (el.dataset.i18nEn == null) el.dataset.i18nEn = el.textContent;
    const key = el.dataset.i18n;
    el.textContent = CURRENT_LANG === "en" ? (el.dataset.i18nEn || I18N.en[key] || "") : t(key, null, el.dataset.i18nEn);
  });
  root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    el.dataset.i18nAttr.split(";").forEach((pair) => {
      const [attr, key] = pair.split(":").map((s) => s.trim());
      if (!attr || !key) return;
      const store = `i18nOrig${attr.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())}`;
      if (el.dataset[store] == null) el.dataset[store] = el.getAttribute(attr) ?? "";
      el.setAttribute(attr, CURRENT_LANG === "en" ? (el.dataset[store] || I18N.en[key] || "") : t(key, null, el.dataset[store]));
    });
  });
  // Policy pages: show the matching language block
  root.querySelectorAll("[data-lang-block]").forEach((el) => { el.hidden = el.dataset.langBlock !== CURRENT_LANG; });
};
