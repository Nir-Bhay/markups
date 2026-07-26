# Issue #42, #39, #40 — Recheck / Implementation Status

**Date**: 2026-07-25

---

## Issue #42 — XML Preview (CORRECTED & VERIFIED)

### What was wrong with the first attempt
- Imported `prism-xml-doc` — that file is for **C# XML doc comments** (`/// <summary>`), not XML language highlighting.
- `prism-markup` already registers `xml`, `svg`, `html` aliases.

### Real root cause (from screenshots)
GitHub highlights ` ```XML ` (any casing). Our highlighter did:

```js
Prism.languages[lang] ? lang : 'plaintext'
```

So `XML` / `Xml` fell back to **plaintext** (no colors).

### Final fix
1. Removed wrong `prism-xml-doc` import
2. Added `MarkdownService.resolvePrismLanguage()` — lowercase + aliases
3. Fixed pre-existing `copyToClipboard` duplicate in `main.js` (unblocked Vite)

### Verification
```
node test-prism-resolve.mjs
→ All checks passed (XML/XML/Xml/svg/html/js aliases)
```

Dev server starts cleanly.

---

## Issue #39 — Scroll Sync (IMPLEMENTED)

### Problem
Ratio-only sync drifts on long docs, especially with closed `<details>` (preview height ≠ editor height).

### Solution (integrated into existing `scroll-sync.js`)
- **Line-anchor map**: markdown headings ↔ preview `#id` offsets
- **Interpolation** between nearest anchors
- **Rebuild** after preview render, mermaid, `<details>` toggle, ResizeObserver
- **Fallback** to old proportional sync if fewer than 2 anchors
- Wired `main.js` to use `scrollSync` instead of duplicated inline handlers

### Files changed
- `src/utils/scroll-sync.js` — rewritten
- `src/main.js` — import + init + enable toggles + rebuild after convert

---

## Issue #40 — Video Embedding (IMPLEMENTED)

### Solution
- New util `src/utils/video-embed.js` (no new npm deps)
- Post-process preview links/images into `<video>` or YouTube/Vimeo iframe (DOM-created, not via innerHTML)
- CSP updated: `media-src` + Vimeo `frame-src`
- DOMPurify allows `video` / `source`
- CSS for `.preview-video`

### Supports
- Direct files: `.mp4`, `.webm`, `.ogg`, `.mov`, …
- GitHub `user-attachments/assets/…` (issue #40 sample URL)
- YouTube / Vimeo bare links
- Labeled non-URL links stay as normal links

### Verification
```
Video URL detection helpers → All passed
```

---

## Issue #30 — WYSIWYG
Documented only (closed / architectural). No code change in this pass.

---

## Manual smoke checklist
1. Paste `test-xml-preview.md` → ` ```XML ` should highlight like ` ```xml `
2. Long doc + scroll sync + toggle `<details>` → preview tracks headings
3. Paste GitHub video asset URL → playable player (or fallback link if CDN blocks)
4. Paste YouTube URL → embedded player
