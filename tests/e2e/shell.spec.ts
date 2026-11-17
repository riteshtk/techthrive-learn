import { expect, test } from "./fixtures";

test.describe("theme toggle", () => {
  test("switches theme, swaps the logo and remembers the choice", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("./");
    const toggle = page.getByTestId("theme-toggle");
    await expect(toggle).toHaveAccessibleName("Switch to dark theme");
    const logo = page.getByRole("img", { name: "Tech & Thrive" });
    await expect(logo).toHaveAttribute("src", /on-light\.svg$/);

    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(toggle).toHaveAccessibleName("Switch to light theme");
    await expect(logo).toHaveAttribute("src", /on-dark\.svg$/);
    const bg = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    expect(bg).toBe("rgb(7, 10, 18)");

    // Applied before paint on the next visit.
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("follows the device when nothing is chosen", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("./");
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
    await expect(page.getByTestId("theme-toggle")).toHaveAccessibleName(
      "Switch to light theme",
    );
  });
});

test.describe("course drawer", () => {
  test("lists each roadmap's topics with progress", async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        "ttl-learn:progress:v1",
        JSON.stringify({ done: ["rag"] }),
      ),
    );
    await page.goto("topics/rag/");
    await page.getByRole("button", { name: "Open the course menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Roadmaps" });
    await expect(drawer).toBeVisible();
    await expect(
      drawer.getByTestId("drawer-count-ai-system-design"),
    ).toHaveText("1/3");
    const links = drawer.getByRole("listitem");
    await expect(links).toHaveCount(3);
    await expect(
      drawer.getByRole("link", { name: /RAG: answers from your documents/ }),
    ).toHaveAttribute("aria-current", "page");

    await drawer.getByRole("link", { name: /The agent loop/ }).click();
    await expect(page).toHaveURL(/\/topics\/agent-loop\//);
    await expect(drawer).toBeHidden();
  });

  test("closes with Escape and keeps focus inside while open", async ({
    page,
  }) => {
    await page.goto("./");
    await page.getByRole("button", { name: "Open the course menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Roadmaps" });
    await expect(drawer).toBeVisible();
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      // The page behind is inert: focus stays in the drawer, or leaves the
      // page for the browser's own controls (reported as <body>).
      const where = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return "browser";
        return el.closest("dialog") ? "drawer" : el.outerHTML.slice(0, 80);
      });
      expect(["drawer", "browser"]).toContain(where);
    }
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  });
});

test.describe("search", () => {
  test("Ctrl+K opens it and Enter opens the step that matches", async ({
    page,
  }) => {
    await page.goto("./");
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: "Search topics" });
    await expect(dialog).toBeVisible();
    const input = dialog.getByRole("combobox");
    await expect(input).toBeFocused();
    await input.fill("temperature");
    const option = dialog.getByRole("option");
    await expect(option).toHaveCount(1);
    await expect(option).toContainText("How an LLM answers");
    await expect(option).toContainText("Step 4: Pick one token");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/topics\/how-an-llm-answers\/\?step=4$/);
    await expect(page.getByTestId("counter")).toHaveText("4 of 7");
  });

  test("a step in the topic already open moves the player there", async ({
    page,
  }) => {
    await page.goto("topics/how-an-llm-answers/?step=2");
    await expect(page.getByTestId("counter")).toHaveText("2 of 7");
    await page.keyboard.press("Control+k");
    await page.getByRole("combobox").fill("temperature");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/topics\/how-an-llm-answers\/\?step=4$/);
    await expect(page.getByTestId("counter")).toHaveText("4 of 7");
  });

  test("arrow keys move through results; / also opens search", async ({
    page,
  }) => {
    await page.goto("./");
    await page.keyboard.press("/");
    const dialog = page.getByRole("dialog", { name: "Search topics" });
    await expect(dialog).toBeVisible();
    const options = dialog.getByRole("option");
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowDown");
    await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("says when nothing matches", async ({ page }) => {
    await page.goto("./");
    await page.getByRole("button", { name: /Search topics/ }).click();
    await page.getByRole("combobox").fill("kubernetes");
    await expect(page.getByText("No topics match “kubernetes”.")).toBeVisible();
  });
});
