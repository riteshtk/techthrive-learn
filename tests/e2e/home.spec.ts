import { expect, test } from "./fixtures";

test.describe("home", () => {
  test("lists the roadmap with goal, topic count and progress", async ({
    page,
  }) => {
    await page.goto("./");
    const card = page.locator(".card", { hasText: "AI System Design" });
    await expect(card).toContainText(
      "How AI apps actually work, from one prompt to an agent that uses tools.",
    );
    await expect(card).toContainText("3 topics");
    await expect(card.getByTestId("progress-count")).toHaveText("0 of 3 done");
  });

  test("shows stored progress, ignoring unknown topic ids", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "ttl-learn:progress:v1",
        JSON.stringify({ done: ["rag", "deleted-topic"] }),
      );
    });
    await page.goto("./");
    await expect(page.getByTestId("progress-count")).toHaveText("1 of 3 done");
  });

  test("still works when storage throws", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("SecurityError");
        },
      });
    });
    await page.goto("./");
    await expect(page.getByTestId("progress-count")).toHaveText("0 of 3 done");
  });

  test("shows the brand logo, from the brand kit files", async ({
    page,
    request,
  }) => {
    await page.goto("./");
    const lockup = page
      .getByRole("link", { name: "Tech & Thrive Learn: home" })
      .locator("img:visible");
    await expect(lockup).toBeVisible();
    await expect(lockup).toHaveAttribute(
      "src",
      /^\/techthrive-learn\/brand\/lockup-compact_on-dark\.svg$/,
    );
    const svg = await (
      await request.get("brand/lockup-compact_on-dark.svg")
    ).text();
    expect(svg).toContain('viewBox="0 0 1338.69 300"');
    await expect(page.locator(".hero-mark img:visible")).toBeVisible();
  });

  test("shows progress as one dot per topic, filled when done", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "ttl-learn:progress:v1",
        JSON.stringify({ done: ["rag"] }),
      );
    });
    await page.goto("./");
    const card = page.locator(".roadmap-card");
    await expect(card.locator(".dot")).toHaveCount(3);
    await expect(card.getByTestId("dot-rag")).toHaveAttribute(
      "data-done",
      "true",
    );
    await expect(card.getByTestId("dot-how-an-llm-answers")).toHaveAttribute(
      "data-done",
      "false",
    );
    await expect(card.getByTestId("progress-count")).toHaveText("1 of 3 done");
  });

  test("links to the roadmap page under the base path", async ({ page }) => {
    await page.goto("./");
    await expect(
      page.getByRole("link", { name: "AI System Design" }),
    ).toHaveAttribute("href", "/techthrive-learn/roadmaps/ai-system-design/");
  });

  test("never scrolls sideways", async ({ page }) => {
    await page.goto("./");
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
