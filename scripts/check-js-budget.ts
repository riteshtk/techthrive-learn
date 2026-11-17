// Fails if any built page loads more than 150 KB of gzipped JavaScript
// (PRD quality bar). Run after `npm run build`. noModule scripts are
// skipped: modern browsers never download them.
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
for (const file of htmlFiles(out)) {
  const html = readFileSync(file, "utf8");
  const scripts = new Set<string>();
  for (const [tag, src] of html.matchAll(
    /<script[^>]*\ssrc="([^"]+\.js)"[^>]*>/g,
  )) {
    if (/\snoModule/i.test(tag)) continue;
    scripts.add(src!.slice(basePath.length));
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
