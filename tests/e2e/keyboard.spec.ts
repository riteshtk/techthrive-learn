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
    browserName,
  }) => {
    // Safari moves between buttons with Option+Tab unless the user has
    // turned on "Press Tab to highlight each item".
    const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";
    await page.goto(LLM);
    await page.locator(".player").focus();
    for (const name of ["Back", "Play", "Next"]) {
      await page.keyboard.press(tab);
      const focused = page.getByRole("button", { name });
      await expect(focused).toBeFocused();
      const outline = await focused.evaluate(
        (el) => getComputedStyle(el).outlineStyle,
      );
      expect(outline).not.toBe("none");
    }
  });
});

test("a deep link opens on its step without animating there", async ({
  page,
}) => {
  // Record what is lit at the moment transitions switch on.
  await page.addInitScript(() => {
    new MutationObserver((records, observer) => {
      if (records.some((r) => r.attributeName === "data-ready")) {
        (window as unknown as { litAtReady: string[] }).litAtReady = [
          ...document.querySelectorAll('.diagram .node[data-on="true"]'),
        ].map((el) => el.getAttribute("data-id") ?? "");
        observer.disconnect();
      }
    }).observe(document, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-ready"],
    });
  });
  await page.goto(`${LLM}?step=7`);
  await expect(page.locator(".player")).toHaveAttribute("data-ready", "true");
  const litAtReady = await page.evaluate(
    () => (window as unknown as { litAtReady: string[] }).litAtReady,
  );
  expect(litAtReady).toEqual(["answer"]);
});

test.describe("reduced motion", () => {
  test("steps change without animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(LLM);
    await expect(page.locator(".player")).toHaveAttribute("data-ready", "true");
    const duration = await page
      .locator(".diagram .node rect")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration).toBe("0s");
  });

  test("animates in about 400 ms otherwise", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(LLM);
    await expect(page.locator(".player")).toHaveAttribute("data-ready", "true");
    const duration = await page
      .locator(".diagram .node rect")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration.split(",")[0]?.trim()).toBe("0.4s");
  });
});
