import { expect, test, type Page } from "./fixtures";

const LLM = "topics/how-an-llm-answers/";

/** Moves the mouse onto the middle of an edge's line. */
async function hoverEdge(page: Page, id: string) {
  const p = await page
    .locator(`.diagram:visible .edge[data-id="${id}"] .edge-line`)
    .evaluate((el) => {
      const b = el.getBoundingClientRect();
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    });
  await page.mouse.move(p.x, p.y);
}

test.describe("lesson header", () => {
  test("shows the breadcrumb and chips", async ({ page }) => {
    await page.goto("topics/rag/");
    await expect(page.locator(".breadcrumb")).toHaveText(
      "AI System Design / Topic 2 of 3",
    );
    await expect(page.locator(".chips li")).toHaveText([
      "8 min",
      "Intermediate",
      "7 steps",
    ]);
  });
});

test.describe("stage", () => {
  test("clicking a block shows its note; again or Escape hides it", async ({
    page,
  }) => {
    await page.goto(LLM);
    const block = page.getByRole("button", { name: "Tokenizer", exact: true });
    const note = page.locator(
      '.diagram-wrap:visible [data-testid="inspector"]',
    );
    await block.click();
    await expect(block).toHaveAttribute("aria-pressed", "true");
    await expect(note).toContainText(
      "Splits text into tokens, each of which the model knows by number.",
    );
    await expect(note).toHaveAttribute("role", "status");
    await block.click();
    await expect(note).toHaveAttribute("data-open", "false");

    await block.focus();
    await page.keyboard.press("Enter");
    await expect(note).toHaveAttribute("data-open", "true");
    await page.keyboard.press("Escape");
    await expect(note).toHaveAttribute("data-open", "false");
  });

  test("hovering or focusing a line shows what flows along it", async ({
    page,
  }) => {
    await page.goto(LLM);
    const note = page.locator(
      '.diagram-wrap:visible [data-testid="inspector"]',
    );
    await hoverEdge(page, "tokenizer-model");
    await expect(note).toContainText("Tokenizer → Model");
    await expect(note).toContainText("token ids");
    await page.mouse.move(2, 2);
    await expect(note).toHaveAttribute("data-open", "false");

    await page
      .locator('.diagram:visible .edge[data-id="model-next-token"]')
      .focus();
    await expect(note).toContainText("a score for every possible token");
  });

  test("a line's note never covers the blocks it joins", async ({ page }) => {
    await page.goto(LLM);
    await hoverEdge(page, "tokenizer-model");
    const note = (await page
      .locator('.diagram-wrap:visible [data-testid="inspector"]')
      .boundingBox())!;
    for (const id of ["tokenizer", "model"]) {
      const block = (await page
        .locator(`.diagram:visible .node[data-id="${id}"] .node-face`)
        .boundingBox())!;
      const overlaps =
        note.x < block.x + block.width &&
        block.x < note.x + note.width &&
        note.y < block.y + block.height &&
        block.y < note.y + note.height;
      expect(overlaps, `${id} covered`).toBe(false);
    }
  });

  test("the timeline jumps to any step", async ({ page }) => {
    await page.goto(LLM);
    await page.getByRole("button", { name: "Step 5: Feed it back in" }).click();
    await expect(page.getByTestId("counter")).toHaveText("5 of 7");
    await expect(page).toHaveURL(/\?step=5$/);
    await expect(
      page.getByRole("button", { name: "Step 5: Feed it back in" }),
    ).toHaveAttribute("aria-current", "step");
  });

  test("Next is named after the next step, then becomes Mark as done", async ({
    page,
  }) => {
    await page.goto(`${LLM}?step=6`);
    await expect(
      page.getByRole("button", { name: "Next: Turn tokens into text" }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^Next:/ }).click();
    await expect(page.getByRole("button", { name: /^Next:/ })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Mark as done" }),
    ).toBeVisible();
  });

  test("Replay starts again from step 1 and plays", async ({ page }) => {
    await page.clock.install();
    await page.goto(`${LLM}?step=4`);
    await page.getByRole("button", { name: "Replay from step 1" }).click();
    await expect(page.getByTestId("counter")).toHaveText("1 of 7");
    await expect(
      page.getByRole("button", { name: "Pause", exact: true }),
    ).toBeVisible();
  });

  test("an ember packet travels each active line", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`${LLM}?step=6`);
    // Step 6 lights two lines.
    await expect(page.locator(".diagram:visible .packet")).toHaveCount(2);
    await expect(
      page.locator(".diagram:visible .packet animateMotion"),
    ).toHaveCount(2);
    const moved = await page
      .locator(".diagram:visible .packet")
      .first()
      .evaluate(
        (el) =>
          new Promise<boolean>((resolve) => {
            const before = el.getBoundingClientRect();
            setTimeout(() => {
              const after = el.getBoundingClientRect();
              resolve(before.x !== after.x || before.y !== after.y);
            }, 300);
          }),
      );
    expect(moved).toBe(true);
  });

  test("with reduced motion the packet sits still", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${LLM}?step=2`);
    await expect(page.locator(".diagram:visible .packet")).toHaveCount(1);
    await expect(
      page.locator(".diagram:visible .packet animateMotion"),
    ).toHaveCount(0);
  });

  test("full screen shows the whole player", async ({ page }) => {
    await page.goto(LLM);
    const button = page.getByRole("button", { name: "Full screen" });
    test.skip(
      !(await page.evaluate(() => document.fullscreenEnabled)),
      "This browser has no element full screen.",
    );
    await button.click();
    await expect
      .poll(() =>
        page.evaluate(() => document.fullscreenElement?.className ?? ""),
      )
      .toBe("player");
    await expect(
      page.getByRole("button", { name: "Exit full screen" }),
    ).toBeVisible();
  });

  for (const topic of ["how-an-llm-answers", "rag", "agent-loop"]) {
    test(`${topic}: on a laptop the diagram fills most of the stage`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`topics/${topic}/`);
      const stage = (await page.locator(".stage").boundingBox())!;
      const diagram = (await page.locator(".diagram:visible").boundingBox())!;
      expect(diagram.width / stage.width).toBeGreaterThanOrEqual(0.75);
      // Still on one screen with the caption above the bottom bar.
      const bar = (await page.locator(".bottom-bar").boundingBox())!;
      const caption = (await page.getByTestId("caption").boundingBox())!;
      expect(caption.y + caption.height).toBeLessThanOrEqual(bar.y);
    });
  }

  test("the legend explains the colours", async ({ page }) => {
    await page.goto(LLM);
    await expect(page.getByRole("list", { name: "Legend" })).toHaveText(
      /This step\s*Moving\s*Waiting/,
    );
  });
});
