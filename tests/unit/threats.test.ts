import { describe, expect, it } from "vitest";
import { getTool } from "@/content";
import { rankChange } from "@/lib/threats";

// The threat model (PRD P10): names as the source has them, counts
// computed, ranks against the 2025 list.

const data = getTool("ai-agents", "threats")!;

describe("the AI agents threat model", () => {
  it("lists ASI01 to ASI10 in order", () => {
    expect(data.risks.map((r) => r.id)).toEqual(
      Array.from(
        { length: 10 },
        (_, i) => `ASI${String(i + 1).padStart(2, "0")}`,
      ),
    );
  });

  it("uses the source's names", () => {
    expect(data.risks.find((r) => r.id === "ASI05")!.name).toBe(
      "Unexpected Code Execution (RCE)",
    );
    expect(data.risks.find((r) => r.id === "ASI06")!.name).toBe(
      "Memory & Context Poisoning",
    );
  });

  it("counts 5 mitigated, 4 partial and 1 open", () => {
    const count = (s: string) =>
      data.risks.filter((r) => r.status === s).length;
    expect([count("mitigated"), count("partial"), count("open")]).toEqual([
      5, 4, 1,
    ]);
  });

  it("ranks the 2026 LLM list against 2025, each old rank once", () => {
    const was = data.related.items.map((i) => i.was);
    expect([...was].sort((a, b) => a! - b!)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });
});

describe("rank changes", () => {
  it.each([
    [{ was: 1 }, 1, "still #1", false],
    [{ was: 6 }, 3, "↑ from 6", true],
    [{ was: 3 }, 4, "↓ from 3", false],
    [
      { was: 7, wasName: "System Prompt Leakage" },
      8,
      "renamed · ↓ from 7",
      true,
    ],
    [{}, 4, "new", true],
  ] as const)("%o at %i reads %s", (item, rank, text, up) => {
    expect(rankChange(item, rank)).toEqual({ text, up });
  });
});
