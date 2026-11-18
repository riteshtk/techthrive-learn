"use client";

// The topic catalog (spec 01 §B2, PRD P15): search, status and domain,
// kept in the address (?q=&status=&domain=, read after mount). Planned
// topics are shown as planned and are never links.

import Link from "next/link";
import { FilterGroup, StatusPill, TextInput } from "@/components/ui/controls";
import {
  filterCatalog,
  filtersFromQuery,
  filtersToQuery,
  NO_FILTERS,
  type CatalogEntry,
  type Filters,
  type StatusFilter,
} from "@/lib/catalog";
import { useQueryState } from "@/lib/useQueryState";

export function CatalogView({
  entries,
  domains,
}: {
  entries: CatalogEntry[];
  domains: readonly string[];
}) {
  const [f, setF] = useQueryState<Filters>(
    NO_FILTERS,
    (search) => filtersFromQuery(search, domains),
    filtersToQuery,
  );

  const shown = filterCatalog(entries, f);
  const live = entries.filter((e) => e.status === "live").length;

  return (
    <>
      <div className="tt-card-l tt-cat-filters">
        <TextInput
          label="Search topics"
          icon="search"
          type="search"
          placeholder="Search topics, systems and concepts, e.g. idempotency"
          value={f.q}
          onChange={(e) => setF({ ...f, q: e.currentTarget.value })}
          className="tt-cat-search"
        />
        <FilterGroup<StatusFilter>
          label="Status"
          options={[
            {
              value: "all",
              label: (
                <>
                  All<span className="sr-only"> statuses</span>
                </>
              ),
            },
            { value: "live", label: "Live" },
            { value: "planned", label: "Planned" },
          ]}
          value={f.status}
          onChange={(status) => setF({ ...f, status })}
        />
        <FilterGroup
          label="Domain"
          options={[
            {
              value: "all",
              label: (
                <>
                  All<span className="sr-only"> domains</span>
                </>
              ),
            },
            ...domains.map((d) => ({ value: d, label: d })),
          ]}
          value={f.domain}
          onChange={(domain) => setF({ ...f, domain })}
        />
      </div>
      <p className="tt-cap tt-mono tt-cat-count" aria-live="polite">
        {shown.length} of {entries.length} topics · {live} live
      </p>
      {shown.length > 0 ? (
        <ul className="tt-cat-grid">
          {shown.map((e) => (
            <li key={e.id} className="tt-card-l tt-cat-card">
              <div className="tt-cat-top">
                <span className="tt-lbl-s">{e.domain}</span>
                <StatusPill tone={e.status === "live" ? "green" : undefined}>
                  {e.status === "live" ? "Live" : "Planned"}
                </StatusPill>
              </div>
              <h2 className="tt-cat-title">
                {e.href ? <Link href={e.href}>{e.title}</Link> : e.title}
              </h2>
              <p className="tt-body-s">{e.system}</p>
              <ul className="tt-cat-tags">
                {e.tags.map((t) => (
                  <li key={t} className="tt-chip tt-chip-compact">
                    {t}
                  </li>
                ))}
              </ul>
              <p className="tt-cap tt-mono tt-cat-foot">
                <span>{e.meta}</span>
                {e.freshness && <span>{e.freshness}</span>}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="tt-card-l tt-cat-empty" role="status">
          <p className="tt-h4">No topics match</p>
          <p className="tt-body-s">Try another domain or a shorter search.</p>
          <button
            type="button"
            className="tt-btn tt-btn-sm"
            onClick={() => setF(NO_FILTERS)}
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
