# Tech & Thrive Learn v2 — Product requirements

18 Nov 2026 · Tech & Thrive · approved 18 Nov 2026, every default accepted

v2 rebuilds Tech & Thrive Learn to the creator's Claude Design canvas (25 screens) as a real product in three phases. Each phase is built on camera with Claude Code and becomes a long video. The name, the repo and the live URL stay. v1's requirements are kept in [PRD-v1.md](PRD-v1.md).

| | v1 (live since 17 Nov 2026) | v2 |
| --- | --- | --- |
| Content | 3 topics in one roadmap | Topics with 10-lesson courses; Production AI agents and Payments platform are designed |
| Lesson | A 2D diagram you step through | A 3D or 2D diagram that grows each step, a request hopping between parts, a sandbox, sources, narration |
| Accounts | None; progress stays in the browser | Phase 2: sign-in and synced progress. Phase 3: companies, teams, roles |
| Hosting | GitHub Pages | Pages in phase 1; Cloudflare and Supabase from phase 2 |
| Tools | None | Cost model, design lab, threat model, governance, cheatsheets, review cards, mock interview |
| Analytics | None | Phase 3 only: first-party learning events for company dashboards, with a privacy notice |

## Where the detail lives

The design is the spec. Its export and five build specs live outside the repo and are never committed:

| Path | What it holds |
| --- | --- |
| `/Users/Shared/ttl/design-v2/src/project/*.dc.html` | Each screen's source. Serve with `python3 serve.py 0` in `design-v2` and open `/project/<Screen>.dc.html` |
| `/Users/Shared/ttl/design-v2/shots/` | 117 screenshots at 2x: every screen and every state (`<Screen>--<state>.png`) |
| `/Users/Shared/ttl/design-v2/spec/01-design-system-and-learner.md` | Tokens, about 45 components, Home, Catalog, Paths, Skills, Certify |
| `/Users/Shared/ttl/design-v2/spec/02-admin.md` | Analytics, people, studio, content health, settings; the data model and access rules |
| `/Users/Shared/ttl/design-v2/spec/03-topic-overview.md` | Topic overviews, course, sources; the topic file format; the diagram engine |
| `/Users/Shared/ttl/design-v2/spec/04-lesson-engine.md` | The lesson engine's states, timings and geometry, and both designed lessons' content |
| `/Users/Shared/ttl/design-v2/spec/05-topic-tools.md` | Cost model, design lab, threat model, governance, interview, scorecard, cheatsheets, review cards |
| `/Users/Shared/ttl/design-v2/backend-options.md` | The hosting and backend comparison, prices read on 18 Nov 2026 |

Where a spec and this PRD disagree, this PRD wins.

## Decisions (approved 18 Nov 2026)

| # | Question | Decision |
| --- | --- | --- |
| 1 | How exact is "exactly"? | Copy the look 1:1, but fix the design's own bugs: text that runs together, wrong weekdays in sample dates, rows that wrap or scroll sideways, the step-10 cost that disagrees with its sandbox, a wrong sources link |
| 2 | Buttons with nothing behind them (search, notifications, Export to LMS, Nudge, Print, Hint and others) | Each one works in the phase that can make it work; until then it isn't shown. No dead buttons |
| 3 | Diagram and status colours (cyan, violet, amber, green, blue) and coloured icon tiles | Keep them as designed. Drop only the violet glow on a selected node |
| 4 | Logo in the top bar | The brand kit's compact lockup, as it asks for under 290 px wide |
| 5 | Phone widths (most screens have no phone design) | Phone layouts in the design's style, shown to the creator as stills before they're built |
| 6 | Who can edit the shared topics and facts | Only Tech & Thrive. A company edits only its own private topics |
| 7 | Where content lives | Public topics stay as files in the repo, changed by pull request. Company topics live in the database from phase 3 |
| 8 | The review and approve step has no screen | Designed in the same style and shown to the creator before phase 3 |
| 9 | Which Claude model | Haiku 5.5 for the tutor, hints and review cards; Sonnet 5.5 for the mock interview only, with a daily limit per person. Cost measured on real sessions before limits are set |
| 10 | The mock interviewer, Asha | Phase 2 ships a typed interview with the whiteboard and scorecard; speaking and listening come later |
| 11 | "Play lesson" narration | Each step's line recorded in the creator's voice and shipped as audio files with a transcript |
| 12 | Checkpoint scoring | The first answer counts; 80% across a lesson's checkpoints passes; from phase 2 the right answer is checked on the server, never sent ahead |
| 13 | Review cards schedule | FSRS; the design's 1 min / 1 day / 3 days / 9 days become its real intervals |
| 14 | "Live Claude pricing" in the cost model | Say "Claude prices, read <date>"; a scheduled check re-reads the pricing page and opens a pull request when it changes |
| 15 | Settings page integrations | Ship only what works: company sign-in (SAML), group-to-role mapping, audit log, exports. Slack, Teams, SCIM, LMS and badges stay hidden until built |
| 16 | Learning analytics (v1 promised none) | First-party events only, no third-party scripts, shown only to company admins, groups under 5 hidden, with a privacy notice |
| 17 | The three live v1 topics | Kept as a Foundations topic, rebuilt in the new lesson design |
| 18 | Lessons in phase 1 | The two designed lessons in full (AI agents lesson 2, payments lesson 1), with both topics' overview, course, sources and tools. Other lessons show their outline as "coming" |
| 19 | Naming | "Topic", not "Module"; no "Module 11"; Governance stops calling itself Lesson 7; payments lesson 8 is listed at 45 minutes |
| 20 | Light theme 3D blocks | Use the light-theme colours, so blocks match the rest of the light page |

## Phases

Phase 1 gives every visitor the full learning experience with no account; accounts and AI come in phase 2, companies in phase 3. Each phase ships on its own pull request, goes live and becomes a video before the next starts.

1. **Phase 1 · Learn** (GitHub Pages, no accounts): design system and app shell; the lesson engine in 3D and 2D; the AI agents and payments topics; Foundations rebuilt from v1; cost model, threat model, governance, design lab (explore); cheatsheets; review cards; progress kept in the browser.
    - Gate 1: CI green, a fresh-session `/code-review` with nothing unresolved, every figure verified, the creator approves.
2. **Phase 2 · Accounts** (Supabase and Cloudflare): sign-in and synced progress; Home dashboard and streaks; paths, skills, certificates; checkpoints scored on the server; the tutor and design lab review; mock interview and scorecard.
    - Gate 2: every access rule tested; AI limits set from measured costs.
3. **Phase 3 · Companies** (orgs, roles, SAML sign-in): companies, teams, roles; invites and assigned paths; analytics for admins; the authoring studio (draft, review, publish); content health and the facts register screen; security settings and the audit log.

## Phase 1 features and acceptance

Built in this order, one commit (or a few) per feature, each with its tests. Sizes, states and formulas come from the specs.

| # | Feature | Done when |
| --- | --- | --- |
| P1 | Design system | Tokens for dark and light, with the design's one-off sizes as named tokens; Inter (with `cv11`, `ss01`) and JetBrains Mono self-hosted; the component library from spec 01; one theme switch for the whole app, remembered, dark by default; text contrast 4.5:1 in both themes |
| P2 | App shell | Top bar with the compact lockup and "Learn", nav (Home, Learn, Review in phase 1), search over topics, lessons and facts, theme switch; the per-topic tab bar; works at 360 px with no sideways scroll |
| P3 | Content model | Topic, lesson, checkpoint and facts-register files with a schema and a validator that names the file and field; the build fails if a figure on screen has no register entry, and warns when an entry is past its re-check date |
| P4 | Diagram engine | The 30° isometric projection, the seven block shapes, edge clipping and arrowheads as spec 04 gives them, matching the design's baked coordinates within 0.25 px; 2D view; build-up and full-system views; layers; zoom and pan; request hops at 1.7 s a hop and 1.3 s rest, divided by speed; pause; reduced motion; a text version of every diagram |
| P5 | Lesson page | Step rail, Explain and Sources tabs (Tutor hidden until phase 2), sandbox, narration with transcript, Back and a Next that names the next step, Play lesson, keyboard control, a deep link per step, progress in the browser |
| P6 | Checkpoints | Three questions per lesson; the first answer counts; the design's right, partial and wrong states; scored in the browser in phase 1 |
| P7 | Topic overview and course | Both designed layouts as per-topic configuration; unbuilt lessons show their outline as coming, not as links |
| P8 | Sources | Every figure of a topic with its source, link and date read, built from the facts register |
| P9 | Cost model | The calculator with the design's formulas; at its defaults it gives $0.063 a conversation and $37,944 a month; prices labelled with the date they were read |
| P10 | Threat model | The OWASP Agentic Top 10 view and the component matrix as designed, names as the source has them |
| P11 | Governance | The regulation timeline, penalties, controls and crosswalk as designed, every date and amount re-verified from the primary source |
| P12 | Design lab, explore | The reference architecture in 2D and 3D with each component's detail; building your own comes in phase 2 |
| P13 | Cheatsheets | As designed, plus a print layout |
| P14 | Review cards | The phone review screen as designed, scheduled with FSRS, stored in the browser |
| P15 | Catalog | Search and filters over real topics; planned topics shown as planned, never linking to themselves |
| P16 | Home | Continue learning, what changed in your topics, and due reviews, all from this browser |
| P17 | Foundations | The three v1 topics rebuilt in the new lesson design; every v1 URL redirects to its new page; CONTRIBUTING and issue #2's instructions updated to the new topic format |
| P18 | Phone layouts | Every page at 360 px, following the stills the creator approved |
| P19 | Quality gates | Screenshot tests against the design at 1440 px in dark and light; unit tests for every formula using the design's own numbers; Playwright at 360 and 1280 px on Chromium plus WebKit; axe with zero violations; the JavaScript budget; all in CI |

The payments sandbox, at its defaults, gives 15,000 timeouts and 6,000 duplicate payments a day. Lesson narration audio is recorded outside the repo and committed with its transcript.

## Pages and routes

| Screen in the design | Route | Phase | What ships first |
| --- | --- | --- | --- |
| Home (P-Home) | `/` | 1, then 2 | Phase 1: continue learning, what changed in your topics and due reviews, from this browser. Phase 2: streak, hours, paths, certificates |
| Catalog (P-Catalog) | `/topics` | 1 | Search and filters over real topics |
| Topic overview (Main, PayTopic) | `/topics/[topic]` | 1 | As designed, with the diagram in 3D and 2D |
| Course (Curriculum) | `/topics/[topic]/lessons` | 1 | All lessons listed; unbuilt ones show their outline as coming |
| Lesson (Lesson, PayLesson) | `/topics/[topic]/lessons/[lesson]` | 1 | The full lesson engine; the Tutor tab arrives in phase 2 |
| Checkpoint | `/topics/[topic]/lessons/[lesson]/checkpoint` | 1, then 2 | Phase 1 scores in the browser; phase 2 checks on the server and records it |
| Sources | `/topics/[topic]/sources` | 1 | Every figure, with its source and the date read |
| Cost model (CostCalc) | `/topics/[topic]/cost` | 1 | The calculator, prices with their read date |
| Design Lab | `/topics/[topic]/lab` | 1, then 2 | Phase 1: explore the reference architecture. Phase 2: build your own, reviewed by Claude |
| Threat model | `/topics/[topic]/threats` | 1 | As designed |
| Governance | `/topics/[topic]/governance` | 1 | As designed, every date and penalty re-verified |
| Cheatsheets | `/topics/[topic]/sheets` | 1 | As designed, plus print |
| Review cards (M-Review) | `/review` | 1, then 2 | Phase 1 keeps the schedule in the browser; phase 2 syncs it |
| Mock interview | `/topics/[topic]/interview` | 2 | Typed interview with the whiteboard and captured notes |
| Scorecard | `/topics/[topic]/interview/[session]` | 2 | Scored against the seven dimensions; totals computed in code |
| Learning paths (P-Paths) | `/paths` | 2, then 3 | Phase 2: paths you choose. Phase 3: paths a company assigns |
| Skills map (P-Skills) | `/skills` | 2, then 3 | Phase 2: your levels from checkpoints. Phase 3: the team view |
| Certify (P-Certify) | `/certify` | 2 | Certificates that need a refresh when a fact they rely on changes |
| Analytics (P-Admin) | `/admin` | 3 | Company admins only |
| People and roles (P-People) | `/admin/people` | 3 | Invites, roles, teams |
| Authoring studio (P-Studio) | `/admin/studio` | 3 | Company topics: draft, review, publish |
| Content health (P-Content) | `/admin/content` | 3 | The facts register and change log |
| Security and integrations (P-Settings) | `/admin/settings` | 3 | Only what works (decision 15) |

Each topic picks the tabs it has; Production AI agents has all eight: Overview, Lessons, Cost, Threats, Governance, Lab, Interview, Sheets.

## Design rules

Every screen is checked against its screenshot at 1440 px, in dark and light, before it ships.

- **One component library.** Pages are built only from the components named in spec 01.
- **Tokens, not one-offs.** The design's inline sizes become named tokens.
- **Diagram engine.** One engine for every topic; positions are ported from the design, not re-laid out.
- **Light and dark.** One switch for the whole app, remembered, dark by default.
- **Phone widths.** Every page works at 360 px with no sideways scroll.
- **Accessible as built.** Real buttons and links, tabs with panels and arrow keys, tables as tables, labelled progress bars, `aria-current` in the nav, a text version of every diagram, a pause on every animation, reduced motion respected.
- **No dead controls.** A control that can't work yet isn't shown.
- **Brand.** Ember once per screen: the logo. Inter and JetBrains Mono, self-hosted. The design's colour choices stay; no glows.

## Architecture

Keep the static site and add Supabase from phase 2. It keeps today's static export and its tests, costs nothing until launch, and needs one backend vendor.

- **Phase 1:** a static Next.js export on GitHub Pages, as v1. Progress, checkpoint answers and the review schedule live in the browser.
- **Phase 2:** hosting moves to Cloudflare (static files, free). Supabase Auth (Google, GitHub, email link) and Postgres with row-level security; the browser reads and writes its own rows directly. One Supabase Edge Function holds the Claude API key, checks each person's daily limit and calls Claude; the key never reaches a browser.
- **Phase 3:** company SAML sign-in on Supabase Pro, roles from the database, an audit log written by triggers.
- **Deploys:** GitHub Actions runs the checks on every pull request and deploys main.

GitHub Pages has to go before sign-in: its terms rule out a paid software service and sending passwords.

| Running cost a month | 0 users | 1,000 users | 10,000 users |
| --- | --- | --- | --- |
| Hosting (Cloudflare static files) | $0 | $0 | $0 |
| Supabase | $0 (Free) | $25 (Pro from launch, for backups) | $25 (Pro) |
| Claude (tutor, hints, interview) | $0 | measured in phase 2 | measured in phase 2 |

## Data and who can see what (phases 2 and 3)

Every rule is enforced in the database (row-level security) or in the one server function, and each has an automated test. Hiding a menu item is never the control.

| Data | Phase | Who can read | Who can change |
| --- | --- | --- | --- |
| Profile | 2 | You; admins of your company; managers of your team (name and email only) | You (display name) |
| Lesson progress, checkpoint attempts | 2 | You; your managers and admins, as team totals | You through the app; a checkpoint score only through the server |
| Review cards and their schedule | 2 | You | You |
| Interview sessions and scorecards | 2 | You; others only if you share one | Server only |
| Paths you choose, skill levels, certificates | 2 | You; managers and admins of your company | Skill levels and certificates: server only |
| Company, teams, memberships with roles | 3 | Members of that company | Admins; nobody raises their own role; the last admin can't be removed |
| Invites | 3 | Admins | Admins, within the seat limit; accepting is a server step |
| Assigned paths | 3 | The people assigned; their managers; admins | Admins; managers for their own teams |
| Company topics: drafts, reviews, versions | 3 | Authors, reviewers and admins of that company | Authors write drafts; approve and publish are server steps; an author can't approve their own version |
| Public topics and the facts register | 1 (files), 3 (screen) | Everyone | Tech & Thrive only |
| Company sign-in, role mapping, settings | 3 | Admins (secrets never readable, only replaced) | Admins, after signing in again |
| Audit log | 3 | Admins | Nobody: written by the database |

A team view never shows a group of fewer than 5 people. A learner mid-lesson stays on the lesson version they started.

## Content and facts

| Topic | Phase 1 content | Later |
| --- | --- | --- |
| Production AI agents | Overview, the 10-lesson course, lesson 2 "Anatomy of a production agent" in full (10 steps), its checkpoint, sources, cost model, threat model, governance, design lab (explore), cheatsheets | Lessons 1 and 3–10; the interview in phase 2 |
| Payments platform | Overview, course, lesson 1 "Move money exactly once" in full (10 steps), its checkpoint, sources | The other lessons and its tools |
| Foundations | How an LLM answers, RAG, the agent loop, rebuilt in the new lesson design | More as the channel covers them |

- **Checkpoints.** The design writes one question per lesson but shows "1 of 3". The other two are written, checked against the sources by a fresh reviewer, and approved with the lesson.
- **Narration.** Each step's line is recorded in the creator's voice, checked word for word against its transcript, and shipped as audio with the transcript beside it.
- **The facts register.** Every figure on screen is a record in the repo: value, claim, primary source, date read, re-check date, owner. The Sources pages, the "Verified" labels and Home's "What changed in your topics" are built from it.
- **Before ship.** The specs list well over a hundred figures to re-verify (83 on the overview side alone, 28 of them citing secondary sources; the tools add 50 rows). Each is re-read from its primary source; a secondary source is replaced or the figure is cut. A fresh reviewer then checks the finished pages against the register.
- **Known corrections.** The AI agents course is about 2 hours, not 2.5. Lesson 2's list of nine components must match its diagram. Names shortened from their source (the RBI FREE-AI sutras, NIST risks) go back to the source's wording. The EU AI Act penalty note gains the smaller-company rule.

## AI features (phase 2)

All AI is signed-in only, through the one server function, with a daily limit per person.

| Feature | Model | What it does | Limits |
| --- | --- | --- | --- |
| Tutor tab | Haiku 5.5 | Answers questions about the current step from that lesson's text and sources only, and cites them | Off-topic and instruction-override requests declined; daily limit |
| Design lab review | Haiku 5.5 | Checks a learner's architecture against named checks (pass or fail each; the score is the count) and explains each miss | Checks written from the reference design and approved by the creator |
| Mock interview with Asha | Sonnet 5.5 | A typed system-design interview following the design's phases, with the whiteboard and captured notes | One a day per person until real costs are measured |
| Scorecard | Sonnet 5.5 | Scores the seven dimensions 0–4 with quoted key moments | Totals and the hire band computed in code, never by the model |
| Review cards from an interview | Haiku 5.5 | Turns weak moments into review cards | The learner approves each card before it joins their deck |

Nothing a learner types is used to train models, and the settings page says so as a statement, not a toggle.

## Quality bar

A phase merges only when every check is green in CI and a fresh-session `/code-review` finds nothing unresolved.

- Screenshot tests per screen and state against the design, reviewed by eye.
- Unit tests for every formula, using the design's own numbers.
- Playwright at 360 and 1280 px on Chromium, plus WebKit; every lesson stepped through; keyboard-only runs.
- axe on every page with zero violations.
- The lesson page under the JavaScript budget kept from v1.
- From phase 2: a test for every access rule; the Claude key only in the server function; daily limits tested.
- No third-party scripts or cookies; fonts self-hosted.

## Build process

Each phase is recorded in the creator's Terminal with Claude Code, from plan to merge and deploy, and becomes a long video. Nothing is staged; what breaks stays in.
