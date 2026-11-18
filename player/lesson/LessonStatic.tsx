// The lesson page's static parts, rendered on the server and handed to
// the LessonPlayer as slots, so their code stays out of the page's
// JavaScript budget.
import Link from "next/link";
import type { ColorKey } from "@/content/types";
import type { LessonPageData } from "../lessonData";

/** The breadcrumb, title and chips. */
export function LessonHeading({
  topic,
  outline,
}: Pick<LessonPageData, "topic" | "outline">) {
  return (
    <div className="tt-lesson-titles">
      <p className="tt-crumb">
        <Link href={`/topics/${topic.id}/lessons/`}>{topic.title}</Link>
        <span className="tt-faint" aria-hidden="true">
          /
        </span>
        <span>
          Lesson {outline.position} of {outline.count}
        </span>
      </p>
      <div className="tt-lesson-titlerow">
        <h1 id="lesson-title" className="tt-h1 tt-lesson-h1">
          {outline.title}
        </h1>
        <span className="tt-chip">
          <svg className="tt-ic tt-ic-s" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2" />
          </svg>
          {outline.minutes} min
        </span>
        <span className="tt-chip">{outline.level}</span>
      </div>
    </div>
  );
}

/** The diagram's colour key. */
export function LessonLegend({
  legend,
}: {
  legend: readonly (readonly [ColorKey, string])[];
}) {
  return (
    <ul className="tt-legend-keys" aria-label="Colours">
      {legend.map(([color, label]) => (
        <li key={label}>
          <span className={`tt-key tt-${color}`} aria-hidden="true" />
          {label}
        </li>
      ))}
      <li>
        <span className="tt-legend-arrow" aria-hidden="true">
          ⟶
        </span>
        direction of the call
      </li>
    </ul>
  );
}
