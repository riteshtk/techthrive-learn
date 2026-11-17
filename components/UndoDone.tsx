"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { doneNotice } from "@/lib/doneNotice";
import { progressStore } from "@/lib/useProgress";

/**
 * "Marked X as done. Undo", shown after "Mark as done" brings the learner
 * back here. Fixed to the bottom of the screen, so it never shifts the page.
 * A topic that was already done gets no Undo, which would lose that progress.
 */
export function UndoDone({
  topics,
}: {
  topics: { id: string; title: string }[];
}) {
  const notice = useSyncExternalStore(
    doneNotice.subscribe,
    doneNotice.get,
    () => null,
  );
  const [undone, setUndone] = useState(false);

  // The notice belongs to this visit of the page only.
  useEffect(() => () => doneNotice.set(null), []);

  const doneId = notice?.topicId;
  const title = topics.find((t) => t.id === doneId)?.title;

  return (
    <div className="toast" role="status" data-testid="undo-toast">
      {doneId && title ? (
        <div className="toast-body">
          {notice?.already ? (
            <span>“{title}” was already marked as done.</span>
          ) : undone ? (
            <span>“{title}” is no longer marked as done.</span>
          ) : (
            <>
              <span>Marked “{title}” as done.</span>
              <button
                type="button"
                className="button"
                onClick={() => {
                  progressStore.unmarkDone(doneId);
                  setUndone(true);
                }}
              >
                Undo
              </button>
            </>
          )}
          <button
            type="button"
            className="button button-quiet"
            aria-label="Dismiss"
            onClick={() => {
              doneNotice.set(null);
              setUndone(false);
            }}
          >
            ✕
          </button>
        </div>
      ) : null}
    </div>
  );
}
