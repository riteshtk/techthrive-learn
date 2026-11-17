# Contributing

Thanks for helping. The most useful contribution is a new topic, and you can
add one without touching any component code.

## Add a topic in five steps

1. **Copy the template.** Copy `content/topics/_template.ts` to
   `content/topics/<your-topic-id>.ts`. Use a short kebab-case id, such as
   `caching` or `load-balancing`.
2. **Fill it in.** Write the title, level, summary, diagram, steps and
   sources. The comments in the template explain each field.
3. **List it in a roadmap.** Add your id to the `topics` list in a file in
   `content/roadmaps/`, in the order a learner should meet it.
4. **Run `npm test`.** It checks your file and names the file and field of
   anything that needs fixing. Run `npm run dev` to see your topic at
   http://localhost:3000/topics/your-topic-id/.
5. **Open a pull request.** Fill in the checklist. A maintainer reviews
   every topic for accuracy before it's merged.

## Content rules

`npm test` and the build enforce these:

| Field               | Rule                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `id`                | kebab-case, the same as the file name; never changes once merged                                   |
| `title`             | at most 60 characters                                                                              |
| `level`             | `basics`, `intermediate` or `advanced`                                                             |
| `minutes`           | whole minutes to work through it, 1–60                                                             |
| `summary`           | one sentence, at most 140 characters                                                               |
| `diagram.nodes`     | grid cells x 0–3, y 0–5, one node per cell; label at most 20 characters, no word over 10           |
| `nodes[].note`      | one sentence, at most 90 characters, on what the part does (shown when a learner clicks the block) |
| `nodes[].icon`      | optional; one of the icons listed in the template                                                  |
| `diagram.edges`     | join two node ids; a line may not pass through a third node                                        |
| `edges[].flows`     | optional; what moves along the line, at most 40 characters (shown on hover)                        |
| `steps`             | 3 to 9; each `text` is one sentence of at most 140 characters                                      |
| `steps[].title`     | a short name for the step, at most 24 characters, no full stop (it names the Next button)          |
| `steps[].highlight` | node and edge ids from this topic                                                                  |
| `sources`           | at least one outside Tech & Thrive; `read` is the date you checked it (YYYY-MM-DD)                 |
| `video`             | optional; an 11-character YouTube id and the video's title                                         |

Every node and edge id must be unique within the topic. An edge's label is a
small pill drawn beside its line, so it needs room on one side: leave a gap or
an empty cell next to the line.

Writing tips:

- One idea per step. Say what the lit-up part is doing, in plain words.
- Prefer primary sources: papers, official docs and engineering posts.
- Keep the diagram small. Five to nine boxes is usually enough.

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
motion, 4.5:1 contrast).

## Content agreement

Topic text and diagrams in `content/` are © Tech & Thrive, all rights
reserved (see `content/LICENSE`). By opening a pull request that changes
`content/`, you agree that Tech & Thrive may publish and edit your
contribution. Code is under the MIT licence.

## Code of conduct

Everyone taking part agrees to follow our
[Code of Conduct](CODE_OF_CONDUCT.md).
