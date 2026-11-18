// A diagram drawn at build time: every polygon, path and label box the stage
// needs, in both views. Pages compute it on the server and pass it as data,
// so the projection maths (iso.ts) never ships to the browser and the
// lesson page stays inside its JavaScript budget.

import type { ColorKey, Diagram } from "@/content/types";
import { parsePath } from "./flat";
import type { Box } from "./scene";
import {
  arrowhead,
  blockFaces,
  CROWD_HEADS,
  cylinderParts,
  edgeEnds,
  fitViewBox,
  focusPoint,
  glyphBlocks,
  labelBox,
  paintOrder,
  PERSON_HEAD,
  plinthFaces,
  ringOf,
  toPoints,
  type IsoNode,
  type Pt,
} from "./iso";

export type GlyphDrawing =
  | { kind: "blocks"; faces: { points: string; shade?: number }[] }
  | {
      kind: "cylinder";
      body: string;
      bands: string[];
      top: { cx: number; cy: number; rx: number; ry: number };
    }
  | { kind: "figures"; heads: Pt[]; solo: boolean };

export type NodeDrawing3 = {
  id: string;
  color: ColorKey;
  ring: string;
  slabs: string[];
  plate: string;
  glyph: GlyphDrawing;
  label: {
    x: number;
    y: number;
    w: number;
    text: string;
    tx: number;
    ty: number;
  };
};

export type NodeDrawing2 = {
  id: string;
  color: ColorKey;
  box: [number, number, number, number];
  icon: string;
  name: string;
  sub: string;
};

/** A drawn edge: its line (3D: two points; 2D: the path's corners) and
    the arrowheads at each end, as SVG points. */
export type EdgeDrawing = { line: Pt[]; forward: string; backward: string };

export type Drawing = {
  size3: [number, number];
  size2: [number, number];
  /** Back to front. */
  nodes3: NodeDrawing3[];
  nodes2: NodeDrawing2[];
  edges3: Record<string, EdgeDrawing>;
  edges2: Record<string, EdgeDrawing>;
  /** What hop badges must keep off: 3D label pills, 2D node boxes. */
  labels3: Box[];
  boxes2: Box[];
  /** Where "zoom to it" and the phone camera centre, per view. */
  focus3: Record<string, Pt>;
  focus2: Record<string, Pt>;
};

/** Arrowheads for a 2D path: at its end pointing along the last segment,
    and at its start pointing back along the first. */
function pathArrows(points: readonly Pt[]): { f: Pt[]; b: Pt[] } {
  const n = points.length;
  return {
    f: arrowhead(points[n - 2]!, points[n - 1]!),
    b: arrowhead(points[1]!, points[0]!),
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const rp = (p: Pt): Pt => [r1(p[0]), r1(p[1])];

function glyphOf(node: IsoNode): GlyphDrawing {
  const g = node.glyph;
  if (g.type === "crowd" || g.type === "person") {
    const heads = g.type === "crowd" ? CROWD_HEADS : [PERSON_HEAD];
    return {
      kind: "figures",
      heads: heads.map(([x, y]) => rp([node.cx + x, node.cy + y])),
      solo: g.type === "person",
    };
  }
  if (g.type === "cylinder") {
    const c = cylinderParts(node.cx, node.cy, g.rx, g.h, g.bands);
    return {
      kind: "cylinder",
      body: c.body,
      bands: c.bands,
      top: {
        cx: r1(c.top.cx),
        cy: r1(c.top.cy),
        rx: r1(c.top.rx),
        ry: r1(c.top.ry),
      },
    };
  }
  return {
    kind: "blocks",
    faces: glyphBlocks(node).flatMap((b) =>
      blockFaces(b.x, b.y, b.b, b.H).map((f) => ({
        points: toPoints(f.points),
        ...(f.shade ? { shade: f.shade } : {}),
      })),
    ),
  };
}

export function drawDiagram(
  diagram: Diagram,
  edges: readonly string[],
  /** Icon paths by name (24 px grid). */
  icons: Readonly<Record<string, string>>,
): Drawing {
  const iso = new Map<string, IsoNode>(
    diagram.nodes.map((n) => [
      n.id,
      { id: n.id, cx: n.cx, cy: n.cy, plinth: n.plinth, glyph: n.glyph },
    ]),
  );
  const byId = new Map(diagram.nodes.map((n) => [n.id, n]));
  const fit = fitViewBox(
    [...iso.values()],
    diagram.nodes.map((n) => ({ id: n.id, text: n.label, y: n.labelY })),
  );

  const nodes3 = paintOrder([...iso.values()]).map((n): NodeDrawing3 => {
    const node = byId.get(n.id)!;
    const plinth = plinthFaces(n);
    const box = labelBox(n, { id: n.id, text: node.label, y: node.labelY });
    return {
      id: n.id,
      color: node.color,
      ring: toPoints(ringOf(n)),
      slabs: plinth.sides.map(toPoints),
      plate: toPoints(plinth.top),
      glyph: glyphOf(n),
      label: {
        x: box.x,
        y: box.y,
        w: box.w,
        text: node.label,
        tx: r1(box.textX),
        ty: r1(box.textY),
      },
    };
  });

  const edges3: Record<string, EdgeDrawing> = {};
  const edges2: Record<string, EdgeDrawing> = {};
  for (const id of edges) {
    const [a, b] = id.split("_").map((k) => iso.get(k));
    if (a && b) {
      const ends = edgeEnds(a, b);
      edges3[id] = {
        line: [rp(ends.a), rp(ends.b)],
        forward: toPoints(arrowhead(ends.a, ends.b)),
        backward: toPoints(arrowhead(ends.b, ends.a)),
      };
    }
    const points = parsePath(diagram.paths2[id] ?? "");
    if (points.length > 1) {
      const heads = pathArrows(points);
      edges2[id] = {
        line: points,
        forward: toPoints(heads.f),
        backward: toPoints(heads.b),
      };
    }
  }

  return {
    labels3: nodes3.map((n) => [n.label.x, n.label.y, n.label.w, 26] as const),
    boxes2: diagram.nodes.map((n) => [...n.box2] as const),
    size3: [fit.width, fit.height],
    size2: [960, 500],
    nodes3,
    nodes2: diagram.nodes.map((n) => ({
      id: n.id,
      color: n.color,
      box: [...n.box2],
      icon: icons[n.icon] ?? "",
      name: n.name2,
      sub: n.sub2,
    })),
    edges3,
    edges2,
    focus3: Object.fromEntries(
      [...iso.values()].map((n) => [n.id, focusPoint(n)]),
    ),
    focus2: Object.fromEntries(
      diagram.nodes.map((n) => [
        n.id,
        [n.box2[0] + n.box2[2] / 2, n.box2[1] + n.box2[3] / 2] as Pt,
      ]),
    ),
  };
}
