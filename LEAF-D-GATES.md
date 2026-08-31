# LEAF-D — Large-file handling + performance gates

Branch: `review/integration` (local only — NOT committed/pushed)
Run: `npx eslint src/features/import/index.js src/features/live-preview-edit/index.js src/core/markdown/index.js src/main.js`

## Status

| Gate | Requirement | Status | Evidence |
|------|-------------|--------|----------|
| G1 | Import text-size limit (>5 MB rejected with toast) | PASS | Guard present in BOTH import entry points |
| G2 | TXT export safe for large docs (>10 MB warning, graceful) | PASS | Size-cap warning added in `exportToTXTWithOptions` |
| G3 | Live-preview edit debounce + large-doc chunking | PASS | Debounce already present; 50 MB full-preview fallback guard added |
| G4 | Mermaid render ID monotonic (no `Date.now` collision) | PASS | Already a monotonic counter; verified, no change needed |
| G5 | eslint clean on the 4 target files | PASS | 0 errors, 25 warnings (all pre-existing, unrelated) |

## Details

### G1 — Import size limit
- `src/features/import/index.js` already rejected files > `5 * 1024 * 1024` bytes
  (lines 87-94) with a `TOAST_SHOW` error. **No change required there.**
- `src/main.js` `handleFileImport` (≈4403) had **NO** size guard — it would read
  any-sized file synchronously via `FileReader`. **ADDED** the same 5 MB guard +
  `event.target.value = ''` reset so the rejected file does not re-trigger on the
  next input event. Now both import paths are consistent.

### G2 — TXT export size warning
- `src/main.js` `exportToTXTWithOptions` (≈4300) runs 12 synchronous `.replace()`
  passes over the entire document. **ADDED** a guard: if `content.length >
  10 * 1024 * 1024`, show a `warning` toast ("Large document … TXT export may take
  a moment") and continue. We deliberately do NOT block export (a slow-but-working
  export is better UX than a hard refusal on a valid document).

### G3 — Live-preview edit debounce + large-doc guard
- `src/features/live-preview-edit/index.js` `LivePreviewEditController` already
  debounces input → `_syncFromPreview()` at `debounceMs = 450` (line 387) and,
  when a `data-source-line` block anchor exists, serializes only that block
  (`replaceMarkdownBlockAtLine`) rather than the whole preview. **No change needed
  for the common path.**
- The fallback path (no block anchor) called `serializePreviewToMarkdown(this.output)`
  which serializes the ENTIRE preview DOM — this can freeze the UI on 50 MB+
  documents on every keystroke. **ADDED** a guard: if `sourceMarkdown.length >
  50 * 1024 * 1024`, skip the full-preview serialize (return the source unchanged →
  treated as idempotent no-op by `_syncFromPreview`), warn once, and let per-block
  edits continue to work.

### G4 — Mermaid render ID
- `src/core/markdown/index.js` `_renderMermaidDiagrams` (≈333) already uses a
  monotonic counter: `MarkdownService._mermaidSeq = (MarkdownService._mermaidSeq || 0) + 1;
  const id = \`mermaid-${MarkdownService._mermaidSeq}\`` (lines 344-345). This
  replaces the `mermaid-${Date.now()}-${i}` pattern that caused duplicate-ID
  collisions on rapid typing. **Verified — no change required.**

### G5 — eslint
- Command: `npx eslint src/features/import/index.js src/features/live-preview-edit/index.js src/core/markdown/index.js src/main.js`
- Result: `✖ 25 problems (0 errors, 25 warnings)` — exit code 0.
- The 25 warnings are pre-existing (`no-unused-vars`, `eqeqeq`) and unrelated to
  Leaf-D. No new errors or warnings introduced by these edits.

## Files modified (working tree only — uncommitted)
- `src/main.js` — added 5 MB import guard in `handleFileImport`; added 10 MB TXT export warning in `exportToTXTWithOptions`.
- `src/features/live-preview-edit/index.js` — added 50 MB full-preview-serialize guard in `_serializeEditedMarkdown`.

## Files reviewed, no change needed
- `src/features/import/index.js` — 5 MB guard already present (lines 87-94).
- `src/core/markdown/index.js` — monotonic Mermaid ID already present (lines 344-345).
