"use client";

import { useProgress } from "@/lib/useProgress";

/**
 * A roadmap's progress: one dot per topic, filled when done, then
 * "2 of 3 done". Keeps its size before the browser store is read, so the
 * page doesn't shift when progress appears.
 */
export function ProgressCount({ topicIds }: { topicIds: string[] }) {
  const done = useProgress(topicIds);
  return (
    <div className="progress">
      <span className="dots" aria-hidden="true">
        {topicIds.map((id) => (
          <span
            key={id}
            className="dot"
            data-done={done?.includes(id) ?? false}
            data-testid={`dot-${id}`}
          />
        ))}
      </span>
      <span className="progress-count" data-testid="progress-count">
        {done === null ? " " : `${done.length} of ${topicIds.length} done`}
      </span>
    </div>
  );
}
