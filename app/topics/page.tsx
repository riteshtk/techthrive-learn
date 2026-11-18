import type { Metadata } from "next";
import { CatalogView } from "@/components/topic/CatalogView";
import { PageHeader } from "@/components/ui/display";
import {
  durationLabel,
  getFacts,
  getPlannedTopics,
  getTopics,
  oldestReadOn,
} from "@/content";
import { DOMAINS } from "@/content/types";
import type { CatalogEntry } from "@/lib/catalog";
import { formatDate } from "@/lib/dates";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Topics",
  description:
    "Every topic, each built around one production system with an interactive diagram and sourced facts.",
  path: "/topics/",
});

export default function CatalogPage() {
  const entries: CatalogEntry[] = [
    ...getTopics()
      .filter((t) => t.status === "live")
      .map((t) => {
        const minutes = t.lessons.reduce((m, l) => m + l.minutes, 0);
        const verified = oldestReadOn(getFacts(t.id));
        return {
          id: t.id,
          title: t.title,
          domain: t.domain,
          system: t.summary,
          tags: t.tags,
          status: "live" as const,
          meta: `${t.lessons.length} lessons · ${durationLabel(minutes)}`,
          freshness: verified ? `Verified ${formatDate(verified)}` : undefined,
          href: `/topics/${t.id}/`,
        };
      }),
    ...getPlannedTopics().map((p) => ({
      id: p.id,
      title: p.title,
      domain: p.domain,
      system: p.system,
      tags: p.tags,
      status: "planned" as const,
      meta: `${p.plannedLessons} lessons planned`,
      freshness: p.plannedFor ? `Planned ${p.plannedFor}` : undefined,
    })),
  ];

  return (
    <main className="tt-cat-page">
      <PageHeader
        eyebrow="Learn"
        title="Design complex systems, one real system at a time."
        lede="Each topic is built around one production system, with an interactive 2D/3D diagram, sourced facts that stay current, labs and checkpoints."
      />
      <CatalogView entries={entries} domains={DOMAINS} />
      <p className="tt-cap tt-cat-note">
        Live topics have every fact sourced and dated. Planned topics are shown
        so you can see what’s coming; their content isn’t published yet.
      </p>
    </main>
  );
}
