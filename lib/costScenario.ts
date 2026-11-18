// The cost model tool (spec 05 §1.4, PRD P9): a workload for the
// card-dispute agent priced on Claude's published rates. The design's
// formula, with its defects fixed (PR list):
// C1 the Haiku long-prompt tier is reachable (larger sliders);
// C2 caching that costs more than no caching says so;
// C3 routing to Haiku does nothing when Haiku is the main model;
// C5 "vs main" is always a multiple; C6 one rate format, both tiers and
// the 1-hour write shown; C7 a year is 365 days; C8 a prefix under the
// minimum isn't cached; C9 Batch and US-only stack with caching
// (verified); plus a caching-off case (the lesson's step 10).

import {
  BATCH_DISCOUNT,
  LONG_PROMPT_TOKENS,
  MIN_CACHE_PREFIX,
  MODEL_KEYS,
  MODELS,
  US_ONLY_MULTIPLIER,
  type ModelKey,
} from "./claudePrices";
import type { ModelPrices } from "./costModel";

export type CostInputs = {
  model: ModelKey;
  /** Percent of turns routed to Haiku 5.5. */
  route: number;
  conversations: number;
  turns: number;
  prefix: number;
  fresh: number;
  output: number;
  caching: boolean;
  /** Prompt-cache hit rate, percent. */
  hit: number;
  ttl: 5 | 60;
  /** Percent of work sent through the Batch API. */
  batch: number;
  usOnly: boolean;
};

/** The card-dispute brief: 20,000 conversations a day, 6 turns each. */
export const DEFAULT_INPUTS: CostInputs = {
  model: "sonnet",
  route: 0,
  conversations: 20_000,
  turns: 6,
  prefix: 6_000,
  fresh: 2_500,
  output: 350,
  caching: true,
  hit: 90,
  ttl: 5,
  batch: 0,
  usOnly: false,
};

/** A turn's token-dollars (USD × 1e6) by where they go. */
type Parts = { read: number; write: number; input: number; output: number };

const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;
/** Planning assumption: peak traffic is 3× the daily average. */
export const PEAK_FACTOR = 3;

export function promptTokens(i: CostInputs): number {
  return i.prefix + i.fresh;
}

/** The rates a request pays: Haiku's long tier counts the whole prompt,
    cache reads and writes included. */
export function pricesFor(key: ModelKey, i: CostInputs): ModelPrices {
  const m = MODELS[key];
  return m.long && promptTokens(i) > LONG_PROMPT_TOKENS ? m.long : m.prices;
}

/** Whether the prefix is cached at all: caching on, and long enough. */
export function cacheable(i: CostInputs): boolean {
  return i.caching && i.prefix >= MIN_CACHE_PREFIX;
}

function parts(key: ModelKey, i: CostInputs, cached: boolean): Parts {
  const p = pricesFor(key, i);
  const h = i.hit / 100;
  const write = i.ttl === 5 ? p.cacheWrite5m : p.cacheWrite1h;
  return cached
    ? {
        read: i.prefix * h * p.cacheHit,
        // Every miss rewrites the whole prefix.
        write: i.prefix * (1 - h) * write,
        input: i.fresh * p.input,
        output: i.output * p.output,
      }
    : {
        read: 0,
        write: 0,
        input: (i.prefix + i.fresh) * p.input,
        output: i.output * p.output,
      };
}

const total = (p: Parts) => p.read + p.write + p.input + p.output;

function multiplier(i: CostInputs): number {
  const geo = i.usOnly ? US_ONLY_MULTIPLIER : 1;
  return geo * (1 - BATCH_DISCOUNT * (i.batch / 100));
}

/** The routed share: none when Haiku is already the main model (C3). */
export function routedShare(i: CostInputs): number {
  return i.model === "haiku" ? 0 : i.route / 100;
}

function mixed(i: CostInputs, cached: boolean): Parts {
  const r = routedShare(i);
  const a = parts("haiku", i, cached);
  const b = parts(i.model, i, cached);
  return {
    read: r * a.read + (1 - r) * b.read,
    write: r * a.write + (1 - r) * b.write,
    input: r * a.input + (1 - r) * b.input,
    output: r * a.output + (1 - r) * b.output,
  };
}

export type CostReport = {
  perTurn: number;
  perConversation: number;
  perDay: number;
  perMonth: number;
  perYear: number;
  /** A month with the prefix billed as plain input. */
  uncachedMonth: number;
  /** uncachedMonth − perMonth: negative when caching costs more (C2). */
  cachingSaves: number;
  breakdown: { label: string; usd: number; share: number }[];
  compare: {
    key: ModelKey;
    name: string;
    prices: ModelPrices;
    perConversation: number;
    perMonth: number;
    /** perMonth ÷ the main model's, unrouted. */
    ratio: number;
  }[];
  capacity: { itpm: number; itpmPeak: number; otpmPeak: number };
  longTier: boolean;
  /** Caching is on but the prefix is too short to cache (C8). */
  prefixTooShort: boolean;
};

export function costReport(i: CostInputs): CostReport {
  const mult = multiplier(i);
  const usd = (tokenDollars: number) => (tokenDollars / 1e6) * mult;
  const cached = cacheable(i);
  const turn = mixed(i, cached);
  const perTurn = usd(total(turn));
  const perConversation = perTurn * i.turns;
  const perDay = perConversation * i.conversations;
  const perMonth = perDay * DAYS_PER_MONTH;
  const uncachedMonth =
    usd(total(mixed(i, false))) * i.turns * i.conversations * DAYS_PER_MONTH;

  const all = total(turn);
  const breakdown = (
    [
      ["Cache reads", turn.read],
      ["Cache writes (misses)", turn.write],
      ["Uncached input", turn.input],
      ["Output", turn.output],
    ] as const
  ).map(([label, x]) => ({
    label,
    usd: usd(x),
    share: all > 0 ? x / all : 0,
  }));

  const monthOn = (key: ModelKey) =>
    usd(total(parts(key, i, cached))) * i.turns * i.conversations * 30;
  const base = monthOn(i.model);
  const compare = MODEL_KEYS.map((key) => ({
    key,
    name: MODELS[key].name,
    prices: pricesFor(key, i),
    perConversation: usd(total(parts(key, i, cached))) * i.turns,
    perMonth: monthOn(key),
    ratio: base > 0 ? monthOn(key) / base : 0,
  }));

  const turnsPerMinute = (i.conversations * i.turns) / 1440;
  const prompt = promptTokens(i);
  return {
    perTurn,
    perConversation,
    perDay,
    perMonth,
    perYear: perDay * DAYS_PER_YEAR,
    uncachedMonth,
    cachingSaves: uncachedMonth - perMonth,
    breakdown,
    compare,
    capacity: {
      itpm: turnsPerMinute * prompt,
      itpmPeak: turnsPerMinute * prompt * PEAK_FACTOR,
      otpmPeak: turnsPerMinute * i.output * PEAK_FACTOR,
    },
    longTier:
      (i.model === "haiku" || routedShare(i) > 0) &&
      prompt > LONG_PROMPT_TOKENS,
    prefixTooShort: i.caching && i.prefix < MIN_CACHE_PREFIX,
  };
}

/** "0.05×", "2.0×", "1×" (C5: one unit for every row). */
export function ratioLabel(r: number): string {
  if (Math.abs(r - 1) < 0.005) return "1×";
  return `${r < 1 ? r.toFixed(2) : r.toFixed(1)}×`;
}

// Deep links: the inputs in the query, so other pages can link to "this"
// scenario (spec 05 §0.2). Read after mount; unknown or out-of-range
// values fall back to the defaults.

const KEYS = {
  model: "m",
  route: "route",
  conversations: "conv",
  turns: "turns",
  prefix: "prefix",
  fresh: "fresh",
  output: "out",
  caching: "cache",
  hit: "hit",
  ttl: "ttl",
  batch: "batch",
  usOnly: "us",
} as const satisfies Record<keyof CostInputs, string>;

export type Ranges = Record<
  | "route"
  | "conversations"
  | "turns"
  | "prefix"
  | "fresh"
  | "output"
  | "hit"
  | "batch",
  { min: number; max: number; step: number }
>;

/** Slider ranges. Prefix and fresh input reach past Haiku's 100,000-token
    tier (C1); the prefix starts under the 512-token cache minimum (C8). */
export const RANGES: Ranges = {
  route: { min: 0, max: 90, step: 10 },
  conversations: { min: 1_000, max: 200_000, step: 1_000 },
  turns: { min: 1, max: 20, step: 1 },
  prefix: { min: 500, max: 60_000, step: 500 },
  fresh: { min: 200, max: 150_000, step: 100 },
  output: { min: 50, max: 4_000, step: 50 },
  hit: { min: 0, max: 98, step: 1 },
  batch: { min: 0, max: 100, step: 5 },
};

export function inputsToQuery(i: CostInputs): string {
  const q = new URLSearchParams();
  for (const [field, key] of Object.entries(KEYS) as [
    keyof CostInputs,
    string,
  ][]) {
    const v = i[field];
    if (v === DEFAULT_INPUTS[field]) continue;
    q.set(key, typeof v === "boolean" ? (v ? "1" : "0") : String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function inputsFromQuery(search: string): CostInputs {
  const q = new URLSearchParams(search);
  const out: CostInputs = { ...DEFAULT_INPUTS };
  const model = q.get(KEYS.model);
  if (model && (MODEL_KEYS as string[]).includes(model))
    out.model = model as ModelKey;
  for (const field of Object.keys(RANGES) as (keyof Ranges)[]) {
    const raw = q.get(KEYS[field]);
    if (raw === null) continue;
    const n = Number(raw);
    const r = RANGES[field];
    if (
      Number.isFinite(n) &&
      n >= r.min &&
      n <= r.max &&
      (n - r.min) % r.step === 0
    )
      out[field] = n;
  }
  const ttl = q.get(KEYS.ttl);
  if (ttl === "5" || ttl === "60") out.ttl = Number(ttl) as 5 | 60;
  for (const field of ["caching", "usOnly"] as const) {
    const raw = q.get(KEYS[field]);
    if (raw === "1" || raw === "0") out[field] = raw === "1";
  }
  return out;
}
