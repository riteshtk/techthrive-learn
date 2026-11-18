import { describe, expect, it } from "vitest";
import { getDiagram, getTool } from "@/content";
import { drawDiagram } from "@/player/drawing";

// The design lab (PRD P12): every component has a detail, and phones get
// the approved two-column board.

const lab = getTool("ai-agents", "lab")!;
const diagram = getDiagram("ai-agents", lab.diagram)!;
const edges = Object.keys(diagram.paths2);

describe("the reference architecture", () => {
  it("has 13 components, each with a detail", () => {
    expect(diagram.nodes).toHaveLength(13);
    expect(lab.details.map((d) => d.node).sort()).toEqual(
      diagram.nodes.map((n) => n.id).sort(),
    );
  });

  it("draws the design's 880-wide board on desktop", () => {
    const d = drawDiagram(diagram, edges, {});
    expect(d.size2).toEqual([880, 520]);
    expect(d.nodes2.find((n) => n.id === "O")!.box).toEqual([
      460, 312, 184, 54,
    ]);
  });

  it("draws the phone board, two columns with telemetry below", () => {
    const d = drawDiagram(diagram, edges, {}, { portrait: true });
    expect(d.size2).toEqual([328, 774]);
    for (const n of d.nodes2) {
      const [x, , w] = n.box;
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x + w).toBeLessThanOrEqual(328);
    }
    const y = (id: string) => d.nodes2.find((n) => n.id === id)!.box[1];
    for (const t of lab.telemetry)
      for (const n of diagram.nodes)
        if (!lab.telemetry.includes(n.id))
          expect(y(t)).toBeGreaterThan(y(n.id));
    // Every edge has a path on the phone board.
    expect(Object.keys(d.edges2).sort()).toEqual([...edges].sort());
  });
});
