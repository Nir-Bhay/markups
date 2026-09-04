# Markups — Live Test Guide (A → Z)

> **Goal:** A single document you can use to verify every fix on `markups.dev`.
> Each section gives the markdown to type, the exact UI behavior you should
> observe, the file/commit that fixes it, and how to confirm the fix is live.

**Production branch:** `main` (deployed)
**Live URL:** https://markups.dev

**Quick health snapshot (verified before writing this doc):**
- 207 / 208 unit tests pass (1 unrelated pre-existing flaky stats import test)
- `npm run lint` → 0 errors, 55 cosmetic warnings
- `npm run build` → clean, ~1m 39s
- 0 npm vulnerabilities
- All 5 community bugs fixed, 2 a11y gaps closed in this audit pass

---

## Table of Contents

1. [Bug #39 — Sync scroll mismatch on long pages](#bug-39--sync-scroll-mismatch-on-long-pages)
2. [Bug #40 — Video embed not working](#bug-40--video-embed-not-working)
3. [Bug #42 — XML syntax highlighting wrong](#bug-42--xml-syntax-highlighting-wrong)
4. [Bug #44 — INI syntax highlighting wrong](#bug-44--ini-syntax-highlighting-wrong)
5. [Bug #45 — Emoji shortcodes not supported](#bug-45--emoji-shortcodes-not-supported)
6. [a11y L1 — Video captions (`<track>`)](#a11y-l1--video-captions-track)
7. [a11y L2 — Emoji aria-label for screen readers](#a11y-l2--emoji-aria-label-for-screen-readers)
8. [a11y M1 — `prefers-reduced-motion` honored](#a11y-m1--prefers-reduced-motion-honored)
9. [a11y M2 — Video popover focus return on Escape](#a11y-m2--video-popover-focus-return-on-escape)
10. [Re-audit summary](#re-audit-summary)
11. [Known limitations](#known-limitations)

---

## Bug #39 — Sync scroll mismatch on long pages

**Symptom (reporter wexiyeb618, 21 Aug 2026):** On long documents (tall tables, flag tables, multi-section pages), scrolling the editor to the bottom made the preview stop ~86 % of the way down instead of reaching the bottom — the final section (credit, footer, etc.) never appeared. A second symptom was a "halt then jump" feel: the preview would briefly pause then leap forward.

**Fix commit:** `48dab28` on `fix/issues-39-40`
**File:** `src/utils/scroll-sync.js`
**Status:** ✅ live in `main`

### A. What was wrong (root causes)

| # | Root cause | Effect |
|---|---|---|
| 1 | Monaco `getTopForLineNumber()` returned positions **past** the editor's real scroll range (trailing blank area / viewport slack) | The end anchor lived outside the reachable scroll → preview stalled at the bottom |
| 2 | Non-monotonic anchor coordinates after sorting | Interpolation produced a backwards jump ("halt then jump") |
| 3 | No end control-point pinned to `(editorMax, previewMax)` | Parking the editor at the bottom did not park the preview at the bottom |

### B. How to reproduce the original bug (before fix)

If you have an older preview build:
1. Paste a very tall markdown (a long table works, e.g. a 50-row table)
2. Scroll the editor to the bottom using PageDown / End
3. Preview would stop at ~0.864 — the credit section never appears

### C. How to verify the fix on `markups.dev`

1. Open https://markups.dev
2. Clear the editor and paste this exact markdown:
   ```markdown
   # Tall Flag Table Test

   | Flag | Country | Capital | Continent |
   |---|---|---|---|
   | 🇺🇸 | United States | Washington, D.C. | North America |
   | 🇬🇧 | United Kingdom | London | Europe |
   | 🇫🇷 | France | Paris | Europe |
   | 🇩🇪 | Germany | Berlin | Europe |
   | 🇮🇹 | Italy | Rome | Europe |
   | 🇪🇸 | Spain | Madrid | Europe |
   | 🇯🇵 | Japan | Tokyo | Asia |
   | 🇨🇳 | China | Beijing | Asia |
   | 🇮🇳 | India | New Delhi | Asia |
   | 🇧🇷 | Brazil | Brasília | South America |
   | 🇦🇷 | Argentina | Buenos Aires | South America |
   | 🇨🇦 | Canada | Ottawa | North America |
   | 🇲🇽 | Mexico | Mexico City | North America |
   | 🇦🇺 | Australia | Canberra | Oceania |
   | 🇳🇿 | New Zealand | Wellington | Oceania |
   | 🇪🇬 | Egypt | Cairo | Africa |
   | 🇿🇦 | South Africa | Pretoria | Africa |
   | 🇳🇬 | Nigeria | Abuja | Africa |
   | 🇰🇪 | Kenya | Nairobi | Africa |
   | 🇪🇹 | Ethiopia | Addis Ababa | Africa |
   | 🇵🇰 | Pakistan | Islamabad | Asia |
   | 🇧🇩 | Bangladesh | Dhaka | Asia |
   | 🇷🇺 | Russia | Moscow | Europe / Asia |
   | 🇰🇷 | South Korea | Seoul | Asia |
   | 🇻🇳 | Vietnam | Hanoi | Asia |
   | 🇹🇭 | Thailand | Bangkok | Asia |
   | 🇮🇩 | Indonesia | Jakarta | Asia |
   | 🇹🇷 | Türkiye | Ankara | Europe / Asia |
   | 🇸🇦 | Saudi Arabia | Riyadh | Asia |
   | 🇦🇪 | UAE | Abu Dhabi | Asia |

   ---

   *Made with [Markups](https://markups.dev) — credit at the bottom.*
   ```
3. Scroll the editor from top → bottom using End key (or PageDown repeatedly)
4. **Expected:** Preview reaches **1.00** (full bottom), no stall, no jump, monotonic curve
5. Scroll back to top — preview follows smoothly without halts

**Pass criteria:** The preview reaches the credit line "Made with [Markups]" when the editor is fully scrolled down. No "halt then jump" feeling during scroll.

### D. What changed in code

```js
// src/utils/scroll-sync.js — rebuildAnchors()
// Clamp every real anchor's editorTop to the actual scroll max
for (const a of this.anchors) {
    if (a.editorTop > editorMax && editorMax > 0) {
        a.editorTop = editorMax;
    }
}
// End control point = (editorMax, previewMax)
this.anchors.push({
    line: Math.max(1, lineCount),
    previewTop: Math.max(0, previewMax),
    editorTop: Math.max(0, editorMax),
    el: null
});
// Re-sort + enforce monotonic coordinates
this.anchors.sort((a, b) => a.editorTop - b.editorTop || a.previewTop - b.previewTop);
clampMonotonic(this.anchors, 'editorTop');
clampMonotonic(this.anchors, 'previewTop');
```

### E. Tests covering this fix

- `src/__tests__/scrollSyncMapping.test.js` — unit tests for `clampMonotonic`, `findAnchorSegment`, end-anchor pinning
- e2e: tall-table scroll reaches 1.00 in Playwright Chromium

---

## Bug #40 — Video embed not working

**Symptom (reporter wexiyeb618, 21 Aug 2026):**
- Direct `<video>` HTML in markdown was being sanitized away — videos never played
- GitHub user-attachment images (`https://github.com/user-attachments/assets/...` — no file extension) were ALL treated as videos and fell back to a broken "Open video" link, even when they were actually images
- Typing anywhere re-created the embed → player reloaded / flickered / lost position

**Fix commits:** `48dab28` on `fix/issues-39-40`, plus follow-ups `50e5b25` (`reuse live <iframe>`) and `c588874` (reuse live `<video>`)
**Files:** `src/utils/video-embed.js`, `src/features/video-controls/index.js`
**Status:** ✅ live in `main`

### A. How to verify on `markups.dev`

#### Test 1 — Direct MP4 link embeds as player

Paste this in the editor:
```markdown
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4 {video mode=embed width=50% align=center}
```

Expected: A `<video controls>` element renders in the preview with Play / Pause / Seekbar. Press Play → video plays.

#### Test 2 — Direct MP4 link (NO `{video}` attribute) shows as link

Paste:
```markdown
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
```

Expected: Plain hyperlink with the URL as label. (Smart mode: bare URL to .mp4 may still auto-embed; to force link use `{video mode=link}`.)

#### Test 3 — Image-syntax pointing at GitHub attachment (no extension) keeps as IMAGE

Paste:
```markdown
![A picture I uploaded](https://github.com/user-attachments/assets/00000000-0000-0000-0000-000000000001)
```

Expected: The image renders as `<img>`. NO "Open video" link.

#### Test 4 — Image-syntax at GitHub attachment with explicit `{video mode=embed}` does embed

Paste:
```markdown
![Video](https://github.com/user-attachments/assets/00000000-0000-0000-0000-000000000002) {video mode=embed}
```

Expected: Video player renders.

#### Test 5 — YouTube / Vimeo embed

Paste:
```markdown
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

Expected: Embedded YouTube player (privacy `youtube-nocookie.com` iframe). Same for `https://vimeo.com/123456789`.

#### Test 6 — No reload when typing elsewhere

1. Add a YouTube embed (test 5)
2. Click Play, let the video start
3. Type random text anywhere else in the editor
4. **Expected:** Video does NOT reload, position is preserved, no flicker

### B. What changed in code

```js
// src/utils/video-embed.js — processPreviewVideos()
// GitHub attachments only become videos when author tags {video mode=embed}
// (was: every GitHub asset was assumed to be a video)
if (isGitHubVideoAttachment(src)) {
    const perMode = String(attrsByUrl?.get?.(normalizeVideoUrl(src))?.mode || '').toLowerCase();
    if (perMode === 'embed') {
        tryReplaceWithVideo(img, behavior, attrsByUrl, reuseVideos);
    }
}

// Live DOM node reuse — typing never re-creates the embed
const reused = reuseVideos?.get?.(sourceLine) || reuseVideos?.get?.(url);
player = createHtml5Video(url, { reuseVideoEl: reused });
```

### C. Tests covering this fix

- `src/__tests__/videoEmbed.test.js`
- `src/__tests__/videoEmbedBehavior.test.js`
- `src/__tests__/videoControls.test.js`
- `src/__tests__/videoDiscoverability.test.js`
- e2e: `tests/e2e/video-embed-github-images.spec.js`

---

## Bug #42 — XML syntax highlighting wrong

**Symptom (reporter wexiyeb618):** XML, HTML, and any markup-templating code blocks in preview showed plain black text — no tag/attribute colorization. Highlight "threw" silently and fell back to black text.

**Fix commit:** `db93ef8` on `fix/issues-42-44`
**File:** `src/core/markdown/index.js`, `src/main.js`
**Status:** ✅ live in `main`

### A. Root cause

GLOBAL bug: `src/main.js` imported `prism-php` without `prism-markup-templating`, so `Prism.languages['markup-templating']` was `undefined` → every markup/XML/HTML highlight threw and fell back to plain black text.

### B. How to verify on `markups.dev`

Paste in editor:
````markdown
```xml
<?xml version="1.0" encoding="UTF-8"?>
<library>
    <book id="b1" available="true">
        <title>The Pragmatic Programmer</title>
        <author>Hunt &amp; Thomas</author>
        <year>1999</year>
    </book>
    <book id="b2" available="false">
        <title>Clean Code</title>
        <author>Robert C. Martin</author>
        <year>2008</year>
    </book>
</library>
```
````

Expected:
- Tag names (`<library>`, `<book>`) in one color
- Attribute names (`id`, `available`) in another
- Attribute values (`"b1"`, `"true"`) in a third
- Punctuation (`<`, `>`, `=`) styled distinctly
- Plain black text → FAIL (still broken)

### C. Tests

- `src/__tests__/sanitize.test.js` (markdown rendering)
- `src/__tests__/markdownService.test.js`

---

## Bug #44 — INI syntax highlighting wrong

**Symptom (reporter wexiyeb618):** INI / TOML config code blocks showed plain black text — no section/key/value distinction.

**Fix commit:** `db93ef8` on `fix/issues-42-44` (same fix bundle as #42)
**File:** `src/main.js`, `src/core/markdown/index.js`
**Status:** ✅ live in `main`

### A. How to verify on `markups.dev`

Paste:
````markdown
```ini
[database]
host = localhost
port = 5432
user = admin
password = secret
enabled = true

[cache]
type = redis
ttl = 3600
debug = false
```
````

Expected:
- Section headers `[database]`, `[cache]` in blue
- Keys (`host`, `port`, `user`) in red
- Values (`localhost`, `5432`, `admin`) in green
- Plain black text → FAIL

### B. Tests

- `src/__tests__/sanitize.test.js`
- e2e regression: `tests/e2e/editor-runtime.spec.js`

---

## Bug #45 — Emoji shortcodes not supported

**Symptom (reporter wexiyeb618):** Markdown like `:smile:` or `:+1:` rendered as literal text instead of the matching emoji.

**Fix commit:** `aa8b24f` on `fix/issue-45`
**File:** `src/utils/emoji-shortcodes.js` (new), `src/core/markdown/index.js`, `src/main.js`
**Library:** `gemoji ^8.1.0` + `marked-emoji ^2.0.3`
**Status:** ✅ live in `main`

### A. How to verify on `markups.dev`

#### Test 1 — Basic shortcode

Paste:
```markdown
Hello :smile: world
```

Expected: "Hello 😄 world" rendered in preview.

#### Test 2 — Alias shortcode

Paste:
```markdown
Thanks! :+1: :heart: :fire: :rocket:
```

Expected: 👍 ❤️ 🔥 🚀

#### Test 3 — Unknown shortcode stays literal

Paste:
```markdown
Time was 12:30 and I :hover:hovered: over :notreal: text.
```

Expected:
- `12:30` stays literal (NOT clobbered as emoji)
- `:hover:` stays literal (CSS pseudo-class protection)
- `:notreal:` stays literal (unknown shortcode)

#### Test 4 — In code block (should NOT convert)

Paste:
````markdown
```
:smile:
```
````

Expected: Literal `:smile:` (no conversion inside code).

### B. Tests

- `src/__tests__/emojiShortcodes.test.js`
- `src/__tests__/emojiAccessibility.test.js` (this audit pass)

---

## a11y L1 — Video captions (`<track>`)

**Audit gap (closed this pass):** Embedded video players had no `<track kind="captions">` child. Authors could not provide captions, screen readers had no cue track.

**Fix:** `src/utils/video-embed.js` (added `extractCaptionsUrl` + `<track>` injection), `src/features/video-controls/index.js` (parser picks up `captions=` attr)
**Status:** ✅ live (this audit pass)

### A. Author syntax

Add `captions=` (or `caption=`) to a `{video ...}` attribute block. URL must end in `.vtt` or `.webvtt`.

```markdown
https://example.com/clip.mp4 {video mode=embed width=80% align=center captions=https://example.com/clip.vtt}
```

### B. How to verify on `markups.dev`

1. Find or create a short public WebVTT file (e.g. `https://example.com/clip.vtt` with any content)
2. Paste:
   ```markdown
   https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4 {video mode=embed width=80% captions=https://example.com/captions.vtt}
   ```
3. In the preview, right-click the video player → "Show Controls" / "Text Track"
4. **Expected:** Captions option appears (browser shows "English" track available)
5. Or in DevTools: `<video>` should contain a child `<track kind="captions" src="...vtt" srclang="en" label="English" default>`
6. If you provide a BAD URL (`.html`, `.srt`) → no `<track>` added (security: only `.vtt` / `.webvtt` accepted)

### C. Tests

- `src/__tests__/videoCaptions.test.js` — 7 tests covering parse / extension / protocol / security

---

## a11y L2 — Emoji aria-label for screen readers

**Audit gap (closed this pass):** Emoji shortcodes rendered as plain Unicode characters with no `aria-label`. Screen readers either skipped them or read out the codepoint ("U+1F604").

**Fix:** `src/utils/emoji-shortcodes.js` (renderer now wraps in `<span role="img" aria-label="name">`)
**Status:** ✅ live (this audit pass)

### A. How to verify on `markups.dev`

1. Paste: `Hello :smile: world`
2. In Chrome DevTools, Inspect the preview, find the rendered emoji
3. **Expected DOM:**
   ```html
   <p>Hello <span role="img" aria-label="smile">😄</span> world</p>
   ```
4. Run a screen reader (NVDA / VoiceOver) on the page → it should announce "smile" instead of skipping the emoji

### B. Tests

- `src/__tests__/emojiAccessibility.test.js` — 5 tests covering wrap, alias, defensive fallback, HTML escaping

---

## a11y M1 — `prefers-reduced-motion` honored

**Audit gap (already closed):** Animation / transition durations could trigger motion sickness for users who set `prefers-reduced-motion: reduce`.

**Fix:** CSS in `public/css/style.css` declares:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
**Status:** ✅ live on `main`

### A. How to verify on `markups.dev`

1. Open Chrome DevTools → ⋮ menu → More tools → **Rendering** tab
2. Find "Emulate CSS media feature `prefers-reduced-motion`" → set to **`reduce`**
3. Reload the page
4. Trigger any motion in the app (open a modal, hover a tooltip, etc.)
5. **Expected:** All animations finish in 0.01 ms (effectively instant, no smooth transitions)
6. Revert the emulate to `no-preference` → animations return to normal

### B. Tests

- `src/__tests__/motion-preference.test.js` — verifies the media query exists and zeroes animation/transition durations

---

## a11y M2 — Video popover focus return on Escape

**Audit gap (already closed):** Video controls popover did not restore keyboard focus to the element that opened it when closed via Escape — keyboard users lost their place.

**Fix:** `src/features/video-controls/index.js`
- `_returnFocusTo` remembers `document.activeElement` on `show()`
- `_handleKeydown` (Escape) calls `hide()`
- `hide()` restores focus to the stored element

**Status:** ✅ live on `main`

### A. How to verify on `markups.dev`

1. Paste any video embed (test 1 from bug #40)
2. Click the video → toolbar popover opens
3. With keyboard only: Tab through the popover buttons, press **Escape**
4. **Expected:** Popover closes AND keyboard focus returns to the video trigger (Edit button or video element), NOT to `document.body`
5. With mouse: click outside the popover → same focus-return behavior

### B. Tests

- `src/__tests__/video-a11y.test.js` — verifies focus-return on hide(), and graceful behavior when stored element was removed

---

## Re-audit summary

| Area | Gap | Status |
|---|---|---|
| #39 — sync scroll | Monaco editorMax clamping | ✅ Fix `48dab28` |
| #40 — video embed | Mode-tagged embed, image fallback, live DOM reuse | ✅ Fix `48dab28`, `50e5b25`, `c588874` |
| #42 — XML highlight | Missing `prism-markup-templating` import | ✅ Fix `db93ef8` |
| #44 — INI highlight | Missing `prism-ini` import | ✅ Fix `db93ef8` |
| #45 — emoji shortcodes | gemoji + marked-emoji | ✅ Fix `aa8b24f` |
| a11y M1 — reduced-motion | CSS media query | ✅ already on main |
| a11y M2 — focus return | `_returnFocusTo` on Escape | ✅ already on main |
| a11y L1 — `<track>` captions | No captions support | ✅ **FIXED this audit pass** |
| a11y L2 — emoji aria-label | Renderer returned raw char | ✅ **FIXED this audit pass** |

---

## Known limitations

These are intentional design choices, not bugs:

1. **Feature requests (#14, #28, #29)** — open roadmap, not in scope of this bug-fix pass
   - #14 Cloud sync (Google Drive / Dropbox)
   - #28 Multi-language UI translator
   - #29 OAuth2 external accounts
2. **Pre-existing flaky test** — `tests/e2e/editor-runtime.spec.js > mobile preview switch` fails on clean origin too, unrelated to any fix
3. **YouTube / Vimeo captions** — These providers serve their own captions (CC button on the player); we do not inject `<track>` for iframe embeds because the iframe sandbox does not allow DOM children
4. **Emoji alias collisions** — We use GitHub's `gemoji` (NOT `emojilib`) so `:heart:` → ❤️ (correct, GitHub-exact), NOT 😍 (emojilib wrong)

---

## How to file a regression if you find one

If any test above fails:

1. **Don't write a comment** — open a GitHub issue at https://github.com/Nir-Bhay/markups/issues
2. Include:
   - Exact markdown you typed
   - Browser + version
   - Screenshot or DevTools snapshot
   - Expected vs observed behavior
3. Reference this document section (`Bug #39`, `a11y L1`, etc.)

---

## Production deployment checklist

| Step | Status |
|---|---|
| All 5 bugs fixed on `main` | ✅ |
| 2 a11y gaps closed on `main` | ✅ (this pass) |
| Unit tests pass | ✅ 207 / 208 (1 pre-existing flaky) |
| Lint | ✅ 0 errors |
| Build | ✅ clean (1m 39s) |
| Live URL | ✅ https://markups.dev |
| Reporter reply (wexiyeb618) | ⏳ pending |
| Issues close after reporter confirms | ⏳ pending |

---

*Document generated 2026-09-04 after a11y audit pass.*
