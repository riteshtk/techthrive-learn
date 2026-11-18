import { describe, expect, it } from "vitest";
import { getFacts } from "@/content";
import { figureKey, figureKeys, figuresIn } from "@/content/figures";
import { HAIKU_5_5, SONNET_5_5 } from "@/lib/claudePrices";
import { SANDBOXES } from "@/player/sandboxes";

// Figures that live in code rather than content files must still be in
// the facts register (PRD P3), and prices must match their records.

const keysOf = (topic: string) => {
  const keys = new Set<string>();
  for (const f of getFacts(topic))
    for (const k of figureKeys(f.value)) keys.add(k);
  return keys;
};

const priceText = (n: number) => `$${n}`;

describe("Claude prices", () => {
  const values = getFacts("ai-agents")
    .map((f) => f.value)
    .join(" | ");

  it.each([
    ["Sonnet 5.5", SONNET_5_5],
    ["Haiku 5.5", HAIKU_5_5],
  ] as const)("%s prices are the register's", (_, prices) => {
    for (const price of Object.values(prices)) {
      const keys = figuresIn(values).map(figureKey);
      expect(keys, `${price}`).toContain(figureKey(priceText(price)));
    }
  });
});

describe("sandbox text", () => {
  it.each([
    ["agent-cost", "ai-agents"],
    ["payments", "payments"],
  ] as const)("the %s sandbox's figures are in the register", (kind, topic) => {
    const keys = keysOf(topic);
    const sandbox = SANDBOXES[kind];
    const text = [
      sandbox.title,
      sandbox.footnote,
      ...sandbox.inputs.map((i) => i.label),
    ];
    for (const t of text)
      for (const fig of figuresIn(t))
        expect(keys.has(figureKey(fig)), `"${fig}" in "${t}"`).toBe(true);
  });
});
