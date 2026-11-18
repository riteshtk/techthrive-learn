// The screens the visual tests and the design comparison capture (PRD
// P19), with the design export's matching screenshot where there is one.

export type Screen = {
  name: string;
  path: string;
  /** design-v2/shots/<design>.png (dark) and <design>--light.png. */
  design?: string;
  /** The light shot's name, where the design's default is light. */
  designLight?: string;
};

export const SCREENS: Screen[] = [
  { name: "home", path: "./", design: "P-Home" },
  { name: "catalog", path: "topics/", design: "P-Catalog" },
  { name: "catalog-empty", path: "topics/?q=zzzz" },
  { name: "review", path: "review/", design: "M-Review" },
  { name: "agents-overview", path: "topics/ai-agents/", design: "Main" },
  {
    name: "agents-course",
    path: "topics/ai-agents/lessons/",
    design: "Curriculum",
  },
  {
    name: "agents-lesson",
    path: "topics/ai-agents/lessons/agent-anatomy/?step=6",
    design: "Lesson",
  },
  {
    name: "agents-checkpoint",
    path: "topics/ai-agents/lessons/agent-anatomy/checkpoint/",
    design: "Checkpoint",
  },
  {
    name: "agents-sources",
    path: "topics/ai-agents/sources/",
    design: "Sources",
  },
  { name: "agents-cost", path: "topics/ai-agents/cost/", design: "CostCalc" },
  {
    name: "agents-threats",
    path: "topics/ai-agents/threats/",
    design: "ThreatModel",
  },
  {
    name: "agents-governance",
    path: "topics/ai-agents/governance/",
    design: "Governance",
  },
  { name: "agents-lab", path: "topics/ai-agents/lab/", design: "DesignLab" },
  {
    name: "agents-sheets",
    path: "topics/ai-agents/sheets/",
    design: "Cheatsheets--dark",
    designLight: "Cheatsheets",
  },
  { name: "payments-overview", path: "topics/payments/", design: "PayTopic" },
  {
    name: "payments-lesson",
    path: "topics/payments/lessons/move-money-exactly-once/?step=3",
    design: "PayLesson",
  },
  { name: "foundations-overview", path: "topics/foundations/" },
  {
    name: "foundations-lesson",
    path: "topics/foundations/lessons/rag/?step=5",
  },
  { name: "not-found", path: "no/such/page/" },
];

/** A fixed moment, so dates, "Today" and greetings never move. */
export const CLOCK = new Date("2026-11-18T09:00:00+05:30");
