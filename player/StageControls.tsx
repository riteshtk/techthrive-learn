"use client";

// The viewer toolbar and the playback controls (spec 04 §1.4, §4):
// Build-up / Full system, 2D / 3D, Layers, zoom, fit; replay, pause and
// speed.

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Switch } from "./Switch";
import {
  LAYERS,
  type Layer,
  type Speed,
  type StageAction,
  type StageState,
} from "./machine";

const LAYER_LABEL: Record<Layer, string> = {
  labels: "Labels",
  links: "Links",
  flow: "Request flow",
  grid: "Grid",
};

export function ViewerToolbar({
  state,
  dispatch,
  extra,
}: {
  state: StageState;
  dispatch: (a: StageAction) => void;
  /** More controls at the end, e.g. the lesson's wide-view button. */
  extra?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const popId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const on = LAYERS.filter((l) => state.layers[l]).length;

  // Close the layers popover on a click elsewhere, or on Escape wherever
  // focus is: Safari doesn't focus a checkbox you click, so focus may not
  // be inside the popover.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      wrap.current?.querySelector("button")?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="tt-vh">
      <div className="tt-vh-group">
        <span className="tt-lbl-s tt-vh-label">System view</span>
        <Switch
          label="What the diagram shows"
          options={[
            { value: "build", label: "Build-up" },
            { value: "full", label: "Full system" },
          ]}
          value={state.full ? "full" : "build"}
          onChange={(v) => dispatch({ type: "full", full: v === "full" })}
        />
        <Switch
          label="Diagram style"
          options={[
            { value: "2d", label: "2D" },
            { value: "3d", label: "3D" },
          ]}
          value={state.view}
          onChange={(v) => dispatch({ type: "view", view: v })}
        />
      </div>
      <div className="tt-vh-spacer" />
      <div className="tt-vh-group tt-vh-tools" ref={wrap}>
        <button
          type="button"
          className="tt-btn tt-btn-sm"
          aria-expanded={open}
          aria-controls={popId}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name="layers" />
          Layers
          <span className="tt-vh-count" aria-label={`${on} of 4 on`}>
            {on}/4
          </span>
          <Icon name="chevron-down" />
        </button>
        {open && (
          <div
            id={popId}
            className="tt-pop tt-layers"
            role="group"
            aria-label="Layers"
          >
            {LAYERS.map((layer) => (
              <label key={layer} className="tt-layer">
                <input
                  type="checkbox"
                  checked={state.layers[layer]}
                  onChange={() => dispatch({ type: "layer", layer })}
                />
                {LAYER_LABEL[layer]}
              </label>
            ))}
          </div>
        )}
        <div className="tt-zoom" role="group" aria-label="Zoom">
          <button
            type="button"
            aria-label="Zoom out"
            title="Zoom out"
            onClick={() => dispatch({ type: "zoomOut" })}
          >
            <svg
              className="tt-ic tt-ic-s"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
            </svg>
          </button>
          <span className="tt-zoom-level" aria-live="polite">
            {Math.round(state.zoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            title="Zoom in"
            onClick={() => dispatch({ type: "zoomIn" })}
          >
            <svg
              className="tt-ic tt-ic-s"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Fit the whole system"
            title="Fit"
            onClick={() => dispatch({ type: "fit" })}
          >
            <svg
              className="tt-ic tt-ic-s"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5M9 12h6M12 9v6" />
            </svg>
          </button>
          {extra}
        </div>
      </div>
    </div>
  );
}

const SPEEDS: readonly Speed[] = [0.5, 1, 2];

export function PlaybackControls({
  state,
  dispatch,
}: {
  state: StageState;
  dispatch: (a: StageAction) => void;
}) {
  return (
    <div className="tt-playback">
      <button
        type="button"
        className="tt-btn tt-btn-sm tt-btn-icon"
        aria-label="Replay the request"
        title="Replay"
        onClick={() => dispatch({ type: "replay" })}
      >
        <svg className="tt-ic tt-ic-s" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
        </svg>
      </button>
      <button
        type="button"
        className="tt-btn tt-btn-sm tt-btn-icon"
        aria-label={state.playing ? "Pause" : "Play"}
        title={state.playing ? "Pause" : "Play"}
        onClick={() => dispatch({ type: "togglePlay" })}
        data-testid="stage-play"
      >
        <svg className="tt-ic tt-ic-s" viewBox="0 0 24 24" aria-hidden="true">
          <path d={state.playing ? "M8 5v14M16 5v14" : "M7 5l12 7-12 7z"} />
        </svg>
      </button>
      <Switch
        label="Speed"
        options={SPEEDS.map((s) => ({ value: s, label: `${s}×` }))}
        value={state.speed}
        onChange={(speed) => dispatch({ type: "speed", speed })}
      />
    </div>
  );
}
