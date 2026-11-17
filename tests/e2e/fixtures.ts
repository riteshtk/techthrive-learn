import { expect, test as base } from "@playwright/test";

// page.goto waits for React to hydrate (the theme toggle gets its real name
// then), so tests never act before click and key handlers are attached.
export const test = base.extend({
  page: async ({ page, javaScriptEnabled }, provide) => {
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
