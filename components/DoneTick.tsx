"use client";

import { useProgress } from "@/lib/useProgress";

/** A "Done" tick in a slot that keeps its size before progress loads. */
export function DoneTick({ topicId }: { topicId: string }) {
  const done = useProgress([topicId]);
  const isDone = done !== null && done.length > 0;
  return (
    <span
      className="done-tick"
      data-done={isDone}
      data-testid={`done-${topicId}`}
    >
      {isDone ? (
        <>
          <span aria-hidden="true">✓ </span>Done
        </>
      ) : null}
    </span>
  );
}
