import { describe, expect, it } from "vitest";
import type { Diagram } from "@/content/types";
import { drawDiagram } from "@/player/drawing";
import { initStage, type StageConfig } from "@/player/machine";
import {
  badgePositions,
  buildScene,
  hopWords,
  packetPath,
  type SceneHop,
  type SceneSource,
} from "@/player/scene";
import { effectiveTrace } from "@/player/trace";
import { AGENTS, PAYMENTS } from "./fixtures/diagrams";

const hop = (from: string, to: string, color: SceneHop["color"]): SceneHop => ({
  from,
  to,
  color,
  text: `${from}→${to}`,
});

// The overview heroes (spec 03 §8.2, §8.3): every part already built.
function overview(
  diagram: Diagram,
  trace: SceneHop[],
  bypass?: { node: string; edge: string },
): SceneSource {
  return {
    nodes: diagram.nodes.map((n) => ({ id: n.id, addedAt: 1 })),
    edges: Object.keys(diagram.paths2),
    bypass,
    steps: [{ trace, newNodes: [] }],
  };
}

const AGENTS_HERO = overview(
  AGENTS,
  [
    hop("U", "G", "cyan"),
    hop("G", "O", "cyan"),
    hop("O", "M", "violet"),
    hop("M", "O", "violet"),
    hop("O", "P", "amber"),
    hop("P", "O", "amber"),
    hop("O", "T", "green"),
    hop("T", "D", "blue"),
  ],
  { node: "G", edge: "U_O" },
);

const PAYMENTS_HERO = overview(PAYMENTS, [
  hop("C", "A", "cyan"),
  hop("A", "S", "cyan"),
  hop("S", "I", "blue"),
  hop("I", "S", "blue"),
  hop("S", "V", "amber"),
  hop("V", "P", "green"),
  hop("P", "S", "green"),
  hop("S", "L", "blue"),
]);

function scene(source: SceneSource, step = 1, hopIndex = 0) {
  const config: StageConfig = {
    steps: source.steps.length,
    hops: (s, full) => effectiveTrace(source, s, full).length,
    size: { "3d": [950, 567], "2d": [960, 500] },
  };
  const state = { ...initStage(config, { step }), hop: hopIndex };
  return buildScene(source, state, (s, full) =>
    effectiveTrace(source, s, full),
  );
}

const linesOf = (d: Diagram, view: "3d" | "2d") => {
  const drawing = drawDiagram(d, Object.keys(d.paths2), {});
  return view === "3d" ? drawing.edges3 : drawing.edges2;
};

describe("edges styled from the hero trace (spec 03 §7.5)", () => {
  it("AI agents", () => {
    const s = scene(AGENTS_HERO);
    const on = Object.fromEntries(
      s.edges.filter((e) => e.color).map((e) => [e.id, e.color]),
    );
    expect(on).toEqual({
      U_G: "cyan",
      G_O: "cyan",
      O_M: "violet",
      O_P: "amber",
      O_T: "green",
      T_D: "blue",
    });
    expect(
      s.edges.filter((e) => e.visible && !e.color).map((e) => e.id),
    ).toEqual(["O_V", "P_H", "E_O", "O_X", "T_X"]);
    // The bypass edge is hidden once the gateway exists.
    expect(s.edges.find((e) => e.id === "U_O")?.visible).toBe(false);
    // Heads at both ends where the request comes back.
    const both = s.edges.filter((e) => e.backward).map((e) => e.id);
    expect(both).toEqual(["O_M", "O_P"]);
  });

  it("payments, where S_P is only used backwards", () => {
    const s = scene(PAYMENTS_HERO);
    const sp = s.edges.find((e) => e.id === "S_P")!;
    expect(sp.color).toBe("green");
    expect(sp.forward).toEqual({ color: null, current: false });
    expect(sp.backward).toEqual({ color: "green", current: false });
    expect(
      s.edges.filter((e) => e.visible && !e.color).map((e) => e.id),
    ).toEqual(["S_R", "P_W", "W_S", "L_Q", "N_P", "N_L"]);
  });
});

describe("node states (spec 04 §2.2)", () => {
  const lesson: SceneSource = {
    nodes: [
      { id: "U", addedAt: 1 },
      { id: "G", addedAt: 3 },
      { id: "O", addedAt: 2 },
      { id: "M", addedAt: 2 },
    ],
    edges: ["U_G", "G_O", "U_O", "O_M"],
    bypass: { node: "G", edge: "U_O" },
    steps: [
      { trace: [], newNodes: [] },
      {
        trace: [
          hop("U", "G", "cyan"),
          hop("G", "O", "cyan"),
          hop("O", "M", "violet"),
        ],
        newNodes: ["O", "M"],
      },
      { trace: [hop("U", "G", "cyan")], newNodes: ["G"] },
    ],
  };

  it("draws parts not built yet as ghosts, and new ones as new", () => {
    const s = scene(lesson, 2);
    const look = Object.fromEntries(s.nodes.map((n) => [n.id, n]));
    expect(look.G?.ghost).toBe(true);
    expect(look.O?.isNew && look.M?.isNew).toBe(true);
    expect(look.U?.isNew).toBe(false);
  });

  it("collapses hops through a part not built yet (the bypass rule)", () => {
    const s = scene(lesson, 2);
    expect(s.trace.map((h) => `${h.from}${h.to}`)).toEqual(["UO", "OM"]);
    expect(s.edges.find((e) => e.id === "U_O")?.visible).toBe(true);
    expect(s.edges.find((e) => e.id === "U_G")?.visible).toBe(false);
    expect(scene(lesson, 3).edges.find((e) => e.id === "U_O")?.visible).toBe(
      false,
    );
  });

  it("marks the current hop's ends and edge", () => {
    const s = scene(lesson, 2, 1);
    expect(s.current).toMatchObject({ from: "O", to: "M" });
    expect(s.nodes.filter((n) => n.active).map((n) => n.id)).toEqual([
      "O",
      "M",
    ]);
    const om = s.edges.find((e) => e.id === "O_M")!;
    expect(om.active).toBe(true);
    expect(om.forward?.current).toBe(true);
  });

  it("dims parts not joined to the selected one", () => {
    const config: StageConfig = {
      steps: 3,
      hops: () => 0,
      size: { "3d": [950, 567], "2d": [960, 500] },
    };
    const state = { ...initStage(config, { step: 3 }), selected: "M" };
    const s = buildScene(lesson, state, () => []);
    const dim = s.nodes.filter((n) => n.dim).map((n) => n.id);
    expect(dim).toEqual(["U", "G"]);
  });
});

describe("packets and badges", () => {
  it("run a 3D packet straight between the drawn edge ends", () => {
    const path = packetPath(linesOf(AGENTS, "3d"), Object.keys(AGENTS.paths2), {
      from: "G",
      to: "U",
    });
    expect(path[0]![0]).toBeCloseTo(283.4, 0);
    expect(path[1]![0]).toBeCloseTo(223.2, 1);
  });

  it("run a 2D packet round the path's corners, in the hop's direction", () => {
    const path = packetPath(linesOf(AGENTS, "2d"), Object.keys(AGENTS.paths2), {
      from: "P",
      to: "O",
    });
    expect(path).toEqual([
      [532, 190],
      [484, 190],
      [484, 300],
      [452, 300],
    ]);
  });

  it("put outbound and return badges on opposite sides, repeats apart", () => {
    const trace = [
      { from: "S", to: "P" },
      { from: "P", to: "S" },
      { from: "S", to: "P" },
    ];
    const [out1, back, out2] = badgePositions(
      linesOf(PAYMENTS, "2d"),
      Object.keys(PAYMENTS.paths2),
      trace,
    );
    // S_P runs left to right at y 320: outbound above or below, return opposite.
    expect(Math.sign(out1![1] - 320)).toBe(-Math.sign(back![1] - 320));
    expect(Math.abs(out1![0] - out2![0])).toBeCloseTo(28, 6);
  });

  it("word the hop well", () => {
    const short = (id: string) => id;
    expect(hopWords(scene(AGENTS_HERO, 1, 2), 2, short, "—").tag).toBe(
      "Hop 3 of 8 · O → M",
    );
    expect(hopWords(scene(AGENTS_HERO, 1, 8), 8, short, "—").tag).toBe(
      "End of request · replaying",
    );
    const empty = scene({
      ...AGENTS_HERO,
      steps: [{ trace: [], newNodes: [] }],
    });
    expect(hopWords(empty, 0, short, "Nothing moves yet.")).toEqual({
      tag: "No traffic yet",
      text: "Nothing moves yet.",
      progress: 100,
    });
  });
});
