import { expect, test } from "./fixtures";

const KEY = "ttl-learn:progress:v1";

test.describe("roadmap page", () => {
  test("lists topics in order with level and summary", async ({ page }) => {
    await page.goto("roadmaps/ai-system-design/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "AI System Design",
    );
    const items = page.locator(".topic-list > li");
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toContainText("How an LLM answers");
    await expect(items.nth(0)).toContainText("Basics");
    await expect(items.nth(1)).toContainText(
      "RAG: answers from your documents",
    );
    await expect(items.nth(1)).toContainText("Intermediate");
    await expect(items.nth(2)).toContainText("The agent loop");
    await expect(items.nth(2)).toContainText("Advanced");
  });

  test("Continue opens the first topic not yet done", async ({ page }) => {
    await page.addInitScript(
      (key) =>
        localStorage.setItem(
          key,
          JSON.stringify({ done: ["how-an-llm-answers"] }),
        ),
      KEY,
    );
    await page.goto("roadmaps/ai-system-design/");
    const cont = page.getByTestId("continue");
    await expect(cont).toHaveText("Continue: RAG: answers from your documents");
    await expect(cont).toHaveAttribute("href", "/techthrive-learn/topics/rag/");
    await expect(page.getByTestId("done-how-an-llm-answers")).toHaveText(
      "✓ Done",
    );
    await expect(page.getByTestId("done-rag")).toHaveText("");
  });

  test("Start again opens topic 1 when all are done", async ({ page }) => {
    await page.addInitScript(
      (key) =>
        localStorage.setItem(
          key,
          JSON.stringify({ done: ["how-an-llm-answers", "rag", "agent-loop"] }),
        ),
      KEY,
    );
    await page.goto("roadmaps/ai-system-design/");
    const cont = page.getByTestId("continue");
    await expect(cont).toHaveText("Start again: How an LLM answers");
    await expect(cont).toHaveAttribute(
      "href",
      "/techthrive-learn/topics/how-an-llm-answers/",
    );
  });
});
