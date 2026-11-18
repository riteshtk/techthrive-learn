// A value kept in the browser under one versioned localStorage key, shared
// by every open tab. If storage is missing, full or throws, the value lives
// in memory for the visit and nothing breaks; a corrupt value reads as
// empty. Lesson progress, checkpoint answers and the review schedule all
// use it.

export type BrowserStore<T> = {
  /** Stable reference until the value changes (for useSyncExternalStore). */
  get(): T;
  /** Applies a change to the latest stored value (another tab may have
      written since this one last read). */
  update(change: (current: T) => T): void;
  reset(): void;
  subscribe(listener: () => void): () => void;
};

export function createBrowserStore<T>(options: {
  key: string;
  /** Turns whatever is stored into a valid value, or `empty`. */
  parse: (raw: unknown) => T;
  empty: T;
  getStorage: () => Storage | undefined;
  /** Reports changes made in other tabs. */
  watch?: (key: string, onChange: () => void) => () => void;
}): BrowserStore<T> {
  const { key, parse, empty, getStorage, watch } = options;
  const listeners = new Set<() => void>();
  let value: T | null = null;
  // The stored text `value` was read from. Every get compares it with
  // storage, so a change another tab made while nothing here was
  // subscribed is still seen.
  let text: string | null = null;
  // False once a write fails: storage then lags memory and isn't reread.
  let stored = true;
  let unwatch: (() => void) | undefined;

  function readText(): string | null {
    try {
      return getStorage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  function get(): T {
    if (value !== null && !stored) return value;
    const now = readText();
    if (value === null || now !== text) {
      text = now;
      try {
        value = now === null ? empty : parse(JSON.parse(now));
      } catch {
        value = empty;
      }
    }
    return value;
  }

  function save(next: T) {
    value = next;
    try {
      const storage = getStorage();
      const json = JSON.stringify(next);
      storage?.setItem(key, json);
      stored = storage !== undefined;
      text = json;
    } catch {
      stored = false;
    }
    listeners.forEach((l) => l());
  }

  return {
    get,
    update(change) {
      save(change(get()));
    },
    reset() {
      try {
        getStorage()?.removeItem(key);
        stored = true;
        text = null;
      } catch {
        // Blocked: clearing memory is enough for this visit.
        stored = false;
      }
      value = empty;
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1 && watch)
        unwatch = watch(key, () => {
          if (stored) listeners.forEach((l) => l());
        });
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          unwatch?.();
          unwatch = undefined;
        }
      };
    },
  };
}

/** An ISO date and time, as the stores keep them. */
export const isIso = (v: unknown): v is string =>
  typeof v === "string" && !Number.isNaN(Date.parse(v));

/** A "topic/id" key, as progress and the review schedule are keyed. */
export const isStoreKey = (k: string) => /^[a-z0-9-]+\/[a-z0-9-]+$/.test(k);

/** The browser's localStorage, and the storage event for other tabs. */
export const localStorageOf = () =>
  typeof window === "undefined" ? undefined : window.localStorage;

export function watchOtherTabs(key: string, onChange: () => void) {
  // key is null when another tab cleared all of storage.
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}
