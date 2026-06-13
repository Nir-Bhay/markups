# Code Game — Feature Plan & Improvement Backlog for Markups

> Status: **No code-game feature exists today.** This doc is the result of a
> full inventory of the Markups codebase and lays out what to add, what to
> reuse, and what to improve to ship a real, gamified learning experience
> inside the existing markdown editor.

---

## 1. TL;DR

| Question | Answer |
|---|---|
| Does a code game exist today? | **No.** Closest thing is the writing-goals streak system. |
| Should we build one? | **Yes — high ROI.** It turns Markups from "a great editor" into "the only editor that teaches you Markdown" (and Markdown-adjacent skills like Mermaid, KaTeX, front-matter, table syntax). |
| What's the cheapest, most defensible first version? | A **client-side, offline-first "Markdown Challenge" mode** that reuses the existing editor, linter rule registry, snippets library, and goal/streak system. No backend, no new big dep, no CSP break. |
| What does that get us? | Daily streak, XP, levels, badges, "spot the violation" linter challenges, "complete the snippet" challenges, "write the mermaid diagram" challenges. |
| What does it NOT do in v1? | No multiplayer leaderboard, no judge that runs JS/Python, no AI tutor. Those are Phase 2+ if there's pull. |

---

## 2. Why this is a strategic win

1. **SEO surface area explodes.** Every challenge is a long-tail keyword
   (e.g. "markdown table practice", "mermaid flowchart quiz",
   "fix markdown headings challenge", "KaTeX math editor tutorial").
   The Markups SEO cluster (`seo/`, 14 sub-pages) already
   targets *information* intent; a `/play/` section targets
   *transactional* / *engagement* intent with 10× the time-on-page.
2. **Retention.** The existing streak feature (`src/features/goals/index.js`)
   is the only retention loop we have. A real game loop (challenge →
   score → XP → unlock next challenge) is a true moat.
3. **Differentiation.** StackEdit, Typora, Dillinger — none of them have
   a built-in play mode. Markups can own the keyword "markdown game"
   and "markdown challenge".
4. **Reusability.** ~70% of the v1 surface area reuses code we already
   ship (editor, linter rules, snippets, goal system, streak card CSS,
   toasts, modal, EventBus, storage). The new code is mostly UI/UX
   glue and content.

---

## 3. What to ADD (net-new modules)

### 3.1 `src/features/play/` (new feature module)

This is the umbrella for the code game. Mirrors the
`src/features/<name>/index.js` singleton-manager pattern.

**Files:**

- `src/features/play/index.js` — `PlayManager` singleton
  - `startChallenge(id)`, `completeChallenge(id, score)`,
    `getProgress()`, `getXP()`, `getLevel()`, `unlockNext()`
  - Persists to IndexedDB via `storageService`
  - Emits `EVENTS.PLAY.CHALLENGE_COMPLETED`, `EVENTS.PLAY.LEVEL_UP`
- `src/features/play/challenges.js` — challenge catalog
  - 30+ challenges, each defined as data (not code):
    ```js
    {
      id: 'md-001-heading-order',
      title: 'Fix the heading order',
      type: 'linter-fix',          // linter-fix | snippet-fill | write-prompt | quiz
      language: 'markdown',
      difficulty: 'easy',          // easy | medium | hard | expert
      xp: 50,
      prompt: '...',
      starterDoc: '...',
      solution: '...',
      validation: { rules: ['MD002', 'MD003'] },
      hint: 'Headings should increase by one level at a time.'
    }
    ```
- `src/features/play/levels.js` — XP → level table + unlocks
  - `LEVELS = [{ level: 1, xp: 0, title: 'Apprentice' }, …]`
  - Unlocks gated by both level and challenge count
- `src/features/play/ui.js` — DOM helpers, injects the play panel,
  challenge list, level-up modal
- `src/features/play/validator.js` — runs the appropriate check
  - For `linter-fix`: run `linterManager` on the user's doc and
    assert the named rules are clean
  - For `snippet-fill`: parse the doc, assert it contains the
    expected token (table, mermaid block, katex block, alert, etc.)
  - For `write-prompt`: simple regex/string match against
    `challenge.solution`
  - For `quiz`: multi-choice with single correct answer
- `src/features/play/styles.css` (or merged into `premium-ui.css`)
  - `.play-card`, `.play-level-badge`, `.play-xp-bar`,
    `.play-challenge-grid`, `.play-difficulty-easy/medium/hard/expert`
  - Reuse `.streak-card`, `.goal-progress-bar`, `.badge` from
    `public/css/premium-ui.css:4426-4465, 545-569`

**Wiring (follows existing pattern):**

- Add `EVENTS.PLAY.*` to `src/utils/eventBus.js`
- Export from `src/features/index.js` (alphabetical: between
  `modes` and `search`)
- Initialize in `src/app.js` feature-registration block
  (`src/app.js:78-95`) and in legacy `src/main.js` feature-init
  list — see `src/main.js` where `linterManager` is initialized
- Add toolbar button: `data-toolbar-action="play"` next to
  existing buttons; mirror `ai-writer` toolbar wiring

### 3.2 `src/config/challenges/` (new config folder)

YAML-or-JSON-defined challenge content so non-coders can author
challenges. Mirror the `src/config/templates.js` and
`src/config/snippets.js` shape:

```
src/config/challenges/
├── index.js              # barrel
├── markdown-101.js       # 10 easy
├── markdown-201.js       # 10 medium
├── markdown-301.js       # 10 hard
├── mermaid-101.js        # 5 easy (diagrams)
├── katex-101.js          # 5 easy (math)
└── linter-fixes.js       # 10 "fix the violation" challenges
```

Each file exports an array of challenge objects consumed by
`play/challenges.js`.

### 3.3 New SEO sub-page: `seo/markdown-game/index.html`

Add a `/seo/markdown-game/` page that:
- Ranks for "markdown game", "markdown challenge",
  "learn markdown interactively", "markdown practice online"
- Links into the in-app `/play/` route
- Has its own JSON-LD (`Course` + `FAQPage`)
- Mirrors the 14 existing `seo/*/index.html` page templates
- Gets added to `sitemap.xml` + `llms.txt` (just like the
  existing 14 in the Phase-4 content expansion)

### 3.4 New landing-page section: "Learn by Playing"

In `landing/index.html` (after the existing "Features" section,
before the FAQ), add a 3-card section:
- "Daily Challenges" → links to `/play/`
- "Earn XP & Badges" → screenshots of the streak card
- "Track Your Streak" → screenshot of the level bar

Also add "Learn by Playing" to the top nav, footer link list, and
the comparison table on the page (where Markups already beats
StackEdit/Typora on "offline", "open source", etc.).

### 3.5 New README / docs

- `docs/code-game-plan.md` — **this file** (you're reading it)
- `AI-DOCS/features/play.md` — feature doc for the AI agents,
  parallel to `AI-DOCS/features/FEATURES-INDEX.md`
- Update `AI-DOCS/AI-MEMORY.md` Features Map section
- Update `AI-DOCS/QUICK-START.md` "Add a feature" recipe
- Update `AGENTS.md` project structure (one new folder under
  `src/features/`)
- Update `landing/design.md` with the new "Learn by Playing" section

---

## 4. What to IMPROVE (existing code to upgrade)

These are improvements to the *existing* game-adjacent features so
the new code-game can plug into them cleanly.

### 4.1 `src/features/goals/index.js` — generalize `GOAL_TYPES`

Today: `GOAL_TYPES = { WORDS, CHARS, TIME }` (`goals/index.js:19-23`).

Add:
- `ISSUES_FIXED` — tied to linter (every fix in a "spot the
  violation" challenge increments the counter)
- `CHALLENGES_COMPLETED` — ties the streak to the new
  `PlayManager` instead of just word count
- `XP_EARNED` — surfaces in the goal panel

Add an event listener so `goalsManager` reacts to
`EVENTS.PLAY.CHALLENGE_COMPLETED` and increments the
`CHALLENGES_COMPLETED` counter the same way it reacts to
`EDITOR_CONTENT_CHANGED` for `WORDS`/`CHARS`.

### 4.2 `src/features/linter/index.js` — challenge-aware rule filter

`linterManager` already has `addRule()` (`linter/index.js:401-410`).
Add:
- `getRulesBySeverity(severity)` — needed by validator.js to
  assert "no errors of type MD002 remain"
- `getRuleById(id)` — for the validator
- `getRuleCount()` — for the goal counter

Refactor the giant `LINTER_RULES` array (`linter/index.js:28-217`)
to also export the JSON-schema shape per rule, so the validator
can read `rule.expected` and `rule.solutionHint` without
re-importing constants.

### 4.3 `src/main.js` — move game logic out of the monolith

The streak / XP / challenge wiring is going to balloon `main.js`
past its current ~5,800 lines. Move all of it into
`src/features/play/`. `main.js` should only:
1. Import `playManager` from `src/features/play/index.js`
2. Initialize it in the feature-init block (where
   `linterManager`, `goalsManager`, `explorerManager` are
   initialized — search `src/main.js` for `new GoalsManager(`)
3. Forward `EVENTS.EDITOR_CONTENT_CHANGED` to it
4. Re-export nothing

This is also a step toward the long-term goal of retiring
`main.js` in favor of `src/app.js` (per the
`AGENTS.md` mention of two parallel entry points).

### 4.4 `public/css/premium-ui.css` — extract the play styles

Today `.streak-card`, `.goal-progress-bar`, `.badge` live in
`premium-ui.css` (lines 4426-4465, 545-569). After v1, the
game styles should be either:
- A new `public/css/play.css` referenced from `index.html`,
  OR
- A clearly-delimited section in `premium-ui.css` with a
  `/* === PLAY MODE === */` banner

Pick one. Right now, "where do I add game styles?" has no
answer in the docs.

### 4.5 `src/config/app.config.js` — add a feature flag

Add to the existing `FEATURE_FLAGS` block
(`app.config.js:77-97`):

```js
ENABLE_PLAY_MODE: true,    // code game & challenges
ENABLE_LEADERBOARD: false, // future: opt-in, opt-out default
ENABLE_AI_TUTOR: false,    // future: reuses ai-writer
```

This lets us ship the game to a small cohort first, then
flip the default.

### 4.6 `src/ui/modal/index.js` — extend modal API

Add `modal.showLevelUp({ level, title, unlockedChallenges })`
and `modal.showChallengeIntro({ challenge })` as named helpers
on top of the existing `modal.open()`. The level-up modal
should re-use the existing confetti / animation primitives
(there is some animation logic in `premium-ui.css` already).

### 4.7 `src/core/storage/database.js` — add new tables

Today the Dexie schema is `notes`, `fileTree`, `settings`.
Add:
- `challenges` — `{ id, completedAt, score, attempts, bestTimeMs }`
- `xp` — `{ level, currentXP, totalXP, lastUpdated }`
- `badges` — `{ id, awardedAt, source }`

Use the same Dexie versioning pattern that
`src/core/storage/database.js` already uses (bump version,
list new tables, write an upgrade callback).

### 4.8 `src/utils/eventBus.js` — add `EVENTS.PLAY.*`

Add a new `PLAY` group with at least:
- `EVENTS.PLAY.CHALLENGE_STARTED`
- `EVENTS.PLAY.CHALLENGE_COMPLETED`
- `EVENTS.PLAY.CHALLENGE_FAILED`
- `EVENTS.PLAY.LEVEL_UP`
- `EVENTS.PLAY.BADGE_AWARDED`

Follow the existing dotted-naming convention.

---

## 5. Content backlog (challenge ideas to ship in v1)

Pulled from the linter rule catalog
(`src/features/linter/index.js:28-217`) and the snippets
library (`src/config/snippets.js`).

### 5.1 "Fix the violation" (linter-fix) — 12 challenges

| # | ID | What the user does | Linter rules |
|---|----|--------------------|---------------|
| 1 | `md-fix-001` | Fix heading-level skip | MD002, MD003 |
| 2 | `md-fix-002` | Add blank lines around lists | MD032 |
| 3 | `md-fix-003` | Trim trailing spaces | MD009 |
| 4 | `md-fix-004` | Replace tabs with 2 spaces | MD010 |
| 5 | `md-fix-005` | Remove multiple blank lines | MD012 |
| 6 | `md-fix-006` | Fix hard-tab indentation | MD010, MD023 |
| 7 | `md-fix-007` | Add a blank line after headings | MD022 |
| 8 | `md-fix-008` | Fix atx-heading style | MD003 |
| 9 | `md-fix-009` | Make list indentation consistent | MD007, MD030 |
| 10 | `md-fix-010` | Surround fenced code with blank lines | MD031 |
| 11 | `md-fix-011` | Strip BOM | MD041 |
| 12 | `md-fix-012` | Close fenced code blocks | MD040 |

### 5.2 "Complete the snippet" (snippet-fill) — 10 challenges

| # | ID | Snippet | Acceptance |
|---|----|---------|------------|
| 1 | `snip-001` | Build a 3-column GFM table with alignment | `markdownService.extractStats.tables >= 1` and `rows >= 3` |
| 2 | `snip-002` | Write a task list with 5 items, 2 done | regex: `- \[[ x]\]` x5 |
| 3 | `snip-003` | Add a GitHub alert block `[!NOTE]` | token check |
| 4 | `snip-004` | Embed a Mermaid `graph LR` | ` ```mermaid` block present |
| 5 | `snip-005` | Write a Mermaid sequence diagram with 3 actors | parse mermaid block + check 3 `participant` lines |
| 6 | `snip-006` | Write a KaTeX inline formula `$E=mc^2$` | token check |
| 7 | `snip-007` | Write a KaTeX block `\\int_0^1 x^2 dx` | token check |
| 8 | `snip-008` | Add a footnote `[^1]` with a definition | token check |
| 9 | `snip-009` | Build a strikethrough + bold phrase `~~**x**~~` | token check |
| 10 | `snip-010` | Add a horizontal rule `---` | token check |

### 5.3 "Write the prompt" (write-prompt) — 8 challenges

| # | ID | Prompt |
|---|----|--------|
| 1 | `wp-001` | "Explain `git rebase` in 50 words" |
| 2 | `wp-002` | "Write a meeting notes template for a 1:1" |
| 3 | `wp-003` | "Draft a friendly PR description" |
| 4 | `wp-004` | "Write a CHANGELOG entry for v1.2.0" |
| 5 | `wp-005` | "Summarize the README in 3 bullets" |
| 6 | `wp-006` | "Compare Postgres vs MongoDB" |
| 7 | `wp-007` | "Document an API endpoint" |
| 8 | `wp-008` | "Write a 'How to contribute' section" |

Validator: `markdownService.extractStats().words` between
min/max bounds.

### 5.4 "Quiz" (multi-choice) — 5 challenges

Markdown trivia (e.g. "Which character creates a thematic
break?") with a single correct answer. Stores the score
even on wrong answer so the streak still ticks.

**Total v1: 35 challenges** (≈ 4 hours of content at
~7 min/challenge).

---

## 6. Phased rollout (3 PRs, easy to review)

### PR #1 — Plumbing (no UI surface change)
- Add `src/features/play/` skeleton
- Add `EVENTS.PLAY.*` to event bus
- Add `FEATURE_FLAGS.ENABLE_PLAY_MODE = false`
- Add Dexie tables (with a versioned migration)
- Add `playManager` (does nothing visible yet)
- Wire initialization in `main.js` and `app.js`
- Add `AI-DOCS/features/play.md` + update `AGENTS.md`
  project structure

### PR #2 — First challenges + UI
- Add 10 challenges in `src/config/challenges/`
- Implement `PlayManager.startChallenge()`,
  `completeChallenge()`, XP, level
- Build the challenge list panel (UI) + the
  challenge-attempt panel (UI)
- Build the level-up modal
- Hook streak card to also show XP / level
- Add `ENABLE_PLAY_MODE = true`
- Add `seo/markdown-game/index.html` + sitemap +
  llms.txt update

### PR #3 — Marketing surface
- Add "Learn by Playing" section to `landing/index.html`
- Add comparison-table row in landing
- Add 25 more challenges (total 35)
- Add "Daily Challenge" home-page widget in `index.html`
- Update `docs/code-game-plan.md` with v1 results

### Future (Phase 2+, not in v1)
- Leaderboard (needs a backend — out of scope for client-only)
- AI Tutor mode (reuses `ai-writer` system prompt)
- Code-execution challenges (Pyodide / WebContainer — needs
  new dep + sandbox iframe)
- Multiplayer time-trial (needs server)

---

## 7. Open questions for the user (decide before PR #2)

1. **Daily reset timing** — midnight UTC vs. local timezone vs.
   rolling 24h? (Recommend rolling 24h to match the existing
   `goalsData.lastGoalDate` logic.)
2. **Streak rule** — does a failed challenge break the streak,
   or just not advance it? (Recommend: does not break, just
   doesn't advance. Matches Duolingo-lite.)
3. **Difficulty XP curve** — proposed: easy 50, medium 100,
   hard 200, expert 400. Level = floor(sqrt(totalXP / 50)) + 1.
4. **First-time onboarding** — modal on first visit, or
   silent (just appears in the panel)? (Recommend: modal,
   1-time, dismissible.)
5. **Telemetry** — keep using the existing
   `fetch('http://127.0.0.1:7909/...')` debug hooks in the
   new module, or strip them? (Recommend: strip them.
   They are local-dev only and add noise.)

---

## 8. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Linter changes (MD rule set updates in `markdownlint`) break `linter-fix` challenges | Medium | Medium | Pin `markdownlint` version, test challenges on `npm run test`, gate by linter version. |
| Challenge catalog grows too big → bundle bloat | High | Low | Code-split `src/config/challenges/*` (Vite `import()` per category, lazy on first play). |
| CSP changes for AI tutor / WebContainer | High (Phase 2) | High | Phase 1 ships with the **current** CSP untouched. Phase 2 needs a security review. |
| SEO duplicate-content risk for `/seo/markdown-game/` | Low | Medium | Add `canonical`, unique content (no copy/paste from existing pages), `noindex` until PR #3 ships. |
| Two entry points (`main.js` + `app.js`) make `playManager` init ambiguous | Medium | Medium | Init in `app.js` only. `main.js` may import `playManager` for toolbar button but never re-instantiate. |
| Existing telemetry `fetch('http://127.0.0.1:7909/...')` calls in `goals/index.js:13, 65` and `linter/index.js:13, 249` are out-of-pattern | Low | Low | Don't copy this pattern into the new module. |

---

## 9. Mapping back to the inventory

This doc is the actionable counterpart to the inventory done in
the explore pass. The exploration surfaced:

- 0 implemented code-game features (none found)
- 20+ adjacent hits (all marketing, CSS, or unrelated
  — see inventory report)
- 9 candidate features for game-ification (linter, goals,
  templates, snippets, AI writer, stats, modes, markdown
  service, focus mode)
- 22 reusable building blocks already in the codebase
  (GoalsManager, streak CSS, linter rule registry, EventBus,
  toast, modal, storage, FEATURE_FLAGS, etc.)
- 11 blockers/constraints (no execution dep, CSP,
  monolith main.js, missing Dexie tables, no feature flag,
  no backend for leaderboard, etc.)

This doc addresses every blocker in the **Constraints
Addressed** column:

| Inventory blocker | Addressed by |
|---|---|
| No execution dep | v1 uses validator.js (regex/linter), no execution needed |
| CSP | v1 needs no CSP changes |
| main.js monolith | PR #1 moves init out, PR #2 moves logic out |
| No Dexie tables | PR #1 adds versioned tables |
| No FEATURE_FLAGS entry | PR #1 adds `ENABLE_PLAY_MODE` |
| No leaderboard backend | Explicitly out-of-scope for v1 |
| No `/play/` route | PR #2 adds the panel |
| No SEO sub-page | PR #2 adds `seo/markdown-game/index.html` |
| No landing page mention | PR #3 adds "Learn by Playing" section |
| No docs | This file + `AI-DOCS/features/play.md` |
| Telemetry noise | Strip in v1; do not copy pattern |

---

## 10. TL;DR for a code reviewer

Read this in 60 seconds:

1. We don't have a code game. We're adding one.
2. v1 is **client-side only**, no backend, no new big dep.
3. It reuses **GoalsManager**, **LinterManager**,
   **StatsManager**, **snippets**, **EventBus**, **storage**,
   **toast**, **modal**, **streak CSS**.
4. Ships in 3 PRs, ~35 hand-written challenges.
5. The big strategic win is **SEO** (new long-tail surface
   in `/seo/markdown-game/`) and **retention** (XP/streak loop
   in-app).
6. Phase 2 (AI tutor, code execution, multiplayer) is
   explicitly out of scope for v1 and gated by a feature flag.

---

**Last updated:** 2026-06-13
**Author:** Markups AI agent (post-inventory pass)
**Status:** Draft — awaiting user decisions on §7 before PR #2.
