import { describe, expect, it } from "vitest";
import { createBrowserStore } from "@/lib/browserStore";
import {
  EMPTY_LEARNING,
  LEARNING_KEY,
  lessonKey,
  parseLearning,
  visitStep,
} from "@/lib/learning";

const T0 = "2026-11-18T10:00:00.000Z";
const T1 = "2026-11-18T10:05:00.000Z";
const KEY = lessonKey("ai-agents", "agent-anatomy");

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

describe("lesson progress", () => {
  it("records the step, the furthest step and when it started", () => {
    let s = visitStep(EMPTY_LEARNING, KEY, 1, 10, T0);
    s = visitStep(s, KEY, 4, 10, T1);
    s = visitStep(s, KEY, 2, 10, T1);
    expect(s.lessons[KEY]).toEqual({
      step: 2,
      maxStep: 4,
      startedAt: T0,
      updatedAt: T1,
    });
  });

  it("is done once the last step is reached, and stays done", () => {
    let s = visitStep(EMPTY_LEARNING, KEY, 10, 10, T0);
    expect(s.lessons[KEY]?.doneAt).toBe(T0);
    s = visitStep(s, KEY, 3, 10, T1);
    expect(s.lessons[KEY]?.doneAt).toBe(T0);
  });

  it("returns the same object when nothing changes", () => {
    const s = visitStep(EMPTY_LEARNING, KEY, 3, 10, T0);
    expect(visitStep(s, KEY, 3, 10, T1)).toBe(s);
  });

  it("reads only well-formed records", () => {
    expect(
      parseLearning({
        lessons: {
          [KEY]: { step: 3, maxStep: 5, startedAt: T0, updatedAt: T1 },
          "bad key!": { step: 1, maxStep: 1, startedAt: T0, updatedAt: T0 },
          "a/b": { step: 0, maxStep: 1, startedAt: T0, updatedAt: T0 },
          "c/d": { step: 2, maxStep: 2, startedAt: "soon", updatedAt: T0 },
        },
      }),
    ).toEqual({
      lessons: { [KEY]: { step: 3, maxStep: 5, startedAt: T0, updatedAt: T1 } },
      checkpoints: {},
    });
    expect(parseLearning("nonsense")).toEqual(EMPTY_LEARNING);
    expect(parseLearning(null)).toEqual(EMPTY_LEARNING);
  });
});

describe("the browser store", () => {
  const make = (getStorage: () => Storage | undefined) =>
    createBrowserStore({
      key: LEARNING_KEY,
      parse: parseLearning,
      empty: EMPTY_LEARNING,
      getStorage,
    });

  it("saves under its versioned key and reads it back", () => {
    const storage = memoryStorage();
    make(() => storage).update((s) => visitStep(s, KEY, 2, 10, T0));
    expect(JSON.parse(storage.getItem(LEARNING_KEY)!)).toMatchObject({
      lessons: { [KEY]: { step: 2 } },
    });
    expect(make(() => storage).get().lessons[KEY]?.step).toBe(2);
  });

  it("applies a change to what another tab saved since", () => {
    const storage = memoryStorage();
    const a = make(() => storage);
    const b = make(() => storage);
    a.update((s) => visitStep(s, KEY, 2, 10, T0));
    b.get();
    a.update((s) => visitStep(s, "payments/x", 1, 10, T0));
    b.update((s) => visitStep(s, KEY, 3, 10, T1));
    expect(Object.keys(make(() => storage).get().lessons).sort()).toEqual([
      KEY,
      "payments/x",
    ]);
  });

  it("keeps working in memory when storage throws or is full", () => {
    const blocked = make(() => {
      throw new Error("blocked");
    });
    blocked.update((s) => visitStep(s, KEY, 4, 10, T0));
    expect(blocked.get().lessons[KEY]?.step).toBe(4);

    const full = memoryStorage();
    full.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    const store = make(() => full);
    store.update((s) => visitStep(s, KEY, 5, 10, T0));
    store.update((s) => visitStep(s, KEY, 6, 10, T1));
    expect(store.get().lessons[KEY]).toMatchObject({ step: 6, maxStep: 6 });
  });

  it("reads a corrupt value as empty, and resets", () => {
    const storage = memoryStorage();
    storage.setItem(LEARNING_KEY, "{not json");
    const store = make(() => storage);
    expect(store.get()).toEqual(EMPTY_LEARNING);
    store.update((s) => visitStep(s, KEY, 2, 10, T0));
    store.reset();
    expect(store.get()).toEqual(EMPTY_LEARNING);
    expect(storage.getItem(LEARNING_KEY)).toBeNull();
  });
});
