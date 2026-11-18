// The diagram stage's state (spec 04 §2): which step and hop is playing,
// how fast, which view and layers, the camera, and what is selected. A
// pure reducer, so every transition in spec 04 §2.3 is unit-tested; the
// hop timer is a delay computed from the state (delayMs) and a tick.

export type View = "3d" | "2d";
export type Speed = 0.5 | 1 | 2;
export type Layer = "labels" | "links" | "flow" | "grid";
export const LAYERS: readonly Layer[] = ["labels", "links", "flow", "grid"];

/** Hop and rest times at 1× (PRD P4: 1.7 s a hop, 1.3 s rest). The topic
    overview's hero plays slower and evenly (spec 03 §7.6). */
export const LESSON_TIMING = { hopMs: 1700, restMs: 1300 } as const;
export const OVERVIEW_TIMING = { hopMs: 1200, restMs: 1200 } as const;
export type Timing = { hopMs: number; restMs: number };

export const ZOOM_MIN = 0.6;
export const ZOOM_MAX = 3;

export type StageState = {
  /** 1-based. */
  step: number;
  /** 0…n: hop < n plays that hop; hop === n is the rest at the end. */
  hop: number;
  /** Loops finished on this step: each one re-arms the timer, even on a
      step with no hops, where hop alone never changes. */
  loops: number;
  playing: boolean;
  /** "Play lesson": after each full loop, go to the next step. */
  auto: boolean;
  speed: Speed;
  /** false: Build-up; true: Full system. */
  full: boolean;
  view: View;
  layers: Record<Layer, boolean>;
  /** Camera: zoom and the centre, in the current view's viewBox units. */
  zoom: number;
  cx: number;
  cy: number;
  selected: string | null;
};

export type StageConfig = {
  steps: number;
  /** The number of hops a step plays (after the bypass rule). */
  hops: (step: number, full: boolean) => number;
  /** Each view's viewBox size. */
  size: Record<View, readonly [number, number]>;
};

export type StageAction =
  /** canAdvance false holds Play lesson on this step for another loop
      (its narration is still playing). */
  | { type: "tick"; canAdvance?: boolean }
  | { type: "next" }
  | { type: "back" }
  | { type: "goto"; step: number }
  | { type: "toggleAuto" }
  | { type: "togglePlay" }
  | { type: "pause" }
  | { type: "replay" }
  | { type: "hop"; hop: number }
  | { type: "speed"; speed: Speed }
  | { type: "full"; full: boolean }
  | { type: "view"; view: View }
  | { type: "zoomIn" }
  | { type: "zoomOut" }
  | { type: "fit" }
  | { type: "pan"; cx: number; cy: number }
  | { type: "zoomTo"; x: number; y: number }
  /** Centre the camera on a point at a zoom (phones open on the hop). */
  | { type: "focus"; x: number; y: number; zoom: number }
  | { type: "select"; id: string | null }
  | { type: "layer"; layer: Layer };

export function initStage(
  config: StageConfig,
  options: { step?: number; view?: View; playing?: boolean } = {},
): StageState {
  const view = options.view ?? "3d";
  const [w, h] = config.size[view];
  return {
    step: clampStep(config, options.step ?? 1),
    hop: 0,
    loops: 0,
    playing: options.playing ?? true,
    auto: false,
    speed: 1,
    full: false,
    view,
    layers: { labels: true, links: true, flow: true, grid: true },
    zoom: 1,
    cx: w / 2,
    cy: h / 2,
    selected: null,
  };
}

const clampStep = (config: StageConfig, step: number) =>
  Math.min(Math.max(1, Math.round(step)), config.steps);
const clamp = (min: number, max: number, v: number) =>
  Math.min(max, Math.max(min, v));
const round3 = (v: number) => Math.round(v * 1000) / 1000;

export function reduceStage(
  config: StageConfig,
  state: StageState,
  action: StageAction,
): StageState {
  const [w, h] = config.size[state.view];
  switch (action.type) {
    case "tick": {
      const n = config.hops(state.step, state.full);
      if (state.hop < n) return { ...state, hop: state.hop + 1 };
      // The loop ended: start again, or move on when playing the lesson.
      if (!state.auto || action.canAdvance === false)
        return { ...state, hop: 0, loops: state.loops + 1 };
      if (state.step < config.steps)
        return { ...state, hop: 0, step: state.step + 1 };
      return { ...state, hop: 0, auto: false };
    }
    case "next":
      return { ...state, step: clampStep(config, state.step + 1), hop: 0 };
    case "back":
      return { ...state, step: clampStep(config, state.step - 1), hop: 0 };
    case "goto":
      return { ...state, step: clampStep(config, action.step), hop: 0 };
    case "toggleAuto":
      return {
        ...state,
        auto: !state.auto,
        playing: true,
        hop: state.auto ? state.hop : 0,
      };
    case "togglePlay":
      return { ...state, playing: !state.playing };
    case "pause":
      return { ...state, playing: false };
    case "replay":
      return { ...state, hop: 0, playing: true };
    case "hop": {
      const n = config.hops(state.step, state.full);
      return { ...state, hop: clamp(0, n, action.hop), playing: true };
    }
    case "speed":
      return { ...state, speed: action.speed };
    case "full":
      return { ...state, full: action.full, hop: 0 };
    case "view": {
      const [vw, vh] = config.size[action.view];
      return { ...state, view: action.view, zoom: 1, cx: vw / 2, cy: vh / 2 };
    }
    case "zoomIn":
      return {
        ...state,
        zoom: clamp(ZOOM_MIN, ZOOM_MAX, round3(state.zoom * 1.25)),
      };
    case "zoomOut":
      return {
        ...state,
        zoom: clamp(ZOOM_MIN, ZOOM_MAX, round3(state.zoom * 0.8)),
      };
    case "fit":
      return { ...state, zoom: 1, cx: w / 2, cy: h / 2 };
    case "pan":
      return {
        ...state,
        cx: clamp(0, w, action.cx),
        cy: clamp(0, h, action.cy),
      };
    case "zoomTo":
      return {
        ...state,
        zoom: 1.6,
        cx: clamp(0, w, action.x),
        cy: clamp(0, h, action.y),
      };
    case "focus":
      return {
        ...state,
        zoom: clamp(ZOOM_MIN, ZOOM_MAX, action.zoom),
        cx: clamp(0, w, action.x),
        cy: clamp(0, h, action.y),
      };
    case "select":
      return {
        ...state,
        selected:
          action.id === null || action.id === state.selected ? null : action.id,
      };
    case "layer":
      return {
        ...state,
        layers: {
          ...state.layers,
          [action.layer]: !state.layers[action.layer],
        },
      };
  }
}

/** How long until the next tick, or null when the timer shouldn't run. */
export function delayMs(
  config: StageConfig,
  state: StageState,
  timing: Timing,
): number | null {
  if (!state.playing) return null;
  const n = config.hops(state.step, state.full);
  return (state.hop < n ? timing.hopMs : timing.restMs) / state.speed;
}

/** The camera as an SVG viewBox. */
export function viewBoxOf(config: StageConfig, state: StageState): string {
  const [w, h] = config.size[state.view];
  const vw = w / state.zoom;
  const vh = h / state.zoom;
  const r = (v: number) => Math.round(v * 10) / 10;
  return `${r(state.cx - vw / 2)} ${r(state.cy - vh / 2)} ${r(vw)} ${r(vh)}`;
}

/** One full loop of a step at 1×: n hops then the rest. */
export function loopMs(hops: number, timing: Timing): number {
  return hops * timing.hopMs + timing.restMs;
}
