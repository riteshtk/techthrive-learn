import Link from "next/link";
import { BrandImage } from "@/components/BrandImage";
import { ProgressCount } from "@/components/ProgressCount";
import { ResetProgress } from "@/components/ResetProgress";
import { getRoadmaps, roadmapTopics } from "@/content/v1";
import { levelLabel } from "@/lib/roadmap";

export default function Home() {
  const roadmaps = getRoadmaps();
  return (
    <main className="page">
      <section className="hero">
        <BrandImage kind="mark" height={72} alt="" className="hero-mark" />
        <h1>System design and AI, one step at a time</h1>
        <p className="lede">
          Pick a roadmap, open a topic, and watch the idea explain itself as a
          diagram you step through, one sentence at a time. Free, no account.
        </p>
      </section>

      <h2>Roadmaps</h2>
      <ul className="card-list">
        {roadmaps.map((roadmap) => {
          const topics = roadmapTopics(roadmap);
          return (
            <li key={roadmap.id} className="card roadmap-card">
              <h3>
                <Link href={`/roadmaps/${roadmap.id}/`} className="card-link">
                  {roadmap.title}
                </Link>
              </h3>
              <p>{roadmap.goal}</p>
              <ol className="card-topics">
                {topics.map((topic) => (
                  <li key={topic.id}>
                    {topic.title}{" "}
                    <span className="meta">· {levelLabel[topic.level]}</span>
                  </li>
                ))}
              </ol>
              <div className="card-footer">
                <ProgressCount topicIds={roadmap.topics} />
                <p className="meta">
                  {roadmap.topics.length}{" "}
                  {roadmap.topics.length === 1 ? "topic" : "topics"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <ResetProgress
        topicIds={[...new Set(roadmaps.flatMap((r) => r.topics))]}
      />
    </main>
  );
}
