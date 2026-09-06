# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2026-09-06

### Security
- Close 3 XSS risks in search, templates, and snippets panel UIs by introducing
  `src/utils/escape-html.js` and wrapping user-controlled strings in `innerHTML`
  template literals with `escapeHtml()`
- Add escape coverage for video-controls attribute rendering as defense-in-depth

### Bug Fixes
- Wire Mermaid and Math (KaTeX) Settings checkboxes to actually toggle rendering;
  previously `setMermaidEnabled()`/`setKatexEnabled()` were never called from UI
- Gate `mermaid.run()` on `currentSettings.preview.mermaid` in `convert()`
- Gate KaTeX post-render output on `currentSettings.preview.mathRendering`
- Fix 2 loose-equality comparisons (`!=` → `!==`) in `src/main.js`
- Remove 4 debug `console.log` statements from PWA block in `src/main.js`

### Cleanup
- Delete 3 stale remote branches: `arena/019f9fac-markups`,
  `markups-reduction`, `review/integration`
- Reduce lint warnings from 55 → 23 via `eslint --fix`, `_`-prefixed unused
  vars/catches, and `caughtErrorsIgnorePattern: '^_'`
- Remove unused named exports and dead assignments in `src/main.js`
- Remove dead `katex` import from `src/main.js:85` (renderer lives in
  `src/core/markdown/index.js`)

### Memory Hygiene
- Add idempotent `dispose()` to `ExplorerManager` that removes every listener
  added in `initialize()`, nulls DOM references, and cleans up active resize
  handlers
- Wire `stopVersionHistoryPolling()` into the existing `pagehide` teardown
  handler in `src/main.js` so the version-history `setInterval` is cleared on
  unload
- Verify `focus` / `fullscreen` / `goals` / `typewriter` already have top-level
  `dispose()` methods (no nesting defects found)

### Verification
- 320/320 tests pass (47 test files, 10 new tests added in this release)
- Lint: 0 errors
- Production build succeeds in ~1m4s
- Modular build (`mode=modular`) succeeds in ~53s

### Architecture (Phase 4 partial)
- Make `src/main.modular.js` a feature-complete drop-in for `src/main.js`:
  Monaco worker setup, prism language imports, mermaid initialization, KaTeX
  CSS, and github-markdown-light styles. All `marked.use()` calls still
  live in `markdownService.initialize()` to avoid double-registering
  extensions; documented at the top of `main.modular.js`.
- Both default (`main.js`) and modular (`main.modular.js`) entry points
  build and lint clean. Future work (separate PR): flip
  `index.html` to load `main.modular.js` and switch `vercel.json` /
  `build` script to modular mode.

### Audit
- Complete reconnaissance audit delivered at `D:\harmes\markups-audit-2026-09-06.md`
- Sub-reports: security/a11y/UX, code health, feature inventory

[2.0.0]: https://github.com/Nir-Bhay/markups/releases/tag/v1.1.3
