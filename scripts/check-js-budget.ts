// Fails if any built page loads more than 150 KB of gzipped JavaScript
// (PRD quality bar). Run after `npm run build`.
//
// A page's JavaScript is its <script src> tags plus every chunk its
// embedded React payload names: client components rendered on the page,
// including ones loaded through next/dynamic, which never get a script tag
// but download before the page works. noModule scripts (the legacy
// polyfill) are skipped wherever they appear: modern browsers never
// download them. Prefetches for other pages aren't in the page, so they
// don't count.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";

const BUDGET_KB = 150;
const out = join(import.meta.dirname, "..", "out");
const basePath = process.env.BASE_PATH ?? "";

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory())
      return name === "_next" ? [] : htmlFiles(full);
    return name.endsWith(".html") ? [full] : [];
  });
}

let failed = false;
// The legacy polyfill, named by noModule script tags on any page.
const legacy = new Set<string>();
for (const file of htmlFiles(out))
  for (const [tag, src] of readFileSync(file, "utf8").matchAll(
    /<script[^>]*\ssrc="([^"]+\.js)"[^>]*>/g,
  ))
    if (/\snoModule/i.test(tag)) legacy.add(src!.slice(basePath.length));

for (const file of htmlFiles(out)) {
  const html = readFileSync(file, "utf8");
  const scripts = new Set<string>();
  for (const [tag, src] of html.matchAll(
    /<script[^>]*\ssrc="([^"]+\.js)"[^>]*>/g,
  )) {
    if (/\snoModule/i.test(tag)) continue;
    scripts.add(src!.slice(basePath.length));
  }
  // Chunks named in the payload, with or without the base path.
  for (const [, src] of html.matchAll(
    /(?:\\"|")((?:[^"\\]*?)\/_next\/static\/chunks\/[^"\\]+\.js)/g,
  )) {
    const path = src!.slice(src!.indexOf("/_next/"));
    if (!legacy.has(path)) scripts.add(path);
  }
  let bytes = 0;
  for (const src of scripts)
    bytes += gzipSync(readFileSync(join(out, src))).length;
  const kb = bytes / 1024;
  const over = kb > BUDGET_KB;
  failed ||= over;
  console.log(
    `${over ? "✗" : "✓"} ${relative(out, file).padEnd(40)} ${kb.toFixed(1)} KB`,
  );
}

if (failed) {
  console.error(`\nA page is over the ${BUDGET_KB} KB JavaScript budget.`);
  process.exit(1);
}
