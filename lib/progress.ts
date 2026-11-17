// Which topics the learner has marked done, kept in the browser.
// One versioned key; if storage is missing or throws, progress lives in
// memory for the visit and nothing breaks.

export const PROGRESS_KEY = "ttl-learn:progress:v1";

type Stored = { done: readonly string[] };

export type ProgressStore = {
  /** Stable reference until the done list changes (for useSyncExternalStore). */
  getDone(): readonly string[];
  setDone(ids: readonly string[]): void;
  markDone(id: string): void;
  unmarkDone(id: string): void;
  reset(): void;
  subscribe(listener: () => void): () => void;
};

function parse(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === "object" &&
      value !== null &&
      Array.isArray((value as Stored).done)
    ) {
      return (value as Stored).done.filter(
        (id): id is string => typeof id === "string",
      );
    }
  } catch {
    // Corrupt value: start fresh rather than fail.
  }
  return [];
}

export function createProgressStore(
  getStorage: () => Storage | undefined,
): ProgressStore {
  const listeners = new Set<() => void>();
  let done: readonly string[] | null = null;

  function load(): readonly string[] {
    if (done === null) {
      try {
        done = parse(getStorage()?.getItem(PROGRESS_KEY) ?? null);
      } catch {
        done = [];
      }
    }
    return done;
  }

  function save(next: readonly string[]) {
    done = [...new Set(next)];
    try {
      getStorage()?.setItem(
        PROGRESS_KEY,
        JSON.stringify({ done } satisfies Stored),
      );
    } catch {
      // Storage full or blocked: keep the in-memory copy for this visit.
    }
    listeners.forEach((l) => l());
  }

  return {
    getDone: load,
    setDone: save,
    markDone: (id) => save([...load(), id]),
    unmarkDone: (id) => save(load().filter((d) => d !== id)),
    reset: () => save([]),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Only the ids that still exist; unknown ids from old content are ignored. */
export function knownDone(
  done: readonly string[],
  knownIds: readonly string[],
): string[] {
  return knownIds.filter((id) => done.includes(id));
}
