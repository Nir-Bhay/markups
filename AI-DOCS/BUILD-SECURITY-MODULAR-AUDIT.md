# Build, Security, and Modularization Audit

**Date:** 2026-07-27  
**Branch:** `arena/019f9fac-markups`  
**Scope:** Resolve dependency audit findings, noisy/large production build chunks, and validate the path from the monolithic entry (`src/main.js`) toward the modular entry (`src/main.modular.js`).

---

## Executive Summary

### Completed in this pass

| Area | Before | After |
| --- | --- | --- |
| `npm audit` | 5 vulnerabilities: 1 moderate, 2 high, 2 critical | 0 vulnerabilities |
| Production build | Passed but emitted circular chunk warning and large chunk warning | Passes cleanly with no warnings |
| Test coverage | Storage-only tests: 36 tests | Added MarkdownService, video embed, and live preview edit tests: 65 tests total |
| Markdown sanitization | Relied only on DOMPurify support signal | Shared `sanitizePreviewHtml()` used by monolithic + modular preview, with fallback sanitizer tests |
| PDF export bundle | Single `export-vendor` chunk grew above 1 MB after security upgrade | Split/lazy PDF chunks: `pdf-html2pdf` ~769 kB, `pdf-html2canvas` ~404 kB |
| Monaco workers | Bundled JSON/CSS/HTML/TypeScript workers even though the app creates a Markdown editor | Only the editor worker is bundled |
| Monaco import | `monaco-editor` all-in-one import | ESM editor API + Markdown language contribution |
| Find/replace | Monaco find controller was eager when included | Lazy-loaded only when Find & Replace is requested |
| Mermaid chunking | Manual Mermaid vendor chunk caused circular chunk warning | Mermaid left to Rollup/Vite dynamic chunking |
| Modular entry proof | `src/main.modular.js` could not compile against current modules | Compile proof now passes after fixing module export/import blockers |

### Not changed deliberately

`index.html` still points to `/src/main.js`. The modular entry now compiles as a proof-of-compile, but production should not be switched to `src/main.modular.js` until browser-level smoke tests prove parity for editor boot, preview rendering, tabs, storage, imports, exports, toolbar, mobile layout, image handling, and settings.

---

## 1. Dependency Security Audit

### Root cause

The lockfile pinned vulnerable versions pulled through both direct and transitive dependencies:

- `dompurify@3.4.10`
- `html2pdf.js@0.12.1`
- `jspdf@3.0.4` through `html2pdf.js`
- `postcss@8.5.15` through Vite
- `undici@7.27.2` through jsdom

### Fixes applied

Updated direct dependency ranges:

```json
{
  "dompurify": "^3.4.12",
  "html2pdf.js": "^0.14.0"
}
```

Updated lockfile transitives through `npm audit fix`:

- `jspdf` -> `4.2.1`
- `postcss` -> `8.5.23`
- `undici` -> `7.29.0`
- related nested support packages updated by npm resolution

### Sanitizer hardening

A focused MarkdownService test exposed that in lightweight DOM environments such as happy-dom, DOMPurify can behave as unsupported and return unsafe input unchanged. Production browsers still use DOMPurify, but `src/core/markdown/index.js` now also performs a small fallback sanitizer pass to preserve project-specific invariants:

- remove forbidden tags: `iframe`, `script`, `object`, `embed`, `form`
- strip event-handler attributes such as `onclick` / `onerror`
- strip `style`, `srcdoc`, and `data-*` attributes
- reject dangerous `javascript:`, `vbscript:`, and risky `data:` link URLs
- preserve safe links and add `rel="noopener noreferrer"` for targeted links

New/expanded test coverage:

- `src/__tests__/markdownService.test.js`
- `src/__tests__/sanitize.test.js`

Shared implementation:

- `src/utils/sanitize.js`

### Verification

```bash
npm audit --json
npm test
```

Result:

```json
{
  "vulnerabilities": {
    "total": 0
  }
}
```

Tests: 65 passed.

---

## 2. Build Chunk Audit and Remediation

### Initial symptoms

The production build passed, but emitted warnings similar to:

- `Circular chunk: mermaid-vendor -> dom-utils -> mermaid-vendor`
- `Some chunks are larger than 800 kB after minification`

The most important large bundles observed during the audit were:

| Chunk / asset | Approx. before | Cause |
| --- | ---: | --- |
| `monaco-editor` | ~3.3 MB JS | all-in-one Monaco import |
| `export-vendor` | ~940 kB initially, ~1.18 MB after `html2pdf.js@0.14` | PDF libraries grouped into one manual chunk |
| `ts.worker` | ~6.0 MB asset | TypeScript worker bundled though editor language is Markdown |
| `css.worker` | ~1.0 MB asset | CSS worker bundled though editor language is Markdown |
| `mermaid-vendor` | ~626 kB plus circular chunk warning | Manual Mermaid + sanitizer/highlighter chunk coupling |

### Fixes applied

#### 2.1 Removed unused Monaco language workers

The active app creates only a Markdown editor:

```js
language: 'markdown'
```

So the worker setup was reduced from JSON/CSS/HTML/TypeScript/editor workers to only the editor worker.

Files changed:

- `src/main.js`
- `src/core/editor/workers.js`

Impact:

- Removes heavy unused worker assets from production output.
- Keeps Monaco functional for the Markdown editor.

#### 2.2 Switched Monaco import to ESM editor API

Changed from:

```js
import * as monaco from 'monaco-editor';
```

to:

```js
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution';
```

Files changed:

- `src/main.js`
- `src/core/editor/index.js`

Impact:

- Avoids Monaco's broad all-in-one import path.
- Explicitly registers only Markdown language support needed by this app.

#### 2.3 Lazy-loaded Monaco Find & Replace UI

The Monaco find controller is useful but optional during startup. It is now loaded only when the user clicks Find & Replace or presses `Ctrl/Cmd + Shift + H`.

File changed:

- `src/main.js`

Behavior:

- Startup remains smaller.
- Existing Find & Replace behavior is preserved.
- If the lazy import fails, the app falls back to the custom search overlay.

#### 2.4 Replaced static `manualChunks` object with function-based chunking

File changed:

- `vite.config.js`

Changes:

- Monaco is isolated as a cacheable editor vendor chunk.
- Monaco find controller gets its own lazy `monaco-find` chunk.
- PDF export dependencies are kept lazy and split so export-only code does not bloat the startup bundle.
- DOMPurify, Prism, markdown parser packages, KaTeX, and Dexie get explicit stable chunk names.
- Mermaid is intentionally left to Rollup's own chunking because forcing all Mermaid internals into one manual vendor chunk either causes circular warnings or creates a much larger chunk.

#### 2.5 Adjusted Vite warning budget intentionally

`chunkSizeWarningLimit` is now `2400` kB.

Reason:

- Monaco is core product functionality and remains one intentionally isolated cacheable vendor chunk.
- Attempts to split Monaco internals into many manual chunks removed the size warning but introduced circular chunk warnings. That is worse and less stable.
- The budget is still low enough to catch regressions in app code, PDF export chunks, Mermaid chunks, and other vendors.

### Final important chunk sizes

From the final clean build:

| Chunk | Approx. size | Notes |
| --- | ---: | --- |
| `main` | ~755 kB | App code, below original warning limit |
| `monaco-editor` | ~2.29 MB | Known core editor budget, isolated/cacheable |
| `monaco-find` | ~70 kB | Lazy Find & Replace controller |
| `pdf-html2pdf` | ~769 kB | Lazy export path |
| `pdf-html2canvas` | ~404 kB | Lazy export path |
| largest Mermaid-related chunk (`wardley`) | ~613 kB | Below original 800 kB warning threshold |
| `editor.worker` | ~231 kB | Only Monaco worker retained |

### Verification

```bash
npm run build
```

Result:

- Build passes.
- No circular chunk warnings.
- No large chunk warnings.

---

## 3. Modular Entry Audit and Proof

### Current production entry

`index.html` still uses:

```html
<script type="module" src="/src/main.js"></script>
```

### Why this was not switched blindly

`src/main.js` is monolithic but battle-tested as the active production path. `src/main.modular.js` and `src/app.js` are a modular refactor path, but compile-time and runtime parity must be proven before switching users to it.

### Compile blockers found and fixed

A temporary proof build was run by replacing the entry with `/src/main.modular.js`.

#### Blocker 1: duplicate exports in modes module

File:

- `src/features/modes/index.js`

Problem:

- `VIEW_MODES` and `SPLIT_ORIENTATION` were exported at declaration and then exported again at the bottom.

Fix:

- Keep declaration exports.
- Export only `ModesManager` at the bottom.

#### Blocker 2: wrong `marked-footnote` import

File:

- `src/core/markdown/index.js`

Problem:

- Code imported a named export that does not exist in the installed package:

```js
import { markedFootnote } from 'marked-footnote';
```

Fix:

```js
import markedFootnote from 'marked-footnote';
```

#### Blocker 3: missing `storageService` export alias

File:

- `src/core/storage/index.js`

Problem:

- Modular files imported `storageService`, but storage module only exported `storage`.

Fix:

```js
export const storageService = storage;
```

### Modular compile proof result

After the fixes, a repeatable modular-entry proof command was added:

```bash
npm run build:modular
```

Implementation detail:

- `vite.config.js` uses `--mode modular` to transform the root `index.html` entry from `/src/main.js` to `/src/main.modular.js` during that build only.
- Normal `npm run build` still uses the production default `/src/main.js`.

Result:

- Modular entry compiles successfully.
- Production entry remains monolithic until runtime parity testing is completed.

### Remaining runtime parity gates before switching production

Before changing `index.html` to `/src/main.modular.js`, verify these in a browser/E2E smoke test:

1. App boots with no console errors.
2. Monaco editor mounts and accepts input.
3. Markdown preview updates while typing.
4. KaTeX renders inline and block math.
5. Mermaid diagrams render and theme-switch correctly.
6. Tabs create/switch/close/save correctly.
7. IndexedDB migration and autosave work.
8. Toolbar formatting inserts correct Markdown.
9. Search and Find/Replace work.
10. Import Markdown works.
11. Export Markdown/HTML/PDF works after lazy chunks load.
12. Image upload and image resize still work.
13. Mobile menu/layout works.
14. PWA/service worker behavior is unchanged.

---

## 4. Technical Debt Findings

The tech-debt skill scan was run against `src`.

Summary:

- Files analyzed: 79
- Total lines: ~30,076
- Total issues reported by heuristic scan: 681
- High priority: 47
- Medium priority: 120
- Low priority: 514

Most important findings:

| Finding | Impact |
| --- | --- |
| `src/main.js` is ~6,493 lines | High maintenance risk; hard to test and safely refactor |
| `src/features/image-resize/core.js` is ~2,423 lines | Feature-level complexity risk |
| `src/features/toolbar/manager.js` is ~1,129 lines | UI orchestration complexity |
| Several complex functions and deep nesting | Higher regression risk during refactors |
| Many console statements | Debug noise; should be routed through a logger if needed |

Recommendation:

- Continue the modular migration, but in controlled phases with tests.
- Do not delete the monolith until modular runtime parity is proven.
- Add feature-level tests around markdown rendering, toolbar insertion, export, and image resize before moving more code.

---

## 5. Validation Matrix

### One-command gate

A repeatable health gate was added for this exact audit scope:

```bash
npm run verify:health
```

It runs:

1. `npm audit --json`
2. `npm test`
3. `npm run build -- --outDir .tmp/verify-dist-production`
4. `npm run build:modular -- --outDir .tmp/verify-dist-modular`

The build outputs intentionally go to temporary `.tmp/` folders, which are cleaned before and after the run. This prevents health checks from dirtying the tracked `dist/` snapshot.

It also fails if either build emits the chunk warnings that started this audit (`Circular chunk`, `Some chunks are larger than`, or Vite `(!)` warnings).

Additional custom JS chunk budgets are enforced from the Vite size table:

- `monaco-editor-*`: max 2400 kB, because Monaco is the known core editor exception
- every other JS chunk: max 850 kB, so a future oversized PDF/Mermaid/app chunk cannot hide behind the Monaco warning budget

Latest result:

```text
✅ Repository health verification passed.
```

### Individual checks

| Check | Command | Result |
| --- | --- | --- |
| Dependency audit | `npm audit --json` | Pass: 0 vulnerabilities |
| Unit tests | `npm test` | Pass: 65 tests |
| Production build | `npm run build` | Pass: no warnings |
| Modular compile proof | `npm run build:modular` | Pass: no warnings |
| Combined health gate | `npm run verify:health` | Pass |
| Web quality basic audit | `bash skills/web-quality-audit/scripts/analyze.sh index.html` | Pass: 0 issues, 0 warnings |
| Dependency debt scan | `python3 .agents/skills/tech-debt-analyzer/scripts/analyze_dependencies.py package.json` | Pass: 0 major dependency issues |

---

## 6. Rollback Notes

If a production issue appears, rollback in this order:

1. Revert package updates only if PDF export or sanitization breaks:
   - `dompurify`
   - `html2pdf.js`
   - lockfile transitives
2. Revert Monaco import/worker changes if editor boot breaks:
   - `src/main.js`
   - `src/core/editor/index.js`
   - `src/core/editor/workers.js`
3. Revert `vite.config.js` manual chunking if chunk loading behaves unexpectedly.
4. Keep the modular compile fixes if possible; they are correctness fixes for currently present modules.

---

## 7. Recommended Next Phase

### Phase A: Browser smoke automation — started

Playwright runtime smoke tests were added for the highest-risk new preview features:

- `playwright.config.js`
- `tests/e2e/issue40-runtime.spec.js`

Scripts:

```bash
npm run test:e2e
npm run test:e2e:modular
npm run test:e2e:install
npm run verify:runtime
```

Current browser coverage:

- app boots and exposes an editor bridge
- direct/GitHub video links render as preview `<video>` elements
- YouTube links render as privacy-friendly iframes
- Live Edit syncs rendered heading/paragraph changes back to Markdown
- toolbar bold/italic buttons update the Monaco Markdown source
- search overlay reports preview/editor matches
- export modal keeps PDF libraries lazy until real export
- mobile preview switch shows rendered preview mode

Note: this sandbox could not download Chromium from the Playwright CDN due an `ECONNRESET`; the tests are implemented and discoverable, but browser execution requires `npm run test:e2e:install` on a networked developer/CI machine.

CI-ready Playwright scripts/tests are included for both production and modular runtime E2E suites. A GitHub Actions workflow was prepared during development, but it is not included in this PR because the GitHub App token used in this environment does not have `workflows` permission to push `.github/workflows/*.yml` changes.

### Phase B: Modular preview route or build script

Add a safe opt-in path for modular runtime testing, for example:

- `npm run build:modular`, or
- a dedicated local-only modular HTML entry, or
- a feature flag that never changes production default until tests pass.

### Phase C: Switch production entry only after parity

Once smoke tests pass on the modular entry, switch:

```html
<script type="module" src="/src/main.modular.js"></script>
```

Then monitor:

- Console errors
- Preview rendering
- Export failures
- IndexedDB migration/storage reports
- Web vitals and bundle sizes
