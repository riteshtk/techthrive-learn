import { expect, test } from "@playwright/test";

const LLM = "topics/how-an-llm-answers/";

test.describe("step captions", () => {
  test("show one sentence per step, announced politely, with a counter", async ({
    page,
  }) => {
    await page.goto(LLM);
    const caption = page.getByTestId("caption");
    await expect(caption).toHaveAttribute("aria-live", "polite");
    await expect(caption).toHaveText("You send a prompt, as plain text.");
    await expect(page.getByTestId("counter")).toHaveText("1 of 7");
    await page.getByRole("button", { name: "Next" }).click();
    await expect(caption).toHaveText(
      "A tokenizer splits the text into tokens: whole words, parts of words or punctuation.",
    );
    await expect(page.getByTestId("counter")).toHaveText("2 of 7");
    const size = await caption.evaluate((el) =>
      parseFloat(getComputedStyle(el).fontSize),
    );
    expect(size).toBeGreaterThanOrEqual(18);
  });

  test("the controls stay put as the caption changes", async ({ page }) => {
    await page.goto(LLM);
    const next = page.getByRole("button", { name: "Next" });
    // Page coordinates: clicking may scroll the viewport.
    const top = () =>
      next.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    const before = await top();
    for (let i = 0; i < 6; i++) {
      await next.click();
      expect(await top()).toBe(before);
    }
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("every step sentence is in the page", async ({ page }) => {
    await page.goto(LLM);
    const items = page.locator(".all-steps li");
    await expect(items).toHaveCount(7);
    await expect(items.nth(6)).toHaveText(
      "The tokens are turned back into text, and that's the answer.",
    );
    await expect(page.getByTestId("caption")).toHaveText(
      "You send a prompt, as plain text.",
    );
    await expect(page.locator('.diagram [data-on="true"]')).toHaveCount(1);
  });
});
