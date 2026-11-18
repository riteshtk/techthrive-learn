import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "./fixtures";

// The lesson page (PRD P5), on both designed lessons.

const LESSONS = [
  {
    path: "topics/ai-agents/lessons/agent-anatomy/",
    title: "Anatomy of a production agent",
    steps: [
      "Brief",
      "Shape",
      "Identity",
      "Tools",
      "Retrieve",
      "Policy",
      "Human",
      "Evals",
      "Trace",
      "Cost",
    ],
  },
  {
    path: "topics/payments/lessons/move-money-exactly-once/",
    title: "Move money exactly once",
    steps: [
      "Brief",
      "Shape",
      "Idempotency",
      "Risk",
      "Tokens",
      "Retries",
      "Ledger",
      "Outbox",
      "Webhooks",
      "Reconcile",
    ],
  },
] as const;

const stepLabel = (page: Page) =>
  page.getByRole("tabpanel").getByText(/^Step \d+ \/ 10$/);

for (const lesson of LESSONS) {
  test.describe(lesson.title, () => {
    test("steps through to the end with Next", async ({ page }) => {
      await page.goto(lesson.path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        lesson.title,
      );
      for (let n = 1; n < 10; n++) {
        await expect(stepLabel(page)).toHaveText(`Step ${n} / 10`);
        await page
          .getByRole("button", { name: `Next · ${lesson.steps[n]}` })
          .click();
      }
      await expect(stepLabel(page)).toHaveText("Step 10 / 10");
      await expect(page).toHaveURL(/\?step=10$/);
      await expect(
        page.getByRole("link", { name: "Back to the topic" }),
      ).toHaveAttribute("href", /\/topics\/[a-z-]+\/$/);
    });

    test("opens every step from its own link", async ({ page }) => {
      for (let n = 1; n <= 10; n++) {
        await page.goto(`${lesson.path}?step=${n}`);
        await expect(stepLabel(page)).toHaveText(`Step ${n} / 10`);
        await expect(
          page.getByRole("button", {
            name: new RegExp(`^Step ${n}: ${lesson.steps[n - 1]}`),
          }),
        ).toHaveAttribute("aria-current", "step");
      }
    });

    test("has no axe violations in either theme", async ({ page }) => {
      for (const theme of ["dark", "light"] as const) {
        await page.addInitScript(
          (t) => localStorage.setItem("ttl-learn:theme:v1", t),
          theme,
        );
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(`${lesson.path}?step=6`);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(
          results.violations.map(
            (v) => `${theme} ${v.id}: ${v.help} (${v.nodes.length} nodes)`,
          ),
        ).toEqual([]);
      }
    });
  });
}

test.describe("keyboard and memory", () => {
  const path = LESSONS[0].path;

  test("steps with the arrow keys and plays with Space", async ({ page }) => {
    await page.goto(`${path}?step=3`);
    await page.locator("body").click({ position: { x: 5, y: 300 } });
    await page.keyboard.press("ArrowRight");
    await expect(stepLabel(page)).toHaveText("Step 4 / 10");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(stepLabel(page)).toHaveText("Step 2 / 10");
    const play = page.getByTestId("stage-play");
    const before = await play.getAttribute("aria-label");
    await page.keyboard.press(" ");
    await expect(play).not.toHaveAttribute("aria-label", before!);
  });

  test("Tab reaches Next, and Enter on a step dot goes there", async ({
    page,
  }) => {
    await page.goto(`${path}?step=1`);
    const next = page.getByRole("button", { name: "Next · Shape" });
    for (
      let i = 0;
      i < 80 && !(await next.evaluate((el) => el === document.activeElement));
      i++
    )
      await page.keyboard.press("Tab");
    await expect(next).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(stepLabel(page)).toHaveText("Step 2 / 10");
    await page.getByRole("button", { name: /^Step 7: Human/ }).focus();
    await page.keyboard.press("Enter");
    await expect(stepLabel(page)).toHaveText("Step 7 / 10");
  });

  test("remembers the step after a reload and in another tab", async ({
    page,
    context,
  }) => {
    await page.goto(`${path}?step=5`);
    await expect(stepLabel(page)).toHaveText("Step 5 / 10");
    await page.goto(path);
    await expect(stepLabel(page)).toHaveText("Step 5 / 10");
    const other = await context.newPage();
    await other.goto(path);
    await expect(stepLabel(other)).toHaveText("Step 5 / 10");
  });

  test("the Sources tab lists the step's sources with links", async ({
    page,
  }) => {
    await page.goto(`${path}?step=4`);
    await page.getByRole("tab", { name: "Sources" }).click();
    const panel = page.getByRole("tabpanel");
    await expect(panel.getByText("Sources for step 4")).toBeVisible();
    await expect(
      panel.getByRole("link", { name: /Model Context Protocol|MCP/ }).first(),
    ).toHaveAttribute("href", /^https:\/\/modelcontextprotocol\.io\//);
  });

  test("on a laptop it opens the whole system and stays so", async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "chromium-1280", "laptop only");
    const zoom = page.locator(".tt-zoom-level");
    await page.goto(`${LESSONS[1].path}?step=3`);
    await expect(zoom).toHaveText("100%");
    // A full-page capture briefly reports a 1 px wide window.
    await page.screenshot({ fullPage: true });
    await page.waitForTimeout(300);
    await expect(zoom).toHaveText("100%");
    // Narrowed to a phone, then widened: back to the whole system.
    await page.setViewportSize({ width: 360, height: 780 });
    await expect(zoom).toHaveText("150%");
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(zoom).toHaveText("100%");
  });

  test("the step rail is under the stage on a laptop, above it on a phone", async ({
    page,
  }, info) => {
    await page.goto(`${path}?step=4`);
    const rail = await page
      .getByRole("navigation", { name: "Steps" })
      .boundingBox();
    const stage = await page.locator(".tt-stagecard").boundingBox();
    if (info.project.name === "chromium-1280")
      expect(rail!.y).toBeGreaterThan(stage!.y + stage!.height - 1);
    else expect(rail!.y + rail!.height).toBeLessThan(stage!.y + 1);
  });

  test("hop badges keep off the labels (payments step 3)", async ({ page }) => {
    await page.goto(`${LESSONS[1].path}?step=3`);
    const overlaps = await page.evaluate(() => {
      const pills = [...document.querySelectorAll(".tt-stage .lb .pill")].map(
        (r) => r.getBoundingClientRect(),
      );
      const dots = [...document.querySelectorAll(".tt-stage .badge-dot")].map(
        (c) => c.getBoundingClientRect(),
      );
      let n = 0;
      for (const d of dots) {
        const cx = d.x + d.width / 2;
        const cy = d.y + d.height / 2;
        const r = d.width / 2;
        for (const p of pills) {
          const nx = Math.max(p.left, Math.min(cx, p.right));
          const ny = Math.max(p.top, Math.min(cy, p.bottom));
          if (Math.hypot(cx - nx, cy - ny) < r - 0.5) n++;
        }
      }
      return { n, dots: dots.length };
    });
    expect(overlaps.dots).toBeGreaterThan(0);
    expect(overlaps.n).toBe(0);
  });

  test("on a phone each step opens zoomed in on the request", async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "chromium-360", "phone only");
    await page.goto(`${path}?step=6`);
    await expect(page.locator(".tt-zoom-level")).toHaveText("150%");
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("sandboxes", () => {
  test("the cost sandbox shows the design's numbers and responds", async ({
    page,
  }) => {
    await page.goto(`${LESSONS[0].path}?step=10`);
    await page.getByRole("button", { name: "Sandbox" }).click();
    const tiles = page.getByRole("list", { name: "This step in numbers" });
    await expect(tiles).toContainText("$0.063");
    await expect(tiles).toContainText("$1,265");
    const box = page.getByRole("dialog", { name: "Sandbox · Claude prices" });
    await expect(box).toContainText("$37,944");
    await expect(box).toContainText("Claude prices, read 18 Nov 2026");
    await box.getByLabel("Prompt caching on").uncheck();
    await expect(tiles).toContainText("$0.123");
    await box.getByRole("button", { name: "Close sandbox" }).click();
    await expect(tiles).toContainText("$0.063"); // step 10's own figure
  });

  test("the payments sandbox: 15,000 timeouts, 6,000 duplicates, none keyed", async ({
    page,
  }) => {
    await page.goto(`${LESSONS[1].path}?step=6`);
    await page.getByRole("button", { name: "Sandbox" }).click();
    const tiles = page.getByRole("list", { name: "This step in numbers" });
    await expect(tiles).toContainText("15,000");
    await expect(tiles).toContainText("6,000");
    await page.getByLabel("Send an Idempotency-Key on retries").check();
    await expect(tiles).toContainText("₹0");
  });
});

test.describe("component details", () => {
  test("open from a part, go to the step that adds it, and close", async ({
    page,
  }) => {
    await page.goto(`${LESSONS[0].path}?step=9`);
    await page
      .getByRole("button", { name: "Policy · Cedar: show details" })
      .click();
    const details = page.getByRole("dialog", {
      name: "Policy · Cedar details",
    });
    await expect(details).toContainText("Component · step 6");
    await expect(details).toContainText("ASI02");
    await details.getByRole("button", { name: "Go to step 6" }).click();
    await expect(stepLabel(page)).toHaveText("Step 6 / 10");
    await page.keyboard.press("Escape");
  });
});
