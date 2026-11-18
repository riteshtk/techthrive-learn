// The llm-answers diagram (PRD P17), as approved in the Foundations stills
// (18 Nov 2026): v1's parts and flows on the 4 × 4 grid, projected to 3D.
import type { Diagram } from "../../../types";

const box = (x: number, y: number, w = 168, h = 56) =>
  [x, y, w, h] as [number, number, number, number];

const diagram: Diagram = {
  id: "llm-answers",
  topic: "foundations",
  caption: "How an LLM answers",
  nodes: [
    {
      id: "P",
      color: "cyan",
      label: "Prompt",
      labelY: 114.6,
      cx: 370,
      cy: 166.6,
      plinth: 40,
      glyph: { type: "step2", lower: [23, 14], upper: [17, 12] },
      name2: "Prompt",
      sub2: "plain text",
      box2: box(20, 162),
      icon: "send",
    },
    {
      id: "T",
      color: "amber",
      label: "Tokenizer",
      labelY: 197.2,
      cx: 520,
      cy: 253.2,
      plinth: 42,
      glyph: { type: "stack3", half: 24, layer: 5, pitch: 9 },
      name2: "Tokenizer",
      sub2: "text to tokens",
      box2: box(272, 162),
      icon: "layers",
    },
    {
      id: "M",
      color: "violet",
      label: "Model",
      labelY: 251.8,
      cx: 670,
      cy: 339.8,
      plinth: 56,
      glyph: { type: "cube", half: 36, h: 56 },
      name2: "Model",
      sub2: "scores tokens",
      box2: box(532, 162),
      icon: "chip",
    },
    {
      id: "N",
      color: "green",
      label: "Next token",
      labelY: 370.4,
      cx: 820,
      cy: 426.4,
      plinth: 40,
      glyph: { type: "cube", half: 24, h: 24 },
      name2: "Next token",
      sub2: "sampled",
      box2: box(772, 162),
      icon: "check",
    },
    {
      id: "A",
      color: "text",
      label: "Answer",
      labelY: 287.8,
      cx: 970,
      cy: 339.8,
      plinth: 40,
      glyph: { type: "step2", lower: [23, 14], upper: [17, 12] },
      name2: "Answer",
      sub2: "back to text",
      box2: box(772, 42),
      icon: "inbox",
    },
  ],
  paths2: {
    P_T: "M188,190 L272,190",
    T_M: "M440,190 L532,190",
    M_N: "M700,190 L772,190",
    N_A: "M856,162 L856,98",
  },
};

export default diagram;
