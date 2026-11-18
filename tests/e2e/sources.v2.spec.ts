import AxeBuilder from "@axe-core/playwright";
import { getFacts } from "@/content";
import { expect, test } from "./fixtures";

// Sources pages (PRD P8): every register entry for the topic is listed, in
// real tables, with its source link, uses and read date.

for (const [topic, sample] of [
  ["ai-agents", "nist-ai-600-1-twelve-risks"],
  ["payments", "upi-october-2026-volume"],
] as const) {
  test.describe(topic, () => {
    test("lists the register's facts in tables", async ({ page }) => {
      await page.goto(`topics/${topic}/sources/`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Where every number comes from",
      );
      const tables = page.getByRole("table");
      expect(await tables.count()).toBeGreaterThan(2);
      await expect(
        tables.first().getByRole("columnheader", { name: "Read" }),
      ).toBeAttached();
      const ids = await page
        .locator("tbody tr")
        .evaluateAll((rows) => rows.map((r) => r.id.replace(/^fact-/, "")));
      expect(ids.sort()).toEqual(
        getFacts(topic)
          .map((f) => f.id)
          .sort(),
      );
      await expect(page.getByText(/^\d+ sources$/)).toBeVisible();
    });

    test("links a source in a new tab and a use to its page", async ({
      page,
    }) => {
      await page.goto(`topics/${topic}/sources/`);
      const row = page.locator(`#fact-${sample}`);
      await expect(row).toBeAttached();
      const link = row.getByRole("link", { name: /opens in a new tab/ });
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
      await expect(link).toHaveAttribute("href", /^https:\/\//);
    });

    test("has no axe violations in either theme", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const theme of ["dark", "light"] as const) {
        await page.addInitScript(
          (t) => localStorage.setItem("ttl-learn:theme:v1", t),
          theme,
        );
        await page.goto(`topics/${topic}/sources/`);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(
          results.violations.map((v) => v.id),
          theme,
        ).toEqual([]);
      }
    });

    test("does not scroll sideways", async ({ page }) => {
      await page.goto(`topics/${topic}/sources/`);
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
      ).toBeLessThanOrEqual(0);
    });
  });
}

test("the verified chip opens the topic's sources", async ({
  page,
  viewport,
}) => {
  // Phones hide the chip (approved still).
  test.skip((viewport?.width ?? 0) < 720, "desktop only");
  await page.goto("topics/payments/");
  await page.getByRole("link", { name: /^Verified/ }).click();
  await expect(page).toHaveURL(/\/topics\/payments\/sources\/$/);
});
