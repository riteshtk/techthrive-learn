"use client";

// The course's lessons with this browser's progress (spec 03 §5): done
// lessons show a tick, the next one the live dot, the rest their number.
// Lessons without a page show their outline as "Coming" and aren't links.

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/Icon";
import type { LessonOutline } from "@/content/types";
import { EMPTY_LEARNING, learningStore, lessonKey } from "@/lib/learning";

const server = () => EMPTY_LEARNING;

export function useCourseProgress(topic: string, built: readonly string[]) {
  const learning = useSyncExternalStore(
    learningStore.subscribe,
    learningStore.get,
    server,
  );
  const done = built.filter(
    (id) => learning.lessons[lessonKey(topic, id)]?.doneAt,
  );
  const next = built.find((id) => !done.includes(id));
  return { done, next };
}

export function CourseProgress({
  topic,
  lessons,
  built,
}: {
  topic: string;
  lessons: readonly LessonOutline[];
  built: readonly string[];
}) {
  const { done, next } = useCourseProgress(topic, built);
  const n = next ? lessons.findIndex((l) => l.id === next) + 1 : 0;
  return (
    <dl className="tt-card tt-course-progress">
      <div>
        <dt className="tt-lbl-s">Done</dt>
        <dd className="tt-num">
          {done.length} / {lessons.length}
        </dd>
      </div>
      <div>
        <dt className="tt-lbl-s">Next</dt>
        <dd className="tt-num">{next ? `Lesson ${n}` : "—"}</dd>
      </div>
    </dl>
  );
}

export function CourseList({
  topic,
  lessons,
  built,
}: {
  topic: string;
  lessons: readonly LessonOutline[];
  built: readonly string[];
}) {
  const { done, next } = useCourseProgress(topic, built);
  return (
    <ol className="tt-card-l tt-course-list" aria-label="Lessons">
      {lessons.map((l, i) => {
        const live = built.includes(l.id);
        const state = !live
          ? "coming"
          : done.includes(l.id)
            ? "done"
            : l.id === next
              ? "here"
              : "todo";
        const href = `/topics/${topic}/lessons/${l.id}/`;
        return (
          <li
            key={l.id}
            className={`tt-les ${state}`}
            aria-current={state === "here" ? "step" : undefined}
          >
            <span className="tt-les-st">
              {state === "done" ? (
                <>
                  <Icon name="check" />
                  <span className="sr-only">Completed. </span>
                </>
              ) : state === "here" ? (
                <>
                  <span className="tt-live" aria-hidden="true" />
                  <span className="sr-only">Next up. </span>
                </>
              ) : (
                String(i + 1).padStart(2, "0")
              )}
            </span>
            <div className="tt-les-main">
              {live ? (
                <Link href={href} className="tt-les-title">
                  {l.title}
                </Link>
              ) : (
                <p className="tt-les-title">{l.title}</p>
              )}
              <p className="tt-body-s">{l.summary}</p>
              {l.tags && (
                <ul className="tt-les-tags">
                  {l.tags.map((t) => (
                    <li key={t} className="tt-chip tt-chip-compact">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="tt-les-side">
              {live ? (
                <span className="tt-cap tt-mono">{l.minutes} min</span>
              ) : (
                <span className="tt-pill">Coming</span>
              )}
              {l.then && <span className="tt-cap">Then: {l.then}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
