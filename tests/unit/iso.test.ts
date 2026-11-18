import { describe, expect, it } from "vitest";
import type { Diagram } from "@/content/types";
import {
  arrowhead,
  diamond,
  edgeEnds,
  fitViewBox,
  glyphBlocks,
  labelBox,
  paintOrder,
  project,
  type IsoNode,
} from "@/player/iso";
import { AGENTS, BAKED, PAYMENTS } from "./fixtures/diagrams";

const TOLERANCE = 0.25;

function close(actual: number, expected: number, what: string) {
  expect(
    Math.abs(actual - expected),
    `${what}: ${actual} vs ${expected}`,
  ).toBeLessThanOrEqual(TOLERANCE);
}

const iso = (d: Diagram): IsoNode[] =>
  d.nodes.map((n) => ({
    id: n.id,
    cx: n.cx,
    cy: n.cy,
    plinth: n.plinth,
    glyph: n.glyph,
  }));

describe.each([
  ["agents", AGENTS],
  ["payments", PAYMENTS],
] as const)("the %s diagram matches the design", (key, diagram) => {
  const baked = BAKED[key];
  const nodes = iso(diagram);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let checked = 0;

  it("edge ends, clipped at each ring", () => {
    for (const [id, want] of Object.entries(baked.edges)) {
      const [from, to] = id.split("_").map((n) => byId.get(n)!);
      const { a, b } = edgeEnds(from!, to!);
      close(a[0], want.a[0], `${id} a.x`);
      close(a[1], want.a[1], `${id} a.y`);
      close(b[0], want.b[0], `${id} b.x`);
      close(b[1], want.b[1], `${id} b.y`);
      checked += 4;
    }
  });

  it("label pills: width and left edge", () => {
    for (const node of diagram.nodes) {
      const want = baked.labels[node.id]!;
      const box = labelBox(byId.get(node.id)!, {
        id: node.id,
        text: node.label,
        y: node.labelY,
      });
      close(box.w, want.w, `${node.id} label width`);
      close(box.x, want.x, `${node.id} label x`);
      checked += 2;
    }
  });

  it("stacked glyph blocks sit where the design draws them", () => {
    for (const [id, ys] of Object.entries(baked.blockY)) {
      const blocks = glyphBlocks(byId.get(id)!);
      const drawn = blocks.map((b) => b.y).sort((p, q) => q - p);
      const want = [...ys].sort((p, q) => q - p);
      expect(drawn).toHaveLength(want.length);
      drawn.forEach((y, i) => close(y, want[i]!, `${id} block ${i}`));
      checked += ys.length;
    }
  });

  it("the viewBox fits plinths and labels with 18 px to spare", () => {
    const fit = fitViewBox(
      nodes,
      diagram.nodes.map((n) => ({ id: n.id, text: n.label, y: n.labelY })),
    );
    expect([fit.width, fit.height]).toEqual(baked.viewBox);
    close(fit.minX, 0, "left margin");
    close(fit.minY, 0, "top margin");
    checked += 4;
  });

  it("checks a value for every baked number", () => {
    const expected =
      Object.keys(baked.edges).length * 4 +
      Object.keys(baked.labels).length * 2 +
      Object.values(baked.blockY).flat().length +
      4;
    expect(checked).toBe(expected);
  });
});

describe("projection", () => {
  it("is a true 30° isometric", () => {
    const [x, y] = project(0, 0, 10, 0, 0);
    expect(Math.atan2(y, x) * (180 / Math.PI)).toBeCloseTo(30, 6);
    expect(project(100, 100, 0, 0, 20)).toEqual([100, 80]);
  });

  it("draws a footprint square as a √3 : 1 diamond", () => {
    const [top, right, bottom, left] = diamond(0, 0, 10);
    expect(right![0] - left![0]).toBeCloseTo(20 * Math.sqrt(3), 6);
    expect(bottom![1] - top![1]).toBe(20);
  });

  it("paints back to front by cy, then cx", () => {
    expect(
      paintOrder(iso(AGENTS))
        .map((n) => n.id)
        .join(""),
    ).toBe("XMPHEOTGDUV");
    expect(
      paintOrder(iso(PAYMENTS))
        .map((n) => n.id)
        .join(""),
    ).toBe("IVWRSPACNLQ");
  });

  it("makes a 12 × 13 arrowhead pointing at its tip", () => {
    const [tip, c1, c2] = arrowhead([0, 0], [100, 0]);
    expect(tip).toEqual([100, 0]);
    expect(c1![0]).toBeCloseTo(88, 6);
    expect(Math.abs(c1![1] - c2![1])).toBeCloseTo(13, 6);
  });
});
