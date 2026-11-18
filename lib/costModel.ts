// What an LLM conversation costs (spec 04 §5.1, spec 05 §1.4). One formula
// for the lesson sandbox and the cost model tool. Prices are USD per
// million tokens, from the facts register (Claude prices, read on a date).

export type ModelPrices = {
  input: number;
  output: number;
  /** A prompt-cache read. */
  cacheHit: number;
  /** Writing the prefix to a 5-minute cache. */
  cacheWrite5m: number;
  /** Writing the prefix to a 1-hour cache. */
  cacheWrite1h: number;
};

export type TurnShape = {
  /** The cached prefix: system prompt, tool schemas. */
  prefixTokens: number;
  freshInputTokens: number;
  outputTokens: number;
};

/**
 * One turn's cost in USD.
 * - Caching on: a hit reads the prefix at the cache price; a miss writes
 *   it at the cache-write price.
 * - Caching off: the prefix is plain input on every turn (the step 10
 *   "without caching" case).
 */
export function turnCost(
  prices: ModelPrices,
  shape: TurnShape,
  cache: { on: boolean; hitRate: number },
): number {
  const prefix = cache.on
    ? shape.prefixTokens *
      (cache.hitRate * prices.cacheHit +
        (1 - cache.hitRate) * prices.cacheWrite5m)
    : shape.prefixTokens * prices.input;
  return (
    (prefix +
      shape.freshInputTokens * prices.input +
      shape.outputTokens * prices.output) /
    1e6
  );
}

/** A conversation's cost when a share of turns goes to a cheaper model. */
export function conversationCost(args: {
  main: ModelPrices;
  routed: ModelPrices;
  routedShare: number;
  turns: number;
  shape: TurnShape;
  cache: { on: boolean; hitRate: number };
}): number {
  const { main, routed, routedShare, turns, shape, cache } = args;
  const perTurn =
    routedShare * turnCost(routed, shape, cache) +
    (1 - routedShare) * turnCost(main, shape, cache);
  return perTurn * turns;
}

/** "$0.063", "$37,944". */
export function usd(value: number, digits: number): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

/** "$0.063", "$37,944", "$0.00055": more decimals for smaller sums
    (spec 05 §1.4); exactly zero is "$0". */
export function money(value: number): string {
  if (value === 0) return "$0";
  const abs = Math.abs(value);
  const digits = abs < 0.01 ? 5 : abs < 1 ? 3 : abs < 100 ? 2 : 0;
  return `${value < 0 ? "−" : ""}${usd(abs, digits)}`;
}

/** A rate: "$0.10", "$2.50", "$0.125", "$4.00". */
export function rate(value: number): string {
  const digits = Math.max(2, (String(value).split(".")[1] ?? "").length);
  return usd(value, digits);
}

/** Tokens a minute: "708k", "2.1M", "88k". */
export function tokensShort(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}M`;
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return String(Math.round(v));
}
