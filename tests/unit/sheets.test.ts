import { describe, expect, it } from "vitest";
import { getTool } from "@/content";

// Cheatsheets (PRD P13). Code wells skip the figure rule, so the sums
// they show are checked here.

const sheets = getTool("ai-agents", "sheets")!;

const C = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
};
const passAt = (n: number, c: number, k: number) => 1 - C(n - c, k) / C(n, k);
const passHat = (n: number, c: number, k: number) => C(c, k) / C(n, k);

describe("the pass^k sheet", () => {
  const code = sheets.sheets.find((s) => s.title === "pass@k vs pass^k")!.body;

  it("shows the example's sums correctly", () => {
    expect(code.type).toBe("code");
    if (code.type !== "code") return;
    expect(passAt(8, 6, 1)).toBeCloseTo(0.75, 10);
    expect(code.code).toContain("pass@1 = 0.75");
    expect(passAt(8, 6, 4)).toBe(1);
    expect(code.code).toContain("pass@4 = 1.00");
    expect([C(6, 4), C(8, 4)]).toEqual([15, 70]);
    expect(passHat(8, 6, 4)).toBeCloseTo(0.214, 3);
    expect(code.code).toContain("pass^4 = 15 / 70 ≈ 0.21");
  });
});

describe("the sheets", () => {
  it("number ten, each sourced in the register", () => {
    expect(sheets.sheets).toHaveLength(10);
    for (const s of sheets.sheets)
      if (s.body.type !== "risks")
        expect(s.facts.length, s.title).toBeGreaterThan(0);
  });
});
