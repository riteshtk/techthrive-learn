// The topic catalog's filters (spec 01 §B2, PRD P15): a search over each
// topic's name, system line and tags, AND a status, AND a domain.

export type CatalogEntry = {
  id: string;
  title: string;
  domain: string;
  system: string;
  tags: readonly string[];
  status: "live" | "planned";
  /** Live topics only: "10 lessons · about 2 hours", the verified date. */
  meta: string;
  freshness?: string;
  href?: string;
};

export const STATUSES = ["all", "live", "planned"] as const;
export type StatusFilter = (typeof STATUSES)[number];

export type Filters = { q: string; status: StatusFilter; domain: string };

export const NO_FILTERS: Filters = { q: "", status: "all", domain: "all" };

export function filterCatalog(
  entries: readonly CatalogEntry[],
  f: Filters,
): CatalogEntry[] {
  const q = f.q.trim().toLowerCase();
  return entries.filter(
    (e) =>
      (f.status === "all" || e.status === f.status) &&
      (f.domain === "all" || e.domain === f.domain) &&
      (!q ||
        `${e.title} ${e.system} ${e.tags.join(" ")}`.toLowerCase().includes(q)),
  );
}

/** ?q=…&status=live&domain=Data, leaving defaults out. */
export function filtersToQuery(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.status !== "all") p.set("status", f.status);
  if (f.domain !== "all") p.set("domain", f.domain);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function filtersFromQuery(
  search: string,
  domains: readonly string[],
): Filters {
  const p = new URLSearchParams(search);
  const status = p.get("status");
  const domain = p.get("domain");
  return {
    q: (p.get("q") ?? "").slice(0, 80),
    status: STATUSES.includes(status as StatusFilter)
      ? (status as StatusFilter)
      : "all",
    domain: domain && domains.includes(domain) ? domain : "all",
  };
}
