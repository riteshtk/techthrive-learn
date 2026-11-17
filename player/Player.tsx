"use client";

import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import type { Step } from "@/content/types";
import { doneNotice } from "@/lib/doneNotice";
import { progressStore } from "@/lib/useProgress";
import { Diagram, type Inspect } from "./Diagram";
import {
  holdMs,
  initPlayer,
  isLast,
  reducePlayer,
  stepFromQuery,
  stepToQuery,
} from "./engine";
import type { Layout } from "./geometry";

type Props = {
  layout: Layout;
  steps: Step[];
  title: string;
  topicId: string;
  /** Where "Mark as done" returns to; home when the topic is in no roadmap. */
  roadmapId?: string;
};

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (cb: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", cb);
  return () => query.removeEventListener("change", cb);
};
const subscribeFullscreen = (cb: () => void) => {
  document.addEventListener("fullscreenchange", cb);
  return () => document.removeEventListener("fullscreenchange", cb);
};
const never = () => () => {};

export function Player({ layout, steps, title, topicId, roadmapId }: Props) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducePlayer, steps.length, initPlayer);
  const step = steps[state.step] ?? steps[0];
  const active = useMemo(() => new Set(step?.highlight ?? []), [step]);
  const sectionRef = useRef<HTMLElement>(null);

  // Notes: a clicked block or line stays pinned; hovering or focusing a
  // line shows what flows along it for as long as the pointer stays.
  const [pinned, setPinned] = useState<Inspect | null>(null);
  const [peek, setPeek] = useState<Inspect | null>(null);
  const shown = peek ?? pinned;

  // Packets travel unless the learner asked for reduced motion. The server
  // render assumes stillness; the browser decides after load.
  const still = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true,
  );
  const canFullscreen = useSyncExternalStore(
    never,
    () => document.fullscreenEnabled,
    () => false,
  );
  const fullscreen = useSyncExternalStore(
    subscribeFullscreen,
    () => document.fullscreenElement !== null,
    () => false,
  );

  // Deep links (F6). The page is prerendered at step 1; after load, ?step
  // picks the step. A missing or invalid value opens step 1, and the address
  // is corrected, and kept in step, without adding history entries.
  const readAddress = useRef(true);
  useEffect(() => {
    if (readAddress.current) {
      readAddress.current = false;
      const raw = new URLSearchParams(window.location.search).get("step");
      const { step: wanted, valid } = stepFromQuery(raw, state.total);
      if (valid) {
        if (wanted !== state.step) dispatch({ type: "goto", step: wanted });
        return;
      }
    }
    const url = new URL(window.location.href);
    const value = stepToQuery(state.step);
    if (url.searchParams.get("step") !== value) {
      url.searchParams.set("step", value);
      window.history.replaceState(window.history.state, "", url);
    }
  }, [state.step, state.total]);

  // Play holds each step for its own time, then advances one step.
  useEffect(() => {
    if (!state.playing || !step) return;
    const timer = setTimeout(
      () => dispatch({ type: "tick" }),
      holdMs(step.text),
    );
    return () => clearTimeout(timer);
  }, [state.playing, state.step, step]);

  // Transitions switch on only after the first frames, so a deep link opens
  // straight on its step instead of animating there from step 1.
  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (sectionRef.current) sectionRef.current.dataset.ready = "true";
      });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Hiding the tab pauses.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) dispatch({ type: "hidden" });
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Right/Left step and Space plays or pauses while the player has focus;
  // a focused button, link or diagram part keeps its own Space. Escape
  // clears a pinned note.
  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      dispatch({ type: "next" });
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      dispatch({ type: "back" });
    } else if (event.key === " ") {
      const target = event.target as HTMLElement;
      if (target.closest("button, a, input, select, textarea, [role=button]"))
        return;
      event.preventDefault();
      dispatch({ type: "toggle" });
    } else if (event.key === "Escape" && pinned) {
      setPinned(null);
    }
  }

  function markDone() {
    progressStore.markDone(topicId);
    doneNotice.set(topicId);
    if (document.fullscreenElement) void document.exitFullscreen();
    router.push(roadmapId ? `/roadmaps/${roadmapId}/` : "/");
  }

  const first = state.step === 0;
  const last = isLast(state);
  const nextStep = steps[state.step + 1];

  return (
    <section
      ref={sectionRef}
      className="player"
      aria-label={`${title}: diagram player`}
      aria-keyshortcuts="ArrowLeft ArrowRight Space"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div className="stage">
        <div
          className="diagram-wrap"
          style={{ "--ratio": layout.width / layout.height } as CSSProperties}
          onClick={(e) => {
            if ((e.target as Element).tagName === "svg") setPinned(null);
          }}
        >
          <Diagram
            layout={layout}
            active={active}
            step={state.step}
            label={`Diagram: ${title}`}
            pinned={pinned}
            onPin={(t) =>
              setPinned((p) => (p?.kind === t.kind && p.id === t.id ? null : t))
            }
            onPeek={setPeek}
            still={still}
          />
          <Inspector layout={layout} target={shown} />
        </div>
        <div className="stage-foot">
          <ul className="legend" aria-label="Legend">
            <li>
              <span className="swatch swatch-on" aria-hidden="true" /> This step
            </li>
            <li>
              <span className="swatch swatch-packet" aria-hidden="true" />{" "}
              Moving
            </li>
            <li>
              <span className="swatch swatch-off" aria-hidden="true" /> Waiting
            </li>
          </ul>
          <div className="stage-tools">
            <button
              type="button"
              className="icon-button"
              aria-label="Replay from step 1"
              onClick={() => {
                dispatch({ type: "goto", step: 0 });
                dispatch({ type: "play" });
              }}
            >
              <Icon name="replay" />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={state.playing ? "Pause" : "Play"}
              onClick={() => dispatch({ type: "toggle" })}
            >
              <Icon name={state.playing ? "pause" : "play"} />
            </button>
            {canFullscreen ? (
              <button
                type="button"
                className="icon-button"
                aria-label={fullscreen ? "Exit full screen" : "Full screen"}
                onClick={() => {
                  if (document.fullscreenElement)
                    void document.exitFullscreen();
                  else void sectionRef.current?.requestFullscreen();
                }}
              >
                <Icon name={fullscreen ? "shrink" : "expand"} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="timeline-row">
        <span className="counter" data-testid="counter">
          {state.step + 1} of {state.total}
        </span>
        <ol className="timeline" aria-label="Steps">
          {steps.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                aria-label={`Step ${i + 1}: ${s.title}`}
                aria-current={i === state.step ? "step" : undefined}
                data-state={
                  i === state.step
                    ? "current"
                    : i < state.step
                      ? "seen"
                      : "next"
                }
                title={s.title}
                onClick={() => dispatch({ type: "goto", step: i })}
              />
            </li>
          ))}
        </ol>
      </div>

      {/* Every sentence sits invisibly in the same grid cell, so the box is
          exactly as tall as this topic's longest one and nothing below it
          moves, without reserving more room than the topic needs. */}
      <div className="caption-box">
        {steps.map((s, i) => (
          <p key={i} className="caption caption-sizer" aria-hidden="true">
            {s.text}
          </p>
        ))}
        <p className="caption" aria-live="polite" data-testid="caption">
          {step?.text}
        </p>
      </div>
      <p className="hint">
        Use ← and → to step, Space to play. Select a block for a note.
      </p>

      <div className="bottom-bar">
        <div className="bottom-inner">
          <button
            type="button"
            className="button button-back"
            aria-label="Back"
            aria-disabled={first}
            onClick={() => dispatch({ type: "back" })}
          >
            <Icon name="arrowLeft" /> <span className="back-label">Back</span>
          </button>
          {last ? (
            <button
              type="button"
              className="button button-next button-done"
              onClick={markDone}
            >
              <Icon name="check" /> Mark as done
            </button>
          ) : (
            <button
              type="button"
              className="button button-next"
              onClick={() => dispatch({ type: "next" })}
            >
              <span className="next-label">Next: {nextStep?.title}</span>
              <Icon name="arrowRight" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/** The note for a block, or what flows along a line, near what it describes. */
function Inspector({
  layout,
  target,
}: {
  layout: Layout;
  target: Inspect | null;
}) {
  let content: React.ReactNode = null;
  let style: Record<string, string> | undefined;
  const node =
    target?.kind === "node"
      ? layout.nodes.find((n) => n.id === target.id)
      : undefined;
  const edge =
    target?.kind === "edge"
      ? layout.edges.find((e) => e.id === target.id)
      : undefined;
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  if (node) {
    const below = node.center.y < layout.height / 2;
    content = (
      <>
        <strong>{node.label}</strong> {node.note}
      </>
    );
    style = {
      "--x": pct(node.center.x, layout.width),
      ...(below
        ? { top: pct(node.box.y + node.box.h + 6, layout.height) }
        : { bottom: pct(layout.height - node.box.y + 6, layout.height) }),
    };
  } else if (edge) {
    const from = layout.nodes.find((n) => n.id === edge.from)?.label;
    const to = layout.nodes.find((n) => n.id === edge.to)?.label;
    content = (
      <>
        <strong>
          {from} → {to}
        </strong>{" "}
        {edge.flows ?? ""}
      </>
    );
    // Beside a steep line, on the side with more room, so it never covers
    // the blocks the line joins; below a flat one.
    const steep =
      Math.abs(edge.end.y - edge.start.y) >=
      Math.abs(edge.end.x - edge.start.x);
    // Clear the blocks at either end, not just the line itself.
    const ends = layout.nodes.filter(
      (n) => n.id === edge.from || n.id === edge.to,
    );
    const gap = Math.max(...ends.map((n) => n.box.w / 2), 0) + 8;
    if (steep && edge.mid.x < layout.width / 2) {
      style = {
        left: pct(edge.mid.x + gap, layout.width),
        top: pct(edge.mid.y, layout.height),
        width: `min(16rem, ${pct(layout.width - edge.mid.x - gap, layout.width)})`,
        transform: "translateY(-50%)",
      };
    } else if (steep) {
      style = {
        left: "auto",
        right: pct(layout.width - edge.mid.x + gap, layout.width),
        top: pct(edge.mid.y, layout.height),
        width: `min(16rem, ${pct(edge.mid.x - gap, layout.width)})`,
        transform: "translateY(-50%)",
      };
    } else {
      style = {
        "--x": pct(edge.mid.x, layout.width),
        top: pct(edge.mid.y + 14, layout.height),
      };
    }
  }

  return (
    <div
      className="inspector"
      role="status"
      data-testid="inspector"
      data-open={content !== null}
      style={style as CSSProperties | undefined}
    >
      {content}
    </div>
  );
}
