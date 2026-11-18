// The v2 content, checked once and shared by every page at build time.
// `npm run check:content` runs first in every build, so by the time a page
// asks for content it is valid; this throws only if that step was skipped.
import {
  checkpointFiles,
  diagramFiles,
  factFiles,
  lessonFiles,
  toolFiles,
  topicFiles,
} from "./.generated";
import { formatIssue } from "./schema";
import type {
  Checkpoint,
  Diagram,
  Fact,
  Lesson,
  Tool,
  ToolKind,
  Topic,
} from "./types";
import { validateContent, type Content } from "./validate";

let cached: Content | undefined;

function content(): Content {
  if (cached) return cached;
  // Re-check dates only matter to the content check, so any date works.
  const { issues, content } = validateContent(
    {
      topics: topicFiles,
      lessons: lessonFiles,
      checkpoints: checkpointFiles,
      diagrams: diagramFiles,
      facts: factFiles,
      tools: toolFiles,
    },
    "0000-01-01",
  );
  const errors = issues.filter((i) => i.level !== "warning");
  if (errors.length > 0)
    throw new Error(
      `Content is invalid; run npm run check:content.\n${errors.map(formatIssue).join("\n")}`,
    );
  cached = content;
  return content;
}

export function getTopics(): Topic[] {
  return content().topics;
}

export function getTopic(id: string): Topic | undefined {
  return getTopics().find((t) => t.id === id);
}

export function getLesson(
  topicId: string,
  lessonId: string,
): Lesson | undefined {
  return content().lessons.find(
    (l) => l.topic === topicId && l.id === lessonId,
  );
}

export function getLessons(topicId?: string): Lesson[] {
  const all = content().lessons;
  return topicId ? all.filter((l) => l.topic === topicId) : all;
}

export function getCheckpoint(
  topicId: string,
  lessonId: string,
): Checkpoint | undefined {
  return content().checkpoints.find(
    (c) => c.topic === topicId && c.lesson === lessonId,
  );
}

export function getDiagram(
  topicId: string,
  diagramId: string,
): Diagram | undefined {
  return content().diagrams.find(
    (d) => d.topic === topicId && d.id === diagramId,
  );
}

/** All of a topic's tool data. */
export function getTools(topicId: string): Tool[] {
  return content().tools.filter((t) => t.topic === topicId);
}

/** A topic's tool data, if it has that tool. */
export function getTool<K extends ToolKind>(
  topicId: string,
  kind: K,
): Extract<Tool, { kind: K }> | undefined {
  return content().tools.find(
    (t): t is Extract<Tool, { kind: K }> =>
      t.topic === topicId && t.kind === kind,
  );
}

export function getFacts(topicId?: string): Fact[] {
  const all = content().facts;
  return topicId ? all.filter((f) => f.topics.includes(topicId)) : all;
}

export function getFact(id: string): Fact | undefined {
  return content().facts.find((f) => f.id === id);
}

/** "About 2 hours": lesson minutes rounded to the nearest half hour
    (spec 03 §8.1); under 45 minutes it says the minutes. */
export function durationLabel(minutes: number): string {
  if (minutes < 45) return `about ${minutes} minutes`;
  const halves = Math.round(minutes / 30);
  const hours = Math.floor(halves / 2);
  const half = halves % 2 === 1 ? "½" : "";
  return `about ${hours}${half} hour${hours === 1 && !half ? "" : "s"}`;
}

/** The oldest read date among facts: the "Verified" chip's date. */
export function oldestReadOn(facts: readonly Fact[]): string | undefined {
  return facts.map((f) => f.readOn).sort()[0];
}
