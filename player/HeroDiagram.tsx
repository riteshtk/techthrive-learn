"use client";

// The topic overview's hero diagram (spec 03 §3.1, §7.6): the finished
// system with one request looping through it, in 3D or 2D. It plays at the
// overview's even pace and can be paused (WCAG 2.2.2). Each part links to
// the lesson step that adds it. Phones get the portrait layout from the
// approved still.

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { ColorKey } from "@/content/types";
import type { Drawing } from "./drawing";
import { OVERVIEW_TIMING, type StageConfig } from "./machine";
import { buildScene, type SceneSource } from "./scene";
import { Stage } from "./Stage";
import { Switch } from "./Switch";
import { effectiveTrace } from "./trace";
import { useReducedMotion, useStage } from "./useStage";

const PHONE = "(max-width: 720px)";
const subscribePhone = (cb: () => void) => {
  const q = window.matchMedia(PHONE);
  q.addEventListener("change", cb);
  return () => q.removeEventListener("change", cb);
};

export type HeroData = {
  caption: string;
  components: number;
  drawing: Drawing;
  /** The approved phone layout, if the diagram has one. */
  portrait?: Drawing;
  edges: string[];
  bypass?: { node: string; edge: string };
  trace: { from: string; to: string; color: ColorKey }[];
  names: Record<string, string>;
  /** Where each part's lesson step is, if a lesson adds it. */
  links: Record<string, string>;
};

export function HeroDiagram({
  data,
  onSelect,
  selected,
  initialView,
  nodeAction = "open the lesson step that adds it",
}: {
  data: HeroData;
  /** Picking a part selects it here and tells the page (the design lab),
      instead of opening its lesson step. */
  onSelect?: (id: string) => void;
  /** The part shown as selected, when the page owns the selection. */
  selected?: string;
  /** The view to open in: the lab opens in 2D, as designed. */
  initialView?: "2d" | "3d";
  nodeAction?: string;
}) {
  const router = useRouter();
  const phone = useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
  const drawing = phone && data.portrait ? data.portrait : data.drawing;

  const source: SceneSource = useMemo(
    () => ({
      nodes: data.drawing.nodes2.map((n) => ({ id: n.id, addedAt: 1 })),
      edges: data.edges,
      bypass: data.bypass,
      steps: [
        {
          trace: data.trace.map((h) => ({ ...h, text: "" })),
          newNodes: [],
        },
      ],
    }),
    [data],
  );
  const config: StageConfig = useMemo(
    () => ({
      steps: 1,
      hops: (step, full) => effectiveTrace(source, step, full).length,
      size: { "3d": drawing.size3, "2d": drawing.size2 },
    }),
    [source, drawing],
  );
  const [state, dispatch] = useStage(config, OVERVIEW_TIMING, {
    view: initialView,
  });
  // A page-owned selection: keep the stage's in step with it.
  useEffect(() => {
    if (selected !== undefined && selected !== state.selected)
      dispatch({ type: "select", id: selected });
  }, [selected, state.selected, dispatch]);
  const reduced = useReducedMotion();
  // The camera centres on the drawing in use: refit when phone width swaps
  // the portrait layout in or out.
  useEffect(() => {
    dispatch({ type: "fit" });
  }, [drawing, dispatch]);
  const { step: at, full, hop, selected: picked } = state;
  const scene = useMemo(
    () => buildScene(source, state, (s, f) => effectiveTrace(source, s, f)),
    // Keyed on what buildScene reads; the rest of the state (pan, zoom,
    // speed) changes often.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source, at, full, hop, picked],
  );
  const nameOf = (id: string) => data.names[id] ?? id;
  const trace = data.trace
    .map((h) => `${nameOf(h.from)} to ${nameOf(h.to)}`)
    .join(", ");

  return (
    <div className="tt-card-l tt-field tt-hero-card">
      <div className="tt-card tt-hero-title">
        <span className="tt-live" aria-hidden="true" />
        <div>
          <p className="tt-lbl-s">The system you’ll build</p>
          <p className="tt-h4 tt-hero-caption">
            {data.caption} · {data.components} components
          </p>
        </div>
      </div>
      <div className="tt-hero-controls">
        <button
          type="button"
          className="tt-btn tt-btn-sm tt-btn-icon tt-hero-pause"
          aria-label={state.playing ? "Pause the request" : "Play the request"}
          onClick={() => dispatch({ type: "togglePlay" })}
        >
          <svg className="tt-ic tt-ic-s" viewBox="0 0 24 24" aria-hidden="true">
            <path d={state.playing ? "M8 5v14M16 5v14" : "M7 5l12 7-12 7z"} />
          </svg>
        </button>
        <Switch
          label="Diagram style"
          options={[
            { value: "2d", label: "2D" },
            { value: "3d", label: "3D" },
          ]}
          value={state.view}
          onChange={(v) => dispatch({ type: "view", view: v })}
        />
      </div>
      <div className="tt-hero-view">
        <Stage
          drawing={drawing}
          edges={data.edges}
          scene={scene}
          state={state}
          dispatch={(a) => {
            if (a.type === "select" && onSelect) {
              if (a.id) onSelect(a.id);
              return;
            }
            if (a.type === "select" && a.id) {
              const href = data.links[a.id];
              if (href) router.push(href);
              return;
            }
            dispatch(a);
          }}
          config={config}
          timing={OVERVIEW_TIMING}
          label={`${data.caption} with ${data.components} components. A request travels: ${trace}`}
          nameOf={nameOf}
          nodeAction={nodeAction}
          reducedMotion={reduced}
        />
      </div>
    </div>
  );
}
