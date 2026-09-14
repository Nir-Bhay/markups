# Markups AI Memory

This is the current navigation map for the Markups repository.

## Project identity

Markups is a vanilla JavaScript/Vite Markdown editor PWA. It uses Monaco,
Marked, DOMPurify, Mermaid, KaTeX, Dexie/IndexedDB, and local browser storage.

## Entry points

- `index.html` — production HTML shell and page metadata
- `src/main.js` — current production application entry
- `src/main.modular.js` — modular entry used by `npm run build:modular`
- `src/app.js` — modular application coordinator
- `vite.config.js` — multi-page inputs, chunks, and build configuration

## Source map

- `src/core/editor/` — Monaco editor lifecycle
- `src/core/markdown/` — Markdown parsing, sanitization, Mermaid, KaTeX
- `src/core/storage/` — Dexie database, notes, file tree, migration
- `src/features/` — user-facing features (`toolbar/chrome.js` + `toolbar/catalog.js` for the production bar)
- `src/services/` — exports, autosave, PWA, shortcuts
- `src/ui/` — modal, toast, loading, and theme UI
- `src/utils/` — DOM, storage compatibility, sanitization, files, events
- `src/__tests__/` — Vitest unit and integration tests

## Public-site inputs

Vite currently discovers HTML under:

- `landing/`
- `seo/`
- `policy/`
- `strategy/`

It also builds root-level HTML files. Confirm deployment scope before moving
or deleting public-site content.

## Important current risks

- User-controlled names must be escaped before `innerHTML` insertion.
- Storage quota failures must not be swallowed.
- E2E coverage is currently absent.
- Coverage requires `@vitest/coverage-v8`.
- Keep `main.js` and `main.modular.js` until the entry-point decision is made.

## Review workflow

1. Read `AI-DOCS/QUICK-START.md`.
2. Use the code-review graph before broad source scanning.
3. Check callers and tests before changing shared utilities.
4. Make one bounded change at a time.
5. Run lint, unit tests, both builds, and relevant browser tests.

Last reviewed: 2026-09-08.
