import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "./fixtures";

// Topic overviews and course pages (PRD P7).

const AGENTS = "topics/ai-agents/";
const PAYMENTS = "topics/payments/";
const KEY = "ttl-learn:progress:v2";

/** Seeds this browser's progress before the page loads. */
async function seed(page: Page, lessons: Record<string, object>) {
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
    KEY,
    JSON.stringify({ lessons, checkpoints: {} }),
  ] as const);
}

const DONE = {
  step: 10,
  maxStep: 10,
  startedAt: "2026-11-18T09:00:00.000Z",
  updatedAt: "2026-11-18T09:20:00.000Z",
  doneAt: "2026-11-18T09:20:00.000Z",
};

test.describe("the overview", () => {
  test("derives its meta line and component count", async ({ page }) => {
    await page.goto(AGENTS);
    await expect(
      page.getByRole("heading", { level: 1, name: /Production AI agents/ }),
    ).toBeVisible();
    await expect(
      page.getByText("Topic · Advanced · 10 lessons · about 2 hours"),
    ).toBeVisible();
    // Nine parts are added by lesson 2; the customers were already there.
    await expect(
      page.getByText("Card-dispute agent · 9 components"),
    ).toBeVisible();
  });

  test("shows lessons without pages as coming, not as links", async ({
    page,
  }) => {
    for (const [path, coming] of [
      [AGENTS, "Workflow or agent? Pick the simplest thing that works"],
      [PAYMENTS, "Idempotency in depth"],
    ] as const) {
      await page.goto(path);
      const main = page.getByRole("main");
      await expect(main.getByText(coming, { exact: true })).toBeVisible();
      await expect(
        main.getByRole("link", {
          name: new RegExp(coming.replace(/[?]/g, "\\?")),
        }),
      ).toHaveCount(0);
    }
    await page.goto(AGENTS);
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: /Anatomy of a production agent/ }),
    ).toHaveAttribute("href", /\/topics\/ai-agents\/lessons\/agent-anatomy\/$/);
  });

  test("pauses the request and switches between 3D and 2D", async ({
    page,
  }) => {
    await page.goto(AGENTS);
    const pause = page.getByRole("button", { name: "Pause the request" });
    await pause.click();
    await expect(
      page.getByRole("button", { name: "Play the request" }),
    ).toBeVisible();
    const stage = page.getByRole("group", { name: /^Card-dispute agent with/ });
    await expect(stage).toHaveAccessibleName(/, 3D\./);
    const twoD = page
      .getByRole("group", { name: "Diagram style" })
      .getByRole("button", { name: "2D", exact: true });
    await twoD.click();
    await expect(stage).toHaveAccessibleName(/, 2D\./);
    await expect(twoD).toHaveAttribute("aria-pressed", "true");
  });

  test("opens the lesson step that adds a part", async ({ page }) => {
    await page.goto(AGENTS);
    await page
      .getByRole("button", {
        name: "Model gateway: open the lesson step that adds it",
      })
      .click();
    await expect(page).toHaveURL(/\/lessons\/agent-anatomy\/\?step=2$/);
  });

  test("starts the next lesson for a new visitor", async ({ page }) => {
    await page.goto(PAYMENTS);
    await expect(
      page.getByRole("link", { name: /^Start lesson 1: / }),
    ).toHaveAttribute("href", /\/lessons\/move-money-exactly-once\/$/);
  });

  test("continues a lesson already started", async ({ page }) => {
    await seed(page, {
      "payments/move-money-exactly-once": {
        step: 4,
        maxStep: 4,
        startedAt: DONE.startedAt,
        updatedAt: DONE.updatedAt,
      },
    });
    await page.goto(PAYMENTS);
    await expect(
      page.getByRole("link", { name: /^Continue lesson 1: / }),
    ).toBeVisible();
  });

  test("offers a review once every built lesson is done", async ({ page }) => {
    await seed(page, { "payments/move-money-exactly-once": DONE });
    await page.goto(PAYMENTS);
    await expect(
      page.getByRole("link", { name: /^Review the lessons/ }),
    ).toBeVisible();
  });

  test("lists the topic's facts with short source names (list layout)", async ({
    page,
  }) => {
    await page.goto(PAYMENTS);
    const facts = page.getByRole("region", {
      name: /Every fact in this topic/,
    });
    await expect(facts.getByText("NPCI · UPI statistics")).toBeVisible();
    await expect(facts.getByText(/read 18 Nov 2026/).first()).toBeVisible();
  });
});

test.describe("the course page", () => {
  test("marks done, next and coming lessons", async ({ page }) => {
    await page.goto(`${AGENTS}lessons/`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Production AI agents for enterprise",
    );
    const list = page.getByRole("list", { name: "Lessons" });
    const here = list.locator('[aria-current="step"]');
    await expect(here).toContainText("Next up.");
    await expect(here).toContainText("Anatomy of a production agent");
    await expect(list.getByRole("link")).toHaveCount(1);
    await expect(list.getByText("Coming")).toHaveCount(9);
  });

  test("counts a finished lesson as done", async ({ page }) => {
    await seed(page, { "payments/move-money-exactly-once": DONE });
    await page.goto(`${PAYMENTS}lessons/`);
    const list = page.getByRole("list", { name: "Lessons" });
    await expect(list.getByText("Completed.")).toHaveCount(1);
    await expect(list.locator('[aria-current="step"]')).toHaveCount(0);
    await expect(page.getByText("1 / 8")).toBeVisible();
  });
});

test.describe("on a phone", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) > 400, "phone only");

  test("draws the portrait diagram with no sideways scroll", async ({
    page,
  }) => {
    for (const path of [AGENTS, PAYMENTS, `${AGENTS}lessons/`]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
    await page.goto(AGENTS);
    const svg = page
      .getByRole("group", { name: /^Card-dispute agent with/ })
      .locator("svg")
      .first();
    const box = await svg.boundingBox();
    // Portrait: taller than wide, unlike the desktop drawing.
    expect(box!.height).toBeGreaterThan(box!.width);
  });
});

test("has no axe violations in either theme", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const theme of ["dark", "light"] as const) {
    await page.addInitScript(
      (t) => localStorage.setItem("ttl-learn:theme:v1", t),
      theme,
    );
    for (const path of [
      AGENTS,
      PAYMENTS,
      `${AGENTS}lessons/`,
      `${PAYMENTS}lessons/`,
    ]) {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        results.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" ")}`,
        ),
        `${theme} ${path}`,
      ).toEqual([]);
    }
  }
});
