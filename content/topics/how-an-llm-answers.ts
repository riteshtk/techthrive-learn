import type { Topic } from "../types";

export default {
  id: "how-an-llm-answers",
  title: "How an LLM answers",
  level: "basics",
  minutes: 6,
  summary:
    "Follow a prompt as it becomes tokens, then watch the model pick one next token at a time until the answer is done.",
  diagram: {
    nodes: [
      {
        id: "prompt",
        label: "Prompt",
        icon: "text",
        note: "The text you type, sent to the model as it is.",
        x: 1,
        y: 0,
      },
      {
        id: "tokenizer",
        label: "Tokenizer",
        icon: "split",
        note: "Splits text into tokens, each of which the model knows by number.",
        x: 1,
        y: 1,
      },
      {
        id: "model",
        label: "Model",
        icon: "chip",
        note: "Reads every token so far and scores each possible next token.",
        x: 1,
        y: 2,
      },
      {
        id: "next-token",
        label: "Next token",
        icon: "token",
        note: "The one token drawn from the model's scores on this pass.",
        x: 2,
        y: 2,
      },
      {
        id: "answer",
        label: "Answer",
        icon: "check",
        note: "The chosen tokens turned back into text you can read.",
        x: 2,
        y: 3,
      },
    ],
    edges: [
      {
        id: "prompt-tokenizer",
        from: "prompt",
        to: "tokenizer",
        flows: "plain text",
      },
      {
        id: "tokenizer-model",
        from: "tokenizer",
        to: "model",
        flows: "token ids",
      },
      {
        id: "model-next-token",
        from: "model",
        to: "next-token",
        flows: "a score for every possible token",
      },
      {
        id: "next-token-model",
        from: "next-token",
        to: "model",
        flows: "the chosen token, added to the input",
      },
      {
        id: "next-token-answer",
        from: "next-token",
        to: "answer",
        flows: "the finished run of tokens",
      },
    ],
  },
  steps: [
    {
      title: "Send a prompt",
      text: "You send a prompt, as plain text.",
      highlight: ["prompt"],
    },
    {
      title: "Split into tokens",
      text: "A tokenizer splits the text into tokens: whole words, parts of words or punctuation.",
      highlight: ["prompt-tokenizer", "tokenizer"],
    },
    {
      title: "Score next tokens",
      text: "The model reads every token so far and scores each possible next token.",
      highlight: ["tokenizer-model", "model"],
    },
    {
      title: "Pick one token",
      text: "The scores become probabilities and one token is drawn; a lower temperature makes the likeliest tokens win more often.",
      highlight: ["model-next-token", "next-token"],
    },
    {
      title: "Feed it back in",
      text: "That token is added to the input, and the model runs again.",
      highlight: ["next-token-model", "model"],
    },
    {
      title: "Repeat until done",
      text: "This repeats until the model produces a stop token or reaches a length limit.",
      highlight: [
        "model",
        "model-next-token",
        "next-token",
        "next-token-model",
      ],
    },
    {
      title: "Turn tokens into text",
      text: "The tokens are turned back into text, and that's the answer.",
      highlight: ["next-token-answer", "answer"],
    },
  ],
  sources: [
    {
      title: "Attention Is All You Need",
      url: "https://arxiv.org/abs/1706.03762",
      read: "2026-11-17",
    },
    {
      title: "Hugging Face: Generation strategies",
      url: "https://huggingface.co/docs/transformers/generation_strategies",
      read: "2026-11-17",
    },
    {
      title: "Claude glossary",
      url: "https://docs.claude.com/en/docs/about-claude/glossary",
      read: "2026-11-17",
    },
  ],
  video: {
    youtubeId: "ZwKOIoqYj5c",
    title: "How LLMs work: one next-word loop",
  },
} satisfies Topic;
