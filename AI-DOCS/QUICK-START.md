# Markups Quick Start

## Common commands

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
npm run build:modular
npm run verify:health
npm run test:e2e
```

## Where to make common changes

- Markdown behavior: `src/core/markdown/index.js`
- Preview sanitization: `src/utils/sanitize.js`
- Main editor lifecycle: `src/main.js`
- Modular lifecycle: `src/app.js`
- Tabs: `src/features/tabs/` and the legacy tab code in `src/main.js`
- Storage: `src/core/storage/`
- Export: `src/services/export/`
- Toolbar: `src/features/toolbar/`
- Images and videos: `src/features/image-*` and `src/utils/video-embed.js`
- Global styles: `public/css/` and `src/styles/`
- Tests: `src/__tests__/`

## Safe change procedure

1. Identify the owning module.
2. Check graph callers, dependents, and tests.
3. Add or update a focused test.
4. Avoid adding new `innerHTML` with user-controlled values.
5. Run the smallest relevant test first.
6. Run lint and the production build before handoff.

## Current release blockers

- Playwright has no tests under `tests/e2e/`.
- `npm run test:coverage` needs `@vitest/coverage-v8`.
- `npm run verify:health` must remain cross-platform.
- Production and modular entry points still coexist.
