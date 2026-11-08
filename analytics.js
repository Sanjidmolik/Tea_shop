// Cha Bazaar — optional, privacy-respecting analytics.
// Off unless CHA_CONFIG.ANALYTICS.provider is "plausible" or "ga4".
//   Plausible: cookie-less, loads straight away.
//   GA4: loads only after the visitor accepts the analytics notice (stored in localStorage).
// Never send names, phone numbers, addresses or emails to analytics.

(() => {
  const cfg = (window.CHA_CONFIG && window.CHA_CONFIG.ANALYTICS) || {};
  const provider = cfg.provider;
  const CONSENT_KEY = "cha-analytics-consent"; // "granted" | "denied"
  const queue = [];
  let ready = false;

  const getConsent = () => { try { return localStorage.getItem(CONSENT_KEY); } catch { return null; } };
  const setConsent = (v) => { try { localStorage.setItem(CONSENT_KEY, v); } catch { /* ignore */ } };

  const loadScript = (src, attrs = {}) => {
    const s = document.createElement("script");
    s.async = true;
    s.src = src;
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    document.head.appendChild(s);
  };

  const send = (name, props) => {
    if (provider === "plausible" && typeof window.plausible === "function") {
      window.plausible(name, { props });
    } else if (provider === "ga4" && typeof window.gtag === "function") {
      window.gtag("event", name, props);
    }
  };

  const flush = () => { ready = true; queue.splice(0).forEach(([n, p]) => send(n, p)); };

  const startPlausible = () => {
    if (!cfg.plausibleDomain) return;
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
    loadScript("https://plausible.io/js/script.js", { "data-domain": cfg.plausibleDomain, defer: "" });
    flush();
  };

  const startGa4 = () => {
    if (!/^G-[A-Z0-9]+$/.test(cfg.ga4MeasurementId || "")) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", cfg.ga4MeasurementId, { anonymize_ip: true });
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.ga4MeasurementId)}`);
    flush();
  };

  const askConsent = () => {
    const bar = document.createElement("div");
    bar.className = "consent-bar";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Analytics notice");
    bar.innerHTML = `<p>We'd like to use Google Analytics to see which teas people look at, so we can improve the shop.
      It never receives your name, phone or address. <a href="privacy.html">Privacy policy</a></p>
      <div><button type="button" class="btn btn-sm btn-garden" data-consent="granted">Allow</button>
      <button type="button" class="btn btn-sm btn-link-muted" data-consent="denied">No thanks</button></div>`;
    bar.addEventListener("click", (e) => {
      const b = e.target.closest("[data-consent]");
      if (!b) return;
      setConsent(b.dataset.consent);
      bar.remove();
      if (b.dataset.consent === "granted") startGa4();
    });
    document.body.appendChild(bar);
  };

  // Public: chaTrack("add_to_cart", { sku, value })
  window.chaTrack = (name, props = {}) => {
    if (!provider) return;
    if (ready) send(name, props); else queue.push([name, props]);
  };

  if (provider === "plausible") startPlausible();
  else if (provider === "ga4") {
    const consent = getConsent();
    if (consent === "granted") startGa4();
    else if (consent !== "denied") document.addEventListener("DOMContentLoaded", askConsent, { once: true });
  }
})();
