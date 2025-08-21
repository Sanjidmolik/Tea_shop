// ---- Data ----
const products = [
  { id: 1, name: "Darjeeling First Flush", price: 8.99, image: "Tea/darjeeling.jpg" },
  { id: 2, name: "Assam Breakfast Blend", price: 6.49, image: "Tea/Assam_tea.jpg" },
  { id: 3, name: "Masala Chai", price: 7.5,  image: "Tea/Masala_tea.jpg" },
  { id: 4, name: "Green tea", price: 9.25, image: "Tea/Green-Tea-Leaves-2.jpg" },
  { id: 5, name: "Jasmine Green Tea", price: 5.99, image: "Tea/Loose_Jasmine_Tea_Leaves.jpg" },
  { id: 6, name: "Premium Blend Tea", price: 12.0, image: "https://images.unsplash.com/photo-1523906630133-f6934a1ab2b9?q=80&w=1000&auto=format&fit=crop" },
  { id: 7, name: "Chamomile Calm", price: 4.49, image: "Tea/calming-herbal-tea-blend-chamomile-600nw-2568834187.jpg" },
  { id: 8, name: "Clone Tea", price: 4.99, image: "Tea/MIX_tea.jpg" }
];

// ---- Storage helpers ----
const CART_KEY = "tea-shop-cart";

const readCart = () => {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) ?? []; }
  catch { return []; }
};
const writeCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));

// ---- Cart operations ----
const addToCart = (productId) => {
  const cart = readCart();
  const idx = cart.findIndex((i) => i.id === productId);
  if (idx > -1) cart[idx].qty += 1;
  else {
    const p = products.find((p) => p.id === productId);
    cart.push({ id: p.id, name: p.name, price: p.price, image: p.image, qty: 1 });
  }
  writeCart(cart); updateCartBadge(); renderCart();
};

const setQty = (productId, qty) => {
  let cart = readCart();
  cart = cart.map((i) => (i.id === productId ? { ...i, qty: Math.max(1, qty) } : i))
             .filter((i) => i.qty > 0);
  writeCart(cart); updateCartBadge(); renderCart();
};

const removeFromCart = (productId) => {
  writeCart(readCart().filter((i) => i.id !== productId));
  updateCartBadge(); renderCart();
};

const clearCart = () => { writeCart([]); updateCartBadge(); renderCart(); };

const cartCount = () => readCart().reduce((sum, i) => sum + i.qty, 0);
const cartTotal = () => readCart().reduce((sum, i) => sum + i.price * i.qty, 0);

// ---- Render products ----
const grid = document.getElementById("product-grid");

const renderProducts = (list) => {
  grid.innerHTML = "";
  if (!list.length) {
    grid.innerHTML = '<div class="col"><div class="alert alert-warning w-100">No teas match your search.</div></div>';
    return;
  }
  list.forEach((p) => {
    const col = document.createElement("div");
    col.className = "col-12 col-sm-6 col-lg-4 col-xl-3";
    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <img src="${p.image}" alt="${p.name}" class="card-img-top" loading="lazy">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${p.name}</h5>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="badge text-bg-light price">$${p.price.toFixed(2)}</span>
          </div>
          <button class="btn btn-success mt-auto add-to-cart" data-id="${p.id}">
            <i class="bi bi-bag-plus me-1"></i> Add to Cart
          </button>
        </div>
      </div>`;
    grid.appendChild(col);
  });
};

// ---- Render cart ----
const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const cartCountEl = document.getElementById("cart-count");

const updateCartBadge = () => { cartCountEl.textContent = cartCount(); };

const renderCart = () => {
  const cart = readCart();
  cartItemsEl.innerHTML = "";

  if (!cart.length) {
    cartItemsEl.innerHTML = `
      <div class="text-center text-muted py-5">
        <i class="bi bi-basket fs-1 d-block mb-2"></i>
        <p>Your cart is empty.</p>
      </div>`;
    cartTotalEl.textContent = "$0.00";
    return;
  }

  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "d-flex align-items-center gap-3 border rounded p-2";
    row.innerHTML = `
      <img src="${item.image}" alt="${item.name}" width="64" height="64" class="rounded object-fit-cover" style="object-fit:cover;">
      <div class="flex-grow-1">
        <div class="d-flex justify-content-between align-items-start">
          <strong>${item.name}</strong>
          <button class="btn btn-sm btn-outline-secondary remove" data-id="${item.id}" aria-label="Remove ${item.name}">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-2">
          <div class="btn-group quantity-control" role="group" aria-label="Quantity">
            <button class="btn btn-outline-secondary decrease" data-id="${item.id}">−</button>
            <span class="px-3" aria-live="polite">${item.qty}</span>
            <button class="btn btn-outline-secondary increase" data-id="${item.id}">+</button>
          </div>
          <span class="fw-semibold">$${(item.price * item.qty).toFixed(2)}</span>
        </div>
      </div>`;
    cartItemsEl.appendChild(row);
  });

  cartTotalEl.textContent = `$${cartTotal().toFixed(2)}`;
};

// ---- Search & Sort ----
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

const applyFilters = () => {
  const q = searchInput.value.trim().toLowerCase();
  let list = products.filter((p) => p.name.toLowerCase().includes(q));

  switch (sortSelect.value) {
    case "price-asc":  list.sort((a, b) => a.price - b.price); break;
    case "price-desc": list.sort((a, b) => b.price - a.price); break;
    case "name-asc":   list.sort((a, b) => a.name.localeCompare(b.name)); break;
    case "name-desc":  list.sort((a, b) => b.name.localeCompare(a.name)); break;
    default: /* keep original order */ break;
  }

  renderProducts(list);
};

searchInput.addEventListener("input", applyFilters);
sortSelect.addEventListener("change", applyFilters);

// ---- Delegated events ----
grid.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-to-cart");
  if (btn) addToCart(Number(btn.dataset.id));
});

cartItemsEl.addEventListener("click", (e) => {
  const dec = e.target.closest(".decrease");
  const inc = e.target.closest(".increase");
  const rem = e.target.closest(".remove");
  if (dec) {
    const id = Number(dec.dataset.id);
    const item = readCart().find((i) => i.id === id);
    if (item) setQty(id, item.qty - 1);
  }
  if (inc) {
    const id = Number(inc.dataset.id);
    const item = readCart().find((i) => i.id === id);
    if (item) setQty(id, item.qty + 1);
  }
  if (rem) removeFromCart(Number(rem.dataset.id));
});

// ---- Footer year ----
document.getElementById("year").textContent = new Date().getFullYear();

// ---- Buttons ----
document.getElementById("clearCartBtn").addEventListener("click", clearCart);
document.getElementById("checkoutBtn").addEventListener("click", () => {
  const total = cartTotal();
  if (!total) return alert("Your cart is empty.");
  alert(`This is a demo checkout. Total: $${total.toFixed(2)}`);
});

// ---- Init ----
updateCartBadge();
applyFilters();
renderCart();
