import { expect, test, type Page } from "./fixtures";

const LLM = "topics/how-an-llm-answers/";

/** History length after one ordinary navigation, to compare against. */
async function baseline(page: Page): Promise<number> {
  await page.goto("./");
  return page.evaluate(() => history.length);
}

test.describe("deep links", () => {
  test("?step=3 opens step 3", async ({ page }) => {
    await page.goto(`${LLM}?step=3`);
    await expect(page.getByTestId("counter")).toHaveText("3 of 7");
    await expect(page.getByTestId("caption")).toHaveText(
      "The model reads every token so far and scores each possible next token.",
    );
    await expect(page).toHaveURL(/\?step=3$/);
  });

  for (const bad of ["99", "0", "-2", "abc", "3abc", "2.5"]) {
    test(`?step=${bad} opens step 1 and corrects the address in place`, async ({
      page,
    }) => {
      const before = await baseline(page);
      await page.goto(`${LLM}?step=${bad}`);
      await expect(page).toHaveURL(/\?step=1$/);
      await expect(page.getByTestId("counter")).toHaveText("1 of 7");
      expect(await page.evaluate(() => history.length)).toBe(before + 1);
    });
  }

  test("a missing step opens step 1 and adds it to the address", async ({
    page,
  }) => {
    const before = await baseline(page);
    await page.goto(LLM);
    await expect(page).toHaveURL(/\/topics\/how-an-llm-answers\/\?step=1$/);
    expect(await page.evaluate(() => history.length)).toBe(before + 1);
  });

  test("the address follows each step without new history entries", async ({
    page,
  }) => {
    const before = await baseline(page);
    await page.goto(`${LLM}?step=1`);
    await page.getByRole("button", { name: /^Next:/ }).click();
    await expect(page).toHaveURL(/\?step=2$/);
    await page.getByRole("button", { name: /^Next:/ }).click();
    await expect(page).toHaveURL(/\?step=3$/);
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL(/\?step=2$/);
    expect(await page.evaluate(() => history.length)).toBe(before + 1);
  });

  test("a shared link survives a reload", async ({ page }) => {
    await page.goto(`${LLM}?step=5`);
    await page.reload();
    await expect(page.getByTestId("counter")).toHaveText("5 of 7");
  });

  test("an unknown topic is a 404", async ({ page }) => {
    const response = await page.goto("topics/not-a-topic/");
    expect(response?.status()).toBe(404);
  });
});
