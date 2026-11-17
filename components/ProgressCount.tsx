"use client";

import { useProgress } from "@/lib/useProgress";

/**
 * "2 of 3 done". Renders an empty line of the same height until the browser
 * store is read, so the page doesn't shift when progress appears.
 */
export function ProgressCount({ topicIds }: { topicIds: string[] }) {
  const done = useProgress(topicIds);
  return (
    <p className="progress-count" data-testid="progress-count">
      {done === null ? " " : `${done.length} of ${topicIds.length} done`}
    </p>
  );
}
