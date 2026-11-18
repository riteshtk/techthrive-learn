// Claude API prices, USD per million tokens, as read from Anthropic's
// pricing page on READ_ON. Each price is also a facts-register record
// (content/facts/ai-agents.ts); tests/unit/claude-prices.test.ts keeps the
// two the same. Pages say "Claude prices, read {date}" (PRD decision 14).

import type { ModelPrices } from "./costModel";

export const CLAUDE_PRICES_READ_ON = "2026-11-18";

export const SONNET_5_5: ModelPrices = {
  input: 2,
  output: 10,
  cacheHit: 0.1,
  cacheWrite5m: 2.5,
};

export const HAIKU_5_5: ModelPrices = {
  input: 0.1,
  output: 0.5,
  cacheHit: 0.01,
  cacheWrite5m: 0.125,
};
