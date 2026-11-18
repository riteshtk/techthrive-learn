import { describe, expect, it } from "vitest";
import { getPlannedTopics, getTopics } from "@/content";
import { DOMAINS } from "@/content/types";
import {
  filterCatalog,
  filtersFromQuery,
  filtersToQuery,
  NO_FILTERS,
  type CatalogEntry,
} from "@/lib/catalog";

// The catalog (PRD P15): search, status and domain filters over the real
// topics and the planned ones.

const entries: CatalogEntry[] = [
  ...getTopics().map((t) => ({
    id: t.id,
    title: t.title,
    domain: t.domain,
    system: t.summary,
    tags: t.tags,
    status: t.status,
    meta: "",
  })),
  ...getPlannedTopics().map((p) => ({
    ...p,
    status: "planned" as const,
    meta: "",
  })),
];

describe("the catalog", () => {
  it("lists the live topics and the planned ones", () => {
    expect(entries.filter((e) => e.status === "live").map((e) => e.id)).toEqual(
      ["ai-agents", "foundations", "payments"],
    );
    expect(entries.filter((e) => e.status === "planned")).toHaveLength(11);
  });

  it("searches name, system and tags, not domain", () => {
    const ids = (q: string) =>
      filterCatalog(entries, { ...NO_FILTERS, q }).map((e) => e.id);
    expect(ids("IDEMPOTENCY")).toEqual(["payments"]);
    expect(ids("kafka")).toEqual(["event-streaming"]);
    expect(ids("geo-index")).toEqual(["ride-matching"]);
    expect(ids("Distributed systems")).toEqual([]);
    expect(ids("zzzz")).toEqual([]);
  });

  it("combines status and domain", () => {
    expect(
      filterCatalog(entries, {
        q: "",
        status: "planned",
        domain: "AI & ML",
      }).map((e) => e.id),
    ).toEqual(["llm-platform"]);
    expect(
      filterCatalog(entries, { q: "", status: "live", domain: "Data" }),
    ).toEqual([]);
  });

  it("keeps the filters in the address, ignoring unknown values", () => {
    const f = { q: "cache", status: "live" as const, domain: "AI & ML" };
    expect(filtersFromQuery(filtersToQuery(f), DOMAINS)).toEqual(f);
    expect(filtersToQuery(NO_FILTERS)).toBe("");
    expect(filtersFromQuery("?status=private&domain=Private", DOMAINS)).toEqual(
      NO_FILTERS,
    );
  });
});
