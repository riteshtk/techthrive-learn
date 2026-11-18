import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopicBar } from "@/components/shell/TopicBar";
import { Overview, type OverviewData } from "@/components/topic/Overview";
import {
  getDiagram,
  getFacts,
  getLessons,
  getTopic,
  getTopics,
  oldestReadOn,
} from "@/content";
import { getTopics as getV1Topics } from "@/content/v1";
import { pageMetadata } from "@/lib/metadata";
import { DIAGRAM_ICON_PATHS } from "@/player/diagramIcons";
import { drawDiagram } from "@/player/drawing";
import { v1Metadata, V1Topic } from "./V1Topic";

export const dynamicParams = false;

/** Live v2 topics, plus the v1 topic addresses until P17 redirects them. */
export function generateStaticParams() {
  return [
    ...getTopics()
      .filter((t) => t.status === "live")
      .map((t) => ({ topic: t.id })),
    ...getV1Topics().map((t) => ({ topic: t.id })),
  ];
}

export async function generateMetadata({
  params,
}: PageProps<"/topics/[topic]">): Promise<Metadata> {
  const id = (await params).topic;
  const topic = getTopic(id);
  if (!topic) return v1Metadata(id);
  return pageMetadata({
    title: topic.title,
    description: topic.summary,
    path: `/topics/${topic.id}/`,
  });
}

export default async function TopicPage({
  params,
}: PageProps<"/topics/[topic]">) {
  const id = (await params).topic;
  const topic = getTopic(id);
  if (!topic) return <V1Topic id={id} />;
  const o = topic.overview;
  const diagram = o && getDiagram(topic.id, o.diagram);
  if (!o || !diagram) notFound();

  const lessons = getLessons(topic.id);
  const built = topic.lessons.flatMap((l, i) =>
    lessons.some((x) => x.id === l.id)
      ? [{ id: l.id, n: i + 1, ctaName: l.ctaName ?? l.title }]
      : [],
  );
  // The lesson that builds this system: which parts were already there,
  // and the step that adds each of the others.
  const builder = lessons.find((l) => l.diagram === diagram.id);
  const edges = Object.keys(diagram.paths2);
  const facts = Object.fromEntries(getFacts(topic.id).map((f) => [f.id, f]));
  const data: OverviewData = {
    topic,
    built,
    facts,
    hero: {
      caption: diagram.caption,
      components: builder
        ? builder.nodes.filter((n) => n.addedAt > 1).length
        : diagram.nodes.length,
      drawing: drawDiagram(diagram, edges, DIAGRAM_ICON_PATHS),
      portrait: diagram.portrait
        ? drawDiagram(diagram, edges, DIAGRAM_ICON_PATHS, { portrait: true })
        : undefined,
      edges,
      bypass: builder?.bypass,
      trace: o.heroTrace,
      names: Object.fromEntries(diagram.nodes.map((n) => [n.id, n.label])),
      links: builder
        ? Object.fromEntries(
            builder.nodes.map((n) => [
              n.id,
              `/topics/${topic.id}/lessons/${builder.id}/?step=${n.addedAt}`,
            ]),
          )
        : {},
    },
  };

  return (
    <>
      <TopicBar
        topicId={topic.id}
        title={topic.switcherLabel}
        tabs={topic.tabs}
        active="overview"
        verifiedOn={oldestReadOn(Object.values(facts))}
      />
      <Overview data={data} />
    </>
  );
}
