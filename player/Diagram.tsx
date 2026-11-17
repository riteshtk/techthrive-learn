import { useId } from "react";
import { LABEL_LINE_H, type Layout } from "./geometry";

type Props = {
  layout: Layout;
  /** Node and edge ids lit up on the current step; the rest are dimmed. */
  active: ReadonlySet<string>;
  label: string;
};

/**
 * Draws a laid-out diagram as SVG. Highlighting is done with data-on and
 * CSS colour transitions (globals.css), so reduced motion is one media query.
 */
export function Diagram({ layout, active, label }: Props) {
  const markerId = useId().replace(/[^a-zA-Z0-9-]/g, "");
  return (
    <svg
      className="diagram"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      role="img"
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
        return (
          <g key={edge.id} className="edge" data-id={edge.id} data-on={on}>
            <line
              x1={edge.start.x}
              y1={edge.start.y}
              x2={edge.end.x}
              y2={edge.end.y}
              markerEnd={`url(#${markerId}-${on ? "on" : "off"})`}
            />
            {edge.label && edge.labelAt ? (
              <text
                className="edge-label"
                x={edge.labelAt.x}
                y={edge.labelAt.y}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {edge.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {layout.nodes.map((node) => (
        <g
          key={node.id}
          className="node"
          data-id={node.id}
          data-on={active.has(node.id)}
        >
          <rect
            x={node.box.x}
            y={node.box.y}
            width={node.box.w}
            height={node.box.h}
            rx="8"
          />
          <text textAnchor="middle" dominantBaseline="central">
            {node.lines.map((line, i) => (
              <tspan
                key={i}
                x={node.center.x}
                y={
                  node.center.y +
                  (i - (node.lines.length - 1) / 2) * LABEL_LINE_H
                }
              >
                {line}
              </tspan>
            ))}
          </text>
        </g>
      ))}
    </svg>
  );
}
