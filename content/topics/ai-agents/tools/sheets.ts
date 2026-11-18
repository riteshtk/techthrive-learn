// Cheatsheets (spec 05 §7, PRD P13): the topic on one printable page.
// Prices, the two OWASP lists and the dates are drawn from the rate card,
// the threat model and the governance timeline; the rest is re-read from
// its sources (18 Nov 2026).
import type { Sheets } from "../../../types";

const PRICES = [
  "fable-5-2-input-output-price",
  "fable-5-2-cache-prices",
  "opus-5-5-input-output-price",
  "opus-5-5-cache-prices",
  "sonnet-5-5-input-output-price",
  "sonnet-5-5-cache-hit-price",
  "sonnet-5-5-cache-write-5m-price",
  "haiku-5-5-input-output-price",
  "haiku-5-5-cache-hit-price",
  "haiku-5-5-cache-write-5m-price",
  "haiku-5-5-long-context-tier",
  "haiku-5-5-long-context-cache-prices",
  "batch-api-discount",
];

export default {
  kind: "sheets",
  topic: "ai-agents",
  title: "Production agents, on one page",
  intro: "Every row comes from a source on the Sources page.",
  sheets: [
    {
      label: "Prices · USD per million tokens",
      title: "Claude API, first-party",
      body: { type: "prices" },
      caption:
        "Batch is half the input and output price. Haiku 5.5’s tier is set by the whole prompt, cache reads and writes included.",
      facts: PRICES,
    },
    {
      label: "Cost levers",
      title: "What moves the bill",
      body: {
        type: "kv",
        rows: [
          { k: "Cache hit, Opus 5.5 and Sonnet 5.5", v: "0.05× input" },
          { k: "Cache hit, Fable 5.2", v: "0.025× input" },
          { k: "Cache hit, Haiku 5.5", v: "0.1× input" },
          { k: "Cache write, 5 minutes · 1 hour", v: "1.25× · 2×" },
          {
            k: "Caching pays back after (5 min · 1 hour)",
            v: "1 read · 2 reads",
          },
          { k: "Batch API, stacks with caching", v: "50% off" },
          { k: "US-only inference", v: "1.1×" },
          { k: "Tool-use system prompt, 5.5 models", v: "286 tokens" },
          { k: "Web search tool", v: "$10 / 1,000 searches" },
        ],
      },
      facts: [
        "sonnet-5-5-cache-hit-price",
        "opus-5-5-cache-prices",
        "fable-5-2-cache-prices",
        "haiku-5-5-cache-hit-price",
        "sonnet-5-5-cache-write-5m-price",
        "sonnet-5-5-cache-write-1h-price",
        "batch-api-discount",
        "discounts-stack",
        "us-only-inference-multiplier",
        "tool-use-overhead-tokens",
        "web-search-price",
      ],
    },
    {
      label: "Security · 9 Dec 2025",
      title: "OWASP Agentic Top 10 2026",
      body: { type: "risks", list: "threats" },
      caption:
        "Core idea: least agency. Every capability the agent doesn’t need is attack surface.",
      facts: ["owasp-agentic-2026-published"],
    },
    {
      label: "Security · 3 Aug 2026",
      title: "OWASP LLM Top 10 2026",
      body: { type: "risks", list: "related" },
      facts: ["owasp-llm-2026-resource-date", "owasp-llm-2025-order"],
    },
    {
      label: "Protocol · spec 2026-07-28",
      title: "MCP: what changed",
      body: {
        type: "kv",
        rows: [
          { k: "Sessions and Mcp-Session-Id", v: "removed · stateless" },
          { k: "initialize handshake", v: "removed" },
          { k: "Version and capabilities", v: "in each request’s _meta" },
          { k: "Capability discovery", v: "server/discover" },
          { k: "Server asks the client for input", v: "MRTR · input_required" },
          { k: "Change notifications", v: "subscriptions/listen" },
          { k: "Tracing", v: "traceparent in _meta" },
          { k: "Tasks", v: "moved to an extension" },
          { k: "Deprecated", v: "Roots · Sampling · Logging · HTTP+SSE" },
          { k: "Client registration", v: "Client ID Metadata Documents" },
        ],
        aside:
          "Dynamic Client Registration is deprecated but still available for backwards compatibility.",
      },
      caption:
        "Servers should return tools/list in a deterministic order, which helps prompt-cache hits.",
      facts: [
        "mcp-current-version",
        "mcp-2026-stateless",
        "mcp-2026-no-session-id",
        "mcp-2026-no-initialize",
        "mcp-2026-version-in-meta",
        "mcp-2026-server-discover",
        "mcp-2026-mrtr",
        "mcp-2026-subscriptions-listen",
        "mcp-2026-traceparent-in-meta",
        "mcp-2026-tasks-extension",
        "mcp-2026-deprecations",
        "mcp-2026-dcr-deprecated",
        "mcp-2026-tools-list-order",
      ],
    },
    {
      label: "Protocol · A2A v1.0",
      title: "Agent2Agent",
      body: {
        type: "kv",
        rows: [
          { k: "Discovery", v: "/.well-known/agent-card.json" },
          { k: "Bindings", v: "JSON-RPC · gRPC · HTTP+JSON/REST" },
          { k: "Core operations", v: "SendMessage · GetTask · CancelTask" },
          { k: "Trust", v: "signed Agent Cards (JWS)" },
          { k: "Current release", v: "v1.0.1 · v1.1.0-rc tagged" },
          { k: "Home", v: "Agentic AI Foundation, with MCP" },
        ],
        aside:
          "MCP connects an agent to tools. A2A connects an agent to another agent.",
      },
      facts: [
        "a2a-version",
        "a2a-agent-card-path",
        "a2a-bindings",
        "a2a-operations",
        "a2a-signed-cards",
        "a2a-v1-1-rc-tag",
        "a2a-aaif",
      ],
    },
    {
      label: "Observability",
      title: "OpenTelemetry GenAI attributes",
      body: {
        type: "code",
        code: "gen_ai.operation.name\n  invoke_agent · invoke_workflow · chat\n  execute_tool · retrieval · embeddings\ngen_ai.conversation.id\ngen_ai.request.model / response.model\ngen_ai.usage.input_tokens\ngen_ai.usage.output_tokens\ngen_ai.usage.cache_read.input_tokens\ngen_ai.usage.reasoning.output_tokens\ngen_ai.tool.name · gen_ai.tool.call.id",
      },
      caption:
        "Every GenAI convention, chat and embeddings included, is still at Development stability.",
      facts: [
        "otel-genai-operations",
        "otel-genai-operation-values",
        "otel-genai-conversation-id",
        "otel-genai-input-tokens",
        "otel-genai-cache-read-tokens",
        "otel-genai-attributes",
        "otel-genai-stability",
      ],
    },
    {
      label: "Evals · τ-bench",
      title: "pass@k vs pass^k",
      body: {
        type: "code",
        code: "pass@k = 1 − C(n−c, k) / C(n, k)   any success\npass^k =     C(c, k)   / C(n, k)   all succeed\n\nexample · n = 8 runs, c = 6 passed\npass@1 = 0.75\npass@4 = 1.00\npass^4 = 15 / 70 ≈ 0.21",
        text: "Same agent: at least one of any 4 tries succeeds, yet all 4 succeed only about a fifth of the time. Gate releases on pass^k.",
      },
      facts: ["tau-bench-pass-hat-k", "eval-pass-at-1", "eval-pass-hat-4"],
    },
    {
      label: "Patterns · Anthropic",
      title: "Workflows before agents",
      body: {
        type: "kv",
        rows: [
          { k: "Prompt chaining", v: "fixed steps, gates between" },
          { k: "Routing", v: "classify, then specialise" },
          { k: "Parallelization", v: "sectioning, or voting" },
          { k: "Orchestrator-workers", v: "plan, delegate, merge" },
          { k: "Evaluator-optimizer", v: "draft, critique, loop" },
          { k: "Agent", v: "the model directs its own steps" },
        ],
      },
      facts: ["anthropic-workflow-patterns", "workflows-vs-agents"],
    },
    {
      label: "Dates that matter",
      title: "Regulation clock",
      body: {
        type: "dates",
        picks: [
          { label: "UK PRA SS1/23 in force since", date: "2024-05-17" },
          { label: "EU Article 50 transparency", date: "2026-08-02" },
          { label: "EU new Article 5 bans", date: "2026-12-02" },
          { label: "India DPDP main duties", date: "2027-05-13" },
          { label: "EU high-risk, Annex III", date: "2027-12-02" },
          { label: "EU high-risk, Annex I", date: "2028-08-02" },
        ],
      },
      facts: [
        "pra-ss1-23-effective",
        "eu-ai-act-article-50-date",
        "digital-omnibus-new-bans",
        "dpdp-rules-main-duties-18-months",
        "annex-iii-high-risk-date",
        "annex-i-high-risk-date",
      ],
    },
  ],
  footer:
    "Not legal advice. Prices and specs change: every row is re-read from its source by its re-check date.",
} satisfies Sheets & { kind: "sheets" };
