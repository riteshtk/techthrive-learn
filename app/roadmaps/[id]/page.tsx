import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContinueLink } from "@/components/ContinueLink";
import { DoneTick } from "@/components/DoneTick";
import { getRoadmap, getRoadmaps, roadmapTopics } from "@/content";
import { levelLabel } from "@/lib/roadmap";

export const dynamicParams = false;

export function generateStaticParams() {
  return getRoadmaps().map((r) => ({ id: r.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/roadmaps/[id]">): Promise<Metadata> {
  const roadmap = getRoadmap((await params).id);
  return roadmap ? { title: roadmap.title, description: roadmap.goal } : {};
}

export default async function RoadmapPage({
  params,
}: PageProps<"/roadmaps/[id]">) {
  const roadmap = getRoadmap((await params).id);
  if (!roadmap) notFound();
  const topics = roadmapTopics(roadmap);

  return (
    <main className="page">
      <p className="crumb">
        <Link href="/">All roadmaps</Link>
      </p>
      <h1>{roadmap.title}</h1>
      <p className="lede">{roadmap.goal}</p>
      <p>
        <ContinueLink
          topics={topics.map((t) => ({ id: t.id, title: t.title }))}
        />
      </p>
      <ol className="card-list topic-list">
        {topics.map((topic, i) => (
          <li key={topic.id} className="card">
            <p className="meta">
              <span className="topic-number">{i + 1}</span>
              <span className={`level level-${topic.level}`}>
                {levelLabel[topic.level]}
              </span>
            </p>
            <h2>
              <Link href={`/topics/${topic.id}/`} className="card-link">
                {topic.title}
              </Link>
            </h2>
            <p>{topic.summary}</p>
            <DoneTick topicId={topic.id} />
          </li>
        ))}
      </ol>
    </main>
  );
}
