import { useEffect, useId, useRef } from "react";
import { NODE_ICON_PATHS } from "@/lib/icons";
import { DEPTH, ICON_SIZE, labelSize, type Layout } from "./geometry";

export type Inspect = { kind: "node" | "edge"; id: string };

type Props = {
  layout: Layout;
  /** Node and edge ids lit up on the current step; the rest are dimmed. */
  active: ReadonlySet<string>;
  /** Changes on every step, restarting the packets. */
  step: number;
  label: string;
  pinned: Inspect | null;
  /** Click or Enter/Space on a block or a line. */
  onPin: (target: Inspect) => void;
  /** Hover or focus on a line (null when it ends). */
  onPeek: (target: Inspect | null) => void;
  /** With reduced motion, packets sit still instead of travelling. */
  still: boolean;
};

/**
 * Draws a laid-out diagram as raised blocks on a stage. Highlighting is done
 * with data-on and CSS colour transitions (globals.css), so reduced motion
 * is one media query. Every block and line is a button, so notes and flows
 * work by keyboard as well as by pointer.
 */
export function Diagram({
  layout,
  active,
  step,
  label,
  pinned,
  onPin,
  onPeek,
  still,
}: Props) {
  const markerId = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const byId = new Map(layout.nodes.map((n) => [n.id, n]));
  const activeEdges = layout.edges.filter((e) => active.has(e.id));

  // Packets are keyed by step, so each step mounts fresh ones; start them.
  useEffect(() => {
    svgRef.current
      ?.querySelectorAll<SVGAnimationElement>("animateMotion")
      .forEach((a) => a.beginElement());
  }, [step, still]);

  const activate = (target: Inspect) => (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onPin(target);
    }
  };

  return (
    <svg
      ref={svgRef}
      className="diagram"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      role="group"
      aria-label={label}
    >
      <defs>
        {(["on", "off"] as const).map((state) => (
          <marker
            key={state}
            id={`${markerId}-${state}`}
            className={`arrow arrow-${state}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" />
          </marker>
        ))}
      </defs>

      {layout.edges.map((edge) => {
        const on = active.has(edge.id);
        const from = byId.get(edge.from)?.label ?? edge.from;
        const to = byId.get(edge.to)?.label ?? edge.to;
        const target: Inspect = { kind: "edge", id: edge.id };
        return (
          <g
            key={edge.id}
            className="edge"
            data-id={edge.id}
            data-on={on}
            data-pinned={pinned?.kind === "edge" && pinned.id === edge.id}
            role="button"
            tabIndex={0}
            aria-label={`${from} to ${to}${edge.flows ? `: ${edge.flows}` : ""}`}
            onClick={() => onPin(target)}
            onKeyDown={activate(target)}
            onPointerEnter={() => onPeek(target)}
            onPointerLeave={() => onPeek(null)}
            onFocus={() => onPeek(target)}
            onBlur={() => onPeek(null)}
          >
            {/* A wide invisible line makes thin edges easy to hover or tap. */}
            <line
              className="edge-hit"
              x1={edge.start.x}
              y1={edge.start.y}
              x2={edge.end.x}
              y2={edge.end.y}
            />
            <line
              className="edge-line"
              x1={edge.start.x}
              y1={edge.start.y}
              x2={edge.end.x}
              y2={edge.end.y}
              markerEnd={`url(#${markerId}-${on ? "on" : "off"})`}
            />
          </g>
        );
      })}

      {layout.edges.map((edge) => {
        if (!edge.label || !edge.labelAt) return null;
        const { w, h } = labelSize(edge.label);
        return (
          <g
            key={edge.id}
            className="pill"
            data-edge={edge.id}
            data-lit={active.has(edge.id)}
            aria-hidden="true"
          >
            <rect
              x={edge.labelAt.x - w / 2}
              y={edge.labelAt.y - h / 2}
              width={w}
              height={h}
              rx={h / 2}
            />
            <text
              x={edge.labelAt.x}
              y={edge.labelAt.y}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {edge.label}
            </text>
          </g>
        );
      })}

      {layout.nodes.map((node) => {
        const { x, y, w, h } = node.box;
        const target: Inspect = { kind: "node", id: node.id };
        const isPinned = pinned?.kind === "node" && pinned.id === node.id;
        return (
          <g
            key={node.id}
            className="node"
            data-id={node.id}
            data-on={active.has(node.id)}
            data-pinned={isPinned}
            role="button"
            tabIndex={0}
            aria-label={node.label}
            aria-pressed={isPinned}
            onClick={() => onPin(target)}
            onKeyDown={activate(target)}
          >
            <rect
              className="node-focus"
              x={x - 4}
              y={y - 4}
              width={w + 8}
              height={h + 8}
              rx="12"
            />
            <rect
              className="node-side"
              x={x}
              y={y + DEPTH}
              width={w}
              height={h - DEPTH}
              rx="9"
            />
            <rect
              className="node-face"
              x={x}
              y={y}
              width={w}
              height={h - DEPTH}
              rx="9"
            />
            <path
              className="node-icon"
              d={NODE_ICON_PATHS[node.icon ?? "dot"]}
              transform={`translate(${node.iconAt.x - ICON_SIZE / 2} ${node.iconAt.y - ICON_SIZE / 2}) scale(${ICON_SIZE / 16})`}
            />
            <text textAnchor="middle" dominantBaseline="central">
              {node.lines.map((line, i) => (
                <tspan key={i} x={node.center.x} y={node.lineYs[i]}>
                  {/* Keep a space between lines so the text reads as words. */}
                  {i < node.lines.length - 1 ? `${line} ` : line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}

      {/* An ember packet travels each active line, then rests, on a loop. */}
      {activeEdges.map((edge) =>
        still ? (
          <circle
            key={`${step}-${edge.id}`}
            className="packet"
            r="4.5"
            cx={edge.mid.x}
            cy={edge.mid.y}
          />
        ) : (
          <circle key={`${step}-${edge.id}`} className="packet" r="4.5">
            <animateMotion
              begin="indefinite"
              dur="1.8s"
              repeatCount="indefinite"
              keyPoints="0;1;1"
              keyTimes="0;0.6;1"
              calcMode="linear"
              path={`M${edge.start.x},${edge.start.y} L${edge.end.x},${edge.end.y}`}
            />
          </circle>
        ),
      )}
    </svg>
  );
}
