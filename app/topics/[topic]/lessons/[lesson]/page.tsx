import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCheckpoint,
  getDiagram,
  getFact,
  getFacts,
  getLesson,
  getLessons,
  getTopic,
  oldestReadOn,
} from "@/content";
import { formatDate } from "@/lib/dates";
import { pageMetadata } from "@/lib/metadata";
import { withBase } from "@/lib/paths";
import { TopicBar } from "@/components/shell/TopicBar";
import { DIAGRAM_ICON_PATHS } from "@/player/diagramIcons";
import { drawDiagram } from "@/player/drawing";
import type { LessonPageData, StepSource } from "@/player/lessonData";
import { LessonPlayer } from "@/player/LessonPlayer";
import { LessonHeading, LessonLegend } from "@/player/lesson/LessonStatic";

export const dynamicParams = false;

export function generateStaticParams() {
  return getLessons().map((l) => ({ topic: l.topic, lesson: l.id }));
}

const LEVEL: Record<string, string> = {
  foundation: "Foundation",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export async function generateMetadata({
  params,
}: PageProps<"/topics/[topic]/lessons/[lesson]">): Promise<Metadata> {
  const { topic: topicId, lesson: lessonId } = await params;
  const topic = getTopic(topicId);
  const outline = topic?.lessons.find((l) => l.id === lessonId);
  if (!topic || !outline) return {};
  return pageMetadata({
    title: outline.title,
    description: outline.summary,
    path: `/topics/${topic.id}/lessons/${lessonId}/`,
  });
}

/** Narration files live at public/audio/<topic>/<lesson>/<NN>.mp3. */
function narrationOf(topic: string, lesson: string, steps: number) {
  return Array.from({ length: steps }, (_, i) => {
    const file = `/audio/${topic}/${lesson}/${String(i + 1).padStart(2, "0")}.mp3`;
    return existsSync(join(process.cwd(), "public", file))
      ? withBase(file)
      : null;
  });
}

export default async function LessonPage({
  params,
}: PageProps<"/topics/[topic]/lessons/[lesson]">) {
  const { topic: topicId, lesson: lessonId } = await params;
  const topic = getTopic(topicId);
  const lesson = getLesson(topicId, lessonId);
  const diagram = lesson && getDiagram(topicId, lesson.diagram);
  if (!topic || !lesson || !diagram) notFound();

  const position = topic.lessons.findIndex((l) => l.id === lesson.id);
  const outline = topic.lessons[position]!;

  // Each step's sources, from the facts register: one card per source.
  const sources: StepSource[][] = lesson.steps.map((step) => {
    const seen = new Set<string>();
    return step.facts.flatMap((id) => {
      const fact = getFact(id);
      if (!fact) return [];
      // Facts read from the same page share a card; each teaching figure
      // gets its own.
      const key = fact.url ?? fact.id;
      if (seen.has(key)) return [];
      seen.add(key);
      return [
        {
          title: fact.title ?? fact.source,
          detail:
            fact.kind === "real"
              ? `${fact.value} · read ${formatDate(fact.readOn)}`
              : fact.value,
          url: fact.url,
        },
      ];
    });
  });

  const checkpoint = getCheckpoint(topic.id, lesson.id);
  const data: LessonPageData = {
    topic: {
      id: topic.id,
      title: topic.switcherLabel,
      tabs: topic.tabs,
      verifiedOn: oldestReadOn(getFacts(topic.id)),
    },
    lesson,
    drawing: drawDiagram(diagram, lesson.edges, DIAGRAM_ICON_PATHS),
    caption: diagram.caption,
    outline: {
      title: outline.title,
      minutes: outline.minutes,
      level: LEVEL[topic.level] ?? topic.level,
      position: position + 1,
      count: topic.lessons.length,
    },
    sources,
    audio: narrationOf(topic.id, lesson.id, lesson.steps.length),
    finish: checkpoint
      ? {
          label: "Take the checkpoint",
          href: `/topics/${topic.id}/lessons/${lesson.id}/checkpoint/`,
        }
      : { label: "Back to the topic", href: `/topics/${topic.id}/` },
    sandbox: lesson.sandbox,
  };

  return (
    <>
      <TopicBar
        topicId={topic.id}
        title={topic.switcherLabel}
        tabs={topic.tabs}
        active="lessons"
        verifiedOn={data.topic.verifiedOn}
      />
      <LessonPlayer
        data={data}
        heading={<LessonHeading topic={data.topic} outline={data.outline} />}
        legend={<LessonLegend legend={lesson.legend} />}
      />
    </>
  );
}
