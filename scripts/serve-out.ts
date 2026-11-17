// Serves the static export in out/ under BASE_PATH, the way GitHub Pages
// does, so end-to-end tests exercise the real base path.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = join(import.meta.dirname, "..", "out");
const basePath = process.env.BASE_PATH ?? "";
const port = Number(process.env.PORT ?? 4517);

const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function send(
  res: import("node:http").ServerResponse,
  status: number,
  file: string,
) {
  res.writeHead(status, {
    "content-type": types[extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const notFound = join(root, "404.html");
  if (!url.pathname.startsWith(`${basePath}/`)) {
    return send(res, 404, notFound);
  }
  const rel = decodeURIComponent(url.pathname.slice(basePath.length));
  let file = normalize(join(root, rel));
  if (!file.startsWith(root)) return send(res, 404, notFound);
  if (existsSync(file) && statSync(file).isDirectory()) {
    file = join(file, "index.html");
  }
  if (!existsSync(file)) return send(res, 404, notFound);
  send(res, 200, file);
}).listen(port, () => {
  console.log(`Serving out/ at http://localhost:${port}${basePath}/`);
});
