// The checkpoint for "Move money exactly once". The design has none for
// this lesson; these questions were written from the lesson and its
// sources, checked by a fresh reviewer and approved by the creator on
// 18 Nov 2026.
import type { Checkpoint } from "../../../types";

export default {
  lesson: "move-money-exactly-once",
  topic: "payments",
  approved: true,
  questions: [
    {
      id: "safe-retry",
      prompt:
        "The call to the PSP times out after 10 s while authorising ₹4,899. The payment service will retry. What makes the retry safe?",
      subline:
        "The first attempt may or may not have gone through. Pick what stops a second charge.",
      tags: ["IDEMPOTENCY", "RETRIES"],
      options: [
        {
          id: "A",
          text: "Wait a random time with full jitter before retrying.",
          verdict: "partial",
          why: "Full jitter stops thousands of clients retrying in lockstep, and you should use it. But it only spaces retries out; it doesn’t stop a retry charging twice.",
        },
        {
          id: "B",
          text: "Send the same Idempotency-Key on the retry.",
          verdict: "right",
          why: "Right. If the first attempt went through, the server replays its saved result instead of charging again.",
        },
        {
          id: "C",
          text: "Mark the payment failed and ask the customer to pay again.",
          verdict: "wrong",
          why: "A timeout means the outcome is unknown, not failed. If the first attempt went through, the customer is now charged twice.",
        },
        {
          id: "D",
          text: "Retry straight away, with no key, as often as needed until the PSP answers.",
          verdict: "wrong",
          why: "Without a key, every retry that reaches the PSP can be a new charge, and retrying at once piles load on a PSP that is already slow.",
        },
      ],
      resultHeading: {
        right: "Right. Same key, same answer.",
        other: "Not quite. The same Idempotency-Key makes it safe.",
      },
      explanation: [
        "A timeout leaves the outcome unknown. Retry with the same Idempotency-Key, so a payment that did go through returns its first result instead of charging again, and space retries with capped exponential backoff and full jitter so clients don’t retry in lockstep.",
      ],
      replayStep: 6,
      facts: [
        "stripe-idempotency-saves-first-response",
        "aws-full-jitter-formula",
        "assume-psp-timeout",
        "assume-average-payment",
      ],
      reviewCard:
        "A timeout is unknown, never failed: retry with the same key.",
    },
    {
      id: "lost-event",
      prompt:
        "The payment service writes the ledger entries, then publishes payment.captured to a queue as a second step. It crashes in between. What fixes this for good?",
      subline: "The money moved, but nothing downstream was told.",
      tags: ["OUTBOX"],
      options: [
        {
          id: "A",
          text: "Publish the event first, then write the ledger entries.",
          verdict: "wrong",
          why: "That only swaps the gap: a crash in between now announces money that never moved.",
        },
        {
          id: "B",
          text: "Write the ledger entries and an outbox row in one database transaction; a relay publishes the outbox.",
          verdict: "right",
          why: "Right. Either both are written or neither is, so there is no gap. The relay can publish later, even after a crash.",
        },
        {
          id: "C",
          text: "A nightly job finds captured payments with no event and publishes them.",
          verdict: "partial",
          why: "That eventually recovers lost events, but there’s a gap until it runs, and it has to work out what went missing.",
        },
        {
          id: "D",
          text: "Keep unsent events in memory and retry them from a background job.",
          verdict: "wrong",
          why: "Memory is exactly what a crash loses. The event has to be stored with the ledger write.",
        },
      ],
      resultHeading: {
        right: "Right. One transaction for the money and the message.",
        other: "Not quite. Write the ledger and the event together.",
      },
      explanation: [
        "This is the transactional outbox. Insert the ledger entries and an outbox row in the same database transaction, and let a relay publish the row. Because the relay may publish an event more than once, consumers dedupe on the event id.",
      ],
      replayStep: 8,
      facts: ["outbox-same-transaction", "outbox-at-least-once"],
      reviewCard: "Write the ledger and the outbox row in one transaction.",
    },
    {
      id: "twice-in-any-order",
      prompt:
        "The PSP delivers payment.succeeded twice, and an event generated later arrives before it. What should the webhook receiver do?",
      subline:
        "Stripe, for one, retries failed deliveries and doesn’t promise any order.",
      tags: ["WEBHOOKS"],
      options: [
        {
          id: "A",
          text: "Apply each event in the order it arrives.",
          verdict: "wrong",
          why: "Arrival order isn’t event order, and the duplicate would be applied twice.",
        },
        {
          id: "B",
          text: "Verify the signature, record the event id, answer 2xx quickly, then apply each state change once, against the payment’s state machine.",
          verdict: "right",
          why: "Right. Recording the event id drops the duplicate, and applying changes against the payment’s state machine copes with any order.",
        },
        {
          id: "C",
          text: "Return an error for anything out of order, so the PSP sends it again later.",
          verdict: "wrong",
          why: "The PSP keeps retrying a failed delivery for days, and errors don’t put events in order. You end up with a backlog and the same problem.",
        },
        {
          id: "D",
          text: "Drop any event whose id has been seen before, and apply the rest as they arrive.",
          verdict: "partial",
          why: "That handles the duplicate. But applying in arrival order still lets a later event land before an earlier one.",
        },
      ],
      resultHeading: {
        right: "Right. Verify, record, acknowledge, apply once.",
        other: "Not quite. Expect every event twice, in any order.",
      },
      explanation: [
        "Webhooks are delivered at least once and unordered. Stripe retries failed deliveries for up to three days in live mode, doesn’t guarantee event order, and recommends logging the event ids you have processed. So verify, record the id, acknowledge fast, and apply each change once against the payment’s state.",
      ],
      replayStep: 9,
      facts: [
        "stripe-webhook-retry-window",
        "stripe-webhook-no-ordering",
        "stripe-webhook-duplicate-events",
      ],
      reviewCard: "Webhooks arrive at least once and in any order.",
    },
  ],
} satisfies Checkpoint;
