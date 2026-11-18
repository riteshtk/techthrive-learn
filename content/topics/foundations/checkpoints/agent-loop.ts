// The checkpoint for "The agent loop" (PRD P17), written from the lesson
// and its sources. Not approved until a fresh reviewer and the creator
// have checked it.
import type { Checkpoint } from "../../../types";

export default {
  lesson: "agent-loop",
  topic: "foundations",
  approved: false,
  questions: [
    {
      id: "who-runs-tools",
      prompt:
        "Claude’s response stops with stop_reason “tool_use”. Who runs the tool?",
      tags: ["TOOL USE"],
      options: [
        {
          id: "A",
          text: "Your application, which then sends the result back.",
          verdict: "right",
          why: "Right. The model asks, you execute, you report back, the model continues.",
        },
        {
          id: "B",
          text: "Claude, on its own servers.",
          verdict: "wrong",
          why: "Anthropic runs only its own server tools. A tool_use stop is waiting for a tool your application runs.",
        },
        {
          id: "C",
          text: "Nobody: tool_use means the turn is over.",
          verdict: "wrong",
          why: "The loop continues once you send the tool result back.",
        },
        {
          id: "D",
          text: "Your application, and that’s the end of the exchange.",
          verdict: "partial",
          why: "Your app runs it, but it must send the result back so the model can continue.",
        },
      ],
      resultHeading: {
        right: "Right. Your app runs it.",
        other: "Not quite. Your application runs it.",
      },
      explanation: [
        "Claude responds with stop_reason tool_use and the call it wants. Your application runs the tool, sends a tool result back in the next request, and the loop repeats while the stop reason is tool_use.",
      ],
      replayStep: 5,
      facts: ["fdn-tool-use-flow"],
      reviewCard:
        "On tool_use, your application runs the tool and reports back.",
    },
    {
      id: "where-the-check-runs",
      prompt: "Where should the check that a tool call is allowed run?",
      tags: ["PERMISSIONS"],
      options: [
        {
          id: "A",
          text: "In your application’s code, before the tool runs.",
          verdict: "right",
          why: "Right. The model’s words never grant it permission; the check runs where the model can’t change it.",
        },
        {
          id: "B",
          text: "In the system prompt: tell the model what it may do.",
          verdict: "partial",
          why: "Worth saying, but a prompt is guidance, not enforcement. The check must also run in code.",
        },
        {
          id: "C",
          text: "Inside the tool, after it has started.",
          verdict: "wrong",
          why: "By then the action may already have happened. Check before it runs.",
        },
        {
          id: "D",
          text: "Nowhere: if the model asked, it must be needed.",
          verdict: "wrong",
          why: "Treat every request as untrusted input: the arguments can be wrong, or steered by text the model read.",
        },
      ],
      resultHeading: {
        right: "Right. In code, before it runs.",
        other: "Not quite. Check in code, before it runs.",
      },
      explanation: [
        "Treat each requested call as untrusted input: Claude’s bash tool docs say to validate with an allowlist rather than a blocklist, and its computer use docs suggest a person confirms actions with meaningful real-world consequences.",
      ],
      replayStep: 4,
      facts: ["fdn-validate-untrusted", "fdn-human-confirm"],
      reviewCard:
        "Check every tool call in code, before it runs, with an allowlist.",
    },
    {
      id: "ending-the-loop",
      prompt:
        "An agent keeps asking for one more search. What should end the loop?",
      tags: ["STOPPING"],
      options: [
        {
          id: "A",
          text: "A stopping condition, such as a maximum number of iterations.",
          verdict: "right",
          why: "Right. Anthropic notes it’s common to include stopping conditions to keep control.",
        },
        {
          id: "B",
          text: "Nothing: let it run until it’s sure.",
          verdict: "wrong",
          why: "Each pass costs time and tokens; a loop with no limit can run, and bill, for a long time.",
        },
        {
          id: "C",
          text: "The model deciding it has enough to answer.",
          verdict: "partial",
          why: "That’s the normal ending, but you also need a limit for when it doesn’t.",
        },
        {
          id: "D",
          text: "The tool returning an error.",
          verdict: "wrong",
          why: "An error is a result like any other; the model may just try again.",
        },
      ],
      resultHeading: {
        right: "Right. A limit you set.",
        other: "Not quite. Set a stopping condition.",
      },
      explanation: [
        "The loop ends when the model answers without asking for a tool. It’s also common to include stopping conditions, such as a maximum number of iterations, and Anthropic recommends testing agents in a sandbox with guardrails.",
      ],
      replayStep: 7,
      facts: ["fdn-agents-stopping"],
      reviewCard:
        "End agent loops with a maximum number of iterations, not just the model’s judgement.",
    },
  ],
} satisfies Checkpoint;
