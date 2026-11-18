// Checks every v2 content file (PRD P3). It treats each file as untrusted:
// schema first, then the links between files, then the figure rule. Every
// problem names the file and the field. Nothing here throws.

import { edgeOfHop, effectiveTrace, isPresent } from "../player/trace";
import { figureKey, figureKeys, figuresIn } from "./figures";
import { checkFile, type Issue } from "./schema";
import {
  CheckpointSchema,
  DiagramSchema,
  FactFileSchema,
  LessonSchema,
  RESERVED_TOPIC_IDS,
  TopicSchema,
  type Checkpoint,
  type Diagram,
  type Fact,
  type Lesson,
  type Topic,
} from "./types";

export type ContentFile = { file: string; data: unknown };

export type ContentInput = {
  topics: ContentFile[];
  lessons: ContentFile[];
  checkpoints: ContentFile[];
  diagrams: ContentFile[];
  facts: ContentFile[];
};

/** The checked content, for pages and the search index. */
export type Content = {
  topics: Topic[];
  lessons: Lesson[];
  checkpoints: Checkpoint[];
  diagrams: Diagram[];
  facts: Fact[];
};

/** content/topics/<topic>/… → the topic folder's name. */
function topicFolder(file: string): string | undefined {
  return file.match(/^content\/topics\/([^/]+)\//)?.[1];
}

/** The file's name without folders or ".ts". */
function baseName(file: string): string {
  return file.slice(file.lastIndexOf("/") + 1).replace(/\.ts$/, "");
}

/** Fields whose strings are ids, links, colours or code, not words a
    learner reads. */
const NOT_DISPLAY = new Set([
  "id",
  "topic",
  "lesson",
  "from",
  "to",
  "color",
  "addsColor",
  "edges",
  "newNodes",
  "facts",
  "tabs",
  "kind",
  "type",
  "verdict",
  "code",
  "standards",
  "bypass",
  "sandbox",
  "status",
  "level",
  "url",
  "icon",
  "glyph",
  "paths2",
]);

/** Calls back with every display string in a content object. */
function walkText(
  value: unknown,
  path: string,
  visit: (text: string, path: string) => void,
) {
  if (typeof value === "string") visit(value, path);
  else if (Array.isArray(value))
    value.forEach((v, i) => walkText(v, `${path}[${i}]`, visit));
  else if (typeof value === "object" && value !== null)
    for (const [k, v] of Object.entries(value)) {
      if (NOT_DISPLAY.has(k)) continue;
      walkText(v, path ? `${path}.${k}` : k, visit);
    }
}

export function validateContent(
  input: ContentInput,
  today: string,
): { issues: Issue[]; content: Content } {
  const issues: Issue[] = [];
  const error = (file: string, field: string, message: string) =>
    issues.push({ file, field, message });
  const warn = (file: string, field: string, message: string) =>
    issues.push({ file, field, message, level: "warning" });

  // Schemas ---------------------------------------------------------------
  const topics: { file: string; topic: Topic }[] = [];
  for (const { file, data } of input.topics)
    if (checkFile(TopicSchema, file, data, issues))
      topics.push({ file, topic: data });
  const lessons: { file: string; lesson: Lesson }[] = [];
  for (const { file, data } of input.lessons)
    if (checkFile(LessonSchema, file, data, issues))
      lessons.push({ file, lesson: data });
  const checkpoints: { file: string; checkpoint: Checkpoint }[] = [];
  for (const { file, data } of input.checkpoints)
    if (checkFile(CheckpointSchema, file, data, issues))
      checkpoints.push({ file, checkpoint: data });
  const diagrams: { file: string; diagram: Diagram }[] = [];
  for (const { file, data } of input.diagrams)
    if (checkFile(DiagramSchema, file, data, issues))
      diagrams.push({ file, diagram: data });
  const facts: { file: string; field: string; fact: Fact }[] = [];
  for (const { file, data } of input.facts)
    if (checkFile(FactFileSchema, file, data, issues))
      data.forEach((fact, i) => facts.push({ file, field: `[${i}]`, fact }));

  const topicById = new Map(topics.map((t) => [t.topic.id, t.topic]));
  const factById = new Map<string, Fact>();

  // Facts -----------------------------------------------------------------
  for (const { file, field, fact } of facts) {
    const f = (name: string) => `${field}.${name}`;
    if (factById.has(fact.id))
      error(file, f("id"), `"${fact.id}" is used by another fact`);
    else factById.set(fact.id, fact);
    if (fact.kind === "real" && !fact.url)
      error(file, f("url"), "a real fact needs its primary source's link");
    if (!isRealDate(fact.readOn))
      error(file, f("readOn"), `${fact.readOn} is not a real date`);
    if (!isRealDate(fact.recheckBy))
      error(file, f("recheckBy"), `${fact.recheckBy} is not a real date`);
    else if (fact.recheckBy <= fact.readOn)
      error(file, f("recheckBy"), "must come after readOn");
    else if (fact.recheckBy < today)
      warn(
        file,
        f("recheckBy"),
        `"${fact.id}" was due for a re-check on ${fact.recheckBy}`,
      );
    if (fact.changedOn !== undefined && fact.previousValue === undefined)
      error(file, f("previousValue"), "a changed fact needs its old value");
    if (fact.changedOn !== undefined && !isRealDate(fact.changedOn))
      error(file, f("changedOn"), `${fact.changedOn} is not a real date`);
    fact.topics.forEach((t, i) => {
      if (!topicById.has(t))
        error(file, f(`topics[${i}]`), `"${t}" is not a topic`);
    });
  }

  // Topics ----------------------------------------------------------------
  for (const { file, topic } of topics) {
    if (topicFolder(file) !== topic.id)
      error(
        file,
        "id",
        `"${topic.id}" must match its folder, content/topics/${topic.id}/`,
      );
    if ((RESERVED_TOPIC_IDS as readonly string[]).includes(topic.id))
      error(
        file,
        "id",
        `"${topic.id}" is a v1 address that redirects; choose another id`,
      );
    const seen = new Set<string>();
    topic.lessons.forEach((l, i) => {
      if (seen.has(l.id))
        error(file, `lessons[${i}].id`, `"${l.id}" is listed twice`);
      seen.add(l.id);
    });
    if (topic.status === "live" && topic.lessons.length === 0)
      error(file, "lessons", "a live topic needs its course outline");
  }

  // Diagrams --------------------------------------------------------------
  const diagramByKey = new Map<string, Diagram>();
  for (const { file, diagram } of diagrams) {
    if (baseName(file) !== diagram.id)
      error(file, "id", `"${diagram.id}" must match the file name`);
    if (topicFolder(file) !== diagram.topic)
      error(file, "topic", `must be "${topicFolder(file)}", its folder`);
    if (!topicById.has(diagram.topic))
      error(file, "topic", `"${diagram.topic}" is not a topic`);
    diagramByKey.set(`${diagram.topic}/${diagram.id}`, diagram);
    const ids = new Set<string>();
    diagram.nodes.forEach((n, i) => {
      if (ids.has(n.id))
        error(file, `nodes[${i}].id`, `"${n.id}" is used twice`);
      ids.add(n.id);
    });
    for (const edge of Object.keys(diagram.paths2))
      for (const end of edge.split("_"))
        if (!ids.has(end))
          error(file, `paths2.${edge}`, `"${end}" is not a node`);
  }

  // Lessons ---------------------------------------------------------------
  const lessonByKey = new Map<string, Lesson>();
  for (const { file, lesson } of lessons) {
    if (baseName(file) !== lesson.id)
      error(file, "id", `"${lesson.id}" must match the file name`);
    if (topicFolder(file) !== lesson.topic)
      error(file, "topic", `must be "${topicFolder(file)}", its folder`);
    const topic = topicById.get(lesson.topic);
    if (!topic) error(file, "topic", `"${lesson.topic}" is not a topic`);
    else if (!topic.lessons.some((l) => l.id === lesson.id))
      error(
        file,
        "id",
        `"${lesson.id}" is not in the lessons of content/topics/${lesson.topic}/topic.ts`,
      );
    lessonByKey.set(`${lesson.topic}/${lesson.id}`, lesson);
    checkLesson(file, lesson, factById, error);
    const diagram = diagramByKey.get(`${lesson.topic}/${lesson.diagram}`);
    if (!diagram)
      error(
        file,
        "diagram",
        `"${lesson.diagram}" has no file in content/topics/${lesson.topic}/diagrams/`,
      );
    else {
      const drawn = new Set(diagram.nodes.map((n) => n.id));
      lesson.nodes.forEach((n, i) => {
        if (!drawn.has(n.id))
          error(file, `nodes[${i}].id`, `"${n.id}" is not in the diagram`);
      });
      for (const id of drawn)
        if (!lesson.nodes.some((n) => n.id === id))
          error(file, "nodes", `the diagram's "${id}" has no lesson node`);
      lesson.edges.forEach((e, i) => {
        if (!diagram.paths2[e])
          error(file, `edges[${i}]`, `"${e}" has no 2D path in the diagram`);
      });
    }
  }

  // Checkpoints -----------------------------------------------------------
  for (const { file, checkpoint } of checkpoints) {
    if (baseName(file) !== checkpoint.lesson)
      error(file, "lesson", `must be "${baseName(file)}", the file name`);
    if (topicFolder(file) !== checkpoint.topic)
      error(file, "topic", `must be "${topicFolder(file)}", its folder`);
    const lesson = lessonByKey.get(`${checkpoint.topic}/${checkpoint.lesson}`);
    if (!lesson)
      error(
        file,
        "lesson",
        `"${checkpoint.lesson}" has no lesson file in content/topics/${checkpoint.topic}/lessons/`,
      );
    if (!checkpoint.approved)
      warn(
        file,
        "approved",
        "not yet checked against the sources and approved",
      );
    const ids = new Set<string>();
    checkpoint.questions.forEach((q, i) => {
      const at = `questions[${i}]`;
      if (ids.has(q.id)) error(file, `${at}.id`, `"${q.id}" is used twice`);
      ids.add(q.id);
      const right = q.options.filter((o) => o.verdict === "right").length;
      if (right !== 1)
        error(
          file,
          `${at}.options`,
          `needs exactly one right option, not ${right}`,
        );
      const letters = q.options.map((o) => o.id).join("");
      if (letters !== "ABCD")
        error(file, `${at}.options`, `must be A, B, C and D in order`);
      if (lesson && q.replayStep > lesson.steps.length)
        error(
          file,
          `${at}.replayStep`,
          `the lesson has ${lesson.steps.length} steps`,
        );
      q.facts.forEach((id, j) =>
        checkFactRef(
          file,
          `${at}.facts[${j}]`,
          id,
          checkpoint.topic,
          factById,
          error,
        ),
      );
    });
  }

  // Figures: every one on screen is in the register -----------------------
  const keysByTopic = new Map<string, Set<string>>();
  for (const fact of factById.values())
    for (const t of fact.topics) {
      const keys = keysByTopic.get(t) ?? new Set<string>();
      for (const k of figureKeys(fact.value)) keys.add(k);
      keysByTopic.set(t, keys);
    }
  const checkFigures = (file: string, topicId: string, data: unknown) =>
    walkText(data, "", (text, path) => {
      const keys = keysByTopic.get(topicId);
      for (const figure of figuresIn(text))
        if (!keys?.has(figureKey(figure)))
          error(
            file,
            path,
            `the figure "${figure}" is not in the facts register for "${topicId}"; add a fact whose value shows it (content/facts/)`,
          );
    });
  for (const { file, topic } of topics) checkFigures(file, topic.id, topic);
  for (const { file, lesson } of lessons)
    checkFigures(file, lesson.topic, lesson);
  for (const { file, checkpoint } of checkpoints)
    checkFigures(file, checkpoint.topic, checkpoint);
  for (const { file, diagram } of diagrams)
    checkFigures(file, diagram.topic, diagram);

  return {
    issues,
    content: {
      topics: topics.map((t) => t.topic),
      lessons: lessons.map((l) => l.lesson),
      checkpoints: checkpoints.map((c) => c.checkpoint),
      diagrams: diagrams.map((d) => d.diagram),
      facts: [...factById.values()],
    },
  };
}

function checkFactRef(
  file: string,
  field: string,
  id: string,
  topicId: string,
  factById: Map<string, Fact>,
  error: (file: string, field: string, message: string) => void,
) {
  const fact = factById.get(id);
  if (!fact) error(file, field, `"${id}" is not in the facts register`);
  else if (!fact.topics.includes(topicId))
    error(file, field, `"${id}" doesn't list "${topicId}" in its topics`);
}

function checkLesson(
  file: string,
  lesson: Lesson,
  factById: Map<string, Fact>,
  error: (file: string, field: string, message: string) => void,
) {
  const nodeIds = new Set<string>();
  lesson.nodes.forEach((n, i) => {
    if (nodeIds.has(n.id))
      error(file, `nodes[${i}].id`, `"${n.id}" is used twice`);
    nodeIds.add(n.id);
    if (n.addedAt > lesson.steps.length)
      error(
        file,
        `nodes[${i}].addedAt`,
        `the lesson has ${lesson.steps.length} steps`,
      );
    n.standards?.forEach((s, j) => {
      if (!lesson.standards?.[s])
        error(
          file,
          `nodes[${i}].standards[${j}]`,
          `"${s}" is not in standards`,
        );
    });
  });

  const edgeIds = new Set<string>();
  lesson.edges.forEach((e, i) => {
    if (edgeIds.has(e)) error(file, `edges[${i}]`, `"${e}" is listed twice`);
    edgeIds.add(e);
    for (const end of e.split("_"))
      if (!nodeIds.has(end))
        error(file, `edges[${i}]`, `"${end}" is not a node`);
  });

  if (lesson.bypass) {
    if (!nodeIds.has(lesson.bypass.node))
      error(file, "bypass.node", `"${lesson.bypass.node}" is not a node`);
    if (!edgeIds.has(lesson.bypass.edge))
      error(file, "bypass.edge", `"${lesson.bypass.edge}" is not an edge`);
  }

  lesson.steps.forEach((step, s) => {
    const n = s + 1;
    const at = `steps[${s}]`;
    step.newNodes.forEach((id, j) => {
      if (!isPresent(lesson, id, n))
        error(file, `${at}.newNodes[${j}]`, `"${id}" isn't built by step ${n}`);
    });
    step.trace.forEach((hop, j) => {
      if (!nodeIds.has(hop.from))
        error(file, `${at}.trace[${j}].from`, `"${hop.from}" is not a node`);
      if (!nodeIds.has(hop.to))
        error(file, `${at}.trace[${j}].to`, `"${hop.to}" is not a node`);
    });
    // After the bypass rule, every hop runs along an edge between two
    // parts that exist at this step.
    effectiveTrace(lesson, n).forEach((hop) => {
      if (!edgeOfHop(lesson.edges, hop))
        error(file, `${at}.trace`, `no edge joins ${hop.from} and ${hop.to}`);
      for (const end of [hop.from, hop.to])
        if (nodeIds.has(end) && !isPresent(lesson, end, n))
          error(
            file,
            `${at}.trace`,
            `${hop.from}→${hop.to}: "${end}" isn't built by step ${n}`,
          );
    });
    step.facts.forEach((id, j) =>
      checkFactRef(
        file,
        `${at}.facts[${j}]`,
        id,
        lesson.topic,
        factById,
        error,
      ),
    );
  });
}

/** Date.parse rolls 31 Feb over to March; this doesn't. */
function isRealDate(iso: string): boolean {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}
