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

/** The stage machine with its hop timer. It pauses when the tab is
    hidden, and starts paused when the learner asks for less motion. */
export function useStage(
  config: StageConfig,
  timing: Timing,
  options: {
    step?: number;
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
    () => initStage(config, { step: options.step }),
  );

  // Reduced motion is only known after mount: pause once if it's on.
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) dispatch({ type: "pause" });
  }, [reduced]);

  // The hop timer: every change that matters restarts the countdown.
  const delay = delayMs(config, state, timing);
  useEffect(() => {
    if (delay === null) return;
    const timer = setTimeout(
      () =>
        dispatch({
          type: "tick",
          canAdvance: canAdvance.current ? canAdvance.current() : true,
        }),
      delay,
    );
    return () => clearTimeout(timer);
  }, [delay, state.hop, state.step, state.full, state.auto]);

  useEffect(() => {
    const onHidden = () => {
      if (document.hidden) dispatch({ type: "pause" });
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, []);

  return [state, dispatch];
}
