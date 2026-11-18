import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { THEME_KEY, THEME_SCRIPT } from "@/lib/theme";

// Reads the colour tokens straight from tokens.css, so this checks the
// palette that actually ships, in both themes.
const css = readFileSync(
  join(__dirname, "../../app/styles/tokens.css"),
  "utf8",
);
const raw: Record<string, string> = Object.fromEntries(
  [...css.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [
    m[1]!,
    m[2]!.trim(),
  ]),
);

type Scheme = "light" | "dark";

/** Splits light-dark(a, b) at its top-level comma. */
function lightDark(value: string): [string, string] | null {
  const inner = value.match(/^light-dark\((.+)\)$/s)?.[1];
  if (!inner) return null;
  let depth = 0;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === "," && depth === 0)
      return [inner.slice(0, i).trim(), inner.slice(i + 1).trim()];
  }
  return null;
}

/** Resolves var() and picks the right side of light-dark(). */
function resolve(name: string, scheme: Scheme): string {
  let value = raw[name];
  for (let i = 0; value && i < 10; i++) {
    const pair = lightDark(value);
    if (pair) value = scheme === "light" ? pair[0] : pair[1];
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

const GROUNDS = ["surface", "raised", "raised-2", "sunken"];
const TEXT = ["text", "muted", "faint"];
const CONTENT = ["cyan", "violet", "amber", "green", "red", "blue"];

describe.each(["dark", "light"] as const)("%s theme", (scheme) => {
  const pairs = [...TEXT, ...CONTENT].flatMap((fg) =>
    GROUNDS.map((bg) => [fg, bg] as const),
  );

  it.each(pairs)("--%s on --%s is at least 4.5:1", (fg, bg) => {
    expect(
      contrast(resolve(fg, scheme), resolve(bg, scheme)),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("primary buttons and on chips (surface on text) reach 4.5:1", () => {
    expect(
      contrast(resolve("surface", scheme), resolve("text", scheme)),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

describe("brand", () => {
  it("uses the brand colours as grounds", () => {
    expect(resolve("ink", "dark")).toBe("#070a12");
    expect(resolve("porcelain", "dark")).toBe("#f4f1ea");
    expect(resolve("ember", "dark")).toBe("#ff5a1f");
    expect(resolve("surface", "dark")).toBe("#070a12");
    expect(resolve("surface", "light")).toBe("#f4f1ea");
  });

  it("keeps the design's dark palette unchanged", () => {
    expect(
      Object.fromEntries(
        [...TEXT, ...CONTENT, ...GROUNDS].map((t) => [t, resolve(t, "dark")]),
      ),
    ).toEqual({
      text: "#f4f1ea",
      muted: "#a3adbf",
      faint: "#7c879b",
      cyan: "#38bdf8",
      violet: "#a78bfa",
      amber: "#fbbf24",
      green: "#34d399",
      red: "#fb7185",
      blue: "#60a5fa",
      surface: "#070a12",
      raised: "#0b1226",
      "raised-2": "#111a33",
      sunken: "#05070d",
    });
  });

  it("never uses ember for text in light mode", () => {
    // Ember on porcelain is about 2.8:1.
    expect(
      contrast(resolve("ember", "light"), resolve("porcelain", "light")),
    ).toBeLessThan(4.5);
    for (const t of [...TEXT, ...CONTENT])
      expect(resolve(t, "light")).not.toBe(resolve("ember", "light"));
  });
});

describe("theme switch", () => {
  it("is dark unless light is chosen; the device is not consulted", () => {
    expect(css).toMatch(/:root \{[\s\S]*color-scheme: dark;/);
    expect(css).toMatch(
      /:root\[data-theme="light"\] \{\s*color-scheme: light;/,
    );
    expect(css).not.toMatch(/prefers-color-scheme/);
  });

  it("applies the stored choice before paint", () => {
    expect(THEME_SCRIPT).toContain(JSON.stringify(THEME_KEY));
    expect(THEME_SCRIPT).toContain("dataset.theme=t");
  });
});
