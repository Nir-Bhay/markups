# LEAF-E Gates — CORS/Export/Unicode/Runtime toggles

Branch: `review/integration` (local-only, NOT committed/pushed per user rule)
Author: Leaf-E (subagent) + Hermes (gate reconciliation, because Leaf-E hit iteration budget)

## G1 — CORS image fallback in PDF/PNG export
**Files:** `src/main.js` 3884-3891 & 4048-4057 (export paths)
**What:** Before html2canvas/PDF capture, rewrite remote `<img>` to blob URLs (fetch-as-blob) so CORS does not taint the canvas on iOS Safari. Catch `SecurityError` and show toast "Remove cross-origin images before exporting" if not auto-rewritable.
**CHECK:** `grep -n "fetch.*blob\|cross-origin images" src/main.js`
**EXPECT:** Match in export paths.

## G2 — MarkdownService runtime toggles (Mermaid/KaTeX/live preview)
**File:** `src/core/markdown/index.js` 160-213
**What:** Separated one-time boot from runtime toggles. `setMermaidEnabled` / `setKatexEnabled` no longer skipped by `if (this.initialized) return;` — they re-run render path without re-registering extensions.
**CHECK:** `grep -n "setMermaidEnabled\|setKatexEnabled" src/core/markdown/index.js`
**EXPECT:** Functions exist and re-trigger render.

## G3 — Unicode-aware TOC slug
**File:** `src/core/markdown/index.js` 457-460
**What:** Replaced `replace(/[^\w\s-]/g, '')` with NFKD-normalized slugifier that preserves letters from all scripts (emoji, RTL Arabic, ZWJ-safe).
**CHECK:** `grep -n "normalize.*NFKD\|slug" src/core/markdown/index.js`
**EXPECT:** NFKD normalization present in slug function.

## G4 — eslint clean
**Command:** `npx eslint src/main.js src/core/markdown/index.js`
**EXPECT:** exit 0, 0 errors.
**Result:** Re-run before final commit.

## Notes
- Live preview path = `main.js` `convert()` (NOT `MarkdownService.render()`); Leaf-E noted this — runtime toggles need to thread through `convert()`, not just `MarkdownService`.
- Leaf-E exhausted iteration budget before writing this file; Hermes recovered the contract from the subagent summary and recorded the gates here for future re-verification.
- **To re-verify all 4 gates after any change, run:**
  ```
  cd D:\harmes\projects\markups
  grep -n "fetch.*blob\|cross-origin images" src/main.js
  grep -n "setMermaidEnabled\|setKatexEnabled" src/core/markdown/index.js
  grep -n "normalize.*NFKD\|slug" src/core/markdown/index.js
  npx eslint src/main.js src/core/markdown/index.js
  ```
