// The design lab, explore only (spec 05 §2, PRD P12): the card-dispute
// agent's reference architecture with a detail for each component. The
// editor and the AI design review are phase 2.
import type { Lab } from "../../../types";

export default {
  kind: "lab",
  topic: "ai-agents",
  title: "Card-dispute agent · reference architecture",
  goal: "Least agency, full traceability",
  intro:
    "The full design lesson 2 builds towards. Pick a component to see what it does here, how it is set up, and what to watch for.",
  diagram: "reference-architecture",
  trace: [
    { from: "W", to: "G", color: "cyan" },
    { from: "G", to: "O", color: "cyan" },
    { from: "O", to: "M", color: "violet" },
    { from: "M", to: "C", color: "violet" },
    { from: "O", to: "P", color: "amber" },
    { from: "O", to: "T", color: "green" },
    { from: "T", to: "D", color: "blue" },
  ],
  telemetry: ["X", "E", "A"],
  details: [
    {
      node: "W",
      role: "Where customers raise a dispute. It passes their signed-in session, never a card number, to the API gateway.",
      settings: [
        { k: "Channels", v: "web and mobile app" },
        { k: "Identity", v: "the customer’s session" },
      ],
      watch:
        "Uploaded statements and pasted text are untrusted data, not instructions.",
      risks: ["ASI01"],
      facts: ["owasp-asi01-goal-hijack"],
    },
    {
      node: "G",
      role: "Authenticates the customer and exchanges their session for a short-lived token scoped to their own cards.",
      settings: [
        { k: "Token", v: "per customer, short-lived" },
        { k: "Limits", v: "per-customer rate limit" },
      ],
      watch:
        "A shared service credential behind it would let one hijacked turn reach any customer’s cards.",
      risks: ["ASI03"],
      facts: ["owasp-asi03-identity-privilege-abuse"],
    },
    {
      node: "O",
      role: "The orchestrator: runs each dispute as a graph of steps (find the transaction, explain it, open the dispute, propose a credit), calling the model and the tools.",
      settings: [
        { k: "Framework", v: "LangGraph" },
        { k: "Step cap", v: "per conversation" },
        { k: "Token budget", v: "per conversation" },
      ],
      watch:
        "Without a token budget, model-gateway timeouts turn into retries on every live conversation, and the load cascades onto core banking.",
      risks: ["ASI01", "ASI06", "ASI08"],
      facts: ["owasp-asi08-cascading-failures"],
    },
    {
      node: "M",
      role: "One door to the models: routes simple turns to the cheaper model, keeps the cached prompt prefix stable, and enforces budgets.",
      settings: [
        { k: "Routing", v: "simple turns to Haiku" },
        { k: "Caching", v: "a stable prefix first" },
      ],
      watch:
        "Any byte change before a cache breakpoint, like a timestamp in the system prompt or a reordered tool list, stops cache hits from that point on. Watch the cache-read tokens on each call.",
      risks: ["ASI08"],
      facts: ["min-cacheable-prefix"],
    },
    {
      node: "C",
      role: "Claude Sonnet for the main turns and Claude Haiku for routed ones, priced on the cost model.",
      settings: [
        { k: "Main", v: "Sonnet" },
        { k: "Routed", v: "Haiku" },
      ],
      watch:
        "Caches belong to one model, so routed turns build their own prompt cache, and each cached prefix must reach the 512-token minimum.",
      risks: [],
      facts: [
        "sonnet-5-5-input-output-price",
        "haiku-5-5-input-output-price",
        "min-cacheable-prefix",
      ],
    },
    {
      node: "A",
      role: "An append-only record of every decision and tool call, kept for complaints, disputes and the regulator.",
      settings: [
        { k: "Writes", v: "append-only" },
        { k: "Written by", v: "the orchestrator, not sampled traces" },
      ],
      watch:
        "If anything can edit or delete entries, the log proves nothing: keep it append-only and tamper-evident.",
      risks: ["ASI10"],
      facts: [],
    },
    {
      node: "P",
      role: "Decides every write before it happens, permit or forbid, from the customer, their cards and the amount. A credit forbidden on amount goes to a reviewer, not a refusal.",
      settings: [
        { k: "Write tools", v: "all behind policy" },
        { k: "Credits above ₹5,000", v: "a person approves" },
      ],
      watch:
        "A rule written only in the prompt is a suggestion; this one runs outside the model.",
      risks: ["ASI01", "ASI02", "ASI03"],
      facts: ["owasp-asi02-tool-misuse"],
    },
    {
      node: "T",
      role: "The card ledger’s tools over MCP: look up transactions, explain a merchant, open a dispute, issue a provisional credit. Stateless, behind the load balancer.",
      settings: [
        { k: "Auth", v: "a token issued for this server" },
        { k: "Credits", v: "idempotency key on the dispute" },
        { k: "Tracing", v: "traceparent in _meta" },
      ],
      watch:
        "It takes a per-customer token issued for its own audience, never the gateway’s token passed through. Tool descriptions are instructions to the model: pin every server’s version and review changes.",
      risks: ["ASI02", "ASI03", "ASI04"],
      facts: ["mcp-2026-stateless", "mcp-2026-traceparent-in-meta"],
    },
    {
      node: "D",
      role: "The system of record. Only the ledger’s tools write to it; the agent never does directly.",
      settings: [{ k: "Writes", v: "through the MCP tools only" }],
      watch:
        "Retries must carry the idempotency key (the dispute id), or one dispute becomes two credits.",
      risks: ["ASI02"],
      facts: [],
    },
    {
      node: "V",
      role: "Card terms and dispute policies the agent retrieves to explain its decisions, indexed per product.",
      settings: [
        { k: "Index", v: "per product" },
        { k: "Chunks", v: "tagged with their source" },
      ],
      watch:
        "Retrieved text is data: a poisoned document can steer the agent if it is read as instructions.",
      risks: ["ASI06", "ASI01"],
      facts: ["owasp-asi06-memory-context-poisoning"],
    },
    {
      node: "H",
      role: "Where a person approves credits above the automatic limit, seeing the evidence first: the transaction, the customer’s words and the policy result.",
      settings: [{ k: "Sees", v: "credits above ₹5,000" }],
      watch:
        "Confident wording from the agent nudges reviewers to approve. Show the evidence, not the agent’s confidence.",
      risks: ["ASI09"],
      facts: ["owasp-asi09-human-agent-trust-exploitation"],
    },
    {
      node: "X",
      role: "Collects one trace per turn, linked by gen_ai.conversation.id: an invoke_agent span with chat spans (token and cache-read usage) and execute_tool spans beneath.",
      settings: [
        { k: "Conventions", v: "OpenTelemetry GenAI" },
        { k: "Feeds", v: "budget and cost alerts in the backend" },
      ],
      watch:
        "Without a budget alert, a runaway conversation shows up on the invoice before it shows up on a dashboard.",
      risks: ["ASI08", "ASI10"],
      facts: [
        "otel-genai-operations",
        "otel-genai-conversation-id",
        "otel-genai-cache-read-tokens",
      ],
    },
    {
      node: "E",
      role: "Runs golden dispute conversations, de-identified and with a simulated customer, four times each before every release, and gates on pass^4: every run has to succeed, not just one.",
      settings: [{ k: "Release gate", v: "pass^4 on the golden set" }],
      watch:
        "Gating on one run overstates reliability: an agent that succeeds once may fail the same task on a retry.",
      risks: [],
      facts: ["tau-bench-pass-hat-k", "eval-pass-hat-4"],
    },
  ],
  approved: true,
} satisfies Lab & { kind: "lab" };
