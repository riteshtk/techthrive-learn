"use client";

import { useEffect, useMemo, useReducer, type KeyboardEvent } from "react";
import type { Step } from "@/content/types";
import { Diagram } from "./Diagram";
import { holdMs, initPlayer, isLast, reducePlayer } from "./engine";
import type { Layout } from "./geometry";

type Props = {
  layout: Layout;
  steps: Step[];
  title: string;
};

export function Player({ layout, steps, title }: Props) {
  const [state, dispatch] = useReducer(reducePlayer, steps.length, initPlayer);
  const step = steps[state.step] ?? steps[0];
  const active = useMemo(() => new Set(step?.highlight ?? []), [step]);

  // Play holds each step for its own time, then advances one step.
  useEffect(() => {
    if (!state.playing || !step) return;
    const timer = setTimeout(
      () => dispatch({ type: "tick" }),
      holdMs(step.text),
    );
    return () => clearTimeout(timer);
  }, [state.playing, state.step, step]);

  // Hiding the tab pauses.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) dispatch({ type: "hidden" });
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Right/Left step and Space plays or pauses while the player has focus;
  // a focused button or link keeps its own Space.
  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      dispatch({ type: "next" });
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      dispatch({ type: "back" });
    } else if (event.key === " ") {
      const target = event.target as HTMLElement;
      if (target.closest("button, a, input, select, textarea")) return;
      event.preventDefault();
      dispatch({ type: "toggle" });
    }
  }

  const first = state.step === 0;
  const last = isLast(state);

  return (
    <section
      className="player"
      aria-label={`${title}: diagram player`}
      aria-keyshortcuts="ArrowLeft ArrowRight Space"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <Diagram layout={layout} active={active} label={`Diagram: ${title}`} />
      <p className="caption" aria-live="polite" data-testid="caption">
        {step?.text}
      </p>
      <div className="controls">
        <button
          type="button"
          className="button"
          aria-disabled={first}
          onClick={() => dispatch({ type: "back" })}
        >
          Back
        </button>
        <button
          type="button"
          className="button"
          onClick={() => dispatch({ type: "toggle" })}
        >
          {state.playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          className="button button-primary"
          aria-disabled={last}
          onClick={() => dispatch({ type: "next" })}
        >
          Next
        </button>
        <span className="counter" data-testid="counter">
          {state.step + 1} of {state.total}
        </span>
      </div>
      <p className="hint">
        Tip: select the diagram, then use ← and → to step and Space to play.
      </p>
    </section>
  );
}
