"use client";

// A stage on the kit page: the design's AI agents diagram with a short
// six-step build-up, so e2e tests can drive the engine before lesson
// pages exist. Built for e2e runs only, like the rest of the kit.

import { useMemo } from "react";
import { LESSON_TIMING, type StageConfig } from "@/player/machine";
import {
  buildScene,
  hopWords,
  type SceneHop,
  type SceneSource,
} from "@/player/scene";
import { Stage, StageText } from "@/player/Stage";
import { PlaybackControls, ViewerToolbar } from "@/player/StageControls";
import { effectiveTrace } from "@/player/trace";
import { useReducedMotion, useStage } from "@/player/useStage";
import { AGENTS } from "@/tests/unit/fixtures/diagrams";

const h = (
  from: string,
  to: string,
  color: SceneHop["color"],
  text: string,
) => ({
  from,
  to,
  color,
  text,
});

const ADDED: Record<string, number> = {
  U: 1,
  D: 1,
  O: 2,
  M: 2,
  G: 3,
  T: 4,
  V: 5,
  P: 6,
  H: 6,
  E: 6,
  X: 6,
};

const ask = h("U", "G", "cyan", "A customer asks about a charge.");
const verified = h(
  "G",
  "O",
  "cyan",
  "The gateway passes on a verified identity.",
);
const think = h(
  "O",
  "M",
  "violet",
  "The orchestrator asks the model what to do.",
);
const plan = h("M", "O", "violet", "The model proposes a tool call.");

const SOURCE: SceneSource = {
  nodes: AGENTS.nodes.map((n) => ({ id: n.id, addedAt: ADDED[n.id] ?? 1 })),
  edges: Object.keys(AGENTS.paths2),
  bypass: { node: "G", edge: "U_O" },
  steps: [
    { trace: [], newNodes: [] },
    { trace: [ask, verified, think, plan], newNodes: ["O", "M"] },
    { trace: [ask, verified, think, plan], newNodes: ["G"] },
    {
      trace: [
        ask,
        verified,
        think,
        plan,
        h("O", "T", "green", "It calls a tool."),
        h("T", "D", "blue", "The tool reads the card ledger."),
      ],
      newNodes: ["T"],
    },
    {
      trace: [
        ask,
        verified,
        h("O", "V", "blue", "It looks up the policy text."),
      ],
      newNodes: ["V"],
    },
    {
      trace: [
        verified,
        think,
        h("O", "P", "amber", "May this customer credit this card?"),
        h("P", "O", "amber", "Permit, under the limit."),
        h("O", "T", "green", "It calls the credit tool."),
        h("T", "D", "blue", "Core banking books it."),
      ],
      newNodes: ["P"],
    },
  ],
};

const NAMES = new Map(AGENTS.nodes.map((n) => [n.id, n.label]));
const nameOf = (id: string) => NAMES.get(id) ?? id;

export function StageDemo() {
  const config: StageConfig = useMemo(
    () => ({
      steps: SOURCE.steps.length,
      hops: (step, full) => effectiveTrace(SOURCE, step, full).length,
      size: { "3d": [950, 567], "2d": [960, 500] },
    }),
    [],
  );
  const [state, dispatch] = useStage(config, LESSON_TIMING, { step: 6 });
  const reduced = useReducedMotion();
  const scene = buildScene(SOURCE, state, (step, full) =>
    effectiveTrace(SOURCE, step, full),
  );
  const words = hopWords(scene, state.hop, nameOf, "No request moves yet.");

  return (
    <section aria-labelledby="kit-stage" className="kit-stage">
      <h2 id="kit-stage" className="tt-h3">
        Stage
      </h2>
      <div className="tt-card-l kit-stage-frame">
        <ViewerToolbar state={state} dispatch={dispatch} />
        <div className="kit-stage-field">
          <Stage
            diagram={AGENTS}
            edges={SOURCE.edges}
            scene={scene}
            state={state}
            dispatch={dispatch}
            config={config}
            timing={LESSON_TIMING}
            label="Card-dispute agent"
            nameOf={nameOf}
            reducedMotion={reduced}
          />
        </div>
      </div>
      <div className="kit-row">
        <p className="tt-lbl" data-testid="hop-tag">
          {words.tag}
        </p>
        <PlaybackControls state={state} dispatch={dispatch} />
        <button
          type="button"
          className="tt-btn tt-btn-sm"
          onClick={() => dispatch({ type: "back" })}
        >
          Back
        </button>
        <button
          type="button"
          className="tt-btn tt-btn-sm"
          onClick={() => dispatch({ type: "next" })}
        >
          Next
        </button>
        <span className="tt-lbl-s" data-testid="stage-step">
          Step {state.step} / {SOURCE.steps.length}
        </span>
      </div>
      <StageText
        diagram={AGENTS}
        scene={scene}
        nameOf={nameOf}
        stepLabel={`Step ${state.step}`}
      />
    </section>
  );
}
