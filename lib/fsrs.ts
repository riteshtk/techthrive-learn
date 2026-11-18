// Spaced repetition for review cards (PRD P14): standard FSRS (the
// FSRS-4.5 formulas and default weights) with one 1-minute learning step.
// The first four weights, a new card's starting stability per rating, are
// set so a new card's buttons read 1 min / 1 day / 3 days / 9 days, as
// designed (planning decision). At 90% desired retention an interval
// equals the card's stability.

export type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export const RATINGS: { rating: Rating; label: string }[] = [
  { rating: 1, label: "Again" },
  { rating: 2, label: "Hard" },
  { rating: 3, label: "Good" },
  { rating: 4, label: "Easy" },
];

export type CardState = {
  /** new: never rated; learning: rated Again, due in a minute. */
  phase: "new" | "learning" | "review";
  /** ISO time it's due. */
  due: string;
  /** Days for recall to fall to 90%. */
  stability: number;
  /** 1 (easy) to 10 (hard). */
  difficulty: number;
  reps: number;
  lapses: number;
  /** ISO time of the last rating. */
  last?: string;
};

/** FSRS-4.5 defaults, with w0–w3 set to the designed new-card ladder. */
export const W = [
  0.4872, 1, 3, 9, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461,
  2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755,
] as const;

const w = (i: number) => W[i]!;
const DECAY = -0.5;
const FACTOR = 19 / 81;
const RETENTION = 0.9;
const MINUTE = 60_000;
const DAY = 86_400_000;
const MAX_DAYS = 36_500;

const clampD = (d: number) => Math.min(10, Math.max(1, d));

/** Probability of recall after `days` with stability `s`. */
export function retrievability(days: number, s: number): number {
  return Math.pow(1 + (FACTOR * days) / s, DECAY);
}

/** Whole days until recall falls to the desired retention (at least 1). */
export function intervalDays(s: number): number {
  const days = (s / FACTOR) * (Math.pow(RETENTION, 1 / DECAY) - 1);
  return Math.min(MAX_DAYS, Math.max(1, Math.round(days)));
}

const initialDifficulty = (g: Rating) => clampD(w(4) - (g - 3) * w(5));

function nextDifficulty(d: number, g: Rating): number {
  const changed = d - w(6) * (g - 3);
  return clampD(w(7) * initialDifficulty(3) + (1 - w(7)) * changed);
}

function recallStability(d: number, s: number, r: number, g: Rating) {
  const hard = g === 2 ? w(15) : 1;
  const easy = g === 4 ? w(16) : 1;
  return (
    s *
    (Math.exp(w(8)) *
      (11 - d) *
      Math.pow(s, -w(9)) *
      (Math.exp(w(10) * (1 - r)) - 1) *
      hard *
      easy +
      1)
  );
}

function forgetStability(d: number, s: number, r: number) {
  return (
    w(11) *
    Math.pow(d, -w(12)) *
    (Math.pow(s + 1, w(13)) - 1) *
    Math.exp(w(14) * (1 - r))
  );
}

export function newCard(now: Date): CardState {
  return {
    phase: "new",
    due: now.toISOString(),
    stability: 0,
    difficulty: 0,
    reps: 0,
    lapses: 0,
  };
}

/** The card after a rating at `now`. */
export function rate(card: CardState, g: Rating, now: Date): CardState {
  const at = now.getTime();
  let { stability: s, difficulty: d } = card;
  if (card.phase === "new") {
    s = w(g - 1);
    d = initialDifficulty(g);
  } else if (card.phase === "review") {
    const elapsed = Math.max(0, (at - Date.parse(card.last ?? card.due)) / DAY);
    const r = retrievability(elapsed, s);
    s = g === 1 ? forgetStability(d, s, r) : recallStability(d, s, r, g);
    d = nextDifficulty(d, g);
  } else {
    // Learning: a pass graduates on the stability it already has.
    d = nextDifficulty(d, g);
  }
  const again = g === 1;
  return {
    phase: again ? "learning" : "review",
    due: new Date(
      again ? at + MINUTE : at + intervalDays(s) * DAY,
    ).toISOString(),
    stability: s,
    difficulty: d,
    reps: card.reps + 1,
    lapses: card.lapses + (again && card.phase === "review" ? 1 : 0),
    last: now.toISOString(),
  };
}

/** "1 min", "1 day", "3 days", "2 months": what each button would do. */
export function nextLabel(card: CardState, g: Rating, now: Date): string {
  const due = Date.parse(rate(card, g, now).due) - now.getTime();
  if (due < DAY) return `${Math.max(1, Math.round(due / MINUTE))} min`;
  const days = Math.round(due / DAY);
  if (days < 31) return `${days} day${days === 1 ? "" : "s"}`;
  if (days < 365) {
    const m = Math.round(days / 30);
    return `${m} month${m === 1 ? "" : "s"}`;
  }
  const y = Math.round((days / 365) * 10) / 10;
  return `${y} year${y === 1 ? "" : "s"}`;
}

/** Cards to review now: due ones first (oldest due first), then new. */
export function queue<T extends { id: string }>(
  cards: readonly T[],
  states: Readonly<Record<string, CardState>>,
  now: Date,
): T[] {
  const t = now.getTime();
  const due = cards
    .filter((c) => states[c.id] && Date.parse(states[c.id]!.due) <= t)
    .sort(
      (a, b) => Date.parse(states[a.id]!.due) - Date.parse(states[b.id]!.due),
    );
  const fresh = cards.filter((c) => !states[c.id]);
  return [...due, ...fresh];
}
