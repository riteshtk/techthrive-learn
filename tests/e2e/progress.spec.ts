import { expect, test } from "@playwright/test";

const KEY = "ttl-learn:progress:v1";

test.describe("progress", () => {
  test("Mark as done appears only on the last step", async ({ page }) => {
    await page.goto("topics/rag/?step=6");
    await expect(
      page.getByRole("button", { name: "Mark as done" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Next" }).click();
    await expect(
      page.getByRole("button", { name: "Mark as done" }),
    ).toBeVisible();
  });

  test("Mark as done returns to the roadmap, with Undo", async ({ page }) => {
    await page.goto("topics/rag/?step=7");
    await page.getByRole("button", { name: "Mark as done" }).click();
    await expect(page).toHaveURL(/\/roadmaps\/ai-system-design\/$/);
    await expect(page.getByTestId("done-rag")).toHaveText("✓ Done");
    const toast = page.getByTestId("undo-toast");
    await expect(toast).toContainText(
      "Marked “RAG: answers from your documents” as done.",
    );
    await toast.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("done-rag")).toHaveText("");
    await expect(toast).toContainText("no longer marked as done");
    expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe(
      '{"done":[]}',
    );
  });

  test("the Undo notice is not replayed on reload", async ({ page }) => {
    await page.goto("topics/rag/?step=7");
    await page.getByRole("button", { name: "Mark as done" }).click();
    await expect(page.getByTestId("undo-toast")).toContainText("as done");
    await page.reload();
    await expect(page.getByTestId("done-rag")).toHaveText("✓ Done");
    await expect(page.getByTestId("undo-toast")).toHaveText("");
  });

  test("progress survives a new visit", async ({ page }) => {
    await page.goto("topics/agent-loop/?step=7");
    await page.getByRole("button", { name: "Mark as done" }).click();
    await expect(page.getByTestId("done-agent-loop")).toHaveText("✓ Done");
    await page.goto("./");
    await expect(page.getByTestId("progress-count")).toHaveText("1 of 3 done");
  });

  test("Reset progress clears it after confirming", async ({ page }) => {
    await page.addInitScript((k) => {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem(
          k,
          JSON.stringify({ done: ["rag", "agent-loop"] }),
        );
        sessionStorage.setItem("seeded", "1");
      }
    }, KEY);
    await page.goto("./");
    await expect(page.getByTestId("progress-count")).toHaveText("2 of 3 done");
    await page.getByRole("button", { name: "Reset progress" }).click();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByTestId("progress-count")).toHaveText("2 of 3 done");
    await page.getByRole("button", { name: "Reset progress" }).click();
    await expect(
      page.getByRole("button", { name: "Yes, reset" }),
    ).toBeFocused();
    await page.getByRole("button", { name: "Yes, reset" }).click();
    await expect(page.getByTestId("progress-count")).toHaveText("0 of 3 done");
    await expect(page.getByText("Progress reset.")).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("progress-count")).toHaveText("0 of 3 done");
  });

  test("marking done works even when storage is blocked", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("SecurityError");
        },
      });
    });
    await page.goto("topics/rag/?step=7");
    await page.getByRole("button", { name: "Mark as done" }).click();
    await expect(page.getByTestId("done-rag")).toHaveText("✓ Done");
  });
});
