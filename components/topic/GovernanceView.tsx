"use client";

// Governance (spec 05 §4, PRD P11). The jurisdiction filter is a pressed-
// button group over one list (the spec's accessibility note); "Today" is
// the current date in India, placed after mount so the page stays static.
// ?j=in|eu|uk|vol picks a filter.

import { useSyncExternalStore } from "react";
import { FilterGroup } from "@/components/ui/controls";
import type { Governance } from "@/content/types";
import { formatDate } from "@/lib/dates";
import { useQueryState } from "@/lib/useQueryState";
import {
  FILTERS,
  JURISDICTION_LABEL,
  monthLabel,
  timeline,
  todayIn,
  type FilterId,
} from "@/lib/governance";

const noop = () => () => {};

export function GovernanceView({ data }: { data: Governance }) {
  const [filter, setFilter] = useQueryState<FilterId>(
    "all",
    (search) => {
      const asked = new URLSearchParams(search).get("j");
      return asked && Object.hasOwn(FILTERS, asked)
        ? (asked as FilterId)
        : "all";
    },
    (j) => (j === "all" ? "" : `?${new URLSearchParams({ j })}`),
  );
  const today = useSyncExternalStore(
    noop,
    () => todayIn("Asia/Kolkata"),
    () => null,
  );

  const { rows, count } = timeline(data.events, filter, today);

  return (
    <>
      <FilterGroup
        label="Jurisdiction"
        options={(Object.keys(FILTERS) as FilterId[]).map((id) => ({
          value: id,
          label: FILTERS[id].label,
        }))}
        value={filter}
        onChange={setFilter}
      />
      <div className="tt-gov-body">
        <section
          className="tt-card-l tt-gov-timeline"
          aria-labelledby="timeline-title"
        >
          <div className="tt-gov-head">
            <h2 id="timeline-title" className="tt-lbl">
              Timeline · {FILTERS[filter].label}
            </h2>
            <span className="tt-cap" aria-live="polite">
              {count} dates
            </span>
          </div>
          <ol className="tt-gov-events">
            {rows.map((r) =>
              r.type === "today" ? (
                <li key="today" className="tt-gov-ev today">
                  <time className="tt-gov-date" dateTime={r.date}>
                    {formatDate(r.date)}
                  </time>
                  <span className="tt-gov-pin">
                    <span className="tt-live" aria-hidden="true" />
                  </span>
                  <span className="tt-h4">Today</span>
                </li>
              ) : (
                <li
                  key={`${r.event.date}-${r.event.title}`}
                  className={`tt-gov-ev${r.past ? " past" : ""}`}
                >
                  <time className="tt-gov-date" dateTime={r.event.date}>
                    {r.event.precision === "month"
                      ? monthLabel(r.event.date)
                      : formatDate(r.event.date)}
                  </time>
                  <span className="tt-gov-pin" aria-hidden="true">
                    <span className="tt-gov-dot" />
                  </span>
                  <div className="tt-gov-ev-main">
                    <p className="tt-gov-ev-title">
                      <span className="tt-h4">{r.event.title}</span>
                      <span className="tt-gov-jur">
                        {JURISDICTION_LABEL[r.event.jurisdiction]}
                      </span>
                      {today && (
                        <span className="sr-only">
                          {r.past ? ", past" : ", upcoming"}
                        </span>
                      )}
                    </p>
                    <p className="tt-body-s">{r.event.description}</p>
                  </div>
                </li>
              ),
            )}
          </ol>
        </section>

        <aside className="tt-gov-side" aria-label="Penalties and frameworks">
          <div className="tt-card-l tt-gov-card">
            <h2 className="tt-lbl">{data.penalties.title}</h2>
            <dl className="tt-gov-pen">
              {data.penalties.rows.map((p) => (
                <div key={p.label}>
                  <dt className="tt-body-s">{p.label}</dt>
                  <dd className="tt-num">{p.value}</dd>
                </div>
              ))}
            </dl>
            <p className="tt-cap">{data.penalties.note}</p>
          </div>
          {data.frameworks.map((fw) => (
            <div key={fw.title} className="tt-card-l tt-gov-card">
              <h2 className="tt-lbl">{fw.title}</h2>
              <ul className="tt-gov-chips">
                {fw.items.map((i) => (
                  <li key={i} className="tt-chip">
                    {i}
                  </li>
                ))}
              </ul>
              {fw.subhead && <p className="tt-lbl-s">{fw.subhead}</p>}
              <p className="tt-cap">{fw.note}</p>
            </div>
          ))}
        </aside>
      </div>

      <section
        className="tt-card-l tt-gov-xw"
        aria-labelledby="crosswalk-title"
      >
        <div className="tt-gov-head">
          <h2 id="crosswalk-title" className="tt-lbl">
            {data.crosswalk.title}
          </h2>
          <span className="tt-cap">{data.crosswalk.note}</span>
        </div>
        <table className="tt-gov-table">
          <thead>
            <tr>
              {data.crosswalk.columns.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.crosswalk.rows.map((r) => (
              <tr key={r.control}>
                <th scope="row">{r.control}</th>
                {r.cells.map((cell, i) => (
                  <td key={i} data-label={data.crosswalk.columns[i + 1]}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
