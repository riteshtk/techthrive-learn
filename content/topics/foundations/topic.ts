// Foundations (PRD P17): v1's three topics rebuilt as one topic in the v2
// lesson design, as approved in the Foundations stills (18 Nov 2026). The
// lesson ids are v1's topic ids, so their old addresses redirect here and
// v1 progress carries over.
import type { Topic } from "../../types";

export default {
  id: "foundations",
  title: "Foundations: how AI apps work",
  switcherLabel: "Foundations",
  level: "foundation",
  status: "live",
  summary:
    "How an LLM answers, RAG and the agent loop, rebuilt in the new lesson design.",
  domain: "AI & ML",
  system: "An AI assistant over your documents",
  tags: ["LLMs", "RAG", "Agent loop"],
  tabs: ["overview", "lessons"],
  lessons: [
    {
      id: "how-an-llm-answers",
      title: "How an LLM answers",
      summary:
        "Tokens in, one token out, again and again: prompts, tokenizers, scores and sampling.",
      minutes: 6,
      ctaName: "How an LLM answers",
    },
    {
      id: "rag",
      title: "RAG: answers from your documents",
      summary:
        "Documents become chunks and embeddings; the closest chunks join the prompt so the model can answer from them.",
      minutes: 8,
      ctaName: "RAG",
    },
    {
      id: "agent-loop",
      title: "The agent loop",
      summary:
        "The model picks an action, the app checks it's allowed, a tool runs, and the loop goes round until it's done.",
      minutes: 8,
      ctaName: "the agent loop",
    },
  ],
  overview: {
    layout: "list",
    heroTitle: "Foundations: how AI apps work.",
    promise:
      "Three short lessons on the ideas every AI system builds on: how a model writes an answer, how it answers from your documents, and how an agent takes actions safely.",
    diagram: "rag-pipeline",
    heroTrace: [
      { from: "Q", to: "V", color: "cyan" },
      { from: "V", to: "K", color: "cyan" },
      { from: "K", to: "P", color: "amber" },
      { from: "Q", to: "P", color: "amber" },
      { from: "P", to: "M", color: "violet" },
      { from: "M", to: "A", color: "green" },
    ],
    highlights: [
      { icon: "check", text: "Every figure sourced and dated" },
      { icon: "layers", text: "Same 2D and 3D diagram engine" },
      { icon: "award", text: "A checkpoint after each lesson" },
    ],
    why: {
      label: "Why start here",
      headline:
        "Every topic after this one assumes these three ideas. Learn them once, properly.",
      stats: [
        {
          value: "3",
          claim: "lessons, each built around one diagram you step through.",
          facts: ["fdn-lesson-count"],
        },
        {
          value: "22 min",
          claim: "of stepping in all, at your own pace.",
          facts: ["fdn-minutes"],
        },
        {
          value: "21",
          claim: "steps across the three lessons, each with its own narration.",
          facts: ["fdn-step-count"],
        },
        {
          value: "9",
          claim:
            "checkpoint questions, three per lesson, scored in your browser.",
          facts: ["fdn-question-count"],
        },
      ],
    },
    outcomesLabel: "You will be able to",
    outcomes: [
      "Explain how a model turns a prompt into an answer, one token at a time",
      "Design a retrieval pipeline and say where it can still go wrong",
      "Sketch an agent loop with a permission check before every tool call",
    ],
    prerequisites: {
      text: "None. If you can read a diagram, you can start here.",
      audiences: ["Engineers", "Product managers", "Students"],
    },
  },
} satisfies Topic;
