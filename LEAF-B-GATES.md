# LEAF-B Gates — Null-safety guards in main.js

Branch: `review/integration` (local-only, NOT committed/pushed per user rule)
Author: Leaf-B (subagent) + Hermes (gate reconciliation)

## G1 — No bare `editor.<method>()` calls in main.js (export/import paths)
**File:** `src/main.js` (export sites, import sites, setupCopyButton)
**What:** Replaced bare `editor.getValue()` with `editor?.getValue() ?? ''` at:
- exportToMarkdown: ~2908, 3071
- exportToTXT: ~4187, 4312
- downloadMarkdown
- setupCopyButton: local param already guarded (line 5238-5247)
**CHECK:** `grep -n "editor.getValue()\|editor.setValue(" src/main.js`
**EXPECT:** Zero matches. All guarded.

## G2 — handleFileImport queues to pendingEditorActions if editor not ready
**File:** `src/main.js` ~132 (declaration), ~4439 (push), ~7022 (flush after setupEditor)
**What:** `editor.setValue(content)` now guarded. If `!editor`, push to `pendingEditorActions` array. Flushed after `editor = setupEditor()`.
**CHECK:** `grep -n "pendingEditorActions" src/main.js`
**EXPECT:** 3 matches: declaration, push site, flush site.

## G3 — renderTabs null-guards
**File:** `src/main.js` 515-525 area
**What:** `tab.querySelector('.tab-name')` and `.tab-close` wrapped in `if (tabName) {}` / `if (tabClose) {}` before `addEventListener`.
**CHECK:** `grep -n "tab.querySelector" src/main.js | head -5`
**EXPECT:** Null guards present before addEventListener.

## G4 — Ctrl/Cmd+H #help-modal null guard
**File:** `src/main.js` 5726-5731 area
**What:** `const modal = document.querySelector('#help-modal'); if (!modal) return;` added before `modal.style`.
**CHECK:** `grep -n "help-modal" src/main.js`
**EXPECT:** Match in keyboard handler with guard.

## G5 — showAutosaveIndicator #autosave-indicator null guard
**File:** `src/main.js` 6151-6158 area
**What:** `const indicator = ...; if (!indicator) return;` before `indicator.textContent = ...`.
**CHECK:** `grep -n "autosave-indicator" src/main.js`
**EXPECT:** Match in showAutosaveIndicator with guard.

## G6 — All other bare `editor.<method>(` calls guarded
**File:** `src/main.js` (global scan)
**What:** Leaf-B confirmed: bare `editor.<method>(` count 27→0. `editor?.` count 9→103.
**CHECK:** `grep -nE "(^|[^.])editor\.(get|set|focus|getModel|getDomNode|reveal)" src/main.js`
**EXPECT:** Zero unprotected matches (all either inside `if (editor)` / ternary / `setupCopyButton` local param).

## G7 — eslint clean
**Command:** `npx eslint src/main.js`
**Result:** exit 0, 0 errors, 26 warnings (all pre-existing, unrelated to Leaf-B).

## How to re-verify
```
cd D:\harmes\projects\markups
grep -n "editor.getValue()\|editor.setValue(" src/main.js
grep -n "pendingEditorActions" src/main.js
grep -n "tab.querySelector" src/main.js
grep -n "help-modal" src/main.js
grep -n "autosave-indicator" src/main.js
npx eslint src/main.js
```
