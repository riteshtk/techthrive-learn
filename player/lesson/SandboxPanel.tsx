"use client";

// Loaded only when the learner opens the sandbox, so its formulas and
// prices don't count against the lesson page's JavaScript budget.

import { useEffect, useMemo, useState } from "react";
import { formatDate } from "@/lib/dates";
import { CLAUDE_PRICES_READ_ON } from "@/lib/claudePrices";
import {
  defaultsOf,
  SANDBOXES,
  type SandboxKind,
  type SandboxTile,
} from "../sandboxes";

export default function SandboxPanel({
  kind,
  onTiles,
  onClose,
}: {
  kind: SandboxKind;
  /** The metric tiles show the sandbox's outputs while it is open. */
  onTiles: (tiles: SandboxTile[] | null) => void;
  onClose: () => void;
}) {
  const sandbox = SANDBOXES[kind];
  const [values, setValues] = useState(() => defaultsOf(sandbox));
  const out = useMemo(() => sandbox.compute(values), [sandbox, values]);

  // Only when the outputs change: the parent re-renders on every tiles
  // update, so passing them on each render would loop forever.
  useEffect(() => {
    onTiles(out.tiles);
  }, [out, onTiles]);
  useEffect(() => () => onTiles(null), [onTiles]);

  const set = (id: string, v: number | boolean) =>
    setValues((all) => ({ ...all, [id]: v }));
  const cacheOff = values.cache === false;

  return (
    <div
      className="tt-ov tt-sandbox"
      role="dialog"
      aria-label={sandbox.title}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="tt-ov-head">
        <p className="tt-lbl-s tt-ov-titles">{sandbox.title}</p>
        <button
          type="button"
          className="tt-btn tt-btn-sm tt-btn-icon tt-btn-ghost"
          aria-label="Close sandbox"
          onClick={onClose}
        >
          <svg className="tt-ic tt-ic-s" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      {sandbox.inputs.map((input) =>
        input.kind === "range" ? (
          <label
            key={input.id}
            className={`tt-sb-input${input.id === "hit" && cacheOff ? " off" : ""}`}
          >
            <span className="tt-sb-row">
              <span className="tt-cap">{input.label}</span>
              <span className="tt-num tt-sb-value">
                {input.id === "hit" && cacheOff
                  ? "—"
                  : input.format(Number(values[input.id]))}
              </span>
            </span>
            <input
              type="range"
              className="tt-range"
              min={input.min}
              max={input.max}
              step={input.step}
              value={Number(values[input.id])}
              disabled={input.id === "hit" && cacheOff}
              onChange={(e) => set(input.id, Number(e.target.value))}
            />
          </label>
        ) : (
          <label key={input.id} className="tt-sb-check">
            <input
              type="checkbox"
              checked={values[input.id] === true}
              onChange={(e) => set(input.id, e.target.checked)}
            />
            {input.label}
          </label>
        ),
      )}
      <div className="tt-well tt-sb-result">
        <span className="tt-cap">{out.result.label}</span>
        <span className={`tt-num tt-sb-big tt-${out.result.tone}`}>
          {out.result.value}
        </span>
      </div>
      <p className="tt-cap tt-sb-foot">
        {sandbox.footnote}
        {kind === "agent-cost" &&
          ` Claude prices, read ${formatDate(CLAUDE_PRICES_READ_ON)}.`}
      </p>
    </div>
  );
}
