// Search over topics, lessons, their steps and facts (PRD P2). The index is
// built from content at build time, written once as search-index.json, and
// fetched the first time search opens, so no page carries it (issue #4).

export type SearchKind = "topic" | "lesson" | "step" | "fact";

export type SearchDoc = {
  kind: SearchKind;
  title: string;
  /** Where it sits, shown under the title: a topic, or topic · lesson. */
  context: string;
  /** Searched, but not shown. */
  text: string;
  /** App path with a trailing slash, before the base path. */
  path: string;
  /** 1-based step to open, for step results. */
  step?: number;
};

export type SearchResult = SearchDoc;

/** A topic or lesson outranks a step, a step outranks a fact. */
const KIND_RANK: Record<SearchKind, number> = {
  topic: 3,
  lesson: 2,
  step: 1,
  fact: 0,
};

const norm = (s: string) => s.toLowerCase();

/**
 * Every word of the query must appear in the title, context or text.
 * Title matches come first, then by kind; ties keep index order.
 */
export function search(
  docs: readonly SearchDoc[],
  query: string,
  limit = 8,
): SearchResult[] {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return docs.filter((d) => d.kind === "topic").slice(0, limit);
  }
  const has = (text: string) => words.every((w) => norm(text).includes(w));
  const scored: { doc: SearchDoc; score: number; order: number }[] = [];
  docs.forEach((doc, order) => {
    const inTitle = has(doc.title);
    if (!inTitle && !has(`${doc.title} ${doc.context} ${doc.text}`)) return;
    scored.push({
      doc,
      order,
      score: (inTitle ? 10 : 0) + KIND_RANK[doc.kind],
    });
  });
  return scored
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map((s) => s.doc);
}

/** The link for a result: its path, plus ?step for steps. */
export function resultHref(result: SearchResult): string {
  return result.step ? `${result.path}?step=${result.step}` : result.path;
}

/** Validates the fetched index: drops anything that isn't a SearchDoc. */
export function parseSearchIndex(data: unknown): SearchDoc[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (d): d is SearchDoc =>
      typeof d === "object" &&
      d !== null &&
      ["topic", "lesson", "step", "fact"].includes(d.kind) &&
      typeof d.title === "string" &&
      typeof d.context === "string" &&
      typeof d.text === "string" &&
      typeof d.path === "string" &&
      (d.step === undefined || Number.isInteger(d.step)),
  );
}

export const SEARCH_INDEX_PATH = "/search-index.json";
