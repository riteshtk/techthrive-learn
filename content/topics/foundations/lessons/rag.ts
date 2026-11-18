// Foundations, lesson 2 (PRD P17): v1's "RAG: answers from your
// documents", rebuilt in the v2 lesson design. Sources re-read on
// 18 Nov 2026.
import type { Lesson } from "../../../types";

export default {
  id: "rag",
  topic: "foundations",
  author: "tech-and-thrive",
  diagram: "rag-pipeline",
  metricLabels: ["Parts built", "Documents", "Retrieved", "Answer"],
  legend: [
    ["blue", "your documents"],
    ["cyan", "search"],
    ["violet", "embedding and the model"],
    ["amber", "the prompt"],
    ["green", "the answer"],
  ],
  emptyTraceText: "Before any question: your documents, as they are.",
  nodes: [
    {
      id: "D",
      name: "Documents",
      short: "Documents",
      addedAt: 1,
      what: "Your source material, such as help pages, policies, PDFs or notes.",
      points: ["Already there: RAG works on what you have"],
    },
    {
      id: "C",
      name: "Chunks",
      short: "Chunks",
      addedAt: 1,
      what: "Short passages, small enough to search and to quote.",
      points: ["Usually no more than a few hundred tokens each"],
    },
    {
      id: "E",
      name: "Embeddings",
      short: "Embeddings",
      addedAt: 2,
      what: "Lists of numbers that capture what each chunk means.",
      points: [
        "Similar meanings land close together",
        "Anthropic doesn’t make its own embedding model",
      ],
    },
    {
      id: "V",
      name: "Vector store",
      short: "Vector store",
      addedAt: 3,
      what: "A database that finds the vectors closest in meaning to a query.",
      points: ["Stores each vector with the chunk it came from"],
    },
    {
      id: "Q",
      name: "Question",
      short: "Question",
      addedAt: 4,
      what: "What the person asks, in their own words.",
      points: ["Embedded with the same, or a compatible, model"],
    },
    {
      id: "K",
      name: "Top chunks",
      short: "Top chunks",
      addedAt: 5,
      what: "The few chunks whose meaning is closest to the question.",
      points: ["If the right chunk isn’t here, the model can’t use it"],
    },
    {
      id: "P",
      name: "Prompt",
      short: "Prompt",
      addedAt: 6,
      what: "The question with the retrieved chunks beside it, and an instruction to answer only from them.",
      points: ["Let the model say “I don’t know”"],
    },
    {
      id: "M",
      name: "Model",
      short: "Model",
      addedAt: 7,
      what: "Writes a reply using the chunks in its prompt.",
      points: ["Can cite the exact passages it used"],
    },
    {
      id: "A",
      name: "Answer",
      short: "Answer",
      addedAt: 7,
      what: "The reply, ideally pointing to the chunks it used.",
      points: ["Grounded answers can still be wrong"],
    },
  ],
  edges: ["D_C", "C_E", "E_V", "Q_V", "V_K", "K_P", "Q_P", "P_M", "M_A"],
  steps: [
    {
      short: "Chunks",
      type: "BRIEF",
      adds: "Documents and chunks",
      addsColor: "blue",
      newNodes: ["D", "C"],
      title: "Split your documents into chunks",
      body: [
        "On its own, a model only knows what it learned in training and what’s in its prompt. To answer from your documents, it needs them in front of it when it answers.",
        "Retrieval-augmented generation (RAG) pairs the model with a searchable index of your documents. First, they’re split into chunks: Anthropic describes chunks of usually no more than a few hundred tokens.",
      ],
      callout: {
        kind: "key",
        text: "RAG doesn’t retrain the model. It changes what the model reads.",
      },
      metrics: ["2 / 9", "split", "—", "—"],
      facts: ["fdn-rag-paper", "fdn-chunk-size"],
      caption: "Before any question, your documents are split into chunks.",
      trace: [
        {
          from: "D",
          to: "C",
          color: "blue",
          text: "Documents are split into short chunks.",
        },
      ],
    },
    {
      short: "Embed",
      type: "BUILD",
      adds: "Embeddings",
      addsColor: "violet",
      newNodes: ["E"],
      title: "Turn each chunk into an embedding",
      body: [
        "An embedding is a list of numbers that captures what a chunk means. Claude’s docs call embeddings numerical representations of text that let you measure semantic similarity.",
        "Anthropic doesn’t make its own embedding model, so you use another provider’s.",
      ],
      callout: {
        kind: "key",
        text: "Close in numbers means close in meaning, even when the words differ.",
      },
      metrics: ["3 / 9", "embedded", "—", "—"],
      facts: ["fdn-embeddings"],
      caption:
        "Each chunk becomes an embedding: a list of numbers that captures its meaning.",
      trace: [
        {
          from: "C",
          to: "E",
          color: "violet",
          text: "Each chunk is embedded.",
        },
      ],
    },
    {
      short: "Store",
      type: "BUILD",
      adds: "Vector store",
      addsColor: "blue",
      newNodes: ["V"],
      title: "Save them in a vector store",
      body: [
        "The embeddings are saved in a vector store, each with the chunk it came from.",
        "A vector store’s job is one question: which saved vectors are closest to this one?",
      ],
      callout: {
        kind: "watch",
        text: "Embed questions and documents with the same model, or one its maker says is compatible. Otherwise the numbers don’t compare.",
      },
      metrics: ["4 / 9", "indexed", "—", "—"],
      facts: ["fdn-same-embedding-model"],
      caption: "The embeddings are saved in a vector store.",
      trace: [
        {
          from: "E",
          to: "V",
          color: "violet",
          text: "Vectors are saved with their chunks.",
        },
      ],
    },
    {
      short: "Question",
      type: "BUILD",
      adds: "Question",
      addsColor: "text",
      newNodes: ["Q"],
      title: "Embed the question the same way",
      body: [
        "A question arrives in plain words and is embedded with the same model, so it lands near the chunks that mean something similar.",
      ],
      callout: {
        kind: "key",
        text: "Search by meaning finds a chunk about “refunds” when someone asks about “getting my money back”.",
      },
      metrics: ["5 / 9", "indexed", "searching", "—"],
      facts: ["fdn-same-embedding-model"],
      caption:
        "A question arrives and is turned into an embedding the same way.",
      trace: [
        {
          from: "Q",
          to: "V",
          color: "cyan",
          text: "The question, as a vector, goes to the store.",
        },
      ],
    },
    {
      short: "Retrieve",
      type: "MEASURE",
      adds: "Top chunks",
      addsColor: "cyan",
      newNodes: ["K"],
      title: "Return the closest chunks",
      body: [
        "The store returns the few chunks whose embeddings sit closest to the question’s. These are what the model will read.",
        "Retrieval can miss. Anthropic reports that adding context to each chunk, for both embedding search and keyword (BM25) search, cut failed retrievals by 49%, and by 67% with reranking.",
      ],
      callout: {
        kind: "watch",
        text: "If the right chunk isn’t retrieved, the model can’t answer from it, however good the model is.",
      },
      metrics: ["6 / 9", "indexed", "top matches", "—"],
      facts: ["fdn-contextual-retrieval"],
      caption:
        "The store returns the chunks closest in meaning to the question.",
      trace: [
        {
          from: "Q",
          to: "V",
          color: "cyan",
          text: "The question goes to the store.",
        },
        {
          from: "V",
          to: "K",
          color: "cyan",
          text: "The closest matches come back.",
        },
      ],
    },
    {
      short: "Prompt",
      type: "BUILD",
      adds: "Prompt",
      addsColor: "amber",
      newNodes: ["P"],
      title: "Put the chunks in the prompt",
      body: [
        "The retrieved chunks go into the prompt beside the question, with an instruction to answer only from them.",
        "Anthropic’s guide to reducing hallucinations suggests exactly that: restrict the model to the documents you provide, and let it say it doesn’t know.",
      ],
      callout: {
        kind: "key",
        text: "“Answer only from these passages, and say if they don’t cover it” is a design decision, not a nicety.",
      },
      metrics: ["7 / 9", "indexed", "in the prompt", "—"],
      facts: ["fdn-reduce-hallucinations"],
      caption: "Those chunks go into the prompt, next to the question.",
      trace: [
        {
          from: "K",
          to: "P",
          color: "amber",
          text: "The retrieved text goes into the prompt.",
        },
        {
          from: "Q",
          to: "P",
          color: "amber",
          text: "The question goes in beside it.",
        },
      ],
    },
    {
      short: "Answer",
      type: "BUILD",
      adds: "Model and answer",
      addsColor: "green",
      newNodes: ["M", "A"],
      title: "Answer from the chunks, with citations",
      body: [
        "The model writes its answer from the chunks in its prompt. With Claude’s citations, it returns the exact passages that support each claim.",
        "Grounding reduces mistakes but doesn’t remove them: the same guide says these techniques don’t eliminate hallucinations entirely.",
      ],
      callout: {
        kind: "interview",
        text: "Where can RAG still go wrong? The wrong chunks come back, the right chunk is missed, or the answer misreads the right chunk.",
      },
      metrics: ["9 / 9", "indexed", "in the prompt", "with citations"],
      facts: ["fdn-citations", "fdn-reduce-hallucinations"],
      caption:
        "The model answers from those chunks and, with citations turned on, points to the passages it used, but it can still get a fact wrong.",
      trace: [
        {
          from: "P",
          to: "M",
          color: "violet",
          text: "The question and chunks go to the model.",
        },
        {
          from: "M",
          to: "A",
          color: "green",
          text: "The answer comes back, with its sources.",
        },
      ],
    },
  ],
} satisfies Lesson;
