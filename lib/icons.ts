// One small set of line icons on a 16 × 16 grid, drawn with a 1.5 stroke.
// Used for diagram blocks (content/types.ts NODE_ICONS) and the interface.
import type { NodeIcon } from "@/content/types";

const ring = (r: number) =>
  `M${8 - r} 8a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

export const NODE_ICON_PATHS: Record<NodeIcon | "dot", string> = {
  dot: "M8 8h.01",
  text: "M3 4h10M3 8h10M3 12h6",
  question: `${ring(6.5)}M6.1 6.2a2 2 0 1 1 2.7 1.9c-.5.2-.8.6-.8 1.2M8 11.4h.01`,
  document: "M4 1.5h5l3 3v10H4zM9 1.5v3h3M6 8.5h4M6 11.5h4",
  split: "M1.5 8h4.5M6 8l3-4h5.5M6 8l3 4h5.5",
  vector:
    "M3 4h.01M8 4h.01M13 4h.01M3 8h.01M8 8h.01M13 8h.01M3 12h.01M8 12h.01M13 12h.01",
  chip: "M4.5 4.5h7v7h-7zM6 1.5v3M10 1.5v3M6 11.5v3M10 11.5v3M1.5 6h3M1.5 10h3M11.5 6h3M11.5 10h3",
  token: "M8 2l5.2 3v6L8 14l-5.2-3V5z",
  database:
    "M3 3.5c0-1.6 10-1.6 10 0v9c0 1.6-10 1.6-10 0zM3 3.5c0 1.6 10 1.6 10 0M3 8c0 1.6 10 1.6 10 0",
  list: "M2.5 4h.01M2.5 8h.01M2.5 12h.01M5.5 4h8M5.5 8h8M5.5 12h5",
  check: "M3 8.5l3 3 7-7",
  target: `${ring(6.5)}${ring(3.5)}M8 8h.01`,
  shield:
    "M8 1.5l5.5 2v4c0 3.4-2.4 5.9-5.5 7-3.1-1.1-5.5-3.6-5.5-7v-4zM5.5 8l2 2 3-3.5",
  tool: "M10.5 1.8a3.5 3.5 0 0 0-3.9 4.6L2 11l3 3 4.6-4.6a3.5 3.5 0 0 0 4.6-3.9l-2.2 2.2-2.3-.5-.5-2.3z",
};

export const UI_ICON_PATHS = {
  menu: "M2 4h12M2 8h12M2 12h12",
  close: "M3.5 3.5l9 9M12.5 3.5l-9 9",
  search: "M2.5 7a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0M10.3 10.3L14 14",
  sun: `${ring(3)}M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1`,
  moon: "M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z",
  replay: "M2.5 8a5.5 5.5 0 1 0 1.6-3.9M2.5 2.5v3.5H6",
  play: "M5 3l8 5-8 5z",
  pause: "M5 3v10M11 3v10",
  expand: "M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4",
  shrink: "M6 2v4H2M14 6h-4V2M10 14v-4h4M2 10h4v4",
  arrowRight: "M2.5 8h11M9 3.5L13.5 8 9 12.5",
  arrowLeft: "M13.5 8h-11M7 3.5L2.5 8 7 12.5",
  clock: `${ring(6.5)}M8 4.5V8l2.5 1.5`,
  steps: "M2.5 4h.01M2.5 8h.01M2.5 12h.01M5.5 4h8M5.5 8h8M5.5 12h8",
  level: "M3 13V10M8 13V6.5M13 13V3",
  check: "M3 8.5l3 3 7-7",
} as const;

export type UiIcon = keyof typeof UI_ICON_PATHS;
