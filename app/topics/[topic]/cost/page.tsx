import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TopicBar } from "@/components/shell/TopicBar";
import { PageHeader } from "@/components/ui/display";
import { getFacts, getTopic, getTopics, oldestReadOn } from "@/content";
import { CLAUDE_PRICES_READ_ON } from "@/lib/claudePrices";
import { formatDate } from "@/lib/dates";
import { pageMetadata } from "@/lib/metadata";
import { CostModel } from "@/components/topic/CostModel";

export const dynamicParams = false;

export function generateStaticParams() {
  return getTopics()
    .filter((t) => t.status === "live" && t.tabs.includes("cost"))
    .map((t) => ({ topic: t.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/topics/[topic]/cost">): Promise<Metadata> {
  const topic = getTopic((await params).topic);
  if (!topic) return {};
  return pageMetadata({
    title: `${topic.switcherLabel}: cost model`,
    description:
      "What the card-dispute agent costs on Claude's published rates: per conversation, day and month, with caching, routing and batch.",
    path: `/topics/${topic.id}/cost/`,
  });
}

export default async function CostPage({
  params,
}: PageProps<"/topics/[topic]/cost">) {
  const topic = getTopic((await params).topic);
  if (!topic || !topic.tabs.includes("cost")) notFound();
  const readOn = formatDate(CLAUDE_PRICES_READ_ON);

  return (
    <>
      <TopicBar
        topicId={topic.id}
        title={topic.switcherLabel}
        tabs={topic.tabs}
        active="cost"
        verifiedOn={oldestReadOn(getFacts(topic.id))}
      />
      <main className="tt-cost-page">
        <PageHeader
          eyebrow="Cost model"
          title="What will this agent cost?"
          lede={
            <>
              Anthropic’s published Claude prices, read {readOn}. Change any
              input; everything recalculates. Every rate is on the{" "}
              <Link href={`/topics/${topic.id}/sources/`}>Sources</Link> page.
            </>
          }
        />
        <CostModel readOn={readOn} />
      </main>
    </>
  );
}
