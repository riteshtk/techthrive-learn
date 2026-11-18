// Review cards for the AI agents topic (spec 05 §8, PRD P14). Card ids key
// learners' stored schedules: never change one once merged.
import type { Cards } from "../../../types";

export default {
  kind: "cards",
  topic: "ai-agents",
  cards: [
    {
      id: "sonnet-cache-hit",
      area: "Cost",
      source: "Anthropic pricing",
      q: "On Sonnet 5.5, what does a prompt-cache hit cost compared with normal input?",
      a: "5%: $0.10 against $2 per million tokens. A 5-minute cache write costs 1.25×, so it pays back after one read.",
      facts: [
        "sonnet-5-5-cache-hit-price",
        "sonnet-5-5-input-output-price",
        "sonnet-5-5-cache-write-5m-price",
      ],
    },
    {
      id: "uploaded-file-goal-hijack",
      area: "Security",
      source: "OWASP Agentic Top 10 2026",
      q: "An uploaded file tells the agent to change what it is doing. Which risk is that?",
      a: "ASI01 Agent Goal Hijack, the agentic cousin of LLM01 Prompt Injection. Bound the damage with a policy check on every write tool.",
      facts: ["owasp-asi01-goal-hijack", "owasp-llm01-2026-prompt-injection"],
    },
    {
      id: "pass-hat-4-example",
      area: "Evals",
      source: "τ-bench",
      q: "8 runs, 6 passed. What is pass^4?",
      a: "C(6,4) ÷ C(8,4) = 15 ÷ 70 ≈ 0.21. pass@4 is 1.0 for the same runs: consistency, not capability.",
      facts: ["pass-hat-k-worked-example", "tau-bench-pass-hat-k"],
    },
    {
      id: "mcp-stateless",
      area: "Protocol",
      source: "MCP spec 2026-07-28",
      q: "What did MCP 2026-07-28 remove that makes servers easy to load-balance?",
      a: "Protocol-level sessions: no initialize handshake and no Mcp-Session-Id. Version and capabilities ride in every request’s _meta.",
      facts: [
        "mcp-2026-stateless",
        "mcp-2026-no-initialize",
        "mcp-2026-no-session-id",
        "mcp-2026-version-in-meta",
      ],
    },
  ],
} satisfies Cards & { kind: "cards" };
