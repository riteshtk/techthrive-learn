// v1's topic addresses: each is now a Foundations lesson (PRD P17). The
// ids stay reserved forever; they key stored progress.
export const MOVED: Record<string, { lesson: string; title: string }> = {
  "how-an-llm-answers": {
    lesson: "how-an-llm-answers",
    title: "How an LLM answers",
  },
  rag: { lesson: "rag", title: "RAG: answers from your documents" },
  "agent-loop": { lesson: "agent-loop", title: "The agent loop" },
};
