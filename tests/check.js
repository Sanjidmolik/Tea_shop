// Static checks (no browser): JavaScript syntax, catalogue format, HTML ids, translations, links.
//   node tests/check.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const problems = [];
const ok = (cond, msg) => { if (!cond) problems.push(msg); };

// 1. Syntax of every script (Code.gs is plain JavaScript)
const scripts = [...fs.readdirSync(ROOT).filter((f) => f.endsWith(".js")), ...["tests", "tools"].flatMap((d) => fs.readdirSync(path.join(ROOT, d)).filter((f) => f.endsWith(".js")).map((f) => `${d}/${f}`))];
for (const f of scripts) {
  try { execFileSync(process.execPath, ["--check", path.join(ROOT, f)], { stdio: "pipe" }); } catch (e) { problems.push(`${f}: ${e.stderr}`); }
}
try { new vm.Script(read("apps-script/Code.gs"), { filename: "Code.gs" }); } catch (e) { problems.push(`Code.gs: ${e.message}`); }
try { JSON.parse(read("apps-script/appsscript.json")); } catch (e) { problems.push(`appsscript.json: ${e.message}`); }

// 2. catalog.js must be strict JSON after the assignment
const cat = read("catalog.js");
const m = /^window\.CHA_CATALOG\s*=/m.exec(cat);
let catalog = null;
try { catalog = JSON.parse(cat.slice(m.index + m[0].length, cat.lastIndexOf(";"))); } catch (e) { problems.push(`catalog.js is not strict JSON: ${e.message}`); }
if (catalog) {
  for (const p of catalog.products.filter((x) => x.image)) {
    for (const k of ["card", "large", "fallback"]) {
      const src = p.image[k];
      if (src && !/^https?:/.test(src)) ok(fs.existsSync(path.join(ROOT, src)), `catalog image missing: ${src}`);
    }
  }
}

// 3. HTML: unique ids, local links/scripts exist, translation keys have Bangla
const ctx = {}; vm.createContext(ctx);
vm.runInContext(`${read("i18n.js")}; this.I18N = I18N;`, ctx);
const bn = ctx.I18N.bn;
for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith(".html"))) {
  const html = read(f);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  ok(!dup.length, `${f}: duplicate ids ${[...new Set(dup)].join(", ")}`);
  for (const [, ref] of html.matchAll(/(?:src|href)="([^"#:]+?)(?:#[^"]*)?"/g)) {
    if (ref.startsWith("data:") || ref.startsWith("//")) continue;
    ok(fs.existsSync(path.join(ROOT, ref.split("?")[0])), `${f}: missing local file ${ref}`);
  }
  for (const [, key] of html.matchAll(/data-i18n="([^"]+)"/g)) ok(bn[key], `${f}: no Bangla text for "${key}"`);
  for (const [, attr] of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    attr.split(";").forEach((pair) => { const key = pair.split(":")[1]; ok(bn[key], `${f}: no Bangla text for "${key}"`); });
  }
}
// 4. Every t("key") used in JavaScript exists in English
for (const f of ["app.js", "shared.js", "animations.js"]) {
  for (const [, key] of read(f).matchAll(/\bt\("([^"]+)"/g)) ok(ctx.I18N.en[key] || bn[key], `${f}: unknown text key "${key}"`);
}
// 5. No secrets committed
for (const f of ["config.js", "catalog.js"]) ok(!/(api[_-]?key|secret|password|private_key)\s*[:=]/i.test(read(f)), `${f}: looks like it contains a secret`);

if (problems.length) {
  console.log(`Static checks: ${problems.length} problem(s)\n  - ${problems.join("\n  - ")}`);
  process.exitCode = 1;
} else console.log(`Static checks: all passed (${scripts.length} scripts, catalogue, HTML, translations)`);
