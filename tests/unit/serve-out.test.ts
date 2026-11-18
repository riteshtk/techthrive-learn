import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { byteRange, resolveFile } from "@/scripts/serve-out";

// A built site in out/, with a sibling folder whose name starts the same way.
const dir = mkdtempSync(join(tmpdir(), "serve-out-"));
const root = join(dir, "out");
mkdirSync(join(root, "topics", "rag"), { recursive: true });
mkdirSync(join(dir, "out-x"));
writeFileSync(join(root, "index.html"), "home");
writeFileSync(join(root, "topics", "rag", "index.html"), "rag");
writeFileSync(join(dir, "out-x", "secret.txt"), "secret");

const resolve = (path: string) => resolveFile(path, root, "/base");

describe("e2e static server", () => {
  it("serves pages under the base path", () => {
    expect(resolve("/base/")).toBe(join(root, "index.html"));
    expect(resolve("/base/topics/rag/")).toBe(
      join(root, "topics", "rag", "index.html"),
    );
    expect(resolve("/topics/rag/")).toBeUndefined();
    expect(resolve("/base/missing/")).toBeUndefined();
  });

  it("never serves files outside out/", () => {
    expect(resolve("/base/..%2fout-x/secret.txt")).toBeUndefined();
    expect(resolve("/base/..%2f..%2fetc/hosts")).toBeUndefined();
  });

  it("treats a malformed address as not found instead of throwing", () => {
    expect(resolve("/base/%E0")).toBeUndefined();
  });
});

describe("byte ranges, as GitHub Pages serves them", () => {
  it("reads the three forms of one range", () => {
    expect(byteRange("bytes=0-99", 1000)).toEqual({ start: 0, end: 99 });
    expect(byteRange("bytes=900-", 1000)).toEqual({ start: 900, end: 999 });
    expect(byteRange("bytes=-100", 1000)).toEqual({ start: 900, end: 999 });
  });

  it("stops at the end of the file", () => {
    expect(byteRange("bytes=500-5000", 1000)).toEqual({ start: 500, end: 999 });
    expect(byteRange("bytes=-5000", 1000)).toEqual({ start: 0, end: 999 });
  });

  it("refuses a range past the end", () => {
    expect(byteRange("bytes=1000-", 1000)).toBe("unsatisfiable");
    expect(byteRange("bytes=9-3", 1000)).toBe("unsatisfiable");
  });

  it("sends the whole file for no range, or one it doesn't serve", () => {
    expect(byteRange(undefined, 1000)).toBeNull();
    expect(byteRange("bytes=-", 1000)).toBeNull();
    expect(byteRange("bytes=0-1,5-9", 1000)).toBeNull();
    expect(byteRange("items=0-9", 1000)).toBeNull();
  });
});
