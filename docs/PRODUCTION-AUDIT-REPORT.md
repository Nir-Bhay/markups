# Markups — Production Readiness Audit Report

**Version audited:** 2.0.1 · **Date:** 2026-09-08 · **Mode:** source audit snapshot
**Method:** 6 parallel subagent audits + independent re-verification pass by lead agent.
Every load-bearing claim was re-checked against source before writing. Nothing below is invented.

**Status:** Historical baseline captured before the stabilization pass. It is not
the current release verdict: subsequent work added coverage support, a browser
smoke test, and production fixes. Use `GATES.md` and fresh command output for
the current status.

**Confidence labels:** `CONFIRMED` = read in source · `SUSPECTED` = likely, needs runtime proof ·
`UNVERIFIED` = could not confirm without running the app · `REFUTED` = subagent claim disproved on recheck.

**Verdict: NOT production-ready yet.** 4 × P0 blockers, 9 × P1 reliability issues, plus test and PWA gaps.
Estimated path to launch-ready: 3 phases below. Default prod entry (`src/main.js`) works today for
happy-path use; the modular entry (`src/main.modular.js` + `src/app.js`) does NOT boot correctly yet.

---

## 1. Recheck log (what changed vs the raw subagent findings)

| # | Subagent claim | Recheck result |
|---|---|---|
| 1 | Stored XSS via explorer filenames (High) | **REFUTED.** `src/features/explorer/index.js:493-496` escapes label, id and name via `escapeHtml()`. Fixed by the 2.0.1 escape work. Residual: unescaped `node.id` in `data-node-id` (`:500`) — IDs are system-generated, so severity **Low**. |
| 2 | 51 test files | **Corrected: 52** (`*.test.js`, recursive count). CHANGELOG still says 47 — stale. |
| 3 | `mermaid.initialize()` in `main.js` downgrades `securityLevel` from strict | **Softened to SUSPECTED/P2.** `src/core/markdown/index.js:228` sets `strict`; `main.js:82` calls `initialize()` without a level. Whether that resets the level depends on mermaid-11 merge semantics — not proven. `APP_CONFIG.MERMAID_CONFIG.securityLevel:'loose'` appears dead (no importer). Action stays: centralize init, delete dead config. |
| 4 | All other P0/P1 claims (flags, events, imports, backlinks, e2e, PWA, save path, bundle) | **CONFIRMED** line-by-line (evidence inline below). |

---

## 2. Context: what already happened

- `CHANGELOG.md` 2.0.1 (2026-09-06): XSS escape utility, Mermaid/KaTeX settings wiring, lint 0 errors,
  Explorer dispose, version-history teardown, modular entry made "feature-complete drop-in".
  Claims 320/320 tests, 47 files — file count now stale (52), pass count **UNVERIFIED** (suite not re-run here).
- `BUGS-FOUND.md`: B2 (editor dispose), B3 (sanitize entity bypass), B8/B9 (missing imports) fixed with tests.
- `edge-case-audit.md` HIGH items re-verified: **5 of 7 FIXED** (Promise.all→allSettled in tab delete and
  reorder, editor null guards, `editor?.getValue()`, 5 MB import cap). **Remaining:** TXT export still
  synchronous (10 MB warn-toast added, no worker), PDF/PNG CORS-taint has no fallback.
- `GATES.md`: G1–G4 pass, G5 (land/push, manual) pending.
- Snapshot working tree: clean except `D .windsurfrules` and untracked
  `.commandcode/`; this predates the stabilization changes described above.

---

## 3. Features inventory (29 dirs under `src/features/`)

Status key: **COMPLETE** · **PARTIAL** (works but shadowed/divergent) · **BROKEN** (throws on load).

| Feature | Status | Wiring (prod `main.js` vs `app.js`) | 1-line browser POC |
|---|---|---|---|
| ai-writer | COMPLETE | lazy in both; gated by `ENABLE_AI_WRITER` | `#ai-writer-button` → panel → API key → `Ctrl+Shift+A` (needs real key — UNVERIFIED e2e) |
| app-context-menu | COMPLETE | static in both | right-click editor/preview → custom menu |
| backlinks | **BROKEN** | lazy in `main.js` only; `new mod.BacklinksPanel` but module exports only `BacklinksManager` (`main.js:7711`, CONFIRMED) → throws, caught as console warn | `[[wikilink]]` panel never appears — dead feature |
| command-palette | REMOVED | Removed in the 2026-09-09 cleanup pass | Replaced by existing toolbar, shortcut, search, and slash-command workflows |
| divider | PARTIAL (shadowed) | `app.js` uses `dividerManager`; prod uses local `setupDivider()` (`main.js:7289`) | drag `#split-divider`; double-click resets 50/50 |
| explorer | COMPLETE | `main.js` only | click file → switches tab; new file/folder, filter, drag-drop reorder |
| focus | **BROKEN** | `app.js` only; `import {_storageService}` names a non-export (CONFIRMED, `:8`; storage exports only `storage`/`storageService`) → modular link fails; prod `main.js` has no focus wiring | `#focus-button` behavior UNVERIFIED on either entry |
| fullscreen | COMPLETE | `app.js` only | `#fullscreen-button` → browser fullscreen |
| goals | PARTIAL (shadowed) | `app.js` module vs inline `setupGoals()` in prod | `#goals-modal` → set target → type → progress bar |
| image-controls | COMPLETE | `main.js` only | `![a](u){width=50%}` → centered 50% image |
| image-resize | COMPLETE (6 files, `core.js` 94 KB) | lazy in `main.js` only | click preview image → resize toolbar → undo restores |
| image-upload | PARTIAL (divergent stores) | `app.js` only; prod uses separate `imageStore` (`markups-img:` refs, LRU 15) vs module data-URLs | drag-drop ≤5 MB image onto editor |
| import | PARTIAL | `app.js` module vs inline picker in prod; 5 MB guard in both | import 6 MB file → error toast; 100 KB → new tab |
| linter | **BROKEN** + shadowed | `app.js` only; `import {_markdownService}` names a non-export (CONFIRMED, `:8`); prod uses inline `runLinter()` | `#lint-button` → warnings for double-H1 (tests inline impl) |
| live-preview-edit | COMPLETE | both | Document-mode toggle → edit rendered text directly |
| mobile | COMPLETE (34 KB, largest single file) | `app.js` static + `main.js` lazy | 390 px viewport → drawer, FAB, view switcher |
| modes | COMPLETE | both | cycle Split/Editor/Preview, survives reload |
| search | PARTIAL (shadowed) | `app.js` module vs inline `setupSearch()` | `Ctrl+F` panel, replace works in Monaco |
| slash-commands | COMPLETE | lazy in `main.js` only | type `/` at line start → menu → Heading 1 |
| snippets | PARTIAL (app-only) | `app.js` only, **no** `main.js` import | `#snippets-button` → insert with `${cursor}` (UNVERIFIED in prod) |
| stats | PARTIAL (shadowed) | `app.js` module vs inline `updateStats()` | `#stats-button` → words/chars/reading-time live |
| tabs | PARTIAL (shadowed, high risk) | `app.js` module (`maxTabs=20`) vs prod `documents[]` + Dexie + `markups_last_active_tab` | `+` new tab, rename, close confirm, last-tab blocked |
| templates | PARTIAL (app-only) | `app.js` only, **no** `main.js` import | `#templates-button` gallery (UNVERIFIED in prod) |
| toc | PARTIAL (shadowed) | `app.js` module vs inline `generateTOC/updateTOC` | `# H1/## H2` → sidebar TOC → click scrolls |
| toolbar | COMPLETE (8 files) | both | bold wraps `**`; table/callout dropdowns insert |
| typewriter | PARTIAL (app-only fragment) | `app.js` only | `#typewriter-button` → cursor stays centered |
| version-history | COMPLETE | `main.js` only | edit + 60 s → snapshot → restore (max 20) |
| video-controls | COMPLETE (38 KB) | both | paste YouTube/MP4 URL → smart player + popover |
| video-discoverability | COMPLETE | `main.js` only | paste labeled YT link → convert-to-bare-URL chip |

**Structural gap (CONFIRMED):** `src/features/index.js` lazy map holds 17 features; **12 missing**
(ai-writer, app-context-menu, backlinks, explorer, image-controls, image-resize,
live-preview-edit, slash-commands, version-history, video-controls, video-discoverability).
The map is stale relative to prod: anything resolving features only through the map (modular mode)
cannot discover them. Fixing a bug in one entry does not fix the other (tabs, goals, linter, search,
toc, divider, stats all exist twice).

---

## 4. Architecture & code health

### P0 — production blockers (all CONFIRMED)

1. **FEATURE_FLAGS key mismatch.** `src/app.js:228-270` gates on `FEATURE_FLAGS.TOOLBAR/TABS/STATS/
   TOC/LINTER/SEARCH/TEMPLATES/SNIPPETS/GOALS` — none exist. `src/config/app.config.js:77-97`
   defines only `ENABLE_*` keys. Only `ENABLE_AI_WRITER` is ever honored. Modular path boots with
   toolbar/tabs/stats/toc/linter/search/templates/snippets/goals silently disabled.
2. **Dead event names.** `EVENTS.ERROR` does not exist in `src/utils/eventBus.js:144-240`
   (only `APP_ERROR`, which nobody emits/listens). `src/utils/errorHandler.js:87`,
   `src/features/tabs/index.js:118`, `src/services/autosave/index.js:197` emit `undefined`;
   `emit()` no-ops (`events.get(undefined)?.forEach`). Global/tab/autosave errors are swallowed.
   ~30 more emitted names (`EXPORT_COMPLETED` vs `EXPORT_COMPLETE`, `LINT_COMPLETED`,
   `SEARCH_COMPLETED`, `GOAL_SET`, `VIEW_MODE_CHANGED`, …) likewise miss the dict.
3. **Dual-entry drift.** `src/main.js` (7769 lines) vs `src/app.js` (655) + `src/main.modular.js` (164).
   `index.html:141` loads `main.js`; `vercel.json:5` builds monolith. Markdown stacks differ
   (hand-rolled KaTeX vs `marked-katex-extension`; hand slugify vs `gfmHeadingId`); `APP_CONFIG`
   forked (`main.js:127-131` vs config); Storehouse shim vs Dexie. Flipping entries today regresses
   (missing explorer, version-history, palette, slash, backlinks, settings/export modals in `app.js`;
   container selector mismatch `.toolbar-container` vs `#toolbar`).
4. **No global error handler on the prod path.** `main.js` wires no `error`/`unhandledrejection`
   listener; modular `errorHandler`'s notify branch is dead per P0-2. Async failures → white screen,
   no toast.

### P1 — reliability (all CONFIRMED)

5. `App.dispose()` (`app.js:620-647`) skips ~14 managers + both preview-edit controllers.
6. Explorer resize-handle listener uses inline arrow (`explorer/index.js:75`) — un-removable, leaks.
7. Version-history modal/button listeners never removed; re-init orphans intervals (`:177-200`).
8. `Subscriptions` helper adopted by ~8/20 managers; autosave, search, modes, mobile, toolbar hand-roll.
9. `listener-registry` populated only by legacy path; `App.dispose()` drains an empty set.
10. Per-keystroke un-debounced save: `main.js:904-935` calls `saveCurrentDoc()` on every
    `onDidChangeModelContent` — each keystroke does IDB `updateNote` + `renameNode` + full
    localStorage serialize + `renderTabs()` + tree sync, while `AutosaveManager` separately
    debounces at 1500 ms. Write amplification + jank. (Preview convert is correctly debounced.)
11. Duplicate channels: `DOCUMENT_SAVED`/`DOC_SAVED` both `'doc:saved'`; `EXPORT_*`/`LINT_*` forks.
12. `storehouse-compat` MD5 shim splits persistence (session vs local by `expire`) during migration.
13. `focus` + `linter` broken named imports (see §3) — modular link-time failure.

### P2 — hygiene

14. Mermaid init fragmentation (see §1 recheck #3). 15. Stale `APP_CONFIG` fork in `main.js`.
16. `errorHandler` has no `dispose()` (HMR double-register, SUSPECTED minor).

**Highest-leverage move:** freeze `main.js` as legacy, ship `app.js` + `main.modular.js` — gated on
(a) aligning `FEATURE_FLAGS` keys, (b) a unit test asserting every referenced `EVENTS.*` exists.
Those two cheap gates would have caught P0-1 and P0-2 at commit time.

---

## 5. Testing & quality gaps

- **52 unit test files** (CONFIRMED by count). Covered: storage ×4, markdown/sanitize/gates,
  export-markdown + html-offline, autosave, backlinks, palette, slash, toc, linter, snippets,
  templates, search panel, live-preview-edit, image-resize/utils/history, video ×6, a11y ×7, utils.
- **Zero tests (CONFIRMED gaps):** `core/editor` (Monaco init — single point of failure),
  `services/export/{pdf,docx,index}` (heaviest user paths, CORS taint), `services/{pwa,shortcuts}`,
  `features/{tabs,toolbar,import,image-upload,ai-writer,focus,fullscreen,goals,typewriter,modes,
  mobile,divider}`, explorer CRUD/drag-drop (only dispose tested), version-history snapshot/restore,
  all of `main.js`/`app.js` wiring.
- **Coverage config hides this:** `vitest.config.js:9-12` scopes coverage to `core/storage/**` +
  `utils/**` only. Test mocks (`setup.js` CONFIRMED): `fake-indexeddb/auto` + localStorage
  Map-polyfill + KaTeX standards-mode fix — proves logic, not durability/quota/upgrade behavior.
- **E2E at snapshot: zero.** `tests/` was empty (0 entries, CONFIRMED);
  `playwright.config.js` pointed at
  non-existent `tests/e2e`. `npm run test:e2e` has nothing to run.
- **Manual QA gate (must run before any production push):** fresh load → type `# Hi` (<500 ms,
  no console errors) · create/rename/delete note · folder with 3 notes → delete (both confirms) →
  reload · drag-drop reorder 5 tabs → reload persists · import 6 MB (reject toast) + 100 KB (loads) ·
  export PDF/PNG/HTML/DOCX/TXT on doc with remote `https://` image · Mermaid/KaTeX toggles without
  reload · offline reload (app shell loads) · 390 px viewport drawer/FAB · rapid-type 60 s +
  autosave indicator + history entry · `Ctrl+H` with help modal absent (no shortcut breakage).
- **Top-ROI test additions:** tab/folder delete regression (locks in allSettled fix) · reorder
  persistence · 5 MB import guard (+ uncapped `importFromURL`) · export dispatcher with mocked
  html2pdf/CORS throw → toast · first Playwright smoke spec (load→type→preview→tab→TXT download).

---

## 6. Security

`npm audit --omit=dev`: **0 vulns / 139 prod deps** (read-only run). `SECURITY.md §8` "known unfixed
html2pdf 0.12.x" is **stale** — lockfile already on fixed `html2pdf 0.14.0` / `jspdf 4.2.1`. No
hardcoded secrets (regex scan; entropy scan not done).

| Issue | Severity | Evidence | Fix |
|---|---|---|---|
| Toast `innerHTML` injection via filename | Medium | `src/ui/toast/index.js:219-224` unescaped; `src/features/import/index.js:90,104` embeds `file.name` (CONFIRMED) | escape title/message or use textContent |
| AI key in plaintext localStorage + custom-endpoint follows key | Medium | `ai-writer/service.js:534-559` + `storage/index.js:53-60` (CONFIRMED); no allowlist/confirm for custom endpoint | session-only option, consent dialog, document CSP limits |
| CSP `unsafe-inline`/`unsafe-eval`, preview not sandboxed | Medium (magnifier) | `vercel.json:21` (CONFIRMED); preview `#output` same-origin, no `<iframe sandbox>` | nonce roadmap, sandbox preview, `report-to` |
| Explorer `data-node-id="${node.id}"` unescaped | Low | `:500` (CONFIRMED); IDs system-generated | escape for completeness |
| Import allowlist declared (`:23`) but never enforced; `importFromURL` uncapped/allowlist-free | Low-Medium | `import/index.js:23` vs `:86-143` (CONFIRMED) | enforce extension+MIME+size; gate URL import |
| AI settings `value="${...}"` interpolation (self-XSS) | Low-Medium | `ai-writer/ui.js:325-347` | escape all `value=` |
| Sanitizer itself | — | DOMPurify strict profile + fallback + entity-decoding scheme block (CONFIRMED, solid) | keep; add tests per new sink |

**Must-fix before production:** escape toast sinks · reduce preview-XSS blast radius (sandbox or move
keys out of localStorage) + CSP `report-to` · AI key consent/allowlist. Note: deployed CSP
`connect-src` allowlists only api.openai.com/api.anthropic.com (+google) — custom/Ollama endpoints
are silently broken in prod (functional bug + partial exfil mitigation).

---

## 7. Performance & build (real `dist/` numbers, CONFIRMED)

| Chunk | Size | When loaded |
|---|---|---|
| monaco-editor | 2241.5 KB | first paint (eager) |
| main entry | 1110.8 KB | first paint |
| pdf-html2pdf / pdf-html2canvas | 752.3 / 394.4 KB | lazy ✓ |
| mermaid diagram pool (~25 chunks) | ~1800 KB total | lazy ✓ |
| katex-vendor | 255.2 KB | first paint (eager) |
| editor.worker | 225.9 KB | editor init |
| KaTeX fonts | ~500+ KB (ttf+woff+woff2 triplicated) | first paint if math present |

Estimated first-paint JS ≈ **3.6–3.9 MB**. Build splitting is well-designed (mermaid/PDF/find lazy),
undermined by the eager path. `chunkSizeWarningLimit: 2400` (default 500) silences all warnings and
no bundle-size CI gate exists — regressions ship silently. `external:['monaco-vim']` + dynamic
`import('monaco-vim')` (`main.js:5519`) with no importmap — vim mode likely 404s in prod (SUSPECTED,
verify built output).

Render path: 300 ms debounce + stale-token guard + double-rAF = good; `shouldRenderMermaid` gate =
good; `shouldRenderKatex` strips KaTeX DOM **after** `marked.parse` already rendered it = wasted CPU;
mermaid re-runs all diagrams per keystroke (no per-diagram cache); scroll-sync full layout scan per
render (mitigated 120 ms + rAF). No Monaco large-file options (`stopRenderingLineAfter`,
`largeFileOptimizations` unset); paste path uncapped (SUSPECTED freeze vector); live-preview-edit
full-serialize fallback guarded only above 50 MB.

**Top 3 perf must-dos:** single debounced save path (biggest jank) · lazy-load mermaid+katex behind
existing gates + strict warning limit + size CI gate (~1–1.5 MB off critical path) · large-doc safety
(paste caps, Monaco opts, KaTeX gate ordering, mermaid per-diagram cache). Also: ship woff2-only fonts.

---

## 8. PWA · SEO · a11y · deploy

- **PWA PARTIAL.** Manifest linked; SW update interval 30 min; hand-rolled `public/sw.js` (no Workbox,
  precaches only `/, /index.html, /favicon.png`, no offline fallback page). **Install/update UI dead:**
  `#pwa-install-button` / `#pwa-update-banner` referenced in `pwa/index.js` but present in **zero**
  HTML files (CONFIRMED) → update flow degrades to console log. **Asset gaps (CONFIRMED):** both
  192+512 icons → one 1690-byte `/favicon.png`; `/image/screenshot.png` missing (`public/image/` has
  only `og-image.svg`, `sample.webp`, GitHub webp); `apple-touch-icon` → SVG (iOS needs PNG);
  `/images/*` vs `/image/*` mismatch across sitemap/manifest/JSON-LD.
- **SEO PARTIAL.** Meta/OG/Twitter/canonical + JSON-LD present; 19 HTML pages ship (index, 404,
  license, landing, 14 seo, incl. tutorials); no app-shell duplication; no bad noindex/redirects.
  Gaps: **dual sitemaps drift** (root rich vs `public/` minimal), `llms.txt` version drift
  (root June vs public April, image locs point at 404 PNGs), OG images are **SVG** (poor unfurl on
  X/FB/LI), `robots.txt` has harmless Next.js leftovers. `docs/seo-geo/` + `MASTER-BACKLOG.md`
  **do not exist** — the AGENTS.md SEO/GEO mandatory workflow is unexecutable as written (process gap).
- **a11y READY-ish.** Modal `role=dialog` + focus trap wired across 6+ call sites, skip links + tests,
  toolbar aria-labels. Contrast + full popover roles + shortcut discoverability UNVERIFIED (no axe/Lighthouse run).
- **Deploy.** Vercel builds monolith (`npm run build`), cleanUrls, correct SW/manifest cache headers.
  Docker path unequal: nginx image lacks SPA fallback + header parity → 404s on clean URLs like
  `/landing` outside Vercel. Node ≥18 honored both.

**Top 5 launch blockers (this area):** real PNG icons (192+512, maskable) + screenshot + PNG
apple-touch-icon · wire install/update UI into HTML · unify sitemap/llms.txt + PNG OG image ·
Docker nginx fallback+headers parity · fix or suspend the SEO/GEO workflow rule.

---

## 9. Launch gates & phased roadmap

**Gate 0 — P0 fixes (ship nothing until green):** align `FEATURE_FLAGS` keys · add `EVENTS.ERROR`
(or migrate to `APP_ERROR`) + events-existence unit test · fix `focus`/`linter` imports +
`backlinks` export mismatch · wire global error handler into `main.js`.
**Gate 1 — harden:** toast escaping · AI-key consent/session option · single debounced save path ·
tab-delete/reorder/import/export regression tests · first Playwright smoke spec · 10-step manual QA.
**Gate 2 — optimize & launch:** lazy mermaid/katex · bundle-size CI gate · woff2-only fonts ·
PWA assets + install/update UI · sitemap/llms/OG unification · Docker parity · axe/Lighthouse pass.
**Explicitly deferred (documented, not forgotten):** TXT-export worker offload · PDF CORS blob-proxy
fallback · nonce-CSP · Workbox migration · Storehouse-shim sunset telemetry · `importFromURL` caps.

## 10. Scorecard

| Area | Status |
|---|---|
| Happy-path editing (default entry) | Usable |
| Modular entry boot | Broken (P0-1) |
| Error visibility | Broken (P0-2/4) |
| 4 named features (backlinks, focus, linter-module, snippets/templates in prod) | Dead or shadowed |
| Unit tests (covered areas) | Strong (52 files) |
| E2E coverage | None |
| Security baseline (sanitizer, headers, audit) | Solid, 3 must-dos open |
| Perf baseline (splitting, debounce) | Good design, 3 must-dos open |
| PWA installability | Broken assets+UI |
| SEO/deploy (Vercel) | Near-ready, content-drift fixes open |

*Report written from source reads only. Behavioral claims marked UNVERIFIED/SUSPECTED need a browser
run to promote. Re-verify Gate 0 with: `rg "FEATURE_FLAGS\." src --no-filename -o | sort -u` vs config
keys, a events-existence test, `vite build --mode modular` + smoke, and the §5 QA list.*

---

## 11. Recheck addendum (late 2026-09-08 — parallel session landed fixes)

Recheck found a parallel session actively fixing the tree (30 files modified, `AI-DOCS/` created,
`tests/e2e/smoke.spec.js` added, `dist/` rebuilt). **Resolved:** FEATURE_FLAGS alignment ·
`EVENTS.ERROR` defined · focus/linter bad imports · toast `textContent` · backlinks wiring ·
`#tabs-list` in HTML · first e2e smoke spec · explorer labels escaped (no stored XSS).
**Still open:** `storageService.initialize()` missing (modular boot still throws) ·
`downloadBlob` docx crash · `#toc-container`/`#search-container` mismatch · dead bus traffic ·
unlinked `style.css` + repro page in `dist/` · save-path split-brain · title clobber.
Verdict stands: NOT production-ready, but P0 list is now shorter — Gate 0 is
`storageService.initialize` + events-existence test + container-ID alignment.
