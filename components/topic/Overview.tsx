// A topic's overview page (spec 03 §3–4): one engine for both designed
// layouts. "grid" is the AI agents board (stat cards, brief and current-
// with, lesson cards, footer); "list" the payments board (lesson rows with
// an aside, and the topic's facts). Everything except the hero diagram and
// the next-lesson button renders on the server.

import Link from "next/link";
import { BrandImage } from "@/components/BrandImage";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/icons";
import { AnyIcon, type PageIconName } from "@/components/ui/PageIcon";
import { TOPIC_TABS } from "@/components/shell/TopicBar";
import { durationLabel } from "@/content";
import type { Fact, Topic } from "@/content/types";
import { formatDate } from "@/lib/dates";
import type { HeroData } from "@/player/HeroDiagram";
import { LazyHeroDiagram as HeroDiagram } from "@/player/LazyPlayers";
import { NextLessonButton, type BuiltLesson } from "./NextLessonButton";

export type OverviewData = {
  topic: Topic;
  /** Lessons with pages, in course order. */
  built: BuiltLesson[];
  hero: HeroData;
  /** The topic's facts, for source lines and the facts list. */
  facts: Record<string, Fact>;
};

const LEVEL: Record<Topic["level"], string> = {
  foundation: "Foundation",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

/** "Gartner · read 18 Nov 2026": a stat's first fact. */
function sourceLine(fact: Fact | undefined): string {
  return fact
    ? `${fact.title ?? fact.source} · read ${formatDate(fact.readOn)}`
    : "";
}

export function Overview({ data }: { data: OverviewData }) {
  const { topic, built, hero, facts } = data;
  const o = topic.overview!;
  const minutes = topic.lessons.reduce((m, l) => m + l.minutes, 0);
  const builtIds = new Set(built.map((b) => b.id));
  const list = o.layout === "list";

  return (
    <main className={`tt-ov-page ${o.layout}`}>
      <section className="tt-field-lg tt-hero" aria-labelledby="hero-title">
        <div className="tt-hero-inner">
          <div className="tt-hero-text">
            <p className="tt-chip tt-hero-meta">
              Topic · {LEVEL[topic.level]} · {topic.lessons.length} lessons ·{" "}
              {durationLabel(minutes)}
            </p>
            <h1 id="hero-title" className="tt-hero-h1">
              {o.heroTitle}
            </h1>
            <p className="tt-hero-promise">{o.promise}</p>
            <div className="tt-hero-ctas">
              {built.length > 0 && (
                <NextLessonButton topic={topic.id} lessons={built} />
              )}
              {o.secondary && (
                <Link
                  href={`/topics/${topic.id}/${TOPIC_TABS[o.secondary.tab].path}`}
                  className="tt-btn tt-hero-cta tt-hero-secondary"
                >
                  <AnyIcon name={TOPIC_TABS[o.secondary.tab].icon} />
                  {o.secondary.label}
                </Link>
              )}
            </div>
            <ul className="tt-hero-highlights">
              {o.highlights.map((h) => (
                <li key={h.text}>
                  <AnyIcon name={h.icon as IconName | PageIconName} />
                  {h.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="tt-hero-diagram">
            <HeroDiagram data={hero} />
          </div>
        </div>
      </section>

      <section className="tt-ov-why" aria-labelledby="why-title">
        <p className="tt-lbl">{o.why.label}</p>
        <h2 id="why-title" className="tt-h1 tt-ov-why-h">
          {o.why.headline}
        </h2>
        <ul className="tt-ov-stats">
          {o.why.stats.map((s) => (
            <li key={s.value} className="tt-card-l tt-ov-stat">
              <span className="tt-num tt-ov-stat-value">{s.value}</span>
              <p className="tt-ov-stat-claim">{s.claim}</p>
              <p className="tt-ov-stat-source">
                {sourceLine(facts[s.facts[0]!])}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {!list && (o.brief || o.currentWith) && (
        <section className="tt-ov-row" aria-label="The brief and its standards">
          {o.brief && (
            <div className="tt-card-l tt-ov-brief">
              <p className="tt-lbl">{o.brief.label}</p>
              <h2 className="tt-h2">{o.brief.title}</h2>
              <p className="tt-body-s">{o.brief.body}</p>
              <dl className="tt-ov-brief-items">
                {o.brief.items.map((i) => (
                  <div key={i.k} className="tt-panel-2">
                    <dt className="tt-lbl-s">{i.k}</dt>
                    <dd>{i.v}</dd>
                  </div>
                ))}
              </dl>
              <p className="tt-cap tt-foot">{o.brief.note}</p>
            </div>
          )}
          {o.currentWith && (
            <div className="tt-card-l tt-ov-current">
              <p className="tt-lbl">Current with</p>
              <table className="tt-ov-current-table">
                <tbody>
                  {o.currentWith.map((c) => (
                    <tr key={c.name}>
                      <th scope="row">{c.name}</th>
                      <td>{c.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Link
                href={`/topics/${topic.id}/sources/`}
                className="tt-btn tt-btn-sm tt-ov-all"
              >
                All sources
              </Link>
            </div>
          )}
        </section>
      )}

      {list ? (
        <section className="tt-ov-listrow" aria-labelledby="lessons-title">
          <div className="tt-ov-lessons">
            <div className="tt-ov-lessons-head">
              <h2 id="lessons-title" className="tt-lbl">
                Lessons
              </h2>
              <p className="tt-cap tt-mono">
                {built.length} interactive ·{" "}
                {topic.lessons.length - built.length} coming
              </p>
            </div>
            <ol className="tt-ov-rows">
              {topic.lessons.map((l, i) => {
                const live = builtIds.has(l.id);
                const inner = (
                  <>
                    <span className={`tt-ov-n${live ? " live" : ""}`}>
                      {i + 1}
                    </span>
                    <span className="tt-ov-row-text">
                      <span className="tt-ov-row-title">{l.title}</span>
                      <span className="tt-ov-row-summary">{l.summary}</span>
                    </span>
                    <span className="tt-ov-row-meta">
                      <span className="tt-cap tt-mono">{l.minutes} min</span>
                      <span className={`tt-chip${live ? " tt-chip-on" : ""}`}>
                        {live ? "Interactive" : "Coming"}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={l.id}>
                    {live ? (
                      <Link
                        href={`/topics/${topic.id}/lessons/${l.id}/`}
                        className="tt-ov-lrow"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div className="tt-ov-lrow coming">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
          <aside className="tt-ov-aside" aria-label="About this topic">
            <div className="tt-card-l">
              <p className="tt-lbl-s">{o.outcomesLabel}</p>
              <ul className="tt-ov-outcomes">
                {o.outcomes.map((t) => (
                  <li key={t} className="tt-check">
                    <Icon name="check" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            {o.skills && (
              <div className="tt-card-l">
                <p className="tt-lbl-s">Skills it builds</p>
                <ul className="tt-ov-skills">
                  {o.skills.map((s) => (
                    <li key={s.name}>
                      <span className="tt-ov-skill-row">
                        <span>{s.name}</span>
                        <span className="tt-mono tt-muted">
                          to level {s.level}
                        </span>
                      </span>
                      <span
                        className="tt-bar"
                        role="img"
                        aria-label={`Level ${s.level} of 4`}
                      >
                        <i style={{ width: `${(s.level / 4) * 100}%` }} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="tt-card-l">
              <p className="tt-lbl-s">Before you start</p>
              {o.prerequisites.text && (
                <p className="tt-body-s tt-ov-pre">{o.prerequisites.text}</p>
              )}
              {o.prerequisites.audiences && (
                <ul className="tt-ov-audiences">
                  {o.prerequisites.audiences.map((a) => (
                    <li key={a} className="tt-chip">
                      {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </section>
      ) : (
        <section className="tt-ov-grid" aria-labelledby="lessons-title">
          <div className="tt-ov-grid-head">
            <div>
              <p className="tt-lbl">{topic.lessons.length} lessons</p>
              <h2 id="lessons-title" className="tt-h1 tt-ov-grid-h">
                {o.lessonsHeadline}
              </h2>
            </div>
            <Link href={`/topics/${topic.id}/lessons/`} className="tt-btn">
              All lessons
              <Icon name="arrow-right" />
            </Link>
          </div>
          <ol className="tt-ov-cards">
            {topic.lessons.map((l, i) => {
              const live = builtIds.has(l.id);
              const inner = (
                <>
                  <span className="tt-ov-card-top">
                    <span className="tt-num tt-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="tt-lbl-s">
                      {live ? `${l.minutes} min` : "Coming"}
                    </span>
                  </span>
                  <span className="tt-ov-card-title">{l.title}</span>
                  {l.cardRef && (
                    <span className="tt-ov-card-ref">{l.cardRef}</span>
                  )}
                </>
              );
              return (
                <li key={l.id}>
                  {live ? (
                    <Link
                      href={`/topics/${topic.id}/lessons/${l.id}/`}
                      className="tt-card tt-ov-card"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className="tt-card tt-ov-card coming">{inner}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {list && (
        <section className="tt-ov-facts" aria-labelledby="facts-title">
          <div className="tt-ov-facts-head">
            <div>
              <p className="tt-lbl">Current with</p>
              <h2 id="facts-title" className="tt-h2">
                Every fact in this topic, with its source and date
              </h2>
            </div>
            <Link
              href={`/topics/${topic.id}/sources/`}
              className="tt-btn tt-btn-sm"
            >
              All sources
            </Link>
          </div>
          <ul className="tt-ov-fact-rows">
            {Object.values(facts)
              .filter((f) => f.kind === "real")
              .filter(
                (f, i, all) =>
                  all.findIndex(
                    (g) => (g.title ?? g.source) === (f.title ?? f.source),
                  ) === i,
              )
              .map((f) => (
                <li key={f.id} className="tt-ov-fact">
                  <span className="tt-ov-fact-name">{f.title ?? f.source}</span>
                  <span className="tt-ov-fact-claim">{f.claim}</span>
                  <span className="tt-ov-fact-read">
                    read {formatDate(f.readOn)}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}

      {o.footer && (
        <footer className="tt-field tt-ov-footer">
          <div className="tt-ov-footer-inner">
            <div className="tt-ov-footer-brand">
              <BrandImage kind="compact" height={30} alt="Tech & Thrive" />
              <p className="tt-h3">{o.footer.line}</p>
            </div>
            <p className="tt-cap tt-ov-footer-note">{o.footer.disclaimer}</p>
          </div>
        </footer>
      )}
    </main>
  );
}
