import { describe, expect, it } from "vitest";
import { searchEntries } from "@/content";
import { searchTopics } from "@/lib/search";

const entries = searchEntries();
const ids = (q: string) => searchTopics(entries, q).map((r) => r.id);

describe("search", () => {
  it("lists every topic for an empty query", () => {
    expect(ids("").sort()).toEqual(["agent-loop", "how-an-llm-answers", "rag"]);
  });

  it("finds topics by title, ignoring case", () => {
    expect(ids("AGENT")).toEqual(["agent-loop"]);
    expect(ids("rag")[0]).toBe("rag");
  });

  it("finds topics by block labels and summaries", () => {
    expect(ids("vector store")).toEqual(["rag"]);
    expect(ids("tokenizer")).toEqual(["how-an-llm-answers"]);
  });

  it("links straight to the step that matches", () => {
    const [hit] = searchTopics(entries, "temperature");
    expect(hit).toMatchObject({
      id: "how-an-llm-answers",
      step: 4,
      detail: "Step 4: Pick one token",
    });
  });

  it("needs every word to match", () => {
    expect(ids("tokenizer permission")).toEqual([]);
  });

  it("puts title matches first", () => {
    const results = searchTopics(entries, "model");
    expect(results.length).toBeGreaterThan(1);
    expect(results.every((r) => r.step === undefined)).toBe(true);
  });
});
