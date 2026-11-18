"use client";

import {
  useEffect,
  useReducer,
  useRef,
  useSyncExternalStore,
  type Dispatch,
} from "react";
import {
  delayMs,
  initStage,
  reduceStage,
  type StageAction,
  type StageConfig,
  type StageState,
  type Timing,
  type View,
} from "./machine";

const REDUCE = "(prefers-reduced-motion: reduce)";

function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(REDUCE);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/** True when the learner asks for less motion. False on the server. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(REDUCE).matches,
    () => false,
  );
}

const PHONE = "(max-width: 720px)";

function subscribePhone(callback: () => void) {
  const query = window.matchMedia(PHONE);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/** True at phone width (the CSS breakpoint). False on the server. */
export function usePhone(): boolean {
  return useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
}

/** Whether the page is at phone width right now, outside React. */
export const isPhone = () => window.matchMedia(PHONE).matches;

/** The stage machine with its hop timer. It pauses when the tab is
    hidden, and starts paused when the learner asks for less motion. */
export function useStage(
  config: StageConfig,
  timing: Timing,
  options: {
    step?: number;
    /** The view to open in; 3D unless said. */
    view?: View;
    /** Asked at the end of each loop while playing the lesson. */
    canAdvance?: () => boolean;
  } = {},
): [StageState, Dispatch<StageAction>] {
  const canAdvance = useRef(options.canAdvance);
  useEffect(() => {
    canAdvance.current = options.canAdvance;
  });
  const [state, dispatch] = useReducer(
    (s: StageState, a: StageAction) => reduceStage(config, s, a),
    undefined,
    () => initStage(config, { step: options.step, view: options.view }),
  );

  // Reduced motion is only known after mount: pause once if it's on.
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) dispatch({ type: "pause" });
  }, [reduced]);

  // The hop timer. A new hop, loop, step or speed, or a restart, starts
  // the countdown afresh; a pause keeps what's left of it, as the packet
  // keeps its place in the flight.
  const delay = delayMs(config, state, timing);
  const flight = [
    state.step,
    state.full,
    state.hop,
    state.loops,
    state.flights,
    state.speed,
  ].join();
  const left = useRef<{ flight: string; ms: number } | null>(null);
  useEffect(() => {
    if (delay === null) return;
    const ms = left.current?.flight === flight ? left.current.ms : delay;
    const armed = performance.now();
    const timer = setTimeout(
      () =>
        dispatch({
          type: "tick",
          canAdvance: canAdvance.current ? canAdvance.current() : true,
        }),
      ms,
    );
    return () => {
      clearTimeout(timer);
      left.current = {
        flight,
        ms: Math.max(0, ms - (performance.now() - armed)),
      };
    };
  }, [delay, flight]);

  useEffect(() => {
    const onHidden = () => {
      if (document.hidden) dispatch({ type: "pause" });
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, []);

  return [state, dispatch];
}
