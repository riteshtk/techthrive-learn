// Planned topics for the catalog (PRD P15): shown as planned, never as
// links. Each id is reserved for the topic it becomes. From the approved
// catalog still; quarters are plans, not promises.
import type { PlannedTopic } from "./types";

export default [
  {
    id: "event-streaming",
    title: "Event streaming at scale",
    domain: "Distributed systems",
    system:
      "An order-events platform: partitions, consumer groups, delivery guarantees and backpressure.",
    tags: ["Kafka", "Exactly-once", "Schemas"],
    plannedLessons: 9,
  },
  {
    id: "url-shortener",
    title: "Global URL shortener",
    domain: "Distributed systems",
    system:
      "The classic interview system: ID generation, caching, sharding and click analytics.",
    tags: ["IDs", "Caching", "Sharding"],
    plannedLessons: 6,
  },
  {
    id: "llm-platform",
    title: "LLM platform: RAG, evals and gateways",
    domain: "AI & ML",
    system:
      "An internal LLM platform: retrieval, model routing, guardrails and evaluation pipelines.",
    tags: ["RAG", "Evals", "Routing"],
    plannedLessons: 8,
    plannedFor: "Q1 2027",
  },
  {
    id: "multi-tenant-saas",
    title: "Multi-tenant SaaS architecture",
    domain: "Cloud & platform",
    system:
      "Tenant isolation, noisy neighbours, per-tenant keys and data residency.",
    tags: ["Isolation", "Residency", "Quotas"],
    plannedLessons: 7,
    plannedFor: "Q1 2027",
  },
  {
    id: "realtime-chat",
    title: "Real-time chat and presence",
    domain: "Distributed systems",
    system:
      "Connections at scale, fan-out, ordering, offline sync and presence.",
    tags: ["WebSockets", "Fan-out", "Ordering"],
    plannedLessons: 7,
    plannedFor: "Q2 2027",
  },
  {
    id: "search-at-scale",
    title: "Search at scale",
    domain: "Data",
    system:
      "Indexing pipelines, relevance, sharding and freshness for product search.",
    tags: ["Inverted index", "Ranking", "Freshness"],
    plannedLessons: 7,
    plannedFor: "Q2 2027",
  },
  {
    id: "lakehouse-cdc",
    title: "Data platform: lakehouse and CDC",
    domain: "Data",
    system:
      "Change data capture into a lakehouse with contracts, lineage and quality checks.",
    tags: ["CDC", "Lakehouse", "Lineage"],
    plannedLessons: 8,
    plannedFor: "Q2 2027",
  },
  {
    id: "zero-trust",
    title: "Zero-trust security architecture",
    domain: "Security",
    system:
      "Workload identity, service-to-service auth, secrets and blast-radius design.",
    tags: ["mTLS", "Identity", "Secrets"],
    plannedLessons: 7,
    plannedFor: "Q2 2027",
  },
  {
    id: "observability-incidents",
    title: "Observability and incident response",
    domain: "Reliability",
    system: "SLOs, traces, alert design and a live incident simulation.",
    tags: ["SLOs", "Tracing", "On-call"],
    plannedLessons: 7,
    plannedFor: "Q3 2027",
  },
  {
    id: "cloud-cost",
    title: "Cloud cost and capacity",
    domain: "Cloud & platform",
    system:
      "Unit economics, capacity planning and cost guardrails for a growing platform.",
    tags: ["FinOps", "Capacity", "Unit cost"],
    plannedLessons: 6,
    plannedFor: "Q3 2027",
  },
  {
    id: "ride-matching",
    title: "Ride matching and geo-indexing",
    domain: "Distributed systems",
    system: "Location updates, geo-indexes, matching and surge under load.",
    tags: ["Geo-index", "Matching", "Streaming"],
    plannedLessons: 7,
    plannedFor: "Q3 2027",
  },
] satisfies PlannedTopic[];
