import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Reads the colour tokens straight from globals.css, so this checks the
// palette that actually ships, in both themes.
const css = readFileSync(join(__dirname, "../../app/globals.css"), "utf8");
const tokenBlock = css.slice(css.indexOf(":root {"), css.indexOf("@media"));
const raw: Record<string, string> = Object.fromEntries(
  [...tokenBlock.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [
    m[1]!,
    m[2]!.trim(),
  ]),
);

type Scheme = "light" | "dark";

/** Resolves var() and picks the right side of light-dark(). */
function resolve(name: string, scheme: Scheme): string {
  let value = raw[name];
  for (let i = 0; value && i < 10; i++) {
    const pair = value.match(/^light-dark\((.+),\s*(.+)\)$/);
    if (pair) value = scheme === "light" ? pair[1]!.trim() : pair[2]!.trim();
    const ref = value.match(/^var\(--([\w-]+)\)$/);
    if (!ref) break;
    value = raw[ref[1]!];
  }
  if (!value || !/^#[0-9a-f]{6}$/i.test(value))
    throw new Error(`--${name} does not resolve to a hex colour (${scheme})`);
  return value.toLowerCase();
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** Every text colour and what it sits on. */
const TEXT_PAIRS: [text: string, background: string][] = [
  ["text", "bg"],
  ["text", "surface"],
  ["text", "surface-2"], // bottom bar, drawer and search highlights
  ["text-muted", "bg"],
  ["text-muted", "surface"], // legend, chips, counter, captions' notes
  ["text-muted", "surface-2"],
  ["bg", "text"], // the big Next button is inverted
  ["node-text-dim", "node-fill"],
  ["node-text-dim", "surface"], // dimmed edge pills
  ["node-text-on", "node-fill-on"],
];

const TEXT_TOKENS = ["text", "text-muted", "node-text-dim", "node-text-on"];

describe.each(["dark", "light"] as const)("%s theme", (scheme) => {
  it.each(TEXT_PAIRS)("--%s on --%s is at least 4.5:1", (fg, bg) => {
    expect(
      contrast(resolve(fg, scheme), resolve(bg, scheme)),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("the focus ring stands out at least 3:1 and isn't ember", () => {
    const focus = resolve("focus", scheme);
    expect(focus).not.toBe(resolve("ember", scheme));
    expect(contrast(focus, resolve("bg", scheme))).toBeGreaterThanOrEqual(3);
    expect(contrast(focus, resolve("surface", scheme))).toBeGreaterThanOrEqual(
      3,
    );
  });

  it("lit lines, packets and the current step stand out at least 3:1", () => {
    const stage = resolve("surface", scheme);
    expect(contrast(resolve("edge-on", scheme), stage)).toBeGreaterThanOrEqual(
      3,
    );
    // An ember shape counts if its fill or its ring reaches 3:1.
    for (const t of ["packet", "step-on"]) {
      const best = Math.max(
        contrast(resolve(t, scheme), stage),
        contrast(resolve("on-ring", scheme), stage),
      );
      expect(best).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("Momentum brand", () => {
  it("uses the brand colours", () => {
    expect(resolve("ink", "dark")).toBe("#070a12");
    expect(resolve("porcelain", "dark")).toBe("#f4f1ea");
    expect(resolve("ember", "dark")).toBe("#ff5a1f");
    expect(resolve("bg", "dark")).toBe("#070a12");
    expect(resolve("bg", "light")).toBe("#f4f1ea");
  });

  it("is dark by default, light when the device asks or the toggle says", () => {
    expect(tokenBlock).toMatch(/color-scheme: dark;/);
    expect(css).toMatch(
      /@media \(prefers-color-scheme: light\) \{\s*:root:not\(\[data-theme="dark"\]\) \{\s*color-scheme: light;/,
    );
    expect(css).toMatch(
      /:root\[data-theme="light"\] \{\s*color-scheme: light;/,
    );
  });

  it("never uses ember for text in light mode", () => {
    for (const t of TEXT_TOKENS)
      expect(resolve(t, "light")).not.toBe(resolve("ember", "light"));
    // Ember on porcelain would only be about 2.8:1.
    expect(
      contrast(resolve("ember", "light"), resolve("porcelain", "light")),
    ).toBeLessThan(4.5);
  });

  it("gives the current step a heavier ink outline in light mode", () => {
    expect(resolve("node-stroke-on", "light")).toBe(resolve("ink", "light"));
    expect(css).toMatch(
      /\.node\[data-on="true"\] \.node-face \{[^}]*stroke-width: 3;/,
    );
  });

  it("uses ember only for the current step", () => {
    const emberTokens = Object.entries(raw)
      .filter(([k, v]) => k !== "ember" && v.includes("var(--ember)"))
      .map(([k]) => k)
      .sort();
    expect(emberTokens).toEqual([
      "edge-on",
      "node-fill-on",
      "node-stroke-on",
      "packet",
      "step-on",
    ]);
    // Outside the token block, ember is never used directly.
    expect(css.slice(css.indexOf("/* Base"))).not.toMatch(/--ember|#ff5a1f/i);
  });

  it("dims by colour, never opacity", () => {
    expect(css).not.toMatch(/opacity\s*:/);
  });
});
