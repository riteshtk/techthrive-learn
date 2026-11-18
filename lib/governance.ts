// The governance timeline (spec 05 §4.3): filter by jurisdiction, mark
// past events, and place "Today" before the first event after it.

import type { Governance } from "@/content/types";

type Event = Governance["events"][number];
type Jurisdiction = Event["jurisdiction"];

export const FILTERS = {
  all: { label: "All", keeps: () => true },
  in: { label: "India", keeps: (j: Jurisdiction) => j === "IN" },
  eu: { label: "EU", keeps: (j: Jurisdiction) => j === "EU" },
  uk: { label: "UK", keeps: (j: Jurisdiction) => j === "UK" },
  vol: {
    label: "Voluntary",
    keeps: (j: Jurisdiction) => j === "NIST" || j === "OWASP",
  },
} as const;
export type FilterId = keyof typeof FILTERS;

export const JURISDICTION_LABEL: Record<Jurisdiction, string> = {
  IN: "India",
  EU: "EU",
  UK: "UK",
  NIST: "NIST",
  OWASP: "OWASP",
};

export type Row =
  | { type: "event"; event: Event; past: boolean }
  | { type: "today"; date: string };

/**
 * The rows to show. Without a date (before mount) there's no Today row and
 * nothing is marked past; an event dated today counts as past.
 */
export function timeline(
  events: readonly Event[],
  filter: FilterId,
  today: string | null,
): { rows: Row[]; count: number } {
  const kept = events.filter((e) => FILTERS[filter].keeps(e.jurisdiction));
  const rows: Row[] = [];
  let placed = today === null;
  for (const event of kept) {
    if (!placed && event.date > today!) {
      rows.push({ type: "today", date: today! });
      placed = true;
    }
    rows.push({ type: "event", event, past: !!today && event.date <= today });
  }
  if (!placed) rows.push({ type: "today", date: today! });
  return { rows, count: kept.length };
}

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

/** "2025-11-13" → "Nov 2025", for month-precision dates. */
export function monthLabel(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[(m ?? 1) - 1]} ${y}`;
}

/** Today's date, YYYY-MM-DD, in a time zone. */
export function todayIn(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
