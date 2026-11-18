import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TopicBar } from "@/components/shell/TopicBar";
import { PageHeader } from "@/components/ui/display";
import { Icon } from "@/components/ui/Icon";
import {
  getCheckpoint,
  getFacts,
  getLessons,
  getTopic,
  getTools,
  getTopics,
  oldestReadOn,
} from "@/content";
import type { Checkpoint } from "@/content/types";
import { formatDate } from "@/lib/dates";
import { pageMetadata } from "@/lib/metadata";
import { sourcesPage, usesOf } from "@/lib/sources";

export const dynamicParams = false;

export function generateStaticParams() {
  return getTopics()
    .filter((t) => t.status === "live")
    .map((t) => ({ topic: t.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/topics/[topic]/sources">): Promise<Metadata> {
  const topic = getTopic((await params).topic);
  if (!topic) return {};
  return pageMetadata({
    title: `${topic.switcherLabel}: sources`,
    description: `Every figure in ${topic.switcherLabel}, with its source and the date it was read.`,
    path: `/topics/${topic.id}/sources/`,
  });
}

const KIND = {
  real: "",
  assumption: "Teaching assumption",
  derived: "Derived",
} as const;

export default async function SourcesPage({
  params,
}: PageProps<"/topics/[topic]/sources">) {
  const topic = getTopic((await params).topic);
  if (!topic) notFound();
  const lessons = getLessons(topic.id);
  const checkpoints = lessons
    .map((l) => getCheckpoint(topic.id, l.id))
    .filter((c): c is Checkpoint => !!c);
  const facts = getFacts(topic.id);
  const uses = usesOf(topic, lessons, checkpoints, getTools(topic.id));
  const page = sourcesPage(facts, uses);

  return (
    <>
      <TopicBar
        topicId={topic.id}
        title={topic.switcherLabel}
        tabs={topic.tabs}
        active={null}
        verifiedOn={oldestReadOn(facts)}
      />
      <main className="tt-sources">
        <PageHeader
          eyebrow={`Sources · ${topic.switcherLabel}`}
          title="Where every number comes from"
          lede="Every figure in this topic, with the page it was read from and the date it was read. Teaching assumptions are labelled as such."
          actions={
            <>
              <span className="tt-chip">{page.sourceCount} sources</span>
              {page.nextRecheck && (
                <span className="tt-chip">
                  Next re-check {formatDate(page.nextRecheck)}
                </span>
              )}
            </>
          }
        />
        {page.groups.map((g, gi) => (
          <section
            key={g.name}
            className="tt-card-l tt-src-group"
            aria-labelledby={`src-${gi}`}
          >
            <h2 id={`src-${gi}`} className="tt-h3 tt-src-head">
              {g.name}
            </h2>
            <table className="tt-src-table">
              <thead>
                <tr>
                  <th scope="col">Figure</th>
                  <th scope="col">What it says</th>
                  <th scope="col">Source</th>
                  <th scope="col">Used on</th>
                  <th scope="col">Read</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map(({ fact, host, usedOn }) => (
                  <tr key={fact.id} id={`fact-${fact.id}`}>
                    <td data-label="Figure" className="tt-src-value">
                      {fact.value}
                    </td>
                    <td data-label="What it says">{fact.claim}</td>
                    <td data-label="Source" className="tt-src-source">
                      {fact.url ? (
                        <>
                          <a
                            href={fact.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {fact.source}
                            <span className="sr-only">
                              {" "}
                              (opens in a new tab)
                            </span>
                          </a>
                          <span className="tt-src-host">{host}</span>
                        </>
                      ) : (
                        <>
                          <span>{fact.source}</span>
                          <span className="tt-src-host">{KIND[fact.kind]}</span>
                        </>
                      )}
                    </td>
                    <td data-label="Used on" className="tt-src-used">
                      {usedOn.length ? (
                        <ul>
                          {usedOn.map((u) => (
                            <li key={u.href}>
                              <Link href={u.href}>{u.label}</Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="tt-muted">Register only</span>
                      )}
                    </td>
                    <td data-label="Read" className="tt-src-read">
                      {formatDate(fact.readOn)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
        <p className="tt-panel-2 tt-src-note">
          <Icon name="shield" />
          <span>
            Each figure is re-read from its source by its re-check date.
            Regulatory summaries support engineering design and are not legal
            advice.
          </span>
        </p>
      </main>
    </>
  );
}
