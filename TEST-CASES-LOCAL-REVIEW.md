# Markups Dev Branch — Local Review Test Cases
*Branch: polish/v1.1.4-foundations | Preview: http://localhost:4173*

---

## How to Test

1. Open **Brave** → `http://localhost:4173`
2. Open DevTools Console (F12) to watch for errors
3. Test each section below
4. If any feature is broken, note the exact steps + console errors

---

## Sprint 1 — Critical Fixes

### 1. AI Writer Button
- **Location**: Toolbar → star icon "AI Writing Assistant"
- **Expected**: Click opens AI Writer panel below toolbar
- **Expected**: Panel has input field + generate button
- **Expected**: Toast shows "AI Writer Opened" / "AI Writer Closed"
- **Expected**: No console errors
- **Edge case**: Click button 2x rapidly — should toggle without duplicate panels

### 2. Typewriter Mode
- **Location**: Toolbar → "Typewriter" button
- **Expected**: Click enables typewriter mode
- **Expected**: Current line centers immediately
- **Expected**: As you type/move cursor, line stays centered (re-centers on every cursor move)
- **Expected**: Click again disables
- **Edge case**: Disable → enable again — no memory leak, no duplicate listeners

### 3. Flaky Stats Test
- **No UI test needed** — this is internal
- Run `npm test` — stats test should pass consistently (no timeout)
- **If timeout**: note exact error message

---

## Sprint 2 — UX Improvements

### 4. Auto-focus Editor
- **Expected**: Page loads → cursor is in editor, ready to type
- **Expected**: No focus steal from URL bar or other elements
- **Edge case**: On mobile/touch device — should NOT auto-focus (no keyboard popup)

### 5. Restore Last Tab
- **Steps**:
  1. Open 2-3 tabs
  2. Click tab 2 → wait 1s
  3. Refresh page (F5)
  4. Tab 2 should be active
- **Expected**: After refresh, last active tab is restored
- **Edge case**: Delete the restored tab → refresh → should fall back to first tab

### 6. Print-friendly CSS
- **Steps**:
  1. Add some content with headings, code blocks, tables
  2. Press `Ctrl+P` (or browser print)
  3. Print preview should show ONLY the preview pane
  4. Toolbar, tabs, header, footer should be hidden
- **Expected**: Clean print layout, no UI chrome
- **Expected**: Code blocks/page breaks handled correctly

---

## Sprint 3 — New Features

### 7. Command Palette (Ctrl+Shift+P)
- **Steps**:
  1. Press `Ctrl+Shift+P`
  2. Modal should open with search input
  3. Type "export" → should filter to export commands
  4. Type "toggle" → should show toggle commands
  5. Use arrow keys → navigate up/down
  6. Press Enter → command executes
  7. Press Escape → modal closes
- **Expected**: At least 15 commands visible
- **Expected**: Fuzzy search works (type partial matches)
- **Edge case**: Empty search → shows all commands

### 8. Backlinks / Wikilinks
- **Steps**:
  1. Create file A with content: `[[File B]]`
  2. Create file B with any content
  3. Look for backlinks panel/button (right sidebar or toolbar)
  4. Open file A → backlinks panel should show "File B" as a backlink
- **Expected**: `[[Title]]` syntax is parsed
- **Expected**: `[[Title|Display]]` syntax works
- **Expected**: Clicking backlink switches to that tab
- **Edge case**: `\[[` escaped → should NOT create backlink

### 9. Slash Commands (/)
- **Steps**:
  1. In editor, type `/` at start of line
  2. Popup menu should appear
  3. Type "head" → filters to heading commands
  4. Arrow keys → navigate
  5. Enter → inserts markdown
  6. Escape → closes menu
- **Expected**: At least 12 commands
- **Expected**: Inserts correct markdown (e.g., `# ` for H1)
- **Edge case**: `/` in middle of paragraph → should still work

### 10. Custom CSS Injection
- **Steps**:
  1. Open Settings
  2. Find "Custom CSS" textarea
  3. Enter: `.markdown-body { background: yellow; }`
  4. Save/apply
  5. Preview should have yellow background
- **Expected**: CSS is injected into preview
- **Expected**: Persists after refresh (localStorage)
- **Edge case**: Empty CSS → no injection, no errors

### 11. Vim Keybindings
- **Steps**:
  1. Open Settings
  2. Find "Editor Keybindings" dropdown
  3. Select "Vim"
  4. Editor should switch to Vim mode
  5. Status bar should show Vim mode indicator
- **Expected**: `h/j/k/l` navigation works
- **Expected**: `i` enters insert mode
- **Expected**: `Esc` returns to normal mode
- **Edge case**: Switch back to "Default" → Vim mode disables

---

## Nav Tabs Dropdown (Your Feature)

### 12. Recent Tabs Dropdown
- **Location**: Header → "Tabs" button (next to Upload)
- **Steps**:
  1. Open 3+ tabs
  2. Click "Tabs" button
  3. Dropdown should show last 3 active files
  4. Click a file → switches to that tab
  5. Click "New file" → creates new tab
  6. Click outside → dropdown closes
- **Expected**: Max 3 recent files shown
- **Expected**: Active tab highlighted
- **Expected**: Sorted by last modified
- **Edge case**: No tabs → shows "No recent files"

---

## General Regression Tests

### 13. Existing Features (Must Still Work)
- [ ] Monaco editor loads and is editable
- [ ] Split view works (Write/Split/Preview buttons)
- [ ] Dark mode toggle works
- [ ] Export → PDF/HTML/JSON works
- [ ] Import file works
- [ ] Search (Ctrl+F) works
- [ ] Find & Replace (Ctrl+Shift+H) works
- [ ] Version History (Ctrl+Shift+V) works
- [ ] Image upload/paste works
- [ ] Mermaid diagrams render
- [ ] KaTeX math renders
- [ ] Settings modal opens/closes
- [ ] Mobile responsive (resize to mobile width)

### 14. Performance
- [ ] Page load < 3s on localhost
- [ ] No console errors during normal use
- [ ] No memory leaks (check DevTools Memory tab after 5 min use)

---

## Known Issues / Limitations

1. **Vim keybindings** require `monaco-vim` npm package — if not installed, Vim mode won't activate
2. **Modular build** (`main.modular.js`) is feature-complete but NOT yet the default entry — still testing default build
3. **Stats test** — should pass, but if it flakes, rerun `npm test` once more

---

## How to Report Bugs

If something is broken:
1. Note the exact steps to reproduce
2. Copy any console errors
3. Note browser + OS
4. Tell me → I'll fix it on dev branch

---

*Test plan generated 2026-09-06. Branch: polish/v1.1.4-foundations. 5 commits, 341 tests, 0 lint errors.*
