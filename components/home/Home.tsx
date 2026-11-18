"use client";

// Home (spec 01 §B1, PRD P16): continue learning, what's due, and what
// changed in your topics, all from this browser. Nothing here needs an
// account; names, streaks and paths are phase 2.

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatDate } from "@/lib/dates";
import {
  dateLine,
  greeting,
  inProgress,
  startedTopics,
  whatChanged,
  type FactChange,
  type ResumeLesson,
} from "@/lib/home";
import { learningStore } from "@/lib/learning";
import { dueCount, reviewStore } from "@/lib/review";

const none = () => null;
const noop = () => () => {};
// The minute, so the snapshot is stable between renders.
const minute = () => Math.floor(Date.now() / 60_000);

export function Home({
  lessons,
  cardKeys,
  changes,
}: {
  lessons: ResumeLesson[];
  cardKeys: string[];
  changes: FactChange[];
}) {
  const learning = useSyncExternalStore(
    learningStore.subscribe,
    learningStore.get,
    none,
  );
  const schedule = useSyncExternalStore(
    reviewStore.subscribe,
    reviewStore.get,
    none,
  );
  const at = useSyncExternalStore(noop, minute, none);
  const now = at === null ? null : new Date(at * 60_000);

  const resume = learning ? inProgress(lessons, learning) : [];
  const changed = learning ? whatChanged(changes, startedTopics(learning)) : [];
  const due = schedule && now ? dueCount(cardKeys, schedule, now) : null;

  return (
    <>
      <header className="tt-home-head">
        <p className="tt-cap tt-mono tt-home-date">
          {now ? dateLine(now) : " "}
        </p>
        <h1 className="tt-h1">{now ? `${greeting(now)}.` : "Welcome."}</h1>
        <p className="tt-body tt-muted">
          Pick up where you left off, review what’s due, and see what changed in
          your topics.
        </p>
      </header>
      <div className="tt-home-body">
        <section
          className="tt-card-l tt-home-tile tt-home-continue"
          aria-labelledby="continue-title"
        >
          <div className="tt-home-tile-head">
            <h2 id="continue-title" className="tt-h3">
              Continue learning
            </h2>
            <Link href="/topics/" className="tt-btn tt-btn-sm">
              All topics
              <Icon name="arrow-right" />
            </Link>
          </div>
          {resume.length > 0 ? (
            <ul className="tt-home-resume">
              {resume.map(({ lesson, step }) => (
                <li key={lesson.key} className="tt-card tt-home-card">
                  <p className="tt-lbl-s">
                    {lesson.topicTitle} · Lesson {lesson.n}
                  </p>
                  <h3 className="tt-h4">{lesson.title}</h3>
                  <p className="tt-body-s">
                    Next: step {step}, “{lesson.steps[step - 1]}”
                  </p>
                  <div className="tt-home-prog">
                    <span
                      className="tt-bar"
                      role="progressbar"
                      aria-label={`${lesson.title} progress`}
                      aria-valuemin={0}
                      aria-valuemax={lesson.steps.length}
                      aria-valuenow={step}
                    >
                      <i
                        style={{
                          width: `${(step / lesson.steps.length) * 100}%`,
                        }}
                      />
                    </span>
                    <span className="tt-cap tt-mono">
                      {step} / {lesson.steps.length} steps
                    </span>
                  </div>
                  <Link
                    href={`${lesson.href}?step=${step}`}
                    className="tt-btn tt-btn-sm tt-btn-primary"
                  >
                    Resume
                    <span className="sr-only"> {lesson.title}</span>
                    <Icon name="arrow-right" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="tt-home-empty">
              <p className="tt-body-s">
                {learning
                  ? "Nothing in progress. Each topic is built around one real system; pick one and step through it."
                  : " "}
              </p>
              <Link href="/topics/" className="tt-btn tt-btn-sm tt-btn-primary">
                Start a topic
                <Icon name="arrow-right" />
              </Link>
            </div>
          )}
        </section>

        <aside className="tt-home-side" aria-label="Today">
          <section
            className="tt-card-l tt-home-tile"
            aria-labelledby="due-title"
          >
            <h2 id="due-title" className="tt-h3">
              Due today
            </h2>
            <Link href="/review/" className="tt-home-row">
              <span className="tt-sq" aria-hidden="true">
                <Icon name="repeat" />
              </span>
              <span className="tt-home-row-text">
                <span className="tt-h4">
                  {due === null
                    ? "Review cards"
                    : due === 0
                      ? "No review cards due"
                      : `${due} review card${due === 1 ? "" : "s"}`}
                </span>
                <span className="tt-body-s">Spaced repetition</span>
              </span>
              <Icon name="arrow-right" />
            </Link>
          </section>

          <section
            className="tt-card-l tt-home-tile"
            aria-labelledby="changed-title"
          >
            <h2 id="changed-title" className="tt-h3">
              What changed in your topics
            </h2>
            <p className="tt-body-s">
              We re-check every sourced fact. When one changes, the lesson
              changes with it.
            </p>
            {changed.length > 0 ? (
              <ul className="tt-home-changes">
                {changed.map((c) => (
                  <li key={c.id}>
                    <p className="tt-lbl-s">
                      {c.topicTitle} · {formatDate(c.changedOn)}
                    </p>
                    <p className="tt-body-s tt-home-note">
                      {c.note ?? c.claim}
                    </p>
                    <p className="tt-cap tt-mono">
                      <del>{c.previousValue}</del> → {c.value}
                    </p>
                    {c.url ? (
                      <a
                        href={c.url}
                        className="tt-cap"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {c.source}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : (
                      <p className="tt-cap">{c.source}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="tt-body-s">
                {learning ? "Nothing has changed in your topics." : " "}
              </p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
