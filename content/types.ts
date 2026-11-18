// The v2 content model (PRD P3; spec 03 §8.1, spec 04 §9, §11.4). Each
// type is a schema; its TypeScript type is inferred from it, and
// content/validate.ts checks every file against it at build time.
//
// - content/topics/<id>/topic.ts: a topic and its course outline
// - content/topics/<id>/lessons/<lesson>.ts: a built lesson
// - content/topics/<id>/checkpoints/<lesson>.ts: a lesson's checkpoint
// - content/topics/<id>/diagrams/<diagram>.ts: a system's geometry, shared
//   by the topic overview and the lessons that draw it
// - content/facts/<name>.ts: facts register records
//
// Titles, minutes and positions of a lesson live in its topic's outline
// only; counts, durations and "verified" dates are computed, never typed.

import {
  array,
  boolean,
  number,
  object,
  oneOf,
  optional,
  record,
  string,
  tagged,
  tuple,
  type Infer,
} from "./schema";

export const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const id = () => string({ pattern: KEBAB, patternHint: "a kebab-case id" });
const date = () =>
  string({ pattern: ISO_DATE, patternHint: "a date written YYYY-MM-DD" });
const https = () =>
  string({ pattern: /^https:\/\/\S+$/, patternHint: "an https:// link" });
const text = (max?: number) => string({ max });

export const LEVELS = ["foundation", "intermediate", "advanced"] as const;
export const COLORS = [
  "text",
  "cyan",
  "violet",
  "amber",
  "green",
  "blue",
] as const;
export type ColorKey = (typeof COLORS)[number];

/** A topic's sections, in the design's order (Interview is phase 2). */
export const TOPIC_TABS = [
  "overview",
  "lessons",
  "cost",
  "threats",
  "governance",
  "lab",
  "sheets",
] as const;
export type TopicTabId = (typeof TOPIC_TABS)[number];

/** v1 ids. Their old URLs (/topics/<id>/, /roadmaps/<id>/) redirect to the
    new pages, so no v2 topic may take them. */
export const RESERVED_TOPIC_IDS = [
  "how-an-llm-answers",
  "rag",
  "agent-loop",
  "ai-system-design",
] as const;

// Facts register ----------------------------------------------------------

export const FactSchema = object({
  id: id(),
  /** The figure or statement exactly as pages show it. */
  value: text(200),
  /** What the figure says, in a sentence. */
  claim: text(400),
  /** real: read from a primary source; assumption: a labelled teaching
      figure; derived: computed from other facts. */
  kind: oneOf(["real", "assumption", "derived"] as const),
  /** The primary source's name, or how an assumption or derivation is
      made. */
  source: text(200),
  /** Required for real facts. */
  url: optional(https()),
  readOn: date(),
  recheckBy: date(),
  owner: text(80),
  /** The Sources page groups facts by this. */
  group: text(60),
  /** Topic ids whose pages show this fact. */
  topics: array(id(), { min: 1 }),
  /** When a re-read changed the value: Home's "What changed". */
  previousValue: optional(text(200)),
  changedOn: optional(date()),
  changeNote: optional(text(300)),
});
export type Fact = Infer<typeof FactSchema>;

export const FactFileSchema = array(FactSchema, { min: 1 });

// Topics -------------------------------------------------------------------

export const LessonOutlineSchema = object({
  id: id(),
  title: text(90),
  summary: text(240),
  minutes: number({ int: true, min: 1, max: 90 }),
  /** Curriculum chips. */
  tags: optional(array(text(40), { max: 4 })),
  /** "Then: …" on the course page. */
  then: optional(text(80)),
  /** The mono line on the overview card. */
  cardRef: optional(text(60)),
});
export type LessonOutline = Infer<typeof LessonOutlineSchema>;

export const TopicSchema = object({
  id: id(),
  title: text(60),
  /** The topic switcher's text. */
  switcherLabel: text(40),
  level: oneOf(LEVELS),
  /** Live topics have pages; planned ones show in the catalog only. */
  status: oneOf(["live", "planned"] as const),
  /** One sentence for the catalog and search. */
  summary: text(240),
  /** Catalog filter. */
  domain: text(40),
  /** The catalog card's system line, e.g. "Card-dispute agent". */
  system: text(60),
  tags: array(text(30), { max: 6 }),
  tabs: array(oneOf(TOPIC_TABS), { min: 1 }),
  lessons: array(LessonOutlineSchema),
});
export type Topic = Infer<typeof TopicSchema>;

// Diagrams -----------------------------------------------------------------

const nodeId = () =>
  string({ pattern: /^[A-Z]$/, patternHint: "one capital letter" });
const color = () => oneOf(COLORS);
const px = () => number({ min: -2000, max: 2000 });
const size = () => number({ min: 0, max: 400 });

/** Icons a 2D diagram node can show (spec 03 §7.10). */
export const DIAGRAM_ICONS = [
  "trend-up",
  "bolt",
  "shield",
  "user",
  "flask",
  "chip",
  "server",
  "lock",
  "database",
  "users",
  "search",
  "inbox",
  "alert",
  "globe",
  "check",
  "layers",
  "send",
] as const;

/** The seven shapes a 3D node's glyph can take (spec 03 §7.3). Block
    sizes are world units (× 0.9 to draw); a cylinder is baked in px. */
export const GlyphSchema = tagged("type", {
  cube: object({ half: size(), h: size() }),
  twin: object({ half: size(), h: size(), dy: size() }),
  stack3: object({ half: size(), layer: size(), pitch: size() }),
  step2: object({
    lower: tuple(size(), size()),
    upper: tuple(size(), size()),
  }),
  cylinder: object({
    rx: size(),
    h: size(),
    bands: number({ int: true, min: 0, max: 4 }),
  }),
  crowd: object({}),
  person: object({}),
});

export const DiagramNodeSchema = object({
  id: nodeId(),
  color: color(),
  /** 3D: the label pill's text and top edge (its x and width are
      computed). */
  label: text(40),
  labelY: px(),
  /** 3D: plinth-top centre in the viewBox, and plinth half-side (world
      units). */
  cx: px(),
  cy: px(),
  plinth: size(),
  glyph: GlyphSchema,
  /** 2D: name, mono sub-label, box [x, y, width, height] and icon. */
  name2: text(40),
  sub2: text(40),
  box2: tuple(px(), px(), size(), size()),
  icon: oneOf(DIAGRAM_ICONS),
});
export type DiagramNode = Infer<typeof DiagramNodeSchema>;

export const DiagramSchema = object({
  id: id(),
  topic: id(),
  /** "Card-dispute agent": the hero's title card adds "· n components". */
  caption: text(60),
  nodes: array(DiagramNodeSchema, { min: 2 }),
  /** 2D edge paths by edge id ("A_B"), drawn from A to B. */
  paths2: record(
    string({ pattern: /^[A-Z]_[A-Z]$/, patternHint: 'an edge id like "A_B"' }),
    string({
      pattern: /^M[\d.,\sL]+$/,
      patternHint: "an SVG path of straight segments (M…L…)",
    }),
  ),
});
export type Diagram = Infer<typeof DiagramSchema>;

// Lessons ------------------------------------------------------------------

export const STEP_TYPES = [
  "BRIEF",
  "DECISION",
  "BUILD",
  "MEASURE",
  "COST",
] as const;

export const HopSchema = object({
  from: nodeId(),
  to: nodeId(),
  color: color(),
  /** The hop well's text while this hop plays. */
  text: text(160),
});
export type Hop = Infer<typeof HopSchema>;

/** A diagram node's part in the lesson; its colour and geometry come from
    the diagram. */
export const LessonNodeSchema = object({
  id: nodeId(),
  /** Popover title, e.g. "Policy · Cedar". */
  name: text(40),
  /** Hop chips and tags, e.g. "Policy". */
  short: text(24),
  /** The step that adds it; 1 means it is there from the start. */
  addedAt: number({ int: true, min: 1, max: 12 }),
  what: text(300),
  points: array(text(200), { max: 4 }),
  /** Standards ids (keys of the lesson's standards). */
  standards: optional(array(text(20))),
});
export type LessonNode = Infer<typeof LessonNodeSchema>;

export const StepSchema = object({
  /** Step rail and "Next · {short}". */
  short: text(14),
  type: oneOf(STEP_TYPES),
  /** "ADDED IN THIS STEP". */
  adds: text(60),
  addsColor: color(),
  /** Nodes that pulse at this step. */
  newNodes: array(nodeId()),
  title: text(80),
  body: array(text(600), { min: 1, max: 4 }),
  code: optional(text(800)),
  callout: object({
    kind: oneOf(["key", "watch", "interview"] as const),
    text: text(300),
  }),
  /** The four metric tiles' values at this step. */
  metrics: tuple(text(30), text(30), text(30), text(30)),
  /** Register ids the Sources tab lists for this step. */
  facts: array(id()),
  /** The narration line, recorded in the creator's voice. */
  caption: text(200),
  trace: array(HopSchema, { max: 8 }),
});
export type Step = Infer<typeof StepSchema>;

export const LessonSchema = object({
  id: id(),
  topic: id(),
  /** The diagram file it draws, in content/topics/<topic>/diagrams/. */
  diagram: id(),
  metricLabels: tuple(text(24), text(24), text(24), text(24)),
  legend: array(tuple(color(), text(30)), { min: 1, max: 6 }),
  /** The hop well's text when a step has no hops. */
  emptyTraceText: text(120),
  standards: optional(record(text(20), text(80))),
  nodes: array(LessonNodeSchema, { min: 2 }),
  /** "A_B": drawn from A to B. */
  edges: array(
    string({
      pattern: /^[A-Z]_[A-Z]$/,
      patternHint: 'an edge id like "A_B"',
    }),
  ),
  bypass: optional(object({ node: nodeId(), edge: text(3) })),
  sandbox: optional(oneOf(["agent-cost", "payments"] as const)),
  steps: array(StepSchema, { min: 3, max: 12 }),
});
export type Lesson = Infer<typeof LessonSchema>;

// Checkpoints --------------------------------------------------------------

export const OptionSchema = object({
  id: oneOf(["A", "B", "C", "D"] as const),
  text: text(240),
  verdict: oneOf(["right", "partial", "wrong"] as const),
  /** Why this option is right, partly right or wrong. */
  why: text(300),
});

export const QuestionSchema = object({
  id: id(),
  prompt: text(300),
  subline: optional(text(200)),
  tags: array(text(30), { max: 4 }),
  evidence: optional(
    object({
      caption: text(80),
      lines: array(text(200), { min: 1, max: 8 }),
      /** A line drawn as the hidden instruction, 0-based. */
      highlight: optional(number({ int: true, min: 0, max: 7 })),
    }),
  ),
  options: array(OptionSchema, { length: 4 }),
  resultHeading: object({ right: text(60), other: text(60) }),
  explanation: array(text(600), { min: 1, max: 3 }),
  /** The lesson step "Replay step n" opens. */
  replayStep: number({ int: true, min: 1, max: 12 }),
  /** Register ids the explanation relies on. */
  facts: array(id()),
  /** Also shown in the explanation panel. */
  reviewCard: optional(text(200)),
  /** Where to see this in more depth, e.g. the topic's threat model. */
  see: optional(
    object({
      label: text(40),
      path: string({
        pattern: /^\/topics\/[a-z0-9-]+\/[a-z0-9/-]*$/,
        patternHint: "an app path like /topics/<topic>/<section>/",
      }),
    }),
  ),
});
export type Question = Infer<typeof QuestionSchema>;

export const CheckpointSchema = object({
  lesson: id(),
  topic: id(),
  questions: array(QuestionSchema, { length: 3 }),
  /** Set when the questions were checked against the sources and approved
      (PRD: "checked by a fresh reviewer and approved with the lesson"). */
  approved: boolean(),
});
export type Checkpoint = Infer<typeof CheckpointSchema>;
