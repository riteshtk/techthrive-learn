import { describe, expect, it } from "vitest";
import { searchDocuments } from "@/content";
import {
  parseSearchIndex,
  resultHref,
  search,
  type SearchDoc,
} from "@/lib/search";

const docs: SearchDoc[] = [
  {
    kind: "fact",
    title: "Cache hits cost 10% of input",
    context: "Production AI agents",
    text: "Claude prices, read 17 Nov 2026",
    path: "/topics/agents/sources/",
  },
  {
    kind: "step",
    title: "Put the limits outside the prompt",
    context: "Anatomy of a production agent · step 6",
    text: "The policy engine decides what happens.",
    path: "/topics/agents/lessons/anatomy/",
    step: 6,
  },
  {
    kind: "lesson",
    title: "Anatomy of a production agent",
    context: "Production AI agents",
    text: "Nine components around one card-dispute agent, policy included.",
    path: "/topics/agents/lessons/anatomy/",
  },
  {
    kind: "topic",
    title: "Production AI agents",
    context: "Topic",
    text: "Identity, least privilege, evals, traces and cost.",
    path: "/topics/agents/",
  },
];

const titles = (q: string) => search(docs, q).map((r) => r.title);

describe("search", () => {
  it("needs every word, in any field and any case", () => {
    expect(titles("POLICY engine")).toEqual([
      "Put the limits outside the prompt",
    ]);
    expect(titles("policy nothing-like-this")).toEqual([]);
  });

  it("ranks title matches first, then topic, lesson, step, fact", () => {
    expect(titles("agent")).toEqual([
      "Production AI agents",
      "Anatomy of a production agent",
      "Put the limits outside the prompt",
      "Cache hits cost 10% of input",
    ]);
    expect(titles("policy")).toEqual([
      "Anatomy of a production agent",
      "Put the limits outside the prompt",
    ]);
  });

  it("finds facts", () => {
    expect(titles("cache hits")).toEqual(["Cache hits cost 10% of input"]);
  });

  it("lists topics for an empty query, and respects the limit", () => {
    expect(titles("  ")).toEqual(["Production AI agents"]);
    expect(search(docs, "a", 2)).toHaveLength(2);
  });

  it("links steps with ?step", () => {
    const [step] = search(docs, "limits outside");
    expect(step && resultHref(step)).toBe(
      "/topics/agents/lessons/anatomy/?step=6",
    );
    const [topic] = search(docs, "production ai agents");
    expect(topic && resultHref(topic)).toBe("/topics/agents/");
  });
});

describe("parseSearchIndex", () => {
  it("keeps valid documents and drops the rest", () => {
    expect(parseSearchIndex(docs)).toEqual(docs);
    expect(
      parseSearchIndex([
        ...docs,
        { kind: "x" },
        null,
        3,
        { ...docs[0], step: 1.5 },
      ]),
    ).toEqual(docs);
    expect(parseSearchIndex({ not: "an array" })).toEqual([]);
  });
});

describe("the built index", () => {
  const built = searchDocuments();

  it("covers every kind the content has, with app paths", () => {
    expect(new Set(built.map((d) => d.kind))).toEqual(
      new Set(["topic", "lesson", "step", "fact"]),
    );
    for (const d of built) expect(d.path).toMatch(/^\/.*\/$/);
  });

  it("finds a lesson step, a tool and a fact", () => {
    const hit = (q: string) => search(built, q, 20).map((r) => r.path);
    expect(hit("idempotency key")).toContain(
      "/topics/payments/lessons/move-money-exactly-once/",
    );
    expect(hit("threat model")).toContain("/topics/ai-agents/threats/");
    expect(hit("NPCI")).toContain("/topics/payments/sources/");
  });

  it("is valid as served", () => {
    expect(parseSearchIndex(JSON.parse(JSON.stringify(built)))).toEqual(built);
  });
});
