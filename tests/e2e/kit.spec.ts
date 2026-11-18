import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

// The component kit is built for e2e runs only (KIT=1 in playwright.config).
for (const theme of ["dark", "light"] as const) {
  test.describe(`component kit (${theme})`, () => {
    test.use({ theme });

    test("has no axe violations of any impact", async ({ page }) => {
      await page.goto("kit/");
      const html = page.locator("html");
      if (theme === "light")
        await expect(html).toHaveAttribute("data-theme", "light");
      else await expect(html).not.toHaveAttribute("data-theme", "light");
      const results = await new AxeBuilder({ page })
        .include("main")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        results.violations.map(
          (v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`,
        ),
      ).toEqual([]);
    });
  });
}

test("tabs move and select with the arrow keys", async ({ page }) => {
  await page.goto("kit/");
  const explain = page.getByRole("tab", { name: "Explain" });
  const sources = page.getByRole("tab", { name: "Sources" });
  await explain.focus();
  await page.keyboard.press("ArrowRight");
  await expect(sources).toBeFocused();
  await expect(sources).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveText("Panel: sources");
  await expect(page.getByRole("tabpanel")).toHaveAttribute(
    "aria-labelledby",
    (await sources.getAttribute("id"))!,
  );
  await page.keyboard.press("ArrowRight");
  await expect(explain).toBeFocused();
});

test("filter chips are a single-select group", async ({ page }) => {
  await page.goto("kit/");
  const group = page.getByRole("group", { name: "Status" });
  await group.getByRole("button", { name: "Live" }).click();
  await expect(group.getByRole("button", { name: "Live" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(group.getByRole("button", { name: "All" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("the progress bar is labelled with its value", async ({ page }) => {
  await page.goto("kit/");
  const bar = page.getByRole("progressbar", { name: "Lesson progress" });
  await expect(bar).toHaveAttribute("aria-valuenow", "5");
  await expect(bar).toHaveAttribute("aria-valuemax", "10");
});

test("the theme choice holds across reloads and pages", async ({ page }) => {
  await page.goto("kit/");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", "light");
  await page.getByTestId("theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("the topic bar names its sections and links Verified to sources", async ({
  page,
}) => {
  await page.goto("kit/");
  const nav = page.getByRole("navigation", {
    name: "Production AI agents sections",
  });
  await expect(nav.getByRole("link")).toHaveText([
    "Overview",
    "Lessons",
    "Cost",
    "Threats",
    "Governance",
    "Lab",
    "Sheets",
  ]);
  await expect(nav.getByRole("link", { name: "Interview" })).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Verified 17 Nov 2026" }),
  ).toHaveAttribute("href", "/techthrive-learn/topics/kit/sources/");
});
