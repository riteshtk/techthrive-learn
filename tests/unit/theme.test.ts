import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Reads the colour tokens straight from globals.css, so this checks the
// palette that actually ships, in both themes.
const css = readFileSync(join(__dirname, "../../app/globals.css"), "utf8");

function block(source: string): Record<string, string> {
  return Object.fromEntries(
    [...source.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [
      m[1]!,
      m[2]!.trim(),
    ]),
  );
}

const darkSource = css.slice(css.indexOf(":root {"), css.indexOf("@media"));
const lightSource = css.slice(
  css.indexOf("@media (prefers-color-scheme: light)"),
  css.indexOf("*,\n*::before"),
);
const dark = block(darkSource);
const light = { ...dark, ...block(lightSource) };

function resolve(tokens: Record<string, string>, name: string): string {
  let value = tokens[name];
  for (let i = 0; value?.startsWith("var(") && i < 10; i++) {
    value = tokens[value.slice(6, -1)];
  }
  if (!value || !/^#[0-9a-f]{6}$/i.test(value))
    throw new Error(`--${name} does not resolve to a hex colour`);
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
  ["text-muted", "bg"],
  ["text-muted", "surface"],
  ["node-text-dim", "node-fill"],
  ["node-text-dim", "bg"], // dimmed edge labels
  ["node-text-on", "node-fill-on"],
  ["text", "bg"], // lit edge labels
];

const TEXT_TOKENS = ["text", "text-muted", "node-text-dim", "node-text-on"];

describe.each([
  ["dark", dark],
  ["light", light],
] as const)("%s theme", (_name, tokens) => {
  it.each(TEXT_PAIRS)("--%s on --%s is at least 4.5:1", (fg, bg) => {
    expect(
      contrast(resolve(tokens, fg), resolve(tokens, bg)),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("the focus ring stands out at least 3:1 and isn't ember", () => {
    const focus = resolve(tokens, "focus");
    expect(focus).not.toBe(resolve(tokens, "ember"));
    expect(contrast(focus, resolve(tokens, "bg"))).toBeGreaterThanOrEqual(3);
  });
});

describe("brand", () => {
  it("uses the brand colours", () => {
    expect(resolve(dark, "ink")).toBe("#070a12");
    expect(resolve(dark, "porcelain")).toBe("#f4f1ea");
    expect(resolve(dark, "ember")).toBe("#ff5a1f");
    expect(resolve(dark, "bg")).toBe("#070a12");
    expect(resolve(light, "bg")).toBe("#f4f1ea");
  });

  it("never uses ember for text in light mode", () => {
    for (const t of TEXT_TOKENS)
      expect(resolve(light, t)).not.toBe(resolve(light, "ember"));
    // Ember on porcelain would only be about 2.8:1.
    expect(
      contrast(resolve(light, "ember"), resolve(light, "porcelain")),
    ).toBeLessThan(4.5);
  });

  it("gives the current step a heavier ink outline in light mode", () => {
    expect(resolve(light, "node-stroke-on")).toBe(resolve(light, "ink"));
    expect(css).toMatch(
      /\.node\[data-on="true"\] rect \{[^}]*stroke-width: 3;/,
    );
  });

  it("uses ember only for the current step's boxes and arrows", () => {
    const emberTokens = Object.entries(dark)
      .filter(([k, v]) => k !== "ember" && v === "var(--ember)")
      .map(([k]) => k)
      .sort();
    expect(emberTokens).toEqual(["edge-on", "node-stroke-on"]);
    // Outside the token blocks, ember is never used directly.
    const rules = css.slice(css.indexOf("*,\n*::before"));
    expect(rules).not.toMatch(/--ember|#ff5a1f/i);
  });

  it("dims by colour, never opacity", () => {
    expect(css).not.toMatch(/opacity\s*:/);
  });
});
