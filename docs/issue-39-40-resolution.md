# Markups — Issue #39 & #40 Resolution (2026-08-23)

Fixtures for two open GitHub issues. Both were reproduced in a real Chromium
browser (Playwright) and verified fixed against measured runtime behavior.

---

## Issue #40 — Video embed mislabels GitHub picture links as "Open video"

**Reported symptom (wexiyeb618):**
> "When you put a picture link in the Write window, the preview of it says
> 'Open video', but clicking that does go to the picture. Also, when editing
> a Markdown file with a picture link in it, the video square pops in & out."

**Root cause** (`src/utils/video-embed.js`)
- `isGitHubVideoAttachment()` matched **every** `github.com/user-attachments/assets/...`
  URL as a video — images included.
- Image markdown `![alt](asset)` renders an `<img>`; `processPreviewVideos`
  then replaced that `<img>` with a `<video>`. For a picture the `<video>`
  fails to play and fell back to a misleading **"Open video"** link.

**Fix**
1. GitHub-asset `<img>` elements are only treated as a video when explicitly
   tagged `{video mode=embed}` — otherwise they stay images.
2. If a GitHub asset really is a video but playback fails, the fallback now
   renders the actual `<img>` (the picture) instead of a dead "Open video" link.

**Verification**
- New deterministic unit tests in `src/__tests__/videoEmbed.test.js`.
- Live e2e: `tests/e2e/repro-39-40.spec.js` (image stays an image; bare GitHub
  video links still embed).

---

## Issue #39 — Sync-scroll stalls / never reaches the bottom on long pages

**Reported symptom (wexiyeb618):**
> "When I reach the Flag table, the sync scroll in the Preview is put to a halt
> & then jumps down… When I reach the bottom of the Write section with gray bar
> scrolling, the Preview doesn't show the credit section."

**Root cause** (`src/utils/scroll-sync.js`)
- Monaco's `getTopForLineNumber()` returns pixel positions that can sit **past
  the editor's real scroll maximum** (measured: content-end 2288 px vs. real
  max scroll 1714 px). Anchors built from those inflated positions are
  unreachable, so the sync mapping stopped short of the preview bottom and the
  final section (credit) never appeared.
- The end control-point was not pinned to Monaco's actual scroll max, and
  anchor interpolation was not guaranteed monotonic.

**Fix**
- Clamp every real anchor's `editorTop` to the editor's actual max scroll
  (`editorMax`).
- Pin the end control-point to exactly `(editorMax, previewMax)` so parking the
  editor at the bottom of its scroll bar lands the preview at its bottom.
- Re-sort anchors by `editorTop` (validates the binary-search segment lookup)
  and enforce monotonic non-decreasing positions in both coordinates
  (`clampMonotonic`) so interpolation never jumps backwards.
- Extracted pure, testable helpers: `findAnchorSegment()`, `clampMonotonic()`.
- Tightened the block-start snap tolerance (12 px → 4 px) so tracking never
  "halts" on a heading boundary.

**Verification**
- Live tall-"Flag-table" measurement in Chromium: preview bottom reach went from
  **0.864 → 1.00**; the scroll curve is smooth and monotonic (0 dips, 0 stalls).
- e2e: `tests/e2e/talltable-sweep.spec.js`, `tests/e2e/repro-39-40.spec.js`.
- Unit: `src/__tests__/scrollSyncMapping.test.js`.
- Full unit suite: 101/101 pass. Production build: clean.

---

## Files changed
- `src/utils/video-embed.js` — #40
- `src/utils/scroll-sync.js` — #39
- `src/__tests__/videoEmbed.test.js` — #40 regression tests
- `src/__tests__/scrollSyncMapping.test.js` — #39 mapping tests (new)
- `tests/e2e/repro-39-40.spec.js` — #39+#40 live e2e (new)
- `tests/e2e/talltable-sweep.spec.js` — #39 tall-table e2e (new)

> Note: `tests/e2e/editor-runtime.spec.js` → "mobile preview switch" is a
> pre-existing flaky test (fails on clean origin too, unrelated to these fixes).
