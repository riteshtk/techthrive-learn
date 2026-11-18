"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import type { ColorKey, LessonNode } from "@/content/types";

/** A component's details, over the diagram (spec 04 §3.8). */
export function NodeDetail({
  node,
  color,
  standards,
  heading,
  onClose,
  onGoToStep,
  onZoom,
}: {
  node: LessonNode;
  color: ColorKey;
  standards: Record<string, string>;
  heading: string;
  onClose: () => void;
  onGoToStep: (step: number) => void;
  onZoom: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Move focus into the popover when it opens, so keyboard users land on
  // what they asked for.
  useEffect(() => {
    ref.current?.focus();
  }, [node.id]);
  return (
    <div
      ref={ref}
      className="tt-ov"
      role="dialog"
      aria-label={`${node.name} details`}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="tt-ov-head">
        <span
          className="tt-key"
          style={{ color: `var(--${color})` }}
          aria-hidden="true"
        />
        <div className="tt-ov-titles">
          <p className="tt-lbl-s">Component · step {node.addedAt}</p>
          <p className="tt-h4">{node.name}</p>
        </div>
        <button
          type="button"
          className="tt-btn tt-btn-sm tt-btn-icon tt-btn-ghost"
          aria-label="Close component details"
          onClick={onClose}
        >
          <svg className="tt-ic tt-ic-s" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <p className="tt-body-s tt-ov-what">{node.what}</p>
      {node.points.length > 0 && (
        <ul className="tt-ov-points">
          {node.points.map((p, i) => (
            <li key={i} className="tt-check">
              <Icon name="check" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}
      {node.standards && node.standards.length > 0 && (
        <div className="tt-well tt-ov-standards">
          <p className="tt-lbl-s">{heading}</p>
          <ul>
            {node.standards.map((id) => (
              <li key={id}>
                <span className="tt-amber tt-ov-std">{id}</span> {standards[id]}
              </li>
            ))}
          </ul>
          <p className="tt-cap tt-ov-note">Mapping is our judgement.</p>
        </div>
      )}
      <div className="tt-ov-actions">
        <button
          type="button"
          className="tt-btn tt-btn-sm"
          onClick={() => onGoToStep(node.addedAt)}
        >
          <Icon name="arrow-right" />
          Go to step {node.addedAt}
        </button>
        <button type="button" className="tt-btn tt-btn-sm" onClick={onZoom}>
          <Icon name="search" />
          Zoom to it
        </button>
      </div>
    </div>
  );
}
