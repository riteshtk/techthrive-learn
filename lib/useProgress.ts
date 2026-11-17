"use client";

import { useSyncExternalStore } from "react";
import { createProgressStore, knownDone } from "./progress";

export const progressStore = createProgressStore(() =>
  typeof window === "undefined" ? undefined : window.localStorage,
);

/**
 * Done topic ids among `knownIds`, or null before the browser store is read
 * (during prerender and hydration), so callers can hold a fixed-size slot.
 */
export function useProgress(knownIds: readonly string[]): string[] | null {
  const done = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getDone,
    () => null,
  );
  return done === null ? null : knownDone(done, knownIds);
}
