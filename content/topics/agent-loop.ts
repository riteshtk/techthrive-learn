import type { Topic } from "../types";

export default {
  id: "agent-loop",
  title: "The agent loop",
  level: "advanced",
  minutes: 8,
  summary:
    "Watch a model pick tools, have each call checked and run, and use the results until it can answer or hits a step limit.",
  diagram: {
    nodes: [
      {
        id: "goal",
        label: "Goal",
        icon: "target",
        note: "What the person wants done, in plain words.",
        x: 1,
        y: 0,
      },
      {
        id: "model",
        label: "Model",
        icon: "chip",
        note: "Chooses each next action: answer now, or call a tool.",
        x: 1,
        y: 1,
      },
      {
        id: "answer",
        label: "Answer",
        icon: "check",
        note: "The final reply, once no more tools are needed.",
        x: 0,
        y: 1,
      },
      {
        id: "permission",
        label: "Permission check",
        icon: "shield",
        note: "The app's rules on which tool calls are allowed to run.",
        x: 2,
        y: 1,
      },
      {
        id: "tool",
        label: "Tool",
        icon: "tool",
        note: "Something the agent can use, such as search, code or files.",
        x: 2,
        y: 2,
      },
    ],
    edges: [
      { id: "goal-model", from: "goal", to: "model", flows: "the goal" },
      {
        id: "model-permission",
        from: "model",
        to: "permission",
        flows: "a tool call with its arguments",
      },
      {
        id: "permission-tool",
        from: "permission",
        to: "tool",
        flows: "a call that is allowed",
      },
      {
        id: "tool-model",
        from: "tool",
        to: "model",
        label: "result",
        flows: "the tool's output",
      },
      {
        id: "model-answer",
        from: "model",
        to: "answer",
        flows: "the final answer",
      },
    ],
  },
  steps: [
    {
      title: "Take in a goal",
      text: "A goal comes in, in plain words.",
      highlight: ["goal", "goal-model"],
    },
    {
      title: "Decide what's next",
      text: "The model decides the next action: answer now, or call a tool.",
      highlight: ["model"],
    },
    {
      title: "Ask for a tool",
      text: "It asks for a tool call, with the arguments it wants.",
      highlight: ["model", "model-permission"],
    },
    {
      title: "Check it's allowed",
      text: "The app running the agent checks the call is allowed.",
      highlight: ["permission"],
    },
    {
      title: "Run the tool",
      text: "The tool runs, and its result goes back to the model.",
      highlight: ["permission-tool", "tool", "tool-model"],
    },
    {
      title: "Decide again",
      text: "The model decides again, now with more to go on.",
      highlight: ["tool-model", "model"],
    },
    {
      title: "Finish",
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
