const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path");
const root = path.join(__dirname, "dist");
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};
http
  .createServer((req, res) => {
    let file;
    try {
      file = path.resolve(
        root,
        "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
      );
    } catch {
      res.writeHead(400);
      return res.end();
    }
    if (!file.startsWith(root + path.sep) && file !== root) {
      res.writeHead(403);
      return res.end();
    }
    if (
      file === root ||
      (fs.existsSync(file) && fs.statSync(file).isDirectory())
    )
      file = path.join(file, "index.html");
    if (!fs.existsSync(file)) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Workbench: http://127.0.0.1:${port}`),
  );
