import { describe, expect, expectTypeOf, it } from "vitest";
import { navRoadmaps, searchEntries } from "@/content";
import type { Level } from "@/content/types";
import {
  navTopicIds,
  searchTopics,
  type NavRoadmap,
  type NavTopic,
} from "@/lib/search";

const entries = searchEntries();
const ids = (q: string) => searchTopics(entries, q).map((r) => r.id);

describe("search", () => {
  it("lists every topic for an empty query", () => {
    expect(ids("").sort()).toEqual(["agent-loop", "how-an-llm-answers", "rag"]);
  });

  it("finds topics by title, ignoring case", () => {
    expect(ids("AGENT")).toEqual(["agent-loop"]);
    expect(ids("rag")[0]).toBe("rag");
  });

  it("finds topics by block labels and summaries", () => {
    expect(ids("vector store")).toEqual(["rag"]);
    expect(ids("tokenizer")).toEqual(["how-an-llm-answers"]);
  });

  it("links straight to the step that matches", () => {
    const [hit] = searchTopics(entries, "temperature");
    expect(hit).toMatchObject({
      id: "how-an-llm-answers",
      step: 4,
      detail: "Step 4: Pick one token",
    });
  });

  it("needs every word to match", () => {
    expect(ids("tokenizer permission")).toEqual([]);
  });

  it("puts title matches first", () => {
    const results = searchTopics(entries, "model");
    expect(results.length).toBeGreaterThan(1);
    expect(results.every((r) => r.step === undefined)).toBe(true);
  });
});

describe("course menu data", () => {
  it("counts a topic in two roadmaps once", () => {
    const topic = (id: string): NavTopic => ({
      id,
      title: id,
      level: "basics",
    });
    const roadmaps: NavRoadmap[] = [
      { id: "one", title: "One", topics: [topic("rag"), topic("agent-loop")] },
      { id: "two", title: "Two", topics: [topic("rag"), topic("tools")] },
    ];
    expect(navTopicIds(roadmaps)).toEqual(["rag", "agent-loop", "tools"]);
  });

  it("types each topic's level as a content level", () => {
    expectTypeOf<NavTopic["level"]>().toEqualTypeOf<Level>();
    for (const topic of navRoadmaps().flatMap((r) => r.topics))
      expect(["basics", "intermediate", "advanced"]).toContain(topic.level);
  });
});
