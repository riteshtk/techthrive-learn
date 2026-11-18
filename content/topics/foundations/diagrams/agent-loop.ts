// The agent-loop diagram (PRD P17), as approved in the Foundations stills
// (18 Nov 2026): v1's parts and flows on the 4 × 4 grid, projected to 3D.
import type { Diagram } from "../../../types";

const box = (x: number, y: number, w = 168, h = 56) =>
  [x, y, w, h] as [number, number, number, number];

const diagram: Diagram = {
  id: "agent-loop",
  topic: "foundations",
  caption: "The agent loop",
  nodes: [
    {
      id: "G",
      color: "text",
      label: "Goal",
      labelY: 116.6,
      cx: 370,
      cy: 166.6,
      plinth: 36,
      glyph: { type: "person" },
      name2: "Goal",
      sub2: "in plain words",
      box2: box(20, 162),
      icon: "user",
    },
    {
      id: "M",
      color: "violet",
      label: "Model",
      labelY: 165.2,
      cx: 520,
      cy: 253.2,
      plinth: 56,
      glyph: { type: "cube", half: 36, h: 56 },
      name2: "Model",
      sub2: "next step",
      box2: box(272, 162),
      icon: "chip",
    },
    {
      id: "P",
      color: "amber",
      label: "Permission check",
      labelY: 193.2,
      cx: 820,
      cy: 253.2,
      plinth: 44,
      glyph: { type: "cube", half: 27, h: 30 },
      name2: "Permission check",
      sub2: "allowed or not",
      box2: box(532, 42),
      icon: "shield",
    },
    {
      id: "T",
      color: "green",
      label: "Tool",
      labelY: 360.4,
      cx: 820,
      cy: 426.4,
      plinth: 44,
      glyph: { type: "twin", half: 15, h: 24, dy: 18 },
      name2: "Tool",
      sub2: "returns a result",
      box2: box(772, 162),
      icon: "server",
    },
    {
      id: "A",
      color: "cyan",
      label: "Answer",
      labelY: 287.8,
      cx: 370,
      cy: 339.8,
      plinth: 40,
      glyph: { type: "step2", lower: [23, 14], upper: [17, 12] },
      name2: "Answer",
      sub2: "no tool needed",
      box2: box(272, 292),
      icon: "check",
    },
  ],
  paths2: {
    G_M: "M188,190 L272,190",
    M_P: "M356,162 L356,70 L532,70",
    P_T: "M700,70 L856,70 L856,162",
    T_M: "M772,190 L440,190",
    M_A: "M356,218 L356,292",
  },
};

export default diagram;
