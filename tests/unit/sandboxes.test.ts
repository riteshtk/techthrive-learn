import { describe, expect, it } from "vitest";
import { usd } from "@/lib/costModel";
import { costReport, DEFAULT_INPUTS } from "@/lib/costScenario";
import { defaultsOf, SANDBOXES } from "@/player/sandboxes";

const run = (
  kind: keyof typeof SANDBOXES,
  over: Record<string, number | boolean> = {},
) => {
  const m = SANDBOXES[kind];
  const out = m.compute({ ...defaultsOf(m), ...over });
  return {
    tiles: out.tiles.map((t) => t.value),
    result: out.result.value,
    tones: [...out.tiles.map((t) => t.tone), out.result.tone],
  };
};

describe("the agent-cost sandbox, with the design's own numbers", () => {
  it("at its defaults: $0.063 a conversation, $1,265 a day, $37,944 a month", () => {
    const r = run("agent-cost");
    expect(r.tiles.slice(0, 2)).toEqual(["$0.063", "$1,265"]);
    expect(r.result).toBe("$37,944");
  });

  it("routing 70% of turns to Haiku 5.5: $0.021, $426, $12,779", () => {
    const r = run("agent-cost", { route: 70 });
    expect([...r.tiles.slice(0, 2), r.result]).toEqual([
      "$0.021",
      "$426",
      "$12,779",
    ]);
  });

  it("a 0% hit rate with caching on pays the cache write: $0.141", () => {
    const r = run("agent-cost", { hit: 0 });
    expect([...r.tiles.slice(0, 2), r.result]).toEqual([
      "$0.141",
      "$2,820",
      "$84,600",
    ]);
  });

  it("with caching off the prefix is plain input: $0.123, as step 10 says", () => {
    const r = run("agent-cost", { cache: false });
    expect(r.tiles[0]).toBe("$0.123");
    expect(r.tiles[2]).toBe("off");
  });

  it("at its far end: $0.009, $870, $26,092", () => {
    const r = run("agent-cost", { conv: 100, hit: 95, route: 90 });
    expect([...r.tiles.slice(0, 2), r.result]).toEqual([
      "$0.009",
      "$870",
      "$26,092",
    ]);
  });

  it("colours the hit rate green from 80%", () => {
    expect(run("agent-cost", { hit: 80 }).tones[2]).toBe("green");
    expect(run("agent-cost", { hit: 75 }).tones[2]).toBe("amber");
  });
});

describe("the payments sandbox, with the design's own numbers", () => {
  it("at its defaults: 15,000 timeouts and 6,000 duplicates a day", () => {
    const r = run("payments");
    expect(r.tiles).toEqual(["15,000", "6,000", "₹2,93,94,000", "off"]);
    expect(r.result).toBe("1,80,000");
    expect(r.tones.slice(1, 3)).toEqual(["red", "red"]);
  });

  it("an Idempotency-Key on retries removes every duplicate", () => {
    const r = run("payments", { keyed: true });
    expect(r.tiles).toEqual(["15,000", "0", "₹0", "on"]);
    expect(r.result).toBe("0");
    expect(r.tones.slice(1, 3)).toEqual(["green", "green"]);
  });

  it("at its far end", () => {
    const r = run("payments", { payments: 5000, timeouts: 30, went: 100 });
    expect(r.tiles.slice(0, 3)).toEqual([
      "1,50,000",
      "1,50,000",
      "₹73,48,50,000",
    ]);
    expect(r.result).toBe("45,00,000");
  });

  it("labels its inputs as the design does", () => {
    const [payments, timeouts] = SANDBOXES.payments.inputs;
    expect(payments?.kind === "range" && payments.format(3000)).toBe(
      "30,00,000",
    );
    expect(timeouts?.kind === "range" && timeouts.format(5)).toBe("0.5%");
  });
});

describe("the cost formula", () => {
  it("prices one Sonnet 5.5 turn at the defaults at $0.01054", () => {
    expect(costReport(DEFAULT_INPUTS).perTurn).toBeCloseTo(0.01054, 10);
  });

  it("routes a share of turns to the cheaper model", () => {
    expect(costReport({ ...DEFAULT_INPUTS, route: 100 }).perTurn).toBeCloseTo(
      costReport({ ...DEFAULT_INPUTS, model: "haiku" }).perTurn,
      12,
    );
  });

  it("the sandbox shows the cost model tool's numbers", () => {
    const tool = costReport({ ...DEFAULT_INPUTS, hit: 60, route: 30 });
    const out = SANDBOXES["agent-cost"].compute({
      ...defaultsOf(SANDBOXES["agent-cost"]),
      hit: 60,
      route: 30,
    });
    expect(out.tiles[0].value).toBe(usd(tool.perConversation, 3));
    expect(out.result.value).toBe(usd(tool.perMonth, 0));
  });

  it("formats dollars", () => {
    expect(usd(37944.4, 0)).toBe("$37,944");
    expect(usd(0.06324, 3)).toBe("$0.063");
  });
});
