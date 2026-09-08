---
name: breadcrumb-navigation
description: "Show current section breadcrumb in status bar based on cursor position."
---

# Breadcrumb Navigation

Shows the current heading path in the status bar as the user scrolls/types. Notion/Obsidian-style.

## Tests

1. `getCurrentSectionPath(text, cursorPosition)` returns correct heading path
2. Empty document returns empty path
3. Cursor in H1 returns `[H1 text]`
4. Cursor in H2 under H1 returns `[H1 text, H2 text]`
5. Cursor outside any heading returns empty path
6. Debounced update doesn't fire more than once per 150ms

## Implementation

- Add `updateBreadcrumb(editor)` in `src/main.js`
- Call it on `onDidChangeCursorPosition` + `onDidChangeModelContent`
- Find nearest heading above cursor
- Update `#breadcrumb-path` element in status bar
- Click breadcrumb item → jump to that heading

## Verification

- `npm run lint` → 0 errors
- `npm test` → all pass
- Manual: open long doc with headings, move cursor, breadcrumb updates
