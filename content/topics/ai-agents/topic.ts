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
      ctaName: "agent anatomy",
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
  overview: {
    layout: "grid",
    heroTitle: "Production AI agents for enterprise.",
    promise:
      "Demos are easy. Production means identity, least privilege, evals you can trust, traces an auditor can read, and a bill you can predict. This topic builds all of it around one real system: a card-dispute agent for a bank.",
    diagram: "card-dispute-agent",
    heroTrace: [
      { from: "U", to: "G", color: "cyan" },
      { from: "G", to: "O", color: "cyan" },
      { from: "O", to: "M", color: "violet" },
      { from: "M", to: "O", color: "violet" },
      { from: "O", to: "P", color: "amber" },
      { from: "P", to: "O", color: "amber" },
      { from: "O", to: "T", color: "green" },
      { from: "T", to: "D", color: "blue" },
    ],
    secondary: { label: "Open the cost model", tab: "cost", icon: "bar-chart" },
    highlights: [
      { icon: "check", text: "Every figure sourced and dated" },
      { icon: "shield", text: "OWASP 2026 lists built in" },
      { icon: "globe", text: "India, EU and UK rules" },
    ],
    why: {
      label: "Why this topic exists",
      headline:
        "Agents rarely fail on the model. They fail on reliability, risk controls and the rules that apply.",
      stats: [
        {
          value: "60% → <25%",
          claim:
            "The best agent in τ-bench succeeds on over 60% of tasks once, but on fewer than 25% when it must succeed in all 8 tries. One run is not reliability.",
          facts: [
            "tau-bench-gpt4o-retail-pass8",
            "tau-bench-gpt4o-retail-pass1",
            "reliabilitybench-pass1-vs-consistency",
          ],
        },
        {
          value: "12",
          claim:
            "risks that NIST’s Generative AI Profile lists as unique to, or made worse by, generative AI.",
          facts: ["nist-ai-600-1-twelve-risks", "nist-ai-600-1-published"],
        },
        {
          value: "26",
          claim:
            "recommendations in the RBI’s FREE-AI framework for AI in Indian finance, under 7 Sutras and 6 pillars.",
          facts: [
            "rbi-free-ai-26-recommendations",
            "rbi-free-ai-seven-sutras",
            "rbi-free-ai-six-pillars",
          ],
        },
        {
          value: "2 Dec 2027",
          claim:
            "EU AI Act high-risk duties for Annex III systems, which include credit scoring, after the Digital Omnibus delay.",
          facts: ["annex-iii-high-risk-date", "digital-omnibus-in-force"],
        },
      ],
    },
    brief: {
      label: "The brief you’ll design against",
      title: "A card-dispute agent for a retail bank",
      body: "Customers say “I don’t recognise this charge”. The agent finds the transaction, explains it, opens a dispute, and can issue a provisional credit. It must never move money it shouldn’t.",
      items: [
        { k: "Volume", v: "20,000 conversations a day, about 6 turns each" },
        {
          k: "Autonomy",
          v: "Credits up to ₹5,000 automatic; above that, a human approves",
        },
        { k: "Systems", v: "Core banking, card ledger, CRM, policy docs" },
        {
          k: "Rules",
          v: "DPDP Act and the RBI FREE-AI framework; the EU AI Act and PRA SS1/23 if operating there",
        },
      ],
      note: "Volume, thresholds, systems and which rules apply are this topic’s teaching assumptions, not any real bank’s.",
      facts: ["conversations-per-day", "credit-auto-limit"],
    },
    currentWith: [
      {
        name: "Model Context Protocol",
        value: "spec 2026-07-28",
        facts: ["mcp-current-version"],
      },
      {
        name: "Agent2Agent (A2A)",
        value: "v1.0 · Mar 2026",
        facts: ["a2a-version"],
      },
      {
        name: "OWASP Top 10 for LLM Apps",
        value: "2026 list",
        facts: ["owasp-llm-2026-published"],
      },
      {
        name: "OWASP Top 10 for Agentic Apps",
        value: "2026 · 9 Dec 2025",
        facts: ["owasp-agentic-2026-published"],
      },
      {
        name: "OpenTelemetry GenAI conventions",
        value: "agent + tool spans",
        facts: ["otel-genai-operations"],
      },
      {
        name: "NIST AI 600-1 GenAI Profile",
        value: "Jul 2024 · 12 risks",
        facts: ["nist-ai-600-1-published", "nist-ai-600-1-twelve-risks"],
      },
      {
        name: "EU AI Act + Digital Omnibus",
        value: "in force 27 Jul 2026",
        facts: ["digital-omnibus-in-force"],
      },
      {
        name: "RBI FREE-AI",
        value: "13 Aug 2025 · 26 recs",
        facts: ["rbi-free-ai-released", "rbi-free-ai-26-recommendations"],
      },
      {
        name: "DPDP Rules 2025",
        value: "main duties about May 2027",
        facts: ["dpdp-rules-main-duties-18-months", "dpdp-rules-notified"],
      },
      {
        name: "PRA SS1/23 model risk",
        value: "since 17 May 2024",
        facts: ["pra-ss1-23-effective", "pra-ss1-23-revised"],
      },
      {
        name: "Claude API pricing",
        value: "read 18 Nov 2026",
        facts: ["sonnet-5-5-input-output-price"],
      },
    ],
    lessonsHeadline: "From “should this be an agent?” to the invoice.",
    outcomesLabel: "You’ll leave able to",
    outcomes: [
      "Decide workflow vs agent, and defend it",
      "Draw the 9-part reference architecture from memory",
      "Map every component to OWASP ASI risks and controls",
      "Cost a design per conversation with Claude’s current prices",
      "Name the rules that apply, and the dates",
    ],
    prerequisites: {
      items: [
        "Scaling: caching and queues",
        "Reliability: timeouts, retries, observability",
        "AI systems: RAG and tool calls",
      ],
    },
    footer: {
      line: "Now go build something.",
      disclaimer:
        "Not legal advice. Regulations are summarised for engineering design; check the primary texts and your counsel before relying on a date or duty.",
    },
  },
} satisfies Topic;
