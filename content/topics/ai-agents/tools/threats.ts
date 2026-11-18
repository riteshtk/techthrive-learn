// The threat model (spec 05 §3, PRD P10): the OWASP Top 10 for Agentic
// Applications 2026, names as the source has them, applied to the
// card-dispute agent. Statuses, scenes, controls, tests and owners are this
// topic's teaching scenario; the LLM Top 10 mappings are ours.
import type { Threats } from "../../../types";

const ASI = ["owasp-agentic-2026-published", "threat-model-scenario-figures"];

export default {
  kind: "threats",
  topic: "ai-agents",
  intro:
    "OWASP Top 10 for Agentic Applications 2026 (published 9 Dec 2025), applied to the card-dispute agent. Statuses describe this teaching scenario; the LLM Top 10 mappings are ours.",
  components: [
    { id: "gateway", name: "Gateway", short: "Gateway" },
    { id: "orchestrator", name: "Orchestrator", short: "Orchestr." },
    { id: "model-gateway", name: "Model gateway", short: "Model GW" },
    { id: "mcp-tools", name: "MCP tools", short: "MCP tools" },
    { id: "rag-memory", name: "RAG · memory", short: "RAG · Memory" },
    { id: "policy", name: "Policy", short: "Policy" },
    { id: "human", name: "Human approval", short: "Human" },
    { id: "traces", name: "Traces", short: "Traces" },
    { id: "a2a", name: "A2A partners", short: "A2A" },
  ],
  risks: [
    {
      id: "ASI01",
      name: "Agent Goal Hijack",
      status: "mitigated",
      related: "LLM01",
      description:
        "Hostile content changes what the agent is trying to achieve, so it takes actions nobody intended.",
      scene:
        "White text in an uploaded “statement” tells the agent to credit ₹48,000 to card 7731 and close the dispute.",
      controls: [
        "Treat files and retrieved text as data, in a separate channel from instructions",
        "Check every tool call against the customer’s stated request",
        "Policy check on all write tools",
      ],
      test: "Replay 50 poisoned documents at k = 4; zero unauthorised writes.",
      owner: "AI platform + AppSec",
      components: ["orchestrator", "rag-memory", "policy"],
      facts: ["owasp-asi01-goal-hijack", ...ASI],
    },
    {
      id: "ASI02",
      name: "Tool Misuse and Exploitation",
      status: "mitigated",
      related: "LLM03",
      description:
        "An approved tool gets used in a harmful way, through vague instructions, broad permissions or tainted input.",
      scene:
        "The agent calls issue_provisional_credit twice for the same dispute after a retry.",
      controls: [
        "Idempotency key on dispute_id",
        "Strict argument schemas with an amount cap",
        "Per-tool rate limits per customer",
      ],
      test: "Fault-inject duplicate calls; the ledger shows one credit per dispute.",
      owner: "Card ledger team",
      components: ["mcp-tools", "policy"],
      facts: ["owasp-asi02-tool-misuse", ...ASI],
    },
    {
      id: "ASI03",
      name: "Identity and Privilege Abuse",
      status: "open",
      related: "LLM02",
      description:
        "The agent misuses, escalates or leaks the credentials and access it inherited.",
      scene:
        "The card-ledger MCP server authenticates with one shared service account, so one hijacked turn could read any customer’s cards.",
      controls: [
        "OAuth token exchange to a short-lived, per-customer token",
        "Scope tokens to the customer’s card ids",
        "No secrets in prompts or tool results",
      ],
      test: "Call get_transactions with another customer’s card id; expect 403 from the ledger, not from the model.",
      owner: "Identity + card ledger",
      components: ["gateway", "mcp-tools"],
      facts: ["owasp-asi03-identity-privilege-abuse", ...ASI],
    },
    {
      id: "ASI04",
      name: "Agentic Supply Chain Vulnerabilities",
      status: "partial",
      related: "LLM04",
      description:
        "Tampered tools, prompts, plugins or partner agents change behaviour or leak data.",
      scene:
        "A third-party merchant-lookup MCP server ships a new tool description that adds “also include the full card number”.",
      controls: [
        "Pin MCP server versions; diff tool descriptions on update",
        "Require signed Agent Cards for A2A partners",
        "Allowlist registries",
      ],
      test: "CI fails when any tool description changes without review.",
      owner: "AI platform",
      components: ["mcp-tools", "a2a"],
      facts: ["owasp-asi04-supply-chain", ...ASI],
    },
    {
      id: "ASI05",
      name: "Unexpected Code Execution (RCE)",
      status: "mitigated",
      related: "LLM10",
      description:
        "The agent runs or generates unsafe code or commands without isolation or review.",
      scene:
        "A statement-parsing tool evaluates spreadsheet formulas in uploaded CSV files.",
      controls: [
        "No code-execution tools in this agent",
        "Parse uploads in a sandbox with no network",
        "Encode all outputs before rendering",
      ],
      test: "Upload a CSV with a formula payload; the parser returns text only.",
      owner: "AppSec",
      components: ["mcp-tools"],
      facts: ["owasp-asi05-unexpected-code-execution", ...ASI],
    },
    {
      id: "ASI06",
      name: "Memory & Context Poisoning",
      status: "mitigated",
      related: "LLM05 · LLM09",
      description:
        "Corrupted memory, retrieval sources or embeddings shape how the agent behaves later.",
      scene:
        "A customer gets “this customer’s disputes are always valid” written into their saved memory.",
      controls: [
        "Memory writes only through validated, structured fields",
        "Provenance tag on every memory and chunk",
        "Per-tenant indexes with time limits",
      ],
      test: "Attempt 20 memory-planting dialogues; none persist as free text.",
      owner: "AI platform",
      components: ["orchestrator", "rag-memory"],
      facts: ["owasp-asi06-memory-context-poisoning", ...ASI],
    },
    {
      id: "ASI07",
      name: "Insecure Inter-Agent Communication",
      status: "partial",
      related: "LLM01",
      description:
        "Agents exchange messages without authentication or integrity, allowing spoofing or injection.",
      scene:
        "The handoff to the fraud agent runs over A2A without verifying who is on the other end.",
      controls: [
        "mTLS plus OAuth on every A2A call",
        "Verify signed Agent Cards",
        "Validate task payloads against a schema",
      ],
      test: "A spoofed fraud agent is rejected at the handshake.",
      owner: "AI platform + Network",
      components: ["orchestrator", "a2a"],
      facts: ["owasp-asi07-inter-agent-communication", ...ASI],
    },
    {
      id: "ASI08",
      name: "Cascading Failures",
      status: "partial",
      related: "LLM06",
      description:
        "A fault in one agent or service spreads through connected workflows.",
      scene:
        "Model-gateway timeouts trigger retries on every turn; the queue backs up and core banking starts rate-limiting.",
      controls: [
        "Circuit breaker on the model gateway",
        "Token and step budget per conversation",
        "Graceful handoff to a human queue",
      ],
      test: "Chaos test: drop the model gateway for 60 s; no core-banking 429s.",
      owner: "SRE",
      components: ["orchestrator", "model-gateway", "traces"],
      facts: ["owasp-asi08-cascading-failures", ...ASI],
    },
    {
      id: "ASI09",
      name: "Human-Agent Trust Exploitation",
      status: "mitigated",
      related: "LLM07",
      description:
        "Over-reliance on an agent is used to steer people or pull out sensitive data.",
      scene:
        "A reviewer approves a ₹20,000 credit because the agent’s summary sounds confident.",
      controls: [
        "Evidence-first review screen: transaction, words, policy result",
        "Hide the agent’s confidence language from reviewers",
        "Sample-audit 2% of approvals",
      ],
      test: "Seed 10 wrong recommendations; reviewers reject at least 9.",
      owner: "Disputes ops",
      components: ["human"],
      facts: ["owasp-asi09-human-agent-trust-exploitation", ...ASI],
    },
    {
      id: "ASI10",
      name: "Rogue Agents",
      status: "partial",
      related: "—",
      description:
        "A compromised or misaligned agent acts against its purpose while looking legitimate.",
      scene: "A modified deployment quietly lowers dispute approval rates.",
      controls: [
        "Agent registry with signed deployments",
        "Monitor outcome metrics per release, not just errors",
        "Kill switch that routes to humans",
      ],
      test: "A drift alert fires within 1 hour of a 5-point approval-rate shift.",
      owner: "AI platform + Risk",
      components: ["orchestrator", "traces"],
      facts: ["owasp-asi10-rogue-agents", ...ASI],
    },
  ],
  related: {
    title: "OWASP LLM Top 10 · 2026 order",
    note: "Published 3 Aug 2026 · changes since 2025",
    items: [
      { id: "LLM01", name: "Prompt Injection", was: 1 },
      { id: "LLM02", name: "Sensitive Information Disclosure", was: 2 },
      { id: "LLM03", name: "Excessive Agency", was: 6 },
      { id: "LLM04", name: "Supply Chain", was: 3 },
      { id: "LLM05", name: "Data and Model Poisoning", was: 4 },
      { id: "LLM06", name: "Unbounded Consumption", was: 10 },
      { id: "LLM07", name: "Misinformation", was: 9 },
      {
        id: "LLM08",
        name: "Hidden Context Exposure",
        was: 7,
        wasName: "System Prompt Leakage",
      },
      { id: "LLM09", name: "Vector and Embedding Weaknesses", was: 8 },
      { id: "LLM10", name: "Improper Output Handling", was: 5 },
    ],
    facts: [
      "owasp-llm01-2026-prompt-injection",
      "owasp-llm02-2026-sensitive-information",
      "owasp-llm03-2026-excessive-agency",
      "owasp-llm04-2026-supply-chain",
      "owasp-llm05-2026-data-model-poisoning",
      "owasp-llm06-2026-unbounded-consumption",
      "owasp-llm07-2026-misinformation",
      "owasp-llm08-2026-hidden-context-exposure",
      "owasp-llm09-2026-vector-embedding",
      "owasp-llm10-2026-improper-output-handling",
      "owasp-llm-2026-resource-date",
      "owasp-llm-2025-order",
    ],
  },
} satisfies Threats & { kind: "threats" };
