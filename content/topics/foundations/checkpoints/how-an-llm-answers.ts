// The checkpoint for "How an LLM answers" (PRD P17), written from the lesson
// and its sources. Not approved until a fresh reviewer and the creator
// have checked it.
import type { Checkpoint } from "../../../types";

export default {
  lesson: "how-an-llm-answers",
  topic: "foundations",
  approved: false,
  questions: [
    {
      id: "one-token-per-pass",
      prompt:
        "A model has just written “The capital of France is”. What does its next pass produce?",
      tags: ["TOKENS", "AUTO-REGRESSIVE"],
      options: [
        {
          id: "A",
          text: "A probability for every possible next token, then one drawn token.",
          verdict: "right",
          why: "Right. Each pass scores every next token and one is drawn, then it’s fed back in.",
        },
        {
          id: "B",
          text: "The rest of the sentence, planned in one go.",
          verdict: "wrong",
          why: "The model doesn’t plan a sentence. It predicts one token per pass.",
        },
        {
          id: "C",
          text: "The single word “Paris”, looked up from a table of facts.",
          verdict: "partial",
          why: "“Paris” is the likely outcome, but it’s drawn from probabilities, not looked up, and it may take more than one token.",
        },
        {
          id: "D",
          text: "A corrected version of the whole prompt.",
          verdict: "wrong",
          why: "The prompt isn’t rewritten. The model adds one token after it.",
        },
      ],
      resultHeading: {
        right: "Right. One token per pass.",
        other: "Not quite. Each pass draws one token.",
      },
      explanation: [
        "A model is auto-regressive: it reads every token so far, gives each possible next token a probability, and one is drawn. That token is added to the input and the model runs again.",
      ],
      replayStep: 3,
      facts: ["fdn-autoregressive", "fdn-softmax"],
      reviewCard:
        "A model writes one token per pass, each predicted from the tokens before it.",
    },
    {
      id: "temperature-zero",
      prompt:
        "In a library that supports it, you set temperature to 0. What happens to the draw?",
      subline:
        "On Claude, from API version 2026-10-21, sending temperature returns an error; this is about the idea.",
      tags: ["SAMPLING", "TEMPERATURE"],
      options: [
        {
          id: "A",
          text: "All the weight goes on the most likely token, so the draw stops being random.",
          verdict: "right",
          why: "Right. 0 is equivalent to putting all the probability on the most likely token.",
        },
        {
          id: "B",
          text: "The model refuses to answer.",
          verdict: "wrong",
          why: "Temperature reshapes the odds; it doesn’t stop the model answering.",
        },
        {
          id: "C",
          text: "Every token becomes equally likely.",
          verdict: "wrong",
          why: "That’s the opposite: a high temperature flattens the odds, a low one sharpens them.",
        },
        {
          id: "D",
          text: "There’s less randomness, but some is left.",
          verdict: "partial",
          why: "True of a temperature between 0 and 1. At exactly 0, the most likely token always wins.",
        },
      ],
      resultHeading: {
        right: "Right. 0 means the likeliest token.",
        other: "Not quite. 0 removes the randomness.",
      },
      explanation: [
        "Temperature below 1 means less randomness, and 0 is equivalent to putting all the probability on the most likely token. On Claude you steer the answer with the prompt instead: from API version 2026-10-21, a request that sends temperature returns an error.",
      ],
      replayStep: 4,
      facts: ["fdn-temperature", "fdn-claude-no-temperature"],
      reviewCard: "Temperature 0 puts all the weight on the most likely token.",
    },
    {
      id: "max-tokens-stop",
      prompt:
        "Claude’s response comes back with stop_reason “max_tokens”. What should your app assume?",
      tags: ["STOP REASONS"],
      options: [
        {
          id: "A",
          text: "The answer was cut off at your length limit.",
          verdict: "right",
          why: "Right. max_tokens means it reached your limit, not that it finished.",
        },
        {
          id: "B",
          text: "The answer is complete; max_tokens is the normal ending.",
          verdict: "wrong",
          why: "The normal ending is end_turn. max_tokens means it ran out of room.",
        },
        {
          id: "C",
          text: "The model wrote one of your stop strings.",
          verdict: "wrong",
          why: "That’s stop_sequence.",
        },
        {
          id: "D",
          text: "The answer may be usable, but check whether it’s complete.",
          verdict: "partial",
          why: "Checking is right, but the stop reason already tells you: it was cut off.",
        },
      ],
      resultHeading: {
        right: "Right. It ran out of room.",
        other: "Not quite. max_tokens means cut off.",
      },
      explanation: [
        "Generation stops at an end-of-sequence token or a length limit. Claude reports end_turn when it finished naturally, max_tokens when it hit your limit, and stop_sequence when it wrote one of your stop strings.",
      ],
      replayStep: 6,
      facts: ["fdn-stop-reasons", "fdn-eos-or-length"],
      reviewCard:
        "stop_reason max_tokens: the answer was cut off at your limit.",
    },
  ],
} satisfies Checkpoint;
