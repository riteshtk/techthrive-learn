import { describe, expect, it } from "vitest";
import { continueTarget } from "@/lib/roadmap";

const ids = ["a", "b", "c"];

describe("continueTarget", () => {
  it("starts at topic 1 with nothing done", () => {
    expect(continueTarget(ids, [])).toEqual({
      topicId: "a",
      label: "Continue",
    });
  });

  it("opens the first topic not yet done, even out of order", () => {
    expect(continueTarget(ids, ["a"])?.topicId).toBe("b");
    expect(continueTarget(ids, ["b"])?.topicId).toBe("a");
    expect(continueTarget(ids, ["a", "c"])?.topicId).toBe("b");
  });

  it("becomes Start again on topic 1 when all are done", () => {
    expect(continueTarget(ids, ["c", "b", "a"])).toEqual({
      topicId: "a",
      label: "Start again",
    });
  });

  it("returns nothing for an empty roadmap", () => {
    expect(continueTarget([], [])).toBeUndefined();
  });
});
