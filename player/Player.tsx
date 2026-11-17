"use client";

import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import type { Step } from "@/content/types";
import { doneNotice } from "@/lib/doneNotice";
import { progressStore } from "@/lib/useProgress";
import { Diagram } from "./Diagram";
import {
  holdMs,
  initPlayer,
  isLast,
  reducePlayer,
  stepFromQuery,
  stepToQuery,
} from "./engine";
import type { Layout } from "./geometry";

type Props = {
  layout: Layout;
  steps: Step[];
  title: string;
  topicId: string;
  /** Where "Mark as done" returns to; home when the topic is in no roadmap. */
  roadmapId?: string;
};

export function Player({ layout, steps, title, topicId, roadmapId }: Props) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducePlayer, steps.length, initPlayer);
  const step = steps[state.step] ?? steps[0];
  const active = useMemo(() => new Set(step?.highlight ?? []), [step]);

  // Deep links (F6). The page is prerendered at step 1; after load, ?step
  // picks the step. A missing or invalid value opens step 1, and the address
  // is corrected, and kept in step, without adding history entries.
  const readAddress = useRef(true);
  useEffect(() => {
    if (readAddress.current) {
      readAddress.current = false;
      const raw = new URLSearchParams(window.location.search).get("step");
      const { step: wanted, valid } = stepFromQuery(raw, state.total);
      if (valid) {
        if (wanted !== state.step) dispatch({ type: "goto", step: wanted });
        return;
      }
    }
    const url = new URL(window.location.href);
    const value = stepToQuery(state.step);
    if (url.searchParams.get("step") !== value) {
      url.searchParams.set("step", value);
      window.history.replaceState(window.history.state, "", url);
    }
  }, [state.step, state.total]);

  // Play holds each step for its own time, then advances one step.
  useEffect(() => {
    if (!state.playing || !step) return;
    const timer = setTimeout(
      () => dispatch({ type: "tick" }),
      holdMs(step.text),
    );
    return () => clearTimeout(timer);
  }, [state.playing, state.step, step]);

  // Transitions switch on only after the first frames, so a deep link opens
  // straight on its step instead of animating there from step 1.
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (sectionRef.current) sectionRef.current.dataset.ready = "true";
      });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

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
      ref={sectionRef}
      className="player"
      aria-label={`${title}: diagram player`}
      aria-keyshortcuts="ArrowLeft ArrowRight Space"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <Diagram layout={layout} active={active} label={`Diagram: ${title}`} />
      {/* Every sentence sits invisibly in the same grid cell, so the box is
          exactly as tall as this topic's longest one and the controls never
          move, without reserving more room than the topic needs. */}
      <div className="caption-box">
        {steps.map((s, i) => (
          <p key={i} className="caption caption-sizer" aria-hidden="true">
            {s.text}
          </p>
        ))}
        <p className="caption" aria-live="polite" data-testid="caption">
          {step?.text}
        </p>
      </div>
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
      {last ? (
        <p className="mark-done">
          <button
            type="button"
            className="button button-primary"
            onClick={() => {
              progressStore.markDone(topicId);
              doneNotice.set(topicId);
              router.push(roadmapId ? `/roadmaps/${roadmapId}/` : "/");
            }}
          >
            <span aria-hidden="true">✓</span> Mark as done
          </button>
        </p>
      ) : null}
      <p className="hint">
        Tip: select the diagram, then use ← and → to step and Space to play.
      </p>
    </section>
  );
}
