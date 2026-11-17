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
      <Player
        layout={layout}
        steps={topic.steps}
        title={topic.title}
        topicId={topic.id}
        roadmapId={roadmap?.id}
      />
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
