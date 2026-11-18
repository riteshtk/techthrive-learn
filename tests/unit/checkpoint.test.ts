import { describe, expect, it } from "vitest";
import { getCheckpoint } from "@/content";
import {
  PASS_MARK,
  rightOption,
  scoreCheckpoint,
  verdictOf,
} from "@/lib/checkpoint";
import {
  answerQuestion,
  EMPTY_LEARNING,
  parseLearning,
  type OptionId,
} from "@/lib/learning";

const cp = getCheckpoint("ai-agents", "agent-anatomy")!;
const [q1, q2, q3] = cp.questions;
const KEY = "ai-agents/agent-anatomy";
const T0 = "2026-11-18T10:00:00.000Z";
const T1 = "2026-11-18T10:02:00.000Z";

const answersFor = (verdicts: ("right" | "partial" | "wrong")[]) =>
  Object.fromEntries(
    cp.questions.map((q, i) => [
      q.id,
      q.options.find((o) => o.verdict === verdicts[i])!.id,
    ]),
  ) as Record<string, OptionId>;

describe("checkpoint scoring", () => {
  it("passes at 80%", () => {
    expect(PASS_MARK).toBe(0.8);
  });

  it("scores right 1, partly right ½, wrong 0", () => {
    expect(
      scoreCheckpoint(cp.questions, answersFor(["right", "right", "right"])),
    ).toMatchObject({ points: 3, score: 1, passed: true });
    // One partial: 2.5 / 3 = 83% passes.
    const one = scoreCheckpoint(
      cp.questions,
      answersFor(["right", "partial", "right"]),
    );
    expect(one.points).toBe(2.5);
    expect(one.passed).toBe(true);
    // One wrong: 2 / 3 = 67% doesn't; nor do two partials (67%).
    expect(
      scoreCheckpoint(cp.questions, answersFor(["right", "wrong", "right"]))
        .passed,
    ).toBe(false);
    expect(
      scoreCheckpoint(cp.questions, answersFor(["partial", "partial", "right"]))
        .passed,
    ).toBe(false);
  });

  it("has no result until every question is answered", () => {
    const s = scoreCheckpoint(cp.questions, { [q1!.id]: rightOption(q1!) });
    expect(s).toMatchObject({
      answered: 1,
      total: 3,
      score: null,
      passed: null,
    });
  });

  it("knows each option's verdict and the right one", () => {
    expect(rightOption(q1!)).toBe("B");
    expect(verdictOf(q1!, "A")).toBe("partial");
    expect(verdictOf(q1!, "C")).toBe("wrong");
  });
});

describe("first answers", () => {
  it("keep the first pick; a later pick doesn't change it", () => {
    let s = answerQuestion(EMPTY_LEARNING, KEY, q1!.id, "C", 3, T0);
    s = answerQuestion(s, KEY, q1!.id, "B", 3, T1);
    expect(s.checkpoints[KEY]?.answers[q1!.id]).toBe("C");
  });

  it("are done when every question has one", () => {
    let s = answerQuestion(EMPTY_LEARNING, KEY, q1!.id, "B", 3, T0);
    s = answerQuestion(s, KEY, q2!.id, "B", 3, T0);
    expect(s.checkpoints[KEY]?.doneAt).toBeUndefined();
    s = answerQuestion(s, KEY, q3!.id, "B", 3, T1);
    expect(s.checkpoints[KEY]?.doneAt).toBe(T1);
  });

  it("read back only well-formed answers", () => {
    expect(
      parseLearning({
        checkpoints: {
          [KEY]: {
            answers: { [q1!.id]: "B", [q2!.id]: "E", "Bad Id": "A" },
            doneAt: T0,
          },
          "not a key": { answers: { x: "A" } },
        },
      }).checkpoints,
    ).toEqual({ [KEY]: { answers: { [q1!.id]: "B" }, doneAt: T0 } });
  });
});

describe("the checkpoints' content", () => {
  it.each([
    ["ai-agents", "agent-anatomy"],
    ["payments", "move-money-exactly-once"],
  ])(
    "%s/%s has three questions, each with one right and one partly right answer",
    (t, l) => {
      const c = getCheckpoint(t, l)!;
      expect(c.questions).toHaveLength(3);
      for (const q of c.questions) {
        expect(q.options.filter((o) => o.verdict === "right")).toHaveLength(1);
        expect(q.options.filter((o) => o.verdict === "partial")).toHaveLength(
          1,
        );
      }
    },
  );
});
