# Markups — Code Review: Structure, Flow, Algorithms, Dead Code

**Date:** 2026-09-08 · **Mode:** research-only, zero code changes
**Method:** 6 parallel code-flow reviews + independent re-verification of every load-bearing claim.
**Line counts below are ground truth via `node split('\n')`** — PowerShell `Measure-Object` undercounts
this repo (long lines), and older docs (AGENTS.md "1980 lines", "7746 lines") are stale.

**Labels:** `CONFIRMED` = read in source · `SUSPECTED` = likely, needs runtime proof ·
`UNVERIFIED` = static analysis only · `REFUTED` = claim disproved on recheck.

## 0. Recheck log (corrections to review-agent findings)

| # | Agent claim | Recheck |
|---|---|---|
| 1 | Backlinks broken (`new mod.BacklinksPanel` from index.js) | **REFUTED.** Current `main.js:7730-7749` imports both `backlinks/index.js` AND `backlinks/panel.js` via `Promise.all`, constructs `BacklinksManager` + `BacklinksPanel` correctly. Residual: panel has zero tests, wikilink UX thin. |
| 2 | `main.js` 7746/7797 lines, `app.js` 655, `index.html` 1980 | **Corrected:** `main.js` 7798, `app.js` 656, `index.html` 2540 (node counts). |
| 3 | KaTeX fonts triplicated in dist | **REFUTED.** Single hashed copies. No action. |
| 4 | Some `setup*` may be dead | **REFUTED.** All ~50 `setup*` in `main.js` are called exactly once. None dead. |
| 5 | `monaco-vim` external = broken | Softened: `await import('monaco-vim')` exists (`main.js:5558`), resolves at runtime — **UNVERIFIED** in built output. |
| 6 | Everything else (flags, events, imports, save path, sizes, PWA, e2e) | **CONFIRMED** line-by-line. |

---

## 1. Code structure map (verified sizes)

```
index.html (2540 lines, UI shell, loads /src/main.js:141)
src/main.js (7798 lines) ......... PROD entry: monolith, ~50 setup*, inline everything
src/app.js (656 lines) ........... modular orchestrator: core→UI→features→services
src/main.modular.js (165 lines) .. modular shim: vendor env + app.initialize()
src/core/editor/index.js (461) ... Monaco service (bypassed in prod)
src/core/markdown/index.js (596) . MarkdownService (preview-dead in prod; used by exports)
src/core/storage/ (5 files) ...... Dexie + namespaced localStorage + migration
src/features/ (29 dirs) .......... product features; 12 missing from features/index.js map
src/services/export/ (5 files) ... md/html/pdf/docx dispatcher (docx import broken)
src/services/{autosave,shortcuts,pwa}
src/ui/{toast,modal,theme,loading,autosave}
src/utils/ (17 files) ............ eventBus, sanitize, scroll-sync, video-embed...
src/config/app.config.js ......... APP_CONFIG + FEATURE_FLAGS (mostly decorative)
```

---

## 2. Boot flow (prod path)

`window load` (`main.js:7781`) → `initializeApp()` (`:7567`): themes → localStorage/imageStore preload →
`setupEditor()` (sync `monaco.editor.create('#editor')`, `:898`) → flush `pendingEditorActions` (only
pre-load file imports; `EDITOR_READY` exists **only in comments**, no event) → `presetValue()` →
~50 `setup*` in fixed order (toolbar → buttons → scroll/focus/typewriter/fullscreen/view →
live-edit/video/image controls → `await initTabs()` first Dexie touch → search/linter/goals/shortcuts)
→ fire-and-forget lazy imports (palette, image-resize, slash, backlinks, ai-writer; failures only
`console.warn`) → `updateStats`, breadcrumb, quick-tabs, context-menu, deferred `editor.focus()`.
PWA `sw.js` registers on a separate load listener. Teardown: two `pagehide` handlers clean blob URLs +
context-menu/backlinks/version-polling only.

**Modular path:** `main.modular.js:101` → `app.initialize()` → containers → `_initCore`
(errorHandler → `storageService.initialize()` → migration → editor → markdown) → `_initUI` →
`_initFeatures` → `_initServices` → listeners → content → `APP_READY`.

**Init-ordering faults (CONFIRMED):**
- **P0:** `app.js:172` calls `storageService.initialize()` — method does not exist anywhere in
  `src/core/storage/index.js` (grep: zero hits). Modular boot throws before migration/editor run.
- **P0:** container mismatch — `app.js:144-147` + `main.modular.js` expect `#tabs-list`,
  `#toc-container`, `#search-container`; `index.html` has `#header-quicktabs` (`:456`),
  `#toc-sidebar` (`:1094`), `#search-overlay` (`:1202`). Features silently skip; shortcuts still bind.
- **P0:** `FEATURE_FLAGS.TOOLBAR/TABS/...` (`app.js:228-270`) match no `ENABLE_*` key in config —
  modular boots featureless except AI Writer.
- Prod tolerates missing `#tabs-list` via null guard (`main.js:482-483`) — no crash, pattern worth copying.

## 3. Editor change pipeline (keystroke → pixels)

```
keystroke → onDidChangeModelContent (main.js:904)
 ├─ welcome-clear branch → debouncedConvert 300ms → convert() (main.js:2151):
 │   resolveImageReferences → regex strips → marked.parse (sync O(n)) →
 │   DOMPurify sanitize → stale-token guard → rAF#1: innerHTML, KaTeX-strip-if-off,
 │   annotateSourceLines (O(lines), rect reads), images, videos(reuse map), controls →
 │   rAF#2: mermaid.run batch, copy buttons, setTimeout0: TOC+outline rebuild,
 │   highlight pass, scroll-sync rebuild (coalesced 120ms+rAF, binary-search interp)
 ├─ debouncedSaveCurrentDoc 1500ms → IDB updateNote + renameNode + full localStorage
 │   serialize + renderTabs() full rebuild + tree sync (no dirty check)
 └─ updateStats SYNC (~7 regex/split passes + DOM writes, main.js:2567-2623)
```

**Costs:** `getValue()` ×2-3 per keystroke (O(n) each); stats unthrottled (heaviest sync work);
save debounced but fan-out heavy; convert well-guarded (token + double-rAF) but full-parse,
no per-diagram mermaid cache, TOC/outline rebuilt without diffing, `annotateSourceLines` runs twice
with mermaid and does layout-thrashing rect loops; images re-attach listeners per render (videos
correctly reuse via Map). Scroll-sync anchor-map + echo-lock design is genuinely good. Live-preview-edit
prefers block-sync (good) with a 50 MB fallback guard (threshold far too high). Typewriter registers
two `revealLineInCenter` listeners per cursor move; cursor-sync ratio math fights scroll-sync anchor
math; fullscreen lacks `editor.layout()` on toggle.

## 4. Markdown pipeline (two that disagree)

Live preview is served by `main.js convert()`, NOT `MarkdownService` (dead for preview in default
bundle; used by exports + modular path). `main.js:93` imports the service but never initializes it —
inert today, double-registration hazard if both ever init (`marked` is a global singleton).

| Area | `main.js` (live) | `markdownService` (exports/modular) |
|---|---|---|
| KaTeX | `marked-katex-extension`, `output:'html'`, DOM-strip when off (wasteful) | hand-rolled tokenizer, `output:'htmlAndMathml'` (accessible); fragile `$` regexes (escaped `\$`, currency UNVERIFIED) |
| Headings | custom renderer + anchors + `tocItems` side effect; hand slugify | `gfmHeadingId()`; `extractTOC` regex reads fenced code (false entries), ASCII-only slug, no dedupe → dup ids |
| Images | escape-only renderer + resize-state restore | hide/show only |
| Mermaid | batch `mermaid.run`, token-guarded, gated; init lacks `securityLevel:'strict'` | sequential `for…await` (N serial renders/keystroke), `strict` + SVG re-sanitize, no cancel token |
| Prism | 22 langs, unknown→raw | 17 langs, unknown→plaintext |
| Video | reuse maps + attrs (no flicker) | defaults only (reloads per keystroke) |
| Toggles | `currentSettings` + preview-gates actually gate | `setKatexEnabled/setMermaidEnabled` write flags nothing reads |

**Sanitizer verdict: sound.** DOMPurify strict profile (forbids iframe/script/object/embed/form/
video/source, style/srcdoc, data-attrs) + fallback sanitizer always runs second + entity-decoding
`javascript:`-scheme block (tested). Iframes for video built via DOM with fixed
`youtube-nocookie`/`player.vimeo` URLs + sandbox. Residual: three call-site configs can drift;
SVG-`<style>`-in-re-sanitize vs global `style`-attr ban deserves one test.

## 5. Storage & data flow (split-brain)

`Monaco model` (transient truth) → `documents[]` (UI truth) → **two** durable writers on ~1500 ms
debounce: `saveCurrentDoc` (content+title, IDB + tree rename + full localStorage MD5 mirror +
`renderTabs()` + tree sync) and `AutosaveManager` (content-only IDB). Last-writer-wins, no lock,
no generation counter. Boot restores Dexie → tree → `documents[]`, with Storehouse-MD5 fallback
that can resurrect stale docs. Migration scans literal `com.markdownlivepreview.*` keys while live
writes are MD5-hashed — migrator may find 0 docs and mark complete while the mirror grows.

Schema indexes match queries except compound `[parentId+order]` (defined, never used — in-memory
sort instead) and dead `note_versions` table (version-history uses localStorage, max 20, 60 s poll,
destructive restore behind `confirm()`, teardown likely uncalled). `reorderNode` is non-transactional
(half-persisted order on partial failure); `moveNode` lacks cycle check (SUSPECTED orphan risk);
`updateNote` costs update+get; title auto-derives from first `#` line each save — **clobbers custom
tab renames** (rename touches only `documents[]` + localStorage). Autosave with null `_activeNoteId`
reports `saved` while writing nothing; `beforeunload` async IDB write doesn't block (last-keystroke loss).

## 6. Feature flows (sharpest risk each)

- **Toolbar:** dispose chain + prefixLine batching GOOD. `wrapSelection` multi-line unwrap math is
  cross-line bogus — can corrupt edge chars (worst algorithm bug in features). Callout paste only
  prefixes first line; table picker `0×0` via keyboard; no video entry (lives in `main.js`).
- **Tabs:** prod Dexie+tree path careful (folder double-confirm, allSettled cleanup, image prune).
  Quota-trim slices array only — orphans tree/note rows, tabs↔explorer fork forever. Two renames,
  two last-tab policies, three tab caps (20/50/5).
- **Export:** lazy heavy deps + print path GOOD. **Three** TXT pipelines (preview ≠ output);
  DOCX writes `.doc` not `.docx` + unescaped `<title>` (+`:4638`, HTML `:4419`); SVGs silently
  skipped; services `export/docx.js` **import-crashes** (`downloadBlob` doesn't exist in
  `utils/file.js` — CONFIRMED); dispatcher lacks `toDOCX`; live exports can snapshot stale preview.
- **AI writer:** stream parsing robust (both providers non-fatal, abort/cancel clean). `8000`-char
  context constant dead — real truncation scattered (2000/3000/±500, no user signal); `sendMessage`
  returns `{error}` object vs string; key in plaintext localStorage; custom endpoint unfettered
  (and CSP-broken in prod).
- **Images/video:** upload guards + SVG sanitize + LRU/revoke GOOD. Dual stores (refs vs data-URLs);
  attr-parser regexes copy-pasted across 3 modules; any copy path forgetting
  `resolveImageReferences` ships dead `markups-img:` URIs.
- **Search/palette/slash/snippets/templates:** Ctrl+F double-bound (last wins, one system dead);
  palette actions are `getElementById().click()` proxies (brittle) + leaked key listener;
  `${cursor}` deleted not positioned; templates expand nothing. **Word count exists 5+ times**
  (footer/toolbar/goals/history/export disagree by construction). Linter rules reasonable;
  TOC feature extractor fence-aware but prod may use DOM-query copy.

## 7. GOOD — keep and protect

Single deferred module entry + async analytics; sync editor-first boot with Dexie awaited before
prune; lazy non-critical imports with `.catch(warn)`; convert debounce + stale-token + double-rAF;
preview gates; video reuse maps; scroll-sync anchor-map/binary-search/echo-lock; block-level
live-edit sync + idempotency; transactional `bulkAdd`; allSettled cascade deletes; upload guards +
SVG sanitize + image LRU/revoke; dual-provider AI with non-fatal streams; sanitizer + fallback +
scheme tests; modal roles + focus trap + skip links; per-format export toasts + print handling;
52 unit test files over storage/markdown/sanitize/video/a11y.

## 8. BAD — fix, ordered

**P0:** `storageService.initialize` missing · flags mismatch · `EVENTS.ERROR` + ~30 dead event names
(errors swallowed) · no global handler on prod path · container-ID mismatch.
**P1:** per-keystroke save fan-out + dual-writer split-brain · title clobber · quota orphaning ·
sync `updateStats` · `wrapSelection` multi-line corruption · TXT preview≠output · DOCX title
injection + `.doc` ext + `downloadBlob` crash · toast filename injection · AI key plaintext +
unbounded-effective context · PDF CORS no-fallback · mermaid no-cache + KaTeX-strip waste +
TOC no-diff + annotate×2 · typewriter double-listener · fullscreen no-layout · search double-bind ·
5 word-counts · `reorderNode` non-atomic · `beforeunload` loss · version-restore destructive.
**P2:** mermaid init fragmentation · APP_CONFIG fork · dead MERMAID_CONFIG/loose flag ·
errorHandler no-dispose · `Subscriptions` 9/27 adoption · registry legacy-only.

## 9. EXTRA / unnecessary — remove (safe first)

1. `repro-toolbar-issue.html` — dev repro **shipped in dist** (19 html pages CONFIRMED). Safe delete.
2. `public/css/style.css` (~215 KB) — zero `<link>` anywhere (only premium-ui + video-controls +
   github-markdown-light linked). Safe delete after visual pass. Same for
   `public/css/github-markdown-light.css` (npm copy imported via JS).
3. `MERMAID_CONFIG`, `BREAKPOINTS`, `ANIMATIONS` — zero importers. Safe.
4. Dead bus traffic — `IMPORT_STARTED/COMPLETE/FAILED`, `DIVIDER_CHANGED`, `FILE_IMPORTED`,
   `AI_GENERATION_*`/`AI_SETTINGS_CHANGED` emits, `EXPORT_*` (zero listeners): delete or wire.
   Collapse alias dupes (`DOC_SAVED`, `LINT_COMPLETE`, `EXPORT_COMPLETE`).
5. Canonicalize `sitemap.xml`/`robots.txt`/`llms.txt` (root richer than `public/`; image locs 404).
6. Fix-or-delete `services/export/docx.js` `downloadBlob` breakage.
7. Decide ONE entry before touching any manager/`FEATURE_FLAGS` — 12 feature singletons +
   `app.js`/`main.modular.js` are dead weight under the default entry but load-bearing for modular
   + tests. Dual-entry drift, not pure dead code: do not delete piecemeal.

## 10. Unimportant — deliberately defer

TXT-export worker · PDF CORS blob-proxy · nonce-CSP · Workbox · shim-sunset telemetry ·
`importFromURL` caps · rare Prism langs diet (measure first) · `note_versions` table drop (harmless) ·
`console.*` trim (mostly warn/error + intentional logs; `debugger` already stripped by esbuild) ·
landing-vs-seo dedup (distinct audiences) · `pagebreak legacy` (API string, not fossil).
Zero `TODO/FIXME/HACK/XXX` in `src` (one TODO in `html.js:230`); `main.js` comments are section
headers, not commented-out code.

## 11. Verification commands (re-check anything here)

```powershell
node -e "const s=require('fs').readFileSync('src/main.js','utf8');console.log(s.split('\n').length)"
Select-String -Path src\core\storage\index.js -Pattern 'initialize'        # expect: zero
Select-String -Path src -Pattern 'FEATURE_FLAGS\.(TOOLBAR|TABS|STATS)'     # vs ENABLE_* in config
Select-String -Path src\utils\file.js -Pattern 'downloadBlob'             # expect: zero
Select-String -Path index.html -Pattern '<link.*style\.css'               # expect: zero
Select-String -Path src\main.js -Pattern 'tabsManager|goalsManager|linterManager'  # expect: zero
node -e "console.log(require('fs').readdirSync('tests').length)"          # expect: 0 (no e2e)
```

*Companion doc: `docs/PRODUCTION-AUDIT-REPORT.md` (launch gates, scorecard, manual QA list).
Behavioral SUSPECTED/UNVERIFIED items need one browser session to promote — cheapest next step
after Gate 0 fixes.*

---

## 12. Recheck addendum (late 2026-09-08 — tree changed during audit)

A parallel session edited the tree mid-audit (`main.js` 7798→7639 lines, `dist/` rebuilt,
30 files modified, `AI-DOCS/` + `tests/e2e/smoke.spec.js` + `storehouse.test.js` added).
Re-verified each claim against the **current** tree via automated scripts (54 `setup*` defs each
called exactly once; 52 test files; 39 single-copy woff files). Status changes:

**FIXED since first pass (verified, no longer blockers):**
- `FEATURE_FLAGS` key mismatch — `app.js:228-310` now uses `ENABLE_*`, config has matching keys.
- `EVENTS.ERROR` — now defined (`eventBus.js:148`). (Other ~30 dead names still need the
  events-existence test.)
- `focus`/`linter` broken named imports — gone from both files.
- Toast injection — `toast/index.js:236-238` now uses `textContent`.
- Backlinks wiring — dual import + correct construction (`main.js:7730-7749`).
- `#tabs-list` — added to `index.html:457`. `#toc-container` / `#search-container` still absent
  (`#toc-sidebar`, `#search-overlay` exist instead) — container mismatch now partial.
- E2E — `tests/e2e/smoke.spec.js` exists (9-line shell test). Gap now "minimal" not "zero".

**STILL OPEN (re-confirmed current):** `storageService.initialize()` called but nonexistent
(`app.js:172`) · `downloadBlob` import crash (`export/docx.js:9`) · `DIVIDER_CHANGED` /
`IMPORT_*` dead traffic · `MERMAID_CONFIG`/`BREAKPOINTS`/`ANIMATIONS` def-only ·
`repro-toolbar-issue.html` + unlinked `public/css/style.css` still shipped in `dist/` ·
per-keystroke save fan-out · title clobber · explorer `data-node-id` unescaped (Low).

**Warning:** line numbers in §§2-6 are as-of this audit and already drifting — re-grep before fixing.
