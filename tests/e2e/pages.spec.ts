import { expect, test } from "./fixtures";

// Every page has a title, description and share image (PRD quality bar).

const PAGES = [
  { path: "./", title: "Tech & Thrive Learn" },
  { path: "topics/", title: "Topics · Tech & Thrive Learn" },
  {
    path: "topics/foundations/",
    title: "Foundations: how AI apps work · Tech & Thrive Learn",
  },
  {
    path: "topics/ai-agents/",
    title: "Production AI agents for enterprise · Tech & Thrive Learn",
  },
  {
    path: "topics/payments/",
    title: "Payments platform · Tech & Thrive Learn",
  },
  { path: "review/", title: "Review · Tech & Thrive Learn" },
];

test.describe("every page", () => {
  for (const { path, title } of PAGES) {
    test(`${path} has a title, description and share image`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        /.{20,}/,
      );
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        /^https?:\/\/.+\/techthrive-learn\/og\.png$/,
      );
    });
  }

  test("the share image is 1200×630 and served", async ({ page, request }) => {
    const response = await request.get("og.png");
    expect(response.status()).toBe(200);
    await page.goto("./");
    await expect(
      page.locator('meta[property="og:image:width"]'),
    ).toHaveAttribute("content", "1200");
    await expect(
      page.locator('meta[property="og:image:height"]'),
    ).toHaveAttribute("content", "630");
  });

  test("an unknown page shows the 404 with a link home", async ({ page }) => {
    const response = await page.goto("no/such/page/");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Page not found",
    );
    await page.getByRole("link", { name: "Go home" }).click();
    await expect(
      page.getByRole("heading", { name: "Continue learning" }),
    ).toBeVisible();
  });
});
