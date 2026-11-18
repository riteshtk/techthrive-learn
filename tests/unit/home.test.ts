import { describe, expect, it } from "vitest";
import {
  dateLine,
  greeting,
  inProgress,
  startedTopics,
  whatChanged,
  type FactChange,
} from "@/lib/home";
import { EMPTY_LEARNING, type Learning } from "@/lib/learning";

// Home (PRD P16): what changed in your topics, what's in progress, and a
// dated header with the right weekday.

const change = (topic: string, id: string, changedOn: string): FactChange => ({
  topic,
  topicTitle: topic,
  id,
  claim: "",
  value: "new",
  previousValue: "old",
  changedOn,
  source: "s",
});

const CHANGES = [
  change("ai-agents", "a", "2026-07-27"),
  change("payments", "p", "2026-10-22"),
  change("ai-agents", "b", "2026-08-03"),
  change("ai-agents", "c", "2026-04-23"),
  change("ai-agents", "d", "2026-07-28"),
];

const lesson = (step: number, updatedAt: string, doneAt?: string) => ({
  step,
  maxStep: step,
  startedAt: "2026-11-01T00:00:00.000Z",
  updatedAt,
  ...(doneAt ? { doneAt } : {}),
});

describe("what changed", () => {
  it("shows a new visitor every topic's changes, newest first, four at most", () => {
    expect(whatChanged(CHANGES, new Set()).map((c) => c.id)).toEqual([
      "p",
      "b",
      "d",
      "a",
    ]);
  });

  it("shows only topics this browser has started", () => {
    const learning: Learning = {
      ...EMPTY_LEARNING,
      lessons: {
        "payments/move-money-exactly-once": lesson(
          3,
          "2026-11-18T08:00:00.000Z",
        ),
      },
    };
    expect(
      whatChanged(CHANGES, startedTopics(learning)).map((c) => c.id),
    ).toEqual(["p"]);
  });
});

describe("continue learning", () => {
  it("lists unfinished lessons, most recent first", () => {
    const lessons = ["a/x", "b/y", "c/z"].map((key) => ({
      key,
      topicTitle: key,
      n: 1,
      title: key,
      href: "/",
      steps: ["s1", "s2", "s3"],
    }));
    const learning: Learning = {
      ...EMPTY_LEARNING,
      lessons: {
        "a/x": lesson(2, "2026-11-17T08:00:00.000Z"),
        "b/y": lesson(
          3,
          "2026-11-18T08:00:00.000Z",
          "2026-11-18T08:00:00.000Z",
        ),
        "c/z": lesson(1, "2026-11-18T09:00:00.000Z"),
      },
    };
    expect(
      inProgress(lessons, learning).map((r) => [r.lesson.key, r.step]),
    ).toEqual([
      ["c/z", 1],
      ["a/x", 2],
    ]);
  });
});

describe("the header", () => {
  it("names the right weekday", () => {
    expect(dateLine(new Date(2026, 10, 18, 9))).toBe(
      "Wednesday · 18 November 2026",
    );
    expect(dateLine(new Date(2026, 10, 20, 9))).toBe(
      "Friday · 20 November 2026",
    );
    expect(dateLine(new Date(2026, 10, 22, 9))).toBe(
      "Sunday · 22 November 2026",
    );
  });

  it("greets by local time", () => {
    expect(greeting(new Date(2026, 10, 18, 9))).toBe("Good morning");
    expect(greeting(new Date(2026, 10, 18, 14))).toBe("Good afternoon");
    expect(greeting(new Date(2026, 10, 18, 20))).toBe("Good evening");
  });
});
