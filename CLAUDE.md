# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`docs/PRD.md` is the source of truth for scope, acceptance criteria (F1–F11), content rules and required checks.

## Commands

```bash
npm run dev            # local dev server (no base path)
npm run build          # static export to out/
npm run lint           # ESLint (Next core-web-vitals + TypeScript + Prettier)
npm run format         # Prettier write; format:check to verify
npm run typecheck      # next typegen && tsc --noEmit
npm test               # content check + typecheck + Vitest (no browsers; must stay under 30 s)
npm run check:content  # just the content rules (also runs before every build)
npm run test:e2e       # Playwright (Chromium at 360 px and 1280 px)

npx vitest run tests/unit/engine.test.ts      # one unit test file
npx vitest run -t "restarts from step 1"      # tests matching a name
npx playwright test tests/e2e/flow.spec.ts --project=chromium-360
```

- `tsc` alone fails on a fresh checkout. `app/layout.tsx` uses the global `LayoutProps` type that `next typegen` generates, so always go through `npm run typecheck`.
- Use Node 26 LTS (`.nvmrc`).

## Hard constraints

- **Static export only** (`output: 'export'`, `trailingSlash: true`, unoptimised images). Don't use anything that needs a server: route handlers that read the request, cookies, rewrites/redirects/headers, proxy, server actions, ISR.
- **Don't enable `cacheComponents` or `partialPrefetching`.** create-next-app turns both on, but Cache Components rejects `dynamicParams`. Dynamic routes rely on `generateStaticParams` plus `dynamicParams = false`, so unknown ids get the 404.
- **Base path:** `BASE_PATH` (e.g. `/techthrive-learn`) is set by the deploy workflow and empty locally. `next/link` adds it automatically. Raw links, images and share URLs must go through the single path helper (`lib/paths.ts`), never hand-built strings.
- **Players read `?step` only after mount**, so pages stay static.
- **No analytics, cookies or third-party scripts.** Fonts are self-hosted via `next/font`. Keep page JS under 150 KB gzipped, so don't add an animation library; transitions are CSS.
- **No `any` in `player/`.** TypeScript is strict with `noUncheckedIndexedAccess`.
- **Topic ids never change once merged.** They key learners' stored progress.
- **`docs/` is excluded from Prettier.** Don't reformat the PRD.

## Git workflow

`main` holds only the scaffold commit. All v1 work goes on `feat/learn-v1` and lands as one pull request. Don't commit to `main`, and don't create or push anything on GitHub without asking the user first.
