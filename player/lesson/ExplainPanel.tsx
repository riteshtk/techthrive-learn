"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { Step } from "@/content/types";

const TYPE_TONE: Record<Step["type"], string> = {
  BRIEF: "",
  DECISION: "tt-violet",
  BUILD: "tt-cyan",
  MEASURE: "tt-green",
  COST: "tt-amber",
};

const CALLOUT = {
  key: { tint: "violet", tone: "tt-violet", label: "Key idea" },
  watch: { tint: "amber", tone: "tt-amber", label: "Watch out" },
  interview: {
    tint: "cyan",
    tone: "tt-cyan",
    label: "Say it in the interview",
  },
} as const;

/** The Explain tab (spec 04 §6.1). */
export function ExplainPanel({
  step,
  n,
  total,
  nextShort,
  finish,
  onBack,
  onNext,
}: {
  step: Step;
  n: number;
  total: number;
  nextShort?: string;
  finish: { label: string; href: string };
  onBack: () => void;
  onNext: () => void;
}) {
  const callout = CALLOUT[step.callout.kind];
  return (
    <div className="tt-explain">
      <div className="tt-explain-head">
        <p className="tt-lbl">
          Step {n} / {total}
        </p>
        <span className={`tt-chip tt-chip-compact ${TYPE_TONE[step.type]}`}>
          {step.type}
        </span>
      </div>
      <h2 className="tt-h2 tt-explain-title">{step.title}</h2>
      {step.body.map((p, i) => (
        <p key={i} className="tt-explain-body">
          {p}
        </p>
      ))}
      {step.code && (
        <div className="tt-well tt-code">
          <pre>{step.code}</pre>
        </div>
      )}
      <div className={`tt-tint tt-tint-${callout.tint} tt-callout`}>
        <p className={`tt-lbl ${callout.tone}`}>{callout.label}</p>
        <p className="tt-callout-text">{step.callout.text}</p>
      </div>
      <div className="tt-explain-spacer" />
      <div className="tt-explain-nav">
        <button
          type="button"
          className="tt-btn tt-explain-back"
          onClick={onBack}
          disabled={n === 1}
        >
          <svg className="tt-ic tt-ic-s" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          Back
        </button>
        {n < total ? (
          <button
            type="button"
            className="tt-btn tt-btn-primary tt-explain-next"
            onClick={onNext}
          >
            Next · {nextShort}
            <Icon name="arrow-right" />
          </button>
        ) : (
          <Link
            href={finish.href}
            className="tt-btn tt-btn-primary tt-explain-next"
          >
            {finish.label}
            <Icon name="arrow-right" />
          </Link>
        )}
      </div>
    </div>
  );
}
