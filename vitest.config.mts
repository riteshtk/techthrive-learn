import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    // The scaffold has no tests yet; the first feature commit removes this.
    passWithNoTests: true,
  },
});
