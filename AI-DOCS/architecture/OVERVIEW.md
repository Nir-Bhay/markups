# Architecture Overview

## Runtime layers

```text
HTML/CSS shell
  → entry point (`main.js` or `main.modular.js`)
  → feature managers and UI components
  → core editor/Markdown/storage services
  → browser APIs and IndexedDB/localStorage
```

## Current entry points

The default application loads `src/main.js`. The modular application loads
`src/main.modular.js`, which delegates lifecycle work to `src/app.js`.
Both entries are currently built, but only the default entry is production
selected by `index.html`.

## Persistence

- Dexie/IndexedDB stores notes and file-tree nodes.
- Legacy and compatibility state still uses localStorage/sessionStorage.
- Migration code is in `src/core/storage/migration.js`.
- Storage errors must be surfaced to callers; silent writes are unsafe.

## Rendering and safety

- Markdown is parsed by Marked.
- Preview HTML is sanitized through DOMPurify and fallback sanitation.
- Mermaid, KaTeX, and video embeds are post-processed.
- UI labels, settings, and document names are separate from Markdown
  sanitization and must be escaped at their HTML insertion boundaries.

## Build and deployment

- Vite builds the application plus discovered public HTML pages.
- `vercel.json` supplies deployment headers and cache rules.
- `public/sw.js` provides PWA caching.
- `src/__tests__/` contains the unit/integration suite.
- `tests/e2e/` is reserved for Playwright browser tests.

## Architectural cleanup direction

First stabilize boundaries and verification. Then choose one application entry
point and gradually extract bounded responsibilities from `src/main.js`.
Avoid a broad rewrite while the legacy and modular paths are both active.
