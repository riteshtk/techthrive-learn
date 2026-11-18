"use client";

import { Icon } from "@/components/ui/Icon";

/** The step rail (spec 04 §1.8): done steps show a tick, the current one
    an ember ring. */
export function StepsRail({
  steps,
  current,
  onGo,
}: {
  steps: readonly { short: string }[];
  current: number;
  onGo: (step: number) => void;
}) {
  return (
    <nav className="tt-card tt-rail" aria-label="Steps">
      <span className="tt-lbl-s tt-rail-label">Steps</span>
      <span className="tt-rail-now" aria-hidden="true">
        <b>{steps[current - 1]?.short}</b> {current} / {steps.length}
      </span>
      <ol className="tt-rail-list">
        {steps.map((step, i) => {
          const n = i + 1;
          const phase = n < current ? "done" : n === current ? "now" : "todo";
          return (
            <li key={n}>
              <button
                type="button"
                className={`tt-stp ${phase}`}
                aria-current={phase === "now" ? "step" : undefined}
                onClick={() => onGo(n)}
              >
                <span className="tt-stp-dot" aria-hidden="true">
                  {phase === "done" ? <Icon name="check" /> : n}
                </span>
                <span className="sr-only">Step {n}: </span>
                <span className="tt-stp-label">{step.short}</span>
                {phase === "done" && <span className="sr-only"> (done)</span>}
              </button>
            </li>
          );
        })}
      </ol>
      <span className="tt-rail-count" aria-hidden="true">
        {current} / {steps.length}
      </span>
    </nav>
  );
}
