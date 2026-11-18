// Fails the build and `npm test` with a clear message, naming the file and
// field, when a content file breaks a rule (PRD P3). Warnings, such as a
// fact past its re-check date, are printed but don't fail.
import {
  checkpointFiles,
  diagramFiles,
  factFiles,
  lessonFiles,
  toolFiles,
  topicFiles,
} from "../content/.generated/index";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { formatIssue } from "../content/schema";
import { validateContent } from "../content/validate";
import {
  roadmapFiles,
  topicFiles as v1TopicFiles,
} from "../content/v1/.generated/index";
import { validateContent as validateV1 } from "../content/v1/validate";

const today = new Date().toISOString().slice(0, 10);
const { issues, content } = validateContent(
  {
    topics: topicFiles,
    lessons: lessonFiles,
    checkpoints: checkpointFiles,
    diagrams: diagramFiles,
    facts: factFiles,
    tools: toolFiles,
  },
  today,
);
const v1Issues = validateV1({ topics: v1TopicFiles, roadmaps: roadmapFiles });

// Narration: one recording per lesson step, at
// public/audio/<topic>/<lesson>/<NN>.mp3 (PRD P5). Missing audio is a
// warning while lessons are being recorded; REQUIRE_NARRATION=1 (Gate 1)
// makes it an error.
const requireNarration = process.env.REQUIRE_NARRATION === "1";
for (const lesson of content.lessons) {
  const missing = lesson.steps
    .map((_, i) => String(i + 1).padStart(2, "0"))
    .filter(
      (nn) =>
        !existsSync(
          join("public", "audio", lesson.topic, lesson.id, `${nn}.mp3`),
        ),
    );
  if (missing.length > 0)
    issues.push({
      file: `content/topics/${lesson.topic}/lessons/${lesson.id}.ts`,
      field: "steps",
      message: `narration audio missing for step ${missing.map(Number).join(", ")} (public/audio/${lesson.topic}/${lesson.id}/NN.mp3)`,
      level: requireNarration ? "error" : "warning",
    });
}

const errors = [...issues.filter((i) => i.level !== "warning"), ...v1Issues];
const warnings = issues.filter((i) => i.level === "warning");

for (const w of warnings) console.warn(`  ! ${formatIssue(w)}`);
if (errors.length > 0) {
  console.error(`\nContent check failed with ${errors.length} problem(s):\n`);
  for (const issue of errors) console.error(`  ✗ ${formatIssue(issue)}`);
  console.error("\nSee CONTRIBUTING.md for the content rules.\n");
  process.exit(1);
}
console.log(
  `Content check passed: ${content.topics.length} topics, ` +
    `${content.lessons.length} lessons, ${content.checkpoints.length} checkpoints, ` +
    `${content.facts.length} facts, ${content.tools.length} tools` +
    (warnings.length ? `, ${warnings.length} warning(s)` : "") +
    ` (v1: ${v1TopicFiles.length} topics, ${roadmapFiles.length} roadmaps).`,
);
