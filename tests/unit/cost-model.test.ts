import { describe, expect, it } from "vitest";
import { MIN_CACHE_PREFIX } from "@/lib/claudePrices";
import { money, rate, tokensShort } from "@/lib/costModel";
import {
  costReport,
  DEFAULT_INPUTS as D,
  inputsFromQuery,
  inputsToQuery,
  ratioLabel,
  type CostInputs,
} from "@/lib/costScenario";

// The cost model (PRD P9): spec 05 §1.4's test vectors, with the defects
// in §1.5 fixed. Years are 365 days (C7), so only the per-year column
// differs from the design's.

const report = (over: Partial<CostInputs> = {}) =>
  costReport({ ...D, ...over });

describe("the spec's test vectors", () => {
  it.each([
    [
      "defaults (Sonnet)",
      {},
      "$0.011",
      "$0.063",
      "$1,265",
      "$37,944",
      "$461,652",
      49,
      "$35,856",
    ],
    [
      "Haiku",
      { model: "haiku" },
      "$0.00055",
      "$0.00332",
      "$66.48",
      "$1,994",
      "$24,265",
      46,
      "$1,696",
    ],
    [
      "Opus",
      { model: "opus" },
      "$0.021",
      "$0.126",
      "$2,530",
      "$75,888",
      "$923,304",
      49,
      "$71,712",
    ],
    [
      "Fable",
      { model: "fable" },
      "$0.041",
      "$0.246",
      "$4,930",
      "$147,888",
      "$1,799,304",
      50,
      "$147,312",
    ],
    [
      "70% routed",
      { route: 70 },
      "$0.00355",
      "$0.021",
      "$426",
      "$12,779",
      "$155,481",
      48,
      "$11,944",
    ],
    [
      "1-hour cache",
      { ttl: 60 },
      "$0.011",
      "$0.069",
      "$1,373",
      "$41,184",
      "$501,072",
      44,
      "$32,616",
    ],
    [
      "half batched",
      { batch: 50 },
      "$0.00791",
      "$0.047",
      "$949",
      "$28,458",
      "$346,239",
      49,
      "$26,892",
    ],
    [
      "US-only",
      { usOnly: true },
      "$0.012",
      "$0.070",
      "$1,391",
      "$41,738",
      "$507,817",
      49,
      "$39,442",
    ],
  ] as const)("%s", (_, over, turn, conv, day, month, year, pct, saves) => {
    const r = report(over as Partial<CostInputs>);
    expect(money(r.perTurn)).toBe(turn);
    expect(money(r.perConversation)).toBe(conv);
    expect(money(r.perDay)).toBe(day);
    expect(money(r.perMonth)).toBe(month);
    expect(money(r.perYear)).toBe(year);
    expect(Math.round((r.cachingSaves / r.uncachedMonth) * 100)).toBe(pct);
    expect(money(r.cachingSaves)).toBe(saves);
    expect(
      [r.capacity.itpm, r.capacity.itpmPeak, r.capacity.otpmPeak].map(
        tokensShort,
      ),
    ).toEqual(["708k", "2.1M", "88k"]);
  });

  it("splits a default turn as designed", () => {
    expect(
      report().breakdown.map((b) => [money(b.usd), Math.round(b.share * 100)]),
    ).toEqual([
      ["$0.00054", 5],
      ["$0.00150", 14],
      ["$0.00500", 47],
      ["$0.00350", 33],
    ]);
  });

  it("compares the same workload on each model", () => {
    expect(
      report().compare.map((c) => [
        c.name,
        money(c.perConversation),
        money(c.perMonth),
        ratioLabel(c.ratio),
      ]),
    ).toEqual([
      ["Haiku 5.5", "$0.00332", "$1,994", "0.05×"],
      ["Sonnet 5.5", "$0.063", "$37,944", "1×"],
      ["Opus 5.5", "$0.126", "$75,888", "2.0×"],
      ["Fable 5.2", "$0.246", "$147,888", "3.9×"],
    ]);
  });
});

describe("fixes to the design's formula", () => {
  it("prices caching off as plain input: the lesson's $0.123", () => {
    const r = report({ caching: false });
    expect(money(r.perConversation)).toBe("$0.123");
    expect(r.cachingSaves).toBe(0);
    // With caching on at a 0% hit rate, every turn rewrites the prefix.
    expect(money(report({ hit: 0 }).perConversation)).toBe("$0.141");
  });

  it("C2: says when caching costs more than no caching", () => {
    const r = report({ hit: 0 });
    expect(money(r.perMonth)).toBe("$84,600");
    expect(money(r.uncachedMonth)).toBe("$73,800");
    expect(r.cachingSaves).toBeLessThan(0);
    expect(money(0)).toBe("$0");
  });

  it("C1: reaches Haiku's long-prompt tier, counting the cached prefix", () => {
    expect(report({ model: "haiku" }).longTier).toBe(false);
    const long = report({ model: "haiku", prefix: 60_000, fresh: 50_000 });
    expect(long.longTier).toBe(true);
    expect(long.compare[0]!.prices.input).toBe(0.5);
    // Routing to Haiku can trigger it too.
    expect(report({ route: 30, prefix: 60_000, fresh: 50_000 }).longTier).toBe(
      true,
    );
  });

  it("C3: routing to Haiku does nothing when Haiku is the main model", () => {
    expect(report({ model: "haiku", route: 70 }).perMonth).toBe(
      report({ model: "haiku" }).perMonth,
    );
  });

  it("C8: a prefix under the minimum isn't cached", () => {
    const short = report({ prefix: 500 });
    expect(500).toBeLessThan(MIN_CACHE_PREFIX);
    expect(short.prefixTooShort).toBe(true);
    expect(short.perMonth).toBeCloseTo(short.uncachedMonth, 6);
  });

  it("C6: prints rates with at least two decimals", () => {
    expect([0.1, 2.5, 0.125, 4, 0.01].map(rate)).toEqual([
      "$0.10",
      "$2.50",
      "$0.125",
      "$4.00",
      "$0.01",
    ]);
  });
});

describe("deep links", () => {
  it("round-trips the inputs, leaving defaults out", () => {
    expect(inputsToQuery(D)).toBe("");
    const i: CostInputs = {
      ...D,
      model: "opus",
      route: 30,
      caching: false,
      ttl: 60,
      usOnly: true,
    };
    expect(inputsFromQuery(inputsToQuery(i))).toEqual(i);
  });

  it("ignores unknown and out-of-range values", () => {
    expect(inputsFromQuery("?m=gpt&turns=99&hit=12.5&ttl=7&us=yes")).toEqual(D);
  });
});
