// Diagram layout from grid cells. Pure, and shared by Diagram.tsx (drawing)
// and content/validate.ts (layout checks), so they can never disagree.
//
// Units are SVG viewBox units. The viewBox is VIEW_W wide, which is the
// content width of a 360 px phone (360 − 2 × 16 px gutters), so at 360 px
// one unit is one CSS pixel: boxes are at least 72 px and labels 12 px.

import type { DiagramEdge, DiagramNode } from "@/content/types";

export const VIEW_W = 328;
export const MIN_BOX_W = 72;
export const MAX_BOX_W = 112;
export const BOX_H = 46;
export const ROW_PITCH = 84;
export const PAD = 4;
export const LABEL_SIZE = 12;
export const LABEL_LINE_H = 15;
export const EDGE_LABEL_SIZE = 12;
/** Longest line, in characters, a label may use before wrapping. */
export const LABEL_LINE_CHARS = 10;
/** Distance between the two lines of a two-way edge. */
export const TWO_WAY_OFFSET = 7;
/** Gap left between a line's end and the box it points at. */
const ARROW_GAP = 2;

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };

export type LaidOutNode = DiagramNode & {
  box: Box;
  center: Point;
  lines: string[];
};
export type LaidOutEdge = DiagramEdge & {
  start: Point;
  end: Point;
  mid: Point;
  /** Centre of the label, beside the line (only when the edge has one). */
  labelAt?: Point;
  /** True when the reverse edge also exists and the two are offset. */
  twoWay: boolean;
};

export type Layout = {
  width: number;
  height: number;
  nodes: LaidOutNode[];
  edges: LaidOutEdge[];
};

/** Wraps a label onto lines of at most LABEL_LINE_CHARS where words allow. */
export function wrapLabel(label: string): string[] {
  const lines: string[] = [];
  for (const word of label.trim().split(/\s+/)) {
    const last = lines[lines.length - 1];
    if (last !== undefined && `${last} ${word}`.length <= LABEL_LINE_CHARS) {
      lines[lines.length - 1] = `${last} ${word}`;
    } else {
      lines.push(word);
    }
  }
  return lines;
}

export function layoutDiagram(
  nodes: readonly DiagramNode[],
  edges: readonly DiagramEdge[],
): Layout {
  // Only the columns and rows in use are drawn.
  const xs = nodes.length ? nodes.map((n) => n.x) : [0];
  const ys = nodes.length ? nodes.map((n) => n.y) : [0];
  const firstCol = Math.min(...xs);
  const firstRow = Math.min(...ys);
  const cols = Math.max(...xs) - firstCol + 1;
  const rows = Math.max(...ys) - firstRow + 1;

  // Fewer columns leave wider gaps rather than ever-wider boxes.
  const colPitch = VIEW_W / cols;
  const boxW = Math.min(MAX_BOX_W, Math.max(MIN_BOX_W, colPitch - 30));

  const laidNodes: LaidOutNode[] = nodes.map((n) => {
    const x = (n.x - firstCol) * colPitch + (colPitch - boxW) / 2;
    const y = PAD + (n.y - firstRow) * ROW_PITCH;
    const box = { x, y, w: boxW, h: BOX_H };
    return {
      ...n,
      box,
      center: { x: x + boxW / 2, y: y + BOX_H / 2 },
      lines: wrapLabel(n.label),
    };
  });

  const byId = new Map(laidNodes.map((n) => [n.id, n]));
  const pairs = new Set(edges.map((e) => `${e.from}\u0000${e.to}`));

  const laidEdges: LaidOutEdge[] = edges.flatMap((e) => {
    const from = byId.get(e.from);
    const to = byId.get(e.to);
    if (!from || !to || from === to) return [];
    const twoWay = pairs.has(`${e.to}\u0000${e.from}`);
    let a = from.center;
    let b = to.center;
    if (twoWay) {
      // Shift to the left of the direction of travel; the reverse edge
      // travels the other way, so it lands on the other side.
      const n = unitNormal(a, b);
      a = { x: a.x + n.x * TWO_WAY_OFFSET, y: a.y + n.y * TWO_WAY_OFFSET };
      b = { x: b.x + n.x * TWO_WAY_OFFSET, y: b.y + n.y * TWO_WAY_OFFSET };
    }
    const start = clipToBox(b, a, from.box, 0);
    const end = clipToBox(a, b, to.box, ARROW_GAP);
    return [
      {
        ...e,
        start,
        end,
        mid: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
        twoWay,
      },
    ];
  });

  const height = PAD * 2 + (rows - 1) * ROW_PITCH + BOX_H;
  const view = { x: 0, y: 0, w: VIEW_W, h: height };
  for (const edge of laidEdges) {
    if (edge.label)
      edge.labelAt = placeLabel(edge, edge.label, view, laidNodes);
  }
  return { width: VIEW_W, height, nodes: laidNodes, edges: laidEdges };
}

/** Gap between an edge label and its line. */
const LABEL_GAP = 4;

function labelSize(label: string): { w: number; h: number } {
  return {
    w: estimateTextWidth(label, EDGE_LABEL_SIZE) + 4,
    h: EDGE_LABEL_SIZE + 2,
  };
}

/**
 * Puts a label beside its line, never on it: pushed out along the line's
 * normal just far enough to clear it. Tries the right (or, for flat lines,
 * the upper) side first, a two-way edge's own side first, and keeps the
 * first spot inside the diagram that covers no box.
 */
function placeLabel(
  edge: LaidOutEdge,
  label: string,
  view: Box,
  nodes: readonly LaidOutNode[],
): Point {
  const { w, h } = labelSize(label);
  let n = unitNormal(edge.start, edge.end);
  const prefer = edge.twoWay
    ? 1
    : Math.abs(n.x) > 1e-6
      ? Math.sign(n.x)
      : -Math.sign(n.y);
  n = { x: n.x * prefer, y: n.y * prefer };
  // How far the box reaches along the normal, plus a small gap.
  const d = (w / 2) * Math.abs(n.x) + (h / 2) * Math.abs(n.y) + LABEL_GAP;
  const candidates = [1, -1].map((side) => ({
    x: edge.mid.x + n.x * d * side,
    y: edge.mid.y + n.y * d * side,
  }));
  const fits = (c: Point) => {
    const box = { x: c.x - w / 2, y: c.y - h / 2, w, h };
    const inside =
      box.x >= view.x &&
      box.y >= view.y &&
      box.x + box.w <= view.x + view.w &&
      box.y + box.h <= view.y + view.h;
    return inside && !nodes.some((node) => boxesOverlap(box, node.box));
  };
  return candidates.find(fits) ?? candidates[0]!;
}

function unitNormal(a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dy / len, y: -dx / len };
}

/**
 * Where the line from `inside` (a point within `box`) towards `outside`
 * leaves the box, moved a further `gap` units along the line.
 */
export function clipToBox(
  outside: Point,
  inside: Point,
  box: Box,
  gap: number,
): Point {
  const dx = outside.x - inside.x;
  const dy = outside.y - inside.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return inside;
  const tx =
    dx > 0
      ? (box.x + box.w - inside.x) / dx
      : dx < 0
        ? (box.x - inside.x) / dx
        : Infinity;
  const ty =
    dy > 0
      ? (box.y + box.h - inside.y) / dy
      : dy < 0
        ? (box.y - inside.y) / dy
        : Infinity;
  const t = Math.min(tx, ty) + gap / len;
  return { x: inside.x + dx * t, y: inside.y + dy * t };
}

/** Does the segment a→b pass through the box (Liang–Barsky clipping)? */
export function segmentHitsBox(a: Point, b: Point, box: Box): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let t0 = 0;
  let t1 = 1;
  const checks: [number, number][] = [
    [-dx, a.x - box.x],
    [dx, box.x + box.w - a.x],
    [-dy, a.y - box.y],
    [dy, box.y + box.h - a.y],
  ];
  for (const [p, q] of checks) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const r = q / p;
      if (p < 0) t0 = Math.max(t0, r);
      else t1 = Math.min(t1, r);
      if (t0 > t1) return false;
    }
  }
  return true;
}

/**
 * Edges whose straight line (centre to centre) passes through a node other
 * than its own two ends.
 */
export function edgesCrossingNodes(
  layout: Layout,
): { edge: LaidOutEdge; node: LaidOutNode }[] {
  const byId = new Map(layout.nodes.map((n) => [n.id, n]));
  const hits: { edge: LaidOutEdge; node: LaidOutNode }[] = [];
  for (const edge of layout.edges) {
    const a = byId.get(edge.from)?.center;
    const b = byId.get(edge.to)?.center;
    if (!a || !b) continue;
    for (const node of layout.nodes) {
      if (node.id === edge.from || node.id === edge.to) continue;
      if (segmentHitsBox(a, b, node.box)) hits.push({ edge, node });
    }
  }
  return hits;
}

/** Rough width of text in viewBox units (Inter averages about 0.56 em). */
export function estimateTextWidth(text: string, size: number): number {
  return text.length * size * 0.56;
}

/** The area an edge's label takes up, beside its line. */
export function edgeLabelBox(edge: LaidOutEdge): Box | undefined {
  if (!edge.label || !edge.labelAt) return undefined;
  const { w, h } = labelSize(edge.label);
  return { x: edge.labelAt.x - w / 2, y: edge.labelAt.y - h / 2, w, h };
}

export function boxesOverlap(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  );
}

/**
 * Edge labels with nowhere to go: on top of a node box, or outside the
 * diagram, on both sides of their line.
 */
export function edgeLabelsOverNodes(
  layout: Layout,
): { edge: LaidOutEdge; node?: LaidOutNode }[] {
  const hits: { edge: LaidOutEdge; node?: LaidOutNode }[] = [];
  for (const edge of layout.edges) {
    const box = edgeLabelBox(edge);
    if (!box) continue;
    const node = layout.nodes.find((n) => boxesOverlap(box, n.box));
    const outside =
      box.x < 0 ||
      box.y < 0 ||
      box.x + box.w > layout.width ||
      box.y + box.h > layout.height;
    if (node || outside) hits.push({ edge, node });
  }
  return hits;
}
