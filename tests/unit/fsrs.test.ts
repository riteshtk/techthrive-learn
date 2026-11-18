import { describe, expect, it } from "vitest";
import {
  intervalDays,
  newCard,
  nextLabel,
  queue,
  rate,
  retrievability,
  type CardState,
} from "@/lib/fsrs";

// FSRS (PRD P14): the designed new-card ladder, a known review sequence,
// and the order cards come up in.

const NOW = new Date("2026-11-18T09:00:00Z");
const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

describe("a new card", () => {
  it("reads 1 min / 1 day / 3 days / 9 days", () => {
    const c = newCard(NOW);
    expect(
      [1, 2, 3, 4].map((g) => nextLabel(c, g as 1 | 2 | 3 | 4, NOW)),
    ).toEqual(["1 min", "1 day", "3 days", "9 days"]);
  });

  it("comes back in a minute after Again, then graduates", () => {
    const again = rate(newCard(NOW), 1, NOW);
    expect(again.phase).toBe("learning");
    expect(Date.parse(again.due) - NOW.getTime()).toBe(60_000);
    expect(again.lapses).toBe(0);
    const good = rate(again, 3, new Date(NOW.getTime() + 60_000));
    expect(good.phase).toBe("review");
    expect(intervalDays(good.stability)).toBe(1);
  });
});

describe("the FSRS formulas", () => {
  it("recall is 90% when the elapsed time equals the stability", () => {
    expect(retrievability(3, 3)).toBeCloseTo(0.9, 10);
    expect(intervalDays(3)).toBe(3);
  });

  it("follows a known sequence: Good, Good on time, then a lapse", () => {
    const c1 = rate(newCard(NOW), 3, NOW);
    expect(c1.stability).toBe(3);
    expect(c1.difficulty).toBeCloseTo(5.1618, 4);
    const c2 = rate(c1, 3, days(3));
    // S' = S(e^w8 (11 − D) S^−w9 (e^{w10(1−R)} − 1) + 1), R = 0.9
    const expected =
      3 *
      (Math.exp(1.6474) *
        (11 - 5.1618) *
        Math.pow(3, -0.1367) *
        (Math.exp(1.0461 * 0.1) - 1) +
        1);
    expect(c2.stability).toBeCloseTo(expected, 6);
    expect(c2.stability).toBeGreaterThan(c1.stability);
    const c3 = rate(c2, 1, days(3 + intervalDays(c2.stability)));
    expect(c3.phase).toBe("learning");
    expect(c3.lapses).toBe(1);
    expect(c3.stability).toBeLessThan(c2.stability);
    expect(c3.difficulty).toBeGreaterThan(c2.difficulty);
  });

  it("Easy grows stability more than Good, and Hard less", () => {
    const c1 = rate(newCard(NOW), 3, NOW);
    const s = (g: 2 | 3 | 4) => rate(c1, g, days(3)).stability;
    expect(s(4)).toBeGreaterThan(s(3));
    expect(s(3)).toBeGreaterThan(s(2));
  });
});

describe("the queue", () => {
  it("puts due cards first, oldest first, then new ones; skips cards not due", () => {
    const cards = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    const state = (due: Date): CardState => ({
      ...rate(newCard(NOW), 3, NOW),
      due: due.toISOString(),
    });
    const states = {
      a: state(days(5)),
      b: state(days(-1)),
      c: state(days(-3)),
    };
    expect(queue(cards, states, NOW).map((c) => c.id)).toEqual(["c", "b", "d"]);
  });
});
