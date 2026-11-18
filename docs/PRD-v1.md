# Tech & Thrive Learn — PRD

Version 1 · 17 Nov 2026 (design revision 17 Nov 2026) · Owner: Tech & Thrive

Tech & Thrive Learn is a free, open-source learning site: pick a roadmap, open a topic, and the idea explains itself as an animated diagram, one step at a time.

## Decisions

- **Name and repo:** Tech & Thrive Learn, public repo `techthrive-learn`, hosted on GitHub Pages.
- **Stack:** Next.js with static export, TypeScript (strict).
- **First roadmap:** AI System Design: How an LLM answers, RAG, The agent loop.
- **Licences:** MIT for the code; topic text and diagrams in `content/` all rights reserved by Tech & Thrive (`content/LICENSE`).
- **Analytics:** none. No cookies, no third-party scripts.
- **Theme:** Momentum (F10): dark by default, light when the device asks, and a toggle that remembers the learner's choice.

## Problem and audience

System design and AI concepts are about parts moving in order, but learners mostly meet them as static text or as videos they can't pause on one step.

**Who it's for:** students and early-career engineers preparing for system design interviews, mostly in India, reading English, often on a phone.

**What's missing:** one place where a roadmap leads to topics, and each topic explains itself step by step, with the diagram moving as you read, at your own pace, on a phone, for free.

## Goals for version 1

1. A learner reaches step 1 of any topic within 2 taps of the home page, with no account.
2. Every topic explains itself as an animated diagram that can be stepped forwards and back, with one sentence per step.
3. Adding a topic means adding one content file. No component code changes.
4. Production quality: typed, tested, accessible, fast on a mid-range phone, deployed automatically from main.
5. Open source, so viewers can fork it and open their first pull request.

**Not in version 1:** accounts or synced progress, any backend or database, video embeds, comments, quizzes, an AI tutor, languages other than English.

## User stories

| # | As a… | I want to… | So that… |
| --- | --- | --- | --- |
| L1 | learner | see the roadmaps on the home page | I can pick a path that matches my goal |
| L2 | learner | see a roadmap's topics in order, basics to advanced, with their level | I know where to start and what comes next |
| L3 | learner | step through a topic's diagram with Next and Back | I learn at my own pace |
| L4 | learner | press Play and watch the steps run | I can follow along without tapping |
| L5 | learner | read one plain sentence for each step | I understand what the moving part is doing |
| L6 | learner | mark a topic done and see my progress | I can come back and carry on |
| L7 | learner | share a link that opens a topic at a given step | I can send a friend exactly what I mean |
| L8 | learner | use it with only a keyboard, or with reduced motion | it works whatever my setup |
| L9 | learner | find the video and sources for a topic | I can go deeper and trust what I read |
| L10 | learner | search every topic, step and part with Cmd+K | I can jump straight to what I need |
| L11 | learner | click a part of the diagram for a note, and hover a line to see what flows | I understand each piece, not just the step |
| L12 | learner | see every step on a timeline and jump to any of them | I can revisit one step without stepping through the rest |
| L13 | learner | open a menu of all roadmaps and topics with my progress | I always know where I am and what's left |
| C1 | contributor | add a topic by writing one file | I don't have to understand the whole codebase |
| C2 | contributor | get a clear error if my topic file is wrong | I can fix it before anyone reviews it |
| C3 | contributor | follow a short guide and a good first issue | my first pull request is easy to get right |
| O1 | owner | review every new topic in a pull request | nothing inaccurate reaches learners |
| O2 | owner | have the site deploy itself when I merge | publishing takes no extra work |
| O3 | owner | link a topic from a video's description | each video sends viewers to the matching topic |

## Version 1 features and acceptance criteria

| ID | Feature | Acceptance criteria |
| --- | --- | --- |
| F1 | Home: roadmaps | Lists every roadmap from the content files with title, one-line goal, topic count and the learner's progress. Works at 360 px wide. |
| F2 | Roadmap page | Topics in order, each with level (Basics, Intermediate, Advanced), a one-line summary and a done tick. "Continue" opens the first topic not yet done; when all are done it becomes "Start again" and opens topic 1. |
| F3 | Diagram player | Draws the topic's diagram as SVG from the layout rules below, on a large stage card with a faint dot grid. Each node is a raised block with depth, its label and a small icon; edge labels are pills. On every step an ember packet travels along each active edge, then rests, on a loop. A legend explains active, moving and waiting parts; Replay (from step 1), Play/Pause and Full screen sit in the stage corner (Full screen only where the browser supports it). A fixed bottom bar holds Back and a large Next button named after the next step ("Next: Pick one token"). Play is never automatic: it runs the steps, each held for 2 s plus 45 ms per character of its sentence, and stops on the last step; Play on the last step restarts from step 1. Next, Back or hiding the tab pauses it. Each step highlights its blocks and arrows and dims the rest, moving smoothly (about 400 ms). |
| F4 | Step captions | One sentence per step, at least 18 px, under the diagram, read out by screen readers (`aria-live="polite"`). Each step also has a short title, used on the Next button and the timeline. A step counter ("3 of 7") beside a timeline of every step: each is a button that jumps to that step, and the current one is marked. All step sentences are also in the page's HTML, so they work without JavaScript and for search. |
| F5 | Keyboard and motion | When the player has focus, Right and Left step and Space plays or pauses; a focused button, block or line keeps its own Space. Every block and line is focusable, and Enter or Space shows its note; Escape hides it. Focus is always visible. With reduced motion on, steps change without animation and packets sit still. |
| F6 | Deep links | `?step=3` opens step 3 (steps count from 1). A missing or invalid step opens step 1 and the address is corrected without a new history entry. The address updates as you step, the same way. An unknown topic shows the 404 page. |
| F7 | Progress | On the last step the Next button becomes "Mark as done", which returns to the roadmap, with Undo. Stored in the browser under one versioned key; unknown topic ids are ignored. If storage fails, progress lasts for the visit and nothing breaks. Progress renders after load, in a slot that doesn't shift the layout. "Reset progress" on the home page clears it. Topic ids never change once merged. |
| F8 | Sources and video | Each topic page lists its sources (title, link, date read) and, if one exists, a link (never an embed) to the Tech & Thrive video about it. |
| F9 | Content checks | The build and `npm test` fail with a clear message naming the file and field if: a field is missing or too long; an id repeats across nodes and edges; two nodes share a cell; an edge crosses a third node; a step highlights an unknown id; a roadmap lists a topic that doesn't exist; or a topic has no source outside Tech & Thrive. |
| F10 | Brand and theme (Momentum) | Colours: ink `#070A12`, porcelain `#F4F1EA`, ember `#FF5A1F` for the current step only. Fonts: Inter and JetBrains Mono. Dark by default, light when the device asks; a toggle in the header switches theme, the choice is stored in the browser and applied before the page paints. The logo comes from the brand kit's files, used as supplied, on-dark or on-light to match the theme. Text contrast at least 4.5:1, dimmed labels included (dim by colour, never opacity). In light mode ember never carries text, and the current step also gets a heavier ink outline. |
| F11 | Pages that always work | A 404 page that links home. Every page has a title and description; the site has one 1200×630 share image. Every page is pre-built HTML. |
| F12 | App shell | A sticky header on every page: a menu button, the logo, search and the theme toggle. The menu opens a drawer listing each roadmap's topics with their level, a done tick, a per-roadmap count ("1/3") and overall progress; the current topic is marked. Search opens with Cmd+K, Ctrl+K or "/", looks through topic titles, summaries, block labels and step titles and sentences, and opens the matching step directly. Drawer and search are modal dialogs: focus stays inside, Escape closes them. |
| F13 | Lesson header | Each topic page starts with a breadcrumb (roadmap, "Topic 2 of 3"), the title, and chips for minutes, level and step count. The topic summary follows the player. |
| F14 | Inspect the diagram | Clicking a block shows a one-line note on what it does, next to it, until clicked again. Hovering or focusing a line shows what flows along it, beside the line so it never covers the blocks it joins. Both are announced by screen readers. |

**Floor:** if time runs short, v1 still ships F1–F7, F9, the required checks and the deploy. F8 and the 404 page may move to v1.1.

## Content model

All content lives in typed files under `content/`: one file per roadmap, one per topic. Pages are generated from them at build time.

**Roadmap** (`content/roadmaps/<id>.ts`): `id`, `title`, `goal` (one line), `topics` (ordered topic ids).

**Topic** (`content/topics/<id>.ts`):

| Field | Type | Rule |
| --- | --- | --- |
| `id` | text | kebab-case, matches the file name |
| `title` | text | at most 60 characters |
| `level` | `basics` \| `intermediate` \| `advanced` | |
| `summary` | text | one sentence, at most 140 characters |
| `minutes` | number | whole minutes to work through the topic, 1–60 |
| `diagram.nodes` | `{id, label, note, icon?, x, y}[]` | grid cells, x 0–3, y 0–5, one node per cell; label at most 20 characters, no word over 10; `note` one sentence, at most 90 characters; `icon` one of a fixed set |
| `diagram.edges` | `{id, from, to, label?, flows?}[]` | `from`/`to` are node ids; `flows` says what moves along the edge, at most 40 characters |
| `steps` | `{title, text, highlight}[]` | 3 to 9 steps; `title` a short name, at most 24 characters, no full stop; `text` one sentence, at most 140 characters; `highlight` lists node and edge ids |
| `sources` | `{title, url, read}[]` | at least one outside Tech & Thrive; `read` is the date checked |
| `video` | `{youtubeId, title}` | optional |

**Layout rules:** at 360 px wide, blocks are at least 72 px wide and labels at least 12 px, in at most two lines. Edges are straight lines clipped at block borders. An edge's label is a pill beside its line, never on it, on whichever side has room; the content check fails if neither side does. Two edges running both ways between the same nodes are offset to either side. On wide screens the same grid is drawn wider, so the diagram fills most of the stage while the caption and controls stay on screen; the content check verifies both layouts.

## First roadmap: AI System Design

Goal line: "How AI apps actually work, from one prompt to an agent that uses tools."

### Topic 1 · How an LLM answers (basics) · video `ZwKOIoqYj5c`

Diagram: Prompt → Tokenizer → Model → Next token → (back to Model) → Answer.

1. You send a prompt, as plain text.
2. A tokenizer splits the text into tokens: whole words, parts of words or punctuation.
3. The model reads every token so far and scores each possible next token.
4. The scores become probabilities and one token is drawn; a lower temperature makes the likeliest tokens win more often.
5. That token is added to the input, and the model runs again.
6. This repeats until the model produces a stop token or reaches a length limit.
7. The tokens are turned back into text, and that's the answer.

Sources: Attention Is All You Need (https://arxiv.org/abs/1706.03762); Hugging Face, generation strategies (https://huggingface.co/docs/transformers/generation_strategies); Claude glossary (https://docs.claude.com/en/docs/about-claude/glossary).

### Topic 2 · RAG: answers from your documents (intermediate) · video `6bz4-qeIEAc`

Diagram: Documents → Chunks → Embeddings → Vector store; Question → (embedded) → Vector store → Top chunks → Prompt → Model → Answer.

1. Before any question, your documents are split into chunks.
2. Each chunk becomes an embedding: a list of numbers that captures its meaning.
3. The embeddings are saved in a vector store.
4. A question arrives and is turned into an embedding the same way.
5. The store returns the chunks closest in meaning to the question.
6. Those chunks go into the prompt, next to the question.
7. The model answers from those chunks and, if asked, cites them, but it can still get a fact wrong.

Sources: Lewis et al., Retrieval-Augmented Generation (https://arxiv.org/abs/2005.11401); Anthropic, Contextual Retrieval (https://www.anthropic.com/news/contextual-retrieval); Azure AI Search, hybrid search (https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview).

### Topic 3 · The agent loop (advanced) · video `OCmZVrivYUY`

Diagram: Goal → Model → Permission check → Tool → (result back to Model); Model → Answer.

1. A goal comes in, in plain words.
2. The model decides the next action: answer now, or call a tool.
3. It asks for a tool call, with the arguments it wants.
4. The app running the agent checks the call is allowed.
5. The tool runs, and its result goes back to the model.
6. The model decides again, now with more to go on.
7. When the model stops asking for tools, or a step limit is hit, the loop ends.

Sources: Anthropic, Building effective agents (https://www.anthropic.com/engineering/building-effective-agents); How Claude Code works (https://code.claude.com/docs/en/how-claude-code-works).

## Architecture

A static site: content files are checked and built into plain pages, and GitHub Pages serves them. No server, database or login.

| Part | What it does |
| --- | --- |
| `content/` | Roadmap and topic files, and the schema that checks them (F9) |
| `player/engine.ts` | A small, pure state machine: current step, next, back, play, pause, deep links. No drawing code |
| `player/geometry.ts` | Lays out blocks from grid cells, clips edges, places label pills; shared with the content checks |
| `player/Diagram.tsx` | Draws the stage as SVG: raised blocks, pills and packets; dims everything outside the current step's highlight with a ~400 ms CSS transition, none with reduced motion |
| `components/AppShell.tsx` | Header, course drawer, search and theme toggle |
| `app/` | Home, roadmap and topic pages, all generated at build time (static export); a small browser-storage hook for progress |
| `tests/` | Unit tests (engine, schema); Playwright click-through and axe checks |
| `.github/workflows/` | `ci.yml` runs the checks on pull requests; `deploy.yml` builds and deploys main to GitHub Pages |

**Static export on GitHub Pages:** `output: 'export'`, `trailingSlash: true`, unoptimised images. `basePath` comes from `BASE_PATH`, set by the deploy workflow from GitHub Pages' base path and empty locally. Raw links, images and share URLs go through one helper. The player reads `?step` from the address after the page loads, so pages stay static. The end-to-end test serves the built `out/` folder under the same base path. Confirm these details against the current Next.js and GitHub docs.

## Quality bar

| Area | Target |
| --- | --- |
| Speed | LCP under 2.5 s and CLS under 0.1 on a mid-range phone over 4G; JavaScript under 150 KB compressed per page |
| Accessibility | WCAG 2.2 AA: contrast ≥ 4.5:1, keyboard for every control, visible focus, step sentences announced, reduced motion respected |
| Phones | Usable from 360 px wide; diagrams scale to fit and never scroll sideways |
| Privacy | No cookies, trackers or third-party scripts |
| Security | Static site, no secrets; dependencies scanned |
| Browsers | Last two versions of Chrome, Safari (incl. iPhone), Firefox, Edge |
| Code | TypeScript strict, linter, formatter; no `any` in the player |

## Testing and release

| Check | Required to merge? |
| --- | --- |
| Typecheck and lint | Required |
| Content validation (F9) | Required |
| Unit tests (Vitest): next, back, play timing, play stops and restarts, deep links, invalid steps; search; theme contrast in both themes | Required |
| Build (static export) | Required |
| Playwright (Chromium) at 360 px and 1280 px: home → roadmap → each topic → last step → mark done; search, drawer, theme toggle, notes, timeline; caption and controls on one screen at 360 × 740 | Required |
| axe: zero serious or critical issues on home, roadmap and topic pages | Required |
| Playwright in WebKit | Advisory |
| Lighthouse CI (mobile preset, median of 3) | Advisory |
| `npm audit` (runtime deps, high severity) | Advisory |

**Branch rules:** main is protected; every change arrives as a pull request with green checks. Merging to main builds and deploys to GitHub Pages.

**Milestones:** v1 (this build); v1.1 a topic per new video, per-topic share images, custom domain; v2 an AI tutor per topic; v3 optional accounts and search.

## Open source

- README: what it is, the live link, how to run locally (three commands), how to add a topic.
- CONTRIBUTING.md: add a topic in five steps (copy the template, fill it, list it in a roadmap, `npm test`, open a pull request); content rules.
- Issue templates: "Suggest a topic", "Report a bug". Labels: `good first issue`, `new topic`, `bug`.
- Issue #2: "Add a topic: caching", `good first issue`.
- Pull request template with a checklist and the content agreement (Tech & Thrive may publish and edit contributed topics).
- `.nvmrc` pins the Node LTS; `npm test` = typecheck + content check + unit tests, no browsers, under 30 s.
- Code of conduct: Contributor Covenant.
