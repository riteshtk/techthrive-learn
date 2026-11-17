// Content checks (PRD F9). Run by `npm run build` and `npm test` through
// scripts/check-content.ts. Works on raw, untrusted values so a broken file
// gets a clear message naming the file and field, not a crash.

import {
  NARROW,
  WIDE,
  edgeLabelsOverNodes,
  edgesCrossingNodes,
  layoutDiagram,
  wrapLabel,
} from "../player/geometry";
import { NODE_ICONS, type DiagramEdge, type DiagramNode } from "./types";

export type Issue = { file: string; field: string; message: string };

export function formatIssue(issue: Issue): string {
  return `${issue.file} › ${issue.field}: ${issue.message}`;
}

export const LIMITS = {
  title: 60,
  summary: 140,
  stepText: 140,
  goal: 140,
  label: 20,
  word: 10,
  labelLines: 2,
  minSteps: 3,
  maxSteps: 9,
  maxX: 3,
  maxY: 5,
  stepTitle: 24,
  note: 90,
  flows: 40,
  minMinutes: 1,
  maxMinutes: 60,
} as const;

const LEVELS = ["basics", "intermediate", "advanced"];
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** Hosts that count as Tech & Thrive's own, for the outside-source rule. */
const TECH_THRIVE_HOST = /tech-?(and-?)?thrive/i;

type Input = {
  topics: { file: string; topic: unknown }[];
  roadmaps: { file: string; roadmap: unknown }[];
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function baseName(file: string): string {
  return file.replace(/^.*\//, "").replace(/\.ts$/, "");
}

/** Ends like a sentence and doesn't run on into a second one. */
function isOneSentence(text: string): boolean {
  return /[.!?]$/.test(text) && !/[.!?]\s+[A-Z]/.test(text.slice(0, -1));
}

export function validateContent({ topics, roadmaps }: Input): Issue[] {
  const issues: Issue[] = [];
  const topicIds = new Set<string>();

  for (const { file, topic } of topics) {
    const add = (field: string, message: string) =>
      issues.push({ file, field, message });

    if (!isObj(topic)) {
      add("default export", "must be a topic object");
      continue;
    }

    const text = (
      field: string,
      max?: number,
      opts: { sentence?: boolean } = {},
    ): string | undefined => {
      const value = topic[field];
      if (typeof value !== "string" || value.trim() === "") {
        add(field, "is missing");
        return undefined;
      }
      if (max !== undefined && value.length > max)
        add(field, `is ${value.length} characters; the limit is ${max}`);
      if (opts.sentence && !isOneSentence(value))
        add(field, "must be one sentence");
      return value;
    };

    const id = text("id");
    if (id !== undefined) {
      if (!KEBAB.test(id)) add("id", `"${id}" must be kebab-case`);
      if (id !== baseName(file))
        add("id", `"${id}" must match the file name "${baseName(file)}"`);
      if (topicIds.has(id)) add("id", `"${id}" is used by another topic`);
      topicIds.add(id);
    }
    text("title", LIMITS.title);
    text("summary", LIMITS.summary, { sentence: true });
    const minutes = topic.minutes;
    if (
      !Number.isInteger(minutes) ||
      (minutes as number) < LIMITS.minMinutes ||
      (minutes as number) > LIMITS.maxMinutes
    )
      add(
        "minutes",
        `must be a whole number from ${LIMITS.minMinutes} to ${LIMITS.maxMinutes}`,
      );
    if (!LEVELS.includes(topic.level as string))
      add("level", `must be one of ${LEVELS.join(", ")}`);

    // Diagram ------------------------------------------------------------
    const diagram = topic.diagram;
    const nodes: DiagramNode[] = [];
    const edges: DiagramEdge[] = [];
    const allIds = new Map<string, string>(); // id → field that declared it
    const declare = (id: unknown, field: string) => {
      if (typeof id !== "string" || id === "") {
        add(field, "is missing");
        return false;
      }
      const first = allIds.get(id);
      if (first) {
        add(field, `"${id}" repeats the id at ${first}`);
        return false;
      }
      allIds.set(id, field);
      return true;
    };

    if (!isObj(diagram) || !Array.isArray(diagram.nodes)) {
      add("diagram.nodes", "is missing");
    } else {
      if (diagram.nodes.length === 0) add("diagram.nodes", "is empty");
      const cells = new Map<string, string>();
      diagram.nodes.forEach((raw: unknown, i: number) => {
        const field = `diagram.nodes[${i}]`;
        if (!isObj(raw)) return add(field, "must be an object");
        const ok = declare(raw.id, `${field}.id`);
        const label = raw.label;
        if (typeof label !== "string" || label.trim() === "") {
          add(`${field}.label`, "is missing");
        } else {
          if (label.length > LIMITS.label)
            add(
              `${field}.label`,
              `"${label}" is ${label.length} characters; the limit is ${LIMITS.label}`,
            );
          const long = label.split(/\s+/).find((w) => w.length > LIMITS.word);
          if (long)
            add(
              `${field}.label`,
              `the word "${long}" is over ${LIMITS.word} characters`,
            );
          else if (wrapLabel(label).length > LIMITS.labelLines)
            add(`${field}.label`, `"${label}" needs more than two lines`);
        }
        const note = raw.note;
        if (typeof note !== "string" || note.trim() === "") {
          add(`${field}.note`, "is missing");
        } else {
          if (note.length > LIMITS.note)
            add(
              `${field}.note`,
              `is ${note.length} characters; the limit is ${LIMITS.note}`,
            );
          if (!isOneSentence(note))
            add(`${field}.note`, "must be one sentence");
        }
        if (
          raw.icon !== undefined &&
          !(NODE_ICONS as readonly unknown[]).includes(raw.icon)
        )
          add(`${field}.icon`, `must be one of ${NODE_ICONS.join(", ")}`);
        const x = raw.x;
        const y = raw.y;
        const xOk =
          Number.isInteger(x) &&
          (x as number) >= 0 &&
          (x as number) <= LIMITS.maxX;
        const yOk =
          Number.isInteger(y) &&
          (y as number) >= 0 &&
          (y as number) <= LIMITS.maxY;
        if (!xOk)
          add(`${field}.x`, `must be a whole number from 0 to ${LIMITS.maxX}`);
        if (!yOk)
          add(`${field}.y`, `must be a whole number from 0 to ${LIMITS.maxY}`);
        if (xOk && yOk) {
          const cell = `${x},${y}`;
          const other = cells.get(cell);
          if (other) add(field, `shares cell (${cell}) with ${other}`);
          else cells.set(cell, `"${String(raw.id)}"`);
        }
        if (ok && typeof label === "string" && xOk && yOk)
          nodes.push({
            id: raw.id as string,
            label,
            note: typeof note === "string" ? note : "",
            x: x as number,
            y: y as number,
          });
      });
    }

    const nodeIds = new Set(nodes.map((n) => n.id));
    if (isObj(diagram) && Array.isArray(diagram.edges)) {
      diagram.edges.forEach((raw: unknown, i: number) => {
        const field = `diagram.edges[${i}]`;
        if (!isObj(raw)) return add(field, "must be an object");
        const ok = declare(raw.id, `${field}.id`);
        let ends = true;
        for (const end of ["from", "to"] as const) {
          const v = raw[end];
          if (typeof v !== "string" || !nodeIds.has(v)) {
            add(`${field}.${end}`, `"${String(v)}" is not a node id`);
            ends = false;
          }
        }
        if (ends && raw.from === raw.to)
          add(field, "must join two different nodes");
        if (
          raw.label !== undefined &&
          (typeof raw.label !== "string" || raw.label.length > LIMITS.label)
        )
          add(
            `${field}.label`,
            `must be text of at most ${LIMITS.label} characters`,
          );
        if (
          raw.flows !== undefined &&
          (typeof raw.flows !== "string" ||
            raw.flows.trim() === "" ||
            raw.flows.length > LIMITS.flows)
        )
          add(
            `${field}.flows`,
            `must be text of at most ${LIMITS.flows} characters`,
          );
        if (ok && ends && raw.from !== raw.to)
          edges.push({
            id: raw.id as string,
            from: raw.from as string,
            to: raw.to as string,
            label: raw.label as string | undefined,
          });
      });
    } else if (isObj(diagram)) {
      add("diagram.edges", "is missing");
    }

    // Layout rules, using the renderer's own geometry, for both the phone
    // layout and the wider one big screens use.
    const said = new Set<string>();
    for (const [size, where] of [
      [NARROW, ""],
      [WIDE, " on wide screens"],
    ] as const) {
      const layout = layoutDiagram(nodes, edges, size);
      // A problem found on both layouts is reported once, phone first.
      const once = (key: string, field: string, message: string) => {
        if (!said.has(key)) add(field, message);
        said.add(key);
      };
      for (const { edge, node } of edgesCrossingNodes(layout)) {
        once(
          `cross|${edge.id}|${node.id}`,
          `diagram.edges[${edges.findIndex((e) => e.id === edge.id)}]`,
          `"${edge.id}" crosses node "${node.id}"${where}; move a node so the line is clear`,
        );
      }
      for (const { edge, node } of edgeLabelsOverNodes(layout)) {
        once(
          `label|${edge.id}`,
          `diagram.edges[${edges.findIndex((e) => e.id === edge.id)}].label`,
          node
            ? `"${edge.label}" has no room beside its line${where} and overlaps node "${node.id}"; leave a gap or empty cell between the nodes`
            : `"${edge.label}" has no room beside its line inside the diagram${where}; move the nodes inwards`,
        );
      }
    }

    // Steps ----------------------------------------------------------------
    const steps = topic.steps;
    if (!Array.isArray(steps)) {
      add("steps", "is missing");
    } else {
      if (steps.length < LIMITS.minSteps || steps.length > LIMITS.maxSteps)
        add(
          "steps",
          `has ${steps.length} steps; topics need ${LIMITS.minSteps} to ${LIMITS.maxSteps}`,
        );
      steps.forEach((raw: unknown, i: number) => {
        const field = `steps[${i}]`;
        if (!isObj(raw)) return add(field, "must be an object");
        const title = raw.title;
        if (typeof title !== "string" || title.trim() === "")
          add(`${field}.title`, "is missing");
        else {
          if (title.length > LIMITS.stepTitle)
            add(
              `${field}.title`,
              `"${title}" is ${title.length} characters; the limit is ${LIMITS.stepTitle}`,
            );
          if (/[.!?]$/.test(title))
            add(`${field}.title`, "is a short name; leave off the full stop");
        }
        const t = raw.text;
        if (typeof t !== "string" || t.trim() === "")
          add(`${field}.text`, "is missing");
        else {
          if (t.length > LIMITS.stepText)
            add(
              `${field}.text`,
              `is ${t.length} characters; the limit is ${LIMITS.stepText}`,
            );
          if (!isOneSentence(t)) add(`${field}.text`, "must be one sentence");
        }
        if (!Array.isArray(raw.highlight) || raw.highlight.length === 0) {
          add(`${field}.highlight`, "must list at least one node or edge id");
        } else {
          for (const h of raw.highlight) {
            if (typeof h !== "string" || !allIds.has(h))
              add(`${field}.highlight`, `unknown id "${String(h)}"`);
          }
        }
      });
    }

    // Sources and video ------------------------------------------------
    const sources = topic.sources;
    if (!Array.isArray(sources) || sources.length === 0) {
      add("sources", "must list at least one source");
    } else {
      let outside = false;
      sources.forEach((raw: unknown, i: number) => {
        const field = `sources[${i}]`;
        if (!isObj(raw)) return add(field, "must be an object");
        if (typeof raw.title !== "string" || raw.title.trim() === "")
          add(`${field}.title`, "is missing");
        let url: URL | undefined;
        try {
          url = new URL(String(raw.url));
        } catch {
          add(`${field}.url`, "must be a full https:// link");
        }
        if (url && url.protocol !== "https:")
          add(`${field}.url`, "must be a full https:// link");
        if (url && !TECH_THRIVE_HOST.test(url.hostname)) outside = true;
        const read = raw.read;
        if (
          typeof read !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(read) ||
          Number.isNaN(Date.parse(read))
        )
          add(`${field}.read`, "must be the date checked, as YYYY-MM-DD");
      });
      if (!outside)
        add("sources", "needs at least one source outside Tech & Thrive");
    }

    const video = topic.video;
    if (video !== undefined) {
      if (!isObj(video)) add("video", "must be { youtubeId, title }");
      else {
        if (
          typeof video.youtubeId !== "string" ||
          !/^[A-Za-z0-9_-]{11}$/.test(video.youtubeId)
        )
          add("video.youtubeId", "must be an 11-character YouTube video id");
        if (typeof video.title !== "string" || video.title.trim() === "")
          add("video.title", "is missing");
      }
    }
  }

  // Roadmaps ---------------------------------------------------------------
  const roadmapIds = new Set<string>();
  for (const { file, roadmap } of roadmaps) {
    const add = (field: string, message: string) =>
      issues.push({ file, field, message });
    if (!isObj(roadmap)) {
      add("default export", "must be a roadmap object");
      continue;
    }
    const id = roadmap.id;
    if (typeof id !== "string" || id === "") add("id", "is missing");
    else {
      if (!KEBAB.test(id)) add("id", `"${id}" must be kebab-case`);
      if (id !== baseName(file))
        add("id", `"${id}" must match the file name "${baseName(file)}"`);
      if (roadmapIds.has(id)) add("id", `"${id}" is used by another roadmap`);
      roadmapIds.add(id);
    }
    if (typeof roadmap.title !== "string" || roadmap.title.trim() === "")
      add("title", "is missing");
    else if (roadmap.title.length > LIMITS.title)
      add(
        "title",
        `is ${roadmap.title.length} characters; the limit is ${LIMITS.title}`,
      );
    if (typeof roadmap.goal !== "string" || roadmap.goal.trim() === "")
      add("goal", "is missing");
    else if (roadmap.goal.length > LIMITS.goal || roadmap.goal.includes("\n"))
      add("goal", `must be one line of at most ${LIMITS.goal} characters`);
    if (!Array.isArray(roadmap.topics) || roadmap.topics.length === 0) {
      add("topics", "must list at least one topic id");
    } else {
      const seen = new Set<string>();
      roadmap.topics.forEach((t: unknown, i: number) => {
        if (typeof t !== "string" || !topicIds.has(t))
          add(
            `topics[${i}]`,
            `"${String(t)}" is not a topic; add content/topics/${String(t)}.ts or fix the id`,
          );
        else if (seen.has(t)) add(`topics[${i}]`, `"${t}" is listed twice`);
        if (typeof t === "string") seen.add(t);
      });
    }
  }

  return issues;
}
