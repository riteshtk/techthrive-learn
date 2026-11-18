// Review cards for the payments topic (PRD P14). Card ids key learners'
// stored schedules: never change one once merged.
import type { Cards } from "../../../types";

export default {
  kind: "cards",
  topic: "payments",
  cards: [
    {
      id: "stripe-idempotency-replay",
      area: "Idempotency",
      source: "Stripe API reference",
      q: "A retry reuses a Stripe idempotency key after the first attempt failed with a 500. What comes back?",
      a: "The saved first response, 500 errors included. Stripe can remove keys once they are at least 24 hours old; after that, the same key is a new request.",
      facts: [
        "stripe-idempotency-saves-first-response",
        "stripe-idempotency-key-pruning",
      ],
    },
    {
      id: "stripe-webhook-retries",
      area: "Webhooks",
      source: "Stripe Docs",
      q: "How long does Stripe keep retrying a webhook in live mode, and in what order do events arrive?",
      a: "Up to 3 days, with exponential backoff, and with no promise about order. Handlers must ignore duplicates and cope with events out of order.",
      facts: ["stripe-webhook-retry-window", "stripe-webhook-no-ordering"],
    },
    {
      id: "rbi-card-on-file",
      area: "Compliance",
      source: "RBI circular",
      q: "In India, who may store actual card data from 1 October 2022?",
      a: "Only card issuers and card networks. Everyone else in the payment chain must not store it; checkout keeps tokens instead.",
      facts: ["rbi-card-on-file-storage-ban"],
    },
  ],
} satisfies Cards & { kind: "cards" };
