# Markups S9 Audit Sweep — Live Test Checklist

**Date:** 2026-09-03  
**Branch:** `main` (local, uncommitted)  
**Tester:** Nirbhay  
**Scope:** 30 audit issues → 17 real bug fixes + 13 housekeeping items + 9 new test files

> ⚠️ All changes are **local only**. Do not run `git push` until you walk through every step and verify the dev server behaves as expected.

---

## 📋 Pre-flight (do these first)

- [ ] **PF-1:** Working directory is `D:\harmes\projects\markups`
- [ ] **PF-2:** Branch is `main` — verify with `git branch --show-current`
- [ ] **PF-3:** `npm test` shows **195 passing**, 1 pre-existing flake (in `src/__tests__/stats/p0-critical-fixes.test.js` — passes 10/10 in isolation)
- [ ] **PF-4:** `npm run lint` shows **0 errors**
- [ ] **PF-5:** `npm run build` completes in ~80 seconds with no errors
- [ ] **PF-6:** `npm audit` shows **0 vulnerabilities**
- [ ] **PF-7:** `grep -c "cdnjs.cloudflare.com" src/main.js` returns **0** (was 6 before)
- [ ] **PF-8:** `git status --short` shows the expected list of M (modified) + ?? (untracked) files

---

## 🚀 Test 1 — Dev server boots clean

- [ ] **T1-1:** Run `npm run dev`
- [ ] **T1-2:** Open the printed URL (usually `http://localhost:5173/`)
- [ ] **T1-3:** Page loads within 3 seconds, **no white screen**, **no console errors**
- [ ] **T1-4:** Open DevTools console, expect only warnings (no errors)
- [ ] **T1-5:** Editor pane is visible on left, preview on right, toolbar at top

**✅ Pass condition:** App loads with full UI, no red errors in console.

---

## 🔒 Test 2 — Security fixes (XSS escaping)

### T2.1 — Heading aria-label is escaped (H2)
**Setup:** Click the Write pane, type a heading with special characters.
- [ ] **T2.1.1:** Type `# Foo "bar" <script>alert(1)</script>`
- [ ] **T2.1.2:** Look at the rendered heading — it shows literal text (no popup)
- [ ] **T2.1.3:** Right-click the anchor icon next to heading → inspect
- [ ] **T2.1.4:** The `aria-label` attribute should contain escaped entities: `Link to Foo &quot;bar&quot; &lt;script&gt;alert(1)&lt;/script&gt;`
- [ ] **T2.1.5:** DevTools console: **no** `alert` dialog appeared

### T2.2 — Table of contents is sanitized (H3)
- [ ] **T2.2.1:** Enable Table of Contents in Settings (if not already on)
- [ ] **T2.2.2:** Type headings with HTML in them:
  ```md
  # Heading <img src=x onerror=alert(1)>
  ## Subheading [text](javascript:alert(1))
  ```
- [ ] **T2.2.3:** Click the TOC link in the preview
- [ ] **T2.2.4:** **No** alert dialog fires
- [ ] **T2.2.5:** Inspect TOC `<a>` elements — they should NOT contain `onerror` or `javascript:` URIs

### T2.3 — Image URLs are escaped (M1)
- [ ] **T2.3.1:** Paste this markdown:
  ```md
  ![alt](http://x.com/x" onerror="alert(1))
  ```
- [ ] **T2.3.2:** Preview shows the image (or a placeholder if URL unreachable)
- [ ] **T2.3.3:** **No** alert dialog fires
- [ ] **T2.3.4:** DevTools → Elements → find the `<img>` → its `src` attribute should be the literal URL (not broken)

### T2.4 — Filenames with brackets in alt text (M2)
- [ ] **T2.4.1:** Drag-drop an image file named `test]name.png` into the editor
- [ ] **T2.4.2:** The inserted markdown should be:
  `![test\]name](markups-img:<id>)`
- [ ] **T2.4.3:** The image renders correctly (no broken link syntax)
- [ ] **T2.4.4:** DevTools → Elements → the `<img>` exists with correct src

### T2.5 — Large image upload (M3)
- [ ] **T2.5.1:** Find any image ≥ 2 MB (e.g. a phone photo)
- [ ] **T2.5.2:** Drag-drop into editor
- [ ] **T2.5.3:** Insertion succeeds — **no** `DOMException` toast
- [ ] **T2.5.4:** Image renders inline as base64

### T2.6 — Print title is escaped (L10)
- [ ] **T2.6.1:** Open File menu → Print (Ctrl+P)
- [ ] **T2.6.2:** In the popup print window, View Source
- [ ] **T2.6.3:** The `<title>` tag should be the document title (no `<script>` injection even if title contains `<`)

**✅ Pass condition:** All 6 sub-tests show no alert/XSS execution, DevTools clean.

---

## 🧠 Test 3 — Memory leak fixes

### T3.1 — Listener registry disposes (H1)
This is a long-running test, harder to observe visually:
- [ ] **T3.1.1:** Open DevTools → Performance → click Record
- [ ] **T3.1.2:** Open and close: Stats modal (3x), Help modal (3x), Settings modal (3x), Search overlay (3x), Callout dropdown (3x), Fullscreen toggle (3x)
- [ ] **T3.1.3:** Stop recording
- [ ] **T3.1.4:** Inspect event listeners on `document` — should show only ONE copy of each (not 18×)
- [ ] **T3.1.5:** If you can run `app.dispose()` via console: `import('./src/app.js').then(m => m.default.dispose())` — then re-mount — listener count stays flat

### T3.2 — activeDocId eviction safety (M4)
- [ ] **T3.2.1:** Open DevTools → Application → LocalStorage
- [ ] **T3.2.2:** Create 10+ documents (different titles)
- [ ] **T3.2.3:** Manually fill localStorage near quota: open 50MB+ of images in docs
- [ ] **T3.2.4:** Refresh page
- [ ] **T3.2.5:** The active document should still load (or fallback to first remaining)
- [ ] **T3.2.6:** **No** silent empty editor with stale content

### T3.3 — editor.getValue caching (M9)
- [ ] **T3.3.1:** Insert 10+ images in one document
- [ ] **T3.3.2:** Open DevTools → Performance → Record
- [ ] **T3.3.3:** Type 50 characters
- [ ] **T3.3.4:** Stop recording
- [ ] **T3.3.5:** Look for `editor.getValue()` calls in flame graph — should appear ~1×, not per-keystroke for image store

**✅ Pass condition:** Listener counts flat, no silent editor failure, image store not blocking.

---

## ♿ Test 4 — Accessibility fixes

### T4.1 — Search overlay dialog semantics (H5)
- [ ] **T4.1.1:** Press Ctrl+F (or click search button) to open search overlay
- [ ] **T4.1.2:** Open DevTools → Elements → find `#search-overlay`
- [ ] **T4.1.3:** Verify it has: `role="dialog"`, `aria-modal="true"`, `aria-label="Search in document"`
- [ ] **T4.1.4:** Find `#search-input` → verify it has `aria-label="Search preview"`
- [ ] **T4.1.5:** Tab key moves focus between search buttons, not outside the overlay
- [ ] **T4.1.6:** Press Escape → overlay closes

### T4.2 — Video insert popover (M8)
- [ ] **T4.2.1:** Click the video insert button in toolbar
- [ ] **T4.2.2:** DevTools → Elements → find `#video-insert-popover`
- [ ] **T4.2.3:** Verify: `role="dialog"`, `aria-modal="true"`, `aria-label="Insert video"`
- [ ] **T4.2.4:** URL input field receives focus automatically

### T4.3 — Clickable divs converted to buttons (H4)
- [ ] **T4.3.1:** Open Settings → Templates modal (if exists) → DevTools → inspect a template card
- [ ] **T4.3.2:** Should now be a `<button type="button">` not a `<div>`
- [ ] **T4.3.3:** Tab to it → focus ring visible → Enter activates
- [ ] **T4.3.4:** For linter items (when lint warnings appear): same — button elements, keyboard activatable

### T4.4 — Mermaid diagrams accessible (L12)
- [ ] **T4.4.1:** Paste a mermaid block:
  ````md
  ```mermaid
  graph TD; A-->B; B-->C;
  ```
  ````
- [ ] **T4.4.2:** Wait for diagram to render
- [ ] **T4.4.3:** DevTools → find `<div class="mermaid">` → should have `role="img"` and `aria-label="Diagram"`
- [ ] **T4.4.4:** Screen reader announces "Diagram" or the title

### T4.5 — Copy button announces (L13)
- [ ] **T4.5.1:** Click any "Copy code" or "Copy" button in preview
- [ ] **T4.5.2:** DevTools → inspect copy button → find `<span aria-live="polite">` inside
- [ ] **T4.5.3:** The text inside changes to "Copied!" or "Failed" → screen reader announces

### T4.6 — Word count consistent (M5)
- [ ] **T4.6.1:** Open a document with mixed content: `# Heading 1`, `**bold**`, `[link](url)`, `` `code` ``
- [ ] **T4.6.2:** Note word count in **status bar** (bottom-left)
- [ ] **T4.6.3:** Open **Stats modal** → note word count there
- [ ] **T4.6.4:** Both numbers should match exactly

### T4.7 — Skip-nav link exists (L11)
- [ ] **T4.7.1:** Load the page
- [ ] **T4.7.2:** Press Tab once — a "Skip to editor" link should appear
- [ ] **T4.7.3:** Press Enter on it → focus jumps to editor
- [ ] **T4.7.4:** DevTools → find `.skip-nav-link` in index.html (line ~445)

### T4.8 — Color contrast (L14)
- [ ] **T4.8.1:** In light mode, look at any muted text (e.g. timestamps, hint text)
- [ ] **T4.8.2:** Compare to white background
- [ ] **T4.8.3:** Run a contrast check via DevTools → Accessibility → pick the text element → Contrast ratio
- [ ] **T4.8.4:** Should be ≥ 7:1 (was ~4.5:1 before, now `#475569`)

**✅ Pass condition:** All a11y attributes present, keyboard nav works, screen reader announces, contrast passes AA+.

---

## 🌐 Test 5 — HTML export offline (L9)

### T5.1 — File download export
- [ ] **T5.1.1:** Open a document with rich content: headings, code blocks (with syntax), tables, lists
- [ ] **T5.1.2:** File → Export → HTML (or click download button)
- [ ] **T5.1.3:** Save the file, then **disconnect from internet** (turn off WiFi)
- [ ] **T5.1.4:** Open the downloaded .html file in browser
- [ ] **T5.1.5:** Verify: styling looks correct (headings styled, code blocks colored, tables aligned)
- [ ] **T5.1.6:** DevTools → Network tab → NO requests to `cdnjs.cloudflare.com`

### T5.2 — View source check
- [ ] **T5.2.1:** Open the exported .html in a text editor
- [ ] **T5.2.2:** Search for "cdnjs" — should return 0 matches
- [ ] **T5.2.3:** Search for "stylesheet" — should only find inline `<style>` tags
- [ ] **T5.2.4:** File size should be reasonable (~25-50 KB depending on document)

### T5.3 — Print dialog (the 4 print/export paths)
- [ ] **T5.3.1:** File → Print (Ctrl+P)
- [ ] **T5.3.2:** When print preview opens: View Source
- [ ] **T5.3.3:** No `<link rel="stylesheet" href="https://cdnjs...">` should appear
- [ ] **T5.3.4:** All styles inline in `<style>` tags

**✅ Pass condition:** Exported HTML works offline, zero external CSS requests.

---

## 🏠 Test 6 — Repo hygiene (CI + identity)

### T6.1 — package.json identity (L3)
- [ ] **T6.1.1:** Open `package.json`
- [ ] **T6.1.2:** Verify: `"name": "markups"` (was `markdown-live-preview`)
- [ ] **T6.1.3:** Verify: `repository.url` ends with `/markups.git`
- [ ] **T6.1.4:** Verify: `bugs.url` ends with `/markups/issues`
- [ ] **T6.1.5:** Verify: `homepage` is `https://markups.dev`

### T6.2 — CI workflow (L1)
- [ ] **T6.2.1:** Open `.github/workflows/ci.yml`
- [ ] **T6.2.2:** Verify 3 jobs: `lint`, `test`, `build`
- [ ] **T6.2.3:** Verify: build only runs on push to main (`if: github.event_name == 'push'`)

### T6.3 — Issue templates (L2)
- [ ] **T6.3.1:** Open `.github/ISSUE_TEMPLATE/`
- [ ] **T6.3.2:** Files exist: `bug_report.md`, `feature_request.md`, `config.yml`
- [ ] **T6.3.3:** Open `config.yml` — verify it disables blank issues

### T6.4 — README (L7)
- [ ] **T6.4.1:** Open `README.md`
- [ ] **T6.4.2:** Verify badges at top (CI status, license, npm version)
- [ ] **T6.4.3:** Find "Recent improvements" section — should mention a11y, memory leak, XSS fixes
- [ ] **T6.4.4:** All `markdown-live-preview` references → `markups`

**✅ Pass condition:** All repo metadata is consistent with the public name.

---

## 🐛 Test 7 — Original issue regressions (#40 + #44)

### T7.1 — Issue #40 (video embed)
- [ ] **T7.1.1:** Type bare URL:
  ```md
  https://example.com/sample.mp4
  ```
- [ ] **T7.1.2:** Preview shows playable video (or fallback "Open video" link)
- [ ] **T7.1.3:** Type `.png` image link:
  ```md
  ![photo](https://example.com/photo.png)
  ```
- [ ] **T7.1.4:** Preview shows the image — **no** "Open video" label
- [ ] **T7.1.5:** Type YouTube URL:
  ```md
  https://www.youtube.com/watch?v=dQw4w9WgXcQ
  ```
- [ ] **T7.1.6:** Preview shows YouTube iframe
- [ ] **T7.1.7:** Keep typing — video player does NOT flicker or reload

### T7.2 — Issue #44 (INI preview)
- [ ] **T7.2.1:** Type:
  ````md
  ```ini
  [DEFAULT]
  host = localhost
  port = 8080
  # comment line
  ```
  ````
- [ ] **T7.2.2:** Preview shows INI block
- [ ] **T7.2.3:** `[DEFAULT]` → blue color
- [ ] **T7.2.4:** `host`, `port` → purple color (keys)
- [ ] **T7.2.5:** `localhost`, `8080` → dark blue (values)
- [ ] **T7.2.6:** `# comment line` → gray (comment)
- [ ] **T7.2.7:** DevTools → `<pre><code class="language-ini">` → `.token.section-name.selector`, `.token.key.attr-name`, `.token.value.attr-value` all present

**✅ Pass condition:** Both original issues resolved, no regression on already-fixed bugs.

---

## 📦 Test 8 — Full integration smoke test

- [ ] **T8-1:** Create new document → type markdown with all features in one doc:
  - headings (with special chars)
  - code blocks (XML, INI, JS, mermaid)
  - tables, lists, blockquotes
  - links, images (including image-link)
  - bare video URL + YouTube
  - emoji shortcodes like `:smile:` `:fire:`
  - inline HTML that should be sanitized
- [ ] **T8-2:** Editor + preview both render correctly, no console errors
- [ ] **T8-3:** Switch tabs (if multi-doc) — active tab stays consistent
- [ ] **T8-4:** Click save → reload page → document persists
- [ ] **T8-5:** Open settings, search dialog, stats modal — all open and close cleanly
- [ ] **T8-6:** Run keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+S) — all work
- [ ] **T8-7:** Export as HTML → file is self-contained (offline test from T5)

**✅ Pass condition:** App works end-to-end with all new features.

---

## 🔧 Pre-push final checks

- [ ] **PP-1:** `git status --short` — review the changed files list, ensure nothing unexpected
- [ ] **PP-2:** `git diff --stat` — review line counts per file, sanity check
- [ ] **PP-3:** `gh auth status` — confirm `Nir-Bhay` is the active account (NOT baythe19 or abhayhiwse-hub)
- [ ] **PP-4:** `npm test` — final check, 195/196 pass (1 known flake)
- [ ] **PP-5:** `npm run lint` — final check, 0 errors
- [ ] **PP-6:** `npm run build` — final check, clean

---

## 🚀 Push sequence (after all ✅)

```bash
# 1. Switch to correct GitHub account (Nir-Bhay owns this repo)
gh auth switch --user Nir-Bhay

# 2. Stage everything
git add .

# 3. Commit with the S9 audit summary as message
git commit -m "fix(audit-sweep): resolve 30 issues — XSS, memory leaks, a11y, offline exports

G1 XSS/security (6): H2 aria-label, H3 TOC sanitize, M1 image attrs,
   M2 filename alt, M3 btoa chunked, L10 print title
G2 memory leak (3): H1 listener registry (~18 listeners), M4 activeDocId,
   M9 editor.getValue cache
G3 a11y modals (3): H5 search overlay, M8 video popover
G4 a11y widgets (5): H4 clickable divs→buttons, L12 mermaid roles,
   L13 copy aria-live, M5 word count unified
G5 repo hygiene: L1 CI, L2 issue templates, L3 pkg.json → markups, L7 README
G6 housekeeping: L14 --text-muted color, branch audit, PR review
G7 offline export (1): L9 inline CSS via src/styles/export.css

Tests: 153 → 196 (+43 new), 195 passing
Build: clean, 0 lint errors, 0 npm audit vulns"

# 4. Push to origin/main
git push origin main

# 5. Post wexiyeb618 replies
gh issue comment 40 --repo Nir-Bhay/markups --body-file /tmp/issue40-reply.md
gh issue comment 44 --repo Nir-Bhay/markups --body-file /tmp/issue44-reply.md

# 6. (Optional) Clean up merged local branches
git branch -d fix/issue-45 fix/issues-39-40 fix/issues-42-44 chore/security-deps
git push origin --delete fix/issue-45 fix/issues-39-40 fix/issues-42-44 chore/security-deps
```

---

## 🆘 If something fails

### XSS test triggers alert
- That's bad — do NOT push. Tell me the test ID and your markdown input.

### Tests fail unexpectedly
- Run just the failing test: `npx vitest run src/__tests__/<file>.test.js`
- Send me the failure output. Likely fix is assertion tightening.

### Build fails
- Check `dist/` directory — might be stale. Delete `dist/` and re-run.
- Run `npm install` to ensure lockfile matches.

### Push rejected by GitHub
- Means another push happened. Run `git pull --rebase origin main` first, then push again.

### CI fails after push
- Go to https://github.com/Nir-Bhay/markups/actions → check the failing job
- Most likely: a test flake. Re-run the workflow.

---

## ✅ Sign-off

- [ ] **All Test 1 checks passed**
- [ ] **All Test 2 (Security) checks passed** — critical, do not skip
- [ ] **All Test 4 (A11y) checks passed** — important for users
- [ ] **All Test 5 (Offline export) checks passed** — proves CDN removal works
- [ ] **All Test 7 (Issue regressions) checks passed** — original bugs stay fixed
- [ ] **All Test 8 (Integration) checks passed**

**Reviewer:** _____________________  **Date:** _____________  
**Push approved:** [ ] Yes  [ ] No (if no, list blockers below)

**Blockers / concerns:**

_______________________________________________

_______________________________________________

---

*Generated 2026-09-03 by Hermes audit sweep S9. 8 test groups, 60+ individual checkboxes, ~30 min walk-through.*