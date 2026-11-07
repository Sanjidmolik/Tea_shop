// Local test server: serves the website and answers POST /exec with the real Code.gs
// (running on simulated Google services, see gas-mock.js).
//   node tests/mock-server.js            -> http://localhost:8790
// Test hooks: GET /__mock/rows?sheet=Orders, POST /__mock/mode {"delayMs":0,"fail":"500"|"drop"|null}, POST /__mock/reset
const http = require("http");
const fs = require("fs");
const path = require("path");
const { createGas, ROOT } = require("./gas-mock");

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml",
  ".xml": "application/xml", ".txt": "text/plain; charset=utf-8", ".gs": "text/plain; charset=utf-8" };

function start(port = 8790) {
  let gas = createGas();
  gas.context.setup();
  let mode = { delayMs: 0, fail: null };
  let posts = 0;

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const cors = { "Access-Control-Allow-Origin": "*" };
    if (url.pathname === "/exec" && req.method === "POST") {
      let body = "";
      req.on("data", (c) => { body += c; });
      req.on("end", () => {
        posts++;
        const reply = () => {
          if (mode.fail === "drop") { req.socket.destroy(); return; }
          if (mode.fail === "500") { res.writeHead(500, cors); res.end("error"); return; }
          const out = gas.post(body);
          res.writeHead(200, { ...cors, "Content-Type": "application/json" });
          res.end(JSON.stringify(out));
        };
        mode.delayMs ? setTimeout(reply, mode.delayMs) : reply();
      });
      return;
    }
    if (url.pathname === "/__mock/rows") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ rows: gas.rows(url.searchParams.get("sheet") || "Orders"), posts }));
      return;
    }
    if (url.pathname === "/__mock/mode" && req.method === "POST") {
      let body = "";
      req.on("data", (c) => { body += c; });
      req.on("end", () => { mode = { delayMs: 0, fail: null, ...JSON.parse(body || "{}") }; res.end("ok"); });
      return;
    }
    if (url.pathname === "/__mock/reset" && req.method === "POST") {
      gas = createGas(); gas.context.setup(); mode = { delayMs: 0, fail: null }; posts = 0;
      res.end("ok");
      return;
    }
    if (url.pathname === "/__mock/promo" && req.method === "POST") {
      let body = "";
      req.on("data", (c) => { body += c; });
      req.on("end", () => { gas.sheets.Promos.push(JSON.parse(body)); res.end("ok"); });
      return;
    }
    // Static files
    let file = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end("not found"); return; }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(port, () => resolve({ server, port, url: `http://localhost:${port}/` })));
}

if (require.main === module) start(Number(process.env.PORT) || 8790).then(({ url }) => console.log(`Mock server on ${url}`));
module.exports = { start };
