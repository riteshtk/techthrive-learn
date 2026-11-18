// The review schedule (PRD P14): each card's FSRS state, kept in this
// browser under one key and shared by every open tab. Cards are keyed
// "topic/card", ids that never change once merged.

import {
  createBrowserStore,
  isIso,
  isStoreKey,
  localStorageOf,
  watchOtherTabs,
} from "./browserStore";
import type { CardState } from "./fsrs";

export const REVIEW_KEY = "ttl-learn:review:v1";

export type ReviewSchedule = Record<string, CardState>;

export const EMPTY_SCHEDULE: ReviewSchedule = {};

const isNum = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;

/** Keeps only well-formed card states; anything else reads as unseen. */
export function parseSchedule(raw: unknown): ReviewSchedule {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw))
    return EMPTY_SCHEDULE;
  const out: ReviewSchedule = {};
  for (const [id, v] of Object.entries(raw)) {
    if (!isStoreKey(id)) continue;
    const c = v as Partial<CardState>;
    if (
      (c.phase === "learning" || c.phase === "review") &&
      isIso(c.due) &&
      isNum(c.stability, 0, 1e6) &&
      isNum(c.difficulty, 1, 10) &&
      isNum(c.reps, 0, 1e6) &&
      isNum(c.lapses, 0, 1e6) &&
      (c.last === undefined || isIso(c.last))
    )
      out[id] = {
        phase: c.phase,
        due: c.due,
        stability: c.stability,
        difficulty: c.difficulty,
        reps: c.reps,
        lapses: c.lapses,
        ...(c.last ? { last: c.last } : {}),
      };
  }
  return out;
}

export const reviewStore = createBrowserStore({
  key: REVIEW_KEY,
  parse: parseSchedule,
  empty: EMPTY_SCHEDULE,
  getStorage: localStorageOf,
  watch: watchOtherTabs,
});

/** Cards due now, counting cards never seen as due. */
export function dueCount(
  ids: readonly string[],
  schedule: ReviewSchedule,
  now: Date,
): number {
  const t = now.getTime();
  return ids.filter((id) => {
    const s = schedule[id];
    return !s || Date.parse(s.due) <= t;
  }).length;
}
