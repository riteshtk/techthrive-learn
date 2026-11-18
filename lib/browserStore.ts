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
  // False once a write fails: storage then lags memory and isn't reread.
  let stored = true;
  let unwatch: (() => void) | undefined;

  function read(): T {
    try {
      const raw = getStorage()?.getItem(key) ?? null;
      return raw === null ? empty : parse(JSON.parse(raw));
    } catch {
      return empty;
    }
  }

  function get(): T {
    value ??= read();
    return value;
  }

  function save(next: T) {
    value = next;
    try {
      const storage = getStorage();
      storage?.setItem(key, JSON.stringify(next));
      stored = storage !== undefined;
    } catch {
      stored = false;
    }
    listeners.forEach((l) => l());
  }

  return {
    get,
    update(change) {
      if (stored) value = null;
      save(change(get()));
    },
    reset() {
      try {
        getStorage()?.removeItem(key);
      } catch {
        // Blocked: clearing memory is enough for this visit.
      }
      value = empty;
      stored = true;
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1 && watch)
        unwatch = watch(key, () => {
          if (!stored) return;
          value = null;
          listeners.forEach((l) => l());
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
