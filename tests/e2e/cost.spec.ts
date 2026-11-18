import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "./fixtures";

// The cost model (PRD P9).

const COST = "topics/ai-agents/cost/";

const kpi = (page: Page, label: RegExp) =>
  page
    .getByRole("region", { name: "Results" })
    .locator(".tt-card", { has: page.getByText(label) });

const slider = (page: Page, name: string) =>
  page.getByRole("slider", { name, exact: true });

test("opens on the card-dispute brief: $0.063 and $37,944", async ({
  page,
}) => {
  await page.goto(COST);
  await expect(kpi(page, /^Per conversation$/)).toContainText("$0.063");
  await expect(kpi(page, /^Per month · 30 days$/)).toContainText("$37,944");
  await expect(kpi(page, /^Caching saves$/)).toContainText("49%");
  await expect(page.getByText(/Claude prices, read 18 Nov 2026/)).toBeVisible();
});

test("recalculates when the model changes, and keeps it in the address", async ({
  page,
}) => {
  await page.goto(COST);
  await page.getByRole("button", { name: /^Opus 5\.5/ }).click();
  await expect(
    page.getByRole("button", { name: /^Opus 5\.5/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(kpi(page, /^Per month · 30 days$/)).toContainText("$75,888");
  await expect(page).toHaveURL(/\?m=opus$/);
  await page.reload();
  await expect(kpi(page, /^Per month · 30 days$/)).toContainText("$75,888");
  await page
    .getByRole("button", { name: "Reset to the card-dispute brief" })
    .click();
  await expect(kpi(page, /^Per month · 30 days$/)).toContainText("$37,944");
  await expect(page).toHaveURL(/\/cost\/$/);
});

test("prices caching off as plain input, and says when caching costs more", async ({
  page,
}) => {
  await page.goto(COST);
  await page
    .getByRole("group", { name: "Prompt caching" })
    .getByRole("button", { name: "Off" })
    .click();
  await expect(kpi(page, /^Per conversation$/)).toContainText("$0.123");
  await expect(slider(page, "Prompt-cache hit rate")).toBeDisabled();
  await page.goto(`${COST}?hit=0`);
  await expect(kpi(page, /^Per conversation$/)).toContainText("$0.141");
  await expect(kpi(page, /^Caching costs more$/)).toContainText("+15%");
});

test("drives a slider with the keyboard and names its value with the unit", async ({
  page,
}) => {
  await page.goto(COST);
  const conv = slider(page, "Conversations per day");
  await expect(conv).toHaveAttribute("aria-valuetext", "20,000 conversations");
  await conv.focus();
  await page.keyboard.press("ArrowRight");
  await expect(conv).toHaveAttribute("aria-valuetext", "21,000 conversations");
  await expect(
    page.getByRole("status").filter({ hasText: "per conversation" }),
  ).toContainText("a month");
});

test("disables routing when Haiku is the main model", async ({ page }) => {
  await page.goto(`${COST}?route=50`);
  await expect(slider(page, "Turns routed to Haiku 5.5")).toBeEnabled();
  await page.getByRole("button", { name: /^Haiku 5\.5/ }).click();
  await expect(slider(page, "Turns routed to Haiku 5.5")).toBeDisabled();
  await expect(
    page.getByText("Haiku 5.5 is already the main model."),
  ).toBeVisible();
});

test("shows the Haiku long-prompt tier and a prefix too short to cache", async ({
  page,
}) => {
  await page.goto(`${COST}?m=haiku&prefix=60000&fresh=50000`);
  await expect(
    page.getByText(/long-prompt tier: prompt over 100,000 tokens/),
  ).toBeVisible();
  await page.goto(`${COST}?prefix=500`);
  await expect(page.getByText(/Under the 512-token minimum/)).toBeVisible();
});

test("compares every model as a multiple of the main one", async ({ page }) => {
  await page.goto(COST);
  const table = page.getByRole("table").filter({ hasText: "vs main" });
  await expect(table.getByRole("row", { name: /Haiku 5\.5/ })).toContainText(
    "0.05×",
  );
  await expect(table.getByRole("row", { name: /Fable 5\.2/ })).toContainText(
    "3.9×",
  );
  const rates = page.getByRole("table").filter({ hasText: "1h write" });
  await expect(
    rates.getByRole("row", { name: /Haiku 5\.5 >100k/ }),
  ).toContainText("$0.625");
});

test("has no axe violations in either theme, and no sideways scroll", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const theme of ["dark", "light"] as const) {
    await page.addInitScript(
      (t) => localStorage.setItem("ttl-learn:theme:v1", t),
      theme,
    );
    await page.goto(COST);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" ")}`,
      ),
      theme,
    ).toEqual([]);
  }
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
});

test("the payments topic has no cost model", async ({ page }) => {
  const res = await page.goto("topics/payments/cost/");
  expect(res?.status()).toBe(404);
});
