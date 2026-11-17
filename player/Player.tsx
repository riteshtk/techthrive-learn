"use client";

import { useEffect, useMemo, useReducer } from "react";
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

  const first = state.step === 0;
  const last = isLast(state);

  return (
    <section className="player" aria-label={`${title}: diagram player`}>
      <Diagram layout={layout} active={active} label={`Diagram: ${title}`} />
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
      </div>
    </section>
  );
}
