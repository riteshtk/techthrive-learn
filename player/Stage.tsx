"use client";

// The diagram stage (spec 04 §3): one SVG that draws a system in 3D
// (isometric) or 2D, with the request hopping between its parts. It draws
// a Scene (player/scene.ts) and sends user actions to the stage machine.

import {
  useEffect,
  useMemo,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { ICON_PATHS } from "@/components/ui/icons";
import type { Diagram, DiagramNode } from "@/content/types";
import { parsePath, pathArrows, pathOf, pointAt } from "./flat";
import {
  arrowhead,
  blockFaces,
  CROWD_HEADS,
  cylinderParts,
  edgeEnds,
  glyphBlocks,
  labelBox,
  paintOrder,
  PERSON_HEAD,
  plinthFaces,
  ringOf,
  toPoints,
  type IsoNode,
  type Pt,
} from "./iso";
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
  diagram: Diagram;
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
  /** Drawn over the field, e.g. the component detail popover. */
  children?: ReactNode;
};

export function Stage({
  diagram,
  edges,
  scene,
  state,
  dispatch,
  config,
  timing,
  label,
  nameOf,
  reducedMotion,
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

  const iso = useMemo(
    () =>
      new Map<string, IsoNode>(
        diagram.nodes.map((n) => [
          n.id,
          { id: n.id, cx: n.cx, cy: n.cy, plinth: n.plinth, glyph: n.glyph },
        ]),
      ),
    [diagram],
  );
  const looks = useMemo(
    () => new Map(scene.nodes.map((n) => [n.id, n])),
    [scene.nodes],
  );
  const { view, layers } = state;
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
    const path = packetPath(diagram, iso, edges, current, view);
    if (path.length < 2) return;
    if (reducedMotion || typeof el.animate !== "function") {
      // No motion: the packet waits halfway along the hop.
      const { p } = pointAt(path, 0.5);
      el.style.transform = `translate(${p[0]}px, ${p[1]}px)`;
      el.style.opacity = "1";
      return;
    }
    const fade = view === "3d" ? 0.12 : 0.08;
    const corners =
      view === "3d"
        ? [0, 1]
        : (() => {
            const total = path.reduce(
              (sum, p, i) =>
                i
                  ? sum +
                    Math.hypot(p[0] - path[i - 1]![0], p[1] - path[i - 1]![1])
                  : 0,
              0,
            );
            let run = 0;
            return path.map((p, i) => {
              if (i)
                run += Math.hypot(
                  p[0] - path[i - 1]![0],
                  p[1] - path[i - 1]![1],
                );
              return total ? run / total : 0;
            });
          })();
    const offsets = [...new Set([...corners, fade, 1 - fade])].sort(
      (a, b) => a - b,
    );
    const keyframes = offsets.map((offset) => {
      const { p } = pointAt(path, offset);
      const opacity = offset <= 0 || offset >= 1 ? 0 : 1;
      return {
        offset,
        transform: `translate(${p[0]}px, ${p[1]}px)`,
        opacity,
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

  const badges = useMemo(
    () => badgePositions(diagram, iso, edges, scene.trace, view),
    [diagram, iso, edges, scene.trace, view],
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
        {view === "3d" ? (
          <Iso3D
            diagram={diagram}
            iso={iso}
            scene={scene}
            looks={looks}
            nameOf={nameOf}
            onSelect={select}
          />
        ) : (
          <Flat2D
            diagram={diagram}
            scene={scene}
            looks={looks}
            nameOf={nameOf}
            onSelect={select}
          />
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

function Arrow({
  points,
  color,
  current,
}: {
  points: Pt[];
  color: string | null;
  current: boolean;
}) {
  return (
    <polygon
      className={`ah${color ? ` c-${color}` : ""}${current ? " cur" : ""}`}
      points={toPoints(points)}
    />
  );
}

/** A node as a keyboard-reachable button. */
function NodeButton({
  node,
  look,
  name,
  onSelect,
  children,
}: {
  node: DiagramNode;
  look: NodeLook | undefined;
  name: string;
  onSelect: (id: string) => void;
  children: ReactNode;
}) {
  const ghost = look?.ghost ?? false;
  return (
    <g
      className={nodeClass(look)}
      style={{ color: `var(--${node.color})` }}
      role="button"
      tabIndex={ghost ? -1 : 0}
      aria-label={`${name}${ghost ? " (not built yet)" : ""}: show details`}
      aria-pressed={look?.selected ?? false}
      onClick={() => onSelect(node.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(node.id);
        }
      }}
    >
      {children}
    </g>
  );
}

function Iso3D({
  diagram,
  iso,
  scene,
  looks,
  nameOf,
  onSelect,
}: {
  diagram: Diagram;
  iso: Map<string, IsoNode>;
  scene: Scene;
  looks: Map<string, NodeLook>;
  nameOf: (id: string) => string;
  onSelect: (id: string) => void;
}) {
  const byId = new Map(diagram.nodes.map((n) => [n.id, n]));
  const lines = scene.edges.map((e) => {
    const [a, b] = e.id.split("_").map((k) => iso.get(k)!);
    return { look: e, ends: a && b ? edgeEnds(a, b) : null };
  });
  return (
    <>
      <g className="edges">
        {lines.map(({ look, ends }) =>
          ends ? (
            <line
              key={look.id}
              className={edgeClass(look)}
              x1={ends.a[0]}
              y1={ends.a[1]}
              x2={ends.b[0]}
              y2={ends.b[1]}
            />
          ) : null,
        )}
      </g>
      <g className="arrows" aria-hidden="true">
        {lines.map(({ look, ends }) =>
          ends && look.visible ? (
            <g key={look.id}>
              {look.forward && (
                <Arrow
                  points={arrowhead(ends.a, ends.b)}
                  color={look.forward.color}
                  current={look.forward.current}
                />
              )}
              {look.backward && (
                <Arrow
                  points={arrowhead(ends.b, ends.a)}
                  color={look.backward.color}
                  current={look.backward.current}
                />
              )}
            </g>
          ) : null,
        )}
      </g>
      <g className="nodes">
        {paintOrder([...iso.values()]).map((n) => {
          const node = byId.get(n.id)!;
          const plinth = plinthFaces(n);
          return (
            <NodeButton
              key={n.id}
              node={node}
              look={looks.get(n.id)}
              name={nameOf(n.id)}
              onSelect={onSelect}
            >
              <polygon className="ring" points={toPoints(ringOf(n))} />
              <g className="body">
                {plinth.sides.map((side, i) => (
                  <polygon key={i} className="slab" points={toPoints(side)} />
                ))}
                <polygon className="plate" points={toPoints(plinth.top)} />
                <Glyph node={n} />
              </g>
            </NodeButton>
          );
        })}
      </g>
      <g className="labels">
        {diagram.nodes.map((node) => {
          const look = looks.get(node.id);
          const box = labelBox(iso.get(node.id)!, {
            id: node.id,
            text: node.label,
            y: node.labelY,
          });
          return (
            <g
              key={node.id}
              className={`lb${look?.ghost ? " ghost" : ""}${look?.dim ? " dim" : ""}${look?.selected ? " sel" : ""}${look?.isNew ? " new" : ""}`}
              onClick={() => onSelect(node.id)}
              aria-hidden="true"
            >
              <rect
                className="pill"
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                rx={13}
              />
              <text x={box.textX} y={box.textY}>
                {node.label}
              </text>
            </g>
          );
        })}
      </g>
    </>
  );
}

function Glyph({ node }: { node: IsoNode }) {
  const g = node.glyph;
  if (g.type === "crowd" || g.type === "person") {
    const heads = g.type === "crowd" ? CROWD_HEADS : [PERSON_HEAD];
    const solo = g.type === "person";
    return (
      <g className={`figures${solo ? " solo" : ""}`}>
        {heads.map(([hx, hy], i) => (
          <g key={i}>
            <rect
              className="fig-body"
              x={node.cx + hx - 3.8}
              y={node.cy + hy + 4.1}
              width={7.6}
              height={10.8}
              rx={3.8}
            />
            <circle
              className="fig-head"
              cx={node.cx + hx}
              cy={node.cy + hy}
              r={3.4}
            />
          </g>
        ))}
      </g>
    );
  }
  if (g.type === "cylinder") {
    const c = cylinderParts(node.cx, node.cy, g.rx, g.h, g.bands);
    return (
      <g className="glyph">
        <path className="face" d={c.body} />
        <path className="shade" d={c.body} style={{ fillOpacity: 0.45 }} />
        {c.bands.map((d, i) => (
          <path key={i} className="band" d={d} />
        ))}
        <ellipse
          className="face"
          cx={c.top.cx}
          cy={c.top.cy}
          rx={c.top.rx}
          ry={c.top.ry}
        />
      </g>
    );
  }
  // Blocks: back to front, each as left, shade, right, shade, top.
  const blocks = glyphBlocks(node);
  return (
    <g className="glyph">
      {blocks.map((block, i) =>
        blockFaces(block.x, block.y, block.b, block.H).map((face, j) => (
          <polygon
            key={`${i}-${j}`}
            className={face.shade ? "shade" : "face"}
            style={face.shade ? { fillOpacity: face.shade } : undefined}
            points={toPoints(face.points)}
          />
        )),
      )}
    </g>
  );
}

function Flat2D({
  diagram,
  scene,
  looks,
  nameOf,
  onSelect,
}: {
  diagram: Diagram;
  scene: Scene;
  looks: Map<string, NodeLook>;
  nameOf: (id: string) => string;
  onSelect: (id: string) => void;
}) {
  const paths = scene.edges.map((e) => ({
    look: e,
    points: parsePath(diagram.paths2[e.id] ?? ""),
  }));
  return (
    <>
      <g className="edges">
        {paths.map(({ look, points }) =>
          points.length > 1 ? (
            <path
              key={look.id}
              className={edgeClass(look)}
              d={pathOf(points)}
            />
          ) : null,
        )}
      </g>
      <g className="arrows" aria-hidden="true">
        {paths.map(({ look, points }) => {
          if (points.length < 2 || !look.visible) return null;
          const heads = pathArrows(points);
          return (
            <g key={look.id}>
              {look.forward && (
                <Arrow
                  points={heads.f}
                  color={look.forward.color}
                  current={look.forward.current}
                />
              )}
              {look.backward && (
                <Arrow
                  points={heads.b}
                  color={look.backward.color}
                  current={look.backward.current}
                />
              )}
            </g>
          );
        })}
      </g>
      <g className="nodes">
        {diagram.nodes.map((node) => {
          const [x, y, w, h] = node.box2;
          const cy = y + h / 2;
          return (
            <NodeButton
              key={node.id}
              node={node}
              look={looks.get(node.id)}
              name={nameOf(node.id)}
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
                  d={ICON_PATHS[node.icon]}
                  transform={`translate(${x + 18} ${cy - 9}) scale(.75)`}
                />
                <text className="name2" x={x + 52} y={cy - 2}>
                  {node.name2}
                </text>
                <text className="sub2" x={x + 52} y={cy + 13}>
                  {node.sub2}
                </text>
              </g>
            </NodeButton>
          );
        })}
      </g>
    </>
  );
}

/** A text version of the diagram (PRD design rule): what is built at this
    step, and the request's hops in order. */
export function StageText({
  diagram,
  scene,
  nameOf,
  stepLabel,
}: {
  diagram: Diagram;
  scene: Scene;
  nameOf: (id: string) => string;
  stepLabel: string;
}) {
  const built = diagram.nodes.filter(
    (n) => !scene.nodes.find((l) => l.id === n.id)?.ghost,
  );
  return (
    <details className="tt-stage-text">
      <summary>Text version of the diagram</summary>
      <p className="tt-body-s">
        {stepLabel}: {built.length} of {diagram.nodes.length} parts built.
      </p>
      <ul>
        {built.map((n) => (
          <li key={n.id}>
            {n.name2} <span className="tt-faint">· {n.sub2}</span>
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
    </details>
  );
}
