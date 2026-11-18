import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "./fixtures";

// Checkpoints (PRD P6): three questions; the first answer counts; the
// design's right, partly right and wrong states; 80% passes.

const AGENTS = "topics/ai-agents/lessons/agent-anatomy/checkpoint/";
const PAYMENTS = "topics/payments/lessons/move-money-exactly-once/checkpoint/";

const option = (page: Page, letter: string) =>
  page
    .getByRole("radiogroup")
    .getByRole("radio", { name: new RegExp(`^${letter}\\b`) });

test("a partly right first answer shows its state and reveals the right one", async ({
  page,
}) => {
  await page.goto(AGENTS);
  await expect(page.getByText("Checkpoint · question 1 of 3")).toBeVisible();
  await option(page, "A").click();
  await expect(option(page, "A")).toHaveAttribute("aria-checked", "true");
  await expect(option(page, "A")).toContainText("Partly right");
  await expect(option(page, "B")).toContainText("Right");
  const result = page.getByRole("status");
  await expect(result).toContainText(
    "Not quite. Policy is what bounds the outcome.",
  );
  await expect(result).toContainText(
    "Your first answer counts: A. The right answer is B.",
  );
  await expect(page.getByRole("complementary", { name: "Why" })).toContainText(
    "You picked A.",
  );

  // Looking at another answer shows its feedback; the score keeps A.
  await option(page, "B").click();
  await expect(page.getByRole("complementary", { name: "Why" })).toContainText(
    "You picked B. Right.",
  );
  await expect(result).toContainText("Your first answer counts: A.");
  // Coming back resumes at the next question; question 1 keeps A.
  await page.reload();
  await expect(page.getByText("Checkpoint · question 2 of 3")).toBeVisible();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ttl-learn:progress:v2") ?? "{}"),
  );
  expect(stored.checkpoints["ai-agents/agent-anatomy"].answers).toEqual({
    "hidden-instruction": "A",
  });
});

test("a wrong answer is marked, with the right one shown", async ({ page }) => {
  await page.goto(AGENTS);
  await option(page, "C").click();
  await expect(option(page, "C")).toContainText("Not this one");
  await expect(option(page, "B")).toContainText("Right");
  await expect(
    page.getByRole("link", { name: "Replay step 6 · Policy" }),
  ).toHaveAttribute("href", /\/lessons\/agent-anatomy\/\?step=6$/);
});

test("all right first time passes; the result lists each answer", async ({
  page,
}) => {
  await page.goto(PAYMENTS);
  for (let n = 1; n <= 3; n++) {
    await expect(
      page.getByText(`Checkpoint · question ${n} of 3`),
    ).toBeVisible();
    await option(page, "B").click();
    await expect(page.getByRole("status")).toContainText("Right.");
    await page
      .getByRole("button", {
        name: n < 3 ? "Next question" : "See your result",
      })
      .click();
  }
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Passed.");
  await expect(
    page.getByText("3 of 3 (100%) from your first answers."),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Passed.");
});

test("one wrong answer is below 80%, so not passed yet", async ({ page }) => {
  await page.goto(PAYMENTS);
  for (const letter of ["B", "A", "B"]) {
    await option(page, letter).click();
    await page
      .getByRole("button", { name: /Next question|See your result/ })
      .click();
  }
  // A on question 2 is wrong: 2 of 3.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Not passed yet.",
  );
  await expect(
    page.getByText("2 of 3 (67%) from your first answers."),
  ).toBeVisible();
});

test("arrow keys move between answers without answering", async ({ page }) => {
  await page.goto(AGENTS);
  await option(page, "A").focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(option(page, "C")).toBeFocused();
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await expect(option(page, "B")).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("status")).toBeFocused();
});

test("the lesson's last step leads to its checkpoint", async ({ page }) => {
  await page.goto("topics/payments/lessons/move-money-exactly-once/?step=10");
  await page.getByRole("link", { name: "Take the checkpoint" }).click();
  await expect(page).toHaveURL(/\/move-money-exactly-once\/checkpoint\/$/);
});

for (const theme of ["dark", "light"] as const)
  test(`no axe violations, unanswered and answered (${theme})`, async ({
    page,
  }) => {
    await page.addInitScript(
      (t) => localStorage.setItem("ttl-learn:theme:v1", t),
      theme,
    );
    for (const path of [AGENTS, PAYMENTS]) {
      await page.goto(path);
      const before = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      await option(page, "A").click();
      const after = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        [...before.violations, ...after.violations].map(
          (v) => `${path} ${v.id} (${v.nodes.length})`,
        ),
      ).toEqual([]);
    }
  });
