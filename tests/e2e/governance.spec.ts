import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

// Governance (PRD P11). The clock is fixed so Today has a known place.

const PAGE = "topics/ai-agents/governance/";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-18T06:00:00Z"));
});

const timeline = (page: import("@playwright/test").Page) =>
  page.getByRole("region", { name: /^Timeline/ });

test("filters the timeline by jurisdiction, with computed counts", async ({
  page,
}) => {
  await page.goto(PAGE);
  const filters = page.getByRole("group", { name: "Jurisdiction" });
  await expect(timeline(page)).toContainText("16 dates");
  for (const [name, n] of [
    ["India", 4],
    ["EU", 7],
    ["UK", 2],
    ["Voluntary", 3],
    ["All", 16],
  ] as const) {
    await filters.getByRole("button", { name, exact: true }).click();
    await expect(
      filters.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(timeline(page)).toContainText(`${n} dates`);
    await expect(timeline(page).getByRole("listitem")).toHaveCount(n + 1);
  }
});

test("places Today after the past and marks events past or upcoming", async ({
  page,
}) => {
  await page.goto(`${PAGE}?j=in`);
  const items = timeline(page).getByRole("listitem");
  await expect(items.nth(3)).toContainText("Today");
  await expect(items.nth(3).locator("time")).toHaveAttribute(
    "datetime",
    "2026-11-18",
  );
  await expect(items.nth(2)).toContainText(
    "DPDP consent-manager rules applyIndia, past",
  );
  await expect(items.nth(4)).toContainText(
    "DPDP main duties applyIndia, upcoming",
  );
  await expect(items.nth(4).locator("time")).toHaveText("May 2027");
  await expect(page).toHaveURL(/\?j=in$/);
});

test("shows the penalty ceilings with the smaller-company rule", async ({
  page,
}) => {
  await page.goto(PAGE);
  const side = page.getByRole("complementary", {
    name: "Penalties and frameworks",
  });
  await expect(side).toContainText("€35m or 7%");
  await expect(side).toContainText("€15m or 3%");
  await expect(side).toContainText(
    "For SMEs and start-ups, whichever is lower",
  );
  await expect(side).toContainText("Safety, Resilience, and Sustainability");
  await expect(side).toContainText("Harmful Bias and Homogenization");
});

test("the crosswalk is a table with a header for each regime", async ({
  page,
}) => {
  await page.goto(PAGE);
  const table = page.getByRole("table");
  await expect(
    table.getByRole("rowheader", { name: "Human oversight" }),
  ).toBeAttached();
  await expect(
    table.getByRole("row", { name: /^Independent testing/ }),
  ).toContainText("SS1/23 principle 4: independent model validation");
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
