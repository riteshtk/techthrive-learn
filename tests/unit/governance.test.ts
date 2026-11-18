import { describe, expect, it } from "vitest";
import type { Governance } from "@/content/types";
import { monthLabel, timeline, todayIn } from "@/lib/governance";

// The governance timeline (PRD P11): filters, past marks and where Today
// goes, with a fixed clock.

const ev = (
  date: string,
  jurisdiction: Governance["events"][number]["jurisdiction"],
) => ({
  date,
  precision: "day" as const,
  jurisdiction,
  title: date,
  description: "",
  facts: ["x"],
});

const EVENTS = [
  ev("2024-05-17", "UK"),
  ev("2024-07-26", "NIST"),
  ev("2025-08-13", "IN"),
  ev("2025-12-09", "OWASP"),
  ev("2026-11-18", "IN"),
  ev("2026-12-02", "EU"),
  ev("2027-12-02", "EU"),
];

const shape = (rows: ReturnType<typeof timeline>["rows"]) =>
  rows.map((r) =>
    r.type === "today" ? "TODAY" : `${r.event.date}${r.past ? " past" : ""}`,
  );

describe("the timeline", () => {
  it("puts Today before the first later event; today's event counts as past", () => {
    expect(shape(timeline(EVENTS, "all", "2026-11-18").rows)).toEqual([
      "2024-05-17 past",
      "2024-07-26 past",
      "2025-08-13 past",
      "2025-12-09 past",
      "2026-11-18 past",
      "TODAY",
      "2026-12-02",
      "2027-12-02",
    ]);
  });

  it("puts Today last when every event is past", () => {
    expect(shape(timeline(EVENTS, "uk", "2026-11-18").rows)).toEqual([
      "2024-05-17 past",
      "TODAY",
    ]);
  });

  it("filters by jurisdiction, voluntary being NIST and OWASP; Today isn't counted", () => {
    expect(timeline(EVENTS, "all", "2026-11-18").count).toBe(7);
    expect(timeline(EVENTS, "in", "2026-11-18").count).toBe(2);
    expect(timeline(EVENTS, "eu", "2026-11-18").count).toBe(2);
    expect(timeline(EVENTS, "vol", "2026-11-18").count).toBe(2);
  });

  it("before mount, marks nothing and has no Today", () => {
    expect(shape(timeline(EVENTS, "eu", null).rows)).toEqual([
      "2026-12-02",
      "2027-12-02",
    ]);
  });
});

describe("dates", () => {
  it("shows month-precision dates as month and year", () => {
    expect(monthLabel("2025-11-13")).toBe("Nov 2025");
  });

  it("takes today in India, not UTC", () => {
    // 20:00 UTC on 17 Nov is 01:30 on 18 Nov in India.
    expect(todayIn("Asia/Kolkata", new Date("2026-11-17T20:00:00Z"))).toBe(
      "2026-11-18",
    );
  });
});
