import { expect, test, type Page } from "./fixtures";

// The diagram engine (PRD P4), driven through the stage on the kit page.

const field = (page: Page) =>
  page.getByRole("group", { name: /^Card-dispute agent, (3D|2D)\./ });
const svg = (page: Page) => field(page).locator("svg");

/** The packet's running animations, as their play states. */
const packetAnimations = (page: Page) =>
  page.evaluate(() =>
    document
      .querySelector(".tt-stage .packet")!
      .getAnimations()
      .map((a) => a.playState),
  );

test.describe("diagram engine", () => {
  test("plays the request hop by hop, and pause holds it", async ({ page }) => {
    await page.goto("kit/");
    const tag = page.getByTestId("hop-tag");
    await expect(tag).toHaveText(/^Hop 1 of 6/);
    await expect.poll(() => packetAnimations(page)).toEqual(["running"]);
    // The next hop comes after 1.7 s at 1×.
    await expect(tag).toHaveText(/^Hop 2 of 6/, { timeout: 2500 });

    await page.getByTestId("stage-play").click();
    await expect(page.getByTestId("stage-play")).toHaveAccessibleName("Play");
    await expect.poll(() => packetAnimations(page)).toEqual(["paused"]);
    const held = await tag.textContent();
    await page.waitForTimeout(2000);
    await expect(tag).toHaveText(held!);
  });

  test("resuming finishes the paused hop, not a whole new one", async ({
    page,
  }) => {
    await page.goto("kit/");
    const tag = page.getByTestId("hop-tag");
    const play = page.getByTestId("stage-play");
    await expect(tag).toHaveText(/^Hop 2 of 6/, { timeout: 2500 });
    // Pause 1.2 s into the 1.7 s hop, wait, then play again.
    await page.waitForTimeout(1200);
    await play.click();
    await page.waitForTimeout(1000);
    await expect(tag).toHaveText(/^Hop 2 of 6/);
    await play.click();
    // About half a second of it is left, not another 1.7 s.
    await expect(tag).toHaveText(/^Hop 3 of 6/, { timeout: 1100 });
  });

  test("Replay restarts the first hop even when it's already playing", async ({
    page,
  }) => {
    await page.goto("kit/");
    const tag = page.getByTestId("hop-tag");
    const replay = page.getByRole("button", { name: "Replay the request" });
    await expect(tag).toHaveText(/^Hop 1 of 6/);
    await page.waitForTimeout(1200);
    await replay.click();
    const flown = await page.evaluate(
      () =>
        document.querySelector(".tt-stage .packet")!.getAnimations()[0]!
          .currentTime as number,
    );
    expect(flown).toBeLessThan(400);
    await page.waitForTimeout(1000);
    await expect(tag).toHaveText(/^Hop 1 of 6/);
    await expect(tag).toHaveText(/^Hop 2 of 6/, { timeout: 1500 });
  });

  test("speed changes how long a hop lasts", async ({ page }) => {
    await page.goto("kit/");
    await page
      .getByRole("group", { name: "Speed" })
      .getByRole("button", { name: "2×" })
      .click();
    await page.getByRole("button", { name: "Replay the request" }).click();
    await expect(page.getByTestId("hop-tag")).toHaveText(/^Hop 3 of 6/, {
      timeout: 2000,
    });
  });

  test("with reduced motion it starts paused and nothing moves", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("kit/");
    await expect(page.getByTestId("stage-play")).toHaveAccessibleName("Play");
    expect(await packetAnimations(page)).toEqual([]);
    const marching = await page.evaluate(
      () => document.querySelector(".tt-stage .ed.on")!.getAnimations().length,
    );
    expect(marching).toBe(0);
  });

  test("zooms and pans from the keyboard, and fits back", async ({ page }) => {
    await page.goto("kit/");
    await field(page).focus();
    await page.keyboard.press("+");
    await expect(page.getByText("125%")).toBeVisible();
    await expect(svg(page)).toHaveAttribute("viewBox", "95 56.7 760 453.6");
    await page.keyboard.press("ArrowRight");
    await expect(svg(page)).toHaveAttribute("viewBox", "127 56.7 760 453.6");
    // Arrows pan here; they don't change the step.
    await expect(page.getByTestId("stage-step")).toHaveText("Step 6 / 6");
    await page.keyboard.press("0");
    await expect(svg(page)).toHaveAttribute("viewBox", "0 0 950 567");
    await page.getByRole("button", { name: "Zoom out" }).click();
    await expect(page.getByText("80%")).toBeVisible();
  });

  test("pans by dragging, and a drag doesn't select", async ({ page }) => {
    await page.goto("kit/");
    await page.getByRole("button", { name: "Zoom in" }).click();
    const box = (await svg(page).boundingBox())!;
    const before = await svg(page).getAttribute("viewBox");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2, {
      steps: 6,
    });
    await page.mouse.up();
    expect(await svg(page).getAttribute("viewBox")).not.toBe(before);
    await expect(field(page).locator('[aria-pressed="true"]')).toHaveCount(0);
  });

  test("switches between 3D and 2D, resetting the camera", async ({ page }) => {
    await page.goto("kit/");
    await page.getByRole("button", { name: "Zoom in" }).click();
    await page
      .getByRole("group", { name: "Diagram style" })
      .getByRole("button", { name: "2D" })
      .click();
    await expect(field(page)).toHaveAccessibleName(/^Card-dispute agent, 2D\./);
    await expect(svg(page)).toHaveAttribute("viewBox", "0 0 960 500");
    await expect(field(page).locator(".bx")).toHaveCount(11);
  });

  test("builds up step by step, ghosting parts not built yet", async ({
    page,
  }) => {
    await page.goto("kit/");
    for (let i = 0; i < 5; i++)
      await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page.getByTestId("stage-step")).toHaveText("Step 1 / 6");
    await expect(
      field(page).getByRole("button", { name: /\(not built yet\)/ }),
    ).toHaveCount(9);
    await page
      .getByRole("group", { name: "What the diagram shows" })
      .getByRole("button", { name: "Full system" })
      .click();
    await expect(
      field(page).getByRole("button", { name: /\(not built yet\)/ }),
    ).toHaveCount(0);
  });

  test("selects a part from the keyboard and dims the unrelated ones", async ({
    page,
  }) => {
    await page.goto("kit/");
    const policy = field(page).getByRole("button", {
      name: "Policy · Cedar: show details",
    });
    await policy.focus();
    await page.keyboard.press("Enter");
    await expect(policy).toHaveAttribute("aria-pressed", "true");
    // Policy joins the orchestrator and human approval; the other 8 dim.
    await expect(field(page).locator(".nd.dim")).toHaveCount(8);
    await page.keyboard.press("Enter");
    await expect(policy).toHaveAttribute("aria-pressed", "false");
  });

  test("layers hide labels, links and the request flow", async ({ page }) => {
    await page.goto("kit/");
    await page.getByRole("button", { name: /^Layers/ }).click();
    const layers = page.getByRole("group", { name: "Layers" });
    await layers.getByLabel("Labels").uncheck();
    await expect(field(page).locator(".labels")).toBeHidden();
    await layers.getByLabel("Request flow").uncheck();
    await expect(field(page).locator(".badges")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Layers/ })).toContainText(
      "2/4",
    );
    await page.keyboard.press("Escape");
    await expect(layers).toBeHidden();
  });

  test("has a text version of the diagram", async ({ page }) => {
    await page.goto("kit/");
    await page.getByText("Text version of the diagram").click();
    const text = page.locator(".tt-stage-text");
    await expect(text).toContainText("Step 6: 11 of 11 parts built.");
    await expect(
      text
        .getByRole("listitem")
        .filter({ hasText: "Policy · Cedar → Agent orchestrator" }),
    ).toHaveText(
      "Policy · Cedar → Agent orchestrator: Permit, under the limit.",
    );
  });
});
