# Markups — Deep Bug Audit (2026-08-27)

Status: in-progress. Findings from Hermes first-pass + 3 parallel subagents.

## CONFIRMED FIRST-PASS FINDINGS

### B1 — eventBus: duplicate event constant (LOW, already fixed earlier)
- `src/utils/eventBus.js` had duplicate `DOCUMENT_SAVING`/`DOCUMENT_SAVED` keys (lines 109-110).
- Removed in prior session. Verified gone.
- Remaining: `DOC_SAVED` and `DOCUMENT_SAVED` both = `'doc:saved'` (intentional alias, not a bug).

### B2 — editor service: dispose() nulls static but exported singleton persists (MEDIUM, FIXED)
- `src/core/editor/index.js:420-427` `dispose()` sets `EditorService.instance = null` but the
  module-level `export const editorService = new EditorService()` still points to the
  disposed object. After dispose(), any caller using the imported `editorService` gets a dead object
  (this.editor=null) → getValue() returns '' silently. Not a crash (null-safe) but silent data loss
  if dispose() is ever called while other modules hold the reference.
- FIXED: replaced exported singleton with a Proxy over a module-level holder; dispose() now
  re-creates a fresh instance so subsequent imports get a live editor. Also made dispose() null-safe
  on this.editor. Verified with node --check + lint + full test suite (107 pass).
- Remaining: no HMR dispose hook in main.js — dev-only concern, low priority.

### B3 — sanitize: control-char stripping bypassable via HTML entity (LOW→now HARDENED)
- `src/utils/sanitize.js:49` stripped `\u0000-\u001F` THEN tested for `javascript:`. But
  `java&#x09;script:` (tab entity) or `javascript&colon;alert(1)` were NOT decoded → passed the
  check → DOMPurify (which decodes entities) was the only real defense. Defense-in-depth gap.
- FIXED: decode HTML entities (numeric + named: colon/sol/tab/newline/space) before the scheme test.
  Added unit tests proving `java&#x09;script:`, `javascript&colon:`, `&#106;avascript:` all blocked.
  Verified sanitize.test.js 7/7 pass.

### B8 — main.js: `toggleDarkMode` was undefined until this session (HIGH, FIXED)
- Was called at lines 4806/5004 but never defined/imported. Added alias to applyDarkMode. Verified.

### B9 — manager.js / app.js: missing imports (HIGH, FIXED)
- `transformSelection` not imported in manager.js (runtime ReferenceError). Fixed.
- `editorService` imported twice in app.js. Fixed.

## STATUS
- Confirmed + fixed: B2, B3, B8, B9 (all proven via tests)
- Subagent deep findings pending: deleg_bcd7f34a (leaks / security / edge-cases)
- Next: apply subagent HIGH fixes with tests, then rebuild + final report


### B4 — sanitize: `ALLOW_DATA_ATTR: false` but `data-*` stripped in fallback only (LOW)
- PREVIEW_SANITIZE_CONFIG sets ALLOW_DATA_ATTR:false. DOMPurify honors it. Fallback sanitizer removes
  `data-*` (line 119). Consistent. OK.

### B5 — video-embed: GitHub asset treated as image fallback relies on network error (EDGE)
- `src/utils/video-embed.js:135-154` — if a GitHub asset URL serves a video but errors first (e.g. CORS
  preflight), it falls back to <img>. For a real video that errors transiently, user sees broken image.
  Acceptable per Issue #40 design; not a bug but sub-optimal. Could add a manual `{video}` mode hint.

### B6 — video-embed: no width/height/align support in embed output (per Issue #40 secondary)
- Strip logic removes `{width=.. align=..}` attribute blocks only when `isVideoAttributeText` matches.
  For bare links w/o attributes, no sizing. Acceptable.

### B7 — live-preview-edit: large file HTML→Markdown round-trip cost (PERF)
- `src/features/live-preview-edit/index.js` serializes whole preview to MD on every edit. For 50MB docs
  this blocks the main thread. Needs debounce + chunking. (Subagent edge-cases will confirm.)

### B8 — main.js: `toggleDarkMode` was undefined until this session (HIGH, FIXED)
- Was called at lines 4806/5004 but never defined/imported. Added alias to applyDarkMode. Verified.

### B9 — manager.js / app.js: missing imports (HIGH, FIXED)
- `transformSelection` not imported in manager.js (runtime ReferenceError). Fixed.
- `editorService` imported twice in app.js. Fixed.

## SUBAGENT DEEP FINDINGS (pending: deleg_bcd7f34a)
- Task 0: leaks/listeners
- Task 1: security/XSS
- Task 2: edge-cases/async

## FIX PLAN (after subagents return)
1. B2 — add HMR dispose + guard methods
2. B3 — entity-decode in link check
3. B7 — debounce live-preview-edit serialization
4. Apply subagent HIGH fixes with tests
