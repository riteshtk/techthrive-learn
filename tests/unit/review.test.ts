import { describe, expect, it } from "vitest";
import { newCard, rate } from "@/lib/fsrs";
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
