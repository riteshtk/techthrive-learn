import { expect, test } from "@playwright/test";

const LLM = "topics/how-an-llm-answers/";

test.describe("keyboard", () => {
  test("Right and Left step while the player has focus", async ({ page }) => {
    await page.goto(LLM);
    await page.locator(".player").focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("counter")).toHaveText("3 of 7");
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("counter")).toHaveText("2 of 7");
  });

  test("Space plays and pauses", async ({ page }) => {
    await page.clock.install();
    await page.goto(LLM);
    await page.locator(".player").focus();
    await page.keyboard.press(" ");
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
    await page.keyboard.press(" ");
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  });

  test("a focused button keeps its own Space", async ({ page }) => {
    await page.goto(LLM);
    await page.getByRole("button", { name: "Next" }).focus();
    await page.keyboard.press(" ");
    await expect(page.getByTestId("counter")).toHaveText("2 of 7");
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  });

  test("every control is reachable with Tab and shows focus", async ({
    page,
  }) => {
    await page.goto(LLM);
    await page.locator(".player").focus();
    for (const name of ["Back", "Play", "Next"]) {
      await page.keyboard.press("Tab");
      const focused = page.getByRole("button", { name });
      await expect(focused).toBeFocused();
      const outline = await focused.evaluate(
        (el) => getComputedStyle(el).outlineStyle,
      );
      expect(outline).not.toBe("none");
    }
  });
});

test.describe("reduced motion", () => {
  test("steps change without animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(LLM);
    const duration = await page
      .locator(".diagram .node rect")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration).toBe("0s");
  });

  test("animates in about 400 ms otherwise", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(LLM);
    const duration = await page
      .locator(".diagram .node rect")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration.split(",")[0]?.trim()).toBe("0.4s");
  });
});
