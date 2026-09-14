# Markups — Cleanup Review for Confirmation

Status: implementation in progress. Only clearly generated/local artifacts have
been removed; product-boundary items remain until their usage is verified.

## 1. What the project is

The product is a browser-based Markdown editor/PWA:

- Monaco editor
- Markdown preview with sanitization
- Tabs and document/file storage
- Markdown, HTML, PDF, DOCX, and text export
- Templates, snippets, search, TOC, goals, AI writer, and image/video tools
- PWA/service-worker support

The repository currently mixes that product with website pages, agent tooling, generated output, and historical audit material.

## 2. Candidate cleanup buckets

### A. Safe to remove or keep out of Git

These are not product source:

- `node_modules/` — local dependency installation
- `dist/` — generated production output
- `test-results/` — generated test output
- `.commandcode/` — untracked local command artifact
- `doc/` — currently empty

Action proposed: delete locally when appropriate and ensure they remain ignored.

### B. Tooling and AI-agent material

These support development but are not shipped as editor functionality:

- `skills/`
- `.code-review-graph/`
- `AGENTS.md`
- `CLAUDE.md`
- `AI-NAVIGATION.md`

Action proposed: choose one:

1. Keep them in this repository as contributor tooling.
2. Move them to a separate developer-tools repository.
3. Keep only a short `CONTRIBUTING.md` and remove the rest.

Recommendation: do not delete yet. Confirm whether this repository is also intended to be an AI-assisted development workspace.

### C. Public website material

These are not core editor code, but Vite currently builds some of them:

- `landing/`
- `seo/`
- `accessibility/`
- `cookie-policy/`
- `privacy-policy/`
- `terms/`
- `llms.txt`
- `robots.txt`
- `sitemap.xml`

Action proposed: choose one:

1. Keep them because the repository owns the complete public website.
2. Move them to a separate marketing/site repository.
3. Keep only legal pages here and remove the marketing/SEO pages.

Recommendation: keep legal pages. Move `landing/` and `seo/` only after confirming that deployment does not depend on them.

### D. Historical/debug artifacts

These should not be part of the production source tree unless actively used:

- `repro-toolbar-issue.html`
- `BUGS-FOUND.md`
- `edge-case-audit.md`
- `GATES.md`

Action proposed:

- Archive completed audits under a dedicated `docs/archive/` directory, or remove them after their findings are tracked.
- Keep `GATES.md` only if it remains an active release checklist.
- Keep `repro-toolbar-issue.html` only if it is still used for regression reproduction.

## 3. Do not remove yet

Keep these until the product boundary is confirmed:

- `src/`
- `index.html`
- `public/`
- `package.json` and `package-lock.json`
- `vite.config.js`
- `vercel.json`
- `tests/` and `src/__tests__/`
- `scripts/`
- `README.md`
- `SECURITY.md`
- `CHANGELOG.md`

The `src/` tree contains both the current entry point (`main.js`) and a modular entry point (`main.modular.js`). Removing either before deciding the architecture could break deployment or future migration work.

## 4. Fastest production-readiness wins

These should be solved before major refactoring:

1. **Fix stored XSS in names and settings**
   - Escape document titles, explorer names, tab names, and AI settings values before HTML insertion.
   - Relevant areas: `src/main.js`, `src/features/explorer/`, `src/features/tabs/`, `src/features/ai-writer/ui.js`.

2. **Fix storage failure handling**
   - `Storehouse.setItem()` currently swallows quota errors, so the document-save recovery path cannot run.
   - Preserve the error or return an explicit success/failure result.

3. **Resolve the missing `monaco-vim` dependency**
   - Either add the package properly or remove/disable the Vim setting.
   - Development currently fails to resolve the module.

4. **Make verification commands reliable**
   - Add `@vitest/coverage-v8`.
   - Fix `verify-health` on Windows.
   - Add real Playwright smoke tests or remove the false-positive E2E command.

5. **Add basic large-file protection**
   - Limit Markdown import size.
   - Guard export/import paths while Monaco is still initializing.

6. **Add error handling around storage operations**
   - Protect note deletion, file-tree reordering, and other `Promise.all` storage flows.

7. **Reduce the main entry-point risk**
   - `src/main.js` is very large and highly connected.
   - First extract only clearly bounded areas; do not perform a broad rewrite yet.

## 5. Baseline evidence

The original audit found 170 indexed files, 2,314 graph nodes, 17,331 graph
relationships, 20 high-degree untested hotspots, and 283 possible dead-code
candidates requiring manual verification.

Before this cleanup pass:

- Unit tests: 351 passed
- ESLint: passed
- Production and modular builds: passed
- npm audit: 0 vulnerabilities
- E2E suite: no tests found
- Coverage: missing dependency
- Health command: Windows process-spawn failure

This document is not the release record. Current gate results belong in
`GATES.md` and must be rerun after the working tree stabilizes.

## 6. Current decisions and remaining boundary choices

The following safe actions are complete:

- `.commandcode/` was removed and added to `.gitignore`.
- Generated output remains ignored and is not part of the source tree.
- Missing navigation documents were restored under `AI-DOCS/`.
- Stale historical gate evidence was replaced with a current verification
  checklist.

The following choices still require product-owner confirmation before deletion:

- [ ] Product-only repository, or product plus public website?
- [ ] Keep AI-agent/tooling files here, or move them elsewhere?
- [ ] Archive or delete historical audit/debug files?
- Removed: `.commandcode/`
- [ ] Keep both `main.js` and `main.modular.js` during the cleanup?

Until those boundaries are explicit, the implementation keeps files that could
be used by deployment, legal pages, contributors, or the modular build.

## 7. Stabilization pass result

Completed in the current working tree:

- Added `monaco-vim` and `@vitest/coverage-v8`.
- Added a Playwright editor-shell smoke test.
- Fixed Windows health-script spawning and added a main-entry chunk budget.
- Fixed user-controlled HTML insertion in tabs, explorer, AI settings, and
  toast messages.
- Preserved storage-write failures for document recovery.
- Added import-size protection for local files and URL imports.
- Fixed modular feature flags, missing event names, broken feature imports,
  backlinks wiring, and global error notifications.
- Debounced document persistence to avoid an IndexedDB/localStorage write on
  every keystroke.

Latest verification:

- `npm test`: 355 passed
- `npm run lint`: passed
- `npm run test:coverage`: passed
- `npm run test:e2e`: 1 smoke test passed
- `npm run build`: passed
- `npm run build:modular`: passed
- `npm run verify:health`: passed
- `npm audit`: 0 vulnerabilities
