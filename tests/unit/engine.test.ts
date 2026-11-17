import { describe, expect, it } from "vitest";
import {
  holdMs,
  initPlayer,
  reducePlayer,
  stepFromQuery,
  stepToQuery,
  type PlayerAction,
  type PlayerState,
} from "@/player/engine";

function run(state: PlayerState, ...actions: PlayerAction["type"][]) {
  return actions.reduce(
    (s, type) => reducePlayer(s, { type } as PlayerAction),
    state,
  );
}

describe("next and back", () => {
  it("move one step at a time", () => {
    const s = initPlayer(7);
    expect(run(s, "next").step).toBe(1);
    expect(run(s, "next", "next", "back").step).toBe(1);
  });

  it("stay within the first and last step", () => {
    expect(run(initPlayer(3), "back").step).toBe(0);
    expect(run(initPlayer(3, 2), "next").step).toBe(2);
  });

  it("pause playback", () => {
    const playing = run(initPlayer(5), "play");
    expect(playing.playing).toBe(true);
    expect(run(playing, "next")).toMatchObject({ step: 1, playing: false });
    expect(run(playing, "back")).toMatchObject({ step: 0, playing: false });
  });
});

describe("play", () => {
  it("is never automatic", () => {
    expect(initPlayer(7).playing).toBe(false);
  });

  it("holds each step for 2 s plus 45 ms per character", () => {
    expect(holdMs("")).toBe(2000);
    expect(holdMs("You send a prompt, as plain text.")).toBe(2000 + 45 * 33);
  });

  it("advances one step per tick and stops on the last step", () => {
    let s = run(initPlayer(3), "play");
    s = run(s, "tick");
    expect(s).toMatchObject({ step: 1, playing: true });
    s = run(s, "tick");
    expect(s).toMatchObject({ step: 2, playing: false });
    expect(run(s, "tick")).toEqual(s);
  });

  it("restarts from step 1 when pressed on the last step", () => {
    const s = run(initPlayer(4, 3), "play");
    expect(s).toMatchObject({ step: 0, playing: true });
  });

  it("ignores ticks while paused", () => {
    const s = initPlayer(4);
    expect(run(s, "tick")).toEqual(s);
  });

  it("pauses when the tab is hidden", () => {
    const s = run(initPlayer(4), "play", "hidden");
    expect(s).toMatchObject({ step: 0, playing: false });
  });

  it("toggles between playing and paused", () => {
    const s = run(initPlayer(4), "toggle");
    expect(s.playing).toBe(true);
    expect(run(s, "toggle").playing).toBe(false);
  });

  it("does not play a one-step topic forever", () => {
    expect(run(initPlayer(1), "play").playing).toBe(false);
  });
});

describe("deep links", () => {
  it("opens the step named in ?step (counting from 1)", () => {
    expect(stepFromQuery("3", 7)).toEqual({ step: 2, valid: true });
    expect(stepFromQuery("1", 7)).toEqual({ step: 0, valid: true });
    expect(stepFromQuery("7", 7)).toEqual({ step: 6, valid: true });
  });

  it.each([null, "", "0", "-1", "2.5", "3abc", "abc", "8", "03", " 3"])(
    "opens step 1 and asks for a fix for %j",
    (raw) => {
      expect(stepFromQuery(raw, 7)).toEqual({ step: 0, valid: false });
    },
  );

  it("writes steps back counting from 1", () => {
    expect(stepToQuery(0)).toBe("1");
    expect(stepToQuery(6)).toBe("7");
  });

  it("goto clamps and pauses", () => {
    const s = run(initPlayer(5), "play");
    expect(reducePlayer(s, { type: "goto", step: 9 })).toMatchObject({
      step: 4,
      playing: false,
    });
    expect(reducePlayer(s, { type: "goto", step: -2 }).step).toBe(0);
  });
});
