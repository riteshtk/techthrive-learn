export type Level = "basics" | "intermediate" | "advanced";

export type DiagramNode = {
  id: string;
  label: string;
  /** Grid column, 0–3. */
  x: number;
  /** Grid row, 0–5. */
  y: number;
};

export type DiagramEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
};

export type Step = {
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
