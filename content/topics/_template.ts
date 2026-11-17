// Copy this file to content/topics/<your-topic-id>.ts, fill it in, and add
// the id to a roadmap in content/roadmaps/. Files starting with "_" are
// never published. `npm test` tells you, by file and field, what to fix.
// The rules are in CONTRIBUTING.md.
import type { Topic } from "../types";

export default {
  // kebab-case, the same as the file name. Never changes once merged.
  id: "your-topic-id",
  // At most 60 characters.
  title: "Your topic title",
  // basics, intermediate or advanced.
  level: "basics",
  // Rough minutes to work through it, 1–60.
  minutes: 5,
  // One sentence, at most 140 characters.
  summary: "One sentence that says what the learner will see happen.",
  diagram: {
    // Grid cells: x is 0–3 (left to right), y is 0–5 (top to bottom).
    // One node per cell. Labels: at most 20 characters, no word over 10.
    // `note` is one sentence (at most 90 characters) on what the part does;
    // learners see it when they click the block. `icon` is optional: text,
    // question, document, split, vector, chip, token, database, list,
    // check, target, shield or tool.
    nodes: [
      {
        id: "first",
        label: "First",
        icon: "text",
        note: "Where it all starts.",
        x: 1,
        y: 0,
      },
      {
        id: "second",
        label: "Second",
        note: "Does the work in the middle.",
        x: 1,
        y: 1,
      },
      {
        id: "third",
        label: "Third",
        icon: "check",
        note: "Where the result ends up.",
        x: 1,
        y: 2,
      },
    ],
    // Straight lines between node ids. Lines may not pass through another
    // node. `label` is an optional pill on the line, which needs a gap or
    // empty cell for room. `flows` (at most 40 characters) says what moves
    // along it; learners see it when they hover or focus the line.
    edges: [
      {
        id: "first-second",
        from: "first",
        to: "second",
        flows: "what moves from first to second",
      },
      {
        id: "second-third",
        from: "second",
        to: "third",
        label: "optional",
        flows: "the finished result",
      },
    ],
  },
  // 3 to 9 steps. `title` is a short name (at most 24 characters, no full
  // stop) used on the Next button and the timeline. `text` is one sentence
  // (at most 140 characters). `highlight` lights up the node and edge ids it
  // talks about.
  steps: [
    {
      title: "Start",
      text: "Something starts here.",
      highlight: ["first"],
    },
    {
      title: "Move along",
      text: "It moves along to the second part.",
      highlight: ["first-second", "second"],
    },
    {
      title: "Arrive",
      text: "And it ends up at the third part.",
      highlight: ["second-third", "third"],
    },
  ],
  // At least one source outside Tech & Thrive. `read` is the date you
  // checked it, as YYYY-MM-DD.
  sources: [
    {
      title: "A trustworthy source",
      url: "https://example.org/article",
      read: "2026-01-31",
    },
  ],
  // Optional: the Tech & Thrive video about this topic.
  // video: { youtubeId: "XXXXXXXXXXX", title: "Video title" },
} satisfies Topic;
