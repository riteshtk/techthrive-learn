import { describe, expect, it } from "vitest";
import { newCard, rate } from "@/lib/fsrs";
import { parseLearning } from "@/lib/learning";
import { dueCount, parseSchedule } from "@/lib/review";

// The review schedule in the browser (PRD P14).

const NOW = new Date("2026-11-18T09:00:00Z");

describe("the stored schedule", () => {
  it("keeps well-formed card states and drops the rest", () => {
    const good = rate(newCard(NOW), 3, NOW);
    expect(
      parseSchedule({
        "ai-agents/mcp-stateless": good,
        "ai-agents/bad": { ...good, difficulty: 42 },
        "no-slash": good,
        "ai-agents/new": { ...good, phase: "new" },
      }),
    ).toEqual({ "ai-agents/mcp-stateless": good });
    expect(parseSchedule("nonsense")).toEqual({});
    expect(parseSchedule([good])).toEqual({});
  });
});

describe("due cards", () => {
  it("counts unseen and overdue cards, not ones due later", () => {
    const later = rate(newCard(NOW), 4, NOW);
    const soon = rate(newCard(NOW), 1, NOW);
    const ids = ["t/a", "t/b", "t/c"];
    expect(dueCount(ids, { "t/a": later, "t/b": soon }, NOW)).toBe(1);
    expect(
      dueCount(
        ids,
        { "t/a": later, "t/b": soon },
        new Date(NOW.getTime() + 120_000),
      ),
    ).toBe(2);
  });
});

describe("store keys", () => {
  it("progress and the schedule take the same topic/id keys", () => {
    const keys = ["payments/idem-1", "no-slash", "A/b", "a/b/c", "a/ b", "a/"];
    const card = rate(newCard(NOW), 3, NOW);
    const step = {
      step: 1,
      maxStep: 1,
      startedAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    };
    const kept = Object.keys(
      parseSchedule(Object.fromEntries(keys.map((k) => [k, card]))),
    );
    expect(kept).toEqual(["payments/idem-1"]);
    expect(
      Object.keys(
        parseLearning({
          lessons: Object.fromEntries(keys.map((k) => [k, step])),
        }).lessons,
      ),
    ).toEqual(kept);
  });
});
