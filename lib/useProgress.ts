"use client";

import { useSyncExternalStore } from "react";
import { createProgressStore, knownDone, PROGRESS_KEY } from "./progress";

export const progressStore = createProgressStore(
  () => (typeof window === "undefined" ? undefined : window.localStorage),
  (onChange) => {
    // key is null when another tab cleared all of storage.
    const onStorage = (event: StorageEvent) => {
      if (event.key === PROGRESS_KEY || event.key === null) onChange();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  },
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
