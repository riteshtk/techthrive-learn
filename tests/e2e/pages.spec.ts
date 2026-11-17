import { expect, test } from "./fixtures";

const PAGES = [
  { path: "./", title: "Tech & Thrive Learn" },
  {
    path: "roadmaps/ai-system-design/",
    title: "AI System Design · Tech & Thrive Learn",
  },
  {
    path: "topics/how-an-llm-answers/",
    title: "How an LLM answers · Tech & Thrive Learn",
  },
  {
    path: "topics/rag/",
    title: "RAG: answers from your documents · Tech & Thrive Learn",
  },
  { path: "topics/agent-loop/", title: "The agent loop · Tech & Thrive Learn" },
];

test.describe("every page", () => {
  for (const { path, title } of PAGES) {
    test(`${path} has a title, description and share image`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
      const description = page.locator('meta[name="description"]');
      await expect(description).toHaveAttribute("content", /.{20,}/);
      const image = page.locator('meta[property="og:image"]');
      await expect(image).toHaveAttribute(
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
    await page.getByRole("link", { name: "Go to the roadmaps" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "System design and AI, one step at a time",
    );
  });

  test("every page is prebuilt HTML", async ({ request }) => {
    for (const { path } of PAGES) {
      const html = await (await request.get(path)).text();
      expect(html).toContain("<h1");
    }
  });
});
