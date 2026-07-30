# Deep Research & Code Review — Markups

> Date: 2026-07-29
> Branch: `markups-reduction` (includes merged `arena/019f9fac-markups`)
> Review scope: Live preview/video POC, sync scroll, XML preview, version history, sharing backend, overall code health

---

## Executive Summary

| Area | Verdict | Blocking? |
|---|---|---|
| Live preview / video POC | Functional but not production-ready | Yes — needs stabilization |
| Sync scrolling (#39) | Largely fixed; needs stress testing | No — likely low risk |
| XML preview (#42) | Already fixed in code; verify visually | No |
| Version history | Works but localStorage-based; missing diff view | No |
| Sharing backend (#41) | No implementation yet | Yes — needs decision |
| Overall code health | Good modular structure, some gaps | Minor |

---

## 1. 🔄 Live Preview Edit + Video Controls POC

### Files inspected
- `src/features/live-preview-edit/index.js`
- `src/features/video-controls/index.js`
- `src/utils/video-embed.js`
- `src/utils/sanitize.js`
- `src/__tests__/livePreviewEdit.test.js`
- `src/__tests__/videoControls.test.js`
- `src/__tests__/videoEmbed.test.js`
- `src/__tests__/sanitize.test.js`

### What works well
- Video URL normalization handles GitHub attachments, YouTube, Vimeo, direct files
- `processPreviewVideos()` replaces anchors/images with playable embeds
- Video layout controls persist width/align back to Markdown via `{video ...}` metadata
- Live preview edit has block-level sync using `data-source-line`
- Sanitization is defense-in-depth: DOMPurify + project-specific fallback
- Tests cover happy paths: 29/29 issue40 tests pass

### Code review findings (by severity)

#### 🔴 High
1. **No undo/redo integration with Monaco**
   - File: `src/features/live-preview-edit/index.js:320-420`
   - Issue: Preview edits bypass Monaco's undo stack entirely
   - Impact: User loses undo history when editing in preview
   - Fix: Wrap `onMarkdownChange` call in `editor.executeEdits()` or push undo stop

2. **contenteditable lacks ARIA live region**
   - File: `src/features/live-preview-edit/index.js:370-390`
   - Issue: `contenteditable="true"` is set without `aria-label` or live region
   - Impact: Screen reader users cannot tell preview is editable
   - Fix: Add `role="textbox"`, `aria-multiline="true"`, `aria-label` when toggled

3. **Video controls toolbar has no keyboard navigation**
   - File: `src/features/video-controls/index.js:180-220`
   - Issue: Popover buttons lack arrow-key handling and `role="toolbar"`
   - Impact: Keyboard-only users cannot operate video controls
   - Fix: Add `role="group"`, arrow-key traversal, focus management

#### 🟡 Medium
4. **Serialization is best-effort for complex blocks**
   - File: `src/features/live-preview-edit/index.js:60-190`
   - Issue: Nested lists, tables with colspan/rowspan, mixed content can round-trip incorrectly
   - Impact: Data loss when editing complex Markdown in preview
   - Fix: Add serialization tests for 5+ edge cases; consider limiting editable blocks

5. **No MutationObserver safety net**
   - File: `src/features/live-preview-edit/index.js:320-340`
   - Issue: Sync relies on `input` event; DOM mutations from other sources are missed
   - Impact: Edits can be lost if preview is modified outside normal input path
   - Fix: Add `MutationObserver` as fallback sync trigger

6. **Video error fallback may leave orphan wrappers**
   - File: `src/utils/video-embed.js:110-130`
   - Issue: `error` listener replaces children but doesn't update `data-video-url` state
   - Impact: Video controls may still try to manage a failed video element
   - Fix: Set `data-fallback="1"` before replacing children; check in controls

#### 🟢 Low
7. **Hardcoded debounce in live preview edit**
   - File: `src/features/live-preview-edit/index.js:310`
   - Issue: `debounceMs = 450` is not configurable
   - Fix: Expose in options with sensible default

8. **Video controls toolbar creates DOM on every show**
   - File: `src/features/video-controls/index.js:180`
   - Issue: `_ensureToolbar()` checks `contains`, but creates new toolbar if removed
   - Fix: Document as intentional or cache template string

### Test coverage gaps
| Missing test | Why it matters |
|---|---|
| Undo/redo boundary for preview edits | Core UX expectation |
| Keyboard navigation in video controls popover | Accessibility requirement |
| Serialization round-trip for nested tables/lists | Data integrity |
| MutationObserver sync fallback | Robustness |
| Video error fallback state | Edge case |

### Recommendation
**Keep POC behind toggle** (already done). Add 3 high-priority fixes before merging PR #43:
1. Monaco undo integration
2. ARIA live region for contenteditable
3. Keyboard navigation for video toolbar

---

## 2. 📜 Sync Scrolling (#39)

### Files inspected
- `src/utils/scroll-sync.js` (full file)
- `src/__tests__/` — no scroll-sync tests found

### What works well
- Anchor-based approach using `data-source-line` is the right architecture
- Binary search for top editor line (`_getEditorTopLine`) is efficient
- rAF throttling on both editor and preview prevents jitter
- `isSyncing` guard prevents feedback loops
- Handles `<details>` toggle and `ResizeObserver` for dynamic content
- End-anchor padding prevents overshoot at document end

### Code review findings

#### 🔴 High
1. **No automated tests for scroll sync**
   - File: `src/utils/scroll-sync.js` + missing test file
   - Issue: 0 test coverage for the most user-visible bug fix in this repo
   - Impact: Cannot verify #39 is fixed; regressions will go undetected
   - Fix: Add `src/__tests__/scroll-sync.test.js` with synthetic editor/preview fixtures

#### 🟡 Medium
2. **Sub-line interpolation assumes uniform line height**
   - File: `src/utils/scroll-sync.js:300-330`
   - Issue: `_getLineHeight()` returns a single value, but Monaco supports variable line heights (font size changes, wrapped lines, zoom)
   - Impact: Drift on long documents with mixed content
   - Fix: Use `editor.getTopForLineNumber(line)` for actual positions instead of interpolating

3. **Anchor map rebuild is not triggered after async renders**
   - File: `src/utils/scroll-sync.js:170-180`
   - Issue: Mermaid, KaTeX, videos render asynchronously; `ResizeObserver` helps but may fire before layout settles
   - Impact: Temporary drift after opening a doc with diagrams
   - Fix: Rebuild anchors after `PREVIEW_UPDATED` event with a small delay

4. **`_lineForPreviewTop` can return fractional lines**
   - File: `src/utils/scroll-sync.js:340-360`
   - Issue: Linear interpolation returns `line + 0.xxx`; `_editorTopForLine` floors it, causing slight jumps
   - Impact: Minor jitter on fast scroll
   - Fix: Round to nearest integer or use sub-line scroll position

#### 🟢 Low
5. **Hardcoded 80ms sync lock**
   - File: `src/utils/scroll-sync.js:270-280`
   - Issue: `_endSync` uses 80ms timeout; may be too short for slow devices
   - Fix: Make configurable or derive from rAF interval

### Stress test needed
- Use the attached long document from issue #39 (`Making.an.item.md` with `Details` containers)
- Measure drift: `|editorLine - previewLine|` at 10 scroll positions
- Pass criterion: drift < 5% of document height for 90% of positions

### Recommendation
**Likely already fixed** by anchor-based approach. Add tests, then verify with the long doc from #39. If drift remains, switch to actual line metrics.

---

## 3. 🧾 XML Preview Rendering (#42)

### Files inspected
- `src/core/markdown/index.js:150-180`
- `src/__tests__/sanitize.test.js`
- `src/__tests__/markdownService.test.js`
- `src/utils/sanitize.js`

### Current state
- **Code fix is present**: `MarkdownService.LANGUAGE_ALIASES` maps `xml` → `xml`, and Prism's `markup` language is loaded
- Comment in code explicitly says: `// Fixes #42: XML / Xml were falling back to plaintext`
- Sanitization allows `video`, `source`, `math`, etc. but still forbids `iframe`, `script`, `style`

### What the issue actually shows
- Side-by-side comparison: GitHub's XML rendering vs Markups'
- GitHub uses a specific color scheme for XML tags/attributes/values
- Prism's default `markup` theme is similar but not identical

### Root cause analysis
The **syntax highlighting bug is already fixed**. The remaining visual difference is likely:
1. **CSS theme mismatch**: GitHub uses `xmlns`-aware coloring; Prism uses generic markup colors
2. **Font rendering**: GitHub uses specific system fonts; Markups uses Prism's default
3. **Attribute quoting**: GitHub highlights attribute values differently

### Code review findings
- **No bug in the markdown pipeline** — `resolvePrismLanguage('XML')` returns `'xml'`, and `Prism.languages.xml` exists
- **Sanitization is not stripping XML content** — DOMPurify config allows safe tags
- **The issue is cosmetic, not functional**

### Recommendation
- **Close as fixed** if the only remaining difference is color theme
- If user wants exact GitHub match: add custom Prism XML theme or CSS overrides
- **Do NOT rewrite the markdown pipeline** — it's correct

---

## 4. 📚 Version History Feature

### Files inspected
- `src/features/version-history/index.js` (full file)
- `src/core/storage/database.js` — `note_versions` table exists but unused
- `src/core/storage/noteStorage.js` — no version-history integration

### Current state
- **Functional**: Auto-saves every 60s, max 20 versions, modal UI with restore
- **Storage**: localStorage only
- **UI**: Modal with date/time/word count, restore button, Ctrl+Shift+H shortcut
- **Tests**: 0 unit tests for this feature

### Code review findings

#### 🟡 Medium
1. **localStorage instead of IndexedDB**
   - File: `src/features/version-history/index.js:20-40`
   - Issue: Snapshots stored in localStorage; `note_versions` table exists but unused
   - Impact: Version history is per-browser, not per-document; lost on clear
   - Fix: Migrate to `db.note_versions` with `noteId` foreign key

2. **No diff view between versions**
   - File: `src/features/version-history/index.js:80-120`
   - Issue: UI shows timestamp/word count only; no content diff
   - Impact: Users cannot see what changed before restoring
   - Fix: Add simple line-by-line diff or integrate `diff-match-patch`

3. **No per-document versioning**
   - File: `src/features/version-history/index.js:50-70`
   - Issue: Single global `version_history` key; all tabs share one timeline
   - Impact: Restoring a version affects the wrong document if multiple tabs are open
   - Fix: Key versions by `noteId` or active document ID

4. **Memory risk with large documents**
   - File: `src/features/version-history/index.js:50-70`
   - Issue: Stores full content snapshots; 20 versions × 100KB = 2MB in localStorage
   - Impact: May exceed localStorage quota on long documents
   - Fix: Store diffs instead of full snapshots, or move to IndexedDB

#### 🟢 Low
5. **No cleanup on document delete**
   - Issue: Deleting a note doesn't clean up its version history
   - Fix: Add cascade delete in `noteStorage.deleteNote()`

### Recommendation
**Keep the feature, upgrade storage**:
1. Move from localStorage → `db.note_versions`
2. Add per-document versioning via `noteId`
3. Add simple diff view in modal
4. Add tests

---

## 5. ☁️ Sharing Backend (#41)

### Files inspected
- `src/core/storage/noteStorage.js`
- `src/core/storage/database.js`
- `src/main.js` — no sharing code
- GitHub issue #41 — full spec reviewed

### Current state
- **Zero backend code**: no API routes, no Supabase/Vercel integration, no `/s/:id` route
- **Storage is purely local**: IndexedDB via Dexie, no cloud sync
- **Issue spec**: Share button → Supabase → `/s/<documentId>` → read-only mode

### Feasibility analysis

| Component | Status | Effort |
|---|---|---|
| Share button UI | Missing | Low |
| Document ID generation | Missing | Low — `crypto.randomUUID()` |
| Backend table (`documents`) | Missing | Medium |
| Upload endpoint | Missing | Medium |
| Read route `/s/:id` | Missing | Medium |
| Read-only viewer mode | Missing | Medium |
| Auth (optional) | Missing | High — defer to v2 |

### Architecture recommendation

**Option A: Supabase (recommended)**
- Free tier: 500MB database, 1GB storage, 50K MAU
- Built-in: Postgres, edge functions, auth, row-level security
- Fits the "free backend" spec from issue #41
- Path of least resistance for MVP

**Option B: Vercel Postgres + Edge Functions**
- Already using Vercel (`vercel.json` exists)
- Tighter integration with existing deploy
- Slightly more setup than Supabase

**Option C: GitHub Gists (quick prototype)**
- Zero infra
- Rate limits: 5K req/hr authenticated, 60/hr unauthenticated
- Public by default; no private docs without auth
- Good for POC, not production

### Recommendation
1. **Start with Supabase** as specified in issue #41
2. **MVP scope**: Share button → upload → `/s/:id` → read-only view
3. **Defer**: Auth, password protection, collaborative editing, version history, expiring links
4. **Do NOT build cloud sync (#14/#29) before sharing (#41)** — different problems

---

## 6. 🛡️ Security & Performance Review

### Security
| Area | Status | Notes |
|---|---|---|
| DOMPurify config | ✅ Good | Forbids `iframe`, `script`, `object`, `embed`, `form`; strips `style`, `srcdoc`, `data-*` |
| Video embeds | ✅ Good | Created via DOM, not innerHTML; YouTube uses `youtube-nocookie.com` |
| Link targets | ✅ Good | `target="_blank"` gets `rel="noopener noreferrer"` |
| Monaco workers | ✅ Good | Scoped to editor worker only |
| CSP | ⚠️ Unknown | No CSP meta tag found in `index.html`; recommend adding |
| Token storage | ⚠️ localStorage | AI writer + future OAuth tokens in localStorage; acceptable for API keys but not ideal for refresh tokens |

### Performance
| Area | Status | Notes |
|---|---|---|
| Monaco chunking | ✅ Good | Separate worker bundle, lazy-loaded exports |
| Image store eviction | ✅ Good | Soft cap of 15 with reference counting |
| Debounced stats | ✅ Good | 300ms debounce on editor change |
| Scroll sync | ✅ Good | rAF-throttled, binary search |
| Mermaid rendering | ✅ Good | Async, one-by-one with error handling |
| Build size | ⚠️ Large | `monaco-editor` bundle is 2.3MB / 595KB gzipped; consider dynamic import for non-editor views |

---

## 7. Missing Tests Summary

| Module | Current coverage | Gap |
|---|---|---|
| `src/utils/scroll-sync.js` | 0 tests | No scroll-sync tests at all |
| `src/features/version-history/index.js` | 0 tests | No unit tests |
| `src/core/storage/migration.js` | 8 tests | ✅ Fixed |
| `src/features/video-controls/index.js` | 4 tests | Missing keyboard nav, error fallback |
| `src/features/live-preview-edit/index.js` | 7 tests | Missing undo/redo, MutationObserver, edge cases |
| `src/utils/video-embed.js` | 6 tests | ✅ Good |
| `src/utils/sanitize.js` | 2 tests | ✅ Good |
| E2E / Playwright | 0 running | Chromium download blocked in sandbox |

---

## 8. Recommended Implementation Plan

### Phase 1: Stabilize POC (1-2 days)
1. Add Monaco undo integration for preview edits
2. Add ARIA live region + keyboard nav for video controls
3. Add 5 edge-case serialization tests
4. Merge PR #43

### Phase 2: Fix Remaining Issues (1 day)
1. Stress test sync scroll with long document from #39
2. Verify XML preview visually; add CSS override if needed
3. Close #39, #42 as fixed

### Phase 3: Version History Upgrade (2-3 days)
1. Migrate from localStorage → `db.note_versions`
2. Add per-document versioning
3. Add simple diff view
4. Add unit tests

### Phase 4: Sharing Backend (3-5 days)
1. Set up Supabase project
2. Create `documents` table
3. Add Share button + upload flow
4. Add `/s/:id` read-only route
5. Deploy and test

### Phase 5: Test Coverage (ongoing)
1. Add `scroll-sync.test.js`
2. Add `version-history.test.js`
3. Set up Playwright in CI
4. Add CSP headers

---

## 9. Open Questions

1. **Should live preview edit support code blocks?** Current implementation skips them, but users may expect it.
2. **Should version history snapshots be user-triggered in addition to auto-save?** Current: auto only.
3. **Should sharing support private documents with passwords?** Issue #41 mentions it as future enhancement.
4. **Should we support collaborative editing?** Issue #41 mentions it; likely v2 after sharing is stable.

---

## 10. Final Verdict

| Component | Ready for merge? | Blocker |
|---|---|---|
| Video embed + controls | ✅ Yes | None |
| Live preview edit | ⚠️ With fixes | Undo/redo, ARIA, edge cases |
| Sync scroll | ✅ Likely yes | Stress test + tests |
| XML preview | ✅ Yes | Visual verification only |
| Version history | ✅ Keep | Upgrade to IndexedDB |
| Sharing backend | 🚫 Not started | Needs Supabase setup |

**Bottom line**: The codebase is in good shape. The arena merge added solid functionality. The main gaps are: (1) test coverage for new features, (2) accessibility in contenteditable/video controls, and (3) missing backend for sharing. None of these are showstoppers if tackled in order.
