import { describe, expect, it } from "vitest";
import { formatIssue } from "@/content/schema";
import type { Checkpoint, Diagram, Fact, Lesson, Topic } from "@/content/types";
import { validateContent, type ContentInput } from "@/content/validate";

const TOPIC_FILE = "content/topics/payments/topic.ts";
const LESSON_FILE = "content/topics/payments/lessons/exactly-once.ts";
const CHECKPOINT_FILE = "content/topics/payments/checkpoints/exactly-once.ts";
const FACT_FILE = "content/facts/payments.ts";
const DIAGRAM_FILE = "content/topics/payments/diagrams/checkout.ts";
const TODAY = "2026-11-18";

function topic(): Topic {
  return {
    id: "payments",
    title: "Payments platform",
    switcherLabel: "Payments platform",
    level: "advanced",
    status: "live",
    summary: "Move money exactly once.",
    domain: "Payments",
    system: "Checkout payments",
    tags: ["Idempotency"],
    tabs: ["overview", "lessons"],
    lessons: [
      {
        id: "exactly-once",
        title: "Move money exactly once",
        summary: "Retries without double charges.",
        minutes: 18,
      },
      {
        id: "ledger",
        title: "Designing the ledger",
        summary: "Double entry.",
        minutes: 16,
      },
    ],
  };
}

function fact(over: Partial<Fact> = {}): Fact {
  return {
    id: "daily-payments",
    value: "3,000,000 payments a day",
    claim: "The checkout this lesson designs for takes 3 million a day.",
    kind: "assumption",
    source: "Teaching assumption",
    readOn: "2026-11-18",
    recheckBy: "2027-05-18",
    owner: "Tech & Thrive",
    group: "Scenario",
    topics: ["payments"],
    ...over,
  };
}

function lesson(): Lesson {
  const step = (n: number) => ({
    short: `S${n}`,
    type: "BUILD" as const,
    adds: "A part",
    addsColor: "cyan" as const,
    newNodes: [],
    title: `Step ${n}`,
    body: ["Text."],
    callout: { kind: "key" as const, text: "An idea." },
    metrics: ["—", "—", "—", "—"] as [string, string, string, string],
    facts: [],
    caption: "A line.",
    trace: [] as Lesson["steps"][number]["trace"],
  });
  return {
    id: "exactly-once",
    topic: "payments",
    diagram: "checkout",
    metricLabels: ["A", "B", "C", "D"],
    legend: [["cyan", "request"]],
    emptyTraceText: "No request moves in this step.",
    nodes: [
      {
        id: "C",
        name: "Checkout",
        short: "Checkout",
        addedAt: 1,
        what: "Customers paying.",
        points: [],
      },
      {
        id: "G",
        name: "API gateway",
        short: "Gateway",
        addedAt: 2,
        what: "The front door.",
        points: [],
      },
      {
        id: "S",
        name: "Payment service",
        short: "Payments",
        addedAt: 1,
        what: "Moves money.",
        points: [],
      },
    ],
    edges: ["C_G", "G_S", "C_S"],
    bypass: { node: "G", edge: "C_S" },
    steps: [step(1), step(2), step(3)],
  };
}

function checkpoint(): Checkpoint {
  const question = (id: string) => ({
    id,
    prompt: "Which one?",
    tags: [],
    options: (["A", "B", "C", "D"] as const).map((o) => ({
      id: o,
      text: `Option ${o}`,
      verdict: o === "B" ? ("right" as const) : ("wrong" as const),
      why: "Because.",
    })),
    resultHeading: { right: "Right.", other: "Not quite." },
    explanation: ["Why."],
    replayStep: 2,
    facts: [],
  });
  return {
    lesson: "exactly-once",
    topic: "payments",
    questions: [question("q1"), question("q2"), question("q3")],
    approved: true,
  };
}

function diagram(): Diagram {
  const node = (id: string, cx: number) => ({
    id,
    color: "violet" as const,
    label: id,
    labelY: 10,
    cx,
    cy: 100,
    plinth: 40,
    glyph: { type: "cube" as const, half: 20, h: 20 },
    name2: id,
    sub2: "part",
    box2: [cx, 40, 168, 56] as [number, number, number, number],
    icon: "chip" as const,
  });
  return {
    id: "checkout",
    topic: "payments",
    caption: "Checkout",
    nodes: [node("C", 100), node("G", 300), node("S", 500)],
    paths2: { C_G: "M1,1 L2,2", G_S: "M1,1 L2,2", C_S: "M1,1 L2,2" },
  };
}

type Parts = {
  diagram?: unknown;
  topic?: unknown;
  lesson?: unknown;
  checkpoint?: unknown;
  facts?: unknown;
};

function run(parts: Parts = {}) {
  const input: ContentInput = {
    topics: [{ file: TOPIC_FILE, data: parts.topic ?? topic() }],
    lessons: [{ file: LESSON_FILE, data: parts.lesson ?? lesson() }],
    checkpoints: [
      { file: CHECKPOINT_FILE, data: parts.checkpoint ?? checkpoint() },
    ],
    diagrams: [{ file: DIAGRAM_FILE, data: parts.diagram ?? diagram() }],
    facts: [{ file: FACT_FILE, data: parts.facts ?? [fact()] }],
  };
  const { issues } = validateContent(input, TODAY);
  return {
    errors: issues.filter((i) => i.level !== "warning").map(formatIssue),
    warnings: issues.filter((i) => i.level === "warning").map(formatIssue),
  };
}

describe("the v2 content model", () => {
  it("accepts valid content", () => {
    expect(run()).toEqual({ errors: [], warnings: [] });
  });

  describe("schema", () => {
    it("names the file and the field path", () => {
      const l = lesson() as unknown as { steps: { trace: unknown[] }[] };
      l.steps[1]!.trace = [{ from: "C", to: "s", color: "cyan", text: "Go" }];
      expect(run({ lesson: l }).errors).toContain(
        `${LESSON_FILE} › steps[1].trace[0].to: "s" is not one capital letter`,
      );
    });

    it("reports a hole in a list (a stray comma)", () => {
      const facts = [fact(), , fact({ id: "other" })];
      expect(run({ facts }).errors).toContain(
        `${FACT_FILE} › [1]: must be an object, not undefined`,
      );
    });

    it("reports missing and unknown fields", () => {
      const t = { ...topic(), tabz: [] } as Record<string, unknown>;
      delete t.summary;
      expect(run({ topic: t }).errors).toEqual(
        expect.arrayContaining([
          `${TOPIC_FILE} › summary: is missing`,
          `${TOPIC_FILE} › tabz: is not a known field`,
        ]),
      );
    });

    it("checks list lengths and allowed values", () => {
      const c = checkpoint();
      c.questions.pop();
      expect(run({ checkpoint: c }).errors).toContain(
        `${CHECKPOINT_FILE} › questions: must have exactly 3 items, not 2`,
      );
      const t = { ...topic(), tabs: ["overview", "interview"] };
      expect(run({ topic: t }).errors).toContain(
        `${TOPIC_FILE} › tabs[1]: "interview" must be one of: "overview", "lessons", "cost", "threats", "governance", "lab", "sheets"`,
      );
    });
  });

  describe("topics", () => {
    it("must match their folder and not take a v1 id", () => {
      const t = { ...topic(), id: "rag" };
      expect(run({ topic: t }).errors).toEqual(
        expect.arrayContaining([
          `${TOPIC_FILE} › id: "rag" must match its folder, content/topics/rag/`,
          `${TOPIC_FILE} › id: "rag" is a v1 address that redirects; choose another id`,
        ]),
      );
    });

    it("list each lesson once", () => {
      const t = topic();
      t.lessons.push({ ...t.lessons[0]! });
      expect(run({ topic: t }).errors).toContain(
        `${TOPIC_FILE} › lessons[2].id: "exactly-once" is listed twice`,
      );
    });
  });

  describe("lessons", () => {
    it("must be in their topic's outline", () => {
      const t = topic();
      t.lessons.shift();
      expect(run({ topic: t }).errors).toContain(
        `${LESSON_FILE} › id: "exactly-once" is not in the lessons of content/topics/payments/topic.ts`,
      );
    });

    it("draw edges between nodes that exist", () => {
      const l = lesson();
      l.edges.push("S_X");
      expect(run({ lesson: l }).errors).toContain(
        `${LESSON_FILE} › edges[3]: "X" is not a node`,
      );
    });

    it("play hops only along edges, between parts already built", () => {
      const l = lesson();
      l.steps[0]!.trace = [
        { from: "C", to: "G", color: "cyan", text: "In" },
        { from: "G", to: "S", color: "cyan", text: "On" },
      ];
      // At step 1 the gateway isn't built: the bypass collapses C→G→S.
      expect(run({ lesson: l }).errors).toEqual([]);

      l.steps[0]!.trace = [{ from: "C", to: "G", color: "cyan", text: "In" }];
      expect(run({ lesson: l }).errors).toContain(
        `${LESSON_FILE} › steps[0].trace: C→G: "G" isn't built by step 1`,
      );

      l.steps[1]!.trace = [{ from: "S", to: "C", color: "cyan", text: "?" }];
      l.edges = ["C_G", "G_S"];
      l.bypass = undefined;
      expect(run({ lesson: l }).errors).toContain(
        `${LESSON_FILE} › steps[1].trace: no edge joins S and C`,
      );
    });

    it("only pulse parts that exist, and cite facts of their topic", () => {
      const l = lesson();
      l.steps[0]!.newNodes = ["G"];
      l.steps[2]!.facts = ["nope", "other-topic"];
      const otherFact = fact({ id: "other-topic", topics: ["payments"] });
      const r = run({ lesson: l, facts: [fact(), otherFact] });
      expect(r.errors).toEqual(
        expect.arrayContaining([
          `${LESSON_FILE} › steps[0].newNodes[0]: "G" isn't built by step 1`,
          `${LESSON_FILE} › steps[2].facts[0]: "nope" is not in the facts register`,
        ]),
      );
    });
  });

  describe("diagrams", () => {
    it("must hold every lesson node and edge", () => {
      const d = diagram();
      d.nodes.pop();
      delete (d.paths2 as Record<string, string>).C_S;
      const errors = run({ diagram: d }).errors;
      expect(errors).toEqual(
        expect.arrayContaining([
          `${LESSON_FILE} › nodes[2].id: "S" is not in the diagram`,
          `${LESSON_FILE} › edges[2]: "C_S" has no 2D path in the diagram`,
          `${DIAGRAM_FILE} › paths2.G_S: "S" is not a node`,
        ]),
      );
    });

    it("check glyph shapes by their type", () => {
      const d = diagram() as unknown as { nodes: { glyph: unknown }[] };
      d.nodes[0]!.glyph = { type: "pyramid" };
      d.nodes[1]!.glyph = { type: "cylinder", rx: 30, h: 40 };
      expect(run({ diagram: d }).errors).toEqual(
        expect.arrayContaining([
          `${DIAGRAM_FILE} › nodes[0].glyph.type: "pyramid" must be one of: "cube", "twin", "stack3", "step2", "cylinder", "crowd", "person"`,
          `${DIAGRAM_FILE} › nodes[1].glyph.bands: is missing`,
        ]),
      );
    });

    it("keep their labels' figures in the register", () => {
      const d = diagram();
      d.nodes[0]!.sub2 = "20k chats a day";
      expect(run({ diagram: d }).errors).toEqual([
        `${DIAGRAM_FILE} › nodes[0].sub2: the figure "20k" is not in the facts register for "payments"; add a fact whose value shows it (content/facts/)`,
      ]);
    });
  });

  describe("checkpoints", () => {
    it("need one right option, and a lesson", () => {
      const c = checkpoint();
      c.questions[0]!.options[0]!.verdict = "right";
      c.lesson = "ledger";
      const errors = run({ checkpoint: c }).errors;
      expect(errors).toEqual(
        expect.arrayContaining([
          `${CHECKPOINT_FILE} › questions[0].options: needs exactly one right option, not 2`,
          `${CHECKPOINT_FILE} › lesson: "ledger" has no lesson file in content/topics/payments/lessons/`,
          `${CHECKPOINT_FILE} › lesson: must be "exactly-once", the file name`,
        ]),
      );
    });

    it("warn until approved", () => {
      const c = { ...checkpoint(), approved: false };
      expect(run({ checkpoint: c }).warnings).toEqual([
        `${CHECKPOINT_FILE} › approved: not yet checked against the sources and approved`,
      ]);
    });
  });

  describe("facts register", () => {
    it("needs a link for real facts and real dates in order", () => {
      const f = fact({
        kind: "real",
        readOn: "2026-02-31",
        recheckBy: "2026-01-01",
      });
      expect(run({ facts: [f] }).errors).toEqual(
        expect.arrayContaining([
          `${FACT_FILE} › [0].url: a real fact needs its primary source's link`,
          `${FACT_FILE} › [0].readOn: 2026-02-31 is not a real date`,
          `${FACT_FILE} › [0].recheckBy: must come after readOn`,
        ]),
      );
    });

    it("keeps ids unique and topics real", () => {
      const r = run({
        facts: [fact(), fact({ topics: ["payments", "nowhere"] })],
      });
      expect(r.errors).toEqual(
        expect.arrayContaining([
          `${FACT_FILE} › [1].id: "daily-payments" is used by another fact`,
          `${FACT_FILE} › [1].topics[1]: "nowhere" is not a topic`,
        ]),
      );
    });

    it("warns when a fact is past its re-check date", () => {
      const f = fact({ readOn: "2026-01-01", recheckBy: "2026-06-01" });
      expect(run({ facts: [f] }).warnings).toEqual([
        `${FACT_FILE} › [0].recheckBy: "daily-payments" was due for a re-check on 2026-06-01`,
      ]);
    });

    it("needs the old value of a changed fact", () => {
      const f = fact({ changedOn: "2026-11-01" });
      expect(run({ facts: [f] }).errors).toContain(
        `${FACT_FILE} › [0].previousValue: a changed fact needs its old value`,
      );
    });
  });

  describe("figures", () => {
    it("fails on a figure on screen with no register entry", () => {
      const l = lesson();
      l.steps[1]!.body = ["About 15,000 requests time out every day."];
      expect(run({ lesson: l }).errors).toEqual([
        `${LESSON_FILE} › steps[1].body[0]: the figure "15,000" is not in the facts register for "payments"; add a fact whose value shows it (content/facts/)`,
      ]);
    });

    it("accepts a figure the topic's facts show, however it is written", () => {
      const l = lesson();
      l.steps[1]!.body = ["A checkout taking 3,000,000 payments a day."];
      expect(run({ lesson: l }).errors).toEqual([]);
      l.steps[1]!.body = ["A checkout taking 3m payments a day."];
      expect(run({ lesson: l }).errors).toEqual([]);
    });

    it("checks topics and checkpoints too, but never code or ids", () => {
      const t = topic();
      t.summary = "Move 99% of money exactly once.";
      const l = lesson();
      l.steps[0]!.code = "retries = 500";
      const c = checkpoint();
      c.questions[2]!.prompt = "What happens at 750ms?";
      expect(run({ topic: t, lesson: l, checkpoint: c }).errors).toEqual([
        `${TOPIC_FILE} › summary: the figure "99%" is not in the facts register for "payments"; add a fact whose value shows it (content/facts/)`,
        `${CHECKPOINT_FILE} › questions[2].prompt: the figure "750ms" is not in the facts register for "payments"; add a fact whose value shows it (content/facts/)`,
      ]);
    });

    it("only counts facts registered for the same topic", () => {
      const l = lesson();
      l.steps[1]!.body = ["A checkout taking 3,000,000 payments a day."];
      const t2: Topic = {
        ...topic(),
        id: "agents",
        lessons: [],
        status: "planned",
      };
      const r = validateContent(
        {
          topics: [
            { file: TOPIC_FILE, data: topic() },
            { file: "content/topics/agents/topic.ts", data: t2 },
          ],
          lessons: [{ file: LESSON_FILE, data: l }],
          checkpoints: [],
          diagrams: [{ file: DIAGRAM_FILE, data: diagram() }],
          facts: [{ file: FACT_FILE, data: [fact({ topics: ["agents"] })] }],
        },
        TODAY,
      );
      expect(r.issues.map(formatIssue)).toContain(
        `${LESSON_FILE} › steps[1].body[0]: the figure "3,000,000" is not in the facts register for "payments"; add a fact whose value shows it (content/facts/)`,
      );
    });
  });
});
