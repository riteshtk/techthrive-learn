// What the stage draws at a moment (spec 04 §2.2, spec 03 §7.5): each
// node's state, each edge's colour and arrowheads, the travelling packet's
// path and the hop badges. Pure, so the rules are unit-tested; Stage.tsx
// only draws the result.

import type { ColorKey } from "@/content/types";
import type { EdgeDrawing } from "./drawing";
import { badgeAt, pointAt } from "./flat";
import type { Pt } from "./iso";
import type { StageState } from "./machine";
import { edgeOfHop, isEdgeVisible, isPresent, type TraceLesson } from "./trace";

export type SceneHop = {
  from: string;
  to: string;
  color: ColorKey;
  text: string;
};

/** The lesson-shaped input: which parts exist when, what each step
    plays. The topic overview passes every part as there from step 1. */
export type SceneSource = Omit<TraceLesson<SceneHop>, "steps"> & {
  edges: readonly string[];
  steps: readonly {
    trace: readonly SceneHop[];
    newNodes: readonly string[];
  }[];
};

export type NodeLook = {
  id: string;
  ghost: boolean;
  dim: boolean;
  isNew: boolean;
  active: boolean;
  selected: boolean;
};

export type EdgeLook = {
  id: string;
  visible: boolean;
  /** The colour of the first hop that uses it, if any. */
  color: ColorKey | null;
  active: boolean;
  /** Arrowhead at the edge's `to` end: grey, coloured or current. */
  forward: { color: ColorKey | null; current: boolean } | null;
  /** Arrowhead at the `from` end, only when a hop runs backwards. */
  backward: { color: ColorKey; current: boolean } | null;
};

export type Scene = {
  nodes: NodeLook[];
  edges: EdgeLook[];
  trace: SceneHop[];
  current: SceneHop | null;
};

export function buildScene(
  source: SceneSource,
  state: StageState,
  traceOf: (step: number, full: boolean) => SceneHop[],
): Scene {
  const { step, full, hop, selected } = state;
  const trace = traceOf(step, full);
  const current = hop < trace.length ? trace[hop]! : null;
  const newSet = new Set(source.steps[step - 1]?.newNodes ?? []);
  const adjacent = new Set<string>();
  if (selected)
    for (const e of source.edges) {
      const [a, b] = e.split("_");
      if (a === selected && b) adjacent.add(b);
      if (b === selected && a) adjacent.add(a);
    }

  const nodes: NodeLook[] = source.nodes.map(({ id }) => {
    const present = isPresent(source, id, step, full);
    return {
      id,
      ghost: !present,
      dim: present && !!selected && selected !== id && !adjacent.has(id),
      isNew: present && newSet.has(id),
      active:
        present && !!current && (current.from === id || current.to === id),
      selected: selected === id,
    };
  });

  const edges: EdgeLook[] = source.edges.map((id) => {
    const [a = "", b = ""] = id.split("_");
    const visible =
      isPresent(source, a, step, full) &&
      isPresent(source, b, step, full) &&
      isEdgeVisible(source, id, step, full);
    const uses = trace.filter((h) => edgeOfHop([id], h));
    const fwd = trace.find((h) => h.from === a && h.to === b);
    const back = trace.find((h) => h.from === b && h.to === a);
    const curOn = !!current && !!edgeOfHop([id], current);
    return {
      id,
      visible,
      color: visible ? (uses[0]?.color ?? null) : null,
      active: visible && curOn,
      forward: visible
        ? {
            color: fwd?.color ?? null,
            current: !!current && current.from === a && current.to === b,
          }
        : null,
      backward:
        visible && back
          ? {
              color: back.color,
              current: !!current && current.from === b && current.to === a,
            }
          : null,
    };
  });

  return { nodes, edges, trace, current };
}

/** The packet's stops along a hop, in the direction of travel: straight
    between the drawn ends in 3D, round the path's corners in 2D. */
export function packetPath(
  lines: Readonly<Record<string, EdgeDrawing>>,
  edges: readonly string[],
  hop: { from: string; to: string },
): Pt[] {
  const edge = edgeOfHop(edges, hop);
  const line = edge && lines[edge.id]?.line;
  if (!edge || !line) return [];
  return edge.forward ? [...line] : [...line].reverse();
}

/** Each hop's badge position: beside its edge's middle, outbound and
    return hops on opposite sides, repeats spread along the edge. */
export function badgePositions(
  lines: Readonly<Record<string, EdgeDrawing>>,
  edges: readonly string[],
  trace: readonly { from: string; to: string }[],
): (Pt | null)[] {
  const seen = new Map<string, number>();
  return trace.map((hop) => {
    const edge = edgeOfHop(edges, hop);
    const line = edge && lines[edge.id]?.line;
    if (!edge || !line || line.length < 2) return null;
    const key = `${hop.from}_${hop.to}`;
    const occurrence = seen.get(key) ?? 0;
    seen.set(key, occurrence + 1);
    const count = trace.filter((h) => `${h.from}_${h.to}` === key).length;
    return badgeAt(pointAt(line, 0.5), edge.forward, occurrence, count);
  });
}

/** The hop well's tag and text (spec 04 §2.2). */
export function hopWords(
  scene: Scene,
  hop: number,
  shortOf: (id: string) => string,
  emptyText: string,
): { tag: string; text: string; progress: number } {
  const n = scene.trace.length;
  if (n === 0) return { tag: "No traffic yet", text: emptyText, progress: 100 };
  if (scene.current)
    return {
      tag: `Hop ${hop + 1} of ${n} · ${shortOf(scene.current.from)} → ${shortOf(scene.current.to)}`,
      text: scene.current.text,
      progress: Math.round((Math.min(hop + 1, n) / n) * 100),
    };
  return {
    tag: "End of request · replaying",
    text: "That’s the whole request. It replays from the start.",
    progress: 100,
  };
}
