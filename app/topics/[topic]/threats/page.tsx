import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopicBar } from "@/components/shell/TopicBar";
import { ThreatModel } from "@/components/topic/ThreatModel";
import { PageHeader } from "@/components/ui/display";
import {
  getFacts,
  getTool,
  getTopic,
  getTopics,
  oldestReadOn,
} from "@/content";
import { pageMetadata } from "@/lib/metadata";
import { STATUS, type Status } from "@/lib/threats";

export const dynamicParams = false;

export function generateStaticParams() {
  return getTopics()
    .filter((t) => getTool(t.id, "threats"))
    .map((t) => ({ topic: t.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/topics/[topic]/threats">): Promise<Metadata> {
  const topic = getTopic((await params).topic);
  if (!topic) return {};
  return pageMetadata({
    title: `${topic.switcherLabel}: threat model`,
    description:
      "The OWASP Top 10 for Agentic Applications 2026 applied to the card-dispute agent: controls, tests, owners and where each risk lands.",
    path: `/topics/${topic.id}/threats/`,
  });
}

export default async function ThreatsPage({
  params,
}: PageProps<"/topics/[topic]/threats">) {
  const { topic: id } = await params;
  const topic = getTopic(id);
  const data = getTool(id, "threats");
  if (!topic || !data) notFound();
  const count = (s: Status) => data.risks.filter((r) => r.status === s).length;

  return (
    <>
      <TopicBar
        topicId={topic.id}
        title={topic.switcherLabel}
        tabs={topic.tabs}
        active="threats"
        verifiedOn={oldestReadOn(getFacts(topic.id))}
      />
      <main className="tt-thr-page">
        <PageHeader
          eyebrow="Threat model"
          title={`${data.risks.length === 10 ? "Ten" : data.risks.length} ways this agent gets abused`}
          lede={data.intro}
          actions={
            <dl className="tt-card tt-thr-counts">
              {(Object.keys(STATUS) as Status[]).map((s) => (
                <div key={s}>
                  <dt className="tt-lbl-s">{STATUS[s]}</dt>
                  <dd className={`tt-num tt-thr-count st-${s}`}>{count(s)}</dd>
                </div>
              ))}
            </dl>
          }
        />
        <ThreatModel data={data} />
      </main>
    </>
  );
}
