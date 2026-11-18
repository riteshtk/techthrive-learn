// The lessons' sandboxes (spec 04 §5): a few inputs, four tiles and one
// result, computed by a pure function per kind. The lesson file names its
// kind; the formulas and teaching inputs live here, and every figure they
// show is in the facts register.

import { conversationCost, usd } from "@/lib/costModel";
import { HAIKU_5_5, SONNET_5_5 } from "@/lib/claudePrices";
import type { ColorKey } from "@/content/types";

export type SandboxInput =
  | {
      kind: "range";
      id: string;
      label: string;
      min: number;
      max: number;
      step: number;
      value: number;
      /** How the value reads beside the slider. */
      format: (v: number) => string;
    }
  | { kind: "check"; id: string; label: string; value: boolean };

export type Tone = ColorKey | "red";
export type SandboxTile = { label: string; value: string; tone: Tone };

export type SandboxModule = {
  title: string;
  inputs: SandboxInput[];
  footnote: string;
  compute: (values: Record<string, number | boolean>) => {
    tiles: [SandboxTile, SandboxTile, SandboxTile, SandboxTile];
    result: { label: string; value: string; tone: Tone };
  };
};

const pct = (v: number) => `${v}%`;
const inGrouping = (v: number) => Math.round(v).toLocaleString("en-IN");

/** Agent cost: conversations a day, cache hit rate, prompt caching on or
    off, and the share of turns routed to Haiku 5.5. */
const agentCost: SandboxModule = {
  title: "Sandbox · Claude prices",
  inputs: [
    {
      kind: "range",
      id: "conv",
      label: "Conversations a day",
      min: 5,
      max: 100,
      step: 5,
      value: 20,
      format: (v) => (v * 1000).toLocaleString("en-US"),
    },
    { kind: "check", id: "cache", label: "Prompt caching on", value: true },
    {
      kind: "range",
      id: "hit",
      label: "Prompt-cache hit rate",
      min: 0,
      max: 95,
      step: 5,
      value: 90,
      format: pct,
    },
    {
      kind: "range",
      id: "route",
      label: "Turns routed to Haiku 5.5",
      min: 0,
      max: 90,
      step: 10,
      value: 0,
      format: pct,
    },
  ],
  footnote:
    "Rest on Sonnet 5.5. Each turn: 6,000-token cached prefix, 2,500 fresh, 350 out; 6 turns.",
  compute(values) {
    const conv = Number(values.conv) * 1000;
    const cacheOn = values.cache !== false;
    const hit = Number(values.hit);
    const route = Number(values.route);
    const perConv = conversationCost({
      main: SONNET_5_5,
      routed: HAIKU_5_5,
      routedShare: route / 100,
      turns: 6,
      shape: { prefixTokens: 6000, freshInputTokens: 2500, outputTokens: 350 },
      cache: { on: cacheOn, hitRate: hit / 100 },
    });
    const perDay = perConv * conv;
    return {
      tiles: [
        { label: "Cost / conversation", value: usd(perConv, 3), tone: "text" },
        { label: "Cost / day", value: usd(perDay, 0), tone: "text" },
        {
          label: "Cache hit",
          value: cacheOn ? pct(hit) : "off",
          tone: cacheOn && hit >= 80 ? "green" : "amber",
        },
        { label: "On Haiku 5.5", value: pct(route), tone: "text" },
      ],
      result: { label: "Per month", value: usd(perDay * 30, 0), tone: "text" },
    };
  },
};

/** Payments: what retries without an Idempotency-Key cost. */
const payments: SandboxModule = {
  title: "Sandbox · Retry simulator",
  inputs: [
    {
      kind: "range",
      id: "payments",
      label: "Payments a day",
      min: 500,
      max: 5000,
      step: 500,
      value: 3000,
      format: (v) => inGrouping(v * 1000),
    },
    {
      kind: "range",
      id: "timeouts",
      label: "PSP timeout rate",
      min: 1,
      max: 30,
      step: 1,
      value: 5,
      format: (v) => `${(v / 10).toFixed(1)}%`,
    },
    {
      kind: "range",
      id: "went",
      label: "Timed-out requests that went through",
      min: 0,
      max: 100,
      step: 10,
      value: 40,
      format: pct,
    },
    {
      kind: "check",
      id: "keyed",
      label: "Send an Idempotency-Key on retries",
      value: false,
    },
  ],
  footnote:
    "One retry per timeout, ₹4,899 average payment. Volumes and rates are teaching assumptions.",
  compute(values) {
    const n = Number(values.payments) * 1000;
    const timeouts = n * (Number(values.timeouts) / 1000);
    const keyed = values.keyed === true;
    const dupDay = keyed ? 0 : timeouts * (Number(values.went) / 100);
    const bad: Tone = dupDay > 0 ? "red" : "green";
    return {
      tiles: [
        { label: "Timeouts / day", value: inGrouping(timeouts), tone: "text" },
        { label: "Duplicates / day", value: inGrouping(dupDay), tone: bad },
        {
          label: "Duplicate value / day",
          value: `₹${inGrouping(dupDay * 4899)}`,
          tone: bad,
        },
        {
          label: "Idempotency key",
          value: keyed ? "on" : "off",
          tone: keyed ? "green" : "amber",
        },
      ],
      result: {
        label: "Duplicate charges a month",
        value: inGrouping(dupDay * 30),
        tone: bad,
      },
    };
  },
};

export const SANDBOXES = { "agent-cost": agentCost, payments } as const;
export type SandboxKind = keyof typeof SANDBOXES;

/** Each input's starting value. */
export function defaultsOf(
  module: SandboxModule,
): Record<string, number | boolean> {
  return Object.fromEntries(module.inputs.map((i) => [i.id, i.value]));
}
