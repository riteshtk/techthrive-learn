import { expect, test } from "./fixtures";

// Pages that keep their state in the address read it after mount, then
// write it back. The value asked for is never replaced by the defaults,
// even for a moment, and the #hash stays.

const PAGES = [
  { name: "catalog", path: "topics/", query: "?status=planned" },
  { name: "design lab", path: "topics/ai-agents/lab/", query: "?part=T" },
  {
    name: "threat model",
    path: "topics/ai-agents/threats/",
    query: "?risk=ASI08",
  },
  { name: "governance", path: "topics/ai-agents/governance/", query: "?j=in" },
  { name: "cost model", path: "topics/ai-agents/cost/", query: "?m=opus" },
];

for (const { name, path, query } of PAGES) {
  test(`${name}: keeps ${query} and the hash from the first write`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { written: string[] };
      w.written = [];
      const replace = history.replaceState.bind(history);
      history.replaceState = (data, unused, url) => {
        if (url != null) w.written.push(String(new URL(url, location.href)));
        replace(data, unused, url);
      };
    });
    await page.goto(`${path}${query}#here`);
    const written = () =>
      page.evaluate(() => (window as unknown as { written: string[] }).written);
    await expect.poll(async () => (await written()).length).toBeGreaterThan(0);
    await page.waitForTimeout(300);
    for (const url of await written())
      expect(url).toMatch(new RegExp(`/${path}\\${query}#here$`));
  });
}
