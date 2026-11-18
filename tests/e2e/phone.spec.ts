import { getLessons, getTools, getTopics } from "@/content";
import { expect, test } from "./fixtures";

// The final phone pass (PRD P18): every page at 360 px, against the
// approved stills' rules. No page scrolls sideways, and no control is cut
// off at the edge unless it sits in a strip that scrolls on purpose (the
// topic bar's sections, hop chips, wide tables).

const ROUTES = [
  "./",
  "topics/",
  "review/",
  "no/such/page/",
  ...getTopics()
    .filter((t) => t.status === "live")
    .flatMap((t) => [
      `topics/${t.id}/`,
      `topics/${t.id}/lessons/`,
      `topics/${t.id}/sources/`,
      ...(t.tabs.includes("cost") ? [`topics/${t.id}/cost/`] : []),
      ...getTools(t.id)
        .filter((x) => x.kind !== "cards")
        .map((x) => `topics/${t.id}/${x.kind}/`),
      ...getLessons(t.id).flatMap((l) => [
        `topics/${t.id}/lessons/${l.id}/`,
        `topics/${t.id}/lessons/${l.id}/checkpoint/`,
      ]),
    ]),
];

test.describe("at phone width", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) > 400, "phones only");

  for (const path of ROUTES)
    test(`${path} fits the screen`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      await expect(page.locator("main").first()).toBeVisible();
      const report = await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        const scrolls = (el: Element | null): boolean => {
          for (let e = el?.parentElement; e; e = e.parentElement) {
            const s = getComputedStyle(e);
            if (
              /(auto|scroll|hidden)/.test(s.overflowX) &&
              e.scrollWidth > e.clientWidth + 1
            )
              return true;
          }
          return false;
        };
        const clipped = [
          ...document.querySelectorAll<HTMLElement>(
            "a, button, input, select, [role='button'], [role='tab']",
          ),
        ]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return false;
            if (getComputedStyle(el).visibility === "hidden") return false;
            if (el.closest("svg")) return false; // diagram parts pan and zoom
            return (r.left < -1 || r.right > width + 1) && !scrolls(el);
          })
          .map(
            (el) =>
              `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40)}"`,
          );
        return {
          overflow: document.documentElement.scrollWidth - width,
          clipped,
        };
      });
      expect(report.overflow, "sideways scroll").toBeLessThanOrEqual(0);
      expect(report.clipped, "controls cut off").toEqual([]);
    });
});
