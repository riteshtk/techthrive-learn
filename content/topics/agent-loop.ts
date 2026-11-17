import type { Topic } from "../types";

export default {
  id: "agent-loop",
  title: "The agent loop",
  level: "advanced",
  summary:
    "Watch a model pick tools, have each call checked and run, and use the results until it can answer or hits a step limit.",
  diagram: {
    nodes: [
      { id: "goal", label: "Goal", x: 1, y: 0 },
      { id: "model", label: "Model", x: 1, y: 1 },
      { id: "answer", label: "Answer", x: 0, y: 1 },
      { id: "permission", label: "Permission check", x: 2, y: 1 },
      { id: "tool", label: "Tool", x: 2, y: 2 },
    ],
    edges: [
      { id: "goal-model", from: "goal", to: "model" },
      { id: "model-permission", from: "model", to: "permission" },
      { id: "permission-tool", from: "permission", to: "tool" },
      { id: "tool-model", from: "tool", to: "model", label: "result" },
      { id: "model-answer", from: "model", to: "answer" },
    ],
  },
  steps: [
    {
      text: "A goal comes in, in plain words.",
      highlight: ["goal", "goal-model"],
    },
    {
      text: "The model decides the next action: answer now, or call a tool.",
      highlight: ["model"],
    },
    {
      text: "It asks for a tool call, with the arguments it wants.",
      highlight: ["model", "model-permission"],
    },
    {
      text: "The app running the agent checks the call is allowed.",
      highlight: ["permission"],
    },
    {
      text: "The tool runs, and its result goes back to the model.",
      highlight: ["permission-tool", "tool", "tool-model"],
    },
    {
      text: "The model decides again, now with more to go on.",
      highlight: ["tool-model", "model"],
    },
    {
      text: "When the model stops asking for tools, or a step limit is hit, the loop ends.",
      highlight: ["model", "model-answer", "answer"],
    },
  ],
  sources: [
    {
      title: "Anthropic: Building effective agents",
      url: "https://www.anthropic.com/engineering/building-effective-agents",
      read: "2026-11-17",
    },
    {
      title: "How Claude Code works",
      url: "https://code.claude.com/docs/en/how-claude-code-works",
      read: "2026-11-17",
    },
  ],
  video: {
    youtubeId: "OCmZVrivYUY",
    title: "AI Agents Explained: Loop, Tools & Guardrails",
  },
} satisfies Topic;
