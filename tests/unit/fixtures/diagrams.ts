// The design's two system diagrams (spec 04 appendices C and D, baked from
// Lesson.dc.html and PayLesson.dc.html). The engine must reproduce the
// design's own numbers (BAKED, below) from the content files within 0.25 px.

// The diagrams themselves are content; this file keeps only what the
// design baked, to check them against.
export { default as AGENTS } from "@/content/topics/ai-agents/diagrams/card-dispute-agent";
export { default as PAYMENTS } from "@/content/topics/payments/diagrams/checkout-payments";

type Baked = {
  viewBox: [number, number];
  labels: Record<string, { x: number; w: number }>;
  edges: Record<string, { a: [number, number]; b: [number, number] }>;
  /** Glyph block bases the design draws at (cube dyPx), by node. */
  blockY: Record<string, number[]>;
};

/** The design's own numbers (appendices C and D). */
export const BAKED: Record<"agents" | "payments", Baked> = {
  agents: {
    viewBox: [950, 567],
    labels: {
      X: { x: 801.8, w: 116.3 },
      M: { x: 227.2, w: 116.3 },
      P: { x: 613.6, w: 123.4 },
      H: { x: 808.6, w: 123.4 },
      E: { x: 18, w: 144.7 },
      O: { x: 410.9, w: 151.8 },
      T: { x: 630.8, w: 102.1 },
      G: { x: 259.1, w: 130.5 },
      D: { x: 796.2, w: 109.2 },
      U: { x: 75.9, w: 158.9 },
      V: { x: 464.7, w: 109.2 },
    },
    edges: {
      U_G: { a: [223.2, 414.2], b: [283.5, 382.7] },
      G_O: { a: [363.4, 338.8], b: [435.3, 297.4] },
      U_O: { a: [221.7, 413.3], b: [434.1, 296.7] },
      O_M: { a: [437.7, 236.7], b: [327, 166.6] },
      O_P: { a: [540.1, 239], b: [633.4, 188.9] },
      O_T: { a: [546.8, 292.5], b: [631, 327.3] },
      T_D: { a: [726.1, 373.2], b: [806.6, 418.3] },
      O_V: { a: [496.5, 321.5], b: [512.1, 408.9] },
      P_H: { a: [722.3, 186], b: [831.5, 231.9] },
      E_O: { a: [157.5, 254.7], b: [390.5, 263.9] },
      O_X: { a: [541.5, 239.9], b: [821.8, 97.3] },
      T_X: { a: [705.9, 311.8], b: [840.2, 107.9] },
    },
    blockY: {
      X: [74.3, 66.2, 58.1],
      E: [248.5, 235.9],
      T: [328.5, 360.9],
    },
  },
  payments: {
    viewBox: [983, 550],
    labels: {
      I: { x: 199.9, w: 144.7 },
      V: { x: 589.9, w: 144.7 },
      W: { x: 827.4, w: 137.6 },
      R: { x: 26.2, w: 102.1 },
      S: { x: 408.5, w: 130.5 },
      P: { x: 625.9, w: 137.6 },
      A: { x: 224.7, w: 173.1 },
      C: { x: 59.2, w: 166 },
      N: { x: 834.5, w: 123.4 },
      L: { x: 439.8, w: 158.9 },
      Q: { x: 269.6, w: 109.2 },
    },
    edges: {
      C_A: { a: [210.1, 368.9], b: [270.3, 337.4] },
      A_S: { a: [350.3, 293.5], b: [422.2, 252.1] },
      S_I: { a: [424.6, 191.4], b: [313.9, 121.3] },
      S_R: { a: [377.4, 218.6], b: [144.4, 209.4] },
      S_V: { a: [523.3, 191.6], b: [623.2, 129.6] },
      V_P: { a: [669.4, 148.1], b: [687.1, 254.4] },
      S_P: { a: [537.6, 244.9], b: [640.6, 281.3] },
      P_W: { a: [742.2, 277.4], b: [857.2, 221.8] },
      W_S: { a: [829.8, 206], b: [569, 218] },
      S_L: { a: [486.3, 274.5], b: [508.6, 366.7] },
      L_Q: { a: [469.4, 432.5], b: [365.2, 477.6] },
      N_P: { a: [855.1, 383.2], b: [740.8, 324.2] },
      N_L: { a: [820.6, 405.7], b: [604, 409.4] },
    },
    blockY: {
      N: [400.8, 388.2],
      Q: [491.8, 483.7, 475.6],
    },
  },
};
