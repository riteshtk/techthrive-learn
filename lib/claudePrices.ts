// Claude API prices, USD per million tokens, as read from Anthropic's
// pricing page on READ_ON. Each price is also a facts-register record
// (content/facts/ai-agents.ts); tests/unit/register-ties.test.ts keeps the
// two the same. Pages say "Claude prices, read {date}" (PRD decision 14).

import type { ModelPrices } from "./costModel";

export const CLAUDE_PRICES_READ_ON = "2026-11-18";

export const SONNET_5_5: ModelPrices = {
  input: 2,
  output: 10,
  cacheHit: 0.1,
  cacheWrite5m: 2.5,
  cacheWrite1h: 4,
};

export const HAIKU_5_5: ModelPrices = {
  input: 0.1,
  output: 0.5,
  cacheHit: 0.01,
  cacheWrite5m: 0.125,
  cacheWrite1h: 0.2,
};

/** Haiku 5.5 for prompts over LONG_PROMPT_TOKENS, cache reads and writes
    included in the count. */
export const HAIKU_5_5_LONG: ModelPrices = {
  input: 0.5,
  output: 2.5,
  cacheHit: 0.05,
  cacheWrite5m: 0.625,
  cacheWrite1h: 1,
};

export const OPUS_5_5: ModelPrices = {
  input: 4,
  output: 20,
  cacheHit: 0.2,
  cacheWrite5m: 5,
  cacheWrite1h: 8,
};

export const FABLE_5_2: ModelPrices = {
  input: 8,
  output: 40,
  cacheHit: 0.2,
  cacheWrite5m: 10,
  cacheWrite1h: 16,
};

export const LONG_PROMPT_TOKENS = 100_000;
/** The Batch API's discount, which stacks with caching and US-only. */
export const BATCH_DISCOUNT = 0.5;
/** US-only inference, on every token category. */
export const US_ONLY_MULTIPLIER = 1.1;
/** Prefixes shorter than this aren't cached. */
export const MIN_CACHE_PREFIX = 512;
/** The tool use system prompt, part of every cached prefix with tools. */
export const TOOL_USE_OVERHEAD = 286;

export type ModelKey = "haiku" | "sonnet" | "opus" | "fable";

export const MODELS: Record<
  ModelKey,
  { name: string; prices: ModelPrices; long?: ModelPrices }
> = {
  haiku: { name: "Haiku 5.5", prices: HAIKU_5_5, long: HAIKU_5_5_LONG },
  sonnet: { name: "Sonnet 5.5", prices: SONNET_5_5 },
  opus: { name: "Opus 5.5", prices: OPUS_5_5 },
  fable: { name: "Fable 5.2", prices: FABLE_5_2 },
};

export const MODEL_KEYS = Object.keys(MODELS) as ModelKey[];

/** The register records behind every number above: the cost model's
    sources (its "Used on" entries on the Sources page). */
export const PRICE_FACTS = [
  "sonnet-5-5-input-output-price",
  "sonnet-5-5-cache-hit-price",
  "sonnet-5-5-cache-write-5m-price",
  "sonnet-5-5-cache-write-1h-price",
  "haiku-5-5-input-output-price",
  "haiku-5-5-cache-hit-price",
  "haiku-5-5-cache-write-5m-price",
  "haiku-5-5-cache-write-1h-price",
  "haiku-5-5-long-context-tier",
  "haiku-5-5-long-context-cache-prices",
  "opus-5-5-input-output-price",
  "opus-5-5-cache-prices",
  "fable-5-2-input-output-price",
  "fable-5-2-cache-prices",
  "batch-api-discount",
  "discounts-stack",
  "us-only-inference-multiplier",
  "tool-use-overhead-tokens",
  "min-cacheable-prefix",
] as const;
