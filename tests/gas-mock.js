// Runs apps-script/Code.gs in Node with in-memory stand-ins for Google services.
// Used by the server tests and by the local mock server for end-to-end tests.
// It exercises the real Code.gs logic; only Google's infrastructure is simulated.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");

function createGas({ catalogText } = {}) {
  const sheets = {};        // name -> array of rows (row 0 = headers)
  const cache = new Map();
  const props = new Map([["CATALOG_URL", "https://example.test/catalog.js"]]);
  const mail = [];
  const fetches = [];
  let catalog = catalogText ?? fs.readFileSync(path.join(ROOT, "catalog.js"), "utf8");
  let fetchStatus = 200;

  const makeSheet = (name) => {
    const rows = (sheets[name] = sheets[name] || []);
    return {
      appendRow: (r) => { rows.push(r.slice()); },
      getLastRow: () => rows.length,
      setFrozenRows: () => {},
      getRange: (r, c, nr = 1, nc = 1) => ({
        getValues: () => rows.slice(r - 1, r - 1 + nr).map((row) => {
          const out = row.slice(c - 1, c - 1 + nc);
          while (out.length < nc) out.push("");
          return out;
        }),
        setFontWeight: () => {}
      })
    };
  };

  const ss = {
    getSheetByName: (n) => (sheets[n] ? makeSheet(n) : null),
    insertSheet: (n) => { sheets[n] = []; return makeSheet(n); },
    setSpreadsheetTimeZone: () => {}
  };

  const pad = (n, w = 2) => String(n).padStart(w, "0");
  const dhaka = (d) => new Date(d.getTime() + 6 * 3600 * 1000); // Asia/Dhaka is UTC+6, no DST

  const context = {
    console: { log() {}, warn() {}, error() {} },
    JSON, Math, Date, Number, String, Array, Object, RegExp, Error, isNaN,
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => (cache.has(k) ? cache.get(k) : null),
        put: (k, v) => { cache.set(k, String(v)); },
        remove: (k) => { cache.delete(k); }
      })
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (props.has(k) ? props.get(k) : null),
        setProperty: (k, v) => { props.set(k, String(v)); }
      })
    },
    UrlFetchApp: {
      fetch: (url) => {
        fetches.push(url);
        return { getResponseCode: () => fetchStatus, getContentText: () => catalog };
      }
    },
    Utilities: {
      formatDate: (d, tz, fmt) => {
        const x = dhaka(d);
        const map = {
          yyyy: x.getUTCFullYear(), yy: pad(x.getUTCFullYear() % 100), MM: pad(x.getUTCMonth() + 1), dd: pad(x.getUTCDate()),
          HH: pad(x.getUTCHours()), mm: pad(x.getUTCMinutes()), ss: pad(x.getUTCSeconds())
        };
        return fmt.replace(/yyyy|yy|MM|dd|HH|mm|ss/g, (k) => map[k]);
      }
    },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (s) => ({ content: s, setMimeType() { return this; }, getContent() { return this.content; } })
    },
    MailApp: { sendEmail: (m) => mail.push(m) }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "apps-script", "Code.gs"), "utf8"), context, { filename: "Code.gs" });

  const post = (body) => {
    const raw = typeof body === "string" ? body : JSON.stringify(body);
    return JSON.parse(context.doPost({ postData: { contents: raw } }).getContent());
  };

  return {
    context, sheets, cache, props, mail, fetches, post,
    get: () => JSON.parse(context.doGet().getContent()),
    setCatalog: (text) => { catalog = text; cache.clear(); },
    setFetchStatus: (s) => { fetchStatus = s; },
    rows: (name) => (sheets[name] || []).slice(1)
  };
}

module.exports = { createGas, ROOT };
