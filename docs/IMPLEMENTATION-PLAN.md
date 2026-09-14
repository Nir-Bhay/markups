# Markups — Implementation Plan (Production-Ready)

**Date:** 2026-09-08 · **Sources:** `docs/PRODUCTION-AUDIT-REPORT.md` + `docs/CODE-REVIEW.md`
(all claims re-verified against the live tree; a parallel session is actively fixing — re-grep
line numbers before editing, they drift).
**Rule for every phase:** no phase starts until the previous phase's verification commands pass.
Fix → test → build → commit. One workstream per file (coordinate with the parallel session).

---

## Phase 0 — Stabilize the worksite (½ day, nothing ships without this)

**Goal:** know exactly what tree you're standing on.
1. `git status` review: 30 modified files + `AI-DOCS/`, `docs/`, `tests/e2e/`, `storehouse.test.js`
   are untracked. Agree ownership with the parallel session (who owns `main.js`, `app.js`,
   `eventBus.js`, `toast/`, `explorer/` — all touched by both sides).
2. Baseline run, record numbers: `npm test` (expect ~52 files; confirm count vs CHANGELOG's stale 47),
   `npm run build` + `dist/assets` total size + `dist` html count (expect 19 incl. repro).
   Save output to `docs/seo-geo/runs/`-style run log (also satisfies the AGENTS.md workflow rule
   once `docs/seo-geo/` exists — see Phase 8.6).
3. Commit or stash the parallel session's in-flight work before Gate 0 edits. Never fix on a dirty
   tree you didn't diff.
4. **Verify:** `git status --short` understood line-by-line; baseline numbers written down.

## Phase 1 — Gate 0: unblock the modular boot (1 day, P0)

**Goal:** `main.modular.js` + `app.js` boots with all features, errors visible.
1. **`storageService.initialize()` missing** (`app.js:172` calls, method absent).
   Add a real `initialize()` to `src/core/storage/index.js` (Dexie open + localStorage probe +
   quota check) OR remove the call and init lazily. Then boot modular locally and confirm no
   `TypeError`.
2. **Events-existence guardrail test** (30 min, highest ROI in repo): unit test asserting every
   `EVENTS.*` referenced in `src/` exists in the dict. Audit the ~30 dead names
   (`EXPORT_COMPLETED`, `LINT_COMPLETED`, `SEARCH_COMPLETED`, `GOAL_SET`, `VIEW_MODE_CHANGED`…):
   rename emits to dict names (prefer dict as canonical). Keep alias dupes (`DOC_SAVED`,
   `EXPORT_COMPLETE`) or collapse — decide once, document in `eventBus.js` header.
3. **Container-ID alignment:** add `#toc-container` + `#search-container` targets (or change
   `app.js:144-147` + `main.modular.js` selectors to `#toc-sidebar` / `#search-overlay`).
   `#tabs-list` already added (`index.html:457`). Verify each `_initFeatures` branch initializes.
4. **`downloadBlob` crash** (`services/export/docx.js:9,40`; `utils/file.js` has no such export):
   implement `downloadBlob(blob, filename)` in `file.js` (5 lines, reuse `downloadFile` anchor
   logic) + unit test. Decide `.doc`-vs-`.docx` + unescape `<title>` (`:4419`, `:4638`) here too.
5. **Verify:** `vite build --mode modular` clean → boot modular → toolbar/tabs/search/toc/linter
   all initialize → throw a test error → toast appears (proves P0-2/4 closed) → commit.

## Phase 2 — Data integrity (2–3 days, the dangerous phase)

**Goal:** one source of truth per keystroke; no silent loss. **Backup docs first** (export all notes).
1. **Unify the save path.** Make `AutosaveManager` the single writer: `saveCurrentDoc`
   (`main.js:804-834`) becomes in-memory + tab-title update only; all IDB/localStorage writes move
   behind the 1500 ms debounced writer with a dirty-check skip. Delete the second `updateNote`
   per quiescence. Keep `renderTabs()` → title-only patch (no full `innerHTML` rebuild).
2. **Title clobber:** `saveCurrentDoc` derives title from first `#` each save — respect manual
   renames (only auto-title when `doc.title==='Untitled'` or flag `autoTitled`). Propagate rename
   to IDB + tree (today rename touches only `documents[]` + localStorage).
3. **Quota orphaning:** quota-trim must delete tree/note rows for dropped docs (today array-only
   slice forks tabs↔explorer permanently).
4. **Migration key mismatch:** reconcile literal vs MD5-hashed Storehouse keys (`migration.js:36-73`
   vs `storehouse-compat.js:105`) — write a one-off test proving what the migrator sees; then
   either migrate the mirror format or retire the shim with telemetry.
5. **`reorderNode` atomicity:** wrap sibling renumber in a Dexie transaction; on partial failure
   roll back (today half-persisted order + `console.error`).
6. **`beforeunload`/null-note loss:** block on pending save via `navigator.sendBeacon`-style
   best-effort OR warn; never report `saved` when `_activeNoteId` is null.
7. **Version-history:** move snapshots toward IDB `note_versions` (table exists, unused) or
   document localStorage choice; auto-backup current content before destructive restore;
   wire `stopVersionHistoryPolling()` into teardown; strengthen test beyond no-op path.
8. **Verify:** rapid-type 60 s → single write per pause in Dexie → kill tab mid-type → content
   intact → quota-simulated trim → explorer/tabs agree → new regression tests (delete, reorder,
   import-guard) green → commit.

## Phase 3 — Correctness fixes (2 days)

1. **`wrapSelection` multi-line** (`toolbar/utils.js:80-94`) — rewrite unwrap on per-line ranges;
   add tests (multi-line bold on/off, edge chars intact). Sharpest data-corruption bug, do first.
2. **TXT triple pipeline** (`main.js:3491` vs `:4726` vs `:3997`): delete legacy, make preview
   render through the WithOptions function so approve-preview === download.
3. **Word-count unification:** single `countWords()` (use `markdownService.extractStats` as
   canonical) for footer, toolbar popover, goals, history, export frontmatter. Delete the 4 copies.
4. **Search double-bind:** pick ONE (inline `setupSearch` vs `searchManager`), delete the other;
   one Ctrl+F owner.
5. **Callout multi-line paste** (prefix every line with `> `); **table picker keyboard path**
   (default 3×3, no `0×0`); **link/image URL-part selection** for fast typing.
6. **Slugify unification:** one Unicode-aware slugify (`normalize('NFKD')`, strip diacritics,
   dedupe `-1`), shared by renderer, `annotateSourceLines`, `extractTOC`; TOC from lexer tokens
   (kills fenced-code false entries + dup-id collisions).
7. **KaTeX:** pick ONE engine/output; gate the extension (not DOM-strip); fix `render()` dead
   `katexEnabled` flag. **Mermaid:** `securityLevel:'strict'` in `main.js:82` + theme re-init;
   render-token in service `_renderMermaidDiagrams` (mirror `_convertToken`).
8. **Typewriter double-listener** (one `revealLineInCenter` owner); **fullscreen `editor.layout()`**
   on toggle; resolve cursor-sync-ratio vs scroll-sync-anchor (keep anchor map).
9. **Templates placeholder expansion** (match snippets) or document raw-insert; `${cursor}` real
   positioning; palette `getElementById().click()` → null-guarded dispatch + dispose key listener.
10. **Verify:** new unit tests per fix + 10-step manual QA (§5 of audit report) fully green → commit.

## Phase 4 — Security hardening (1 day)

1. Toast done. Remaining sinks: AI settings `value=` escaping (`ai-writer/ui.js:325-347`);
   explorer `data-node-id` (`:500`); audit `toast.show()` callers for raw HTML intent.
2. AI keys: session-only storage option + consent dialog for custom endpoints; document CSP limits
   (custom/Ollama silently blocked in prod — decide allow or forbid, fix CSP accordingly).
3. Preview blast radius: add CSP `report-to`; plan sandboxed preview iframe (spike first, Phase 7).
4. Import: enforce extension+MIME+size allowlist; cap or gate `importFromURL`.
5. Refresh `SECURITY.md` (stale html2pdf/jspdf + CSP drift) as part of the change, not after.
6. **Verify:** `npm audit` clean + XSS test per sink + CSP header diff reviewed → commit.

## Phase 5 — Dead-code removal (½–1 day, safe order only)

1. `repro-toolbar-issue.html` (+ confirm `dist/` drops to 18 pages).
2. Unlinked `public/css/style.css` + `public/css/github-markdown-light.css` dup (visual pass first).
3. `MERMAID_CONFIG` / `BREAKPOINTS` / `ANIMATIONS` (zero importers).
4. Dead bus traffic (`IMPORT_*`, `DIVIDER_CHANGED`, `AI_*` emits, `EXPORT_*` listeners) + alias collapse.
5. Canonicalize `sitemap`/`robots`/`llms.txt` (one source; fix 404 image locs; PNG OG image).
6. **Do NOT touch** any `features/*` manager or `FEATURE_FLAGS` until Phase 6 decides the entry.
7. **Verify:** build + full suite + visual smoke after EACH deletion (bisectable commits).

## Phase 6 — Single-entry decision (decision meeting, then 2–3 days)

Options: (A) freeze `main.js` legacy, ship modular; (B) port modular advances back into `main.js`,
delete `app.js`. Default recommendation: (A) — modular layering is sound, monolith is unmaintainable.
Either way the checklist is the same: one markdown pipeline (`convert()` delegates parse→sanitize
to shared `renderMarkdownToHtml`), one tabs/goals/linter/search/toc/stats implementation, one
word-count, one save path (Phase 2), flags honored or deleted, `features/index.js` covers all 29
(or is deleted if unused). **Verify:** chosen entry boots from clean profile; other entry removed;
suite + e2e green; bundle re-measured.

## Phase 7 — Performance (after correctness, 2 days)

1. Lazy-load mermaid + KaTeX behind existing gates (imports, not just output); keep Monaco eager.
2. Restore strict `chunkSizeWarningLimit` with named exceptions + bundle-size CI gate
   (fail build on regression vs Phase 0 baseline).
3. Ship woff2-only KaTeX fonts; resolve `monaco-vim` external (bundle or drop + remove config).
4. Per-diagram mermaid hash cache; `annotateSourceLines` once post-mermaid; TOC/outline diffing;
   debounce `updateStats` (or fold into convert); thin save fan-out (done in Phase 2).
5. Large-doc safety: paste cap + confirm, Monaco `largeFileOptimizations` /
   `stopRenderingLineAfter` / `maxTokenizationLineLength`, lower live-edit fallback threshold.
6. **Verify:** Lighthouse + typing-lag test on 1 MB doc + diagram-heavy doc before/after numbers.

## Phase 8 — PWA · SEO · a11y · deploy parity (1–2 days)

1. Real PNG icons (192+512 maskable) + screenshot + PNG apple-touch-icon; fix `/images` vs `/image`.
2. Wire `#pwa-install-button` + `#pwa-update-banner` into HTML; offline fallback page; precache
   hashed bundles (or adopt Workbox — spike first).
3. Unify sitemap/llms.txt; PNG OG image; create `docs/seo-geo/` + `MASTER-BACKLOG.md` (makes the
   AGENTS.md workflow executable) and log this run.
4. Docker nginx: SPA fallback + header parity with Vercel (or document Vercel-only deploys).
5. Axe/Lighthouse a11y pass (contrast, popover roles, shortcut discoverability).
6. **Verify:** Lighthouse PWA ≥90, install prompt fires, update flow shows banner, social unfurl
   tested, Docker serves `/landing` clean URLs.

## Phase 9 — Testing to production (ongoing, start in Phase 1)

1. Keep the events-existence + flags tests (Phase 1) — never delete guardrails.
2. Add Phase 2–3 regression tests as each fix lands (delete, reorder, import-guard, export
   dispatcher with mocked html2pdf/CORS throw, wrapSelection multi-line, word-count).
3. Grow `tests/e2e/smoke.spec.js` → full journey: type→preview→tab CRUD→reorder→import→each
   export→toggles→offline→mobile→shortcuts (the 10-step QA list, automated).
4. Un-skip coverage: extend `vitest.config.js` include beyond storage/utils as each area gains tests.
5. **Release gate:** suite green + e2e green + manual QA list + Lighthouse + `npm audit` clean +
   CHANGELOG entry. Tag it.

---

## R&D spikes (time-boxed, before committing to a direction)

- S1: sandboxed preview iframe feasibility (Monacoardino? scroll-sync across frame boundary?) — 4h.
- S2: mermaid-11 `initialize()` merge semantics (does level-less init reset `securityLevel`?) — 1h.
- S3: `monaco-vim` in built output (404 or works?) — 30 min.
- S4: IDB `note_versions` vs localStorage for history (quota, perf, simplicity) — 2h.
- S5: `moveNode` cycle safety proof (try moving folder into own descendant on staging) — 30 min.

## What NOT to do

No perf refactors before Phase 2–3 green · no piecemeal manager deletions before Phase 6 ·
no new features until Phase 9 gate passes once · no edits on files the parallel session owns
without a handoff · no line-number references in commit messages (they drift — use symbols).
