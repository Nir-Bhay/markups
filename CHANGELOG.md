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

### Verification
- 320/320 tests pass (47 test files, 10 new tests added in this release)
- Lint: 0 errors
- Production build succeeds in ~1m4s
- Modular build (`mode=modular`) succeeds in ~53s

### Audit
- Complete reconnaissance audit delivered at `D:\harmes\markups-audit-2026-09-06.md`
- Sub-reports: security/a11y/UX, code health, feature inventory

[2.0.0]: https://github.com/Nir-Bhay/markups/releases/tag/v1.1.3
