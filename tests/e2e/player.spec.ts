import { expect, test, type Page } from "@playwright/test";

const LLM = "topics/how-an-llm-answers/";

/** Ids of the nodes and edges currently lit up. */
async function lit(page: Page): Promise<string[]> {
  return page
    .locator('.diagram [data-on="true"]')
    .evaluateAll((els) => els.map((el) => el.getAttribute("data-id") ?? ""));
}

test.describe("diagram player", () => {
  test("draws the diagram with step 1 lit and the rest dimmed", async ({
    page,
  }) => {
    await page.goto(LLM);
    await expect(page.locator(".diagram .node")).toHaveCount(5);
    await expect(page.locator(".diagram .edge")).toHaveCount(5);
    expect(await lit(page)).toEqual(["prompt"]);
  });

  test("Next and Back move one step", async ({ page }) => {
    await page.goto(LLM);
    await page.getByRole("button", { name: "Next" }).click();
    expect((await lit(page)).sort()).toEqual(["prompt-tokenizer", "tokenizer"]);
    await page.getByRole("button", { name: "Back" }).click();
    expect(await lit(page)).toEqual(["prompt"]);
  });

  test("Play holds each step for 2 s + 45 ms per character, then stops on the last", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto(LLM);
    await page.getByRole("button", { name: "Play" }).click();
    // Step 1: "You send a prompt, as plain text." is 33 characters.
    await page.clock.runFor(2000 + 45 * 33 - 50);
    expect(await lit(page)).toEqual(["prompt"]);
    await page.clock.runFor(100);
    expect((await lit(page)).sort()).toEqual(["prompt-tokenizer", "tokenizer"]);
    // Each later step advances after its own hold; React schedules the next
    // timer after rendering, so advance one step at a time.
    const later = [
      ["model", "tokenizer-model"],
      ["model-next-token", "next-token"],
      ["model", "next-token-model"],
      ["model", "model-next-token", "next-token", "next-token-model"],
      ["answer", "next-token-answer"],
    ];
    for (const expected of later) {
      await page.clock.runFor(8000);
      await expect
        .poll(async () => (await lit(page)).sort())
        .toEqual(expected.sort());
    }
    // It stops on the last step.
    await page.clock.runFor(60_000);
    expect((await lit(page)).sort()).toEqual(["answer", "next-token-answer"]);
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  });

  test("Play on the last step restarts from step 1", async ({ page }) => {
    await page.clock.install();
    await page.goto(LLM);
    const next = page.getByRole("button", { name: "Next" });
    for (let i = 0; i < 6; i++) await next.click();
    await page.getByRole("button", { name: "Play" }).click();
    expect(await lit(page)).toEqual(["prompt"]);
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  });

  test("Next pauses playback", async ({ page }) => {
    await page.clock.install();
    await page.goto(LLM);
    await page.getByRole("button", { name: "Play" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
    await page.clock.runFor(30_000);
    expect((await lit(page)).sort()).toEqual(["prompt-tokenizer", "tokenizer"]);
  });

  test("hiding the tab pauses playback", async ({ page }) => {
    await page.clock.install();
    await page.goto(LLM);
    await page.getByRole("button", { name: "Play" }).click();
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
    await page.clock.runFor(30_000);
    expect(await lit(page)).toEqual(["prompt"]);
  });

  for (const topic of ["how-an-llm-answers", "rag", "agent-loop"]) {
    test(`${topic}: labels fit their boxes and the page never scrolls sideways`, async ({
      page,
    }) => {
      await page.goto(`topics/${topic}/`);
      const problems = await page
        .locator(".diagram .node")
        .evaluateAll((nodes) =>
          nodes.flatMap((node) => {
            const rect = node.querySelector("rect")!.getBoundingClientRect();
            const text = node.querySelector("text")!.getBoundingClientRect();
            const size = parseFloat(
              getComputedStyle(node.querySelector("text")!).fontSize,
            );
            const scale =
              rect.width /
              Number(node.querySelector("rect")!.getAttribute("width"));
            const out: string[] = [];
            if (text.width > rect.width - 2)
              out.push(`${node.getAttribute("data-id")} overflows`);
            if (size * scale < 11.99)
              out.push(`${node.getAttribute("data-id")} label under 12px`);
            if (window.innerWidth <= 360 && rect.width < 71.99)
              out.push(`${node.getAttribute("data-id")} box under 72px`);
            return out;
          }),
        );
      expect(problems).toEqual([]);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
