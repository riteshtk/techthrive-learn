import type { Metadata } from "next";
import { PageIcon } from "@/components/ui/PageIcon";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TopicBar } from "@/components/shell/TopicBar";
import { PrintButton } from "@/components/topic/PrintButton";
import { SheetsView } from "@/components/topic/SheetsView";
import { PageHeader } from "@/components/ui/display";
import {
  getFacts,
  getTool,
  getTopic,
  getTopics,
  oldestReadOn,
} from "@/content";
import { formatDate } from "@/lib/dates";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return getTopics()
    .filter((t) => getTool(t.id, "sheets"))
    .map((t) => ({ topic: t.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/topics/[topic]/sheets">): Promise<Metadata> {
  const topic = getTopic((await params).topic);
  if (!topic) return {};
  return pageMetadata({
    title: `${topic.switcherLabel}: cheatsheets`,
    description: `${topic.switcherLabel} on one printable page: prices, risk lists, protocols, telemetry, evals and the regulation clock.`,
    path: `/topics/${topic.id}/sheets/`,
  });
}

export default async function SheetsPage({
  params,
}: PageProps<"/topics/[topic]/sheets">) {
  const { topic: id } = await params;
  const topic = getTopic(id);
  const data = getTool(id, "sheets");
  if (!topic || !data) notFound();
  const facts = getFacts(id);
  const used = new Set(data.sheets.flatMap((s) => s.facts));
  const readOn = oldestReadOn(facts.filter((f) => used.has(f.id)));

  return (
    <>
      <TopicBar
        topicId={topic.id}
        title={topic.switcherLabel}
        tabs={topic.tabs}
        active="sheets"
        verifiedOn={oldestReadOn(facts)}
      />
      <main className="tt-sh-page">
        <PageHeader
          eyebrow={`Reference · ${topic.switcherLabel}`}
          title={data.title}
          lede={`${data.intro}${readOn ? ` Read ${formatDate(readOn)}.` : ""}`}
          actions={
            <>
              <Link
                href={`/topics/${topic.id}/sources/`}
                className="tt-btn tt-btn-sm"
              >
                <PageIcon name="link" />
                Sources
              </Link>
              <PrintButton />
            </>
          }
        />
        <SheetsView
          topic={topic.id}
          data={data}
          threats={getTool(id, "threats")}
          governance={getTool(id, "governance")}
        />
      </main>
    </>
  );
}
