"use client";

// The diagram stage (spec 04 §3): one SVG that draws a system in 3D
// (isometric) or 2D, with the request hopping between its parts. It draws
// a Drawing made at build time (drawing.ts) in the state a Scene describes
// (scene.ts), and sends user actions to the stage machine.

import {
  useEffect,
  useMemo,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import type {
  Drawing,
  EdgeDrawing,
  NodeDrawing2,
  NodeDrawing3,
} from "./drawing";
import { pathOf, pointAt } from "./flat";
import {
  viewBoxOf,
  type StageAction,
  type StageConfig,
  type StageState,
  type Timing,
} from "./machine";
import {
  badgePositions,
  packetPath,
  type EdgeLook,
  type NodeLook,
  type Scene,
} from "./scene";

const EASE = "cubic-bezier(.45,0,.55,1)";

type Props = {
  drawing: Drawing;
  edges: readonly string[];
  scene: Scene;
  state: StageState;
  dispatch: (action: StageAction) => void;
  config: StageConfig;
  timing: Timing;
  /** The diagram's accessible name, e.g. "Card-dispute agent". */
  label: string;
  /** A node's name for its button, e.g. "Policy · Cedar". */
  nameOf: (id: string) => string;
  reducedMotion: boolean;
  /** What pressing a part does, for its name: "show details" by default. */
  nodeAction?: string;
  /** Drawn over the field, e.g. the component detail popover. */
  children?: ReactNode;
};

export function Stage({
  drawing,
  edges,
  scene,
  state,
  dispatch,
  config,
  timing,
  label,
  nameOf,
  reducedMotion,
  nodeAction = "show details",
  children,
}: Props) {
  const packetRef = useRef<SVGGElement>(null);
  const animRef = useRef<Animation | null>(null);
  const drag = useRef<{
    x: number;
    y: number;
    cx: number;
    cy: number;
    scale: number;
    moved: boolean;
    id: number;
  } | null>(null);
  const movedRef = useRef(false);

  const looks = useMemo(
    () => new Map(scene.nodes.map((n) => [n.id, n])),
    [scene.nodes],
  );
  const { view, layers } = state;
  const lines = view === "3d" ? drawing.edges3 : drawing.edges2;
  const flow = layers.flow;
  const current = scene.current;

  // The travelling packet: one Web Animation per hop, eased into each
  // corner like the design's CSS keyframes (spec 04 §3.6).
  useEffect(() => {
    const el = packetRef.current;
    animRef.current?.cancel();
    animRef.current = null;
    if (!el) return;
    if (!current || !flow) {
      el.style.opacity = "0";
      return;
    }
    const path = packetPath(lines, edges, current);
    if (path.length < 2) return;
    if (reducedMotion || typeof el.animate !== "function") {
      // No motion: the packet waits halfway along the hop.
      const { p } = pointAt(path, 0.5);
      el.style.transform = `translate(${p[0]}px, ${p[1]}px)`;
      el.style.opacity = "1";
      return;
    }
    const fade = view === "3d" ? 0.12 : 0.08;
    let run = 0;
    const lengths = path.map((p, i) =>
      i
        ? (run += Math.hypot(p[0] - path[i - 1]![0], p[1] - path[i - 1]![1]))
        : 0,
    );
    const total = run || 1;
    const offsets = [
      ...new Set([...lengths.map((l) => l / total), fade, 1 - fade]),
    ].sort((a, b) => a - b);
    const keyframes = offsets.map((offset) => {
      const { p } = pointAt(path, offset);
      return {
        offset,
        transform: `translate(${p[0]}px, ${p[1]}px)`,
        opacity: offset <= 0 || offset >= 1 ? 0 : 1,
        easing: EASE,
      };
    });
    el.style.opacity = "";
    animRef.current = el.animate(keyframes, {
      duration: Math.round(timing.hopMs / state.speed),
      fill: "both",
    });
    if (!state.playing) animRef.current.pause();
    // A new hop, step, view or speed starts a fresh flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, view, flow, state.step, state.hop, state.speed, reducedMotion]);

  useEffect(() => {
    const anim = animRef.current;
    if (!anim) return;
    if (state.playing) anim.play();
    else anim.pause();
  }, [state.playing]);

  // Drag to pan (spec 04 §2.3): a press only becomes a drag after 5 px,
  // so a click still selects.
  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const [vw, vh] = config.size[view];
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      cx: state.cx,
      cy: state.cy,
      scale: Math.min(
        rect.width / (vw / state.zoom),
        rect.height / (vh / state.zoom),
      ),
      moved: false,
      id: e.pointerId,
    };
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
    if (!d.moved) {
      d.moved = true;
      movedRef.current = true;
      e.currentTarget.setPointerCapture(d.id);
    }
    dispatch({ type: "pan", cx: d.cx - dx / d.scale, cy: d.cy - dy / d.scale });
  };
  const endDrag = () => {
    drag.current = null;
    // Let the click that ends a drag see `moved`, then forget it.
    setTimeout(() => {
      movedRef.current = false;
    }, 0);
  };

  const select = (id: string) => {
    if (movedRef.current) return;
    dispatch({ type: "select", id });
  };

  // Keys while the field has focus: zoom and pan (spec 04 §7).
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const step = 40 / state.zoom;
    const keys: Record<string, StageAction> = {
      "+": { type: "zoomIn" },
      "=": { type: "zoomIn" },
      "-": { type: "zoomOut" },
      "0": { type: "fit" },
      ArrowLeft: { type: "pan", cx: state.cx - step, cy: state.cy },
      ArrowRight: { type: "pan", cx: state.cx + step, cy: state.cy },
      ArrowUp: { type: "pan", cx: state.cx, cy: state.cy - step },
      ArrowDown: { type: "pan", cx: state.cx, cy: state.cy + step },
    };
    const action = keys[e.key];
    if (!action) return;
    e.preventDefault();
    e.stopPropagation();
    dispatch(action);
  };

  // Badges keep off the labels (3D) and node boxes (2D), inside the drawing.
  const avoid = view === "3d" ? drawing.labels3 : drawing.boxes2;
  const size = view === "3d" ? drawing.size3 : drawing.size2;
  const badges = useMemo(
    () => badgePositions(lines, edges, scene.trace, avoid, size),
    [lines, edges, scene.trace, avoid, size],
  );

  const rootClass = [
    "tt-stage",
    view === "3d" ? "v3" : "v2",
    state.playing ? "" : "paused",
    layers.links ? "" : "no-links",
    layers.labels ? "" : "no-labels",
    flow ? "" : "no-flow",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClass}
      role="group"
      aria-label={`${label}, ${view === "3d" ? "3D" : "2D"}. Drag or use the arrow keys to pan, plus and minus to zoom, 0 to fit.`}
      aria-roledescription="diagram"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <svg
        viewBox={viewBoxOf(config, state)}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => dispatch({ type: "zoomIn" })}
      >
        <defs>
          <pattern
            id={`dots-${view}`}
            width={view === "3d" ? 22 : 24}
            height={view === "3d" ? 22 : 24}
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.1" className="dot" />
          </pattern>
        </defs>
        {layers.grid && (
          <rect
            className="grid"
            x={-2000}
            y={-2000}
            width={6000}
            height={6000}
            fill={`url(#dots-${view})`}
          />
        )}
        <Edges looks={scene.edges} lines={lines} paths={view === "2d"} />
        <g className="nodes">
          {view === "3d"
            ? drawing.nodes3.map((n) => (
                <Node3
                  key={n.id}
                  node={n}
                  look={looks.get(n.id)}
                  name={nameOf(n.id)}
                  action={nodeAction}
                  onSelect={select}
                />
              ))
            : drawing.nodes2.map((n) => (
                <Node2
                  key={n.id}
                  node={n}
                  look={looks.get(n.id)}
                  name={nameOf(n.id)}
                  action={nodeAction}
                  onSelect={select}
                />
              ))}
        </g>
        {view === "3d" && (
          <g className="labels" aria-hidden="true">
            {drawing.nodes3.map((n) => {
              const look = looks.get(n.id);
              const cls = [
                "lb",
                look?.ghost && "ghost",
                look?.dim && "dim",
                look?.selected && "sel",
                look?.isNew && "new",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <g key={n.id} className={cls} onClick={() => select(n.id)}>
                  <rect
                    className="pill"
                    x={n.label.x}
                    y={n.label.y}
                    width={n.label.w}
                    height={26}
                    rx={13}
                  />
                  <text x={n.label.tx} y={n.label.ty}>
                    {n.label.text}
                  </text>
                </g>
              );
            })}
          </g>
        )}
        {flow && (
          <g className="badges" aria-hidden="true">
            {scene.trace.map((hop, j) => {
              const at = badges[j];
              if (!at) return null;
              const phase =
                j === state.hop ? "cur" : j < state.hop ? "done" : "next";
              return (
                <g
                  key={j}
                  className={`badge ${phase}`}
                  transform={`translate(${at[0]} ${at[1]})`}
                  style={{ color: `var(--${hop.color})` }}
                >
                  <circle className="badge-ring" r={13} />
                  <circle className="badge-dot" r={12} />
                  <text y={4.2}>{j + 1}</text>
                </g>
              );
            })}
          </g>
        )}
        <g
          ref={packetRef}
          className="packet"
          aria-hidden="true"
          style={{ color: current ? `var(--${current.color})` : undefined }}
        >
          <circle r={11} className="packet-halo" />
          <circle r={5} className="packet-core" />
        </g>
      </svg>
      {children}
    </div>
  );
}

function nodeClass(look: NodeLook | undefined): string {
  if (!look) return "nd";
  return [
    "nd",
    look.ghost && "ghost",
    look.dim && "dim",
    look.isNew && "new",
    look.active && "act",
    look.selected && "sel",
  ]
    .filter(Boolean)
    .join(" ");
}

function edgeClass(e: EdgeLook): string {
  return [
    "ed",
    !e.visible && "off",
    e.color && `on c-${e.color}`,
    e.active && "act",
  ]
    .filter(Boolean)
    .join(" ");
}

const arrowClass = (color: string | null, current: boolean) =>
  `ah${color ? ` c-${color}` : ""}${current ? " cur" : ""}`;

function Edges({
  looks,
  lines,
  paths,
}: {
  looks: readonly EdgeLook[];
  lines: Readonly<Record<string, EdgeDrawing>>;
  /** 2D edges are paths with corners; 3D ones straight lines. */
  paths: boolean;
}) {
  return (
    <>
      <g className="edges">
        {looks.map((look) => {
          const line = lines[look.id]?.line;
          if (!line || line.length < 2) return null;
          return paths ? (
            <path key={look.id} className={edgeClass(look)} d={pathOf(line)} />
          ) : (
            <line
              key={look.id}
              className={edgeClass(look)}
              x1={line[0]![0]}
              y1={line[0]![1]}
              x2={line[1]![0]}
              y2={line[1]![1]}
            />
          );
        })}
      </g>
      <g className="arrows" aria-hidden="true">
        {looks.map((look) => {
          const drawn = lines[look.id];
          if (!drawn || !look.visible) return null;
          return (
            <g key={look.id}>
              {look.forward && (
                <polygon
                  className={arrowClass(
                    look.forward.color,
                    look.forward.current,
                  )}
                  points={drawn.forward}
                />
              )}
              {look.backward && (
                <polygon
                  className={arrowClass(
                    look.backward.color,
                    look.backward.current,
                  )}
                  points={drawn.backward}
                />
              )}
            </g>
          );
        })}
      </g>
    </>
  );
}

/** A node as a keyboard-reachable button. */
function NodeButton({
  id,
  color,
  look,
  name,
  action,
  onSelect,
  children,
}: {
  id: string;
  color: string;
  look: NodeLook | undefined;
  name: string;
  action: string;
  onSelect: (id: string) => void;
  children: ReactNode;
}) {
  const ghost = look?.ghost ?? false;
  return (
    <g
      className={nodeClass(look)}
      style={{ color: `var(--${color})` }}
      role="button"
      tabIndex={ghost ? -1 : 0}
      aria-label={`${name}${ghost ? " (not built yet)" : ""}: ${action}`}
      aria-pressed={look?.selected ?? false}
      onClick={() => onSelect(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(id);
        }
      }}
    >
      {children}
    </g>
  );
}

function Node3({
  node,
  look,
  name,
  action,
  onSelect,
}: {
  node: NodeDrawing3;
  look: NodeLook | undefined;
  name: string;
  action: string;
  onSelect: (id: string) => void;
}) {
  const g = node.glyph;
  return (
    <NodeButton
      id={node.id}
      color={node.color}
      look={look}
      name={name}
      action={action}
      onSelect={onSelect}
    >
      <polygon className="ring" points={node.ring} />
      <g className="body">
        {node.slabs.map((side, i) => (
          <polygon key={i} className="slab" points={side} />
        ))}
        <polygon className="plate" points={node.plate} />
        {g.kind === "blocks" ? (
          <g className="glyph">
            {g.faces.map((f, i) => (
              <polygon
                key={i}
                className={f.shade ? "shade" : "face"}
                style={f.shade ? { fillOpacity: f.shade } : undefined}
                points={f.points}
              />
            ))}
          </g>
        ) : g.kind === "cylinder" ? (
          <g className="glyph">
            <path className="face" d={g.body} />
            <path className="shade" d={g.body} style={{ fillOpacity: 0.45 }} />
            {g.bands.map((d, i) => (
              <path key={i} className="band" d={d} />
            ))}
            <ellipse
              className="face"
              cx={g.top.cx}
              cy={g.top.cy}
              rx={g.top.rx}
              ry={g.top.ry}
            />
          </g>
        ) : (
          <g className={`figures${g.solo ? " solo" : ""}`}>
            {g.heads.map(([hx, hy], i) => (
              <g key={i}>
                <rect
                  className="fig-body"
                  x={hx - 3.8}
                  y={hy + 4.1}
                  width={7.6}
                  height={10.8}
                  rx={3.8}
                />
                <circle className="fig-head" cx={hx} cy={hy} r={3.4} />
              </g>
            ))}
          </g>
        )}
      </g>
    </NodeButton>
  );
}

function Node2({
  node,
  look,
  name,
  action,
  onSelect,
}: {
  node: NodeDrawing2;
  look: NodeLook | undefined;
  name: string;
  action: string;
  onSelect: (id: string) => void;
}) {
  const [x, y, w, h] = node.box;
  const cy = y + h / 2;
  return (
    <NodeButton
      id={node.id}
      color={node.color}
      look={look}
      name={name}
      action={action}
      onSelect={onSelect}
    >
      <rect
        className="ring"
        x={x - 5}
        y={y - 5}
        width={w + 10}
        height={h + 10}
        rx={16}
      />
      <g className="body">
        <rect className="bx" x={x} y={y} width={w} height={h} rx={12} />
        <rect
          className="tile"
          x={x + 11}
          y={cy - 16}
          width={32}
          height={32}
          rx={9}
        />
        <path
          className="icon"
          d={node.icon}
          transform={`translate(${x + 18} ${cy - 9}) scale(.75)`}
        />
        <text className="name2" x={x + 52} y={cy - 2}>
          {node.name}
        </text>
        <text className="sub2" x={x + 52} y={cy + 13}>
          {node.sub}
        </text>
      </g>
    </NodeButton>
  );
}
