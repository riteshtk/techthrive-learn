import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getLessons } from "@/content";

// Each step's narration is recorded in the creator's voice and shipped with
// its transcript (PRD P5). The transcript must be the step's caption, word
// for word, so changing a caption means recording it again. Lessons not yet
// recorded are listed by the content check (an error with
// REQUIRE_NARRATION=1, as Gate 1 requires).
const recorded = getLessons().filter((l) =>
  existsSync(join("public", "audio", l.topic, l.id, "transcript.json")),
);

describe.each(recorded.map((l) => [`${l.topic}/${l.id}`, l] as const))(
  "narration for %s",
  (key, lesson) => {
    const dir = join("public", "audio", key);
    const transcript = JSON.parse(
      readFileSync(join(dir, "transcript.json"), "utf8"),
    ) as { step: number; file: string; transcript: string }[];

    it("has one recording per step, named for it", () => {
      expect(transcript.map((t) => t.step)).toEqual(
        lesson.steps.map((_, i) => i + 1),
      );
      for (const t of transcript) {
        expect(t.file).toBe(`${String(t.step).padStart(2, "0")}.mp3`);
        expect(existsSync(join(dir, t.file)), t.file).toBe(true);
      }
    });

    it("says each step's caption word for word", () => {
      expect(transcript.map((t) => t.transcript)).toEqual(
        lesson.steps.map((s) => s.caption),
      );
    });
  },
);
