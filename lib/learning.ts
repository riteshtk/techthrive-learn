// Where the learner is in each lesson, kept in this browser (PRD P5).
// Keyed "topic/lesson", because lesson ids are only unique in a topic.
// Checkpoint answers join this record in P6.

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

export type Learning = {
  lessons: Record<string, LessonProgress>;
};

export const EMPTY_LEARNING: Learning = { lessons: {} };

export const lessonKey = (topic: string, lesson: string) =>
  `${topic}/${lesson}`;

const isIso = (v: unknown): v is string =>
  typeof v === "string" && !Number.isNaN(Date.parse(v));
const isStep = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 50;

/** Keeps only well-formed records; anything else reads as not started. */
export function parseLearning(raw: unknown): Learning {
  if (typeof raw !== "object" || raw === null) return EMPTY_LEARNING;
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
  return { lessons };
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
