// 2D diagram geometry (spec 04 §3.4, §3.6): the baked orthogonal edge
// paths, points along them, and where hop badges sit beside an edge.

import { arrowhead, type Pt } from "./iso";

/** "M104.0,218.0 L104.0,292.0" → its vertices. */
export function parsePath(d: string): Pt[] {
  return [...d.matchAll(/[ML]\s*(-?[\d.]+)[,\s]+(-?[\d.]+)/g)].map(
    (m) => [Number(m[1]), Number(m[2])] as const,
  );
}

export const pathOf = (points: readonly Pt[]) =>
  points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");

function lengths(points: readonly Pt[]): number[] {
  const out = [0];
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1]!;
    const [bx, by] = points[i]!;
    out.push(out[i - 1]! + Math.hypot(bx - ax, by - ay));
  }
  return out;
}

/** The point at a fraction of a polyline's length, and the direction of
    the segment it is on. */
export function pointAt(points: readonly Pt[], t: number): { p: Pt; d: Pt } {
  const cum = lengths(points);
  const total = cum[cum.length - 1] ?? 0;
  const target = total * t;
  for (let i = 1; i < points.length; i++) {
    if (cum[i]! >= target || i === points.length - 1) {
      const a = points[i - 1]!;
      const b = points[i]!;
      const seg = cum[i]! - cum[i - 1]! || 1;
      const k = (target - cum[i - 1]!) / seg;
      const d: Pt = [(b[0] - a[0]) / seg, (b[1] - a[1]) / seg];
      return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], d };
    }
  }
  return { p: points[0] ?? [0, 0], d: [1, 0] };
}

/** Packet keyframe stops for a polyline: each vertex and where along the
    whole length it falls (0–1). */
export function stops(points: readonly Pt[]): { p: Pt; offset: number }[] {
  const cum = lengths(points);
  const total = cum[cum.length - 1] || 1;
  return points.map((p, i) => ({ p, offset: cum[i]! / total }));
}

/** Arrowheads for a 2D path: at its end pointing along the last segment,
    and at its start pointing back along the first. */
export function pathArrows(points: readonly Pt[]): { f: Pt[]; b: Pt[] } {
  const n = points.length;
  return {
    f: arrowhead(points[n - 2]!, points[n - 1]!),
    b: arrowhead(points[1]!, points[0]!),
  };
}

/** Where badge k of a hop sits: beside the edge's middle, on the side of
    its travel direction, repeats spread 28 px along it. */
export function badgeAt(
  mid: { p: Pt; d: Pt },
  forward: boolean,
  occurrence: number,
  count: number,
): Pt {
  const [dx, dy] = mid.d;
  const n: Pt = [-dy, dx];
  const side = forward ? 1 : -1;
  const shift = (occurrence - (count - 1) / 2) * 28;
  return [
    mid.p[0] + n[0] * 17 * side + dx * shift,
    mid.p[1] + n[1] * 17 * side + dy * shift,
  ];
}
