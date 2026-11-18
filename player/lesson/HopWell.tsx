"use client";

import type { CSSProperties } from "react";
import type { StageAction, StageState } from "../machine";
import type { Scene } from "../scene";
import { PlaybackControls } from "../StageControls";

/** The hop well (spec 04 §1.6): what the request is doing now, playback
    controls, and one pill per hop to jump to it. */
export function HopWell({
  scene,
  state,
  dispatch,
  words,
  shortOf,
}: {
  scene: Scene;
  state: StageState;
  dispatch: (a: StageAction) => void;
  words: { tag: string; text: string };
  shortOf: (id: string) => string;
}) {
  const color = scene.current
    ? `var(--${scene.current.color})`
    : "var(--line-3)";
  return (
    <div className="tt-well tt-hopwell">
      <div className="tt-hopwell-top">
        <div className="tt-hopwell-now">
          <p className="tt-lbl-s tt-hoptag">
            <span className="tt-key" style={{ color }} aria-hidden="true" />
            {words.tag}
          </p>
          <p className="tt-hoptext" aria-live="polite">
            {words.text}
          </p>
        </div>
        <PlaybackControls state={state} dispatch={dispatch} />
      </div>
      {scene.trace.length > 0 && (
        <ol className="tt-hops" aria-label="Request sequence for this step">
          {scene.trace.map((hop, i) => {
            const phase =
              i === state.hop ? "cur" : i < state.hop ? "done" : "next";
            return (
              <li key={i}>
                <button
                  type="button"
                  className={`tt-hopc ${phase}`}
                  style={{ "--hop": `var(--${hop.color})` } as CSSProperties}
                  aria-current={phase === "cur" ? "step" : undefined}
                  onClick={() => dispatch({ type: "hop", hop: i })}
                >
                  <span className="tt-hopn" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="sr-only">Hop {i + 1}: </span>
                  {shortOf(hop.from)}
                  <span className="tt-hopa" aria-hidden="true">
                    →
                  </span>
                  <span className="sr-only"> to </span>
                  {shortOf(hop.to)}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
