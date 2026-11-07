// ---- Config ----
const CURRENCY = "৳";
const DELIVERY_FEE = 60;
const FREE_DELIVERY_THRESHOLD = 1500;
const FALLBACK_IMAGE = "Tea/MIX_tea.jpg";

const CART_KEY = "tea-shop-cart";
const ORDERS_KEY = "tea-shop-orders";

// ---- Data ----
const products = [
  { id: 1, name: "Darjeeling First Flush", category: "Black", weight: "100g", price: 650,
    description: "Delicate, floral spring harvest with a muscatel finish.", image: "Tea/darjeeling.jpg" },
  { id: 2, name: "Assam Breakfast Blend", category: "Black", weight: "200g", price: 380,
    description: "Bold, malty and brisk — perfect with milk.", image: "Tea/Assam_Tea.jpg" },
  { id: 3, name: "Masala Chai", category: "Spiced", weight: "200g", price: 420,
    description: "Black tea with cardamom, ginger, cinnamon and clove.", image: "Tea/Masala_tea.jpg" },
  { id: 4, name: "Green Tea", category: "Green", weight: "100g", price: 450,
    description: "Fresh, grassy and light. Rich in antioxidants.", image: "Tea/Green-Tea-Leaves-2.jpg" },
  { id: 5, name: "Jasmine Green Tea", category: "Green", weight: "100g", price: 520,
    description: "Green tea scented with fresh jasmine blossoms.", image: "Tea/Loose_Jasmine_Tea_Leaves.jpg" },
  { id: 6, name: "Premium Blend Tea", category: "Black", weight: "250g", price: 950,
    description: "Our signature estate blend for a rich, smooth cup.",
    image: "https://images.unsplash.com/photo-1523906630133-f6934a1ab2b9?q=80&w=1000&auto=format&fit=crop" },
  { id: 7, name: "Chamomile Calm", category: "Herbal", weight: "50g", price: 480,
    description: "Caffeine-free chamomile flowers for a relaxing evening.",
    image: "Tea/calming-herbal-tea-blend-chamomile-600nw-2568834187.jpg" },
  { id: 8, name: "Mixed Tea", category: "Black", weight: "200g", price: 350,
    description: "An everyday blend of leaf and dust for a strong cup.", image: "Tea/MIX_tea.jpg" }
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
  showToast(`${p.name} added to cart`);
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
  categoryEl.innerHTML = cats
    .map((c) => `<button type="button" class="btn btn-sm ${c === activeCategory ? "btn-success" : "btn-outline-success"}"
      data-category="${escapeHtml(c)}" aria-pressed="${c === activeCategory}">${escapeHtml(c)}</button>`)
    .join("");
};

const renderProducts = (list) => {
  if (!list.length) {
    grid.innerHTML = '<div class="col-12"><div class="alert alert-warning w-100">No teas match your search.</div></div>';
    return;
  }
  grid.innerHTML = list.map((p) => `
    <div class="col-12 col-sm-6 col-lg-4 col-xl-3">
      <div class="card h-100 shadow-sm product-card">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="card-img-top" loading="lazy">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
            <h5 class="card-title mb-0">${escapeHtml(p.name)}</h5>
            <span class="badge text-bg-light border">${escapeHtml(p.category)}</span>
          </div>
          <p class="card-text text-muted small mb-3">${escapeHtml(p.description)}</p>
          <div class="d-flex justify-content-between align-items-center mb-3 mt-auto">
            <span class="fs-5 fw-bold price">${formatPrice(p.price)}</span>
            <span class="text-muted small">${escapeHtml(p.weight)}</span>
          </div>
          <button class="btn btn-success add-to-cart" data-id="${p.id}">
            <i class="bi bi-bag-plus me-1"></i> Add to Cart
          </button>
        </div>
      </div>
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
      <div class="text-center text-muted py-5">
        <i class="bi bi-basket fs-1 d-block mb-2"></i>
        <p>Your cart is empty.</p>
      </div>`;
    return;
  }

  const remaining = FREE_DELIVERY_THRESHOLD - subtotal;
  const deliveryNote = remaining > 0
    ? `<div class="alert alert-info py-2 small mb-0">Add ${formatPrice(remaining)} more for free delivery.</div>`
    : `<div class="alert alert-success py-2 small mb-0"><i class="bi bi-truck me-1"></i>You get free delivery!</div>`;

  cartItemsEl.innerHTML = deliveryNote + cart.map((item) => `
    <div class="d-flex align-items-center gap-3 border rounded p-2">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" width="64" height="64" class="rounded object-fit-cover">
      <div class="flex-grow-1">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <div class="text-muted small">${formatPrice(item.price)} · ${escapeHtml(item.weight)}</div>
          </div>
          <button class="btn btn-sm btn-outline-secondary remove" data-id="${item.id}" aria-label="Remove ${escapeHtml(item.name)}">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-2">
          <div class="btn-group btn-group-sm quantity-control" role="group" aria-label="Quantity of ${escapeHtml(item.name)}">
            <button class="btn btn-outline-secondary decrease" data-id="${item.id}" aria-label="Decrease quantity">−</button>
            <span class="px-3 d-flex align-items-center border-top border-bottom">${item.qty}</span>
            <button class="btn btn-outline-secondary increase" data-id="${item.id}" aria-label="Increase quantity">+</button>
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
    [p.name, p.category, p.description].some((s) => s.toLowerCase().includes(q))
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
  if (confirm("Remove all items from your cart?")) clearCart();
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
      <li class="list-group-item d-flex justify-content-between">
        <span>${escapeHtml(i.name)} <span class="text-muted">× ${i.qty}</span></span>
        <span>${formatPrice(i.price * i.qty)}</span>
      </li>`).join("") + `
      <li class="list-group-item d-flex justify-content-between text-muted">
        <span>Delivery</span><span>${delivery ? formatPrice(delivery) : "Free"}</span>
      </li>
      <li class="list-group-item d-flex justify-content-between fw-bold">
        <span>Total</span><span>${formatPrice(subtotal + delivery)}</span>
      </li>`;
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
    `We'll call ${order.customer.phone} to confirm delivery. Amount due: ${formatPrice(order.total)} (${order.payment.toLowerCase()}).`;

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
  showToast("Thanks! We'll get back to you soon.");
});

// ---- Sync cart across tabs ----
window.addEventListener("storage", (e) => { if (e.key === CART_KEY) renderCart(); });

// ---- Init ----
document.getElementById("year").textContent = new Date().getFullYear();
document.getElementById("free-delivery-amount").textContent = formatPrice(FREE_DELIVERY_THRESHOLD);
renderCategories();
applyFilters();
renderCart();
