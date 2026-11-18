// Governance (spec 05 §4, PRD P11): what applies to a bank's agent, and
// when. Every date and amount was re-read from its primary source on
// 18 Nov 2026. An engineering summary, not legal advice.
import type { Governance } from "../../../types";

export default {
  kind: "governance",
  topic: "ai-agents",
  intro:
    "India, EU and UK rules plus voluntary frameworks, read from their primary sources. An engineering summary, not legal advice.",
  events: [
    {
      date: "2024-05-17",
      precision: "day",
      jurisdiction: "UK",
      title: "PRA SS1/23 takes effect",
      description:
        "Model risk management principles for banks. Vendor models must be validated to the same standards as a bank’s own.",
      facts: ["pra-ss1-23-effective", "pra-ss1-23-vendor-models"],
    },
    {
      date: "2024-07-26",
      precision: "month",
      jurisdiction: "NIST",
      title: "NIST AI 600-1 published",
      description:
        "The Generative AI Profile for the AI RMF: 12 risks and, by our count, 212 suggested actions.",
      facts: [
        "nist-ai-600-1-published",
        "nist-ai-600-1-twelve-risks",
        "nist-ai-600-1-actions",
      ],
    },
    {
      date: "2024-08-01",
      precision: "day",
      jurisdiction: "EU",
      title: "EU AI Act enters into force",
      description:
        "Regulation (EU) 2024/1689. Its obligations apply in phases after this.",
      facts: ["eu-ai-act-in-force"],
    },
    {
      date: "2025-08-13",
      precision: "day",
      jurisdiction: "IN",
      title: "RBI releases the FREE-AI report",
      description:
        "7 Sutras and 26 recommendations across 6 pillars for AI in financial services: a committee’s recommendations, not a binding direction.",
      facts: [
        "rbi-free-ai-released",
        "rbi-free-ai-seven-sutras",
        "rbi-free-ai-26-recommendations",
        "rbi-free-ai-six-pillars",
      ],
    },
    {
      date: "2025-11-13",
      precision: "day",
      jurisdiction: "IN",
      title: "DPDP Rules 2025 notified",
      description:
        "The Data Protection Board rules apply at once; consent managers after one year; the main duties after 18 months.",
      facts: [
        "dpdp-rules-notified",
        "dpdp-rules-immediate",
        "dpdp-rule-4-one-year",
        "dpdp-rules-main-duties-18-months",
      ],
    },
    {
      date: "2025-12-09",
      precision: "day",
      jurisdiction: "OWASP",
      title: "OWASP Top 10 for Agentic Applications",
      description: "ASI01 to ASI10, a risk list written for agents.",
      facts: ["owasp-agentic-2026-published"],
    },
    {
      date: "2026-04-23",
      precision: "day",
      jurisdiction: "UK",
      title: "Revised SS1/23 takes effect",
      description:
        "The PRA’s updated model risk statement, after its April 2026 low-impact amendments.",
      facts: ["pra-ss1-23-revised"],
    },
    {
      date: "2026-05-07",
      precision: "day",
      jurisdiction: "EU",
      title: "Digital Omnibus agreed",
      description:
        "Parliament and Council reach political agreement, postponing the high-risk obligations.",
      facts: ["digital-omnibus-agreement"],
    },
    {
      date: "2026-07-27",
      precision: "day",
      jurisdiction: "EU",
      title: "Digital Omnibus enters into force",
      description:
        "Regulation (EU) 2026/1744, published in the Official Journal on 24 Jul 2026.",
      facts: ["digital-omnibus-in-force"],
    },
    {
      date: "2026-08-02",
      precision: "day",
      jurisdiction: "EU",
      title: "Article 50 transparency applies",
      description:
        "Tell people they’re talking to AI and mark synthetic content. The AI Office can now enforce the rules for general-purpose AI models.",
      facts: ["eu-ai-act-article-50-date", "eu-ai-office-gpai-enforcement"],
    },
    {
      date: "2026-08-03",
      precision: "day",
      jurisdiction: "OWASP",
      title: "OWASP LLM Top 10 2026",
      description:
        "Excessive Agency rises to LLM03 and Unbounded Consumption to LLM06.",
      facts: [
        "owasp-llm-2026-resource-date",
        "owasp-llm03-2026-excessive-agency",
        "owasp-llm06-2026-unbounded-consumption",
      ],
    },
    {
      date: "2026-11-13",
      precision: "day",
      jurisdiction: "IN",
      title: "DPDP consent-manager rules apply",
      description:
        "Rule 4: registration and obligations of consent managers, one year after notification.",
      facts: ["dpdp-rule-4-one-year"],
    },
    {
      date: "2026-12-02",
      precision: "day",
      jurisdiction: "EU",
      title: "New Article 5 bans apply",
      description:
        "Bans on AI that makes non-consensual intimate images or child sexual abuse material, and the Article 50(2) marking deadline for generative tools already on the market.",
      facts: ["digital-omnibus-new-bans", "digital-omnibus-50-2-transition"],
    },
    {
      date: "2027-05-13",
      precision: "month",
      jurisdiction: "IN",
      title: "DPDP main duties apply",
      description:
        "Notice, consent, security safeguards, breach reporting, retention and Significant Data Fiduciary duties.",
      facts: ["dpdp-rules-main-duties-18-months"],
    },
    {
      date: "2027-12-02",
      precision: "day",
      jurisdiction: "EU",
      title: "High-risk duties: Annex III",
      description:
        "Standalone high-risk systems, including credit scoring and employment.",
      facts: ["annex-iii-high-risk-date", "eu-ai-act-annex-iii-credit"],
    },
    {
      date: "2028-08-02",
      precision: "day",
      jurisdiction: "EU",
      title: "High-risk duties: Annex I",
      description:
        "AI built into regulated products such as medical devices and machinery.",
      facts: ["annex-i-high-risk-date"],
    },
  ],
  penalties: {
    title: "EU AI Act · penalty ceilings",
    rows: [
      { label: "Prohibited practices", value: "€35m or 7%" },
      {
        label: "Most other obligations, including transparency",
        value: "€15m or 3%",
      },
      { label: "Incorrect information to authorities", value: "€7.5m or 1%" },
    ],
    note: "Of worldwide annual turnover, whichever is higher. For SMEs and start-ups, whichever is lower; the Digital Omnibus gives small mid-caps the lower figure for the last two.",
    facts: [
      "eu-ai-act-art99-prohibited",
      "eu-ai-act-art99-other",
      "eu-ai-act-art99-information",
      "eu-ai-act-art99-sme",
    ],
  },
  frameworks: [
    {
      title: "RBI FREE-AI · 7 Sutras",
      items: [
        "Trust is the Foundation",
        "People First",
        "Innovation over Restraint",
        "Fairness and Equity",
        "Accountability",
        "Understandable by Design",
        "Safety, Resilience, and Sustainability",
      ],
      subhead: "6 Pillars · 26 recommendations",
      note: "Infrastructure, Policy and Capacity enable innovation; Governance, Protection and Assurance mitigate risk.",
      facts: [
        "rbi-free-ai-sutra-names",
        "rbi-free-ai-six-pillars",
        "rbi-free-ai-26-recommendations",
      ],
    },
    {
      title: "NIST AI 600-1 · 12 generative-AI risks",
      items: [
        "CBRN Information or Capabilities",
        "Confabulation",
        "Dangerous, Violent, or Hateful Content",
        "Data Privacy",
        "Environmental Impacts",
        "Harmful Bias and Homogenization",
        "Human-AI Configuration",
        "Information Integrity",
        "Information Security",
        "Intellectual Property",
        "Obscene, Degrading, and/or Abusive Content",
        "Value Chain and Component Integration",
      ],
      note: "Suggested actions sit under the AI RMF’s Govern, Map, Measure and Manage functions. Voluntary.",
      facts: ["nist-ai-600-1-risk-names", "nist-ai-600-1-actions"],
    },
  ],
  crosswalk: {
    title: "Controls crosswalk · one control, many rules",
    note: "How the card-dispute agent meets each. NIST mappings are ours.",
    columns: [
      "Control",
      "India",
      "EU AI Act",
      "UK · PRA",
      "NIST (voluntary)",
      "In our agent",
    ],
    rows: [
      {
        control: "AI inventory and risk tiering",
        cells: [
          "FREE-AI: a board-approved AI policy (outline in Annexure V)",
          "Risk classes; credit scoring is Annex III high-risk, fraud detection is not",
          "SS1/23 principle 1: model identification and risk classification",
          "Map",
          "Agent registry entry: owner, purpose, tier, tools",
        ],
      },
      {
        control: "Tell people it’s AI",
        cells: [
          "FREE-AI Protection pillar",
          "Article 50, from 2 Aug 2026",
          "—",
          "Govern",
          "The first message says it’s an AI assistant, with a path to a person",
        ],
      },
      {
        control: "Human oversight",
        cells: [
          "People First sutra",
          "Article 14, for high-risk systems",
          "SS1/23 principle 2: governance",
          "Manage",
          "Reviewer queue for credits above ₹5,000, evidence first",
        ],
      },
      {
        control: "Logging and traceability",
        cells: [
          "AI incident reporting (sample form in Annexure VI)",
          "Article 12 record-keeping, for high-risk systems",
          "SS1/23 principle 3: model development, implementation and use",
          "Measure",
          "An OpenTelemetry trace per turn and an append-only audit log",
        ],
      },
      {
        control: "Independent testing",
        cells: [
          "Recommendation 24: independent audits for high-risk or complex AI",
          "Article 15 accuracy, robustness and cybersecurity, for high-risk systems",
          "SS1/23 principle 4: independent model validation",
          "Measure",
          "A pass^k release gate, a red-team suite, a separate validator",
        ],
      },
      {
        control: "Personal-data limits",
        cells: [
          "DPDP Act and Rules: notice, consent and retention, from May 2027",
          "GDPR applies alongside the AI Act",
          "UK GDPR",
          "Data Privacy risk",
          "No free-text memory, a per-tenant index, retention limits",
        ],
      },
      {
        control: "Third-party and vendor risk",
        cells: [
          "FREE-AI: third-party AI in your own operations is not outsourcing; an outsourced service that uses AI is",
          "Duties for general-purpose models sit with the model provider",
          "SS1/23: validate vendor models to the same standards as your own",
          "Value Chain and Component Integration risk",
          "Pinned model versions, vendor due diligence, data-processing terms",
        ],
      },
    ],
    facts: [
      "eu-ai-act-articles-12-15-50",
      "eu-ai-act-article-14",
      "eu-ai-act-annex-iii-credit",
      "pra-ss1-23-principles",
      "pra-ss1-23-vendor-models",
      "rbi-free-ai-annexures",
      "rbi-free-ai-third-party",
      "rbi-free-ai-sutra-names",
      "dpdp-rules-main-duties-18-months",
    ],
  },
} satisfies Governance & { kind: "governance" };
