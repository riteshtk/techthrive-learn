import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

// Review cards (PRD P14), scheduled with FSRS in this browser.

const PAGE = "review/";

/** A rating button: "Good" then ", next in" (for screen readers) and
    "3 days"; the spacing around the hidden part varies by browser. */
const rating = (label: string, next: string) =>
  new RegExp(`^${label}\\s*, next in\\s*${next}$`);

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-18T09:00:00Z"));
});

test("a new card offers 1 min / 1 day / 3 days / 9 days", async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.getByText("7 cards to review.")).toBeVisible();
  await page.getByRole("button", { name: "Start review" }).click();
  await expect(
    page.getByRole("progressbar", { name: "Review progress" }),
  ).toHaveAttribute("aria-valuenow", "0");
  await page.getByRole("button", { name: "Show answer" }).click();
  for (const [label, next] of [
    ["Again", "1 min"],
    ["Hard", "1 day"],
    ["Good", "3 days"],
    ["Easy", "9 days"],
  ] as const)
    await expect(
      page.getByRole("button", { name: rating(label, next) }),
    ).toBeVisible();
});

test("a rated card is scheduled and stays scheduled after a reload", async ({
  page,
}) => {
  await page.goto(PAGE);
  await page.getByRole("button", { name: "Start review" }).click();
  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByRole("button", { name: rating("Good", "3 days") }).click();
  await expect(page.getByText("2 / 7")).toBeVisible();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ttl-learn:review:v1") ?? "{}"),
  );
  const [key] = Object.keys(stored);
  expect(stored[key!].due).toBe("2026-11-21T09:00:00.000Z");
  await page.reload();
  await expect(page.getByText("6 cards to review.")).toBeVisible();
});

test("Again brings the card back in this session; keys work", async ({
  page,
}) => {
  await page.goto(PAGE);
  await page.getByRole("button", { name: "Start review" }).click();
  const first = await page.locator("#rv-q").textContent();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: /^Again/ })).toBeVisible();
  await page.keyboard.press("1");
  await expect(page.getByText("2 / 8")).toBeVisible();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Space");
    await page.keyboard.press("3");
  }
  await expect(page.locator("#rv-q")).toHaveText(first!);
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
    await page.getByRole("button", { name: "Start review" }).click();
    await page.getByRole("button", { name: "Show answer" }).click();
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
