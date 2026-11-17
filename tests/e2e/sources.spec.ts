import { expect, test } from "@playwright/test";

test.describe("sources and video", () => {
  test("each topic lists its sources with the date read", async ({ page }) => {
    await page.goto("topics/rag/");
    const items = page.locator(".sources li");
    await expect(items).toHaveCount(3);
    await expect(items.first()).toContainText(
      "Lewis et al., Retrieval-Augmented Generation (read 17 Nov 2026)",
    );
    await expect(items.first().getByRole("link")).toHaveAttribute(
      "href",
      "https://arxiv.org/abs/2005.11401",
    );
  });

  test("the video is a link, never an embed", async ({ page }) => {
    await page.goto("topics/agent-loop/");
    await expect(
      page.getByRole("link", { name: /Watch on YouTube/ }),
    ).toHaveAttribute("href", "https://www.youtube.com/watch?v=OCmZVrivYUY");
    await expect(page.locator("iframe")).toHaveCount(0);
  });

  test("no third-party requests are made", async ({ page }) => {
    const hosts = new Set<string>();
    page.on("request", (r) => hosts.add(new URL(r.url()).host));
    await page.goto("topics/how-an-llm-answers/");
    await page.waitForLoadState("networkidle");
    expect([...hosts]).toEqual(["localhost:4517"]);
  });
});
