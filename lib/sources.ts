// A topic's Sources page (spec 03 §6, PRD P8), built from the facts
// register: every fact of the topic, grouped, with where the topic's pages
// use it. Nothing here is typed by hand: counts, groups, rows and "used on"
// all come from the register and the content that cites it.

import type { Checkpoint, Fact, Lesson, Tool, Topic } from "@/content/types";
import { PRICE_FACTS } from "./claudePrices";

export type Use = { label: string; href: string };

const TOOL_LABEL: Record<Tool["kind"], string> = {
  cards: "Review cards",
  threats: "Threat model",
  governance: "Governance",
  lab: "Design lab",
  sheets: "Cheatsheets",
};

export type SourceRow = {
  fact: Fact;
  /** The source's host, shown under its name: "docs.stripe.com". */
  host?: string;
  usedOn: Use[];
};

export type SourceGroup = { name: string; rows: SourceRow[] };

export type SourcesPage = {
  groups: SourceGroup[];
  /** Distinct source pages behind the topic's real facts. */
  sourceCount: number;
  /** The earliest date a fact is due to be read again. */
  nextRecheck?: string;
};

export function hostOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

/**
 * Where each fact appears: the overview (stats, brief, current-with), the
 * first lesson step whose Sources tab lists it, checkpoints whose
 * explanations rely on it, the cost model (its rates) and the topic's
 * other tools.
 */
export function usesOf(
  topic: Topic,
  lessons: readonly Lesson[],
  checkpoints: readonly Checkpoint[],
  tools: readonly Tool[] = [],
): Map<string, Use[]> {
  const uses = new Map<string, Use[]>();
  const add = (id: string, use: Use) => {
    const list = uses.get(id) ?? [];
    if (!list.some((u) => u.href === use.href)) list.push(use);
    uses.set(id, list);
  };
  const base = `/topics/${topic.id}/`;
  const o = topic.overview;
  if (o) {
    const ids = [
      ...o.why.stats.flatMap((s) => s.facts),
      ...(o.brief?.facts ?? []),
      ...(o.currentWith ?? []).flatMap((c) => c.facts),
    ];
    for (const id of ids) add(id, { label: "Overview", href: base });
  }
  const number = (lessonId: string) =>
    topic.lessons.findIndex((l) => l.id === lessonId) + 1;
  for (const lesson of lessons) {
    const n = number(lesson.id);
    lesson.steps.forEach((step, i) => {
      for (const id of step.facts)
        if (!uses.get(id)?.some((u) => u.href.includes(`/${lesson.id}/?`)))
          add(id, {
            label: `Lesson ${n} · step ${i + 1}`,
            href: `${base}lessons/${lesson.id}/?step=${i + 1}`,
          });
    });
  }
  if (topic.tabs.includes("cost"))
    for (const id of PRICE_FACTS)
      add(id, { label: "Cost model", href: `${base}cost/` });
  for (const tool of tools) {
    const use = { label: TOOL_LABEL[tool.kind], href: `${base}${tool.kind}/` };
    switch (tool.kind) {
      case "threats":
        for (const r of tool.risks) for (const id of r.facts) add(id, use);
        for (const id of tool.related.facts) add(id, use);
        break;
      case "lab":
        for (const d of tool.details) for (const id of d.facts) add(id, use);
        break;
      case "cards":
        for (const c of tool.cards)
          for (const id of c.facts)
            add(id, { label: "Review cards", href: "/review/" });
        break;
      case "sheets":
        for (const sh of tool.sheets) for (const id of sh.facts) add(id, use);
        break;
      case "governance":
        for (const id of [
          ...tool.events.flatMap((e) => e.facts),
          ...tool.penalties.facts,
          ...tool.frameworks.flatMap((f) => f.facts),
          ...tool.crosswalk.facts,
        ])
          add(id, use);
        break;
    }
  }
  for (const checkpoint of checkpoints) {
    const n = number(checkpoint.lesson);
    for (const q of checkpoint.questions)
      for (const id of q.facts)
        add(id, {
          label: `Checkpoint ${n}`,
          href: `${base}lessons/${checkpoint.lesson}/checkpoint/`,
        });
  }
  return uses;
}

/** Groups in register order, with teaching assumptions and derived
    figures (no source page of their own) last. */
export function sourcesPage(
  facts: readonly Fact[],
  uses: ReadonlyMap<string, Use[]>,
): SourcesPage {
  const rank = (f: Fact) => (f.kind === "real" ? 0 : 1);
  const byGroup = new Map<string, SourceRow[]>();
  const order = [...facts].sort((a, b) => rank(a) - rank(b));
  for (const fact of order) {
    const rows = byGroup.get(fact.group) ?? [];
    rows.push({
      fact,
      host: fact.url ? hostOf(fact.url) : undefined,
      usedOn: uses.get(fact.id) ?? [],
    });
    byGroup.set(fact.group, rows);
  }
  const urls = new Set(
    facts.filter((f) => f.kind === "real" && f.url).map((f) => f.url),
  );
  const recheck = facts.map((f) => f.recheckBy).sort()[0];
  return {
    groups: [...byGroup].map(([name, rows]) => ({ name, rows })),
    sourceCount: urls.size,
    nextRecheck: recheck,
  };
}
