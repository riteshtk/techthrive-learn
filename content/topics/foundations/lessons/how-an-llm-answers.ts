// Foundations, lesson 1 (PRD P17): v1's "How an LLM answers", rebuilt in
// the v2 lesson design. Sources re-read on 18 Nov 2026; the Claude API now
// rejects temperature, so the lesson teaches it as a concept only.
import type { Lesson } from "../../../types";

export default {
  id: "how-an-llm-answers",
  topic: "foundations",
  author: "tech-and-thrive",
  diagram: "llm-answers",
  metricLabels: ["Parts built", "Model passes", "Next", "Stopped by"],
  legend: [
    ["cyan", "your prompt"],
    ["amber", "tokens"],
    ["violet", "a model pass"],
    ["green", "the drawn token"],
  ],
  emptyTraceText: "Before anything runs: a prompt, waiting to be read.",
  nodes: [
    {
      id: "P",
      name: "Prompt",
      short: "Prompt",
      addedAt: 1,
      what: "The text you send: a question, an instruction, or a document to work on.",
      points: ["Plain text in, before anything else happens"],
    },
    {
      id: "T",
      name: "Tokenizer",
      short: "Tokenizer",
      addedAt: 2,
      what: "Splits text into tokens and turns each one into a number the model can work with.",
      points: [
        "A token can be a word, part of a word, a character or a byte",
        "Token counts aren’t word counts",
      ],
    },
    {
      id: "M",
      name: "Model",
      short: "Model",
      addedAt: 3,
      what: "Reads every token so far and gives each possible next token a probability.",
      points: [
        "Predicts one token per pass",
        "Never looks ahead at later tokens",
      ],
    },
    {
      id: "N",
      name: "Next token",
      short: "Next token",
      addedAt: 4,
      what: "The one token drawn from those probabilities, then fed back in.",
      points: ["Drawn at random, weighted by its probability"],
    },
    {
      id: "A",
      name: "Answer",
      short: "Answer",
      addedAt: 7,
      what: "The drawn tokens, turned back into text.",
      points: ["Fluent is not the same as correct"],
    },
  ],
  edges: ["P_T", "T_M", "M_N", "N_A"],
  steps: [
    {
      short: "Prompt",
      type: "BRIEF",
      adds: "Prompt",
      addsColor: "cyan",
      newNodes: ["P"],
      title: "Send a prompt",
      body: [
        "You send a prompt: plain text, such as “Explain idempotency in one line.”",
        "Everything that follows happens to that text, one small piece at a time.",
      ],
      callout: {
        kind: "key",
        text: "A model never sees your words as words. It sees tokens.",
      },
      metrics: ["1 / 5", "none yet", "tokenize", "—"],
      facts: [],
      caption: "You send a prompt, as plain text.",
      trace: [],
    },
    {
      short: "Tokens",
      type: "BUILD",
      adds: "Tokenizer",
      addsColor: "amber",
      newNodes: ["T"],
      title: "Split it into tokens",
      body: [
        "A tokenizer splits the text into tokens. Claude’s glossary says a token can be a word, part of a word, a character, or even a byte.",
        "Each token becomes a number. From here on, the model only ever handles tokens.",
      ],
      callout: {
        kind: "watch",
        text: "Token counts aren’t word counts: one word can be several tokens.",
      },
      metrics: ["2 / 5", "none yet", "score", "—"],
      facts: ["fdn-tokens"],
      caption:
        "A tokenizer splits the text into tokens: whole words, parts of words, characters or bytes.",
      trace: [
        {
          from: "P",
          to: "T",
          color: "cyan",
          text: "The prompt goes to the tokenizer.",
        },
      ],
    },
    {
      short: "Score",
      type: "BUILD",
      adds: "Model",
      addsColor: "violet",
      newNodes: ["M"],
      title: "Score every possible next token",
      body: [
        "The model reads every token so far. The Transformer paper calls it auto-regressive: each new token is predicted from the tokens before it, never from later ones.",
        "Its last step, a softmax, turns the result into a probability for every token in its vocabulary.",
      ],
      callout: {
        kind: "key",
        text: "The model doesn’t plan a whole sentence. It scores one next token at a time.",
      },
      metrics: ["3 / 5", "1", "draw", "—"],
      facts: ["fdn-autoregressive", "fdn-softmax"],
      caption:
        "The model reads every token so far and scores each possible next token.",
      trace: [
        {
          from: "P",
          to: "T",
          color: "cyan",
          text: "The prompt goes to the tokenizer.",
        },
        {
          from: "T",
          to: "M",
          color: "amber",
          text: "The tokens go to the model.",
        },
      ],
    },
    {
      short: "Draw",
      type: "DECISION",
      adds: "Next token",
      addsColor: "green",
      newNodes: ["N"],
      title: "Draw one token",
      body: [
        "Sampling draws one token at random, weighted by those probabilities. Greedy search would always take the most likely one instead.",
        "Temperature reshapes the odds: below 1 means less randomness, and 0 puts all the weight on the most likely token.",
      ],
      callout: {
        kind: "watch",
        text: "On Claude, steer the answer with your prompt: from API version 2026-10-21, a request that sends temperature returns an error.",
      },
      metrics: ["4 / 5", "1", "append", "—"],
      facts: ["fdn-sampling", "fdn-temperature", "fdn-claude-no-temperature"],
      caption:
        "The scores become probabilities and one token is drawn; a lower temperature means less randomness.",
      trace: [
        {
          from: "T",
          to: "M",
          color: "amber",
          text: "The tokens go to the model.",
        },
        {
          from: "M",
          to: "N",
          color: "violet",
          text: "One token is drawn from the probabilities.",
        },
      ],
    },
    {
      short: "Again",
      type: "BUILD",
      adds: "The loop back to the model",
      addsColor: "green",
      newNodes: [],
      title: "Feed it back in",
      body: [
        "The drawn token is added to the input, and the model runs again, now with one more token to read.",
        "Each pass adds exactly one token. Long answers are many passes.",
      ],
      callout: {
        kind: "key",
        text: "The model’s own output becomes part of its input. That’s what auto-regressive means.",
      },
      metrics: ["4 / 5", "2", "score again", "—"],
      facts: ["fdn-autoregressive"],
      caption: "That token is added to the input, and the model runs again.",
      trace: [
        {
          from: "M",
          to: "N",
          color: "violet",
          text: "One token is drawn.",
        },
        {
          from: "N",
          to: "M",
          color: "green",
          text: "It’s added to the input for the next pass.",
        },
      ],
    },
    {
      short: "Stop",
      type: "MEASURE",
      adds: "A stop condition",
      addsColor: "text",
      newNodes: [],
      title: "Stop when it’s done, or out of room",
      body: [
        "The loop ends when the model produces an end-of-sequence token, or when it reaches a length limit.",
        "Claude reports which: end_turn when it finished naturally, max_tokens when it hit your limit, stop_sequence when it wrote one of your stop strings.",
      ],
      callout: {
        kind: "watch",
        text: "A max_tokens stop means the answer was cut off. Check the stop reason before you use it.",
      },
      metrics: ["4 / 5", "many", "until a stop", "end_turn"],
      facts: ["fdn-eos-or-length", "fdn-stop-reasons"],
      caption:
        "This repeats until the model produces an end-of-sequence token or reaches a length limit.",
      trace: [
        {
          from: "M",
          to: "N",
          color: "violet",
          text: "Draw a token.",
        },
        {
          from: "N",
          to: "M",
          color: "green",
          text: "Feed it back, until a stop token or the limit.",
        },
      ],
    },
    {
      short: "Answer",
      type: "BUILD",
      adds: "Answer",
      addsColor: "text",
      newNodes: ["A"],
      title: "Turn tokens back into text",
      body: [
        "The tokens are turned back into text, and that’s the answer.",
        "Nothing in this loop checked a fact. A fluent answer can still be wrong, which is what the next lesson works on.",
      ],
      callout: {
        kind: "interview",
        text: "Why can the same prompt give different answers? Sampling draws from a distribution, not a fixed choice.",
      },
      metrics: ["5 / 5", "done", "read it", "end_turn"],
      facts: ["fdn-sampling"],
      caption: "The tokens are turned back into text, and that’s the answer.",
      trace: [
        {
          from: "N",
          to: "A",
          color: "green",
          text: "The tokens become text: the answer.",
        },
      ],
    },
  ],
} satisfies Lesson;
