import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

// The topic catalog (PRD P15).

const PAGE = "topics/";
const count = (page: import("@playwright/test").Page) =>
  page.locator(".tt-cat-count");

test("lists live and planned topics with a computed count", async ({
  page,
}) => {
  await page.goto(PAGE);
  await expect(count(page)).toHaveText("13 of 13 topics · 2 live");
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(13);
});

test("live topics link to their pages; planned topics are not links", async ({
  page,
}) => {
  await page.goto(PAGE);
  await expect(
    page.getByRole("link", { name: "Payments platform", exact: true }),
  ).toHaveAttribute("href", /\/topics\/payments\/$/);
  await expect(
    page.getByRole("heading", { name: "Search at scale" }).getByRole("link"),
  ).toHaveCount(0);
  await expect(page.locator(".tt-cat-grid a")).toHaveCount(2);
});

test("searches, filters and keeps the filters in the address", async ({
  page,
}) => {
  await page.goto(PAGE);
  await page
    .getByRole("searchbox", { name: "Search topics" })
    .fill("idempotency");
  await expect(count(page)).toHaveText("1 of 13 topics · 2 live");
  await page.getByRole("searchbox", { name: "Search topics" }).fill("");
  await page
    .getByRole("group", { name: "Status" })
    .getByRole("button", { name: "Planned", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Domain" })
    .getByRole("button", { name: "AI & ML", exact: true })
    .click();
  await expect(count(page)).toHaveText("1 of 13 topics · 2 live");
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(
    "LLM platform: RAG, evals and gateways",
  );
  await expect(page).toHaveURL(/\?status=planned&domain=AI\+%26\+ML$/);
  await page.reload();
  await expect(count(page)).toHaveText("1 of 13 topics · 2 live");
});

test("shows an empty state that clears the filters", async ({ page }) => {
  await page.goto(`${PAGE}?q=zzzz`);
  await expect(page.getByRole("status")).toContainText("No topics match");
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(count(page)).toHaveText("13 of 13 topics · 2 live");
});

test("has no axe violations in either theme, and no sideways scroll", async ({
  page,
}) => {
  for (const theme of ["dark", "light"] as const) {
    await page.addInitScript(
      (t) => localStorage.setItem("ttl-learn:theme:v1", t),
      theme,
    );
    await page.goto(PAGE);
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
