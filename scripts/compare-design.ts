// Side-by-side sheets of the app against the design export (PRD P19), for
// review by eye; local only, as the export is never committed. Build
// first (BASE_PATH=/techthrive-learn npm run build), then:
//
//   DESIGN_DIR=/Users/Shared/ttl/design-v2 npm run compare:design
//
// Writes compare/<screen>-<theme>.png: the design on the left, the app on
// the right, both at 1440 px. Light-theme 3D blocks are expected to
// differ (decision 20: blocks use the light tokens).
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "@playwright/test";
import { CLOCK, SCREENS } from "../tests/visual/screens";

const design = process.env.DESIGN_DIR;
if (!design || !existsSync(join(design, "shots"))) {
  console.error(
    "Set DESIGN_DIR to the design export (it has a shots/ folder).",
  );
  process.exit(1);
}
const out = resolve("compare");
mkdirSync(out, { recursive: true });
const PORT = 4598;
// The sheet page can't load file:// images from the app's origin.
const dataUrl = (file: string) =>
  `data:image/png;base64,${readFileSync(file).toString("base64")}`;
const base = `http://localhost:${PORT}/techthrive-learn/`;

const server = spawn("node", ["scripts/serve-out.ts"], {
  env: { ...process.env, BASE_PATH: "/techthrive-learn", PORT: String(PORT) },
  stdio: "ignore",
});
await new Promise((r) => setTimeout(r, 800));

const browser = await chromium.launch();
try {
  for (const s of SCREENS) {
    if (!s.design) continue;
    for (const theme of ["dark", "light"] as const) {
      const shot = join(
        design,
        "shots",
        `${s.design}${theme === "light" ? "--light" : ""}.png`,
      );
      if (!existsSync(shot)) continue;
      const page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
      });
      await page.clock.setFixedTime(CLOCK);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(
        (t) => localStorage.setItem("ttl-learn:theme:v1", t),
        theme,
      );
      await page.goto(base + s.path.replace(/^\.\//, ""));
      await page.waitForLoadState("networkidle");
      const app = join(out, `.app-${s.name}-${theme}.png`);
      await page.screenshot({ path: app, fullPage: true });
      await page.setContent(
        `<body style="margin:0;display:flex;gap:16px;background:#777;font:600 14px system-ui">
          <figure style="margin:0;width:1440px"><figcaption style="padding:6px">Design · ${s.design}</figcaption><img src="${dataUrl(shot)}" style="width:1440px"></figure>
          <figure style="margin:0;width:1440px"><figcaption style="padding:6px">App · ${s.path}</figcaption><img src="${dataUrl(app)}" style="width:1440px"></figure>
        </body>`,
      );
      await page.setViewportSize({ width: 2896, height: 900 });
      await page.waitForLoadState("load");
      await page.screenshot({
        path: join(out, `${s.name}-${theme}.png`),
        fullPage: true,
      });
      await page.close();
      console.log(`compare/${s.name}-${theme}.png`);
    }
  }
} finally {
  await browser.close();
  server.kill();
}
