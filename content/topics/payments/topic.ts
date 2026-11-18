import type { Topic } from "../../types";

export default {
  id: "payments",
  title: "Payments platform",
  switcherLabel: "Payments platform",
  level: "advanced",
  status: "live",
  summary:
    "Networks drop, apps retry and webhooks arrive twice. Build a checkout payment system that charges each customer exactly once and can prove it.",
  domain: "Payments",
  system: "Checkout payment system",
  tags: ["Idempotency", "Ledgers", "Webhooks", "PCI DSS"],
  tabs: ["overview", "lessons"],
  lessons: [
    {
      id: "move-money-exactly-once",
      title: "Move money exactly once",
      summary:
        "The whole system in ten steps: idempotency, risk, tokens, retries, ledger, outbox, webhooks, reconciliation.",
      minutes: 18,
      ctaName: "exactly once",
    },
    {
      id: "idempotency-in-depth",
      title: "Idempotency in depth",
      summary:
        "Key scope, storage, expiry, concurrent duplicates and what to do when a key is reused with a different body.",
      minutes: 14,
    },
    {
      id: "designing-the-ledger",
      title: "Designing the ledger",
      summary:
        "Accounts, double-entry transactions, reversals, balances at a point in time, and multi-currency.",
      minutes: 16,
    },
    {
      id: "asynchronous-outcomes",
      title: "Asynchronous outcomes and webhooks",
      summary:
        "Signatures, replay windows, duplicates, ordering, and polling as a backstop.",
      minutes: 12,
    },
    {
      id: "timeouts-and-retries",
      title: "Timeouts, retries and backoff",
      summary:
        "Unknown outcomes, retry budgets, full jitter and circuit breakers in front of a PSP.",
      minutes: 12,
    },
    {
      id: "pci-scope-and-tokens",
      title: "PCI scope and tokenisation",
      summary:
        "What lands in scope, vaults and network tokens, and RBI card-on-file rules in India.",
      minutes: 15,
    },
    {
      id: "reconciliation",
      title: "Reconciliation and breaks",
      summary:
        "Settlement files, matching rules, break queues, ageing and the match-rate metric.",
      minutes: 14,
    },
    {
      id: "marketplace-interview",
      title: "Interview: a marketplace payments platform",
      summary:
        "A full mock interview with split payouts, refunds and chargebacks, scored on the same rubric.",
      minutes: 45,
    },
  ],
  overview: {
    layout: "list",
    heroTitle: "Payments platform: move money exactly once.",
    promise:
      "Networks drop, apps retry and webhooks arrive twice. This topic builds a checkout payment system that charges each customer exactly once and can prove it to an auditor: idempotency, tokens, ledgers, outbox, webhooks and daily reconciliation.",
    diagram: "checkout-payments",
    heroTrace: [
      { from: "C", to: "A", color: "cyan" },
      { from: "A", to: "S", color: "cyan" },
      { from: "S", to: "I", color: "blue" },
      { from: "I", to: "S", color: "blue" },
      { from: "S", to: "V", color: "amber" },
      { from: "V", to: "P", color: "green" },
      { from: "P", to: "S", color: "green" },
      { from: "S", to: "L", color: "blue" },
    ],
    highlights: [
      { icon: "check", text: "Every figure sourced and dated" },
      { icon: "shield", text: "PCI DSS v4.0.1 and RBI rules" },
      { icon: "layers", text: "Same 2D and 3D diagram engine" },
    ],
    why: {
      label: "Why this topic exists",
      headline: "At payment scale, the rare case happens every few seconds.",
      stats: [
        {
          value: "25.47 bn",
          claim:
            "UPI transactions in October 2026, worth ₹31.53 lakh crore, or about 822 million a day.",
          facts: [
            "upi-october-2026-volume",
            "upi-october-2026-value",
            "upi-october-2026-per-day",
          ],
        },
        {
          value: "24 h",
          claim:
            "Stripe keeps an idempotency key’s first result, 500 errors included, and lets it be removed once at least 24 hours old.",
          facts: [
            "stripe-idempotency-key-pruning",
            "stripe-idempotency-saves-first-response",
          ],
        },
        {
          value: "3 days",
          claim:
            "How long Stripe keeps retrying a failed webhook in live mode, with no promise about event order.",
          facts: ["stripe-webhook-retry-window", "stripe-webhook-no-ordering"],
        },
        {
          value: "v4.0.1",
          claim:
            "The only active version of PCI DSS. Its future-dated requirements became mandatory on 31 March 2025.",
          facts: [
            "pci-dss-v4-0-1-only-active",
            "pci-dss-future-dated-effective",
          ],
        },
      ],
    },
    outcomesLabel: "You will be able to",
    outcomes: [
      "Design a payment API that is safe to retry, using Idempotency-Key semantics",
      "Keep card data in one vault and the rest of the system out of PCI scope",
      "Model money as a balanced, append-only double-entry ledger",
      "Handle webhooks that arrive late, twice or out of order, and prove it all with daily reconciliation",
    ],
    skills: [
      { name: "Idempotency and consistency", level: 3 },
      { name: "Data modelling: ledgers", level: 3 },
      { name: "Security and compliance", level: 2 },
      { name: "Reliability: retries and async", level: 3 },
    ],
    prerequisites: {
      text: "HTTP APIs and status codes, database transactions, and basic queues. No payments experience needed.",
      audiences: ["Backend engineers", "Architects", "SRE"],
    },
  },
} satisfies Topic;
