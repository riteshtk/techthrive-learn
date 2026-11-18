// Fails the build and `npm test` with a clear message, naming the file and
// field, when a content file breaks a rule (PRD P3). Warnings, such as a
// fact past its re-check date, are printed but don't fail.
import {
  checkpointFiles,
  diagramFiles,
  factFiles,
  catalogFiles,
  lessonFiles,
  toolFiles,
  topicFiles,
} from "../content/.generated/index";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { formatIssue } from "../content/schema";
import { narrationIssues } from "../content/narration";
import { validateContent } from "../content/validate";

const today = new Date().toISOString().slice(0, 10);
const { issues, content } = validateContent(
  {
    topics: topicFiles,
    lessons: lessonFiles,
    checkpoints: checkpointFiles,
    diagrams: diagramFiles,
    facts: factFiles,
    tools: toolFiles,
    catalog: catalogFiles,
  },
  today,
);

// Narration: Tech & Thrive's lessons must be recorded (an error with
// REQUIRE_NARRATION=1, as CI runs it); community lessons ship with their
// transcript.
issues.push(
  ...narrationIssues(
    content.lessons,
    (path) => existsSync(join("public", path)),
    process.env.REQUIRE_NARRATION === "1",
  ),
);

const errors = issues.filter((i) => i.level !== "warning");
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
    ".",
);
