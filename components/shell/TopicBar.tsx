"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/icons";
import { formatDate } from "@/lib/dates";

/** The sections a topic can have, in the design's order. Interview arrives
    in phase 2 and is not offered until then (no dead links). */
export const TOPIC_TABS = {
  overview: { label: "Overview", icon: "home", path: "" },
  lessons: { label: "Lessons", icon: "book", path: "lessons/" },
  cost: { label: "Cost", icon: "bar-chart", path: "cost/" },
  threats: { label: "Threats", icon: "shield", path: "threats/" },
  governance: { label: "Governance", icon: "award", path: "governance/" },
  lab: { label: "Lab", icon: "grid", path: "lab/" },
  sheets: { label: "Sheets", icon: "sheet", path: "sheets/" },
} as const satisfies Record<
  string,
  { label: string; icon: IconName; path: string }
>;

export type TopicTab = keyof typeof TOPIC_TABS;

/** Which tab a path is in: the longest tab path that prefixes it. Lessons
    and checkpoints count as Lessons; sources has no tab. */
export function activeTopicTab(
  topicId: string,
  tabs: readonly TopicTab[],
  pathname: string,
): TopicTab | null {
  const base = `/topics/${topicId}/`;
  if (!pathname.startsWith(base)) return null;
  const rest = pathname.slice(base.length);
  if (rest === "") return tabs.includes("overview") ? "overview" : null;
  let best: TopicTab | null = null;
  for (const tab of tabs) {
    const path = TOPIC_TABS[tab].path;
    if (path && rest.startsWith(path)) {
      if (!best || path.length > TOPIC_TABS[best].path.length) best = tab;
    }
  }
  return best;
}

/** The bar under the top bar on every topic page (spec 01 §A8 TopicBar). */
export function TopicBar({
  topicId,
  title,
  tabs,
  verifiedOn,
}: {
  topicId: string;
  title: string;
  tabs: readonly TopicTab[];
  /** The oldest read date of the facts on this topic's pages. */
  verifiedOn?: string;
}) {
  const pathname = usePathname();
  const active = activeTopicTab(topicId, tabs, pathname);
  return (
    <div className="tt-topicbar">
      <Link
        href="/topics/"
        className="tt-tsw"
        aria-label={`Topic: ${title}. Switch topic`}
      >
        <span className="tt-lbl-s">Topic</span>
        <b>{title}</b>
        <Icon name="chevron-down" />
      </Link>
      <span className="tt-sep-v" aria-hidden="true" />
      <nav className="tt-nav tt-nav-s" aria-label={`${title} sections`}>
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={`/topics/${topicId}/${TOPIC_TABS[tab].path}`}
            className="tt-navlink"
            aria-current={tab === active ? "page" : undefined}
          >
            <Icon name={TOPIC_TABS[tab].icon} />
            {TOPIC_TABS[tab].label}
          </Link>
        ))}
      </nav>
      <div className="tt-topicbar-spacer" />
      {verifiedOn && (
        <Link
          href={`/topics/${topicId}/sources/`}
          className="tt-chip tt-verified"
          title="Every figure is sourced and dated"
        >
          <Icon name="check" />
          Verified {formatDate(verifiedOn)}
        </Link>
      )}
    </div>
  );
}
