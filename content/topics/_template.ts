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
  // One sentence, at most 140 characters.
  summary: "One sentence that says what the learner will see happen.",
  diagram: {
    // Grid cells: x is 0–3 (left to right), y is 0–5 (top to bottom).
    // One node per cell. Labels: at most 20 characters, no word over 10.
    nodes: [
      { id: "first", label: "First", x: 1, y: 0 },
      { id: "second", label: "Second", x: 1, y: 1 },
      { id: "third", label: "Third", x: 1, y: 2 },
    ],
    // Straight lines between node ids. Lines may not pass through another
    // node. An edge with a label needs a gap or empty cell for it.
    edges: [
      { id: "first-second", from: "first", to: "second" },
      { id: "second-third", from: "second", to: "third", label: "optional" },
    ],
  },
  // 3 to 9 steps. Each is one sentence (at most 140 characters) and lights
  // up the node and edge ids it talks about.
  steps: [
    { text: "Something starts here.", highlight: ["first"] },
    {
      text: "It moves along to the second part.",
      highlight: ["first-second", "second"],
    },
    {
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
