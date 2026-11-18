import { describe, expect, it } from "vitest";
import { getLessons } from "@/content";
import { narrationIssues } from "@/content/narration";
import type { Lesson } from "@/content/types";

// Narration is required only for Tech & Thrive's own lessons, recorded in
// the creator's voice. A community lesson can't be, so it ships with its
// transcript and never fails the content check.

const base = getLessons().find((l) => l.id === "rag")!;
const lesson = (author: Lesson["author"], id: string): Lesson => ({
  ...base,
  author,
  topic: "foundations",
  id,
});
const none = () => false;

describe("narration rule", () => {
  it("fails a Tech & Thrive lesson with missing recordings in CI", () => {
    const issues = narrationIssues(
      [lesson("tech-and-thrive", "ours")],
      none,
      true,
    );
    expect(issues).toEqual([
      {
        file: "content/topics/foundations/lessons/ours.ts",
        field: "steps",
        message:
          "narration audio missing for step 1, 2, 3, 4, 5, 6, 7 (public/audio/foundations/ours/NN.mp3)",
        level: "error",
      },
    ]);
  });

  it("only warns while recording is under way", () => {
    const [issue] = narrationIssues(
      [lesson("tech-and-thrive", "ours")],
      none,
      false,
    );
    expect(issue!.level).toBe("warning");
  });

  it("names just the steps still to record", () => {
    const has = (p: string) => !p.endsWith("/03.mp3");
    const [issue] = narrationIssues(
      [lesson("tech-and-thrive", "ours")],
      has,
      true,
    );
    expect(issue!.message).toMatch(/for step 3 \(/);
  });

  it("never flags a community lesson, which ships with its transcript", () => {
    expect(
      narrationIssues([lesson("community", "theirs")], none, true),
    ).toEqual([]);
  });

  it("passes every Tech & Thrive lesson in the repo as recorded", async () => {
    const { existsSync } = await import("node:fs");
    const ours = getLessons().filter((l) => l.author === "tech-and-thrive");
    expect(ours.length).toBeGreaterThan(0);
    expect(
      narrationIssues(ours, (p) => existsSync(`public/${p}`), true),
    ).toEqual([]);
  });
});
