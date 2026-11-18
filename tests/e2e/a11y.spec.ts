import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

const PAGES = [
  "./",
  "roadmaps/ai-system-design/",
  "topics/how-an-llm-answers/",
  "topics/rag/",
  "topics/agent-loop/",
  "topics/rag/?step=7",
  "no/such/page/",
];

for (const scheme of ["dark", "light"] as const) {
  test.describe(`accessibility (${scheme})`, () => {
    test.use({ theme: scheme });

    for (const path of PAGES) {
      test(`${path} has no serious or critical axe issues`, async ({
        page,
      }) => {
        await page.goto(path);
        // Let highlight transitions settle before checking colours.
        await expect(page.locator("main")).toBeVisible();
        await page.waitForTimeout(500);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        const serious = results.violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`);
        expect(serious).toEqual([]);
      });
    }
  });
}
