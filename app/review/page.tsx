import type { Metadata } from "next";
import {
  ReviewSession,
  type ReviewCard,
} from "@/components/review/ReviewSession";
import { getTools, getTopics } from "@/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Review",
  description:
    "Spaced-repetition review of the facts in your topics, scheduled in your browser.",
  path: "/review/",
});

export default function ReviewPage() {
  const cards: ReviewCard[] = getTopics()
    .filter((t) => t.status === "live")
    .flatMap((t) =>
      getTools(t.id).flatMap((tool) =>
        tool.kind === "cards"
          ? tool.cards.map((c) => ({
              key: `${t.id}/${c.id}`,
              topic: t.switcherLabel,
              area: c.area,
              source: c.source,
              q: c.q,
              a: c.a,
            }))
          : [],
      ),
    );
  return (
    <main className="tt-rv-page">
      <header>
        <p className="tt-lbl">Review</p>
        <h1 className="tt-h1 tt-rv-h1">Keep it fresh</h1>
        <p className="tt-body-s">
          {cards.length} cards from your topics, spaced so you see each one just
          before you’d forget it. Your schedule stays in this browser.
        </p>
      </header>
      <ReviewSession cards={cards} />
    </main>
  );
}
