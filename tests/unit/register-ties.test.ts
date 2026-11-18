import { describe, expect, it } from "vitest";
import { getFacts } from "@/content";
import { figureKey, figureKeys, figuresIn } from "@/content/figures";
import {
  BATCH_DISCOUNT,
  LONG_PROMPT_TOKENS,
  MIN_CACHE_PREFIX,
  MODELS,
  PRICE_FACTS,
  TOOL_USE_OVERHEAD,
  US_ONLY_MULTIPLIER,
} from "@/lib/claudePrices";
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

  const keys = figuresIn(values).map(figureKey);

  it.each(
    Object.values(MODELS).flatMap((m) => [
      [m.name, m.prices] as const,
      ...(m.long
        ? [[`${m.name} over the long-prompt threshold`, m.long] as const]
        : []),
    ]),
  )("%s prices are the register's", (_, prices) => {
    for (const price of Object.values(prices))
      expect(keys, `${price}`).toContain(figureKey(priceText(price)));
  });

  it("names real register records as its sources", () => {
    const ids = new Set(getFacts("ai-agents").map((f) => f.id));
    for (const id of PRICE_FACTS) expect(ids.has(id), id).toBe(true);
  });

  it("the multipliers and token counts are the register's", () => {
    for (const fig of [
      `${BATCH_DISCOUNT * 100}%`,
      `${US_ONLY_MULTIPLIER}×`,
      `${TOOL_USE_OVERHEAD} tokens`,
      `${MIN_CACHE_PREFIX} tokens`,
      LONG_PROMPT_TOKENS.toLocaleString("en-US"),
    ])
      for (const k of figuresIn(fig).map(figureKey))
        expect(keys, fig).toContain(k);
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
