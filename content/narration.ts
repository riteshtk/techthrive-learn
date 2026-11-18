// Which lessons still need narration (PRD P5, P17). Tech & Thrive's own
// lessons are recorded in the creator's voice, one file per step at
// public/audio/<topic>/<lesson>/<NN>.mp3: a missing recording is a warning
// while recording is under way, and an error once REQUIRE_NARRATION=1
// (CI, Gate 1). A community lesson can't be recorded in that voice, so it
// ships with its transcript and is never flagged.
import type { Issue } from "./schema";
import type { Lesson } from "./types";

export function narrationIssues(
  lessons: readonly Lesson[],
  /** Whether a recording exists, by its path under public/. */
  recorded: (path: string) => boolean,
  requireNarration: boolean,
): Issue[] {
  const issues: Issue[] = [];
  for (const lesson of lessons) {
    if (lesson.author !== "tech-and-thrive") continue;
    const dir = `audio/${lesson.topic}/${lesson.id}`;
    const missing = lesson.steps
      .map((_, i) => i + 1)
      .filter((n) => !recorded(`${dir}/${String(n).padStart(2, "0")}.mp3`));
    if (missing.length > 0)
      issues.push({
        file: `content/topics/${lesson.topic}/lessons/${lesson.id}.ts`,
        field: "steps",
        message: `narration audio missing for step ${missing.join(", ")} (public/${dir}/NN.mp3)`,
        level: requireNarration ? "error" : "warning",
      });
  }
  return issues;
}
