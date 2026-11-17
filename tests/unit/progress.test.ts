import { describe, expect, it, vi } from "vitest";
import { createProgressStore, knownDone, PROGRESS_KEY } from "@/lib/progress";

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  };
}

describe("progress store", () => {
  it("writes under one versioned key", () => {
    const storage = memoryStorage();
    const store = createProgressStore(() => storage);
    store.markDone("rag");
    expect(storage.getItem(PROGRESS_KEY)).toBe('{"done":["rag"]}');
  });

  it("reads what an earlier visit stored", () => {
    const storage = memoryStorage({
      [PROGRESS_KEY]: '{"done":["rag","agent-loop"]}',
    });
    expect(createProgressStore(() => storage).getDone()).toEqual([
      "rag",
      "agent-loop",
    ]);
  });

  it("marks, unmarks, de-duplicates and resets", () => {
    const store = createProgressStore(() => memoryStorage());
    store.markDone("rag");
    store.markDone("rag");
    store.markDone("agent-loop");
    expect(store.getDone()).toEqual(["rag", "agent-loop"]);
    store.unmarkDone("rag");
    expect(store.getDone()).toEqual(["agent-loop"]);
    store.reset();
    expect(store.getDone()).toEqual([]);
  });

  it("keeps the same snapshot until something changes", () => {
    const store = createProgressStore(() => memoryStorage());
    const first = store.getDone();
    expect(store.getDone()).toBe(first);
    store.markDone("rag");
    expect(store.getDone()).not.toBe(first);
  });

  it("notifies subscribers and stops after unsubscribe", () => {
    const store = createProgressStore(() => memoryStorage());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.markDone("rag");
    unsubscribe();
    store.markDone("agent-loop");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("ignores corrupt or wrongly shaped data", () => {
    for (const raw of [
      "not json",
      '{"done":"rag"}',
      "[1,2]",
      '{"done":[1,"rag"]}',
    ]) {
      const storage = memoryStorage({ [PROGRESS_KEY]: raw });
      const done = createProgressStore(() => storage).getDone();
      expect(done.every((id) => typeof id === "string")).toBe(true);
    }
  });

  it("keeps progress in memory when storage throws", () => {
    const broken = {
      getItem() {
        throw new Error("SecurityError");
      },
      setItem() {
        throw new Error("QuotaExceededError");
      },
    } as unknown as Storage;
    const store = createProgressStore(() => broken);
    expect(store.getDone()).toEqual([]);
    expect(() => store.markDone("rag")).not.toThrow();
    expect(store.getDone()).toEqual(["rag"]);
  });

  it("works with no storage at all", () => {
    const store = createProgressStore(() => undefined);
    store.markDone("rag");
    expect(store.getDone()).toEqual(["rag"]);
  });
});

describe("knownDone", () => {
  it("drops ids that no longer exist and keeps content order", () => {
    expect(
      knownDone(
        ["old-topic", "rag", "how-an-llm-answers"],
        ["how-an-llm-answers", "rag", "agent-loop"],
      ),
    ).toEqual(["how-an-llm-answers", "rag"]);
  });
});
