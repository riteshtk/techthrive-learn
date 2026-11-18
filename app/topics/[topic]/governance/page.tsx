import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopicBar } from "@/components/shell/TopicBar";
import { GovernanceView } from "@/components/topic/GovernanceView";
import { PageHeader } from "@/components/ui/display";
import {
  getFacts,
  getTool,
  getTopic,
  getTopics,
  oldestReadOn,
} from "@/content";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return getTopics()
    .filter((t) => getTool(t.id, "governance"))
    .map((t) => ({ topic: t.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/topics/[topic]/governance">): Promise<Metadata> {
  const topic = getTopic((await params).topic);
  if (!topic) return {};
  return pageMetadata({
    title: `${topic.switcherLabel}: governance`,
    description:
      "India, EU and UK rules plus voluntary frameworks for a bank's AI agent: a dated timeline, penalty ceilings and a controls crosswalk.",
    path: `/topics/${topic.id}/governance/`,
  });
}

export default async function GovernancePage({
  params,
}: PageProps<"/topics/[topic]/governance">) {
  const { topic: id } = await params;
  const topic = getTopic(id);
  const data = getTool(id, "governance");
  if (!topic || !data) notFound();

  return (
    <>
      <TopicBar
        topicId={topic.id}
        title={topic.switcherLabel}
        tabs={topic.tabs}
        active="governance"
        verifiedOn={oldestReadOn(getFacts(topic.id))}
      />
      <main className="tt-gov-page">
        <PageHeader
          eyebrow="Governance"
          title="What applies to a bank’s agent, and when"
          lede={data.intro}
        />
        <GovernanceView data={data} />
      </main>
    </>
  );
}
