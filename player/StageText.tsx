"use client";

import type { Drawing } from "./drawing";
import type { Scene } from "./scene";

/** The text version of the diagram (PRD design rule): what is built at
    this step, and the request's hops in order. Drawn inside a <details>
    that the page owns, and loaded only once it is opened. */
export default function StageTextBody({
  drawing,
  scene,
  nameOf,
  stepLabel,
}: {
  drawing: Drawing;
  scene: Scene;
  nameOf: (id: string) => string;
  stepLabel: string;
}) {
  const built = drawing.nodes2.filter(
    (n) => !scene.nodes.find((l) => l.id === n.id)?.ghost,
  );
  return (
    <>
      <p className="tt-body-s">
        {stepLabel}: {built.length} of {drawing.nodes2.length} parts built.
      </p>
      <ul>
        {built.map((n) => (
          <li key={n.id}>
            {n.name} <span className="tt-faint">· {n.sub}</span>
          </li>
        ))}
      </ul>
      {scene.trace.length > 0 ? (
        <ol>
          {scene.trace.map((h, i) => (
            <li key={i}>
              {nameOf(h.from)} → {nameOf(h.to)}: {h.text}
            </li>
          ))}
        </ol>
      ) : (
        <p className="tt-body-s">No request moves in this step.</p>
      )}
    </>
  );
}

/** The <details> wrapper, for pages that don't mind loading the body. */
export function StageText(props: Parameters<typeof StageTextBody>[0]) {
  return (
    <details className="tt-stage-text">
      <summary>Text version of the diagram</summary>
      <StageTextBody {...props} />
    </details>
  );
}
