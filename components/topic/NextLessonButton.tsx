"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/Icon";
import { EMPTY_LEARNING, learningStore, lessonKey } from "@/lib/learning";

export type BuiltLesson = { id: string; n: number; ctaName: string };

const server = () => EMPTY_LEARNING;

/** "Start lesson n: {name}" for the learner's next unfinished built lesson,
    or "Review the lessons" once they're all done. The server renders the
    first built lesson; the browser corrects it from saved progress. */
export function NextLessonButton({
  topic,
  lessons,
}: {
  topic: string;
  lessons: readonly BuiltLesson[];
}) {
  const learning = useSyncExternalStore(
    learningStore.subscribe,
    learningStore.get,
    server,
  );
  const next = lessons.find(
    (l) => !learning.lessons[lessonKey(topic, l.id)]?.doneAt,
  );
  if (!next)
    return (
      <Link
        href={`/topics/${topic}/lessons/`}
        className="tt-btn tt-btn-primary tt-hero-cta"
      >
        Review the lessons
        <Icon name="arrow-right" />
      </Link>
    );
  const started = !!learning.lessons[lessonKey(topic, next.id)];
  return (
    <Link
      href={`/topics/${topic}/lessons/${next.id}/`}
      className="tt-btn tt-btn-primary tt-hero-cta"
    >
      {started ? "Continue" : "Start"} lesson {next.n}: {next.ctaName}
      <Icon name="arrow-right" />
    </Link>
  );
}
