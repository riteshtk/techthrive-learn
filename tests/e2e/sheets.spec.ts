import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

// Cheatsheets (PRD P13).

const PAGE = "topics/ai-agents/sheets/";

test("shows ten sheets, prices from the rate card and lists from the threat model", async ({
  page,
}) => {
  await page.goto(PAGE);
  await expect(page.getByRole("region")).toHaveCount(10);
  const prices = page.getByRole("region", { name: "Claude API, first-party" });
  await expect(prices.getByRole("row", { name: /^Fable 5\.2/ })).toContainText(
    "4 / 20",
  );
  await expect(
    prices.getByRole("row", { name: /^Haiku 5\.5 >100k/ }),
  ).toContainText("0.625");
  await expect(
    page.getByRole("region", { name: "OWASP Agentic Top 10 2026" }),
  ).toContainText("Unexpected Code Execution (RCE)");
  await expect(
    page.getByRole("region", { name: "Regulation clock" }),
  ).toContainText("May 2027");
});

test("the Print button opens the print dialog", async ({ page }) => {
  await page.goto(PAGE);
  await page.evaluate(() => {
    (window as unknown as { printed: number }).printed = 0;
    window.print = () => {
      (window as unknown as { printed: number }).printed++;
    };
  });
  await page.getByRole("button", { name: "Print A4" }).click();
  expect(
    await page.evaluate(
      () => (window as unknown as { printed: number }).printed,
    ),
  ).toBe(1);
});

test("prints on light paper, two columns, without the site's chrome", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("ttl-learn:theme:v1", "dark"),
  );
  await page.goto(PAGE);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".tt-topbar")).toBeHidden();
  await expect(page.getByRole("button", { name: "Print A4" })).toBeHidden();
  const scheme = await page.evaluate(
    () => getComputedStyle(document.documentElement).colorScheme,
  );
  expect(scheme).toBe("light");
  const columns = await page
    .locator(".tt-sh-grid")
    .evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
    );
  expect(columns).toBe(2);
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
