"use client";

import Link from "next/link";
import type { StepSource } from "../lessonData";

/** The Sources tab (spec 04 §6.3): this step's sources, from the facts
    register, and a link to all of the topic's. */
export default function SourcesPanel({
  n,
  sources,
  allHref,
}: {
  n: number;
  sources: readonly StepSource[];
  allHref: string;
}) {
  return (
    <div className="tt-explain">
      <p className="tt-lbl">Sources for step {n}</p>
      {sources.length === 0 ? (
        <div className="tt-panel-2 tt-source">
          <p className="tt-source-title">Design guidance</p>
          <p className="tt-source-detail">No external source for this step.</p>
        </div>
      ) : (
        sources.map((s, i) => (
          <div key={i} className="tt-panel-2 tt-source">
            <p className="tt-source-title">
              {s.url ? (
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                s.title
              )}
            </p>
            <p className="tt-source-detail">{s.detail}</p>
          </div>
        ))
      )}
      <div>
        <Link href={allHref} className="tt-btn tt-btn-sm">
          All topic sources
        </Link>
      </div>
    </div>
  );
}
