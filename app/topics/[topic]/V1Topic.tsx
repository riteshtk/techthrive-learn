import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopic, homeRoadmapOf } from "@/content/v1";
import { Icon } from "@/components/Icon";
import { formatDate } from "@/lib/dates";
import { pageMetadata } from "@/lib/metadata";
import { levelLabel } from "@/lib/roadmap";
import { layoutDiagram, NARROW, WIDE } from "@/player/geometry";
// Lazy, so v2 overviews on the same route don't ship the v1 player.
import { LazyV1Player as Player } from "@/player/LazyPlayers";

// A v1 topic page, kept at its v1 address until Foundations replaces it
// (P17 turns these addresses into redirects).
export function v1Metadata(id: string): Metadata {
  const topic = getTopic(id);
  return topic
    ? pageMetadata({
        title: topic.title,
        description: topic.summary,
        path: `/topics/${topic.id}/`,
      })
    : {};
}

export function V1Topic({ id }: { id: string }) {
  const topic = getTopic(id);
  if (!topic) notFound();
  const roadmap = homeRoadmapOf(topic.id);
  const position = roadmap ? roadmap.topics.indexOf(topic.id) + 1 : 0;
  // Laid out at build time so the geometry code never ships to the browser.
  const layouts = {
    narrow: layoutDiagram(topic.diagram.nodes, topic.diagram.edges, NARROW),
    wide: layoutDiagram(topic.diagram.nodes, topic.diagram.edges, WIDE),
  };

  return (
    <main className="page page-topic">
      <header className="lesson-head">
        <p className="breadcrumb">
          {roadmap ? (
            <>
              <Link href={`/roadmaps/${roadmap.id}/`}>{roadmap.title}</Link>
              <span aria-hidden="true"> / </span>
              <span>
                Topic {position} of {roadmap.topics.length}
              </span>
            </>
          ) : null}
        </p>
        <h1>{topic.title}</h1>
        <ul className="chips" aria-label="About this topic">
          <li>
            <Icon name="clock" size={14} /> {topic.minutes} min
          </li>
          <li>
            <Icon name="level" size={14} /> {levelLabel[topic.level]}
          </li>
          <li>
            <Icon name="steps" size={14} /> {topic.steps.length} steps
          </li>
        </ul>
      </header>
      <Player
        layouts={layouts}
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
