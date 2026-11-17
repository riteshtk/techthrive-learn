import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopic, getTopics, homeRoadmapOf } from "@/content";
import { levelLabel } from "@/lib/roadmap";
import { layoutDiagram } from "@/player/geometry";
import { Player } from "@/player/Player";

export const dynamicParams = false;

export function generateStaticParams() {
  return getTopics().map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/topics/[id]">): Promise<Metadata> {
  const topic = getTopic((await params).id);
  return topic ? { title: topic.title, description: topic.summary } : {};
}

export default async function TopicPage({ params }: PageProps<"/topics/[id]">) {
  const topic = getTopic((await params).id);
  if (!topic) notFound();
  const roadmap = homeRoadmapOf(topic.id);
  // Laid out at build time so the geometry code never ships to the browser.
  const layout = layoutDiagram(topic.diagram.nodes, topic.diagram.edges);

  return (
    <main className="page">
      {roadmap ? (
        <p className="crumb">
          <Link href={`/roadmaps/${roadmap.id}/`}>{roadmap.title}</Link>
        </p>
      ) : null}
      <h1>{topic.title}</h1>
      <p className="meta">
        <span className={`level level-${topic.level}`}>
          {levelLabel[topic.level]}
        </span>
      </p>
      <p className="lede">{topic.summary}</p>
      <Player layout={layout} steps={topic.steps} title={topic.title} />
    </main>
  );
}
