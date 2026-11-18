"use client";

// The lesson page (PRD P5; spec 04 §1): the stage card with its metrics,
// viewer, hop well, legend and narration; the step rail; and the Explain
// and Sources tabs. Steps come from ?step after mount, are remembered in
// this browser, and can be driven from the keyboard.

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { SegmentedTabs, tabPanelProps } from "@/components/ui/SegmentedTabs";
import { stepRequest } from "@/lib/stepRequest";
import { HopWell } from "./lesson/HopWell";
import { ExplainPanel } from "./lesson/ExplainPanel";
import { StepsRail } from "./lesson/StepsRail";
import type { LessonPageData } from "./lessonData";
import { LESSON_TIMING, type StageConfig } from "./machine";
import type { SandboxTile } from "./sandboxes";
import { buildScene, hopWords, type SceneSource } from "./scene";
import { Stage } from "./Stage";
import { ViewerToolbar } from "./StageControls";
import { effectiveTrace } from "./trace";
import { useReducedMotion, useStage } from "./useStage";

// Loaded when first opened, to keep the page in its JavaScript budget.
const SandboxPanel = dynamic(() => import("./lesson/SandboxPanel"), {
  ssr: false,
});
const SourcesPanel = dynamic(() => import("./lesson/SourcesPanel"), {
  ssr: false,
});
const StageTextBody = dynamic(() => import("./StageText"), { ssr: false });
const NodeDetail = dynamic(
  () => import("./lesson/NodeDetail").then((m) => m.NodeDetail),
  { ssr: false },
);

type Progress = typeof import("@/lib/learning");

const PHONE = "(max-width: 720px)";
const subscribePhone = (cb: () => void) => {
  const q = window.matchMedia(PHONE);
  q.addEventListener("change", cb);
  return () => q.removeEventListener("change", cb);
};

type Tab = "explain" | "sources";

export function LessonPlayer({
  data,
  heading,
  legend,
}: {
  data: LessonPageData;
  /** Static parts, rendered on the server so their code isn't shipped:
      the title block (LessonHeading) and the colour key (LessonLegend). */
  heading: ReactNode;
  legend: ReactNode;
}) {
  const { lesson, drawing, topic } = data;
  const total = lesson.steps.length;

  const source: SceneSource = useMemo(
    () => ({
      nodes: lesson.nodes.map((n) => ({ id: n.id, addedAt: n.addedAt })),
      edges: lesson.edges,
      bypass: lesson.bypass,
      steps: lesson.steps,
    }),
    [lesson],
  );
  const config: StageConfig = useMemo(
    () => ({
      steps: total,
      hops: (step, full) => effectiveTrace(source, step, full).length,
      size: { "3d": drawing.size3, "2d": drawing.size2 },
    }),
    [source, total, drawing],
  );

  // Play lesson waits for the step's narration to finish before moving on.
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioDone = useRef(true);
  const [state, dispatch] = useStage(config, LESSON_TIMING, {
    canAdvance: () => audioDone.current,
  });
  const reduced = useReducedMotion();
  const phone = useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE).matches,
    () => false,
  );

  const [tab, setTab] = useState<Tab>("explain");
  const [wide, setWide] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [sandboxTiles, setSandboxTiles] = useState<SandboxTile[] | null>(null);
  const step = lesson.steps[state.step - 1]!;

  const nodeById = useMemo(
    () => new Map(lesson.nodes.map((n) => [n.id, n])),
    [lesson],
  );
  const colorOf = useMemo(
    () => new Map(drawing.nodes2.map((n) => [n.id, n.color])),
    [drawing],
  );
  const shortOf = useCallback(
    (id: string) => nodeById.get(id)?.short ?? id,
    [nodeById],
  );
  const nameOf = useCallback(
    (id: string) => nodeById.get(id)?.name ?? id,
    [nodeById],
  );

  const { step: at, full, hop, selected: picked } = state;
  const scene = useMemo(
    () => buildScene(source, state, (s, f) => effectiveTrace(source, s, f)),
    // Keyed on what buildScene reads; the rest of the state (pan, zoom,
    // speed) changes often.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source, at, full, hop, picked],
  );
  const words = hopWords(scene, state.hop, shortOf, lesson.emptyTraceText);

  // ?step: read once after mount (pages are static), then kept in the
  // address as the learner moves. Without one, resume where they were.
  // The step mount asked for; until the player reaches it, nothing is
  // written back, so the address and progress never flash step 1.
  // The progress store loads after mount, as it's only needed then: it
  // stays out of the page's first JavaScript.
  const [progress, setProgress] = useState<Progress | null>(null);
  useEffect(() => {
    let live = true;
    void import("@/lib/learning").then((m) => {
      if (live) setProgress(m);
    });
    return () => {
      live = false;
    };
  }, []);
  const key = progress?.lessonKey(topic.id, lesson.id);

  const started = useRef(false);
  const arriving = useRef<number | null>(null);
  useEffect(() => {
    if (!progress || !key) return;
    const asked = Number(new URLSearchParams(location.search).get("step"));
    const saved = progress.learningStore.get().lessons[key]?.step;
    const first =
      Number.isInteger(asked) && asked >= 1 && asked <= total
        ? asked
        : (saved ?? 1);
    if (first !== 1) dispatch({ type: "goto", step: first });
    arriving.current = first;
    started.current = true;
  }, [progress, dispatch, key, total]);

  useEffect(() => {
    if (!started.current || !progress || !key) return;
    if (arriving.current !== null) {
      if (state.step !== arriving.current) return;
      arriving.current = null;
    }
    const url = new URL(location.href);
    url.searchParams.set("step", String(state.step));
    history.replaceState(history.state, "", url);
    progress.learningStore.update((s) =>
      progress.visitStep(s, key, state.step, total, new Date().toISOString()),
    );
  }, [state.step, progress, key, total]);

  // Search can ask the open lesson to move to a step.
  useEffect(
    () => stepRequest.listen((n) => dispatch({ type: "goto", step: n })),
    [dispatch],
  );

  // Phones open each step zoomed in on where the request starts (approved
  // still); desktops show the whole system. The width must stay narrow for
  // a moment first: browsers report a momentary 1 px width during
  // full-page captures, and a window can be narrowed and widened again.
  // Leaving phone width fits the whole system back.
  const phoneZoomed = useRef(false);
  useEffect(() => {
    if (!phone) {
      if (phoneZoomed.current) {
        phoneZoomed.current = false;
        dispatch({ type: "fit" });
      }
      return;
    }
    if (state.view !== "3d") return;
    const target =
      effectiveTrace(source, state.step, state.full)[0]?.to ?? step.newNodes[0];
    const at = target ? drawing.focus3[target] : undefined;
    if (!at) return;
    const timer = setTimeout(() => {
      if (!window.matchMedia(PHONE).matches) return;
      phoneZoomed.current = true;
      dispatch({ type: "focus", x: at[0], y: at[1], zoom: 1.5 });
    }, 150);
    return () => clearTimeout(timer);
  }, [
    phone,
    state.step,
    state.view,
    state.full,
    source,
    step,
    drawing,
    dispatch,
  ]);

  // Narration: while playing the lesson, each step's recorded line plays.
  const audio = data.audio[state.step - 1] ?? null;
  useEffect(() => {
    const el = audioRef.current;
    audioDone.current = true;
    if (!el || !audio || !state.auto) {
      el?.pause();
      return;
    }
    audioDone.current = false;
    el.currentTime = 0;
    el.play().catch(() => {
      audioDone.current = true;
    });
  }, [audio, state.auto, state.step]);

  // ← and → move between steps; Space plays and pauses. Keys typed into
  // a control, or pressed on the diagram (where arrows pan), are theirs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (
        t.closest(
          "input, textarea, select, [contenteditable], [role=tablist], [role=dialog], .tt-stage",
        )
      )
        return;
      if (e.key === "ArrowRight") dispatch({ type: "next" });
      else if (e.key === "ArrowLeft") dispatch({ type: "back" });
      else if (e.key === " " && !t.closest("button, a")) {
        dispatch({ type: "togglePlay" });
      } else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);

  const selected = state.selected ? nodeById.get(state.selected) : undefined;
  const tiles = sandboxTiles
    ? sandboxTiles.map((t) => ({
        label: t.label,
        value: t.value,
        tone: t.tone,
      }))
    : lesson.metricLabels.map((label, i) => {
        const value = step.metrics[i] ?? "—";
        return {
          label,
          value,
          tone: value === "—" ? "muted" : value === "possible" ? "red" : "text",
        };
      });

  return (
    <>
      <main className={`tt-lesson${wide ? " wide" : ""}`}>
        <section className="tt-lesson-main" aria-labelledby="lesson-title">
          <header className="tt-lesson-head">
            {heading}
            <button
              type="button"
              className={`tt-btn tt-btn-sm${state.auto ? " tt-btn-primary" : ""}`}
              aria-pressed={state.auto}
              onClick={() => dispatch({ type: "toggleAuto" })}
            >
              <svg
                className="tt-ic tt-ic-s"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d={
                    state.auto
                      ? "M8 5v14M16 5v14"
                      : "M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v6H5a1 1 0 0 1-1-1zM20 15h-3v6h2a1 1 0 0 0 1-1z"
                  }
                />
              </svg>
              {state.auto ? "Playing lesson" : "Play lesson"}
            </button>
          </header>

          <StepsRail
            steps={lesson.steps}
            current={state.step}
            onGo={(n) => dispatch({ type: "goto", step: n })}
          />

          <div className="tt-card-l tt-stagecard">
            <div className="tt-metrics">
              <ul className="tt-metric-tiles" aria-label="This step in numbers">
                {tiles.map((t) => (
                  <li key={t.label} className="tt-mt">
                    <span className="tt-lbl-s">{t.label}</span>
                    <span className={`tt-num tt-mt-value tt-${t.tone}`}>
                      {t.value}
                    </span>
                  </li>
                ))}
              </ul>
              {data.sandbox && (
                <button
                  type="button"
                  className={`tt-btn tt-btn-sm${sandboxOpen ? " tt-btn-primary" : ""}`}
                  aria-pressed={sandboxOpen}
                  onClick={() => {
                    setSandboxOpen((o) => !o);
                    dispatch({ type: "select", id: null });
                  }}
                >
                  <svg
                    className="tt-ic tt-ic-s"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4" />
                  </svg>
                  {sandboxOpen ? "Sandbox on" : "Sandbox"}
                </button>
              )}
            </div>

            {data.sandbox && sandboxOpen && (
              <div className="tt-sandbox-slot">
                <SandboxPanel
                  kind={data.sandbox}
                  onTiles={setSandboxTiles}
                  onClose={() => setSandboxOpen(false)}
                />
              </div>
            )}

            <div className="tt-vf">
              <ViewerToolbar
                state={state}
                dispatch={dispatch}
                extra={
                  <button
                    type="button"
                    className="tt-wide-toggle"
                    aria-pressed={wide}
                    aria-label={
                      wide
                        ? "Exit wide view"
                        : "Wide view: diagram uses the full width"
                    }
                    title={wide ? "Exit wide view" : "Wide view"}
                    onClick={() => setWide((w) => !w)}
                  >
                    <svg
                      className="tt-ic tt-ic-s"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d={
                          wide
                            ? "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
                            : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
                        }
                      />
                    </svg>
                  </button>
                }
              />
              <div className="tt-viewer">
                <Stage
                  drawing={drawing}
                  edges={lesson.edges}
                  scene={scene}
                  state={state}
                  dispatch={(a) => {
                    if (a.type === "select") setSandboxOpen(false);
                    dispatch(a);
                  }}
                  config={config}
                  timing={LESSON_TIMING}
                  label={data.caption}
                  nameOf={nameOf}
                  reducedMotion={reduced}
                >
                  {selected && (
                    <NodeDetail
                      node={selected}
                      color={colorOf.get(selected.id) ?? "text"}
                      standards={lesson.standards ?? {}}
                      heading={
                        lesson.sandbox === "payments"
                          ? "Standards and rules it applies"
                          : "Controls these OWASP risks"
                      }
                      onClose={() => dispatch({ type: "select", id: null })}
                      onGoToStep={(n) => dispatch({ type: "goto", step: n })}
                      onZoom={() => {
                        const at = (
                          state.view === "3d" ? drawing.focus3 : drawing.focus2
                        )[selected.id];
                        if (at)
                          dispatch({ type: "zoomTo", x: at[0], y: at[1] });
                      }}
                    />
                  )}
                  <p className="tt-field-hint" aria-hidden="true">
                    Drag to pan · double-click to zoom
                  </p>
                </Stage>
              </div>
            </div>

            <HopWell
              scene={scene}
              state={state}
              dispatch={dispatch}
              words={words}
              shortOf={shortOf}
            />

            <div className="tt-legend">
              {legend}
              <p className="tt-adds">
                <span
                  className={`tt-key tt-${step.addsColor}`}
                  aria-hidden="true"
                />
                <span className="tt-lbl-s">Added in this step</span>
                <span className="tt-adds-what">{step.adds}</span>
              </p>
            </div>

            <div className="tt-well tt-narration">
              <div className="tt-narration-row">
                {audio && (
                  <button
                    type="button"
                    className="tt-sq tt-narration-play"
                    aria-label="Play this step’s narration"
                    onClick={() => {
                      const el = audioRef.current;
                      if (!el) return;
                      if (el.paused) {
                        el.currentTime = 0;
                        void el.play().catch(() => {});
                      } else el.pause();
                    }}
                  >
                    <svg
                      className="tt-ic tt-ic-s"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M4 9h4l5-4v14l-5-4H4zM16 9a3 3 0 0 1 0 6M18.5 6.5a7 7 0 0 1 0 11" />
                    </svg>
                  </button>
                )}
                <span className="tt-lbl-s">RK · EN</span>
                <p className="tt-narration-line">“{step.caption}”</p>
                <span className="tt-narration-mode">
                  {state.auto
                    ? "Auto · next step after this loop"
                    : "Manual · use Next"}
                </span>
              </div>
              <div className="tt-pb" aria-hidden="true">
                <i style={{ width: `${words.progress}%` }} />
              </div>
              {audio && (
                <audio
                  ref={audioRef}
                  src={audio}
                  preload="none"
                  // Paused, failed or finished: Play lesson mustn't wait
                  // for an "ended" that will never come.
                  onEnded={() => {
                    audioDone.current = true;
                  }}
                  onPause={() => {
                    audioDone.current = true;
                  }}
                  onError={() => {
                    audioDone.current = true;
                  }}
                />
              )}
            </div>
            <details
              className="tt-stage-text"
              onToggle={(e) => setTextOpen(e.currentTarget.open)}
            >
              <summary>Text version of the diagram</summary>
              {textOpen && (
                <StageTextBody
                  drawing={drawing}
                  scene={scene}
                  nameOf={nameOf}
                  stepLabel={`Step ${state.step}`}
                />
              )}
            </details>
          </div>
        </section>

        <aside className="tt-lesson-aside" aria-label="About this step">
          <SegmentedTabs
            label="About this step"
            idBase="lesson-tabs"
            items={[
              { value: "explain", label: "Explain" },
              { value: "sources", label: "Sources" },
            ]}
            value={tab}
            onChange={setTab}
          />
          <div
            className="tt-card-l tt-aside-card"
            {...tabPanelProps("lesson-tabs", tab)}
          >
            {tab === "explain" ? (
              <ExplainPanel
                step={step}
                n={state.step}
                total={total}
                nextShort={lesson.steps[state.step]?.short}
                finish={data.finish}
                onBack={() => dispatch({ type: "back" })}
                onNext={() => dispatch({ type: "next" })}
              />
            ) : (
              <SourcesPanel
                n={state.step}
                sources={data.sources[state.step - 1] ?? []}
                allHref={`/topics/${topic.id}/sources/`}
              />
            )}
          </div>
        </aside>
        <p className="sr-only" aria-live="polite">
          Step {state.step} of {total}: {step.title}
        </p>
      </main>
    </>
  );
}
