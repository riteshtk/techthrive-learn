import { describe, expect, it } from "vitest";
import { tabIndexForKey } from "@/lib/tabs";

describe("tabIndexForKey", () => {
  it("moves with the arrows and wraps at both ends", () => {
    expect(tabIndexForKey("ArrowRight", 0, 3)).toBe(1);
    expect(tabIndexForKey("ArrowRight", 2, 3)).toBe(0);
    expect(tabIndexForKey("ArrowLeft", 0, 3)).toBe(2);
    expect(tabIndexForKey("ArrowLeft", 2, 3)).toBe(1);
  });

  it("jumps to the ends with Home and End", () => {
    expect(tabIndexForKey("Home", 2, 4)).toBe(0);
    expect(tabIndexForKey("End", 0, 4)).toBe(3);
  });

  it("uses up and down for vertical lists", () => {
    expect(tabIndexForKey("ArrowDown", 0, 3, "vertical")).toBe(1);
    expect(tabIndexForKey("ArrowRight", 0, 3, "vertical")).toBeNull();
  });

  it("ignores other keys and empty lists", () => {
    expect(tabIndexForKey("Enter", 0, 3)).toBeNull();
    expect(tabIndexForKey("ArrowRight", 0, 0)).toBeNull();
  });
});
