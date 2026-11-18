// Fails the build and `npm test` with a clear message, naming the file and
// field, when a roadmap or topic file breaks a content rule (PRD F9).
import { roadmapFiles, topicFiles } from "../content/v1/.generated/index";
import { formatIssue, validateContent } from "../content/v1/validate";

const issues = validateContent({ topics: topicFiles, roadmaps: roadmapFiles });

if (issues.length > 0) {
  console.error(`\nContent check failed with ${issues.length} problem(s):\n`);
  for (const issue of issues) console.error(`  ✗ ${formatIssue(issue)}`);
  console.error("\nSee CONTRIBUTING.md for the content rules.\n");
  process.exit(1);
}
console.log(
  `Content check passed: ${topicFiles.length} topics, ${roadmapFiles.length} roadmaps.`,
);
