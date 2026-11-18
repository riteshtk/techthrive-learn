// What the lesson page hands its player: plain data, resolved at build time
// (facts looked up, positions counted, narration files found), so none of
// that work ships to the browser.

import type { Lesson, TopicTabId } from "@/content/types";
import type { Drawing } from "./drawing";
import type { SandboxKind } from "./sandboxes";

export type StepSource = {
  title: string;
  detail: string;
  url?: string;
};

export type LessonPageData = {
  topic: {
    id: string;
    title: string;
    tabs: TopicTabId[];
    verifiedOn?: string;
  };
  lesson: Lesson;
  /** The system, drawn at build time. */
  drawing: Drawing;
  /** The diagram's name, e.g. "Card-dispute agent". */
  caption: string;
  /** From the topic's outline. */
  outline: {
    title: string;
    minutes: number;
    level: string;
    position: number;
    count: number;
  };
  /** Each step's sources, from the facts register. */
  sources: StepSource[][];
  /** Each step's narration audio (with the base path), when recorded. */
  audio: (string | null)[];
  /** Where the last step's button goes. */
  finish: { label: string; href: string };
  sandbox?: SandboxKind;
};
