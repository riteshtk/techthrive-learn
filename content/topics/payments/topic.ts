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
} satisfies Topic;
