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
  PILL_H,
  SCALE,
  SLAB,
  paintOrder,
  PERSON_HEAD,
  plinthFaces,
  ringOf,
  toPoints,
  type Glyph,
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

function glyphOf(node: IsoNode, scale = 1): GlyphDrawing {
  const g = node.glyph;
  if (g.type === "crowd" || g.type === "person") {
    const heads = g.type === "crowd" ? CROWD_HEADS : [PERSON_HEAD];
    return {
      kind: "figures",
      heads: heads.map(([x, y]) =>
        rp([node.cx + x * scale, node.cy + y * scale]),
      ),
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

/** A glyph at a smaller size: block sizes in world units, cylinders in
    px; figures scale their spacing in glyphOf. */
function scaleGlyph(g: Glyph, s: number): Glyph {
  switch (g.type) {
    case "cube":
      return { ...g, half: g.half * s, h: g.h * s };
    case "twin":
      return { ...g, half: g.half * s, h: g.h * s, dy: g.dy * s };
    case "stack3":
      return { ...g, half: g.half * s, layer: g.layer * s, pitch: g.pitch * s };
    case "step2":
      return {
        ...g,
        lower: [g.lower[0] * s, g.lower[1] * s],
        upper: [g.upper[0] * s, g.upper[1] * s],
      };
    case "cylinder":
      return { ...g, rx: g.rx * s, h: g.h * s };
    default:
      return g;
  }
}

/** The highest point of a drawn glyph, for placing a label over it. */
function glyphTop(n: IsoNode, glyph: GlyphDrawing): number {
  if (glyph.kind === "blocks")
    return Math.min(
      ...glyph.faces.flatMap((f) =>
        f.points.split(" ").map((p) => Number(p.split(",")[1])),
      ),
    );
  if (glyph.kind === "cylinder") return glyph.top.cy - glyph.top.ry;
  return Math.min(...glyph.heads.map(([, y]) => y - 3.4), n.cy);
}

/**
 * Draws a diagram for the stage. With `portrait`, the 3D view is the
 * diagram's phone layout (the approved still) instead of the design's:
 * the same glyphs at the portrait's scale, labels placed over (or under)
 * each glyph and the viewBox fitted to them. 2D is the same either way.
 */
export function drawDiagram(
  diagram: Diagram,
  edges: readonly string[],
  /** Icon paths by name (24 px grid). */
  icons: Readonly<Record<string, string>>,
  options: { portrait?: boolean } = {},
): Drawing {
  const portrait = options.portrait ? diagram.portrait : undefined;
  const scale = portrait?.scale ?? 1;
  const iso = new Map<string, IsoNode>(
    diagram.nodes.map((n) => {
      const at = portrait?.nodes.find((p) => p.id === n.id);
      return [
        n.id,
        {
          id: n.id,
          cx: at?.cx ?? n.cx,
          cy: at?.cy ?? n.cy,
          plinth: n.plinth * scale,
          glyph: scaleGlyph(n.glyph, scale),
        },
      ];
    }),
  );
  const byId = new Map(diagram.nodes.map((n) => [n.id, n]));
  const glyphs = new Map(
    [...iso.values()].map((n) => [n.id, glyphOf(n, scale)]),
  );
  const labels = diagram.nodes.map((n) => {
    if (!portrait) return { id: n.id, text: n.label, y: n.labelY };
    const at = portrait.nodes.find((p) => p.id === n.id)!;
    const node = iso.get(n.id)!;
    const y = at.below
      ? node.cy + node.plinth * SCALE + SLAB + 8
      : Math.min(
          glyphTop(node, glyphs.get(n.id)!),
          node.cy - node.plinth * SCALE,
        ) -
        8 -
        PILL_H;
    return { id: n.id, text: at.label, y: r1(y) };
  });
  const labelOf = new Map(labels.map((l) => [l.id, l]));
  const fit = fitViewBox([...iso.values()], labels);
  // A portrait's coordinates are its own: shift them to start at the
  // margin, as the design's drawings do.
  const dx = portrait ? -fit.minX : 0;
  const dy = portrait ? -fit.minY : 0;
  if (portrait) {
    for (const n of iso.values()) {
      n.cx += dx;
      n.cy += dy;
    }
    for (const l of labels) l.y = r1(l.y + dy);
    for (const n of iso.values()) glyphs.set(n.id, glyphOf(n, scale));
  }
  const size3: [number, number] = portrait
    ? [Math.round(fit.width - fit.minX), Math.round(fit.height - fit.minY)]
    : [fit.width, fit.height];

  const nodes3 = paintOrder([...iso.values()]).map((n): NodeDrawing3 => {
    const node = byId.get(n.id)!;
    const plinth = plinthFaces(n);
    const label = labelOf.get(n.id)!;
    const box = labelBox(n, label);
    return {
      id: n.id,
      color: node.color,
      ring: toPoints(ringOf(n)),
      slabs: plinth.sides.map(toPoints),
      plate: toPoints(plinth.top),
      glyph: glyphs.get(n.id)!,
      label: {
        x: box.x,
        y: box.y,
        w: box.w,
        text: label.text,
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
    size3,
    size2: diagram.size2 ? [...diagram.size2] : [960, 500],
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
