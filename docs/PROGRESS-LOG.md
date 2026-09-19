# Progress Log — single source of truth for where we are

## 2026-09-08 — Audit complete, execution begins
- Audits: `docs/PRODUCTION-AUDIT-REPORT.md` (+§11 recheck addendum),
  `docs/CODE-REVIEW.md` (+§12 recheck addendum), `docs/IMPLEMENTATION-PLAN.md`,
  `docs/WORKING-PROTOCOL.md` (this run).
- Tree state: parallel session active (30 modified files, `AI-DOCS/`, `tests/e2e/smoke.spec.js`,
  `storehouse.test.js` new). Already-fixed by them: flags, EVENTS.ERROR, focus/linter imports,
  toast textContent, backlinks wiring, `#tabs-list`, first smoke spec.
- Still open P0: `storageService.initialize` missing · `downloadBlob` crash ·
  `#toc-container`/`#search-container` mismatch.
- Next: Phase 0 (diff review + baseline) → Phase 1 Gate 0.

## Phase 1 Gate 0 — COMPLETE (2026-09-08, late session)
- 1.1 `storageService.initialize()`: added sync non-throwing probe
  (`core/storage/index.js`) + `storageService.test.js` (4 tests). Modular boot no longer throws.
- 1.2 events guardrail: `events-existence.test.js` scans all of src/ — MISSING=0 independently
  confirmed (subagent catalog rechecked); 4 alias pairs locked. Fixed 2 self-bugs in the test
  (Windows path skip, self-match on comment).
- 1.3 containers: `app.js` toc→`#toc-sidebar`, search→`#search-overlay`; `main.modular.js`
  all 9 overrides → real IDs (snippets→`#snippets-dropdown`; `#snippets-button` absent from
  HTML — toggle UX logged as Phase 6 follow-up, palette actions already null-guarded).
- 1.4 `downloadBlob(blob, filename)` added to `utils/file.js` (mirrors `downloadFile`);
  docx import resolves (proven by clean modular build).
- EVIDENCE: eslint 0 errors · targeted 34/34 · full suite 54 files, 361 passed (62s) ·
  `npm run build:modular` clean (2m19s). Note: modular build overwrote local dist/ (gitignored).
- Next: Phase 2 data integrity (backup docs first).

## Phase 2 data integrity — COMPLETE (2026-09-08, late session)
- 2.0 mapped live pipeline (subagent, rechecked): autosave inert in default build
  (never initialized/fed); saveCurrentDoc does IDB+tree+mirror+tabs+tree-sync per fire.
- 2.1 autosave false-saved: early-return false + no saved signal when no active note;
  NaN id re-queues content. +2 tests (5/5 in file).
- 2.0 dirty-check: `lastSavedSnapshot` Map skips full fan-out when unchanged.
- 2.2 title lock: `deriveDocumentTitle()` exported from markdown service (+5 tests);
  manual renames (tab + explorer) set `titleLocked`; load-time heuristic preserves
  old manual titles. New docs stay auto (locked=false).
- 2.3 quota: evicted docs' IDB rows deleted (recursive + allSettled, never throws) +
  snapshots pruned. Previously array-slice only (tabs↔explorer fork).
- 2.4 reorder: Dexie transaction (all-or-nothing, false on rollback) +2 tests (6/6 file).
  Migration proof test: literal keys migrate (1 note), MD5-shim keys ignored (0) — locked
  as accepted behavior (shim path self-consistent, low risk). beforeunload: sync
  localStorage-mirror pagehide flush added (IDB can't finish during unload).
- SCOPING: full single-writer unification DEFERRED to Phase 6 (dual entries + parallel
  session conflict risk). Dirty-check removes the cost; correctness fixed now.
- EVIDENCE: eslint 0 errors · full suite 54/54 files, 369/369 passed (53s). One transient
  stats-import timeout in a loaded 185s run — 10/10 alone, then full re-run green. Flake, not regression.
- Next: Phase 3 correctness (wrapSelection first).

## Phase 3 correctness — COMPLETE (2026-09-09 early session)
- 3.1 wrapSelection: exact-adjacency toggle (non-destructive wrap on boundary
  crossing) + `toolbarWrap.test.js` (6 tests, faithful fake Monaco model).
  Proven: old code FAILS the regression test (stash check), new code 6/6.
- 3.2 TXT single pipeline: `services/export/txt.js` canonical converter; all three
  main.js call sites delegate (preview === download). Bonus: image-before-link
  ordering bug fixed (was `!alt (url)`). +7 tests.
- 3.3 word count: goals + toolbar popover → `extractStats`; paragraphs regex aligned
  (`/\n\s*\n/`); +2 tests. Footer already matched (M5).
- 3.4 search double-bind: VERIFIED no live conflict (main.js never imports
  searchManager) — scoped to Phase 6, no deletion per protocol §5.
- 3.5 typewriter dedupe (one center per move), fullscreen `editor.layout()` on all
  four paths, mermaid `securityLevel:'strict'` on both inits.
- DEFERRED (logged, not forgotten): callout multi-line prefix, table keyboard
  default, link/image URL-part selection, slugify unification, KaTeX engine pick —
  UX-visible, need browser proof; do with manual QA in Phase 6/8.
- EVIDENCE: eslint 0 errors · full suite 384/384 passed (80s).
- Next: Phase 4 security hardening (AI settings escaping, key consent design).

## Recheck-all-phases (2026-09-09) — 6 review fixes applied
- Fresh-eyes agent caught 6 real issues in my Phase 2-3 work; all fixed + tested:
  1. Autosave NaN path left status stuck at `saving` → reset to `unsaved` (+test).
  2. Tab rename persisted localStorage-only → now `void saveCurrentDoc()` (IDB+tree).
  3. Escape-cancel locked titles → `renameCancelled` guard.
  4. Reorder `false` ignored by both callers → error toast (+await on tab-drop).
  5. Snapshot leak on close/delete → `lastSavedSnapshot.delete` in both.
  6. Typewriter orphan on editor recreate → defensive re-bind on enter.
- Marker script: 14/14 present. Full suite: 385/385 green (one transient single-fail
  in a loaded run, clean on re-run — flake).
- Coordination notes for parallel session: MERMAID_CONFIG `loose` contradicts code
  `strict` (their file, not touched); quick-export now follows modal checkboxes
  (intended output change); their `chrome.js` exports must stay stable (my imports).
- Next: Phase 4 security hardening.

## Phase 4 security hardening — COMPLETE (2026-09-09)
- 4.1 VERIFIED pre-fixed (escapeHtml on all settings `value=`); no change needed.
- 4.2 AI key safety: `isCustomEndpoint()` + explicit `confirm()` before a key
  follows a newly-typed custom host; `setConfig` rejects non-http(s) endpoints;
  session-only keys (`setSessionApiKey`/`clearSessionApiKey`/`isSessionKey`,
  memory-first, persisted copies removed) + settings checkbox wiring. +8 tests.
- 4.3 import: extension allowlist enforced, `importFromURL` http(s)-only + caps
  (found parallel session's own content-length/Blob caps mid-edit — kept their
  byte caps + my scheme gate + allowlist; removed only my redundant length check
  after verifying coherence). +4 tests.
- 4.4 SECURITY.md: date, connect-src allowlist truth, AI-key + import rows.
  (§8 deps already refreshed by parallel session.) CSP `report-to` DEFERRED —
  needs a reporting backend; logged.
- EVIDENCE: eslint 0 errors · full suite 405 pass + 1 known stats-import flake
  (10/10 isolated, 3rd occurrence under load — infra flake, monaco transform).
- Next: Phase 5 dead-code removal (safe order).

## Phase 0 — COMPLETE (2026-09-08, late session)
- Diff reviewed (subagent, rechecked): parallel session fixed flags, event aliases (~25 keys),
  focus/linter imports, toast textContent, explorer escaping, backlinks split, `#tabs-list`,
  global error handler in main.js, Storehouse quota returns, find+replace overlay, vim bundling.
  Risks noted: CSP meta/headers drift, vim budget raise, header-tabs scope loss, Storehouse callers
  unchecked, `.windsurfrules` deleted. Full summary in subagent report this session.
- BASELINE (evidence): `npx vitest run` → 52 files, 355 passed, 78.34s (1 harmless monaco
  sourcemap warning). `npm run build` → clean in 1m39s; main 1137.53KB, monaco 2287.09KB.
- Phase 1 Gate 0 remaining: storageService.initialize · events test · toc/search containers ·
  downloadBlob. Flags/ERROR/toast/backlinks/tabs-list CLOSED by parallel session (verified).
