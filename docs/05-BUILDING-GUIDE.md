# MARKUPS — Actionable Building Guide

Document Version: 1.0

Date: 2026-02-14

Purpose: Step-by-step implementation guide — use this to build from

Prerequisite: Read all previous documents (01-04) first

---

## 1. How to Use This Document

This is your implementation playbook. Each section is a self-contained work unit that can be picked up and executed. Work units are ordered by dependency — later units may depend on earlier ones.

For each unit, you'll find:

- **Goal:** What we're trying to achieve
- **Dependencies:** What must be done first
- **Approach:** How to implement (conceptual, not code)
- **Acceptance Criteria:** How to know it's done
- **Files Affected:** Which parts of the codebase change
- **Estimated Effort:** Relative sizing

---

## 2. Foundation Work Units

### WU-F1: Set Up Dexie.js and IndexedDB Database

**Goal:** Replace localStorage as the primary data store with IndexedDB via Dexie.js

**Dependencies:** None (first step)

**Approach:**
- Install Dexie.js as a dependency
- Create a database module that defines the schema:
  - Database name: markups_db
  - Version 1 schema with object stores: notes, note_versions, settings
  - Define indexes on: title, createdAt, updatedAt, tags (multiEntry), favorite, category
- Create a storage abstraction layer with clear interface:
  - getAllNotes() → returns all notes, sorted by updatedAt descending
  - getNote(id) → returns single note
  - createNote(note) → creates and returns note
  - updateNote(id, changes) → updates and returns note
  - deleteNote(id) → deletes note
  - searchNotes(query) → full-text search
  - getNotesByTag(tag) → filtered list
  - getNotesByCategory(category) → filtered list
  - getStorageUsage() → returns bytes used
- The abstraction layer means components never import Dexie directly — they import the storage module

**Acceptance Criteria:**
- Dexie.js database initializes on app load
- CRUD operations work through the abstraction layer
- Indexes are queryable (search by tag, sort by date)
- Error handling for storage quota exceeded
- Storage usage can be queried

**Files Affected:**
- New: src/storage/database.ts (Dexie setup)
- New: src/storage/noteStorage.ts (abstraction layer)
- New: src/storage/types.ts (storage interfaces)
- Modified: package.json (add dexie dependency)

**Effort:** Medium

---

### WU-F2: Data Migration (localStorage → IndexedDB)

**Goal:** Safely migrate existing users' data from localStorage to IndexedDB without data loss

**Dependencies:** WU-F1

**Approach:**
- Create a migration module that:
  - Checks if localStorage contains note data (check for known keys)
  - Reads all notes from localStorage
  - Writes them to IndexedDB in a single transaction
  - Verifies data integrity (count match, spot-check first and last notes)
  - Sets a migration flag: localStorage.setItem('markups_migrated', 'v1')
  - Keeps localStorage data as backup for 30 days
  - Logs migration result (success/failure) for debugging
- Migration runs automatically on app initialization, before any UI renders
- If migration fails, fall back to localStorage and show subtle error notification
- A "Clear old data" button in settings removes the localStorage backup after migration

**Acceptance Criteria:**
- Existing users see all their notes after upgrade
- No data loss under any scenario (including mid-migration crash)
- Migration only runs once (flag prevents re-runs)
- New users skip migration entirely (no localStorage data to migrate)
- Migration status visible in settings (for debugging)

**Files Affected:**
- New: src/storage/migration.ts
- Modified: src/app/layout.tsx (trigger migration on init)
- Modified: Settings component (show migration status)

**Effort:** Medium

---

### WU-F3: Zustand Store Refactoring

**Goal:** Split the monolithic store into modular, properly-typed stores with IndexedDB persistence

**Dependencies:** WU-F1

**Approach:**
- Create three separate Zustand stores:

  **noteStore** — manages note data
  - State: notes array, activeNoteId, searchQuery, sortOrder, filterTags
  - Actions: createNote, updateNote, deleteNote, setActiveNote, setSearch, setSort, setFilter
  - Persistence: IndexedDB via custom storage adapter for Zustand persist middleware
  - On init: load note metadata from IndexedDB (not full content — lazy load)

  **uiStore** — manages UI state (not persisted)
  - State: sidebarOpen, viewMode (edit/split/preview), isMobile, activeModal, toasts
  - Actions: toggleSidebar, setViewMode, showToast, dismissToast, openModal, closeModal
  - No persistence (resets each session, sensible defaults)

  **settingsStore** — manages user preferences
  - State: theme, fontSize, fontFamily, autoSave, autoSaveInterval, tabSize, lineNumbers, wordWrap
  - Actions: updateSetting, resetSettings
  - Persistence: localStorage (small data, sync access)

- Create a custom Zustand storage adapter that reads/writes to IndexedDB for the noteStore
- Add TypeScript interfaces for all store states and actions
- Use Zustand's useShallow selector pattern to prevent unnecessary re-renders

**Acceptance Criteria:**
- All components use the new stores
- No direct localStorage calls remain in components
- Each store has complete TypeScript types
- State updates only re-render subscribed components
- DevTools middleware works in development

**Files Affected:**
- Modified: src/store/noteStore.ts (major refactor)
- New: src/store/uiStore.ts
- New: src/store/settingsStore.ts
- New: src/store/types.ts (store interfaces)
- Modified: All components that use the store (update imports/selectors)

**Effort:** Medium-Large

---

### WU-F4: Auto-Save System

**Goal:** Never lose user data — auto-save with visual feedback

**Dependencies:** WU-F1, WU-F3

**Approach:**
- Implement debounced auto-save in the editor:
  - On content change, start a 1.5-second debounce timer
  - When timer fires, save to IndexedDB via noteStore
  - Show "Saving..." indicator in status bar during save
  - Show "Saved" indicator with timestamp after save
  - "Saved" indicator fades after 3 seconds
- Additional save triggers:
  - document.addEventListener('visibilitychange') — save when tab loses focus
  - window.addEventListener('beforeunload') — save when closing tab
  - window.addEventListener('blur') — save when window loses focus
  - Manual save: Ctrl/Cmd + S
- Save indicator states: "Unsaved changes" → "Saving..." → "Saved at [time]"
- Settings: allow user to change auto-save interval (0.5s to 10s) or disable auto-save

**Acceptance Criteria:**
- Content saves automatically after typing pauses
- Save indicator visible and accurate
- No data loss when closing tab, switching tabs, or losing connection
- Manual save via keyboard shortcut works
- Auto-save interval is configurable

**Files Affected:**
- New: src/hooks/useAutoSave.ts
- New: Status bar component (or added to editor)
- Modified: Editor component (integrate auto-save hook)
- Modified: Settings component (auto-save interval setting)

**Effort:** Small-Medium

---

### WU-F5: Error Boundaries & Loading States

**Goal:** Graceful error handling and good loading UX

**Dependencies:** None (can be done in parallel with F1-F4)

**Approach:**
- Create a reusable ErrorBoundary component with:
  - Catch-all error display with "Reload" button
  - Feature-specific fallbacks (editor error shows "editor recovery" option)
  - Error logging (to console in dev, to Sentry in production if configured)
- Wrap major sections:
  - App-level error boundary in layout.tsx
  - Editor error boundary (fallback: show raw text editor without preview)
  - Notes list error boundary (fallback: "Unable to load notes, try refreshing")
  - Preview error boundary (fallback: show raw markdown text)
- Loading states:
  - Skeleton loader for notes list (shimmer effect)
  - Loading spinner for editor initialization
  - Suspense boundaries for route transitions
- Empty states:
  - No notes yet → "Create your first note" with illustration and CTA
  - No search results → "No notes match your search" with clear search button
  - Storage empty → welcome screen with getting started guide

**Acceptance Criteria:**
- App never shows white screen / crashes completely
- Each section fails independently
- Loading states visible during data fetch
- Empty states are helpful and guide user action
- Error boundaries log errors for debugging

**Files Affected:**
- New: src/components/ErrorBoundary.tsx
- New: src/components/LoadingSkeleton.tsx
- New: src/components/EmptyState.tsx
- Modified: src/app/layout.tsx (wrap with error boundary)
- Modified: Editor, NotesList, Preview components (wrap with boundaries)

**Effort:** Small-Medium

---

### WU-F6: Testing Infrastructure

**Goal:** Set up testing framework and write tests for critical paths

**Dependencies:** WU-F1, WU-F3 (test the new storage and stores)

**Approach:**
- Install testing dependencies: Vitest, React Testing Library, happy-dom (or jsdom)
- Configure Vitest with Vite (vitest.config.ts)
- Add test scripts to package.json: test, test:watch, test:coverage
- Write unit tests for:
  - Storage abstraction layer (all CRUD operations)
  - Migration utility (localStorage → IndexedDB)
  - Zustand stores (state changes, actions)
  - Utility functions (cn, date formatting, etc.)
- Write component tests for:
  - Editor: renders, accepts input, triggers save
  - NotesList: renders notes, search filters, sort works
  - ExportOptions: generates correct output formats
  - ImportExport: parses imported files correctly
- Add fake-indexeddb for IndexedDB testing in Node.js environment
- Target: 70% coverage on storage/store logic, 50% on components

**Acceptance Criteria:**
- npm test runs all tests successfully
- All critical path tests pass
- Coverage report generated
- Tests run in CI (GitHub Actions)
- Tests don't depend on browser APIs (use mocks/fakes)

**Files Affected:**
- New: vitest.config.ts
- New: src/__tests__/ directory with test files
- Modified: package.json (add test dependencies and scripts)
- New: .github/workflows/test.yml (CI pipeline)

**Effort:** Medium

---

## 3. Experience Work Units

### WU-E1: Keyboard Shortcuts System

**Goal:** Comprehensive keyboard shortcuts for all common actions

**Dependencies:** WU-F3 (stores for actions)

**Approach:**
- Create a centralized keyboard shortcut manager:
  - Map key combinations to actions
  - Handle platform differences (Ctrl on Windows/Linux, Cmd on Mac)
  - Prevent conflicts with browser defaults
  - Allow customization (future, but design for it)
- Implement shortcuts for:
  - Text formatting: Ctrl+B (bold), Ctrl+I (italic), Ctrl+K (link)
  - Navigation: Ctrl+N (new note), Ctrl+P (toggle preview), Ctrl+\ (toggle sidebar)
  - Actions: Ctrl+S (save), Ctrl+Shift+E (export), Ctrl+F (search)
  - View: F11 or Ctrl+Shift+F (focus mode)
- Create a keyboard shortcuts help overlay (Ctrl+/ to open)
  - Shows all available shortcuts in categorized list
  - Searchable
- Use a custom hook: useKeyboardShortcuts() that registers and cleans up listeners

**Acceptance Criteria:**
- All listed shortcuts work correctly
- Shortcuts show correct modifier key for platform (Ctrl vs Cmd)
- Help overlay lists all shortcuts
- Shortcuts don't conflict with browser defaults
- Shortcuts are disabled when typing in input fields (except formatting shortcuts in editor)

**Files Affected:**
- New: src/hooks/useKeyboardShortcuts.ts
- New: src/components/KeyboardShortcutsHelp.tsx
- Modified: Editor component (formatting shortcuts)
- Modified: Layout or app component (global shortcuts)

**Effort:** Medium

---

### WU-E2: Editor Experience Improvements

**Goal:** Make the editor feel professional and productive

**Dependencies:** WU-E1 (keyboard shortcuts)

**Approach:**
- Tab handling: Tab key inserts configurable spaces (2 or 4), Shift+Tab outdents
- Auto-indent: Enter key maintains current indentation level
- List continuation: Pressing Enter after a list item creates next list marker
- Auto-close pairs: Typing ( inserts () with cursor between
- Status bar: Bottom of editor showing word count, character count, line/column position, save status, read time estimate
- Line numbers: Optional, toggled in settings
- Current line highlight: Subtle background highlight on the line cursor is on

**Acceptance Criteria:**
- Tab inserts spaces, Shift+Tab outdents
- Lists auto-continue and can be exited
- Auto-close pairs work for all bracket/quote types
- Status bar shows accurate word count, line number, save status
- Line numbers can be toggled
- All enhancements can be disabled in settings

**Files Affected:**
- Modified: Editor component (major enhancements)
- New: src/components/StatusBar.tsx
- New: src/hooks/useEditorEnhancements.ts
- Modified: Settings component (new toggles)

**Effort:** Large

---

### WU-E3: Preview Improvements

**Goal:** Beautiful, performant, feature-rich Markdown preview

**Dependencies:** None (can be done in parallel)

**Approach:**
- Debounced rendering: Don't re-render preview on every keystroke — debounce 150-200ms
- Code block improvements: copy button on hover, language label
- Table styling: Proper borders, alternating row colors, horizontal scroll for wide tables
- Task list checkboxes: Render clickable checkboxes for - [ ] and - [x]
- Typography: Reading-comfortable line height (1.6-1.8), max reading width (~680px)
- Scroll synchronization: Editor and preview scroll positions linked proportionally
- Resizable split pane: Drag handle between editor and preview to resize split ratio

**Acceptance Criteria:**
- Preview renders smoothly without lag on 5000+ word documents
- Code blocks have copy buttons and language labels
- Tables are styled and horizontally scrollable
- Task checkboxes are interactive
- Typography is clean and readable
- Scroll sync works
- Split pane is resizable

**Files Affected:**
- Modified: Preview component (rendering improvements)
- New: src/components/CodeBlock.tsx (custom code block renderer)
- New: src/hooks/useScrollSync.ts
- New: src/components/SplitPane.tsx (or use a library)
- Modified: globals.css (preview typography styles)

**Effort:** Medium-Large

---

### WU-E4: Search & Organization System

**Goal:** Users with many notes can find and organize efficiently

**Dependencies:** WU-F1 (IndexedDB for indexed queries), WU-F3 (stores)

**Approach:**
- Full-text search across note titles AND content with fuzzy matching (Fuse.js)
- Tags system: add/remove tags, filter by tags, autocomplete
- Categories/Folders: Simple one-level hierarchy with sidebar grouping
- Favorites: Star/unstar notes, quick access section
- Sort options: date modified, date created, title A-Z/Z-A

**Acceptance Criteria:**
- Full-text search returns results within 200ms for 1000 notes
- Fuzzy search handles typos (1-2 character tolerance)
- Tags can be added, removed, and filtered
- Categories organize notes in sidebar
- Favorites appear at top of list
- Sort options work correctly and persist

**Files Affected:**
- New: src/components/TagEditor.tsx
- New: src/components/CategoryPanel.tsx
- Modified: SearchBar, NotesList, Sidebar, noteStore components
- Modified: Database schema (ensure tag and category indexes)

**Effort:** Large

---

### WU-E5: Mobile Experience

**Goal:** Fully usable and pleasant on mobile devices

**Dependencies:** WU-F3 (UI store for mobile state)

**Approach:**
- Responsive layout: sidebar becomes slide-out drawer on mobile (<768px)
- Editor takes full width on mobile; view modes: edit-only or preview-only
- Bottom tab bar for navigation (Notes | Editor | Preview)
- Compact, horizontally scrollable toolbar above keyboard
- Proper virtual keyboard handling
- Touch interactions: swipe for sidebar/preview, long press for context menu

**Acceptance Criteria:**
- App is fully usable on phones (320px - 428px width) and tablets (768px - 1024px)
- Sidebar works as drawer on mobile
- Toolbar is accessible above keyboard
- Navigation is thumb-friendly (bottom nav)
- No horizontal scrolling on any page

**Files Affected:**
- Modified: Layout components (responsive breakpoints)
- New: src/components/MobileNav.tsx, MobileDrawer.tsx
- Modified: Editor, Toolbar, NotesList (mobile variants)
- Modified: globals.css (mobile-specific styles)

**Effort:** Large

---

## 4. Growth Work Units

### WU-G1: PWA Implementation

**Goal:** Full Progressive Web App — installable, offline, app-like

**Dependencies:** WU-F1 (IndexedDB for data), Service Worker setup

**Approach:**
- Web App Manifest: name, icons (192x192, 512x512, maskable), display: standalone, start_url: /editor
- Service Worker: precache app shell, runtime cache fonts/icons, offline fallback
- Install prompt: Subtle banner after 3rd visit with Install/Dismiss
- Offline indicator: Show bar when offline — "You're offline — your notes are safe"
- Storage persistence: Request navigator.storage.persist() after first note

**Acceptance Criteria:**
- Lighthouse PWA audit passes 100%
- App is installable on Chrome, Edge, Safari, Firefox
- App works completely offline after first visit
- Install prompt appears at appropriate time
- Storage is marked as persistent

**Files Affected:**
- New: public/manifest.webmanifest, public icons
- New: src/components/InstallPrompt.tsx, OfflineIndicator.tsx
- Modified: layout.tsx, config files, package.json

**Effort:** Medium

---

### WU-G2: Import & Export Enhancement

**Goal:** Seamless data portability — bring notes in, take notes out

**Dependencies:** WU-F1 (IndexedDB)

**Approach:**
- Export: .md, .html (styled, self-contained), .pdf, .txt, bulk .zip, .json backup
- Import: .md, .txt, .html (turndown.js), .json backup, folder of .md files
- Drag-and-drop support, import preview, duplicate detection
- Backup reminder: If >30 days since last export, show subtle reminder

**Acceptance Criteria:**
- All export formats produce valid output
- All import formats parse correctly
- Drag-and-drop import works
- Large imports (100+ files) don't freeze the UI

**Files Affected:**
- Modified: ExportOptions, ImportExport components
- New: src/lib/exporters.ts, importers.ts
- New: src/components/DropZone.tsx

**Effort:** Medium-Large

---

### WU-G3: Landing Page & SEO

**Goal:** Convert visitors to users, rank in search engines

**Dependencies:** None

**Approach:**
- Landing page: Hero with CTA, features grid, how-it-works, privacy section, comparison table, FAQ
- SEO: Dynamic metadata, OG/Twitter tags, JSON-LD structured data, sitemap.xml, robots.txt
- Performance: 100% SSG, optimized images, lazy load below-fold, Lighthouse 95+

**Acceptance Criteria:**
- Landing page clearly communicates value proposition
- All meta tags present and correct
- Lighthouse SEO score 95+
- Page loads in < 2 seconds on 3G
- Mobile-responsive layout

**Files Affected:**
- Modified: Landing page components
- New: public/sitemap.xml, public/robots.txt
- Modified: layout.tsx (meta tags), config files

**Effort:** Medium

---

## 5. Dependency Graph

```
WU-F1 (IndexedDB) ──────┬──→ WU-F2 (Migration)
                         ├──→ WU-F3 (Stores) ──→ WU-F4 (Auto-Save)
                         │                    ├──→ WU-E1 (Shortcuts)
                         │                    ├──→ WU-E4 (Search)
                         │                    └──→ WU-E5 (Mobile)
                         └──→ WU-F6 (Testing)
                              WU-G1 (PWA)
                              WU-G2 (Import/Export)

WU-F5 (Error Boundaries) ──→ can be done in parallel with anything
WU-E2 (Editor) ──→ depends on WU-E1
WU-E3 (Preview) ──→ independent
WU-G3 (Landing/SEO) ──→ independent
```

---

## 6. Recommended Implementation Order

| Order | Work Unit | Effort | Dependencies |
|---|---|---|---|
| 1 | WU-F1: IndexedDB Setup | M | None |
| 2 | WU-F5: Error Boundaries | S-M | None (parallel with F1) |
| 3 | WU-F2: Data Migration | M | F1 |
| 4 | WU-F3: Store Refactoring | M-L | F1 |
| 5 | WU-F4: Auto-Save | S-M | F1, F3 |
| 6 | WU-E1: Keyboard Shortcuts | M | F3 |
| 7 | WU-E3: Preview Improvements | M-L | None (parallel) |
| 8 | WU-E2: Editor Experience | L | E1 |
| 9 | WU-E4: Search & Organization | L | F1, F3 |
| 10 | WU-E5: Mobile Experience | L | F3 |
| 11 | WU-G1: PWA | M | F1 |
| 12 | WU-G2: Import/Export | M-L | F1 |
| 13 | WU-G3: Landing Page & SEO | M | None |
| 14 | WU-F6: Testing | M | F1, F3 |

---

*This document is the HOW. See 06-IMPLEMENTATION-WALKTHROUGH.md for a guided walkthrough of the implementation process.*
