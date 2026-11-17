// Serves the static export in out/ under BASE_PATH, the way GitHub Pages
// does, so end-to-end tests exercise the real base path.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, isAbsolute, join, relative, sep } from "node:path";

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

/**
 * The file in `root` a request path names, or undefined for anything that
 * should get the 404 page: outside the base path, malformed, missing, or
 * reaching outside `root`.
 */
export function resolveFile(
  pathname: string,
  root: string,
  basePath: string,
): string | undefined {
  if (!pathname.startsWith(`${basePath}/`)) return undefined;
  let rel: string;
  try {
    rel = decodeURIComponent(pathname.slice(basePath.length));
  } catch {
    return undefined;
  }
  let file = join(root, rel);
  const inside = relative(root, file);
  if (inside === ".." || inside.startsWith(`..${sep}`) || isAbsolute(inside))
    return undefined;
  if (existsSync(file) && statSync(file).isDirectory()) {
    file = join(file, "index.html");
  }
  return existsSync(file) ? file : undefined;
}

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

if (import.meta.main) {
  const root = join(import.meta.dirname, "..", "out");
  const basePath = process.env.BASE_PATH ?? "";
  const port = Number(process.env.PORT ?? 4517);

  createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const file = resolveFile(url.pathname, root, basePath);
    if (file) send(res, 200, file);
    else send(res, 404, join(root, "404.html"));
  }).listen(port, () => {
    console.log(`Serving out/ at http://localhost:${port}${basePath}/`);
  });
}
