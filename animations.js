// Cha Bazaar — motion layer. Loaded after app.js.
// Does nothing beyond basic feedback when the visitor prefers reduced motion.
(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  // ---- Navbar shadow on scroll (state change, runs for everyone) ----
  const nav = document.querySelector(".site-nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---- "Added" feedback on the button (runs for everyone) ----
  document.getElementById("product-grid").addEventListener("click", (e) => {
    const btn = e.target.closest(".add-to-cart");
    if (!btn) return;
    clearTimeout(btn._addedTimer);
    btn.classList.add("added");
    btn.innerHTML = '<i class="bi bi-check-lg" aria-hidden="true"></i> Added';
    btn._addedTimer = setTimeout(() => {
      btn.classList.remove("added");
      btn.textContent = "Add to cart";
    }, 1200);
    if (!reduced) flyToCart(btn);
  });

  if (reduced) return;
  root.classList.add("motion");

  // ---- Hero: split the headline into words that rise in ----
  const title = document.querySelector(".hero-title");
  const text = title.textContent.trim();
  title.setAttribute("aria-label", text);
  title.innerHTML = text.split(/\s+/)
    .map((w, i) => `<span class="word" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`)
    .join(" ");

  // ---- Hero: drifting tea leaves ----
  const hero = document.querySelector(".hero");
  const leaves = document.createElement("div");
  leaves.className = "leaves";
  leaves.setAttribute("aria-hidden", "true");
  const rand = (min, max) => min + Math.random() * (max - min);
  const leafCount = window.innerWidth < 576 ? 7 : 14;
  for (let i = 0; i < leafCount; i++) {
    const leaf = document.createElement("span");
    leaf.className = "leaf";
    leaf.style.cssText = `
      --x:${rand(0, 100)}%;
      --size:${rand(10, 22)}px;
      --o:${rand(.15, .45)};
      --dur:${rand(14, 26)}s;
      --delay:${rand(-26, 0)}s;
      --sway:${rand(30, 90)};`;
    leaves.appendChild(leaf);
  }
  hero.prepend(leaves);

  // ---- Hero: chest tilts toward the pointer ----
  const chestFace = document.querySelector(".chest-face");
  if (window.matchMedia("(pointer: fine)").matches) {
    hero.addEventListener("pointermove", (e) => {
      const r = chestFace.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      const y = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      chestFace.style.setProperty("--tilt-y", `${(x * 14).toFixed(2)}deg`);
      chestFace.style.setProperty("--tilt-x", `${(-y * 10).toFixed(2)}deg`);
    });
    hero.addEventListener("pointerleave", () => {
      chestFace.style.setProperty("--tilt-y", "0deg");
      chestFace.style.setProperty("--tilt-x", "0deg");
    });
  }

  // ---- Delivery strip becomes a ticker ----
  const strip = document.querySelector(".promises");
  const list = strip.querySelector(".promise-list");
  // Repeat the items so the strip is always wider than the screen, then double it for a seamless loop.
  const originals = [...list.children];
  const fill = () => originals.forEach((li) => {
    const c = li.cloneNode(true);
    c.setAttribute("aria-hidden", "true");
    list.appendChild(c);
  });
  strip.classList.add("ticker");
  for (let i = 0; i < 6 && list.scrollWidth < window.innerWidth * 1.2; i++) fill();
  [...list.children].forEach((li) => {
    const c = li.cloneNode(true);
    c.setAttribute("aria-hidden", "true");
    list.appendChild(c);
  });

  // ---- Scroll reveals ----
  // Observed element -> element that gets the "in" class. Clipped titles can't be observed
  // directly (a fully clipped element never counts as visible), so we watch their parent.
  const revealTargets = new Map();
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      (revealTargets.get(entry.target) || [entry.target]).forEach((el) => el.classList.add("in"));
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".section-title").forEach((el) => {
    if (el.closest(".hero")) return;
    el.classList.add("wipe");
    const watch = el.parentElement;
    revealTargets.set(watch, [...(revealTargets.get(watch) || []), el]);
    revealObserver.observe(watch);
  });

  const revealGroups = [
    [".category-tabs", ".shop-tools"],
    [".about-img", ".about p", ".sourcing > div"],
    [".contact p", ".contact-list li", ".contact-form"]
  ];
  revealGroups.forEach((selectors) => {
    document.querySelectorAll(selectors.join(",")).forEach((el, i) => {
      el.classList.add("reveal");
      el.style.setProperty("--delay", `${Math.min(i, 6) * 0.08}s`);
      revealObserver.observe(el);
    });
  });

  // ---- Tea cards rise in when they scroll into view, and again after filtering ----
  const grid = document.getElementById("product-grid");
  const cardObserver = new IntersectionObserver((entries) => {
    let n = 0;
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const col = entry.target;
      col.style.setProperty("--i", n++);
      col.classList.remove("card-wait");
      col.classList.add("card-enter");
      cardObserver.unobserve(col);
    });
  }, { threshold: 0.1 });

  const prepareCards = () => {
    grid.querySelectorAll(":scope > .col-12").forEach((col) => {
      col.classList.add("tea-col", "card-wait");
      cardObserver.observe(col);
    });
  };
  new MutationObserver(prepareCards).observe(grid, { childList: true });
  prepareCards();

  // ---- Order confirmation stamp ----
  const confirmModal = document.getElementById("confirmModal");
  const confirmContent = confirmModal.querySelector(".confirm");
  confirmModal.addEventListener("show.bs.modal", () => confirmContent.classList.add("show-stamp"));
  confirmModal.addEventListener("hidden.bs.modal", () => confirmContent.classList.remove("show-stamp"));

  // ---- Fly the tea photo into the cart ----
  function flyToCart(btn) {
    const img = btn.closest(".tea")?.querySelector(".tea-img");
    const target = document.querySelector(".cart-btn");
    if (!img || !target) return;
    const from = img.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const size = Math.min(from.width, 140);

    const clone = img.cloneNode();
    clone.className = "fly-img";
    clone.removeAttribute("loading");
    Object.assign(clone.style, {
      left: `${from.left + from.width / 2 - size / 2}px`,
      top: `${from.top + from.height / 2 - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`
    });
    document.body.appendChild(clone);

    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    clone.animate([
      { transform: "translate(0, 0) scale(1)", opacity: 1, borderRadius: "6px" },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(.6)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(.15)`, opacity: .4, borderRadius: "50%" }
    ], { duration: 750, easing: "cubic-bezier(.5, 0, .3, 1)" }).finished
      .then(() => {
        clone.remove();
        target.animate(
          [{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }],
          { duration: 300, easing: "ease-out" }
        );
      });
  }
})();
