import { describe, expect, it } from "vitest";
import { roadmapFiles, topicFiles } from "@/content/.generated";
import { formatIssue, validateContent } from "@/content/validate";

// Fixtures are untyped on purpose: each test breaks them in a different way.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = Record<string, any>;

const FILE = "content/topics/sample.ts";
const ROADMAP_FILE = "content/roadmaps/sample-map.ts";

/** A valid topic; each test breaks one thing. */
function topic(): Loose {
  return {
    id: "sample",
    title: "A sample topic",
    level: "basics",
    summary: "One short sentence about the sample.",
    minutes: 5,
    diagram: {
      nodes: [
        { id: "a", label: "Alpha", note: "Starts it.", x: 0, y: 0 },
        { id: "b", label: "Beta", note: "Passes it on.", x: 0, y: 1 },
        {
          id: "c",
          label: "Gamma",
          note: "Ends it.",
          icon: "check",
          x: 1,
          y: 1,
        },
      ],
      edges: [
        { id: "a-b", from: "a", to: "b", flows: "a message" },
        { id: "b-c", from: "b", to: "c" },
      ],
    },
    steps: [
      { title: "Start", text: "First step.", highlight: ["a"] },
      { title: "Pass it on", text: "Second step.", highlight: ["a-b", "b"] },
      { title: "Finish", text: "Third step.", highlight: ["b-c", "c"] },
    ],
    sources: [
      { title: "Outside", url: "https://example.org/a", read: "2026-11-17" },
    ],
  };
}

function roadmap(): Loose {
  return {
    id: "sample-map",
    title: "Sample map",
    goal: "Learn the sample.",
    topics: ["sample"],
  };
}

function check(t: unknown, r: unknown = roadmap(), file = FILE): string[] {
  return validateContent({
    topics: [{ file, topic: t }],
    roadmaps: [{ file: ROADMAP_FILE, roadmap: r }],
  }).map(formatIssue);
}

describe("content checks", () => {
  it("accept a valid topic and roadmap", () => {
    expect(check(topic())).toEqual([]);
  });

  it("accept the shipped content", () => {
    const issues = validateContent({
      topics: topicFiles,
      roadmaps: roadmapFiles,
    });
    expect(issues.map(formatIssue)).toEqual([]);
  });

  it("name the file and field when a field is missing", () => {
    const t = topic();
    delete t.title;
    expect(check(t)).toEqual([`${FILE} › title: is missing`]);
  });

  it("reject a title that is too long", () => {
    const t = topic();
    t.title = "x".repeat(61);
    expect(check(t)).toEqual([
      `${FILE} › title: is 61 characters; the limit is 60`,
    ]);
  });

  it("reject a summary that is too long or more than one sentence", () => {
    const t = topic();
    t.summary = `${"x".repeat(140)}.`;
    expect(check(t)).toContain(
      `${FILE} › summary: is 141 characters; the limit is 140`,
    );
    t.summary = "One sentence. And another.";
    expect(check(t)).toEqual([`${FILE} › summary: must be one sentence`]);
  });

  it("reject step text that is too long", () => {
    const t = topic();
    t.steps[1].text = `${"y".repeat(141)}.`;
    expect(check(t)).toEqual([
      `${FILE} › steps[1].text: is 142 characters; the limit is 140`,
    ]);
  });

  it("reject an unknown level", () => {
    const t = topic();
    t.level = "expert";
    expect(check(t)).toEqual([
      `${FILE} › level: must be one of basics, intermediate, advanced`,
    ]);
  });

  it("require the id to be kebab-case and match the file name", () => {
    const t = topic();
    t.id = "Other_Topic";
    expect(check(t)).toEqual([
      `${FILE} › id: "Other_Topic" must be kebab-case`,
      `${FILE} › id: "Other_Topic" must match the file name "sample"`,
      `${ROADMAP_FILE} › topics[0]: "sample" is not a topic; add content/topics/sample.ts or fix the id`,
    ]);
  });

  it("reject labels that are too long, have long words or need three lines", () => {
    const t = topic();
    t.diagram.nodes[0].label = "Twenty one characters";
    expect(check(t)).toContain(
      `${FILE} › diagram.nodes[0].label: "Twenty one characters" is 21 characters; the limit is 20`,
    );
    t.diagram.nodes[0].label = "Tokenization";
    expect(check(t)).toEqual([
      `${FILE} › diagram.nodes[0].label: the word "Tokenization" is over 10 characters`,
    ]);
    t.diagram.nodes[0].label = "ab cdefghij klmnopq";
    expect(check(t)).toEqual([
      `${FILE} › diagram.nodes[0].label: "ab cdefghij klmnopq" needs more than two lines`,
    ]);
  });

  it("reject nodes outside the grid", () => {
    const t = topic();
    t.diagram.nodes[2].x = 4;
    t.diagram.nodes[2].y = 1.5;
    expect(check(t)).toContain(
      `${FILE} › diagram.nodes[2].x: must be a whole number from 0 to 3`,
    );
    expect(check(t)).toContain(
      `${FILE} › diagram.nodes[2].y: must be a whole number from 0 to 5`,
    );
  });

  it("reject an id repeated across nodes and edges", () => {
    const t = topic();
    t.diagram.edges[0].id = "b";
    expect(check(t)).toContain(
      `${FILE} › diagram.edges[0].id: "b" repeats the id at diagram.nodes[1].id`,
    );
  });

  it("reject two nodes in one cell", () => {
    const t = topic();
    t.diagram.nodes[2].x = 0;
    t.diagram.nodes[2].y = 0;
    expect(check(t)).toContain(
      `${FILE} › diagram.nodes[2]: shares cell (0,0) with "a"`,
    );
  });

  it("reject an edge that crosses a third node", () => {
    const t = topic();
    t.diagram.nodes[2] = { id: "c", label: "Gamma", note: "Ends.", x: 0, y: 2 };
    t.diagram.edges[1] = { id: "a-c", from: "a", to: "c" };
    t.steps[2].highlight = ["a-c", "c"];
    expect(check(t)).toEqual([
      `${FILE} › diagram.edges[1]: "a-c" crosses node "b"; move a node so the line is clear`,
    ]);
  });

  it("point at the right edge when an earlier one is invalid", () => {
    const t = topic();
    t.diagram.nodes[2] = { id: "c", label: "Gamma", note: "Ends.", x: 0, y: 2 };
    t.diagram.edges = [
      { id: "bad", from: "nowhere", to: "b" },
      { id: "b-c", from: "b", to: "c" },
      { id: "a-c", from: "a", to: "c" },
    ];
    t.steps[2].highlight = ["a-c", "c"];
    expect(check(t)).toContain(
      `${FILE} › diagram.edges[2]: "a-c" crosses node "b"; move a node so the line is clear`,
    );
  });

  it("reject an edge label with no room between its nodes", () => {
    const t = topic();
    t.diagram.nodes = ["a", "b", "c", "d"].map((id, x) => ({
      id,
      label: id.toUpperCase(),
      note: "A box.",
      x,
      y: 0,
    }));
    t.diagram.edges = [
      { id: "a-b", from: "a", to: "b", label: "embedded" },
      { id: "b-c", from: "b", to: "c" },
    ];
    expect(check(t).join("\n")).toContain(
      `${FILE} › diagram.edges[0].label: "embedded" has no room`,
    );
  });

  it("reject edges to unknown nodes", () => {
    const t = topic();
    t.diagram.edges[1].to = "zeta";
    expect(check(t)).toContain(
      `${FILE} › diagram.edges[1].to: "zeta" is not a node id`,
    );
  });

  it("reject a step that highlights an unknown id", () => {
    const t = topic();
    t.steps[2].highlight = ["c", "vecstore"];
    expect(check(t)).toEqual([
      `${FILE} › steps[2].highlight: unknown id "vecstore"`,
    ]);
  });

  it("require 3 to 9 steps", () => {
    const t = topic();
    t.steps = t.steps.slice(0, 2);
    expect(check(t)).toEqual([
      `${FILE} › steps: has 2 steps; topics need 3 to 9`,
    ]);
  });

  it("require a source outside Tech & Thrive", () => {
    const t = topic();
    t.sources = [
      {
        title: "Our own post",
        url: "https://techthrive.dev/post",
        read: "2026-11-17",
      },
    ];
    expect(check(t)).toEqual([
      `${FILE} › sources: needs at least one source outside Tech & Thrive`,
    ]);
  });

  it("require a read date and an https link on each source", () => {
    const t = topic();
    t.sources[0].read = "17/11/2026";
    t.sources[0].url = "http://example.org";
    expect(check(t)).toEqual([
      `${FILE} › sources[0].url: must be a full https:// link`,
      `${FILE} › sources[0].read: must be the date checked, as YYYY-MM-DD`,
    ]);
  });

  it("reject a read date that doesn't exist", () => {
    const t = topic();
    t.sources[0].read = "2026-02-31";
    expect(check(t)).toEqual([
      `${FILE} › sources[0].read: must be the date checked, as YYYY-MM-DD`,
    ]);
  });

  it("check the optional video", () => {
    const t = topic();
    t.video = { youtubeId: "short", title: "" };
    expect(check(t)).toEqual([
      `${FILE} › video.youtubeId: must be an 11-character YouTube video id`,
      `${FILE} › video.title: is missing`,
    ]);
  });

  it("require minutes from 1 to 60", () => {
    const t = topic();
    t.minutes = 0;
    expect(check(t)).toEqual([
      `${FILE} › minutes: must be a whole number from 1 to 60`,
    ]);
    delete t.minutes;
    expect(check(t)).toEqual([
      `${FILE} › minutes: must be a whole number from 1 to 60`,
    ]);
  });

  it("require a short title on every step", () => {
    const t = topic();
    delete t.steps[0].title;
    t.steps[1].title = "A step title that is far too long";
    t.steps[2].title = "Finish.";
    expect(check(t)).toEqual([
      `${FILE} › steps[0].title: is missing`,
      `${FILE} › steps[1].title: "A step title that is far too long" is 33 characters; the limit is 24`,
      `${FILE} › steps[2].title: is a short name; leave off the full stop`,
    ]);
  });

  it("require a one-sentence note on every node", () => {
    const t = topic();
    delete t.diagram.nodes[0].note;
    t.diagram.nodes[1].note = "Two ideas. Not one.";
    t.diagram.nodes[2].note = `${"n".repeat(90)}.`;
    expect(check(t)).toEqual([
      `${FILE} › diagram.nodes[0].note: is missing`,
      `${FILE} › diagram.nodes[1].note: must be one sentence`,
      `${FILE} › diagram.nodes[2].note: is 91 characters; the limit is 90`,
    ]);
  });

  it("only allow known icons", () => {
    const t = topic();
    t.diagram.nodes[0].icon = "rocket";
    expect(check(t).join("\n")).toContain(
      `${FILE} › diagram.nodes[0].icon: must be one of text, question,`,
    );
  });

  it("keep what flows along an edge short", () => {
    const t = topic();
    t.diagram.edges[0].flows = "f".repeat(41);
    expect(check(t)).toEqual([
      `${FILE} › diagram.edges[0].flows: must be text of at most 40 characters`,
    ]);
  });

  it("reject a roadmap that lists a topic that doesn't exist", () => {
    const r = roadmap();
    r.topics = ["sample", "caching"];
    expect(check(topic(), r)).toEqual([
      `${ROADMAP_FILE} › topics[1]: "caching" is not a topic; add content/topics/caching.ts or fix the id`,
    ]);
  });

  it("reject a roadmap with a missing goal", () => {
    const r = roadmap();
    delete r.goal;
    expect(check(topic(), r)).toEqual([`${ROADMAP_FILE} › goal: is missing`]);
  });

  it("don't crash on a file that exports the wrong thing", () => {
    expect(check("oops")).toEqual([
      `${FILE} › default export: must be a topic object`,
      `${ROADMAP_FILE} › topics[0]: "sample" is not a topic; add content/topics/sample.ts or fix the id`,
    ]);
  });
});
