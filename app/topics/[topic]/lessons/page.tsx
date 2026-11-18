import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopicBar } from "@/components/shell/TopicBar";
import { CourseList, CourseProgress } from "@/components/topic/CourseList";
import { Icon } from "@/components/ui/Icon";
import {
  getFacts,
  getLessons,
  getTopic,
  getTopics,
  oldestReadOn,
} from "@/content";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return getTopics()
    .filter((t) => t.status === "live")
    .map((t) => ({ topic: t.id }));
}

const LEVEL = {
  foundation: "Foundation",
  intermediate: "Intermediate",
  advanced: "Advanced",
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/topics/[topic]/lessons">): Promise<Metadata> {
  const topic = getTopic((await params).topic);
  if (!topic) return {};
  return pageMetadata({
    title: `${topic.switcherLabel}: lessons`,
    description: topic.summary,
    path: `/topics/${topic.id}/lessons/`,
  });
}

export default async function CoursePage({
  params,
}: PageProps<"/topics/[topic]/lessons">) {
  const topic = getTopic((await params).topic);
  if (!topic) notFound();
  const built = getLessons(topic.id).map((l) => l.id);
  const minutes = topic.lessons.reduce((m, l) => m + l.minutes, 0);
  const o = topic.overview;

  return (
    <>
      <TopicBar
        topicId={topic.id}
        title={topic.switcherLabel}
        tabs={topic.tabs}
        active="lessons"
        verifiedOn={oldestReadOn(getFacts(topic.id))}
      />
      <main className="tt-course">
        <header className="tt-course-head">
          <div>
            <p className="tt-lbl">Topic · {LEVEL[topic.level]}</p>
            <h1 className="tt-h1 tt-course-h1">{topic.title}</h1>
            <p className="tt-body-s tt-course-sub">
              {topic.lessons.length} lessons · {minutes} minutes of stepping ·{" "}
              {built.length} ready now
            </p>
          </div>
          <CourseProgress
            topic={topic.id}
            lessons={topic.lessons}
            built={built}
          />
        </header>
        <div className="tt-course-body">
          <CourseList topic={topic.id} lessons={topic.lessons} built={built} />
          {o && (
            <aside className="tt-course-aside" aria-label="About this topic">
              {(o.prerequisites.items || o.prerequisites.text) && (
                <div className="tt-card-l">
                  <p className="tt-lbl-s">Before you start</p>
                  {o.prerequisites.text && (
                    <p className="tt-body-s">{o.prerequisites.text}</p>
                  )}
                  {o.prerequisites.items && (
                    <ul className="tt-course-bullets">
                      {o.prerequisites.items.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div className="tt-card-l">
                <p className="tt-lbl-s">{o.outcomesLabel}</p>
                <ul className="tt-course-outcomes">
                  {o.outcomes.map((t) => (
                    <li key={t}>
                      <Icon name="arrow-right" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </main>
    </>
  );
}
