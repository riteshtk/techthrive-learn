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
  ".mp3": "audio/mpeg",
};

/**
 * The bytes a Range header asks for, as GitHub Pages honours it: one
 * "bytes=start-end", "bytes=start-" or "bytes=-suffix". null for no
 * header or one we don't serve (send the whole file); "unsatisfiable"
 * when it starts past the end. Safari needs ranges to play audio: without
 * them it treats a file as a live stream and never reaches its end.
 */
export function byteRange(
  header: string | undefined,
  size: number,
): { start: number; end: number } | "unsatisfiable" | null {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header ?? "");
  if (!m || (m[1] === "" && m[2] === "")) return null;
  if (m[1] === "") {
    const suffix = Number(m[2]);
    if (suffix === 0) return "unsatisfiable";
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }
  const start = Number(m[1]);
  const end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  if (start >= size || end < start) return "unsatisfiable";
  return { start, end };
}

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
  range?: string,
) {
  const size = statSync(file).size;
  const type = types[extname(file)] ?? "application/octet-stream";
  const want = status === 200 ? byteRange(range, size) : null;
  if (want === "unsatisfiable") {
    res.writeHead(416, { "content-range": `bytes */${size}` });
    res.end();
    return;
  }
  if (want) {
    res.writeHead(206, {
      "content-type": type,
      "accept-ranges": "bytes",
      "content-range": `bytes ${want.start}-${want.end}/${size}`,
      "content-length": want.end - want.start + 1,
    });
    createReadStream(file, want).pipe(res);
    return;
  }
  res.writeHead(status, {
    "content-type": type,
    "accept-ranges": "bytes",
    "content-length": size,
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
    if (file) send(res, 200, file, req.headers.range);
    else send(res, 404, join(root, "404.html"));
  }).listen(port, () => {
    console.log(`Serving out/ at http://localhost:${port}${basePath}/`);
  });
}
