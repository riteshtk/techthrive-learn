// The 3D diagram's geometry (spec 03 §7.2–7.4, spec 04 §3.2–3.3): a true
// 30° isometric projection at scale 0.9, node plinths, the seven glyph
// shapes, label pills, edge clipping and arrowheads. Pure functions; the
// node positions are the design's, baked into the content files.

export type Pt = readonly [number, number];

/** World units → viewBox px. */
export const SCALE = 0.9;
const SQ3 = Math.sqrt(3);
/** The plinth's thickness, px (7 world units). */
export const SLAB = 7 * SCALE;
/** The selection ring sits 8 world units outside the plinth. */
export const RING_PAD = 8 * SCALE;
/** Edges run 4 world units below the plinth top. */
export const EDGE_DROP = 4 * SCALE;
/** Label pills: 26 px high, 7.1 px a character plus 24 (the design's
    estimate of Inter 12.5/600). */
export const PILL_H = 26;
export const pillWidth = (label: string) =>
  Math.round((24 + 7.1 * [...label].length) * 10) / 10;

/** Glyphs, in world units unless marked px. */
export type Glyph =
  | { type: "cube"; half: number; h: number }
  /** Two blocks, the back one dy world units up, the front one dy down. */
  | { type: "twin"; half: number; h: number; dy: number }
  /** Three thin layers `pitch` apart. */
  | { type: "stack3"; half: number; layer: number; pitch: number }
  /** A block with a smaller one on top. */
  | {
      type: "step2";
      lower: readonly [half: number, h: number];
      upper: readonly [half: number, h: number];
    }
  /** px, as the design bakes them: radius across, height, rings. */
  | { type: "cylinder"; rx: number; h: number; bands: number }
  | { type: "crowd" }
  | { type: "person" };

export type IsoNode = {
  id: string;
  /** Plinth-top centre, viewBox px. */
  cx: number;
  cy: number;
  /** Plinth half-side, world units. */
  plinth: number;
  glyph: Glyph;
};

/** Screen point of an iso offset (a, b, z) in px from an anchor. */
export function project(cx: number, cy: number, a: number, b: number, z = 0) {
  return [cx + (SQ3 / 2) * (a - b), cy + (a + b) / 2 - z] as const;
}

/** The diamond a footprint square of half-size s px draws as. */
export function diamond(cx: number, cy: number, s: number): Pt[] {
  return [
    [cx, cy - s],
    [cx + SQ3 * s, cy],
    [cx, cy + s],
    [cx - SQ3 * s, cy],
  ];
}

export type Poly = { points: Pt[]; shade?: number };

/** A block's faces in paint order: left, its shade, right, its shade, top.
    Base centre (x, y), half-size b and height H in px. */
export function blockFaces(x: number, y: number, b: number, H: number): Poly[] {
  const left: Pt[] = [
    [x - SQ3 * b, y],
    [x, y + b],
    [x, y + b - H],
    [x - SQ3 * b, y - H],
  ];
  const right: Pt[] = [
    [x + SQ3 * b, y],
    [x, y + b],
    [x, y + b - H],
    [x + SQ3 * b, y - H],
  ];
  const top: Pt[] = [
    [x, y - b - H],
    [x + SQ3 * b, y - H],
    [x, y + b - H],
    [x - SQ3 * b, y - H],
  ];
  return [
    { points: left },
    { points: left, shade: 0.38 },
    { points: right },
    { points: right, shade: 0.58 },
    { points: top },
  ];
}

/** The plinth: slab sides, then the top face (spec 03 §7.3). */
export function plinthFaces(node: IsoNode): { sides: Pt[][]; top: Pt[] } {
  const { cx, cy } = node;
  const s = node.plinth * SCALE;
  return {
    sides: [
      [
        [cx - SQ3 * s, cy + SLAB],
        [cx, cy + s + SLAB],
        [cx, cy + s],
        [cx - SQ3 * s, cy],
      ],
      [
        [cx + SQ3 * s, cy + SLAB],
        [cx, cy + s + SLAB],
        [cx, cy + s],
        [cx + SQ3 * s, cy],
      ],
    ],
    top: diamond(cx, cy, s),
  };
}

/** The selection ring around a plinth. */
export function ringOf(node: IsoNode): Pt[] {
  return diamond(node.cx, node.cy, node.plinth * SCALE + RING_PAD);
}

/** Blocks a glyph is made of, back to front: base centre and sizes, px. */
export function glyphBlocks(
  node: IsoNode,
): { x: number; y: number; b: number; H: number }[] {
  const { cx, cy, glyph: g } = node;
  const px = (w: number) => w * SCALE;
  switch (g.type) {
    case "cube":
      return [{ x: cx, y: cy, b: px(g.half), H: px(g.h) }];
    case "twin":
      return [
        { x: cx, y: cy - px(g.dy), b: px(g.half), H: px(g.h) },
        { x: cx, y: cy + px(g.dy), b: px(g.half), H: px(g.h) },
      ];
    case "stack3":
      return [0, 1, 2].map((i) => ({
        x: cx,
        y: cy - i * px(g.pitch),
        b: px(g.half),
        H: px(g.layer),
      }));
    case "step2":
      return [
        { x: cx, y: cy, b: px(g.lower[0]), H: px(g.lower[1]) },
        {
          x: cx,
          y: cy - px(g.lower[1]),
          b: px(g.upper[0]),
          H: px(g.upper[1]),
        },
      ];
    default:
      return [];
  }
}

/** A cylinder: body path, band arcs and top ellipse (spec 03 §7.3). */
export function cylinderParts(
  cx: number,
  cy: number,
  rx: number,
  h: number,
  bands: number,
) {
  const ry = rx / SQ3;
  const top = cy - h;
  const f = (n: number) => Math.round(n * 100) / 100;
  return {
    body: `M${f(cx - rx)} ${f(top)}L${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(cy)}L${f(cx + rx)} ${f(top)}Z`,
    bands: Array.from({ length: bands }, (_, i) => {
      const y = top + (h * (i + 1)) / (bands + 1);
      return `M${f(cx - rx)} ${f(y)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx)} ${f(y)}`;
    }),
    top: { cx, cy: top, rx, ry },
  };
}

/** Head offsets of the 11-figure crowd, px from the plinth centre. */
export const CROWD_HEADS: readonly Pt[] = [
  [0, -52.7],
  [-20.2, -41],
  [20.3, -41],
  [-60.7, -17.6],
  [-20.2, -17.6],
  [20.3, -17.6],
  [60.8, -17.6],
  [-40.5, -5.9],
  [0, -5.9],
  [40.6, -5.9],
  [0, 17.5],
];
export const PERSON_HEAD: Pt = [0, -17.6];

/** Draw order: back to front by cy, then cx (painter's algorithm). */
export function paintOrder<T extends { cx: number; cy: number }>(
  nodes: readonly T[],
): T[] {
  return [...nodes].sort((a, b) => a.cy - b.cy || a.cx - b.cx);
}

/** Where an edge's line starts and ends: both anchors dropped 3.6 px,
    each end clipped at its node's ring square (spec 03 §7.4). */
export function edgeEnds(from: IsoNode, to: IsoNode): { a: Pt; b: Pt } {
  const A: Pt = [from.cx, from.cy + EDGE_DROP];
  const B: Pt = [to.cx, to.cy + EDGE_DROP];
  const d = [B[0] - A[0], B[1] - A[1]] as const;
  const p = d[0] / SQ3 + d[1];
  const q = d[1] - d[0] / SQ3;
  const m = Math.max(Math.abs(p), Math.abs(q));
  const ra = (from.plinth * SCALE + RING_PAD) / m;
  const rb = (to.plinth * SCALE + RING_PAD) / m;
  return {
    a: [A[0] + d[0] * ra, A[1] + d[1] * ra],
    b: [B[0] - d[0] * rb, B[1] - d[1] * rb],
  };
}

/** A 12 × 13 arrowhead whose tip is at `tip`, pointing along from → tip. */
export function arrowhead(from: Pt, tip: Pt, length = 12, width = 13): Pt[] {
  const dx = tip[0] - from[0];
  const dy = tip[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const u = [dx / len, dy / len] as const;
  const n = [-u[1], u[0]] as const;
  const base = [tip[0] - length * u[0], tip[1] - length * u[1]] as const;
  const w = width / 2;
  return [
    tip,
    [base[0] + w * n[0], base[1] + w * n[1]],
    [base[0] - w * n[0], base[1] - w * n[1]],
  ];
}

export type IsoLabel = { id: string; text: string; y: number };

/** A label pill centred on its node: x, width and the text baseline. */
export function labelBox(node: IsoNode, label: IsoLabel) {
  const w = pillWidth(label.text);
  return {
    x: Math.round((node.cx - w / 2) * 10) / 10,
    y: label.y,
    w,
    h: PILL_H,
    textX: node.cx,
    textY: label.y + 17.4,
  };
}

/** The viewBox that fits every plinth and label, padded 18 px (spec 03
    §7.2): the design's diagrams sit at 18 px from the origin, so this is
    a size. */
export function fitViewBox(
  nodes: readonly IsoNode[],
  labels: readonly IsoLabel[],
  pad = 18,
): { width: number; height: number; minX: number; minY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const take = (x: number, y: number) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  };
  for (const n of nodes) {
    const s = n.plinth * SCALE;
    take(n.cx - SQ3 * s, n.cy - s);
    take(n.cx + SQ3 * s, n.cy + s + SLAB);
  }
  for (const l of labels) {
    const node = nodes.find((n) => n.id === l.id);
    if (!node) continue;
    const w = pillWidth(l.text);
    const mid = l.y + PILL_H / 2;
    take(node.cx - w / 2, mid - 14);
    take(node.cx + w / 2, mid + 14);
  }
  return {
    minX: minX - pad,
    minY: minY - pad,
    width: Math.round(maxX + pad),
    height: Math.round(maxY + pad),
  };
}

/** The point "zoom to it" centres on: the node lifted 21 px. */
export function focusPoint(node: { cx: number; cy: number }): Pt {
  return [Math.round(node.cx), Math.round(node.cy - 21)];
}

export const toPoints = (pts: readonly Pt[]) =>
  pts
    .map(([x, y]) => `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`)
    .join(" ");
