// Where the learner is in each lesson, and their checkpoint answers, kept
// in this browser (PRD P5, P6). Keyed "topic/lesson", because lesson ids
// are only unique in a topic.

import {
  createBrowserStore,
  localStorageOf,
  watchOtherTabs,
} from "./browserStore";

export const LEARNING_KEY = "ttl-learn:progress:v2";

export type LessonProgress = {
  /** The step they were last on, 1-based. */
  step: number;
  /** The furthest step they have reached. */
  maxStep: number;
  /** ISO time they first opened it, and last moved in it. */
  startedAt: string;
  updatedAt: string;
  /** ISO time they reached the last step. */
  doneAt?: string;
};

export type OptionId = "A" | "B" | "C" | "D";

export type CheckpointAnswers = {
  /** The first answer to each question, by question id: the scored one. */
  answers: Record<string, OptionId>;
  /** ISO time the last question got its first answer. */
  doneAt?: string;
};

export type Learning = {
  lessons: Record<string, LessonProgress>;
  checkpoints: Record<string, CheckpointAnswers>;
};

export const EMPTY_LEARNING: Learning = { lessons: {}, checkpoints: {} };

export const lessonKey = (topic: string, lesson: string) =>
  `${topic}/${lesson}`;

const isIso = (v: unknown): v is string =>
  typeof v === "string" && !Number.isNaN(Date.parse(v));
const isStep = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 50;

/** Keeps only well-formed records; anything else reads as not started. */
export function parseLearning(raw: unknown): Learning {
  if (typeof raw !== "object" || raw === null) return EMPTY_LEARNING;
  const checkpoints: Record<string, CheckpointAnswers> = {};
  const givenCp = (raw as { checkpoints?: unknown }).checkpoints;
  if (typeof givenCp === "object" && givenCp !== null)
    for (const [key, v] of Object.entries(givenCp)) {
      if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(key)) continue;
      const answers = (v as { answers?: unknown })?.answers;
      if (typeof answers !== "object" || answers === null) continue;
      const kept: Record<string, OptionId> = {};
      for (const [q, a] of Object.entries(answers))
        if (
          /^[a-z0-9-]+$/.test(q) &&
          ["A", "B", "C", "D"].includes(a as string)
        )
          kept[q] = a as OptionId;
      const doneAt = (v as { doneAt?: unknown }).doneAt;
      checkpoints[key] = {
        answers: kept,
        ...(isIso(doneAt) ? { doneAt } : {}),
      };
    }
  const lessons: Record<string, LessonProgress> = {};
  const given = (raw as { lessons?: unknown }).lessons;
  if (typeof given === "object" && given !== null)
    for (const [key, v] of Object.entries(given)) {
      if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(key)) continue;
      if (typeof v !== "object" || v === null) continue;
      const p = v as Record<string, unknown>;
      if (!isStep(p.step) || !isStep(p.maxStep)) continue;
      if (!isIso(p.startedAt) || !isIso(p.updatedAt)) continue;
      lessons[key] = {
        step: p.step,
        maxStep: Math.max(p.maxStep, p.step),
        startedAt: p.startedAt,
        updatedAt: p.updatedAt,
        ...(isIso(p.doneAt) ? { doneAt: p.doneAt } : {}),
      };
    }
  return { lessons, checkpoints };
}

/** Keeps a question's first answer; later picks don't change it. */
export function answerQuestion(
  state: Learning,
  key: string,
  questionId: string,
  option: OptionId,
  questionCount: number,
  now: string,
): Learning {
  const before = state.checkpoints[key] ?? { answers: {} };
  if (before.answers[questionId]) return state;
  const answers = { ...before.answers, [questionId]: option };
  const done = Object.keys(answers).length >= questionCount;
  return {
    ...state,
    checkpoints: {
      ...state.checkpoints,
      [key]: {
        answers,
        ...(before.doneAt || done ? { doneAt: before.doneAt ?? now } : {}),
      },
    },
  };
}

/** Records that the learner is on `step` of `total`. */
export function visitStep(
  state: Learning,
  key: string,
  step: number,
  total: number,
  now: string,
): Learning {
  const before = state.lessons[key];
  if (before?.step === step && before.maxStep >= step) return state;
  const maxStep = Math.max(before?.maxStep ?? 0, step);
  const doneAt = before?.doneAt ?? (maxStep >= total ? now : undefined);
  return {
    ...state,
    lessons: {
      ...state.lessons,
      [key]: {
        step,
        maxStep,
        startedAt: before?.startedAt ?? now,
        updatedAt: now,
        ...(doneAt ? { doneAt } : {}),
      },
    },
  };
}

export const learningStore = createBrowserStore({
  key: LEARNING_KEY,
  parse: parseLearning,
  empty: EMPTY_LEARNING,
  getStorage: localStorageOf,
  watch: watchOtherTabs,
});
