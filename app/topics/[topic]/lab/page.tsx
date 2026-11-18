import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TopicBar } from "@/components/shell/TopicBar";
import { LabView } from "@/components/topic/LabView";
import { Icon } from "@/components/ui/Icon";
import {
  getDiagram,
  getFacts,
  getTool,
  getTopic,
  getTopics,
  oldestReadOn,
} from "@/content";
import { money, tokensShort } from "@/lib/costModel";
import { costReport, DEFAULT_INPUTS, PEAK_FACTOR } from "@/lib/costScenario";
import { MODELS } from "@/lib/claudePrices";
import { pageMetadata } from "@/lib/metadata";
import { DIAGRAM_ICON_PATHS } from "@/player/diagramIcons";
import { drawDiagram } from "@/player/drawing";

export const dynamicParams = false;

export function generateStaticParams() {
  return getTopics()
    .filter((t) => getTool(t.id, "lab"))
    .map((t) => ({ topic: t.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/topics/[topic]/lab">): Promise<Metadata> {
  const topic = getTopic((await params).topic);
  if (!topic) return {};
  return pageMetadata({
    title: `${topic.switcherLabel}: design lab`,
    description:
      "The card-dispute agent's reference architecture in 2D and 3D, with what each component does and what to watch for.",
    path: `/topics/${topic.id}/lab/`,
  });
}

export default async function LabPage({
  params,
}: PageProps<"/topics/[topic]/lab">) {
  const { topic: id } = await params;
  const topic = getTopic(id);
  const lab = getTool(id, "lab");
  const diagram = lab && getDiagram(id, lab.diagram);
  if (!topic || !lab || !diagram) notFound();
  const edges = Object.keys(diagram.paths2);
  const phone = diagram.portrait || diagram.portrait2;
  const hero = {
    caption: "Reference architecture",
    components: diagram.nodes.length,
    drawing: drawDiagram(diagram, edges, DIAGRAM_ICON_PATHS),
    portrait: phone
      ? drawDiagram(diagram, edges, DIAGRAM_ICON_PATHS, { portrait: true })
      : undefined,
    edges,
    trace: lab.trace,
    names: Object.fromEntries(diagram.nodes.map((n) => [n.id, n.name2])),
    links: {},
  };
  // The capacity card reads the cost model's default scenario.
  const i = DEFAULT_INPUTS;
  const r = costReport(i);
  const turnsPeak = ((i.conversations * i.turns) / 1440) * PEAK_FACTOR;

  return (
    <>
      <TopicBar
        topicId={topic.id}
        title={topic.switcherLabel}
        tabs={topic.tabs}
        active="lab"
        verifiedOn={oldestReadOn(getFacts(topic.id))}
      />
      <main className="tt-lab-page">
        <header className="tt-lab-head">
          <div className="tt-lab-title">
            <span className="tt-sq" aria-hidden="true">
              <Icon name="grid" />
            </span>
            <div>
              <h1 className="tt-h3">{lab.title}</h1>
              <p className="tt-cap">
                {diagram.nodes.length} components · {lab.intro}
              </p>
            </div>
          </div>
          <span className="tt-chip">Goal · {lab.goal}</span>
          <div className="tt-lab-links">
            {topic.tabs.includes("threats") && (
              <Link
                href={`/topics/${topic.id}/threats/`}
                className="tt-btn tt-btn-sm"
              >
                <Icon name="shield" />
                Threat model
              </Link>
            )}
            {topic.tabs.includes("cost") && (
              <Link
                href={`/topics/${topic.id}/cost/`}
                className="tt-btn tt-btn-sm"
              >
                <Icon name="bar-chart" />
                Cost it
              </Link>
            )}
          </div>
        </header>
        <LabView topic={topic.id} lab={lab} hero={hero} />
        {topic.tabs.includes("cost") && (
          <section className="tt-card tt-lab-cap" aria-labelledby="cap-title">
            <div className="tt-lab-cap-head">
              <h2 id="cap-title" className="tt-lbl-s">
                Capacity · at {PEAK_FACTOR}× peak
              </h2>
              <span className="tt-chip">From the cost model</span>
            </div>
            <dl className="tt-lab-cap-grid">
              <div>
                <dt className="tt-lbl-s">Turns / min</dt>
                <dd className="tt-num">{Math.round(turnsPeak)}</dd>
              </div>
              <div>
                <dt className="tt-lbl-s">Input tok / min</dt>
                <dd className="tt-num">{tokensShort(r.capacity.itpmPeak)}</dd>
              </div>
              <div>
                <dt className="tt-lbl-s">Output tok / min</dt>
                <dd className="tt-num">{tokensShort(r.capacity.otpmPeak)}</dd>
              </div>
              <div>
                <dt className="tt-lbl-s">Model cost / month</dt>
                <dd className="tt-num">{money(r.perMonth)}</dd>
              </div>
            </dl>
            <p className="tt-cap">
              {i.conversations.toLocaleString("en-US")} conversations a day,{" "}
              {i.turns} turns, {MODELS[i.model].name} with a {i.hit}%
              prompt-cache hit.{" "}
              <Link href={`/topics/${topic.id}/cost/`}>
                Change it in the cost model
              </Link>
              .
            </p>
          </section>
        )}
      </main>
    </>
  );
}
