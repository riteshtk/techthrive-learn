import { expect, test, type Page } from "./fixtures";

test.describe("theme toggle", () => {
  test("switches theme, swaps the logo and remembers the choice", async ({
    page,
  }) => {
    await page.goto("./");
    const toggle = page.getByTestId("theme-toggle");
    await expect(toggle).toHaveAccessibleName("Switch to light theme");
    const logo = page
      .getByRole("link", { name: "Tech & Thrive Learn: home" })
      .locator("img:visible");
    await expect(logo).toHaveAttribute("src", /on-dark\.svg$/);

    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(toggle).toHaveAccessibleName("Switch to dark theme");
    await expect(logo).toHaveAttribute("src", /on-light\.svg$/);
    const bg = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    expect(bg).toBe("rgb(244, 241, 234)");

    // Applied before paint on the next visit.
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("is dark by default, whatever the device asks", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("./");
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
    const bg = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    expect(bg).toBe("rgb(7, 10, 18)");
    await expect(page.getByTestId("theme-toggle")).toHaveAccessibleName(
      "Switch to light theme",
    );
  });
});

test.describe("top bar", () => {
  test("marks the section you are in", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Main" });
    await page.goto("./");
    await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await page.goto("topics/rag/");
    await expect(nav.getByRole("link", { name: "Learn" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: "Home" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  test("shows the compact lockup in both themes", async ({ page }) => {
    await page.goto("./");
    const home = page.getByRole("link", { name: "Tech & Thrive Learn: home" });
    const visible = home.locator("img:visible");
    await expect(visible).toHaveAttribute(
      "src",
      /lockup-compact_on-dark\.svg$/,
    );
    await page.getByTestId("theme-toggle").click();
    await expect(visible).toHaveAttribute(
      "src",
      /lockup-compact_on-light\.svg$/,
    );
  });

  test("never scrolls sideways", async ({ page }) => {
    for (const path of ["./", "topics/rag/", "roadmaps/ai-system-design/"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});

const dialogOf = (page: Page) => page.getByRole("dialog", { name: "Search" });

test.describe("search", () => {
  test("Ctrl+K opens it and Enter opens the step that matches", async ({
    page,
  }) => {
    await page.goto("./");
    await page.keyboard.press("Control+k");
    const dialog = dialogOf(page);
    await expect(dialog).toBeVisible();
    const input = dialog.getByRole("combobox");
    await expect(input).toBeFocused();
    await input.fill("greedy search");
    const option = dialog.getByRole("option").first();
    await expect(option).toContainText("Draw one token");
    await expect(option).toContainText("How an LLM answers · step 4");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(
      /\/topics\/foundations\/lessons\/how-an-llm-answers\/\?step=4$/,
    );
    await expect(
      page.getByRole("tabpanel").getByText(/^Step \d+ \/ 7$/),
    ).toHaveText("Step 4 / 7");
  });

  test("a step in the page already open moves the player there", async ({
    page,
  }) => {
    await page.goto("topics/foundations/lessons/how-an-llm-answers/?step=2");
    await expect(
      page.getByRole("tabpanel").getByText(/^Step \d+ \/ 7$/),
    ).toHaveText("Step 2 / 7");
    await page.keyboard.press("Control+k");
    await dialogOf(page).getByRole("combobox").fill("greedy search");
    await expect(dialogOf(page).getByRole("option").first()).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(
      /\/topics\/foundations\/lessons\/how-an-llm-answers\/\?step=4$/,
    );
    await expect(
      page.getByRole("tabpanel").getByText(/^Step \d+ \/ 7$/),
    ).toHaveText("Step 4 / 7");
  });

  test("/ opens it and arrow keys move through results", async ({ page }) => {
    await page.goto("./");
    await page.keyboard.press("/");
    const dialog = dialogOf(page);
    await expect(dialog).toBeVisible();
    await dialog.getByRole("combobox").fill("model");
    const options = dialog.getByRole("option");
    await expect(options.nth(1)).toBeVisible();
    await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowDown");
    await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("the button opens it and it says when nothing matches", async ({
    page,
  }) => {
    await page.goto("./");
    await page
      .getByRole("button", { name: "Search topics, lessons, facts" })
      .click();
    const dialog = dialogOf(page);
    await dialog.getByRole("combobox").fill("zebra crossing");
    await expect(dialog.getByRole("status")).toHaveText(
      "Nothing matches “zebra crossing”.",
    );
  });
});

// Issue #4: the index is a file fetched when search first opens, not data
// in every page.
test.describe("search index on demand", () => {
  test("no page carries other topics' step text", async ({ request }) => {
    const phrase = "less randomness";
    const home = await (await request.get("./")).text();
    expect(home).not.toContain(phrase);
    const rag = await (
      await request.get("topics/foundations/lessons/rag/")
    ).text();
    expect(rag).not.toContain(phrase);
    const llm = await (
      await request.get("topics/foundations/lessons/how-an-llm-answers/")
    ).text();
    expect(llm).toContain(phrase);
  });

  test("the index is fetched once, when search first opens", async ({
    page,
  }) => {
    const fetched: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("search-index.json")) fetched.push(r.url());
    });
    await page.goto("./");
    await page.waitForLoadState("networkidle");
    expect(fetched).toEqual([]);

    await page.keyboard.press("Control+k");
    await dialogOf(page).getByRole("combobox").fill("rag");
    await expect(dialogOf(page).getByRole("option").first()).toBeVisible();
    expect(fetched).toHaveLength(1);
    expect(fetched[0]).toMatch(/\/techthrive-learn\/search-index\.json$/);

    await page.keyboard.press("Escape");
    await page.keyboard.press("Control+k");
    await dialogOf(page).getByRole("combobox").fill("agent");
    await expect(dialogOf(page).getByRole("option").first()).toBeVisible();
    expect(fetched).toHaveLength(1);
  });
});
