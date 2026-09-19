# Features Index

## Editor and preview

- `src/core/editor/`
- `src/core/markdown/`
- `src/features/live-preview-edit/`
- `src/features/scroll-sync/`
- `src/features/divider/`

## Documents and navigation

- `src/features/tabs/`
- `src/features/explorer/`
- `src/features/toc/`
- `src/features/backlinks/`
- `src/features/search/`

## Writing tools

- `src/features/toolbar/` (production chrome: `chrome.js`, insert catalog: `catalog.js`)
- `src/features/snippets/`
- `src/features/templates/`
- `src/features/linter/`
- `src/features/stats/`
- `src/features/goals/`
- `src/features/ai-writer/`

## Media and export

- `src/features/image-upload/`
- `src/features/image-controls/`
- `src/features/image-resize/`
- `src/features/video-controls/`
- `src/features/video-discoverability/`
- `src/services/export/`

## Application services

- `src/services/autosave/`
- `src/services/pwa/`
- `src/services/shortcuts/`
- `src/core/storage/`
- `src/ui/`
- `src/utils/`

Feature ownership should be confirmed from imports and callers before moving
or deleting a module. Some legacy features are wired directly from `main.js`
while the modular entry uses `app.js`.
