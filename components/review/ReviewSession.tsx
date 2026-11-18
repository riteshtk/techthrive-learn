"use client";

// The review screen (spec 05 §8, PRD P14): due cards first, then new ones,
// each rated Again, Hard, Good or Easy and scheduled with FSRS. Space shows
// the answer; 1–4 rate it. The schedule lives in this browser.

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  nextLabel,
  newCard,
  queue,
  rate,
  RATINGS,
  type Rating,
} from "@/lib/fsrs";
import { reviewStore } from "@/lib/review";

export type ReviewCard = {
  key: string;
  topic: string;
  area: string;
  source: string;
  q: string;
  a: string;
};

const server = () => null;

function when(due: string, now: Date): string {
  const ms = Date.parse(due) - now.getTime();
  if (ms <= 0) return "now";
  const min = Math.round(ms / 60_000);
  if (min < 60) return `in ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `in ${h} hour${h === 1 ? "" : "s"}`;
  const d = Math.round(h / 24);
  return `in ${d} day${d === 1 ? "" : "s"}`;
}

export function ReviewSession({ cards }: { cards: ReviewCard[] }) {
  const schedule = useSyncExternalStore(
    reviewStore.subscribe,
    reviewStore.get,
    server,
  );
  const [session, setSession] = useState<string[] | null>(null);
  const [done, setDone] = useState(0);
  const [shown, setShown] = useState(false);

  const byKey = new Map(cards.map((c) => [c.key, c]));
  const current =
    session && done < session.length ? byKey.get(session[done]!) : undefined;
  const now = new Date();

  const start = () => {
    const due = queue(
      cards.map((c) => ({ id: c.key })),
      reviewStore.get(),
      new Date(),
    ).map((c) => c.id);
    setSession(due);
    setDone(0);
    setShown(false);
  };

  const answer = (g: Rating) => {
    if (!current || !session) return;
    const at = new Date();
    reviewStore.update((s) => ({
      ...s,
      [current.key]: rate(s[current.key] ?? newCard(at), g, at),
    }));
    // Again comes back at the end of this session.
    if (g === 1) setSession([...session, current.key]);
    setDone(done + 1);
    setShown(false);
  };

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest("input, textarea")
      )
        return;
      if (!shown && e.key === " ") {
        e.preventDefault();
        setShown(true);
      } else if (shown && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        answer(Number(e.key) as Rating);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (schedule === null)
    return <p className="tt-body-s tt-rv-wait">Loading your schedule…</p>;

  const ids = cards.map((c) => c.key);
  const dueNow = queue(
    ids.map((id) => ({ id })),
    schedule,
    now,
  ).length;
  const nextDue = ids
    .map((id) => schedule[id]?.due)
    .filter((d): d is string => !!d && Date.parse(d) > now.getTime())
    .sort()[0];

  if (!session || !current) {
    const finished = session !== null;
    return (
      <section className="tt-card-l tt-rv-start" aria-labelledby="rv-title">
        <h2 id="rv-title" className="tt-h2">
          {finished ? "All done for now" : "Review"}
        </h2>
        <p className="tt-body">
          {dueNow > 0
            ? `${dueNow} card${dueNow === 1 ? "" : "s"} to review.`
            : "Nothing is due."}
          {nextDue && ` The next card is due ${when(nextDue, now)}.`}
        </p>
        {dueNow > 0 ? (
          <button
            type="button"
            className="tt-btn tt-btn-primary tt-rv-big"
            onClick={start}
          >
            {finished ? "Review again" : "Start review"}
          </button>
        ) : (
          <Link href="/topics/" className="tt-btn tt-rv-big">
            Back to the topics
          </Link>
        )}
      </section>
    );
  }

  const state = schedule[current.key] ?? newCard(now);
  const position = Math.min(done + 1, session.length);

  return (
    <section className="tt-rv" aria-labelledby="rv-q">
      <div className="tt-rv-progress">
        <div
          className="tt-bar"
          role="progressbar"
          aria-label="Review progress"
          aria-valuemin={0}
          aria-valuemax={session.length}
          aria-valuenow={done}
        >
          <i style={{ width: `${(done / session.length) * 100}%` }} />
        </div>
        <span className="tt-num">
          {position} / {session.length}
        </span>
      </div>
      <p className="tt-rv-meta">
        <span className="tt-chip">{current.area}</span>
        <span className="tt-cap tt-mono">
          {current.topic} · {current.source}
        </span>
      </p>
      <div className="tt-card-l tt-field tt-rv-card">
        <p className="tt-lbl-s">{shown ? "Answer" : "Question"}</p>
        <h2 id="rv-q" className="tt-rv-q">
          {current.q}
        </h2>
        <div aria-live="polite">
          {shown && <p className="tt-body tt-rv-a">{current.a}</p>}
        </div>
      </div>
      {shown ? (
        <div
          className="tt-rv-rates"
          role="group"
          aria-label="How well did you know it?"
        >
          {RATINGS.map(({ rating, label }) => {
            const next = nextLabel(state, rating, now);
            return (
              <button
                key={rating}
                type="button"
                className="tt-rv-rate"
                onClick={() => answer(rating)}
              >
                <span className="tt-h4">{label}</span>
                <span className="sr-only">, next in </span>
                <span className="tt-cap tt-mono">{next}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <button
          type="button"
          className="tt-btn tt-btn-primary tt-rv-big"
          onClick={() => setShown(true)}
        >
          Show answer
        </button>
      )}
      <p className="tt-cap tt-rv-keys">
        Keys: Space shows the answer; 1 to 4 rate it.
      </p>
    </section>
  );
}
