import { expect, test as base } from "@playwright/test";
import { THEME_KEY, type Theme } from "../../lib/theme";

// page.goto waits for React to hydrate (the theme toggle gets its real name
// then), so tests never act before click and key handlers are attached.
// `theme` stores a theme choice before any page loads: the app ignores the
// device's colour scheme, so emulating one doesn't switch it.
export const test = base.extend<{ theme: Theme | undefined }>({
  theme: [undefined, { option: true }],
  page: async ({ page, javaScriptEnabled, theme }, provide) => {
    if (theme) {
      await page.addInitScript(
        ([key, value]) => {
          try {
            if (!sessionStorage.getItem("e2e-theme-set")) {
              localStorage.setItem(key, value);
              sessionStorage.setItem("e2e-theme-set", "1");
            }
          } catch {
            // Storage blocked in this test: the page stays dark.
          }
        },
        [THEME_KEY, theme] as const,
      );
    }
    const goto = page.goto.bind(page);
    page.goto = async (url, options) => {
      const response = await goto(url, options);
      if (javaScriptEnabled) {
        await expect(page.getByTestId("theme-toggle")).toHaveAccessibleName(
          /^Switch to/,
        );
      }
      return response;
    };
    await provide(page);
  },
});

export { expect };
export type { Page } from "@playwright/test";
