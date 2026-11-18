"use client";

// The cost model tool (spec 05 §1, PRD P9). Everything recalculates as an
// input changes; the inputs live in the query so a scenario can be linked
// (read after mount, so the page stays static).

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Range } from "@/components/ui/controls";
import {
  MIN_CACHE_PREFIX,
  MODEL_KEYS,
  MODELS,
  TOOL_USE_OVERHEAD,
  type ModelKey,
} from "@/lib/claudePrices";
import { money, rate, tokensShort } from "@/lib/costModel";
import { useQueryState } from "@/lib/useQueryState";
import {
  costReport,
  DEFAULT_INPUTS,
  inputsFromQuery,
  inputsToQuery,
  PEAK_FACTOR,
  RANGES,
  ratioLabel,
  type CostInputs,
  type Ranges,
} from "@/lib/costScenario";
import { Switch } from "@/player/Switch";

const n = (v: number) => v.toLocaleString("en-US");
const pct = (share: number) => `${Math.round(share * 100)}%`;

const SEGMENTS = ["seg-green", "seg-amber", "seg-blue", "seg-ink"] as const;

function Slider({
  field,
  label,
  value,
  text,
  valueText,
  note,
  disabled,
  onChange,
}: {
  field: keyof Ranges;
  label: string;
  value: number;
  text: string;
  /** What a screen reader hears, with the unit (C10). */
  valueText: string;
  note?: ReactNode;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  const noteId = useId();
  const r = RANGES[field];
  return (
    <div className={`tt-cost-ctl${disabled ? " off" : ""}`}>
      <div className="tt-cost-ctl-row">
        <span className="tt-body-s">{label}</span>
        <span className="tt-num" aria-hidden="true">
          {text}
        </span>
      </div>
      <Range
        label={label}
        min={r.min}
        max={r.max}
        step={r.step}
        value={value}
        disabled={disabled}
        aria-valuetext={valueText}
        aria-describedby={note ? noteId : undefined}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
      />
      {note && (
        <p id={noteId} className="tt-cap">
          {note}
        </p>
      )}
    </div>
  );
}

export function CostModel({ readOn }: { readOn: string }) {
  const [inputs, setInputs, ready] = useQueryState(
    DEFAULT_INPUTS,
    inputsFromQuery,
    inputsToQuery,
  );
  const set = <K extends keyof CostInputs>(k: K, v: CostInputs[K]) =>
    setInputs((i) => ({ ...i, [k]: v }));

  const r = useMemo(() => costReport(inputs), [inputs]);
  const i = inputs;

  // One polite summary, half a second after the last change.
  const [said, setSaid] = useState("");
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(
      () =>
        setSaid(
          `${money(r.perConversation)} per conversation, ${money(r.perMonth)} a month.`,
        ),
      500,
    );
    return () => clearTimeout(t);
  }, [r, ready]);

  const saves = r.cachingSaves;
  const savesPct = r.uncachedMonth > 0 ? saves / r.uncachedMonth : 0;
  const haikuMain = i.model === "haiku";

  return (
    <div className="tt-cost">
      <div className="tt-cost-strip" aria-hidden="true">
        <span>
          <span className="tt-lbl-s">Conversation</span>{" "}
          <span className="tt-num">{money(r.perConversation)}</span>
        </span>
        <span>
          <span className="tt-lbl-s">Month</span>{" "}
          <span className="tt-num">{money(r.perMonth)}</span>
        </span>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {said}
      </p>

      <section className="tt-card-l tt-cost-inputs" aria-label="Inputs">
        <div className="tt-cost-ctl">
          <span className="tt-lbl-s" id="cost-model-label">
            Main model
          </span>
          <div
            className="tt-seg"
            role="group"
            aria-labelledby="cost-model-label"
          >
            {MODEL_KEYS.map((k) => {
              const p = MODELS[k].prices;
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={i.model === k}
                  onClick={() => set("model", k as ModelKey)}
                >
                  <span>{MODELS[k].name}</span>
                  <span className="tt-seg-sub">
                    {rate(p.input)} / {rate(p.output)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <Slider
          field="route"
          label="Turns routed to Haiku 5.5"
          value={haikuMain ? 0 : i.route}
          text={haikuMain ? "—" : `${i.route}%`}
          valueText={`${haikuMain ? 0 : i.route} percent`}
          disabled={haikuMain}
          note={
            haikuMain
              ? "Haiku 5.5 is already the main model."
              : "Routed turns keep their own prompt cache; this assumes the same hit rate."
          }
          onChange={(v) => set("route", v)}
        />
        <hr className="tt-hr" />
        <Slider
          field="conversations"
          label="Conversations per day"
          value={i.conversations}
          text={n(i.conversations)}
          valueText={`${n(i.conversations)} conversations`}
          onChange={(v) => set("conversations", v)}
        />
        <Slider
          field="turns"
          label="Turns per conversation"
          value={i.turns}
          text={String(i.turns)}
          valueText={`${i.turns} turns`}
          onChange={(v) => set("turns", v)}
        />
        <Slider
          field="prefix"
          label="Cached prefix per turn"
          value={i.prefix}
          text={`${n(i.prefix)} tok`}
          valueText={`${n(i.prefix)} tokens`}
          note={
            r.prefixTooShort ? (
              <span className="tt-cost-warn">
                Under the {n(MIN_CACHE_PREFIX)}-token minimum, so it isn’t
                cached.
              </span>
            ) : (
              `System prompt + tool schemas + the ${TOOL_USE_OVERHEAD}-token tool-use overhead`
            )
          }
          onChange={(v) => set("prefix", v)}
        />
        <Slider
          field="fresh"
          label="Fresh input per turn"
          value={i.fresh}
          text={`${n(i.fresh)} tok`}
          valueText={`${n(i.fresh)} tokens`}
          note="History, retrieved docs, tool results"
          onChange={(v) => set("fresh", v)}
        />
        <Slider
          field="output"
          label="Output per turn"
          value={i.output}
          text={`${n(i.output)} tok`}
          valueText={`${n(i.output)} tokens`}
          onChange={(v) => set("output", v)}
        />
        <hr className="tt-hr" />
        <div className="tt-cost-ctl">
          <span className="tt-body-s">Prompt caching</span>
          <Switch
            label="Prompt caching"
            options={[
              { value: "on", label: "On" },
              { value: "off", label: "Off" },
            ]}
            value={i.caching ? "on" : "off"}
            onChange={(v) => set("caching", v === "on")}
          />
        </div>
        <Slider
          field="hit"
          label="Prompt-cache hit rate"
          value={i.hit}
          text={i.caching ? `${i.hit}%` : "—"}
          valueText={`${i.hit} percent`}
          disabled={!i.caching}
          onChange={(v) => set("hit", v)}
        />
        <div className="tt-cost-ctl">
          <span className="tt-body-s">Cache lifetime</span>
          <Switch
            label="Cache lifetime"
            options={[
              { value: 5, label: "5 minutes · 1.25× write" },
              { value: 60, label: "1 hour · 2× write" },
            ]}
            value={i.ttl}
            onChange={(v) => set("ttl", v)}
          />
        </div>
        <Slider
          field="batch"
          label="Work sent through the Batch API"
          value={i.batch}
          text={`${i.batch}%`}
          valueText={`${i.batch} percent`}
          note="50% off, and it stacks with caching. For async work only, like post-call summaries."
          onChange={(v) => set("batch", v)}
        />
        <div className="tt-cost-ctl">
          <span className="tt-body-s">Inference location</span>
          <Switch
            label="Inference location"
            options={[
              { value: "global", label: "Global · 1×" },
              { value: "us", label: "US-only · 1.1×" },
            ]}
            value={i.usOnly ? "us" : "global"}
            onChange={(v) => set("usOnly", v === "us")}
          />
        </div>
        <button
          type="button"
          className="tt-btn tt-btn-sm"
          onClick={() => setInputs(DEFAULT_INPUTS)}
        >
          <Icon name="repeat" />
          Reset to the card-dispute brief
        </button>
      </section>

      <section className="tt-cost-results" aria-label="Results">
        <dl className="tt-cost-kpis">
          <div className="tt-card">
            <dt className="tt-lbl-s">Per conversation</dt>
            <dd className="tt-cost-big">{money(r.perConversation)}</dd>
            <dd className="tt-cap">{money(r.perTurn)} per turn</dd>
          </div>
          <div className="tt-card">
            <dt className="tt-lbl-s">Per day</dt>
            <dd className="tt-cost-big">{money(r.perDay)}</dd>
            <dd className="tt-cap">{n(i.conversations)} conversations</dd>
          </div>
          <div className="tt-card tt-cost-em">
            <dt className="tt-lbl-s">Per month · 30 days</dt>
            <dd className="tt-cost-big">{money(r.perMonth)}</dd>
            <dd className="tt-cap">{money(r.perYear)} a year (365 days)</dd>
          </div>
          <div className="tt-card">
            {!i.caching ? (
              <>
                <dt className="tt-lbl-s">Caching</dt>
                <dd className="tt-cost-big tt-muted">Off</dd>
                <dd className="tt-cap">The prefix is billed as plain input</dd>
              </>
            ) : saves >= 0 ? (
              <>
                <dt className="tt-lbl-s">Caching saves</dt>
                <dd className="tt-cost-big tt-cost-good">{pct(savesPct)}</dd>
                <dd className="tt-cap">{money(saves)} a month vs no cache</dd>
              </>
            ) : (
              <>
                <dt className="tt-lbl-s">Caching costs more</dt>
                <dd className="tt-cost-big tt-cost-bad">+{pct(-savesPct)}</dd>
                <dd className="tt-cap">
                  {money(-saves)} a month more than no cache: too many misses
                </dd>
              </>
            )}
          </div>
        </dl>

        <div className="tt-card-l tt-cost-card">
          <div className="tt-cost-card-head">
            <h2 className="tt-lbl">Where the money goes · per turn</h2>
            {r.longTier && (
              <span className="tt-chip tt-cost-tier">
                Haiku 5.5 long-prompt tier: prompt over 100,000 tokens
              </span>
            )}
          </div>
          <div className="tt-cost-bar" aria-hidden="true">
            {r.breakdown.map((b, k) => (
              <span
                key={b.label}
                className={`tt-cost-seg ${SEGMENTS[k]}`}
                style={{ flexGrow: Math.max(0.001, b.share) }}
              />
            ))}
          </div>
          <ul className="tt-cost-legend">
            {r.breakdown.map((b, k) => (
              <li key={b.label}>
                <span
                  className={`tt-cost-swatch ${SEGMENTS[k]}`}
                  aria-hidden="true"
                />
                <span className="tt-body-s">{b.label}</span>
                <span className="tt-cap tt-mono">
                  {money(b.usd)} · {pct(b.share)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="tt-card-l tt-cost-card">
          <div className="tt-cost-card-head">
            <h2 className="tt-lbl">Same workload on each model · no routing</h2>
            <span className="tt-cap">monthly, at your settings</span>
          </div>
          <div
            className="tt-cost-scroll"
            role="region"
            aria-label="Model comparison"
            tabIndex={0}
          >
            <table className="tt-cost-table">
              <thead>
                <tr>
                  <th scope="col">Model</th>
                  <th scope="col">Input / out per MTok</th>
                  <th scope="col">Per conversation</th>
                  <th scope="col">Per month</th>
                  <th scope="col">vs main</th>
                </tr>
              </thead>
              <tbody>
                {r.compare.map((c) => {
                  const main = c.key === i.model;
                  return (
                    <tr key={c.key} className={main ? "main" : undefined}>
                      <th scope="row">
                        {c.name}
                        {main && <span className="tt-muted"> · main</span>}
                      </th>
                      <td>
                        {rate(c.prices.input)} / {rate(c.prices.output)}
                      </td>
                      <td>{money(c.perConversation)}</td>
                      <td>{money(c.perMonth)}</td>
                      <td
                        className={
                          main
                            ? "tt-muted"
                            : c.ratio > 1
                              ? "tt-cost-bad"
                              : "tt-cost-good"
                        }
                      >
                        {main ? "—" : ratioLabel(c.ratio)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="tt-cost-pair">
          <div className="tt-card-l tt-cost-card">
            <h2 className="tt-lbl">Capacity</h2>
            <dl className="tt-cost-cap">
              <div>
                <dt>Input tokens / minute, average</dt>
                <dd className="tt-num">{tokensShort(r.capacity.itpm)}</dd>
              </div>
              <div>
                <dt>At a {PEAK_FACTOR}× peak</dt>
                <dd className="tt-num">{tokensShort(r.capacity.itpmPeak)}</dd>
              </div>
              <div>
                <dt>Output tokens / minute at peak</dt>
                <dd className="tt-num">{tokensShort(r.capacity.otpmPeak)}</dd>
              </div>
            </dl>
            <p className="tt-cap">
              Compare the peak with your organisation’s rate-limit tier before
              launch. The {PEAK_FACTOR}× peak factor is a planning assumption.
            </p>
          </div>
          <div className="tt-card-l tt-cost-card">
            <h2 className="tt-lbl">Rates used · USD per million tokens</h2>
            <div
              className="tt-cost-scroll"
              role="region"
              aria-label="Rates used"
              tabIndex={0}
            >
              <table className="tt-cost-table tt-cost-rates">
                <thead>
                  <tr>
                    <th scope="col">Model</th>
                    <th scope="col">In</th>
                    <th scope="col">Hit</th>
                    <th scope="col">5m write</th>
                    <th scope="col">1h write</th>
                    <th scope="col">Out</th>
                  </tr>
                </thead>
                <tbody>
                  {MODEL_KEYS.flatMap((k) => {
                    const m = MODELS[k];
                    const rows = [[m.name, m.prices] as const];
                    if (m.long) rows.push([`${m.name} >100k`, m.long] as const);
                    return rows.map(([name, p]) => (
                      <tr key={name}>
                        <th scope="row">{name}</th>
                        <td>{rate(p.input)}</td>
                        <td>{rate(p.cacheHit)}</td>
                        <td>{rate(p.cacheWrite5m)}</td>
                        <td>{rate(p.cacheWrite1h)}</td>
                        <td>{rate(p.output)}</td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
            <p className="tt-cap tt-mono">
              platform.claude.com pricing · read {readOn} · Haiku 5.5 prompts
              over 100,000 tokens, cache included, pay the &gt;100k row
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
