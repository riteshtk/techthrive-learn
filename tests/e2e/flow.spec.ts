import { expect, test } from "@playwright/test";

const TOPICS = [
  { id: "how-an-llm-answers", title: "How an LLM answers", steps: 7 },
  { id: "rag", title: "RAG: answers from your documents", steps: 7 },
  { id: "agent-loop", title: "The agent loop", steps: 7 },
];

test("home → roadmap → each topic → last step → mark done", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("link", { name: "AI System Design" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "AI System Design",
  );

  for (const [i, topic] of TOPICS.entries()) {
    // Continue opens the next topic: step 1 is two taps from home.
    await page.getByTestId("continue").click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      topic.title,
    );
    await expect(page.getByTestId("counter")).toHaveText(`1 of ${topic.steps}`);

    const next = page.getByRole("button", { name: "Next" });
    for (let step = 2; step <= topic.steps; step++) {
      await next.click();
      await expect(page.getByTestId("counter")).toHaveText(
        `${step} of ${topic.steps}`,
      );
    }

    await page.getByRole("button", { name: "Mark as done" }).click();
    await expect(page).toHaveURL(/\/roadmaps\/ai-system-design\/$/);
    await expect(page.getByTestId(`done-${topic.id}`)).toHaveText("✓ Done");
    await expect(page.getByTestId("undo-toast")).toContainText(topic.title);

    const after = TOPICS[i + 1];
    await expect(page.getByTestId("continue")).toHaveText(
      after ? `Continue: ${after.title}` : `Start again: ${TOPICS[0]!.title}`,
    );
  }

  await page.getByRole("link", { name: "All roadmaps" }).click();
  await expect(page.getByTestId("progress-count")).toHaveText("3 of 3 done");
});
