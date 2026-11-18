import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

// Zero axe violations of any impact, in both themes (PRD P19), on the
// pages that have no spec of their own.

const PAGES = ["./", "topics/", "review/", "no/such/page/", "topics/rag/"];

for (const scheme of ["dark", "light"] as const) {
  test.describe(`accessibility (${scheme})`, () => {
    test.use({ theme: scheme });

    for (const path of PAGES) {
      test(`${path} has no axe violations`, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator("main")).toBeVisible();
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(results.violations.map((v) => v.id)).toEqual([]);
      });
    }
  });
}
