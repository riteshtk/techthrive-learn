// Navigation and search data for the app shell. Built from content at
// build time (content/index.ts) and passed to the client as plain data, so
// no content files ship as JavaScript.

export type NavTopic = { id: string; title: string; level: string };
export type NavRoadmap = { id: string; title: string; topics: NavTopic[] };

export type SearchEntry = {
  id: string;
  title: string;
  roadmap: string;
  summary: string;
  nodes: string[];
  steps: { title: string; text: string }[];
};

export type SearchResult = {
  id: string;
  title: string;
  roadmap: string;
  /** 1-based step to open, when the match is inside one step. */
  step?: number;
  /** What matched, to show under the title. */
  detail: string;
};

const norm = (s: string) => s.toLowerCase();

/**
 * Every word of the query must appear. Topic-level matches (title, summary,
 * block labels) come first, title matches first of all; otherwise the first
 * step that matches is linked directly.
 */
export function searchTopics(
  entries: readonly SearchEntry[],
  query: string,
  limit = 8,
): SearchResult[] {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return entries.slice(0, limit).map((e) => ({
      id: e.id,
      title: e.title,
      roadmap: e.roadmap,
      detail: e.summary,
    }));
  }
  const has = (text: string) => words.every((w) => norm(text).includes(w));
  const scored: { result: SearchResult; score: number }[] = [];
  for (const e of entries) {
    if (has(e.title)) {
      scored.push({
        score: 3,
        result: {
          id: e.id,
          title: e.title,
          roadmap: e.roadmap,
          detail: e.summary,
        },
      });
      continue;
    }
    if (has(`${e.title} ${e.summary} ${e.nodes.join(" ")}`)) {
      scored.push({
        score: 2,
        result: {
          id: e.id,
          title: e.title,
          roadmap: e.roadmap,
          detail: e.summary,
        },
      });
      continue;
    }
    const i = e.steps.findIndex((s) => has(`${e.title} ${s.title} ${s.text}`));
    const step = e.steps[i];
    if (step) {
      scored.push({
        score: 1,
        result: {
          id: e.id,
          title: e.title,
          roadmap: e.roadmap,
          step: i + 1,
          detail: `Step ${i + 1}: ${step.title}`,
        },
      });
    }
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.result);
}
