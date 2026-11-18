import { describe, expect, it } from "vitest";
import { figureKey, figureKeys, figuresIn } from "@/content/figures";

describe("figuresIn", () => {
  it("finds money, percentages, decimals, units and years", () => {
    expect(
      figuresIn(
        "May this customer credit ₹4,800? $0.063 a conversation, 90% hits, 20k a day, 1.25× write, 2 Dec 2027.",
      ),
    ).toEqual(["₹4,800", "$0.063", "90%", "20k", "1.25×", "2027"]);
  });

  it("treats versions as figures", () => {
    expect(figuresIn("Agent2Agent v1.0, spec 2026-07-28")).toEqual([
      "v1.0",
      "2026-07-28",
    ]);
  });

  it("skips small bare counts", () => {
    expect(figuresIn("Lesson 2 of 10, about 6 turns, 3 questions")).toEqual([]);
    expect(figuresIn("13 components")).toEqual(["13"]);
  });

  it("skips numbers inside names", () => {
    expect(
      figuresIn("ASI01 and LLM03, OAuth2, 2D or 3D, pass^4, gen_ai.* spans"),
    ).toEqual([]);
  });

  it("keeps a unit only when it stands alone", () => {
    expect(figuresIn("1.7 s a hop, 850ms, 3 days, 24h")).toEqual([
      "1.7",
      "850ms",
      "24h",
    ]);
  });
});

describe("figureKey", () => {
  it("compares values, not spellings", () => {
    expect(figureKey("20k")).toBe(figureKey("20,000"));
    expect(figureKey("2.5bn")).toBe(figureKey("2,500,000,000"));
    expect(figureKey("1.25x")).toBe(figureKey("1.25×"));
    expect(figureKey("₹5,000")).not.toBe(figureKey("5,000"));
    expect(figureKey("90%")).not.toBe(figureKey("90"));
  });

  it("collects the keys in a fact value", () => {
    expect(figureKeys("20,000 conversations a day, about 6 turns")).toEqual(
      new Set(["20000"]),
    );
  });
});
