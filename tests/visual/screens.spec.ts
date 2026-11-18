import { expect, test } from "@playwright/test";
import { CLOCK, SCREENS } from "./screens";

// Visual regression (PRD P19): every screen at 1440 and 360 px, dark and
// light. Baselines are Linux renders from CI (the CI workflow run with
// baselines=true), never from a Mac, so this suite is skipped on macOS.

test.skip(
  process.platform === "darwin",
  "baselines are Linux renders made by the CI workflow with baselines=true",
);

for (const theme of ["dark", "light"] as const)
  for (const s of SCREENS)
    test(`${s.name} (${theme})`, async ({ page }) => {
      await page.clock.setFixedTime(CLOCK);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(
        (t) => localStorage.setItem("ttl-learn:theme:v1", t),
        theme,
      );
      await page.goto(s.path);
      await page.waitForLoadState("networkidle");
      // A lesson link's ?step applies after mount, once progress loads.
      const step = new URL(s.path, "http://x").searchParams.get("step");
      if (step)
        await expect(
          page
            .getByRole("tabpanel")
            .getByText(new RegExp(`^Step ${step} / \\d+$`)),
        ).toBeVisible();
      await expect(page).toHaveScreenshot(`${s.name}-${theme}.png`, {
        fullPage: true,
        animations: "disabled",
        maxDiffPixelRatio: 0.002,
      });
    });
