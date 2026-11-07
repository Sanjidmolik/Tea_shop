// ---- Config ----
const CURRENCY = "৳";
const DELIVERY_FEE = 60;
const FREE_DELIVERY_THRESHOLD = 1500;
const FALLBACK_IMAGE = "Tea/MIX_tea.jpg";

const CART_KEY = "tea-shop-cart";
const ORDERS_KEY = "tea-shop-orders";

// ---- Data ----
const products = [
  { id: 1, name: "Darjeeling First Flush", category: "Black", grade: "FTGFOP1", origin: "Darjeeling, India",
    weight: "100g", price: 650, brew: { temp: 85, mins: 3 },
    description: "Spring's first picking. Light, floral and bright, with a muscatel finish.", image: "Tea/darjeeling.jpg" },
  { id: 2, name: "Assam Breakfast Blend", category: "Black", grade: "BOP", origin: "Assam, India",
    weight: "200g", price: 380, brew: { temp: 100, mins: 4 },
    description: "Bold and malty. Strong enough to take milk and sugar.", image: "Tea/Assam_Tea.jpg" },
  { id: 3, name: "Masala Chai", category: "Spiced", grade: "CTC", origin: "Sylhet, Bangladesh",
    weight: "200g", price: 420, brew: { temp: 100, mins: 5 },
    description: "Sylhet CTC with cardamom, ginger, cinnamon and clove. Simmer with milk.", image: "Tea/Masala_tea.jpg" },
  { id: 4, name: "Green Tea", category: "Green", grade: "Leaf", origin: "Sylhet, Bangladesh",
    weight: "100g", price: 450, brew: { temp: 80, mins: 2 },
    description: "Fresh and grassy, with a clean, light cup. Don't use boiling water.", image: "Tea/Green-Tea-Leaves-2.jpg" },
  { id: 5, name: "Jasmine Green Tea", category: "Green", grade: "Leaf", origin: "Fujian, China",
    weight: "100g", price: 520, brew: { temp: 80, mins: 3 },
    description: "Green tea layered with jasmine blossoms until it takes on their scent.", image: "Tea/Loose_Jasmine_Tea_Leaves.jpg" },
  { id: 6, name: "Premium Estate Blend", category: "Black", grade: "OP", origin: "Sylhet and Assam",
    weight: "250g", price: 950, brew: { temp: 95, mins: 4 },
    description: "Our house blend of long-leaf Sylhet and Assam. Smooth and full without bitterness.",
    image: "https://images.unsplash.com/photo-1523906630133-f6934a1ab2b9?q=80&w=1000&auto=format&fit=crop" },
  { id: 7, name: "Chamomile Calm", category: "Herbal", grade: "Whole flower", origin: "Egypt",
    weight: "50g", price: 480, brew: { temp: 100, mins: 5 },
    description: "Whole chamomile flowers. Caffeine-free, for the evening.",
    image: "Tea/calming-herbal-tea-blend-chamomile-600nw-2568834187.jpg" },
  { id: 8, name: "Everyday Mixed Tea", category: "Black", grade: "CTC", origin: "Sylhet, Bangladesh",
    weight: "200g", price: 350, brew: { temp: 100, mins: 3 },
    description: "The strong, quick-brewing tea of every Dhaka tea stall.", image: "Tea/MIX_tea.jpg" }
];

// ---- Helpers ----
const formatPrice = (n) => `${CURRENCY}${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const readJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const writeJSON = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
};

// Cart stores only { id, qty }; product details always come from the catalogue,
// so price or image changes are reflected and stale entries are dropped.
const readCart = () =>
  readJSON(CART_KEY, [])
    .filter((i) => products.some((p) => p.id === i.id) && Number.isInteger(i.qty) && i.qty > 0)
    .map((i) => ({ ...products.find((p) => p.id === i.id), qty: i.qty }));

const writeCart = (cart) => {
  writeJSON(CART_KEY, cart.map(({ id, qty }) => ({ id, qty })));
  renderCart();
};

// ---- Toast ----
const toastEl = document.getElementById("appToast");
const toastBody = document.getElementById("appToastBody");
const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2000 });
const showToast = (msg) => { toastBody.textContent = msg; toast.show(); };

// ---- Cart operations ----
const addToCart = (productId) => {
  const cart = readCart();
  const item = cart.find((i) => i.id === productId);
  if (item) item.qty += 1;
  else cart.push({ id: productId, qty: 1 });
  writeCart(cart);
  const p = products.find((p) => p.id === productId);
  showToast(`Added to cart: ${p.name}`);
  cartCountEl.classList.remove("bump");
  void cartCountEl.offsetWidth; // restart the animation
  cartCountEl.classList.add("bump");
};

const setQty = (productId, qty) => {
  const cart = readCart()
    .map((i) => (i.id === productId ? { ...i, qty } : i))
    .filter((i) => i.qty > 0);
  writeCart(cart);
};

const removeFromCart = (productId) => writeCart(readCart().filter((i) => i.id !== productId));
const clearCart = () => writeCart([]);

const cartCount = (cart = readCart()) => cart.reduce((sum, i) => sum + i.qty, 0);
const cartSubtotal = (cart = readCart()) => cart.reduce((sum, i) => sum + i.price * i.qty, 0);
const deliveryFee = (subtotal) => (subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE);

// ---- Render products ----
const grid = document.getElementById("product-grid");
const categoryEl = document.getElementById("category-filters");
let activeCategory = "All";

const renderCategories = () => {
  const cats = ["All", ...new Set(products.map((p) => p.category))];
  categoryEl.innerHTML = cats.map((c) => {
    const n = c === "All" ? products.length : products.filter((p) => p.category === c).length;
    return `<button type="button" class="category-tab" data-category="${escapeHtml(c)}"
      aria-pressed="${c === activeCategory}">${escapeHtml(c)}<span class="count">${n}</span></button>`;
  }).join("");
};

const renderProducts = (list) => {
  if (!list.length) {
    grid.innerHTML = `<div class="col-12"><div class="empty-state">
      <p class="mb-2">No teas match “${escapeHtml(searchInput.value.trim())}”${activeCategory !== "All" ? ` in ${escapeHtml(activeCategory)}` : ""}.</p>
      <button type="button" class="btn btn-outline-garden btn-sm" id="resetFilters">Show all teas</button>
    </div></div>`;
    return;
  }
  grid.innerHTML = list.map((p) => `
    <div class="col-12 col-sm-6 col-lg-4 col-xl-3">
      <article class="tea">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="tea-img" loading="lazy">
        <div class="tea-body">
          <p class="tea-grade"><span class="grade">${escapeHtml(p.grade)}</span><span class="origin">${escapeHtml(p.origin)}</span></p>
          <h3 class="tea-name">${escapeHtml(p.name)}</h3>
          <p class="tea-desc">${escapeHtml(p.description)}</p>
          <ul class="tea-brew" aria-label="Brewing guide">
            <li><i class="bi bi-thermometer-half" aria-hidden="true"></i>${p.brew.temp}°C</li>
            <li><i class="bi bi-hourglass-split" aria-hidden="true"></i>${p.brew.mins} min</li>
          </ul>
          <div class="tea-buy">
            <p class="tea-price mb-0">${formatPrice(p.price)}<small>per ${escapeHtml(p.weight)}</small></p>
            <button class="btn btn-garden add-to-cart" data-id="${p.id}" aria-label="Add ${escapeHtml(p.name)} to cart">Add to cart</button>
          </div>
        </div>
      </article>
    </div>`).join("");
};

// Replace broken images (e.g. offline remote image) with a local fallback.
document.addEventListener("error", (e) => {
  const img = e.target;
  if (img.tagName === "IMG" && !img.dataset.fallback) {
    img.dataset.fallback = "1";
    img.src = FALLBACK_IMAGE;
  }
}, true);

// ---- Render cart ----
const cartItemsEl = document.getElementById("cart-items");
const cartSubtotalEl = document.getElementById("cart-subtotal");
const cartDeliveryEl = document.getElementById("cart-delivery");
const cartTotalEl = document.getElementById("cart-total");
const cartCountEl = document.getElementById("cart-count");
const checkoutBtn = document.getElementById("checkoutBtn");
const clearCartBtn = document.getElementById("clearCartBtn");

const renderCart = () => {
  const cart = readCart();
  const subtotal = cartSubtotal(cart);
  const delivery = deliveryFee(subtotal);

  cartCountEl.textContent = cartCount(cart);
  cartSubtotalEl.textContent = formatPrice(subtotal);
  cartDeliveryEl.textContent = subtotal && !delivery ? "Free" : formatPrice(delivery);
  cartTotalEl.textContent = formatPrice(subtotal + delivery);
  checkoutBtn.disabled = !cart.length;
  clearCartBtn.disabled = !cart.length;

  if (!cart.length) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <i class="bi bi-bag d-block mb-2" aria-hidden="true"></i>
        <p>Your cart is empty.</p>
        <button type="button" class="btn btn-outline-garden" data-bs-dismiss="offcanvas">Browse the teas</button>
      </div>`;
    return;
  }

  const remaining = FREE_DELIVERY_THRESHOLD - subtotal;
  const progress = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));
  const deliveryNote = `
    <div class="delivery-note">
      ${remaining > 0
        ? `Add ${formatPrice(remaining)} more for free delivery.`
        : `Your order ships free.`}
      <div class="delivery-bar" aria-hidden="true"><span style="width:${progress}%"></span></div>
    </div>`;

  cartItemsEl.innerHTML = deliveryNote + cart.map((item) => `
    <div class="cart-item">
      <img src="${escapeHtml(item.image)}" alt="">
      <div>
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div class="cart-item-name">${escapeHtml(item.name)}</div>
            <div class="cart-item-meta">${formatPrice(item.price)} per ${escapeHtml(item.weight)}</div>
          </div>
          <button class="remove" data-id="${item.id}" aria-label="Remove ${escapeHtml(item.name)}">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-2">
          <div class="qty" role="group" aria-label="Quantity of ${escapeHtml(item.name)}">
            <button class="decrease" data-id="${item.id}" aria-label="One less">−</button>
            <span>${item.qty}</span>
            <button class="increase" data-id="${item.id}" aria-label="One more">+</button>
          </div>
          <span class="fw-semibold">${formatPrice(item.price * item.qty)}</span>
        </div>
      </div>
    </div>`).join("");
};

// ---- Search, Sort & Filter ----
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

const applyFilters = () => {
  const q = searchInput.value.trim().toLowerCase();
  const list = products.filter((p) =>
    (activeCategory === "All" || p.category === activeCategory) &&
    [p.name, p.category, p.description, p.grade, p.origin].some((s) => s.toLowerCase().includes(q))
  );

  switch (sortSelect.value) {
    case "price-asc":  list.sort((a, b) => a.price - b.price); break;
    case "price-desc": list.sort((a, b) => b.price - a.price); break;
    case "name-asc":   list.sort((a, b) => a.name.localeCompare(b.name)); break;
    case "name-desc":  list.sort((a, b) => b.name.localeCompare(a.name)); break;
    default: break; // featured: original order
  }

  renderProducts(list);
};

searchInput.addEventListener("input", applyFilters);
sortSelect.addEventListener("change", applyFilters);
grid.addEventListener("click", (e) => {
  if (!e.target.closest("#resetFilters")) return;
  searchInput.value = "";
  activeCategory = "All";
  renderCategories();
  applyFilters();
});
categoryEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-category]");
  if (!btn) return;
  activeCategory = btn.dataset.category;
  renderCategories();
  applyFilters();
});

// ---- Delegated events ----
grid.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-to-cart");
  if (btn) addToCart(Number(btn.dataset.id));
});

cartItemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".decrease, .increase, .remove");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const item = readCart().find((i) => i.id === id);
  if (!item) return;
  if (btn.classList.contains("decrease")) setQty(id, item.qty - 1); // reaching 0 removes the item
  else if (btn.classList.contains("increase")) setQty(id, item.qty + 1);
  else removeFromCart(id);
});

clearCartBtn.addEventListener("click", () => {
  if (confirm("Empty your cart? This removes every tea in it.")) clearCart();
});

// ---- Checkout ----
const cartOffcanvas = bootstrap.Offcanvas.getOrCreateInstance("#cartOffcanvas");
const checkoutModal = bootstrap.Modal.getOrCreateInstance("#checkoutModal");
const confirmModal = bootstrap.Modal.getOrCreateInstance("#confirmModal");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutSummaryEl = document.getElementById("checkout-summary");

const renderCheckoutSummary = () => {
  const cart = readCart();
  const subtotal = cartSubtotal(cart);
  const delivery = deliveryFee(subtotal);
  checkoutSummaryEl.innerHTML = cart.map((i) => `
      <li><span>${escapeHtml(i.name)} × ${i.qty}</span><span>${formatPrice(i.price * i.qty)}</span></li>`).join("") + `
      <li class="muted"><span>Delivery</span><span>${delivery ? formatPrice(delivery) : "Free"}</span></li>
      <li class="total"><span>Total to pay</span><span>${formatPrice(subtotal + delivery)}</span></li>`;
};

checkoutBtn.addEventListener("click", () => {
  if (!readCart().length) return;
  renderCheckoutSummary();
  checkoutForm.classList.remove("was-validated");
  cartOffcanvas.hide();
  checkoutModal.show();
});

const generateOrderId = () =>
  `CB-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, "0")}`;

const phone = document.getElementById("custPhone");
phone.addEventListener("input", () => { phone.value = phone.value.replace(/[\s-]/g, ""); });

checkoutForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!checkoutForm.checkValidity()) {
    checkoutForm.classList.add("was-validated");
    checkoutForm.querySelector(":invalid")?.focus();
    return;
  }

  const cart = readCart();
  if (!cart.length) { checkoutModal.hide(); return; }

  const subtotal = cartSubtotal(cart);
  const delivery = deliveryFee(subtotal);
  const order = {
    id: generateOrderId(),
    createdAt: new Date().toISOString(),
    customer: {
      name: document.getElementById("custName").value.trim(),
      phone: phone.value,
      email: document.getElementById("custEmail").value.trim(),
      address: document.getElementById("custAddress").value.trim(),
      city: document.getElementById("custCity").value.trim(),
      notes: document.getElementById("custNotes").value.trim()
    },
    payment: checkoutForm.querySelector('input[name="payment"]:checked').value,
    items: cart.map(({ id, name, price, qty }) => ({ id, name, price, qty })),
    subtotal, delivery, total: subtotal + delivery
  };

  writeJSON(ORDERS_KEY, [...readJSON(ORDERS_KEY, []), order]);
  clearCart();
  checkoutForm.reset();
  checkoutForm.classList.remove("was-validated");

  document.getElementById("confirm-order-id").textContent = order.id;
  document.getElementById("confirm-message").textContent =
    `We'll call ${order.customer.phone} to confirm a delivery time. Pay ${formatPrice(order.total)} by ${order.payment === "Mobile banking" ? "mobile banking" : "cash"} when it arrives.`;

  checkoutModal.hide();
  confirmModal.show();
});

// ---- Contact form ----
const contactForm = document.getElementById("contactForm");
contactForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!contactForm.checkValidity()) {
    contactForm.classList.add("was-validated");
    return;
  }
  contactForm.reset();
  contactForm.classList.remove("was-validated");
  showToast("Message sent. We usually reply within a day.");
});

// ---- Sync cart across tabs ----
window.addEventListener("storage", (e) => { if (e.key === CART_KEY) renderCart(); });

// ---- Init ----
document.getElementById("year").textContent = new Date().getFullYear();
document.getElementById("free-delivery-amount").textContent = formatPrice(FREE_DELIVERY_THRESHOLD);
renderCategories();
applyFilters();
renderCart();
