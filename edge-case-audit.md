# Markups Edge-Case Bug & Error-Handling Audit

Focus areas: async without try/catch, null checks, Promise.race/all, event-handler throws, JSON.parse, large-file handling, Unicode, iOS/Safari, singleton pattern, rapid typing / debounce.

---

## High Severity

- **`src/main.js:711`** — `Promise.all` in tab delete without rejection handling.  
  Scenario: User deletes a note/folder; `fileTreeStorage.deleteNodeRecursive` returns note IDs, then `Promise.all(result.deletedNoteIds.map((noteId) => noteStorage.deleteNote(noteId)))` runs.  
  Breaks: If any `deleteNote` IDB write fails (quota, corruption, transaction abort), the whole `Promise.all` rejects. There is no `.catch()` or `try/catch` around this await, so the rejection is unhandled and can crash the tab-close flow or surface as a silent failure.  
  Fix: Wrap in `try/catch` and degrade gracefully (e.g., continue deleting remaining notes, log failures, show toast).

- **`src/core/storage/fileTreeStorage.js:126`** — `Promise.all` in `reorderNode` without rejection handling.  
  Scenario: User drag-drops a tab to reorder; `reorderNode` fires `Promise.all(siblings.map((item, idx) => db.file_nodes.update(...)))`.  
  Breaks: A single failed Dexie update (IDB transaction error on iOS Safari low-memory kill) rejects the entire promise. The caller `main.js:6665` does not catch it, producing an unhandled rejection.  
  Fix: Add `.catch(() => {/* log and continue */})` or use `Promise.allSettled` so one bad row does not fail the whole reorder.

- **`src/main.js:4372`** — `editor.setValue(content)` in `handleFileImport` without init guard.  
  Scenario: User imports a `.md` file via the file input. The `FileReader.onload` callback calls `editor.setValue(content)`.  
  Breaks: If the file-input `change` event fires before Monaco finishes initializing (rare but possible on slow devices or when the editor container is hidden), `editor` is `null` and `setValue` throws `TypeError: Cannot read properties of null (reading 'setValue')`. Because this happens inside an async event callback, the error is uncaught.  
  Fix: Check `if (editor) { editor.setValue(content); }` before calling, or queue the import until `EDITOR_READY` fires.

- **`src/main.js:3551, 4281`** — Direct global `editor.getValue()` in export paths without null guard.  
  Scenario: User exports to TXT or triggers `estimateFileSize`. Both call `editor.getValue()` on the bare global `editor`.  
  Breaks: `EditorService.getValue()` uses `this.editor?.getValue() ?? ''` (safe), but the global `editor` in `main.js` is not optional-chained. If export is triggered before editor init, it throws. Even after init, any future refactor that decouples the global will regress silently.  
  Fix: Replace bare `editor.getValue()` with `editorService.getValue()` (which already null-guards), or add `editor?.getValue() ?? ''`.

- **`src/main.js:4365–4386, src/features/import/index.js:86–109`** — No file-size limit on text imports.  
  Scenario: User pastes or imports a 50 MB markdown file. `FileReader.readAsText(file)` slurps the whole blob into a string, then `editor.setValue(content)` hands it to Monaco.  
  Breaks: Main-thread jank during decode + Monaco model allocation. On low-end/mobile devices this causes multi-second freezes or OOM tab crashes. There is no size check, no streaming, and no warning.  
  Fix: Reject files above a configurable threshold (e.g., 5 MB) with a toast, or stream/chunk the paste path.

- **`src/main.js:4286–4303`** — Synchronous regex pipeline on entire document for TXT export.  
  Scenario: Export to TXT runs 10+ `.replace()` passes over the full editor content on the main thread.  
  Breaks: For large docs (10 MB+), each regex is O(n) and the combined work blocks the UI for seconds. On a 50 MB paste the browser may show “page unresponsive.”  
  Fix: Offload to a Web Worker, or cap the export size and warn the user.

- **`src/main.js:3884–3891, 4048–4057`** — PDF/PNG export canvas taint from CORS images (iOS/Safari).  
  Scenario: Preview contains an `<img src="https://external-site.com/photo.jpg">` without CORS headers. Export calls `html2pdf` / `html2canvas` with `useCORS: true`.  
  Breaks: On iOS Safari the canvas becomes tainted; html2canvas either throws `SecurityError` or silently renders a blank/partial image. There is no fallback proxy, no `allowTaint` fallback, and no user-facing error message.  
  Fix: Before export, rewrite remote images to blob URLs (fetch-as-blob), or catch `SecurityError` and show “Remove cross-origin images before exporting.”

---

## Medium Severity

- **`src/core/markdown/index.js:160–213`** — `MarkdownService.initialize()` is single-fire; runtime setting changes are ignored.  
  Scenario: User toggles Mermaid, KaTeX, or live preview in Settings. `initialize()` checks `if (this.initialized) return;` and exits.  
  Breaks: `marked.use(...)` is never called again, so new extensions/config are not picked up. Toggling Mermaid off then on does not re-register the renderer; KaTeX theme changes are ignored.  
  Fix: Separate one-time boot (extension registration) from runtime toggles. Let `setMermaidEnabled` / `setKatexEnabled` re-run `_renderMermaidDiagrams` or reconfigure `marked` without re-registering extensions.

- **`src/features/ai-writer/service.js:181–218`** — `sendMessage()` missing `try/catch` around fetch.  
  Scenario: Non-streaming AI call (used by some UI paths). `_fetchOpenAI` throws on network failure.  
  Breaks: `sendMessage` has `try { ... } finally { this.abortController = null; }` but no `catch`. A network error (offline, DNS, 5xx with no body) propagates as an unhandled rejection to the caller, which may not await it.  
  Fix: Add `catch` that converts the error to a user-friendly `{error}` return or re-throws a wrapped `Error`.

- **`src/core/markdown/index.js:457–460`** — TOC slug generation strips all non-`\w` characters.  
  Scenario: Heading contains emoji, RTL Arabic/Hebrew, zero-width joiners, or diacritics.  
  Breaks: `.replace(/[^\w\s-]/g, '')` removes emoji and non-Latin scripts, collapsing distinct headings into duplicate IDs (e.g., `# 🚀 Launch` and `# Launch` both become `launch`). Duplicate IDs break anchor links, accessibility tree, and skip-navigation.  
  Fix: Use a Unicode-aware slugifier (e.g., preserve letters from all scripts, normalize with `String.normalize('NFKD')`, then strip combining marks).

- **`src/main.js:515–525`** — `querySelector` results used without null check in `renderTabs`.  
  Scenario: `renderTabs` builds tab HTML and immediately does `tab.querySelector('.tab-name')` and `tab.querySelector('.tab-close')`.  
  Breaks: If the template string is corrupted or a future HTML change removes those classes, `querySelector` returns `null` and `addEventListener` throws `TypeError: Cannot read properties of null`. This aborts the entire tab-render cycle.  
  Fix: Guard with `const tabName = tab.querySelector('.tab-name'); if (!tabName) return;` (or fix the template to guarantee the elements).

- **`src/main.js:5726–5731`** — Keyboard shortcut handler assumes `#help-modal` exists.  
  Scenario: User presses `Ctrl/Cmd + H`. The handler does `const modal = document.querySelector("#help-modal"); modal.style.display = ...`.  
  Breaks: If the help modal is removed from the page (e.g., minimal embed, feature flag off), `modal` is `null` and `modal.style` throws. Because this is inside a global `keydown` listener, it breaks all subsequent shortcuts in the same event dispatch.  
  Fix: `const modal = document.querySelector("#help-modal"); if (!modal) return;`.

- **`src/main.js:6151–6158`** — `showAutosaveIndicator` dereferences `#autosave-indicator` without null check.  
  Scenario: Autosave fires (on input, tab switch, or blur).  
  Breaks: If the autosave indicator element is missing from the DOM, `indicator.textContent = ...` throws. Because this is called from multiple paths, it can crash saves.  
  Fix: `const indicator = document.querySelector('#autosave-indicator'); if (!indicator) return;`.

- **`src/features/ai-writer/service.js:391, 438`** — `JSON.parse` on SSE stream data is inside `try/catch`, but the Anthropic parser at line 452 re-throws non-JSON errors.  
  Scenario: Anthropic returns a non-JSON keep-alive line or partial chunk.  
  Breaks: `_parseAnthropicStream` catches JSON parse errors but re-throws any other error (`if (e.message && !e.message.includes('JSON')) throw e;`). A transient network decode error can bubble up and abort the whole stream even though the caller `streamMessage` handles it. The logic is brittle.  
  Fix: Do not re-throw inside the stream loop; log and continue, or surface via `onError` callback.

---

## Low Severity

- **`src/features/version-history/index.js:179–183`** — `setInterval` for auto-save is never cleared.  
  Scenario: App initializes version history; a 60-second interval starts.  
  Breaks: The interval reference is not stored, so `dispose()` / page teardown cannot clear it. In a SPA navigation or HMR scenario the interval keeps running forever, causing unnecessary `localStorage` reads.  
  Fix: Store the interval ID and clear it in a `dispose()` method.

- **`src/main.js:6710`** — Mobile module import failure silently ignored.  
  Scenario: `import('./features/mobile/index.js')` fails (e.g., network, build error).  
  Breaks: `.catch(err => console.warn(...))` swallows the error. Mobile drawer, swipe gestures, and FAB are silently missing with no user-visible fallback.  
  Fix: Show a toast or fallback UI so the user (or developer) knows mobile features are unavailable.

- **`src/core/markdown/index.js:331–355`** — Mermaid `render` called with `id = mermaid-${Date.now()}-${i}`.  
  Scenario: Rapid typing causes multiple preview renders within the same millisecond.  
  Breaks: Two renders may produce duplicate IDs if `Date.now()` collisions occur on very fast machines, or if the loop index resets. Mermaid throws on duplicate IDs.  
  Fix: Use a monotonically increasing counter (`let _mermaidId = 0; const id = `mermaid-${++_mermaidId}`;`) instead of timestamp + index.

- **Debounce / rapid typing — NOT a bug.**  
  `src/app.js:426–428` uses `debounce(content => this._updatePreview(content), APP_CONFIG.DEBOUNCE_DELAY)`. The custom `debounce` in `src/utils/debounce.js` is correctly implemented (trailing edge, single timeout). Rapid typing does **not** re-render every character; preview updates are deferred until the user pauses. The autosave manager (`src/services/autosave/index.js`) also debounces writes. This path is healthy.

---

## Summary by Category

| # | Category | High | Medium | Low |
|---|----------|------|--------|-----|
| 1 | Async without try/catch | 1 | 1 | 0 |
| 2 | Null/undefined checks | 3 | 3 | 1 |
| 3 | Promise.all / race | 2 | 0 | 0 |
| 4 | Event handlers throw | 0 | 1 | 0 |
| 5 | JSON.parse user data | 0 | 1 | 0 |
| 6 | Large-file handling | 2 | 0 | 0 |
| 7 | Unicode (RTL, emoji, ZWJ) | 0 | 1 | 0 |
| 8 | iOS/Safari (IDB, CORS) | 1 | 0 | 0 |
| 9 | Singleton pattern | 0 | 1 | 0 |
| 10 | Rapid typing / debounce | 0 | 0 | 1 |

**Top fixes to prioritize:** add rejection handling to `Promise.all` calls (main.js:711, fileTreeStorage.js:126), null-guard the global `editor` in export/import paths, enforce file-size limits on import, and add CORS-image fallback for export canvases.
