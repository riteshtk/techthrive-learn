// Home (PRD P16): what to show from this browser's progress, the facts
// register's changes and the review schedule.

import type { Learning } from "./learning";

export type FactChange = {
  topic: string;
  topicTitle: string;
  id: string;
  claim: string;
  value: string;
  previousValue: string;
  changedOn: string;
  note?: string;
  source: string;
  url?: string;
};

/** Topics this browser has opened a lesson in. */
export function startedTopics(learning: Learning): Set<string> {
  return new Set(Object.keys(learning.lessons).map((k) => k.split("/")[0]!));
}

/**
 * Changed facts in the topics you've started, newest first; a new visitor
 * sees changes across every topic.
 */
export function whatChanged(
  changes: readonly FactChange[],
  started: ReadonlySet<string>,
  limit = 4,
): FactChange[] {
  const mine = started.size
    ? changes.filter((c) => started.has(c.topic))
    : changes;
  return [...mine]
    .sort((a, b) => b.changedOn.localeCompare(a.changedOn))
    .slice(0, limit);
}

export type ResumeLesson = {
  key: string;
  topicTitle: string;
  n: number;
  title: string;
  href: string;
  steps: string[];
};

/** Lessons started and not finished, most recently used first. */
export function inProgress(
  lessons: readonly ResumeLesson[],
  learning: Learning,
): { lesson: ResumeLesson; step: number }[] {
  return lessons
    .flatMap((l) => {
      const p = learning.lessons[l.key];
      return p && !p.doneAt
        ? [{ lesson: l, step: p.step, at: p.updatedAt }]
        : [];
    })
    .sort((a, b) => b.at.localeCompare(a.at))
    .map(({ lesson, step }) => ({ lesson, step }));
}

const WEEKDAYS =
  "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" ");
const MONTHS =
  "January February March April May June July August September October November December".split(
    " ",
  );

/** "Wednesday · 18 November 2026", in local time. */
export function dateLine(now: Date): string {
  return `${WEEKDAYS[now.getDay()]} · ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

export function greeting(now: Date): string {
  const h = now.getHours();
  return h < 5
    ? "Good evening"
    : h < 12
      ? "Good morning"
      : h < 18
        ? "Good afternoon"
        : "Good evening";
}
