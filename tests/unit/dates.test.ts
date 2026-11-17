import { expect, it } from "vitest";
import { formatDate } from "@/lib/dates";

it("formats ISO dates the same on every machine", () => {
  expect(formatDate("2026-11-17")).toBe("17 Nov 2026");
  expect(formatDate("2026-01-05")).toBe("5 Jan 2026");
  expect(formatDate("not a date")).toBe("not a date");
});
