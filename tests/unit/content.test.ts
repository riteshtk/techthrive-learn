import { describe, expect, it } from "vitest";
import {
  getRoadmap,
  getTopics,
  homeRoadmapOf,
  roadmapTopics,
} from "@/content/v1";

describe("content index", () => {
  it("loads every topic file", () => {
    expect(getTopics().map((t) => t.id)).toEqual([
      "agent-loop",
      "how-an-llm-answers",
      "rag",
    ]);
  });

  it("returns a roadmap's topics in its own order", () => {
    const roadmap = getRoadmap("ai-system-design");
    expect(roadmap).toBeDefined();
    expect(roadmapTopics(roadmap!).map((t) => t.id)).toEqual([
      "how-an-llm-answers",
      "rag",
      "agent-loop",
    ]);
  });

  it("finds the roadmap a topic belongs to", () => {
    expect(homeRoadmapOf("rag")?.id).toBe("ai-system-design");
    expect(homeRoadmapOf("nope")).toBeUndefined();
  });
});
