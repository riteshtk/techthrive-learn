import { describe, expect, it } from "vitest";
import { activeTopicTab, type TopicTab } from "@/components/shell/TopicBar";

const ALL: TopicTab[] = [
  "overview",
  "lessons",
  "cost",
  "threats",
  "governance",
  "lab",
  "sheets",
];

describe("activeTopicTab", () => {
  it("picks the section a path is in", () => {
    expect(activeTopicTab("agents", ALL, "/topics/agents/")).toBe("overview");
    expect(activeTopicTab("agents", ALL, "/topics/agents/cost/")).toBe("cost");
    expect(activeTopicTab("agents", ALL, "/topics/agents/lab/")).toBe("lab");
  });

  it("counts a lesson and its checkpoint as Lessons", () => {
    expect(
      activeTopicTab("agents", ALL, "/topics/agents/lessons/anatomy/"),
    ).toBe("lessons");
    expect(
      activeTopicTab(
        "agents",
        ALL,
        "/topics/agents/lessons/anatomy/checkpoint/",
      ),
    ).toBe("lessons");
  });

  it("has no tab for sources, other topics or tabs a topic lacks", () => {
    expect(activeTopicTab("agents", ALL, "/topics/agents/sources/")).toBeNull();
    expect(activeTopicTab("agents", ALL, "/topics/payments/")).toBeNull();
    expect(
      activeTopicTab(
        "payments",
        ["overview", "lessons"],
        "/topics/payments/cost/",
      ),
    ).toBeNull();
  });
});
