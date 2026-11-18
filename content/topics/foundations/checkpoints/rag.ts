// The checkpoint for "RAG: answers from your documents" (PRD P17), written
// from the lesson and its sources. Not approved until a fresh reviewer and
// the creator have checked it.
import type { Checkpoint } from "../../../types";

export default {
  lesson: "rag",
  topic: "foundations",
  approved: false,
  questions: [
    {
      id: "missing-chunk",
      prompt:
        "Your help centre has a page on refunds, but the assistant says it doesn’t know your refund policy. What most likely went wrong?",
      tags: ["RETRIEVAL"],
      options: [
        {
          id: "A",
          text: "The refund chunk wasn’t among the chunks retrieved for the question.",
          verdict: "right",
          why: "Right. If the right chunk isn’t retrieved, the model can’t answer from it.",
        },
        {
          id: "B",
          text: "The model needs retraining on the help centre.",
          verdict: "wrong",
          why: "RAG doesn’t retrain the model; it changes what the model reads.",
        },
        {
          id: "C",
          text: "The prompt told the model it could say it doesn’t know.",
          verdict: "partial",
          why: "That instruction is good practice; it’s why the model said so instead of guessing. The cause is upstream, in retrieval.",
        },
        {
          id: "D",
          text: "The vector store lost the documents.",
          verdict: "wrong",
          why: "Possible, but the likelier cause is that search didn’t rank the refund chunk near the question.",
        },
      ],
      resultHeading: {
        right: "Right. Retrieval missed it.",
        other: "Not quite. The right chunk wasn’t retrieved.",
      },
      explanation: [
        "The model only sees the chunks retrieved for the question. Anthropic reports that adding context to each chunk, for both embedding search and keyword (BM25) search, cut failed retrievals by 49%, and by 67% with reranking.",
      ],
      replayStep: 5,
      facts: ["fdn-contextual-retrieval"],
      reviewCard:
        "If the right chunk isn’t retrieved, the model can’t answer from it.",
    },
    {
      id: "same-embedding-model",
      prompt:
        "You embed your documents with one model and your users’ questions with an unrelated one. What happens?",
      tags: ["EMBEDDINGS"],
      options: [
        {
          id: "A",
          text: "Search breaks down: the two sets of numbers don’t compare.",
          verdict: "right",
          why: "Right. Queries and documents need the same model, or one its maker says is compatible.",
        },
        {
          id: "B",
          text: "Nothing: an embedding is an embedding.",
          verdict: "wrong",
          why: "Different models place meanings differently, so distances between them mean little.",
        },
        {
          id: "C",
          text: "It works if both vectors have the same length.",
          verdict: "partial",
          why: "Matching length lets the maths run, but the numbers still don’t mean the same things.",
        },
        {
          id: "D",
          text: "The model refuses to answer.",
          verdict: "wrong",
          why: "The model isn’t what compares the vectors. If the lengths match, nothing errors and search just returns poor matches.",
        },
      ],
      resultHeading: {
        right: "Right. Same, or compatible, models.",
        other: "Not quite. The numbers don’t compare.",
      },
      explanation: [
        "Embeddings are numerical representations of text for measuring similarity. Embed questions and documents with the same model, or one its maker says is compatible, so close numbers mean close meanings.",
      ],
      replayStep: 3,
      facts: ["fdn-embeddings", "fdn-same-embedding-model"],
      reviewCard:
        "Embed questions and documents with the same, or a compatible, model.",
    },
    {
      id: "grounded-still-wrong",
      prompt:
        "The answer cites the exact passages it used. Can it still be wrong?",
      tags: ["CITATIONS", "HALLUCINATIONS"],
      options: [
        {
          id: "A",
          text: "Yes. Grounding reduces mistakes but doesn’t eliminate them.",
          verdict: "right",
          why: "Right. Anthropic’s guide says these techniques reduce hallucinations but don’t eliminate them entirely.",
        },
        {
          id: "B",
          text: "No. A cited answer is correct by definition.",
          verdict: "wrong",
          why: "Citations show where an answer came from; the model can still misread the passage.",
        },
        {
          id: "C",
          text: "Only if the documents themselves are wrong.",
          verdict: "partial",
          why: "That’s one way, but the model can also misread correct passages.",
        },
        {
          id: "D",
          text: "No, if the prompt says to answer only from the documents.",
          verdict: "wrong",
          why: "That instruction helps a lot, but the guide says it doesn’t make mistakes impossible.",
        },
      ],
      resultHeading: {
        right: "Right. Grounded, not guaranteed.",
        other: "Not quite. It can still be wrong.",
      },
      explanation: [
        "Citations return the exact passages that support each claim, which makes answers checkable. Restricting the model to your documents and letting it say it doesn’t know reduces hallucinations, but doesn’t eliminate them.",
      ],
      replayStep: 7,
      facts: ["fdn-citations", "fdn-reduce-hallucinations"],
      reviewCard: "Citations make answers checkable, not guaranteed.",
    },
  ],
} satisfies Checkpoint;
