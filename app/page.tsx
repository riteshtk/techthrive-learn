import { Home } from "@/components/home/Home";
import { getFacts, getLessons, getTools, getTopics } from "@/content";
import type { FactChange, ResumeLesson } from "@/lib/home";
import { lessonKey } from "@/lib/learning";

export default function HomePage() {
  const topics = getTopics().filter((t) => t.status === "live");
  const lessons: ResumeLesson[] = topics.flatMap((t) =>
    getLessons(t.id).map((l) => ({
      key: lessonKey(t.id, l.id),
      topicTitle: t.switcherLabel,
      n: t.lessons.findIndex((o) => o.id === l.id) + 1,
      title: t.lessons.find((o) => o.id === l.id)?.title ?? l.id,
      href: `/topics/${t.id}/lessons/${l.id}/`,
      steps: l.steps.map((s) => s.short),
    })),
  );
  const cardKeys = topics.flatMap((t) =>
    getTools(t.id).flatMap((tool) =>
      tool.kind === "cards" ? tool.cards.map((c) => `${t.id}/${c.id}`) : [],
    ),
  );
  const changes: FactChange[] = topics.flatMap((t) =>
    getFacts(t.id).flatMap((f) =>
      f.changedOn && f.previousValue
        ? [
            {
              topic: t.id,
              topicTitle: t.switcherLabel,
              id: `${t.id}/${f.id}`,
              claim: f.claim,
              value: f.value,
              previousValue: f.previousValue,
              changedOn: f.changedOn,
              note: f.changeNote,
              source: f.title ?? f.source,
              url: f.url,
            },
          ]
        : [],
    ),
  );

  return (
    <main className="tt-home-page">
      <Home lessons={lessons} cardKeys={cardKeys} changes={changes} />
    </main>
  );
}
