import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopic, getTopics, homeRoadmapOf } from "@/content";
import { formatDate } from "@/lib/dates";
import { pageMetadata } from "@/lib/metadata";
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
  return topic
    ? pageMetadata({
        title: topic.title,
        description: topic.summary,
        path: `/topics/${topic.id}/`,
      })
    : {};
}

export default async function TopicPage({ params }: PageProps<"/topics/[id]">) {
  const topic = getTopic((await params).id);
  if (!topic) notFound();
  const roadmap = homeRoadmapOf(topic.id);
  // Laid out at build time so the geometry code never ships to the browser.
  const layout = layoutDiagram(topic.diagram.nodes, topic.diagram.edges);

  return (
    <main className="page">
      {/* Kept short above the player so, on a phone, the diagram, caption
          and controls fit on one screen. The summary follows the player. */}
      <p className="crumb crumb-row">
        {roadmap ? (
          <Link href={`/roadmaps/${roadmap.id}/`}>{roadmap.title}</Link>
        ) : null}
        <span className={`level level-${topic.level}`}>
          {levelLabel[topic.level]}
        </span>
      </p>
      <h1 className="topic-title">{topic.title}</h1>
      <Player
        layout={layout}
        steps={topic.steps}
        title={topic.title}
        topicId={topic.id}
        roadmapId={roadmap?.id}
      />
      <section aria-labelledby="about">
        <h2 id="about">About this topic</h2>
        <p className="lede">{topic.summary}</p>
      </section>
      <section aria-labelledby="all-steps">
        <h2 id="all-steps">All steps</h2>
        <ol className="all-steps">
          {topic.steps.map((step, i) => (
            <li key={i}>{step.text}</li>
          ))}
        </ol>
      </section>
      <section aria-labelledby="go-deeper">
        <h2 id="go-deeper">Go deeper</h2>
        {topic.video ? (
          <p>
            <a
              className="button"
              href={`https://www.youtube.com/watch?v=${topic.video.youtubeId}`}
              rel="noopener"
            >
              <span aria-hidden="true">▶</span> Watch on YouTube:{" "}
              {topic.video.title}
            </a>
          </p>
        ) : null}
        <h3>Sources</h3>
        <ul className="sources">
          {topic.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} rel="noopener">
                {source.title}
              </a>{" "}
              <span className="meta">(read {formatDate(source.read)})</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
