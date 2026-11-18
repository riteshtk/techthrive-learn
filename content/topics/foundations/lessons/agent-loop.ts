// Foundations, lesson 3 (PRD P17): v1's "The agent loop", rebuilt in the
// v2 lesson design. Sources re-read on 18 Nov 2026.
import type { Lesson } from "../../../types";

export default {
  id: "agent-loop",
  topic: "foundations",
  author: "tech-and-thrive",
  diagram: "agent-loop",
  metricLabels: ["Parts built", "Model turns", "Tool calls", "Status"],
  legend: [
    ["cyan", "goal and answer"],
    ["violet", "the model"],
    ["amber", "the check"],
    ["green", "the tool and its result"],
  ],
  emptyTraceText: "Before anything runs: a goal, in plain words.",
  nodes: [
    {
      id: "G",
      name: "Goal",
      short: "Goal",
      addedAt: 1,
      what: "What the person wants done, in plain words.",
      points: ["The loop runs until it’s met, or a limit stops it"],
    },
    {
      id: "M",
      name: "Model",
      short: "Model",
      addedAt: 2,
      what: "Decides the next action: answer now, or ask for a tool.",
      points: [
        "Asks for tools; never runs them itself",
        "Decides again after every result",
      ],
    },
    {
      id: "P",
      name: "Permission check",
      short: "Check",
      addedAt: 3,
      what: "Code in your application that decides whether a requested call may run.",
      points: [
        "Treat every request as untrusted input",
        "Allowlists beat blocklists",
        "A person confirms actions with real-world consequences",
      ],
    },
    {
      id: "T",
      name: "Tool",
      short: "Tool",
      addedAt: 5,
      what: "Does the work: a search, a database query, an API call. Its result goes back to the model.",
      points: ["Run by your application, not the model"],
    },
    {
      id: "A",
      name: "Answer",
      short: "Answer",
      addedAt: 7,
      what: "What the model says once it stops asking for tools.",
      points: ["Or the loop is stopped by a step limit"],
    },
  ],
  edges: ["G_M", "M_P", "P_T", "T_M", "M_A"],
  steps: [
    {
      short: "Goal",
      type: "BRIEF",
      adds: "Goal",
      addsColor: "cyan",
      newNodes: ["G"],
      title: "Take in a goal",
      body: [
        "A goal comes in, in plain words: “Find last week’s failed payments and summarise them.”",
        "Anthropic describes agents as, typically, just LLMs using tools based on environmental feedback in a loop. This lesson builds that loop.",
      ],
      callout: {
        kind: "key",
        text: "An agent is a loop around a model, not a different kind of model.",
      },
      metrics: ["1 / 5", "none yet", "none", "waiting"],
      facts: ["fdn-agents-definition"],
      caption: "A goal comes in, in plain words.",
      trace: [],
    },
    {
      short: "Decide",
      type: "DECISION",
      adds: "Model",
      addsColor: "violet",
      newNodes: ["M"],
      title: "The model picks the next action",
      body: [
        "The model reads the goal and decides what to do next: answer now, or ask for a tool.",
        "It doesn’t run anything itself. On Claude, a response usually either finishes the turn or stops with a request to use a tool.",
      ],
      callout: {
        kind: "key",
        text: "The model proposes; your application disposes.",
      },
      metrics: ["2 / 5", "1", "none", "deciding"],
      facts: ["fdn-tool-use-flow"],
      caption:
        "The model decides the next action: answer now, or ask for a tool.",
      trace: [
        {
          from: "G",
          to: "M",
          color: "cyan",
          text: "The goal goes to the model.",
        },
      ],
    },
    {
      short: "Ask",
      type: "BUILD",
      adds: "Permission check",
      addsColor: "amber",
      newNodes: ["P"],
      title: "Ask for a tool call",
      body: [
        "To use a tool, the model asks for one: the tool’s name and the arguments it wants, such as a date range.",
        "The request goes to your application first, not straight to the tool.",
      ],
      callout: {
        kind: "watch",
        text: "The arguments come from the model, so they can be wrong, or steered by text it read.",
      },
      metrics: ["3 / 5", "1", "1 asked", "waiting for the check"],
      facts: ["fdn-tool-use-flow"],
      caption: "It asks for a tool call, with the arguments it wants.",
      trace: [
        {
          from: "M",
          to: "P",
          color: "amber",
          text: "A tool call: its name and the arguments.",
        },
      ],
    },
    {
      short: "Check",
      type: "DECISION",
      adds: "The rules the check applies",
      addsColor: "amber",
      newNodes: [],
      title: "The app checks the call is allowed",
      body: [
        "Your application, not the model, decides whether the call runs. Treat the request as untrusted input.",
        "Claude’s bash tool docs say to validate commands with an allowlist rather than a blocklist, and its computer use docs suggest a person confirms actions with meaningful real-world consequences.",
      ],
      callout: {
        kind: "watch",
        text: "The model’s own words never grant it permission. The check runs in code the model can’t change.",
      },
      metrics: ["3 / 5", "1", "1 asked", "checking"],
      facts: ["fdn-validate-untrusted", "fdn-human-confirm"],
      caption: "The app running the agent checks the call is allowed.",
      trace: [
        {
          from: "M",
          to: "P",
          color: "amber",
          text: "The call waits at the check.",
        },
      ],
    },
    {
      short: "Run",
      type: "BUILD",
      adds: "Tool",
      addsColor: "green",
      newNodes: ["T"],
      title: "Run the tool, report back",
      body: [
        "If the call is allowed, the tool runs, and its result goes back to the model in the next request.",
        "Claude’s docs sum the loop up as: the model asks, you execute, you report back, the model continues.",
      ],
      callout: {
        kind: "key",
        text: "The result is new information. It’s what lets the next decision be better than the last.",
      },
      metrics: ["4 / 5", "1", "1 run", "result sent"],
      facts: ["fdn-tool-use-flow"],
      caption: "The tool runs, and its result goes back to the model.",
      trace: [
        {
          from: "P",
          to: "T",
          color: "green",
          text: "Allowed: the tool runs.",
        },
        {
          from: "T",
          to: "M",
          color: "green",
          text: "Its result goes back to the model.",
        },
      ],
    },
    {
      short: "Again",
      type: "MEASURE",
      adds: "The loop",
      addsColor: "violet",
      newNodes: [],
      title: "Decide again, with more to go on",
      body: [
        "The model decides again, now with the tool’s result in front of it. It may ask for another tool, or it may have enough to answer.",
        "Every pass round the loop goes through the same check.",
      ],
      callout: {
        kind: "watch",
        text: "Each pass costs time and tokens. A loop with no limit can run, and bill, for a long time.",
      },
      metrics: ["4 / 5", "2", "2 run", "deciding"],
      facts: ["fdn-tool-use-flow"],
      caption: "The model decides again, now with more to go on.",
      trace: [
        {
          from: "M",
          to: "P",
          color: "amber",
          text: "Another tool call, checked again.",
        },
        {
          from: "P",
          to: "T",
          color: "green",
          text: "Allowed: it runs.",
        },
        {
          from: "T",
          to: "M",
          color: "green",
          text: "The result goes back.",
        },
      ],
    },
    {
      short: "Stop",
      type: "BUILD",
      adds: "Answer",
      addsColor: "cyan",
      newNodes: ["A"],
      title: "Stop on an answer, or a limit",
      body: [
        "When the model stops asking for tools, the loop ends with its answer. Anthropic notes it’s common to add stopping conditions, such as a maximum number of iterations, to keep control.",
        "Test agents in a sandbox, with guardrails, before they touch real systems.",
      ],
      callout: {
        kind: "interview",
        text: "What ends an agent loop? The model answers without asking for a tool, or a step limit is reached.",
      },
      metrics: ["5 / 5", "3", "2 run", "answered"],
      facts: ["fdn-agents-stopping"],
      caption:
        "When the model stops asking for tools, or a step limit is hit, the loop ends.",
      trace: [
        {
          from: "M",
          to: "A",
          color: "cyan",
          text: "No more tools needed: the answer.",
        },
      ],
    },
  ],
} satisfies Lesson;
