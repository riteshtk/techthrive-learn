"use client";

import Link from "next/link";
import { continueTarget } from "@/lib/roadmap";
import { useProgress } from "@/lib/useProgress";

/** Prerendered as "Continue" to topic 1, then follows stored progress. */
export function ContinueLink({
  topics,
}: {
  topics: { id: string; title: string }[];
}) {
  const ids = topics.map((t) => t.id);
  const target = continueTarget(ids, useProgress(ids) ?? []);
  if (!target) return null;
  const title = topics.find((t) => t.id === target.topicId)?.title;
  return (
    <Link
      href={`/topics/${target.topicId}/`}
      className="button button-primary"
      data-testid="continue"
    >
      {target.label}: {title}
    </Link>
  );
}
