// Checkpoint scoring (PRD P6, decision 12): the first answer to each
// question counts; right is a point, partly right half a point, wrong
// none; 80% across the lesson's questions passes. Scored in the browser in
// phase 1; phase 2 moves the right answers to the server.

import type { Question } from "@/content/types";
import type { OptionId } from "./learning";

export const PASS_MARK = 0.8;

const CREDIT = { right: 1, partial: 0.5, wrong: 0 } as const;

export type Verdict = keyof typeof CREDIT;

export function verdictOf(question: Question, option: OptionId): Verdict {
  return question.options.find((o) => o.id === option)?.verdict ?? "wrong";
}

export function rightOption(question: Question): OptionId {
  return question.options.find((o) => o.verdict === "right")?.id ?? "A";
}

export type CheckpointScore = {
  answered: number;
  total: number;
  /** Points from first answers, out of `total`. */
  points: number;
  /** 0–1, once every question is answered. */
  score: number | null;
  passed: boolean | null;
};

export function scoreCheckpoint(
  questions: readonly Question[],
  answers: Readonly<Record<string, OptionId>>,
): CheckpointScore {
  let points = 0;
  let answered = 0;
  for (const q of questions) {
    const a = answers[q.id];
    if (!a) continue;
    answered++;
    points += CREDIT[verdictOf(q, a)];
  }
  const total = questions.length;
  const complete = total > 0 && answered === total;
  const score = complete ? points / total : null;
  return {
    answered,
    total,
    points,
    score,
    passed: score === null ? null : score >= PASS_MARK,
  };
}
