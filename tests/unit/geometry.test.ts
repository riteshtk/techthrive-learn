import { describe, expect, it } from "vitest";
import type { DiagramEdge, DiagramNode } from "@/content/types";
import { getTopics } from "@/content";
import {
  BOX_H,
  LABEL_SIZE,
  MIN_BOX_W,
  TWO_WAY_OFFSET,
  clipToBox,
  edgeLabelBox,
  edgeLabelsOverNodes,
  edgesCrossingNodes,
  layoutDiagram,
  segmentHitsBox,
  VIEW_W,
  wrapLabel,
} from "@/player/geometry";

const node = (id: string, x: number, y: number): DiagramNode => ({
  id,
  label: id,
  note: "A part.",
  x,
  y,
});
const edge = (from: string, to: string, label?: string): DiagramEdge => ({
  id: `${from}-${to}`,
  from,
  to,
  label,
});

describe("layout", () => {
  it("keeps boxes at least 72 units wide even with all four columns", () => {
    const layout = layoutDiagram(
      [node("a", 0, 0), node("b", 1, 0), node("c", 2, 0), node("d", 3, 0)],
      [],
    );
    for (const n of layout.nodes)
      expect(n.box.w).toBeGreaterThanOrEqual(MIN_BOX_W);
    const last = layout.nodes[3]!.box;
    expect(last.x + last.w).toBeLessThanOrEqual(VIEW_W);
  });

  it("matches a 360 px phone: one unit per CSS pixel, 12 px labels", () => {
    // The stage is 360 − 2 × 16 px gutters − a 1 px border on each side.
    const stageInner = 360 - 2 * 16 - 2;
    expect(VIEW_W).toBeLessThanOrEqual(stageInner);
    expect(LABEL_SIZE).toBeGreaterThanOrEqual(12);
  });

  it("only draws the rows in use", () => {
    const layout = layoutDiagram([node("a", 1, 2), node("b", 1, 3)], []);
    expect(layout.nodes[0]!.box.y).toBeLessThan(10);
    expect(layout.height).toBeLessThan(2 * BOX_H + 100);
  });
});

describe("edges", () => {
  it("are clipped at the box borders", () => {
    const layout = layoutDiagram(
      [node("a", 0, 0), node("b", 0, 1)],
      [edge("a", "b")],
    );
    const [a, b] = layout.nodes;
    const e = layout.edges[0]!;
    expect(e.start.y).toBeCloseTo(a!.box.y + a!.box.h);
    expect(e.end.y).toBeLessThan(b!.box.y);
    expect(e.end.y).toBeGreaterThan(b!.box.y - 5);
    expect(e.mid.y).toBeCloseTo((e.start.y + e.end.y) / 2);
  });

  it("running both ways are offset to either side", () => {
    const layout = layoutDiagram(
      [node("a", 0, 0), node("b", 1, 0)],
      [edge("a", "b"), edge("b", "a")],
    );
    const [ab, ba] = layout.edges;
    expect(ab!.twoWay && ba!.twoWay).toBe(true);
    expect(Math.abs(ab!.start.y - ba!.start.y)).toBeCloseTo(2 * TWO_WAY_OFFSET);
  });

  it("one way are not offset", () => {
    const layout = layoutDiagram(
      [node("a", 0, 0), node("b", 1, 0)],
      [edge("a", "b")],
    );
    const [a] = layout.nodes;
    expect(layout.edges[0]!.start.y).toBeCloseTo(a!.center.y);
  });

  it("clip diagonal lines to the side they leave through", () => {
    const box = { x: 0, y: 0, w: 100, h: 40 };
    const p = clipToBox({ x: 150, y: 200 }, { x: 50, y: 20 }, box, 0);
    expect(p.y).toBeCloseTo(40);
  });
});

describe("crossings", () => {
  it("finds an edge passing through a third node", () => {
    const layout = layoutDiagram(
      [node("a", 0, 0), node("b", 0, 1), node("c", 0, 2)],
      [edge("a", "c")],
    );
    expect(edgesCrossingNodes(layout).map((h) => h.node.id)).toEqual(["b"]);
  });

  it("ignores lines that only pass between nodes", () => {
    const layout = layoutDiagram(
      [node("a", 1, 1), node("b", 2, 2), node("c", 2, 1)],
      [edge("b", "a")],
    );
    expect(edgesCrossingNodes(layout)).toEqual([]);
  });

  it("segmentHitsBox handles misses and hits", () => {
    const box = { x: 10, y: 10, w: 10, h: 10 };
    expect(segmentHitsBox({ x: 0, y: 0 }, { x: 30, y: 30 }, box)).toBe(true);
    expect(segmentHitsBox({ x: 0, y: 0 }, { x: 30, y: 0 }, box)).toBe(false);
  });

  it("finds an edge label with no room between side-by-side boxes", () => {
    const four = [
      node("a", 0, 0),
      node("b", 1, 0),
      node("c", 2, 0),
      node("d", 3, 0),
    ];
    const layout = layoutDiagram(four, [edge("a", "b", "embedded")]);
    expect(edgeLabelsOverNodes(layout).length).toBeGreaterThan(0);
  });
});

describe("edge labels", () => {
  it("sit beside a vertical line, not on it", () => {
    const layout = layoutDiagram(
      [node("a", 0, 0), node("b", 0, 2)],
      [edge("a", "b", "embedded")],
    );
    const e = layout.edges[0]!;
    const box = edgeLabelBox(e)!;
    expect(segmentHitsBox(e.start, e.end, box)).toBe(false);
    expect(box.x).toBeGreaterThan(e.start.x);
  });

  it("move to the other side when the first has no room", () => {
    // Rightmost column: the label goes on the left of the line.
    const layout = layoutDiagram(
      [node("a", 0, 0), node("b", 3, 0), node("c", 3, 2)],
      [edge("b", "c", "embedded")],
    );
    const e = layout.edges[0]!;
    const box = edgeLabelBox(e)!;
    expect(box.x + box.w).toBeLessThan(e.start.x);
    expect(box.x + box.w).toBeLessThanOrEqual(layout.width);
  });

  it("sit above a flat line", () => {
    const layout = layoutDiagram(
      [node("a", 0, 0), node("b", 2, 0)],
      [edge("a", "b", "sends")],
    );
    const e = layout.edges[0]!;
    expect(edgeLabelBox(e)!.y + edgeLabelBox(e)!.h).toBeLessThan(e.start.y);
  });
});

describe("labels", () => {
  it.each([
    ["Model", ["Model"]],
    ["Next token", ["Next token"]],
    ["Vector store", ["Vector", "store"]],
    ["Permission check", ["Permission", "check"]],
    ["ab cdefghij klmnopq", ["ab", "cdefghij", "klmnopq"]],
  ])("wraps %j", (label, lines) => {
    expect(wrapLabel(label)).toEqual(lines);
  });
});

describe("shipped topics", () => {
  it.each(getTopics().map((t) => [t.id, t] as const))(
    "%s has no crossings or crowded labels",
    (_id, topic) => {
      const layout = layoutDiagram(topic.diagram.nodes, topic.diagram.edges);
      expect(edgesCrossingNodes(layout)).toEqual([]);
      expect(edgeLabelsOverNodes(layout)).toEqual([]);
      for (const e of layout.edges) {
        const box = edgeLabelBox(e);
        if (box) expect(segmentHitsBox(e.start, e.end, box)).toBe(false);
      }
    },
  );
});
