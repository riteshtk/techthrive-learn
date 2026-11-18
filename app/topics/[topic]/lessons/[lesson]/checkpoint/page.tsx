import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopicBar } from "@/components/shell/TopicBar";
import {
  getCheckpoint,
  getFacts,
  getLesson,
  getLessons,
  getTopic,
  oldestReadOn,
} from "@/content";
import { pageMetadata } from "@/lib/metadata";
import { CheckpointPlayer } from "@/player/CheckpointPlayer";

export const dynamicParams = false;

export function generateStaticParams() {
  return getLessons()
    .filter((l) => getCheckpoint(l.topic, l.id))
    .map((l) => ({ topic: l.topic, lesson: l.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/topics/[topic]/lessons/[lesson]/checkpoint">): Promise<Metadata> {
  const { topic: topicId, lesson: lessonId } = await params;
  const outline = getTopic(topicId)?.lessons.find((l) => l.id === lessonId);
  if (!outline) return {};
  return pageMetadata({
    title: `Checkpoint: ${outline.title}`,
    description: `Three questions on “${outline.title}”. The first answer counts; 80% passes.`,
    path: `/topics/${topicId}/lessons/${lessonId}/checkpoint/`,
  });
}

export default async function CheckpointPage({
  params,
}: PageProps<"/topics/[topic]/lessons/[lesson]/checkpoint">) {
  const { topic: topicId, lesson: lessonId } = await params;
  const topic = getTopic(topicId);
  const lesson = getLesson(topicId, lessonId);
  const checkpoint = getCheckpoint(topicId, lessonId);
  const outline = topic?.lessons.find((l) => l.id === lessonId);
  if (!topic || !lesson || !checkpoint || !outline) notFound();

  return (
    <>
      <TopicBar
        topicId={topic.id}
        title={topic.switcherLabel}
        tabs={topic.tabs}
        active="lessons"
        verifiedOn={oldestReadOn(getFacts(topic.id))}
      />
      <main className="tt-cp-page">
        <CheckpointPlayer
          checkpoint={checkpoint}
          lesson={{
            title: outline.title,
            path: `/topics/${topic.id}/lessons/${lesson.id}/`,
            steps: lesson.steps.map((s) => s.short),
          }}
        />
      </main>
    </>
  );
}
