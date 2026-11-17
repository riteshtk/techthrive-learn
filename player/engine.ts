// The player's state machine. Pure: no timers, DOM or React, so every rule
// in PRD F3 and F6 is unit-tested directly. Steps are 0-based here and
// 1-based in the address bar.

export type PlayerState = {
  /** 0-based index of the current step. */
  step: number;
  playing: boolean;
  /** Number of steps; always at least 1. */
  total: number;
};

export type PlayerAction =
  | { type: "next" }
  | { type: "back" }
  | { type: "play" }
  | { type: "pause" }
  | { type: "toggle" }
  /** The current step's hold time has elapsed while playing. */
  | { type: "tick" }
  /** The tab was hidden. */
  | { type: "hidden" }
  | { type: "goto"; step: number };

export function initPlayer(total: number, step = 0): PlayerState {
  const safeTotal = Math.max(1, Math.floor(total));
  return { step: clamp(step, safeTotal), playing: false, total: safeTotal };
}

function clamp(step: number, total: number): number {
  return Math.min(Math.max(0, Math.floor(step)), total - 1);
}

export function isLast(state: PlayerState): boolean {
  return state.step === state.total - 1;
}

export function reducePlayer(
  state: PlayerState,
  action: PlayerAction,
): PlayerState {
  const last = state.total - 1;
  switch (action.type) {
    case "next":
      return { ...state, step: Math.min(state.step + 1, last), playing: false };
    case "back":
      return { ...state, step: Math.max(state.step - 1, 0), playing: false };
    case "play":
      // Play on the last step restarts from step 1.
      return isLast(state)
        ? { ...state, step: 0, playing: last > 0 }
        : { ...state, playing: true };
    case "pause":
    case "hidden":
      return state.playing ? { ...state, playing: false } : state;
    case "toggle":
      return reducePlayer(state, { type: state.playing ? "pause" : "play" });
    case "tick": {
      if (!state.playing) return state;
      const step = Math.min(state.step + 1, last);
      // Playback stops once it reaches the last step.
      return { ...state, step, playing: step < last };
    }
    case "goto":
      return {
        ...state,
        step: clamp(action.step, state.total),
        playing: false,
      };
  }
}

/** How long Play holds a step: 2 s plus 45 ms per character of its sentence. */
export function holdMs(text: string): number {
  return 2000 + 45 * text.length;
}

/**
 * Reads `?step=` (1-based). Anything but a whole number from 1 to `total`
 * opens step 1 and asks for the address to be corrected.
 */
export function stepFromQuery(
  raw: string | null,
  total: number,
): { step: number; valid: boolean } {
  if (raw !== null && /^[1-9]\d*$/.test(raw)) {
    const n = Number(raw);
    if (n <= total) return { step: n - 1, valid: true };
  }
  return { step: 0, valid: false };
}

/** The `?step=` value for a 0-based step. */
export function stepToQuery(step: number): string {
  return String(step + 1);
}
