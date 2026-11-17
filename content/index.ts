import { roadmapFiles, topicFiles } from "./.generated";
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
