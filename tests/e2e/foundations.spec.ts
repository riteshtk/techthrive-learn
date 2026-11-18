import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "./fixtures";

// Foundations (PRD P17): v1's three topics rebuilt as lessons; their old
// addresses redirect; v1 progress carries over.

const LESSONS = [
  {
    id: "how-an-llm-answers",
    title: "How an LLM answers",
    steps: ["Prompt", "Tokens", "Score", "Draw", "Again", "Stop", "Answer"],
  },
  {
    id: "rag",
    title: "RAG: answers from your documents",
    steps: [
      "Chunks",
      "Embed",
      "Store",
      "Question",
      "Retrieve",
      "Prompt",
      "Answer",
    ],
  },
  {
    id: "agent-loop",
    title: "The agent loop",
    steps: ["Goal", "Decide", "Ask", "Check", "Run", "Again", "Stop"],
  },
] as const;

const stepLabel = (page: Page) =>
  page.getByRole("tabpanel").getByText(/^Step \d+ \/ 7$/);

for (const lesson of LESSONS) {
  const path = `topics/foundations/lessons/${lesson.id}/`;
  test.describe(lesson.title, () => {
    test("steps through to the checkpoint", async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        lesson.title,
      );
      for (let n = 1; n < 7; n++) {
        await expect(stepLabel(page)).toHaveText(`Step ${n} / 7`);
        await page
          .getByRole("button", { name: `Next · ${lesson.steps[n]}` })
          .click();
      }
      await expect(stepLabel(page)).toHaveText("Step 7 / 7");
      await expect(
        page.getByRole("link", { name: "Take the checkpoint" }),
      ).toHaveAttribute("href", /\/checkpoint\/$/);
    });

    test("opens every step from its own link", async ({ page }) => {
      for (let n = 1; n <= 7; n++) {
        await page.goto(`${path}?step=${n}`);
        await expect(stepLabel(page)).toHaveText(`Step ${n} / 7`);
      }
    });

    test("its v1 address redirects, keeping the step", async ({ page }) => {
      await page.goto(`topics/${lesson.id}/?step=3`);
      await expect(page).toHaveURL(
        new RegExp(`/topics/foundations/lessons/${lesson.id}/\\?step=3$`),
      );
      await expect(stepLabel(page)).toHaveText("Step 3 / 7");
    });

    test("its checkpoint has three questions", async ({ page }) => {
      await page.goto(`${path}checkpoint/`);
      await expect(
        page.getByText("Checkpoint · question 1 of 3"),
      ).toBeVisible();
    });
  });
}

test("the v1 roadmap redirects to the Foundations overview", async ({
  page,
}) => {
  await page.goto("roadmaps/ai-system-design/");
  await expect(page).toHaveURL(/\/topics\/foundations\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Foundations: how AI apps work.",
  );
});

test("a redirect page still offers a link without scripts", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const response = await page.request.get("topics/rag/");
  const html = await response.text();
  expect(html).toContain('http-equiv="refresh"');
  expect(html).toMatch(
    /href="\/techthrive-learn\/topics\/foundations\/lessons\/rag\/"/,
  );
  await context.close();
});

test("v1 progress carries over as finished Foundations lessons", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem(
        "ttl-learn:progress:v1",
        JSON.stringify({ done: ["rag"] }),
      );
      sessionStorage.setItem("seeded", "1");
    }
  });
  await page.goto("topics/foundations/lessons/");
  const list = page.getByRole("list", { name: "Lessons" });
  await expect(list.getByText("Completed.")).toHaveCount(1);
  expect(
    await page.evaluate(() => localStorage.getItem("ttl-learn:progress:v1")),
  ).toBeNull();
});

test("the overview, course and a lesson have no axe violations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of [
    "topics/foundations/",
    "topics/foundations/lessons/",
    "topics/foundations/lessons/rag/",
    "topics/foundations/lessons/agent-loop/checkpoint/",
  ]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" ")}`,
      ),
      path,
    ).toEqual([]);
  }
});
