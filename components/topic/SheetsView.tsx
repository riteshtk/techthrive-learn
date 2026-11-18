// Cheatsheets (spec 05 §7, PRD P13): every sheet rendered on the server.
// Prices come from the rate card, risk lists from the threat model and
// dates from the governance timeline.

import Link from "next/link";
import { PageIcon } from "@/components/ui/PageIcon";
import type { Governance, Sheets, Threats } from "@/content/types";
import { BATCH_DISCOUNT, MODEL_KEYS, MODELS } from "@/lib/claudePrices";
import { formatDate } from "@/lib/dates";
import { monthLabel } from "@/lib/governance";
import { rankChange } from "@/lib/threats";

type Sheet = Sheets["sheets"][number];

/** Labels are set in capitals; τ must stay a lowercase tau, or it reads
    as "T" (τ-bench). */
function Label({ text }: { text: string }) {
  const i = text.indexOf("τ");
  if (i < 0) return <>{text}</>;
  const end = text.indexOf(" ", i);
  const word = end < 0 ? text.slice(i) : text.slice(i, end);
  return (
    <>
      {text.slice(0, i)}
      <span className="tt-nocaps">{word}</span>
      {text.slice(i + word.length)}
    </>
  );
}

/** "8", "0.20", "2.50", "0.125": prices as the sheet prints them. */
function price(v: number): string {
  if (Number.isInteger(v)) return String(v);
  const digits = Math.max(2, (String(v).split(".")[1] ?? "").length);
  return v.toFixed(digits);
}

function PriceTable() {
  // Most capable first, as designed; Haiku's two tiers in order.
  const rows = [...MODEL_KEYS].reverse().flatMap((k) => {
    const m = MODELS[k];
    return m.long
      ? [
          [`${m.name} ≤100k`, m.prices] as const,
          [`${m.name} >100k`, m.long] as const,
        ]
      : [[m.name, m.prices] as const];
  });
  return (
    <table className="tt-sh-prices">
      <thead>
        <tr>
          <th scope="col">Model</th>
          <th scope="col">In</th>
          <th scope="col">Out</th>
          <th scope="col">Hit</th>
          <th scope="col">5m write</th>
          <th scope="col">Batch in / out</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, p]) => (
          <tr key={name}>
            <th scope="row">{name}</th>
            <td data-label="In">{price(p.input)}</td>
            <td data-label="Out">{price(p.output)}</td>
            <td data-label="Hit">{price(p.cacheHit)}</td>
            <td data-label="5m write">{price(p.cacheWrite5m)}</td>
            <td data-label="Batch">
              {price(p.input * (1 - BATCH_DISCOUNT))} /{" "}
              {price(p.output * (1 - BATCH_DISCOUNT))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Body({
  sheet,
  threats,
  governance,
}: {
  sheet: Sheet;
  threats?: Threats;
  governance?: Governance;
}) {
  const b = sheet.body;
  switch (b.type) {
    case "kv":
      return (
        <>
          <dl className="tt-sh-kv">
            {b.rows.map((r) => (
              <div key={r.k}>
                <dt>{r.k}</dt>
                <dd>{r.v}</dd>
              </div>
            ))}
          </dl>
          {b.aside && <p className="tt-sh-aside">{b.aside}</p>}
        </>
      );
    case "code":
      return (
        <>
          <pre className="tt-sh-code">{b.code}</pre>
          {b.text && <p className="tt-body-s">{b.text}</p>}
        </>
      );
    case "prices":
      return <PriceTable />;
    case "risks": {
      const items =
        b.list === "threats"
          ? (threats?.risks ?? []).map((r) => ({
              id: r.id,
              name: r.name,
              change: undefined,
            }))
          : (threats?.related.items ?? []).map((r, i) => ({
              id: r.id,
              name: r.name,
              change: rankChange(r, i + 1),
            }));
      return (
        <ol className="tt-sh-list">
          {items.map((r) => (
            <li key={r.id}>
              <span className="tt-sh-id">{r.id}</span>
              <span>{r.name}</span>
              {r.change && (
                <span className={`tt-sh-change${r.change.up ? " up" : ""}`}>
                  {r.change.text}
                </span>
              )}
            </li>
          ))}
        </ol>
      );
    }
    case "dates":
      return (
        <dl className="tt-sh-kv">
          {b.picks.map((p) => {
            const e = governance?.events.find((x) => x.date === p.date);
            return (
              <div key={p.label}>
                <dt>{p.label}</dt>
                <dd>
                  <time dateTime={p.date}>
                    {e?.precision === "month"
                      ? monthLabel(p.date)
                      : formatDate(p.date)}
                  </time>
                </dd>
              </div>
            );
          })}
        </dl>
      );
  }
}

export function SheetsView({
  topic,
  data,
  threats,
  governance,
}: {
  topic: string;
  data: Sheets;
  threats?: Threats;
  governance?: Governance;
}) {
  return (
    <>
      <div className="tt-sh-grid">
        {data.sheets.map((s, i) => (
          <section
            key={s.title}
            className="tt-card-l tt-sh"
            aria-labelledby={`sheet-${i}`}
          >
            <p className="tt-lbl-s">
              {String(i + 1).padStart(2, "0")} · <Label text={s.label} />
            </p>
            <h2 id={`sheet-${i}`} className="tt-h3">
              {s.title}
            </h2>
            <Body sheet={s} threats={threats} governance={governance} />
            {s.caption && <p className="tt-cap">{s.caption}</p>}
            {s.body.type === "dates" && governance && (
              <Link
                href={`/topics/${topic}/governance/`}
                className="tt-btn tt-btn-sm tt-sh-more"
              >
                <PageIcon name="calendar" />
                Full timeline
              </Link>
            )}
          </section>
        ))}
      </div>
      <footer className="tt-sh-foot">
        <p className="tt-cap">{data.footer}</p>
        <p className="tt-lbl-s">techthrive.ai</p>
      </footer>
    </>
  );
}
