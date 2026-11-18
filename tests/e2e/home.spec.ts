import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

// Home (PRD P16): everything from this browser.

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-18T04:30:00Z"));
});

test("a new visitor: a dated header, start a topic, cards due, every topic's changes", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator(".tt-home-date")).toHaveText(
    /Wednesday · 18 November 2026/i,
  );
  await expect(
    page.getByRole("link", { name: /Start a topic/ }),
  ).toHaveAttribute("href", /\/topics\/$/);
  await expect(
    page.getByRole("link", { name: /7 review cards/ }),
  ).toHaveAttribute("href", /\/review\/$/);
  const changes = page.getByRole("region", {
    name: "What changed in your topics",
  });
  await expect(changes.getByRole("listitem")).toHaveCount(4);
  await expect(changes.getByRole("listitem").first()).toContainText(
    "Payments platform",
  );
});

test("a returning learner: resume where they were, changes in their topics only", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "ttl-learn:progress:v2",
      JSON.stringify({
        lessons: {
          "ai-agents/agent-anatomy": {
            step: 6,
            maxStep: 6,
            startedAt: "2026-11-17T09:00:00.000Z",
            updatedAt: "2026-11-17T09:20:00.000Z",
          },
        },
        checkpoints: {},
      }),
    ),
  );
  await page.goto("./");
  const resume = page.getByRole("link", {
    name: /Resume Anatomy of a production agent/,
  });
  await expect(resume).toHaveAttribute(
    "href",
    /\/lessons\/agent-anatomy\/\?step=6$/,
  );
  await expect(page.getByText("6 / 10 steps")).toBeVisible();
  const changes = page.getByRole("region", {
    name: "What changed in your topics",
  });
  await expect(changes).not.toContainText("Payments platform");
  await expect(changes.getByRole("listitem").first()).toContainText(
    "OWASP LLM list",
  );
});

test("still works when storage throws", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
  });
  await page.goto("./");
  await expect(page.getByRole("link", { name: /Start a topic/ })).toBeVisible();
});

test("has no axe violations in either theme, and no sideways scroll", async ({
  page,
}) => {
  for (const theme of ["dark", "light"] as const) {
    await page.addInitScript(
      (t) => localStorage.setItem("ttl-learn:theme:v1", t),
      theme,
    );
    await page.goto("./");
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
