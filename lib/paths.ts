// The one place raw URLs are built. next/link adds the base path itself;
// everything else (plain <a>, images, share URLs) goes through here.

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/** "/og.png" → "/techthrive-learn/og.png" on GitHub Pages. */
export function withBase(path: string): string {
  return `${basePath}${path}`;
}

/** Absolute URL for metadata and share links. */
export function absoluteUrl(path: string): string {
  return `${siteUrl}${withBase(path)}`;
}
