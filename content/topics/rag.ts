import type { Topic } from "../types";

export default {
  id: "rag",
  title: "RAG: answers from your documents",
  level: "intermediate",
  summary:
    "See documents become searchable embeddings, and the closest chunks join the prompt so the model can answer from them.",
  diagram: {
    nodes: [
      { id: "documents", label: "Documents", x: 0, y: 0 },
      { id: "chunks", label: "Chunks", x: 1, y: 0 },
      { id: "embeddings", label: "Embeddings", x: 2, y: 0 },
      { id: "vector-store", label: "Vector store", x: 2, y: 1 },
      { id: "top-chunks", label: "Top chunks", x: 1, y: 1 },
      { id: "question", label: "Question", x: 2, y: 2 },
      { id: "prompt", label: "Prompt", x: 1, y: 2 },
      { id: "model", label: "Model", x: 1, y: 3 },
      { id: "answer", label: "Answer", x: 2, y: 3 },
    ],
    edges: [
      { id: "documents-chunks", from: "documents", to: "chunks" },
      { id: "chunks-embeddings", from: "chunks", to: "embeddings" },
      { id: "embeddings-store", from: "embeddings", to: "vector-store" },
      {
        id: "question-store",
        from: "question",
        to: "vector-store",
        label: "embedded",
      },
      { id: "store-top-chunks", from: "vector-store", to: "top-chunks" },
      { id: "top-chunks-prompt", from: "top-chunks", to: "prompt" },
      { id: "question-prompt", from: "question", to: "prompt" },
      { id: "prompt-model", from: "prompt", to: "model" },
      { id: "model-answer", from: "model", to: "answer" },
    ],
  },
  steps: [
    {
      text: "Before any question, your documents are split into chunks.",
      highlight: ["documents", "documents-chunks", "chunks"],
    },
    {
      text: "Each chunk becomes an embedding: a list of numbers that captures its meaning.",
      highlight: ["chunks-embeddings", "embeddings"],
    },
    {
      text: "The embeddings are saved in a vector store.",
      highlight: ["embeddings-store", "vector-store"],
    },
    {
      text: "A question arrives and is turned into an embedding the same way.",
      highlight: ["question", "question-store", "vector-store"],
    },
    {
      text: "The store returns the chunks closest in meaning to the question.",
      highlight: ["vector-store", "store-top-chunks", "top-chunks"],
    },
    {
      text: "Those chunks go into the prompt, next to the question.",
      highlight: [
        "top-chunks",
        "top-chunks-prompt",
        "question",
        "question-prompt",
        "prompt",
      ],
    },
    {
      text: "The model answers from those chunks and, if asked, cites them, but it can still get a fact wrong.",
      highlight: ["prompt-model", "model", "model-answer", "answer"],
    },
  ],
  sources: [
    {
      title: "Lewis et al., Retrieval-Augmented Generation",
      url: "https://arxiv.org/abs/2005.11401",
      read: "2026-11-17",
    },
    {
      title: "Anthropic: Contextual Retrieval",
      url: "https://www.anthropic.com/news/contextual-retrieval",
      read: "2026-11-17",
    },
    {
      title: "Azure AI Search: Hybrid search",
      url: "https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview",
      read: "2026-11-17",
    },
  ],
  video: {
    youtubeId: "6bz4-qeIEAc",
    title: "Your RAG gives wrong answers. Check this first",
  },
} satisfies Topic;
