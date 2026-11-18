"use client";

// The design lab, explore only (spec 05 §2, PRD P12): the reference
// architecture with its request looping, and a detail panel for the part
// you pick. ?part=T picks one, read after mount. Building and the AI
// review are phase 2, so nothing here is flagged as a finding.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Lab } from "@/content/types";
import type { HeroData } from "@/player/HeroDiagram";
import { LazyHeroDiagram as HeroDiagram } from "@/player/LazyPlayers";

type Detail = Lab["details"][number];

export function LabView({
  topic,
  lab,
  hero,
}: {
  topic: string;
  lab: Lab;
  hero: HeroData;
}) {
  const [part, setPart] = useState<string>("O");
  const mounted = useRef(false);
  useEffect(() => {
    const asked = new URLSearchParams(location.search).get("part");
    if (asked && lab.details.some((d) => d.node === asked))
      queueMicrotask(() => setPart(asked));
    mounted.current = true;
  }, [lab]);
  useEffect(() => {
    if (!mounted.current) return;
    const url = new URL(location.href);
    url.searchParams.set("part", part);
    history.replaceState(history.state, "", url);
  }, [part]);

  const d: Detail = lab.details.find((x) => x.node === part) ?? lab.details[0]!;
  const name = hero.names[d.node] ?? d.node;

  return (
    <div className="tt-lab-body">
      <div className="tt-lab-board">
        <HeroDiagram
          data={hero}
          nodeAction="show its detail"
          selected={part}
          initialView="2d"
          onSelect={setPart}
        />
        <p className="tt-cap tt-lab-hint">
          Pick a component to see its detail.
        </p>
      </div>
      <section
        className="tt-card-l tt-lab-detail"
        aria-labelledby="part-title"
        aria-live="polite"
      >
        <p className="tt-lbl-s">Component</p>
        <h2 id="part-title" className="tt-h3">
          {name}
        </h2>
        <p className="tt-body-s tt-lab-role">{d.role}</p>
        {d.settings.length > 0 && (
          <dl className="tt-lab-settings">
            {d.settings.map((s) => (
              <div key={s.k}>
                <dt className="tt-body-s">{s.k}</dt>
                <dd className="tt-mono">{s.v}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="tt-panel-2 tt-lab-watch">
          <p className="tt-lbl-s">Watch for</p>
          <p className="tt-body-s">{d.watch}</p>
        </div>
        {d.risks.length > 0 && (
          <p className="tt-lab-risks">
            <span className="tt-lbl-s">In the threat model</span>
            {d.risks.map((r) => (
              <Link
                key={r}
                href={`/topics/${topic}/threats/?risk=${r}`}
                className="tt-chip"
              >
                {r}
              </Link>
            ))}
          </p>
        )}
      </section>
    </div>
  );
}
