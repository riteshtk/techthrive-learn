import { roadmapFiles, topicFiles } from "./.generated";
import type { SearchDoc } from "@/lib/search";
import type { Roadmap, Topic } from "./types";

export function getRoadmaps(): Roadmap[] {
  return roadmapFiles.map((f) => f.roadmap);
}

export function getRoadmap(id: string): Roadmap | undefined {
  return getRoadmaps().find((r) => r.id === id);
}

export function getTopics(): Topic[] {
  return topicFiles.map((f) => f.topic);
}

export function getTopic(id: string): Topic | undefined {
  return getTopics().find((t) => t.id === id);
}

/** A roadmap's topics, in its order, skipping ids that don't exist. */
export function roadmapTopics(roadmap: Roadmap): Topic[] {
  return roadmap.topics.flatMap((id) => getTopic(id) ?? []);
}

/** The first roadmap that lists this topic; "Back to roadmap" goes here. */
export function homeRoadmapOf(topicId: string): Roadmap | undefined {
  return getRoadmaps().find((r) => r.topics.includes(topicId));
}

/** Everything search looks through (lib/search.ts). Until the v2 content
    model lands, a v1 roadmap stands in for a topic and its topics for
    lessons. */
export function searchDocuments(): SearchDoc[] {
  const docs: SearchDoc[] = getRoadmaps().map((r) => ({
    kind: "topic",
    title: r.title,
    context: "Topic",
    text: r.goal,
    path: `/roadmaps/${r.id}/`,
  }));
  for (const t of getTopics()) {
    const context = homeRoadmapOf(t.id)?.title ?? "";
    const path = `/topics/${t.id}/`;
    docs.push({
      kind: "lesson",
      title: t.title,
      context,
      text: `${t.summary} ${t.diagram.nodes.map((n) => n.label).join(" ")}`,
      path,
    });
    t.steps.forEach((step, i) =>
      docs.push({
        kind: "step",
        title: step.title,
        context: `${t.title} · step ${i + 1}`,
        text: step.text,
        path,
        step: i + 1,
      }),
    );
  }
  return docs;
}
