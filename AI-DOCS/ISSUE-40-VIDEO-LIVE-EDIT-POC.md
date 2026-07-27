# Issue #40: Inline Video Preview + Live Preview Editing POC

**Date:** 2026-07-27  
**Branch:** `arena/019f9fac-markups`  
**Status:** Implemented as incremental POC + tests

---

## User Problem

The issue has two related requests:

1. **Video preview:** A video URL should be visible/playable in the Markdown preview instead of only being a clickable link.
2. **Live document-style editing:** The preview pane should move toward a wiki/LibreOffice-like experience where non-technical users can edit rendered content without constantly thinking in raw Markdown syntax.

---

## Product Direction

### Principle

Keep the current Monaco Markdown editor as the stable source of truth, then add progressive enhancements:

- **Safe default:** raw Markdown editor + rendered preview keeps working exactly as before.
- **Preview enhancement:** bare video URLs become playable embeds in preview.
- **POC toggle:** rendered preview can be made editable by explicit user action.
- **No forced migration:** live editing remains opt-in until HTML-to-Markdown round-tripping has broader runtime testing.

### Why this sequence

Inline video rendering is relatively low risk because it is a preview post-processing step. Live editing is higher risk because HTML-to-Markdown conversion can be lossy for complex Markdown constructs. Therefore live editing is implemented as a POC behind a visible toggle instead of replacing the existing editor.

---

## Implementation Summary

### 1. Inline video preview

Files:

- `src/utils/video-embed.js`
- `src/core/markdown/index.js`
- `src/main.js`
- `public/css/premium-ui.css`
- `src/__tests__/videoEmbed.test.js`
- `src/__tests__/markdownService.test.js`

Behavior:

- Bare direct video links become `<video controls>` players.
- GitHub `user-attachments/assets/...` URLs are treated as embeddable video candidates, including links copied with trailing punctuation.
- YouTube links become privacy-friendly `youtube-nocookie.com` iframes.
- Vimeo links become Vimeo player iframes.
- Intentionally labeled links such as `[watch demo](demo.mp4)` remain links to respect author intent.
- If an HTML5 video fails to load, it falls back to an external link.

### 1.1 Video preview layout controls

Videos now have lightweight preview controls similar in spirit to image editing:

- click an embedded video to select it
- choose width presets: `25%`, `50%`, `75%`, `100%`
- choose alignment: left, center, right
- changes apply immediately in preview without closing the control popover
- changes persist back into Markdown using a small attribute block

Example persisted source:

```markdown
https://example.com/demo.mp4 {video width=50% align=right}
```

The renderer strips `{video ...}` metadata before Markdown parsing so it does not leak into visible preview text, then reapplies the layout to the embedded player.

Example supported input:

```markdown
https://github.com/user-attachments/assets/80b44104-49c5-4b46-aa37-acf5c4957062

https://example.com/demo.mp4

https://youtu.be/dQw4w9WgXcQ
```

### 2. Modular MarkdownService video integration

The active monolithic preview already post-processed videos. The modular renderer now also calls `processPreviewVideos(container)` after image processing and before Mermaid rendering.

This matters because `npm run build:modular` is now a real compile proof and should not drift away from production preview behavior.

### 3. Live Preview Edit POC

Files:

- `src/features/live-preview-edit/index.js`
- `src/main.js`
- `src/app.js`
- `src/main.modular.js`
- `index.html`
- `public/css/premium-ui.css`
- `src/__tests__/livePreviewEdit.test.js`

UI:

A sticky preview toolbar was added above the rendered article:

```text
[Live Edit]  POC: edit preview, syncs back to Markdown
```

When enabled:

- Active production (`src/main.js`) and modular proof (`src/app.js` / `src/main.modular.js`) both target the same `#output` rendered article.
- `#output` becomes `contenteditable`.
- Typing in preview syncs best-effort Markdown back into Monaco.
- Monaco updates are applied without immediately re-rendering the preview, reducing cursor/caret jump while editing.
- `Ctrl/Cmd + S` while focused in editable preview forces a sync.
- Disabling the toggle syncs and then re-renders the canonical Markdown preview.

### 4. HTML-to-Markdown serializer

The serializer supports common writing structures:

- headings
- paragraphs
- bold / italic / strikethrough
- inline code
- links
- images
- unordered and ordered lists
- blockquotes
- fenced code blocks
- tables
- horizontal rules
- `<details>` blocks
- embedded video widgets back to source URLs

Limitations:

- This is a POC, not a full WYSIWYG editor engine.
- Complex Markdown extensions can still be lossy after direct preview edits.
- Mermaid diagrams render as SVG in preview; users should edit those in Markdown source for now.
- Export behavior remains source-Markdown driven.

---

## UX / Accessibility Notes

- Live editing is opt-in via an explicit toggle.
- Toggle uses `aria-pressed`.
- Preview edit mode has a visible outline and caret color.
- Media players, iframes, and code-copy controls are marked non-editable inside the editable preview.
- Labeled video links remain links, avoiding surprise conversion.

---

## Test Coverage

New/expanded tests:

| File | Coverage |
| --- | --- |
| `src/__tests__/videoEmbed.test.js` | URL normalization, direct videos, GitHub attachments, YouTube/Vimeo embeds, image-syntax videos, labeled-link preservation |
| `src/__tests__/videoControls.test.js` | Video width/alignment parsing, DOM presentation, Markdown persistence |
| `src/__tests__/livePreviewEdit.test.js` | HTML-to-Markdown serialization for rich text, code/table, video widgets, block-level sync |
| `src/__tests__/markdownService.test.js` | Footnotes, sanitizer use, KaTeX, video render integration, Prism language aliases |
| `src/__tests__/sanitize.test.js` | Shared preview sanitizer behavior for monolithic and modular preview paths |

Current suite after this work:

```text
7 test files passed
65 tests passed
```

---

## Verification

Run the focused Issue #40 acceptance suite:

```bash
npm run test:issue40
```

Latest result:

```text
3 test files passed
29 tests passed
```

Run the full gate:

```bash
npm run verify:health
```

This checks:

1. `npm audit --json`
2. `npm test`
3. production build with temp outDir
4. modular proof build with temp outDir
5. Vite warning absence
6. custom JS chunk budgets

Latest result:

```text
✅ Repository health verification passed.
```

---

## Recommended Next Phase

### Phase 1: Browser smoke tests — implemented

Browser automation was added in:

- `playwright.config.js`
- `tests/e2e/issue40-runtime.spec.js`

Scripts:

```bash
npm run test:e2e          # production entry runtime smoke
npm run test:e2e:modular  # modular entry runtime smoke
npm run test:e2e:install  # installs Playwright Chromium when missing
npm run verify:runtime    # health gate + production E2E
```

Runtime coverage:

- paste/render the exact GitHub attachment URL from Issue #40 and assert `<video>` exists in preview
- paste/render a direct `.mp4` link and assert `<video>` exists
- paste/render a YouTube link and assert the `youtube-nocookie.com` iframe exists
- enable Live Edit, mutate rendered preview, assert Markdown source updates
- disable Live Edit, assert preview re-renders from synced Markdown

Note: in this sandbox, the Playwright test runner is installed but Chromium could not be downloaded because the CDN connection reset. On a developer machine or CI, run `npm run test:e2e:install` once, then `npm run test:e2e` / `npm run test:e2e:modular`.

### Phase 2: Safer round-trip engine — started

The Live Edit controller now prefers block-level synchronization when preview elements have `data-source-line` markers:

- only the edited source block is replaced when possible
- headings, paragraphs, lists, blockquotes, code fences, tables, and videos have serializer coverage
- full-preview serialization remains as a fallback when a reliable source line is unavailable

This is safer than always round-tripping the entire rendered document, but it is still not a complete WYSIWYG document model. A future production-grade version can still adopt ProseMirror/Tiptap/Lexical or a richer Markdown AST mapping.

### Phase 3: Enterprise/non-technical UX — started

The preview toolbar now exposes a clearer mode switch:

- **Markdown Mode**: source Markdown editor remains primary
- **Document Mode**: rendered preview becomes editable and syncs blocks back to Markdown

Next UX additions:

- add review/comment flows
- add translation-ready UI strings
- add import/export parity for DOCX/PDF/HTML workflows

---

## Rollback Notes

If inline video causes issues:

- Revert `src/utils/video-embed.js` changes and calls to `processPreviewVideos`.

If Live Edit POC causes issues:

- Remove the preview toolbar in `index.html`.
- Remove `setupLivePreviewEdit()` call and related glue from `src/main.js`.
- Keep serializer tests if the feature remains planned.
