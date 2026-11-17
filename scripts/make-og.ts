// Renders the site's one 1200×630 share image to public/og.png.
// Run by hand when the design changes: npx tsx scripts/make-og.ts
// (sharp is installed with Next.js).
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const INK = "#070A12";
const PORCELAIN = "#F4F1EA";
const EMBER = "#FF5A1F";
const DIM = "#4A5265";
const SURFACE = "#111725";
const FONT = "Inter, Helvetica Neue, Helvetica, Arial, sans-serif";

function box(x: number, label: string, on: boolean) {
  return `
    <rect x="${x}" y="430" width="220" height="96" rx="16"
      fill="${SURFACE}" stroke="${on ? EMBER : DIM}" stroke-width="${on ? 6 : 3}"/>
    <text x="${x + 110}" y="490" text-anchor="middle" font-family="${FONT}"
      font-size="34" font-weight="600" fill="${on ? PORCELAIN : "#9EA3AE"}">${label}</text>`;
}

function arrow(x1: number, x2: number, on: boolean) {
  const colour = on ? EMBER : DIM;
  return `
    <line x1="${x1}" y1="478" x2="${x2 - 14}" y2="478" stroke="${colour}" stroke-width="${on ? 6 : 3}"/>
    <path d="M${x2 - 18},464 L${x2},478 L${x2 - 18},492 z" fill="${colour}"/>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${INK}"/>
  <text x="80" y="170" font-family="${FONT}" font-size="76" font-weight="700" fill="${PORCELAIN}">Tech &amp; Thrive Learn</text>
  <text x="80" y="250" font-family="${FONT}" font-size="38" fill="#B8B4AB">System design and AI, one step at a time.</text>
  <text x="80" y="305" font-family="${FONT}" font-size="38" fill="#B8B4AB">Free and open source.</text>
  ${box(80, "Prompt", false)}
  ${arrow(300, 410, false)}
  ${box(410, "Model", true)}
  ${arrow(630, 740, true)}
  ${box(740, "Answer", false)}
</svg>`;

const out = join(import.meta.dirname, "..", "public", "og.png");
mkdirSync(join(import.meta.dirname, "..", "public"), { recursive: true });
await sharp(Buffer.from(svg)).png().toFile(out);
console.log(`Wrote ${out}`);
