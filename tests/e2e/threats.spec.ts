import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

// The threat model (PRD P10).

const PAGE = "topics/ai-agents/threats/";

test("opens on ASI03 with the computed counts", async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.getByRole("tab", { selected: true })).toContainText(
    "ASI03",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "Identity and Privilege Abuse",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    "expect 403 from the ledger",
  );
  const counts = page.locator(".tt-thr-counts");
  await expect(counts).toContainText("Mitigated5");
  await expect(counts).toContainText("Partial4");
  await expect(counts).toContainText("Open1");
});

test("deep links to a risk and keeps the choice in the address", async ({
  page,
}) => {
  await page.goto(`${PAGE}?risk=ASI08`);
  await expect(page.getByRole("tabpanel")).toContainText("Cascading Failures");
  await page.getByRole("button", { name: /^ASI09\s*, next risk$/ }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Human-Agent Trust Exploitation",
  );
  await expect(page).toHaveURL(/\?risk=ASI09$/);
});

test("moves through the risks with the arrow keys", async ({ page }) => {
  await page.goto(PAGE);
  await page.getByRole("tab", { selected: true }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("tab", { name: /ASI04/ })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Agentic Supply Chain Vulnerabilities",
  );
  await page.keyboard.press("End");
  await expect(page.getByRole("tabpanel")).toContainText("Rogue Agents");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("tabpanel")).toContainText("Agent Goal Hijack");
});

test("the matrix is a table that says where each risk lands", async ({
  page,
}) => {
  await page.goto(PAGE);
  const table = page.getByRole("table").filter({ visible: true });
  const row = table.getByRole("row", { name: /^(ASI03|Gateway) .*lands here/ });
  await expect(row).toContainText("lands here");
});

test("lists the 2026 LLM order with changes since 2025", async ({ page }) => {
  await page.goto(PAGE);
  const list = page.getByRole("complementary");
  await expect(list).toContainText("Hidden Context Exposure");
  await expect(list).toContainText("was System Prompt Leakage");
  await expect(list).toContainText("↑ from 6");
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
