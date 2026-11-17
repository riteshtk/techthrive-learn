"use client";

import { useEffect, useRef, useState } from "react";
import { progressStore, useProgress } from "@/lib/useProgress";

/** "Reset progress" with an in-page confirmation (no browser dialogs). */
export function ResetProgress({ topicIds }: { topicIds: string[] }) {
  const done = useProgress(topicIds);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  const hasProgress = done !== null && done.length > 0;

  return (
    <div className="reset">
      {hasProgress && !confirming ? (
        <button
          type="button"
          className="button"
          onClick={() => {
            setMessage("");
            setConfirming(true);
          }}
        >
          Reset progress
        </button>
      ) : null}
      {confirming ? (
        <div className="reset-confirm">
          <p>This clears the topics you marked as done, on every roadmap.</p>
          <button
            ref={confirmRef}
            type="button"
            className="button button-primary"
            onClick={() => {
              progressStore.reset();
              setConfirming(false);
              setMessage("Progress reset.");
            }}
          >
            Yes, reset
          </button>
          <button
            type="button"
            className="button"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
        </div>
      ) : null}
      <p role="status" className="reset-status">
        {message}
      </p>
    </div>
  );
}
