export type Level = "basics" | "intermediate" | "advanced";

/** Small icons a diagram block can show; see player/icons.ts. */
export const NODE_ICONS = [
  "text",
  "question",
  "document",
  "split",
  "vector",
  "chip",
  "token",
  "database",
  "list",
  "check",
  "target",
  "shield",
  "tool",
] as const;
export type NodeIcon = (typeof NODE_ICONS)[number];

export type DiagramNode = {
  id: string;
  label: string;
  /** One sentence on what this part does, shown when the block is clicked. */
  note: string;
  /** Optional icon on the block; a plain dot when left out. */
  icon?: NodeIcon;
  /** Grid column, 0–3. */
  x: number;
  /** Grid row, 0–5. */
  y: number;
};

export type DiagramEdge = {
  id: string;
  from: string;
  to: string;
  /** Short pill on the line itself. */
  label?: string;
  /** What moves along this edge, shown on hover or focus. */
  flows?: string;
};

export type Step = {
  /** Short name for the step, used on the Next button and the timeline. */
  title: string;
  /** One sentence, at most 140 characters. */
  text: string;
  /** Node and edge ids lit up on this step. */
  highlight: string[];
};

export type Source = {
  title: string;
  url: string;
  /** ISO date (YYYY-MM-DD) the source was last checked. */
  read: string;
};

export type Topic = {
  id: string;
  title: string;
  level: Level;
  summary: string;
  /** Rough minutes to work through the topic, 1–60. */
  minutes: number;
  diagram: { nodes: DiagramNode[]; edges: DiagramEdge[] };
  steps: Step[];
  sources: Source[];
  video?: { youtubeId: string; title: string };
};

export type Roadmap = {
  id: string;
  title: string;
  goal: string;
  /** Topic ids, in learning order. */
  topics: string[];
};
