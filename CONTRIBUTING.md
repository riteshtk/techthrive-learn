# Contributing

Thanks for helping. The most useful contribution is a new lesson or topic,
and you can add one without touching component code: content is typed data
under `content/`, checked by `npm test`.

## How a topic is laid out

```
content/
  facts/<topic>.ts                 the facts register: every figure, with its source
  topics/<topic>/
    topic.ts                       title, level, lessons (outlines), overview
    diagrams/<diagram>.ts          the system's parts in 3D and 2D
    lessons/<lesson>.ts            steps: text, hops, metrics, narration line
    checkpoints/<lesson>.ts        three questions per lesson
    tools/<kind>.ts                optional: threats, governance, lab, sheets, cards
```

The Foundations topic (`content/topics/foundations/`) is the smallest
complete example: copy its shape. Its lessons show every step field in use.

## Add a lesson in six steps

1. **Outline it** in the topic's `lessons` list (`topic.ts`): a kebab-case
   `id`, title, one-line summary and minutes. Lessons without a file show
   as "Coming".
2. **Draw the system** in `diagrams/`, or reuse the topic's diagram. Node
   ids are single capital letters; 2D boxes sit on a grid; 3D positions are
   the same grid projected isometrically (see `foundations/diagrams/`).
3. **Write the steps** in `lessons/<id>.ts`: 3 to 12 steps, each with a
   short rail label, a title, one to four short paragraphs, a callout, the
   hops the request makes, and a one-sentence narration `caption`.
4. **Source every figure.** Any number on screen must appear in the value
   of a fact in `content/facts/<topic>.ts`, with the primary source's link
   and the date you read it. The content check names any figure that
   isn't. Teaching assumptions are allowed, labelled as such.
5. **Add the checkpoint**: three questions in `checkpoints/<id>.ts`, each
   with four options, feedback for each, and the facts it relies on. A
   maintainer checks them against the sources before setting `approved`.
6. **Run `npm test`**, then `npm run dev` to step through it at
   http://localhost:3000/topics/<topic>/lessons/<id>/, at phone width too.

Narration is recorded by Tech & Thrive from your `caption` lines; until the
audio is in `public/audio/<topic>/<lesson>/`, the lesson shows the line as
text. `npm run check:content` lists missing recordings.

## Content rules

`npm test` and the build enforce these, naming the file and field of
anything that fails:

- Ids are kebab-case and **never change once merged**: they key learners'
  stored progress. Old topic ids are reserved (`content/types.ts`).
- Every figure on screen is in the facts register for that topic.
- Facts have a primary source (`url`) unless they are a labelled teaching
  assumption or derived from other facts, and a `recheckBy` date.
- Hops only run along the diagram's edges, between parts already built.
- Checkpoints have exactly three questions of four options.

Writing tips: one idea per step; plain words; prefer papers, official docs
and engineering posts; keep diagrams to five to thirteen parts.

## Code changes

Run the checks before opening a pull request:

```bash
npm test          # content check, typecheck and unit tests
npm run lint
npm run format
npm run test:e2e  # Playwright and axe; installs browsers on first run with npx playwright install
```

Pages must stay static (no server features), fast (under 150 KB of
JavaScript per page) and accessible (keyboard, screen readers, reduced
motion, 4.5:1 contrast, zero axe violations).

## Content agreement

Topic text and diagrams in `content/` are © Tech & Thrive, all rights
reserved (see `content/LICENSE`). By opening a pull request that changes
`content/`, you agree that Tech & Thrive may publish and edit your
contribution. Code is under the MIT licence.

## Code of conduct

Everyone taking part agrees to follow our
[Code of Conduct](CODE_OF_CONDUCT.md).
