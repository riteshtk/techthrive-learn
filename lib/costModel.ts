// Claude prices and how money reads (spec 04 §5.1, spec 05 §1.4). The one
// cost formula, shared by the cost model tool and the lesson sandbox, is
// costReport in costScenario.ts. Prices are USD per million tokens, from
// the facts register (Claude prices, read on a date).

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
