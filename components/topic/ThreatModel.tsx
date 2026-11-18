"use client";

// The threat model (spec 05 §3, PRD P10). The risk list is a vertical
// tablist (arrow keys move and select) with the detail as its panel; the
// matrix is a real table, turned on its side on phones (approved still).
// ?risk=ASI03 picks a risk, read after mount so the page stays static.

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import type { Threats } from "@/content/types";
import { rankChange, STATUS } from "@/lib/threats";

type Risk = Threats["risks"][number];

const DEFAULT = "ASI03";

export function ThreatModel({ data }: { data: Threats }) {
  const [sel, setSel] = useState(DEFAULT);
  const mounted = useRef(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const asked = new URLSearchParams(location.search).get("risk");
    if (asked && data.risks.some((r) => r.id === asked))
      queueMicrotask(() => setSel(asked));
    mounted.current = true;
  }, [data]);
  useEffect(() => {
    if (!mounted.current) return;
    const url = new URL(location.href);
    if (sel === DEFAULT) url.searchParams.delete("risk");
    else url.searchParams.set("risk", sel);
    history.replaceState(history.state, "", url);
  }, [sel]);

  const index = Math.max(
    0,
    data.risks.findIndex((r) => r.id === sel),
  );
  const cur: Risk = data.risks[index]!;
  const go = (i: number, focus = false) => {
    const n = (i + data.risks.length) % data.risks.length;
    setSel(data.risks[n]!.id);
    if (focus) tabs.current[n]?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowRight: index + 1,
      ArrowUp: index - 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: data.risks.length - 1,
    };
    const to = keys[e.key];
    if (to === undefined) return;
    e.preventDefault();
    go(to, true);
  };
  const prev = data.risks[(index - 1 + data.risks.length) % data.risks.length]!;
  const next = data.risks[(index + 1) % data.risks.length]!;
  const short = (c: Threats["components"][number]) =>
    c.short === c.name ? c.name : <abbr title={c.name}>{c.short}</abbr>;

  return (
    <>
      <div className="tt-thr-body">
        <div
          className="tt-card-l tt-thr-list"
          role="tablist"
          aria-orientation="vertical"
          aria-label="Agentic risks"
          onKeyDown={onKey}
        >
          {data.risks.map((r, i) => (
            <button
              key={r.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`risk-${r.id}`}
              aria-selected={r.id === cur.id}
              aria-controls="risk-panel"
              tabIndex={r.id === cur.id ? 0 : -1}
              className="tt-thr-risk"
              onClick={() => setSel(r.id)}
            >
              <span className="tt-thr-id">{r.id}</span>
              <span className="tt-thr-name">{r.name}</span>
              <span className={`tt-thr-st st-${r.status}`}>
                <span className="tt-thr-dot" aria-hidden="true" />
                <span className="tt-thr-st-word">{STATUS[r.status]}</span>
              </span>
            </button>
          ))}
        </div>

        <section
          className="tt-card-l tt-thr-detail"
          role="tabpanel"
          id="risk-panel"
          aria-labelledby={`risk-${cur.id}`}
        >
          <div className="tt-thr-chips">
            <span className="tt-chip tt-chip-on">{cur.id}</span>
            <span className={`tt-chip tt-thr-status st-${cur.status}`}>
              {STATUS[cur.status]}
            </span>
            <span className="tt-cap tt-mono">
              Closest LLM Top 10 2026: {cur.related}
            </span>
          </div>
          <h2 className="tt-h2">{cur.name}</h2>
          <p className="tt-body tt-muted">{cur.description}</p>
          <div className="tt-thr-scene">
            <p className="tt-lbl-s">In the card-dispute agent</p>
            <p className="tt-body-s">{cur.scene}</p>
          </div>
          <div className="tt-thr-grid">
            <div className="tt-panel-2">
              <p className="tt-lbl-s">Controls</p>
              <ul className="tt-thr-controls">
                {cur.controls.map((c) => (
                  <li key={c}>
                    <Icon name="check" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="tt-panel-2">
              <p className="tt-lbl-s">Test that proves it</p>
              <p className="tt-body-s">{cur.test}</p>
              <p className="tt-lbl-s tt-thr-owner">Owner</p>
              <p className="tt-body-s">{cur.owner}</p>
              <p className="tt-lbl-s tt-thr-owner">Lands on</p>
              <p className="tt-body-s">
                {cur.components
                  .map((id) => data.components.find((c) => c.id === id)!.name)
                  .join(" · ")}
              </p>
            </div>
          </div>
          <div className="tt-thr-nav">
            <button
              type="button"
              className="tt-btn"
              onClick={() => go(index - 1)}
            >
              <span aria-hidden="true">←</span> {prev.id}
              <span className="sr-only">, previous risk</span>
            </button>
            <button
              type="button"
              className="tt-btn"
              onClick={() => go(index + 1)}
            >
              {next.id}
              <span className="sr-only">, next risk</span>
              <Icon name="arrow-right" />
            </button>
          </div>
        </section>
      </div>

      <div className="tt-thr-body">
        <section
          className="tt-card-l tt-thr-matrix"
          aria-labelledby="matrix-title"
        >
          <div className="tt-thr-matrix-head">
            <h2 id="matrix-title" className="tt-lbl">
              Where each risk lands · by component
            </h2>
            <span className="tt-cap tt-thr-legend" aria-hidden="true">
              <span className="tt-thr-cell on" /> selected risk
              <span className="tt-thr-cell" /> other risks
            </span>
          </div>
          {/* Desktop: a row per risk. */}
          <div
            className="tt-thr-scroll tt-thr-wide"
            role="region"
            aria-label="Risks by component"
            tabIndex={0}
          >
            <table className="tt-thr-table">
              <thead>
                <tr>
                  <td />
                  {data.components.map((c) => (
                    <th key={c.id} scope="col">
                      {short(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.risks.map((r) => (
                  <tr key={r.id} className={r.id === cur.id ? "on" : undefined}>
                    <th scope="row">{r.id}</th>
                    {data.components.map((c) => (
                      <td key={c.id}>
                        {r.components.includes(c.id) && (
                          <>
                            <span
                              className={`tt-thr-cell${r.id === cur.id ? " on" : ""}`}
                              aria-hidden="true"
                            />
                            <span className="sr-only">lands here</span>
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Phones: a row per component. */}
          <div className="tt-thr-narrow">
            <table className="tt-thr-table">
              <thead>
                <tr>
                  <td />
                  {data.risks.map((r) => (
                    <th
                      key={r.id}
                      scope="col"
                      className={r.id === cur.id ? "on" : undefined}
                    >
                      <abbr title={`${r.id} ${r.name}`}>{r.id.slice(3)}</abbr>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.components.map((c) => (
                  <tr key={c.id}>
                    <th scope="row">{c.name}</th>
                    {data.risks.map((r) => (
                      <td
                        key={r.id}
                        className={r.id === cur.id ? "on" : undefined}
                      >
                        {r.components.includes(c.id) && (
                          <>
                            <span
                              className={`tt-thr-cell${r.id === cur.id ? " on" : ""}`}
                              aria-hidden="true"
                            />
                            <span className="sr-only">lands here</span>
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="tt-card-l tt-thr-llm" aria-labelledby="llm-title">
          <h2 id="llm-title" className="tt-lbl">
            {data.related.title}
          </h2>
          <ol className="tt-thr-llm-list">
            {data.related.items.map((item, i) => {
              const c = rankChange(item, i + 1);
              return (
                <li key={item.id}>
                  <span className="tt-thr-id">{item.id}</span>
                  <span className="tt-body-s">
                    {item.name}
                    {item.wasName && (
                      <span className="tt-thr-was">was {item.wasName}</span>
                    )}
                  </span>
                  <span className={`tt-thr-change${c.up ? " up" : ""}`}>
                    {c.text}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="tt-cap tt-mono">{data.related.note}</p>
        </aside>
      </div>
    </>
  );
}
