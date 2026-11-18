// Which parts of a lesson's system exist at a step, and the request path
// the step plays (spec 04 §2.2, §2.4). Shared by the player and the content
// check, so a lesson that validates is one the player can draw.

export type TraceHop = { from: string; to: string };

export type TraceLesson<H extends TraceHop> = {
  nodes: readonly { id: string; addedAt: number }[];
  bypass?: { node: string; edge: string };
  steps: readonly { trace: readonly H[] }[];
};

/** A node is drawn at a step (1-based) once the step that adds it has
    come, or always in the full-system view. */
export function isPresent(
  lesson: TraceLesson<TraceHop>,
  nodeId: string,
  step: number,
  full = false,
): boolean {
  if (full) return true;
  const node = lesson.nodes.find((n) => n.id === nodeId);
  return node !== undefined && node.addedAt <= step;
}

/** The hops a step plays. While the bypass node isn't built yet, a hop
    into it and the hop out of it collapse into one hop that skips it,
    keeping the first hop's colour and text. */
export function effectiveTrace<H extends TraceHop>(
  lesson: TraceLesson<H>,
  step: number,
  full = false,
): H[] {
  const raw = lesson.steps[step - 1]?.trace ?? [];
  const bypass = lesson.bypass;
  if (!bypass || isPresent(lesson, bypass.node, step, full)) return [...raw];
  const out: H[] = [];
  for (let i = 0; i < raw.length; i++) {
    const hop = raw[i]!;
    const next = raw[i + 1];
    if (hop.to === bypass.node && next && next.from === bypass.node) {
      out.push({ ...hop, to: next.to });
      i++;
    } else out.push(hop);
  }
  return out;
}

/** The bypass edge is only drawn while the node it skips isn't built. */
export function isEdgeVisible(
  lesson: TraceLesson<TraceHop>,
  edgeId: string,
  step: number,
  full = false,
): boolean {
  const bypass = lesson.bypass;
  if (!bypass || bypass.edge !== edgeId) return true;
  return !isPresent(lesson, bypass.node, step, full);
}

/** The edge a hop runs along, in either direction, or undefined. */
export function edgeOfHop(
  edges: readonly string[],
  hop: TraceHop,
): { id: string; forward: boolean } | undefined {
  const forward = `${hop.from}_${hop.to}`;
  if (edges.includes(forward)) return { id: forward, forward: true };
  const backward = `${hop.to}_${hop.from}`;
  if (edges.includes(backward)) return { id: backward, forward: false };
  return undefined;
}
