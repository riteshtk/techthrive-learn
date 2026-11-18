import { describe, expect, it } from "vitest";
import {
  delayMs,
  initStage,
  LESSON_TIMING,
  loopMs,
  OVERVIEW_TIMING,
  reduceStage,
  viewBoxOf,
  type StageAction,
  type StageConfig,
  type StageState,
} from "@/player/machine";

// Ten steps; step n plays n − 1 hops (step 1 has none); full system adds one.
const config: StageConfig = {
  steps: 10,
  hops: (step, full) => step - 1 + (full ? 1 : 0),
  size: { "3d": [950, 567], "2d": [960, 500] },
};

const run = (state: StageState, ...actions: StageAction[]) =>
  actions.reduce((s, a) => reduceStage(config, s, a), state);
const start = (step = 1) => initStage(config, { step });

describe("the hop timer", () => {
  it("plays each hop for 1.7 s and rests 1.3 s, divided by speed", () => {
    const s = start(4); // 3 hops
    expect(delayMs(config, s, LESSON_TIMING)).toBe(1700);
    expect(
      delayMs(config, run(s, { type: "hop", hop: 3 }), LESSON_TIMING),
    ).toBe(1300);
    const half = run(s, { type: "speed", speed: 0.5 });
    expect(delayMs(config, half, LESSON_TIMING)).toBe(3400);
    expect(
      delayMs(config, run(half, { type: "hop", hop: 3 }), LESSON_TIMING),
    ).toBe(2600);
    const double = run(s, { type: "speed", speed: 2 });
    expect(delayMs(config, double, LESSON_TIMING)).toBe(850);
    expect(
      delayMs(config, run(double, { type: "hop", hop: 3 }), LESSON_TIMING),
    ).toBe(650);
  });

  it("doesn't run while paused", () => {
    expect(
      delayMs(config, run(start(4), { type: "togglePlay" }), LESSON_TIMING),
    ).toBeNull();
  });

  it("uses the overview's even 1.2 s timing for the hero", () => {
    const s = start(4);
    expect(delayMs(config, s, OVERVIEW_TIMING)).toBe(1200);
    expect(loopMs(6, LESSON_TIMING)).toBe(11_500); // spec 04: step 6 loops in 11.5 s
  });
});

describe("ticks", () => {
  it("move through the hops, rest, then loop the same step", () => {
    let s = start(3); // 2 hops
    s = run(s, { type: "tick" });
    expect(s.hop).toBe(1);
    s = run(s, { type: "tick" });
    expect(s.hop).toBe(2); // the rest
    s = run(s, { type: "tick" });
    expect([s.step, s.hop]).toEqual([3, 0]);
  });

  it("with Play lesson, move to the next step after each loop", () => {
    let s = run(start(1), { type: "toggleAuto" });
    expect(s.auto).toBe(true);
    s = run(s, { type: "tick" }); // step 1 has no hops: just the rest
    expect([s.step, s.hop]).toEqual([2, 0]);
  });

  it("stop playing the lesson after the last step", () => {
    const s = run(
      start(10),
      { type: "toggleAuto" },
      { type: "hop", hop: 9 },
      { type: "tick" },
    );
    expect([s.step, s.hop, s.auto]).toEqual([10, 0, false]);
  });
});

describe("controls", () => {
  it("Next and Back stay within the steps and restart the request", () => {
    let s = run(start(1), { type: "back" });
    expect(s.step).toBe(1);
    s = run(start(9), { type: "tick" }, { type: "next" });
    expect([s.step, s.hop]).toEqual([10, 0]);
    s = run(s, { type: "next" });
    expect(s.step).toBe(10);
    expect(run(start(), { type: "goto", step: 42 }).step).toBe(10);
  });

  it("Play lesson starts from the first hop and plays", () => {
    const s = run(
      start(5),
      { type: "hop", hop: 3 },
      { type: "togglePlay" },
      { type: "toggleAuto" },
    );
    expect([s.auto, s.playing, s.hop]).toEqual([true, true, 0]);
    expect(run(s, { type: "tick" }, { type: "toggleAuto" }).hop).toBe(1);
  });

  it("Replay and the hop pills play from that hop", () => {
    let s = run(start(5), { type: "pause" }, { type: "hop", hop: 2 });
    expect([s.hop, s.playing]).toEqual([2, true]);
    s = run(s, { type: "pause" }, { type: "replay" });
    expect([s.hop, s.playing]).toEqual([0, true]);
    expect(run(s, { type: "hop", hop: 99 }).hop).toBe(4);
  });

  it("Build-up and Full system restart the request, keeping the step", () => {
    const s = run(start(5), { type: "tick" }, { type: "full", full: true });
    expect([s.full, s.hop, s.step]).toEqual([true, 0, 5]);
  });
});

describe("camera", () => {
  it("zooms in steps between 0.6 and 3", () => {
    let s = start();
    const zooms: number[] = [];
    for (let i = 0; i < 6; i++) {
      s = run(s, { type: "zoomIn" });
      zooms.push(s.zoom);
    }
    expect(zooms).toEqual([1.25, 1.563, 1.954, 2.443, 3, 3]);
    s = run(
      start(),
      { type: "zoomOut" },
      { type: "zoomOut" },
      { type: "zoomOut" },
    );
    expect(s.zoom).toBe(0.6);
  });

  it("pans within the diagram and fits back to the middle", () => {
    let s = run(start(), { type: "pan", cx: -50, cy: 9999 });
    expect([s.cx, s.cy]).toEqual([0, 567]);
    s = run(s, { type: "zoomIn" }, { type: "fit" });
    expect([s.zoom, s.cx, s.cy]).toEqual([1, 475, 283.5]);
  });

  it("switching 2D and 3D resets the camera; the step doesn't", () => {
    let s = run(start(4), { type: "zoomIn" }, { type: "view", view: "2d" });
    expect([s.view, s.zoom, s.cx, s.cy, s.step]).toEqual([
      "2d",
      1,
      480,
      250,
      4,
    ]);
    s = run(s, { type: "zoomIn" }, { type: "next" });
    expect(s.zoom).toBe(1.25);
  });

  it("writes the camera as a viewBox", () => {
    expect(viewBoxOf(config, start())).toBe("0 0 950 567");
    expect(viewBoxOf(config, run(start(), { type: "zoomIn" }))).toBe(
      "95 56.7 760 453.6",
    );
  });

  it("zooms to a component", () => {
    const s = run(start(), { type: "zoomTo", x: 700, y: 142 });
    expect([s.zoom, s.cx, s.cy]).toEqual([1.6, 700, 142]);
  });
});

describe("selection and layers", () => {
  it("selects a component, and the same one again closes it", () => {
    let s = run(start(), { type: "select", id: "P" });
    expect(s.selected).toBe("P");
    s = run(s, { type: "select", id: "P" });
    expect(s.selected).toBeNull();
    s = run(s, { type: "select", id: "P" }, { type: "select", id: null });
    expect(s.selected).toBeNull();
  });

  it("toggles each layer", () => {
    const s = run(start(), { type: "layer", layer: "flow" });
    expect(s.layers).toEqual({
      labels: true,
      links: true,
      flow: false,
      grid: true,
    });
  });

  it("can start paused, for reduced motion", () => {
    expect(initStage(config, { playing: false }).playing).toBe(false);
  });
});
