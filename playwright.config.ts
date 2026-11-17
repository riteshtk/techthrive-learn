import { defineConfig, devices } from "@playwright/test";

// Build and serve under the same base path GitHub Pages uses.
const BASE_PATH = "/techthrive-learn";
const PORT = Number(process.env.E2E_PORT ?? 4517);
const baseURL = `http://localhost:${PORT}${BASE_PATH}/`;

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL },
  webServer: {
    command: "npm run build && node scripts/serve-out.ts",
    url: baseURL,
    env: { ...process.env, BASE_PATH, PORT: String(PORT) } as Record<
      string,
      string
    >,
    stdout: "pipe",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    {
      name: "chromium-360",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 360, height: 780 },
      },
    },
    {
      name: "chromium-1280",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
});
