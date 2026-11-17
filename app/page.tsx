import Link from "next/link";
import { ProgressCount } from "@/components/ProgressCount";
import { ResetProgress } from "@/components/ResetProgress";
import { getRoadmaps } from "@/content";

export default function Home() {
  const roadmaps = getRoadmaps();
  return (
    <main className="page">
      <h1>Pick a roadmap</h1>
      <p className="lede">
        Each topic explains itself as a diagram you step through, one sentence
        at a time. Free, no account.
      </p>
      <ul className="card-list">
        {roadmaps.map((roadmap) => (
          <li key={roadmap.id} className="card">
            <h2>
              <Link href={`/roadmaps/${roadmap.id}/`} className="card-link">
                {roadmap.title}
              </Link>
            </h2>
            <p>{roadmap.goal}</p>
            <p className="meta">
              {roadmap.topics.length}{" "}
              {roadmap.topics.length === 1 ? "topic" : "topics"}
            </p>
            <ProgressCount topicIds={roadmap.topics} />
          </li>
        ))}
      </ul>
      <ResetProgress
        topicIds={[...new Set(roadmaps.flatMap((r) => r.topics))]}
      />
    </main>
  );
}
