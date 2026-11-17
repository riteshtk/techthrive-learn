import { expect, test } from "@playwright/test";

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
