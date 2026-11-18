import type { Topic } from "../../types";

// The course outline from spec 03 §8.2, with the PRD's corrections: lesson
// 2 names the nine parts its diagram adds, "τ-BENCH" uses a lowercase tau,
// and nothing says "live" pricing.
export default {
  id: "ai-agents",
  title: "Production AI agents for enterprise",
  switcherLabel: "Production AI agents",
  level: "advanced",
  status: "live",
  summary:
    "Build a card-dispute agent a bank could run: identity, least privilege, evals you can trust, traces an auditor can read, and a bill you can predict.",
  domain: "AI systems",
  system: "Card-dispute agent",
  tags: ["MCP", "OWASP", "Evals", "Tracing", "Cost"],
  tabs: [
    "overview",
    "lessons",
    "cost",
    "threats",
    "governance",
    "lab",
    "sheets",
  ],
  lessons: [
    {
      id: "workflow-or-agent",
      title: "Workflow or agent? Pick the simplest thing that works",
      minutes: 9,
      cardRef: "ANTHROPIC · BUILDING EFFECTIVE AGENTS",
      summary:
        "Anthropic separates workflows (fixed code paths) from agents (the model directs its own steps). Most enterprise wins are workflows. Learn the five patterns and a test for when autonomy pays.",
      tags: ["BUILDING EFFECTIVE AGENTS"],
      then: "route 3 sample requests",
    },
    {
      id: "agent-anatomy",
      title: "Anatomy of a production agent",
      minutes: 16,
      cardRef: "9 COMPONENTS · INTERACTIVE",
      summary:
        "Nine components around one card-dispute flow: gateway with delegated identity, orchestrator, model gateway, MCP tools, retrieval, policy, human approval, evals and traces. Each step shows what breaks without it.",
      tags: ["INTERACTIVE", "SANDBOX"],
      then: "checkpoint",
    },
    {
      id: "tools-over-mcp",
      title: "Tools over MCP: stateless servers, auth, least privilege",
      minutes: 14,
      cardRef: "MCP 2026-07-28",
      summary:
        "The 2026-07-28 spec drops sessions and the initialize handshake, so servers scale behind plain load balancers. Scope each tool to the user’s delegated token, never a shared service account.",
      tags: ["MCP 2026-07-28", "OAUTH"],
      then: "write a tool manifest",
    },
    {
      id: "agents-talking-to-agents",
      title: "Agents talking to agents",
      minutes: 11,
      cardRef: "A2A v1.0 · AGENT CARDS",
      summary:
        "When the dispute agent hands off to a fraud agent, A2A v1.0 carries the task. Agent Cards advertise skills and auth; signed cards stop impersonation.",
      tags: ["A2A v1.0", "ASI07"],
      then: "read a real Agent Card",
    },
    {
      id: "memory-and-retrieval",
      title: "Memory and retrieval without poisoning",
      minutes: 13,
      cardRef: "ASI06 · LLM09:2026",
      summary:
        "Retrieved text and saved memories steer future turns. Tag provenance, gate memory writes, and keep per-tenant indexes so one customer can’t shape another’s answers.",
      tags: ["ASI06", "LLM09:2026"],
      then: "poison-test a memory",
    },
    {
      id: "guardrails-owasp",
      title: "Guardrails, mapped to the OWASP lists",
      minutes: 15,
      cardRef: "LLM 2026 · AGENTIC 2026",
      summary:
        "Prompt injection is still LLM01 in 2026, and Excessive Agency jumped to LLM03. Build least agency into tool scopes, argument validation and policy checks, not just prompts.",
      tags: ["LLM 2026", "AGENTIC 2026"],
      then: "threat-model the agent",
    },
    {
      id: "humans-in-the-loop",
      title: "Humans in the loop for irreversible actions",
      minutes: 10,
      cardRef: "APPROVAL THRESHOLDS",
      summary:
        "Approval thresholds, what the reviewer sees, and how to stop rubber-stamping. Covers human oversight duties for high-risk systems and ASI09 trust exploitation.",
      tags: ["EU AI ACT ART. 14", "ASI09"],
    },
    {
      id: "evals-pass-k",
      title: "Evals that predict production: pass^k",
      minutes: 14,
      cardRef: "τ-BENCH",
      summary:
        "pass@k asks if the agent can ever succeed; pass^k asks if it succeeds every time. Build a golden set, run k trials, and gate releases on the floor, not the ceiling.",
      tags: ["τ-BENCH", "CI GATES"],
      then: "compute pass^4",
    },
    {
      id: "tracing-with-opentelemetry",
      title: "Tracing agents with OpenTelemetry",
      minutes: 12,
      cardRef: "GEN_AI.* SPANS",
      summary:
        "One trace per conversation: invoke_agent at the top, chat and execute_tool spans underneath, token usage including cache reads. MCP now carries traceparent in _meta.",
      tags: ["GEN_AI.* SPANS", "MCP _META"],
      then: "read a trace",
    },
    {
      id: "cost-latency-capacity",
      title: "Cost, latency and capacity",
      minutes: 15,
      cardRef: "CACHING · BATCH · ROUTING",
      summary:
        "Price a conversation with real rates: cached prefixes at 5% on Sonnet 5.5, Batch at half price, routing easy turns to Haiku 5.5. Then size the rate limits.",
      tags: ["CLAUDE PRICES", "ROUTING"],
      then: "cost model",
    },
  ],
} satisfies Topic;
