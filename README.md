# Tech & Thrive Learn

Pick a roadmap, open a topic, and the idea explains itself as an animated
diagram, one step at a time. Free, open source, no account, no tracking.

**Live site:** https://riteshtk.github.io/techthrive-learn/

The first roadmap, **AI System Design**, covers how an LLM answers, RAG, and
the agent loop. Each topic has a diagram you can step through with Next and
Back (or ← and →), play at your own pace, and link to at any step with
`?step=3`.

## Run it locally

You need Node.js 26 (see `.nvmrc`).

```bash
git clone https://github.com/riteshtk/techthrive-learn.git
cd techthrive-learn && npm install
npm run dev
```

Then open http://localhost:3000.

## Add a topic

A topic is one file in `content/topics/`. Copy
`content/topics/_template.ts`, fill it in, list its id in a roadmap in
`content/roadmaps/`, and run `npm test`. If anything is wrong, it tells you
which file and field to fix. [CONTRIBUTING.md](CONTRIBUTING.md) has the five
steps and the content rules.

## Checks

```bash
npm test            # content check, typecheck and unit tests (no browser)
npm run lint
npm run test:e2e    # Playwright click-through and axe checks
```

Every pull request runs these in CI. Merging to `main` deploys the site to
GitHub Pages.

## Licence

The code is [MIT](LICENSE). The topic text and diagrams in `content/` are
© Tech & Thrive, all rights reserved ([content/LICENSE](content/LICENSE)).
