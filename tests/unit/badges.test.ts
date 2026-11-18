import { describe, expect, it } from "vitest";
import { getDiagram, getLessons, getTopics } from "@/content";
import { drawDiagram } from "@/player/drawing";
import { badgePositions, type Box } from "@/player/scene";
import { effectiveTrace } from "@/player/trace";

// Hop badges never cover a 3D label pill or a 2D node box, nor each other
// (fix to the design, which lets the payments step 3 badge cover the
// "API · Idempotency-Key" label).

const R = 13; // the badge's drawn radius

const covers = (p: readonly [number, number], [x, y, w, h]: Box) => {
  const nx = Math.max(x, Math.min(p[0], x + w));
  const ny = Math.max(y, Math.min(p[1], y + h));
  return Math.hypot(p[0] - nx, p[1] - ny) < R;
};

describe.each(getLessons().map((l) => [`${l.topic}/${l.id}`, l] as const))(
  "badges in %s",
  (_, lesson) => {
    const drawing = drawDiagram(
      getDiagram(lesson.topic, lesson.diagram)!,
      lesson.edges,
      {},
    );

    it.each([
      ["3D", drawing.edges3, drawing.labels3],
      ["2D", drawing.edges2, drawing.boxes2],
    ] as const)(
      "keep off the labels and boxes in %s, at every step",
      (view, lines, avoid) => {
        for (let step = 1; step <= lesson.steps.length; step++)
          for (const full of [false, true]) {
            const trace = effectiveTrace(lesson, step, full);
            const at = badgePositions(lines, lesson.edges, trace, avoid);
            at.forEach((p, j) => {
              if (!p) return;
              for (const box of avoid)
                expect(
                  covers(p, box),
                  `${view} step ${step} hop ${j + 1}`,
                ).toBe(false);
              at.slice(0, j).forEach((q) => {
                if (q)
                  expect(
                    Math.hypot(p[0] - q[0], p[1] - q[1]),
                  ).toBeGreaterThanOrEqual(2 * R);
              });
            });
          }
      },
    );
  },
);

// The overview hero, in the desktop layout and the phone portrait, whose
// short edges need the wider search.
describe.each(
  getTopics()
    .filter((t) => t.overview)
    .map((t) => [t.id, t] as const),
)("hero badges in %s", (_, topic) => {
  const o = topic.overview!;
  const diagram = getDiagram(topic.id, o.diagram)!;
  const edges = Object.keys(diagram.paths2);

  it.each([false, true])("keep off the labels (portrait: %s)", (portrait) => {
    const drawing = drawDiagram(diagram, edges, {}, { portrait });
    const [w, h] = drawing.size3;
    const at = badgePositions(
      drawing.edges3,
      edges,
      o.heroTrace,
      drawing.labels3,
      drawing.size3,
    );
    at.forEach((p, j) => {
      expect(p, `hop ${j + 1} has an edge`).not.toBeNull();
      const [x, y] = p!;
      expect(
        x >= R && y >= R && x <= w - R && y <= h - R,
        `hop ${j + 1} inside the drawing`,
      ).toBe(true);
      for (const box of drawing.labels3)
        expect(covers(p!, box), `hop ${j + 1}`).toBe(false);
      at.slice(0, j).forEach((q) =>
        expect(Math.hypot(p![0] - q![0], p![1] - q![1])).toBeGreaterThanOrEqual(
          2 * R,
        ),
      );
    });
  });
});
