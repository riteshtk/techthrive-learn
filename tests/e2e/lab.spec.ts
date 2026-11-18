import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

// The design lab, explore only (PRD P12).

const PAGE = "topics/ai-agents/lab/";
const board = (page: import("@playwright/test").Page) =>
  page.getByRole("group", {
    name: /^Reference architecture with 13 components/,
  });

test("opens in 2D on the dispute workflow, with the capacity card", async ({
  page,
}) => {
  await page.goto(PAGE);
  await expect(board(page)).toHaveAccessibleName(/, 2D\./);
  await expect(
    page.getByRole("heading", { name: "Dispute workflow" }),
  ).toBeVisible();
  const cap = page.getByRole("region", { name: /Capacity/ });
  await expect(cap).toContainText("250");
  await expect(cap).toContainText("2.1M");
  await expect(cap).toContainText("$37,944");
});

test("opens each component's detail with the keyboard", async ({ page }) => {
  await page.goto(PAGE);
  for (const name of [
    "MCP · card ledger",
    "Policy · Cedar",
    "OTel collector",
  ]) {
    // 2D names start with the box's two lines: "Policy · Cedar amount cap".
    await page
      .getByRole("button", {
        name: new RegExp(`^${name.replace(/[·]/g, ".")} .*: show its detail$`),
      })
      .focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  }
  await expect(page).toHaveURL(/\?part=X$/);
});

test("links a component's risks to the threat model", async ({ page }) => {
  await page.goto(`${PAGE}?part=T`);
  await page.getByRole("link", { name: "ASI03" }).click();
  await expect(page).toHaveURL(/\/threats\//);
  await expect(page.getByRole("tab", { selected: true })).toContainText(
    "ASI03",
  );
});

test("switches between 2D and 3D", async ({ page }) => {
  await page.goto(PAGE);
  await page
    .getByRole("group", { name: "Diagram style" })
    .getByRole("button", { name: "3D", exact: true })
    .click();
  await expect(board(page)).toHaveAccessibleName(/, 3D\./);
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
