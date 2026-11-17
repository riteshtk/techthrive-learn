import { expect, test, type Page } from "./fixtures";

const LLM = "topics/how-an-llm-answers/";

/** Ids of the nodes and edges currently lit up. */
async function lit(page: Page): Promise<string[]> {
  return page
    .locator('.diagram:visible [data-on="true"]')
    .evaluateAll((els) => els.map((el) => el.getAttribute("data-id") ?? ""));
}

test.describe("diagram player", () => {
  test("draws the diagram with step 1 lit and the rest dimmed", async ({
    page,
  }) => {
    await page.goto(LLM);
    await expect(page.locator(".diagram:visible .node")).toHaveCount(5);
    await expect(page.locator(".diagram:visible .edge")).toHaveCount(5);
    expect(await lit(page)).toEqual(["prompt"]);
  });

  test("Next and Back move one step", async ({ page }) => {
    await page.goto(LLM);
    await page.getByRole("button", { name: /^Next:/ }).click();
    expect((await lit(page)).sort()).toEqual(["prompt-tokenizer", "tokenizer"]);
    await page.getByRole("button", { name: "Back", exact: true }).click();
    expect(await lit(page)).toEqual(["prompt"]);
  });

  test("Play holds each step for 2 s + 45 ms per character, then stops on the last", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto(LLM);
    await page.getByRole("button", { name: "Play", exact: true }).click();
    // Step 1: "You send a prompt, as plain text." is 33 characters.
    // The installed clock also moves with real time, so allow a margin.
    await page.clock.runFor(2000 + 45 * 33 - 400);
    expect(await lit(page)).toEqual(["prompt"]);
    await page.clock.runFor(800);
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
    await expect(
      page.getByRole("button", { name: "Play", exact: true }),
    ).toBeVisible();
  });

  test("Play on the last step restarts from step 1", async ({ page }) => {
    await page.clock.install();
    await page.goto(LLM);
    const next = page.getByRole("button", { name: /^Next:/ });
    for (let i = 0; i < 6; i++) await next.click();
    await page.getByRole("button", { name: "Play", exact: true }).click();
    expect(await lit(page)).toEqual(["prompt"]);
    await expect(
      page.getByRole("button", { name: "Pause", exact: true }),
    ).toBeVisible();
  });

  test("Next pauses playback", async ({ page }) => {
    await page.clock.install();
    await page.goto(LLM);
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await page.getByRole("button", { name: /^Next:/ }).click();
    await expect(
      page.getByRole("button", { name: "Play", exact: true }),
    ).toBeVisible();
    await page.clock.runFor(30_000);
    expect((await lit(page)).sort()).toEqual(["prompt-tokenizer", "tokenizer"]);
  });

  test("hiding the tab pauses playback", async ({ page }) => {
    await page.clock.install();
    await page.goto(LLM);
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(
      page.getByRole("button", { name: "Play", exact: true }),
    ).toBeVisible();
    await page.clock.runFor(30_000);
    expect(await lit(page)).toEqual(["prompt"]);
  });

  for (const topic of ["how-an-llm-answers", "rag", "agent-loop"]) {
    test(`${topic}: the caption and controls are on screen with the diagram`, async ({
      page,
    }, testInfo) => {
      // A phone with browser chrome leaves about 740 px; a laptop 800.
      const narrow = testInfo.project.name.endsWith("360");
      await page.setViewportSize(
        narrow ? { width: 360, height: 740 } : { width: 1280, height: 800 },
      );
      await page.goto(`topics/${topic}/`);
      const height = page.viewportSize()!.height;
      // The bottom bar is fixed, so the stage and caption must end above it.
      const bar = (await page.locator(".bottom-bar").boundingBox())!;
      expect(bar.y + bar.height).toBeLessThanOrEqual(height + 0.5);
      for (const el of [
        page.locator(".stage"),
        page.locator(".timeline"),
        page.getByTestId("caption"),
      ]) {
        const box = (await el.boundingBox())!;
        expect(box.y + box.height).toBeLessThanOrEqual(bar.y);
      }
      for (const el of [
        page.getByRole("button", { name: /^Next:/ }),
        page.getByRole("button", { name: "Back", exact: true }),
      ]) {
        const box = (await el.boundingBox())!;
        expect(box.y + box.height).toBeLessThanOrEqual(height);
      }
    });

    test(`${topic}: edge labels sit beside their lines`, async ({ page }) => {
      await page.goto(`topics/${topic}/`);
      const touching = await page
        .locator(".diagram:visible .pill")
        .evaluateAll((pills) =>
          pills.flatMap((pill) => {
            const id = pill.getAttribute("data-edge");
            const line = pill
              .closest("svg")!
              .querySelector(`.edge[data-id="${id}"] .edge-line`);
            const b = (pill as SVGGElement).getBBox();
            if (!line) return [`${id}: no line`];
            const [x1, y1, x2, y2] = ["x1", "y1", "x2", "y2"].map((a) =>
              Number(line.getAttribute(a)),
            ) as [number, number, number, number];
            // Sample the line; any point inside the pill means overlap.
            for (let t = 0; t <= 1; t += 0.02) {
              const x = x1 + (x2 - x1) * t;
              const y = y1 + (y2 - y1) * t;
              if (x > b.x && x < b.x + b.width && y > b.y && y < b.y + b.height)
                return [id ?? ""];
            }
            return [];
          }),
        );
      expect(touching).toEqual([]);
    });

    test(`${topic}: labels fit their boxes and the page never scrolls sideways`, async ({
      page,
    }) => {
      await page.goto(`topics/${topic}/`);
      const problems = await page
        .locator(".diagram:visible .node")
        .evaluateAll((nodes) =>
          nodes.flatMap((node) => {
            const face = node.querySelector(".node-face")!;
            const rect = face.getBoundingClientRect();
            const text = node.querySelector("text")!.getBoundingClientRect();
            const size = parseFloat(
              getComputedStyle(node.querySelector("text")!).fontSize,
            );
            const scale = rect.width / Number(face.getAttribute("width"));
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
