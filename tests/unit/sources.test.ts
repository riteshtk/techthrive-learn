import { describe, expect, it } from "vitest";
import {
  getCheckpoint,
  getFacts,
  getLessons,
  getTopic,
  getTopics,
} from "@/content";
import type { Checkpoint } from "@/content/types";
import { hostOf, sourcesPage, usesOf } from "@/lib/sources";

// The Sources page (PRD P8) is built from the register: every fact of the
// topic appears once, grouped, with derived uses and counts.

describe.each(
  getTopics()
    .filter((t) => t.status === "live")
    .map((t) => [t.id] as const),
)("sources for %s", (id) => {
  const topic = getTopic(id)!;
  const lessons = getLessons(id);
  const checkpoints = lessons
    .map((l) => getCheckpoint(id, l.id))
    .filter((c): c is Checkpoint => !!c);
  const facts = getFacts(id);
  const uses = usesOf(topic, lessons, checkpoints);
  const page = sourcesPage(facts, uses);
  const rows = page.groups.flatMap((g) => g.rows);

  it("lists every fact of the topic exactly once", () => {
    expect(rows.map((r) => r.fact.id).sort()).toEqual(
      facts.map((f) => f.id).sort(),
    );
  });

  it("groups by the register's group, with assumptions and derived last", () => {
    for (const g of page.groups)
      for (const r of g.rows) expect(r.fact.group).toBe(g.name);
    const kinds = rows.map((r) => (r.fact.kind === "real" ? 0 : 1));
    expect(kinds).toEqual([...kinds].sort());
  });

  it("counts distinct source pages and the next re-check", () => {
    const urls = new Set(
      facts.filter((f) => f.kind === "real").map((f) => f.url),
    );
    expect(page.sourceCount).toBe(urls.size);
    expect(page.nextRecheck).toBe(facts.map((f) => f.recheckBy).sort()[0]);
  });

  it("derives uses from the overview, lesson steps and checkpoints", () => {
    const stat = topic.overview!.why.stats[0]!.facts[0]!;
    expect(uses.get(stat)).toContainEqual({
      label: "Overview",
      href: `/topics/${id}/`,
    });
    const lesson = lessons[0]!;
    const n = topic.lessons.findIndex((l) => l.id === lesson.id) + 1;
    const i = lesson.steps.findIndex((s) => s.facts.length > 0);
    const fact = lesson.steps[i]!.facts[0]!;
    expect(uses.get(fact)).toContainEqual({
      label: `Lesson ${n} · step ${i + 1}`,
      href: `/topics/${id}/lessons/${lesson.id}/?step=${i + 1}`,
    });
    // One use per lesson: the first step that lists the fact.
    for (const list of uses.values()) {
      const hrefs = list.map((u) => u.href.split("?")[0]);
      expect(new Set(hrefs).size).toBe(hrefs.length);
    }
  });
});

it("shows a source's host without www", () => {
  expect(hostOf("https://www.rbi.org.in/scripts/x")).toBe("rbi.org.in");
  expect(hostOf("https://docs.stripe.com/webhooks")).toBe("docs.stripe.com");
});
