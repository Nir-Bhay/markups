# MARKUPS — Architecture & Data Strategy Document

Document Version: 1.0

Date: 2026-02-14

Purpose: Define the target architecture, data strategy, and technical decisions for Markups

Prerequisite: Read 01-PROJECT-ANALYSIS-REPORT.md first

---

## 1. Architectural Vision

### 1.1 Architecture Type: Offline-First, Client-Heavy PWA

Markups is a **Progressive Web Application (PWA)** that runs entirely in the browser. There is no backend server for data storage. The app must work fully offline after the first visit.

### 1.2 Core Architectural Principles

| Principle | Description |
|---|---|
| **Privacy by Architecture** | Data never leaves the user's device. No telemetry on content. |
| **Offline-First** | Every feature must work without network. Network is a progressive enhancement. |
| **Client-Heavy** | All logic runs in the browser. Server only serves static assets. |
| **Progressive Enhancement** | Basic editing works immediately. Advanced features load as needed. |
| **Data Sovereignty** | User owns their data completely. Export everything, anytime, in open formats. |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                   BROWSER                        │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │         UI LAYER (React Components)          │ │
│  │  ┌──────┐  ┌────────┐  ┌─────────┐         │ │
│  │  │Editor│  │Preview │  │Sidebar  │  ...     │ │
│  │  └──┬───┘  └───┬────┘  └────┬────┘         │ │
│  └─────┼──────────┼────────────┼───────────────┘ │
│        │          │            │                  │
│  ┌─────┼──────────┼────────────┼───────────────┐ │
│  │     STATE LAYER (Zustand Stores)             │ │
│  │  ┌──────────┐ ┌─────────┐ ┌──────────────┐  │ │
│  │  │noteStore │ │uiStore  │ │settingsStore │  │ │
│  │  └─────┬────┘ └─────────┘ └──────┬───────┘  │ │
│  └────────┼──────────────────────────┼──────────┘ │
│           │                          │            │
│  ┌────────┼──────────────────────────┼──────────┐ │
│  │     STORAGE LAYER                             │ │
│  │  ┌─────────────────┐  ┌─────────────────────┐│ │
│  │  │ IndexedDB        │  │ localStorage        ││ │
│  │  │ (Dexie.js)       │  │ (Settings only)     ││ │
│  │  │ • notes          │  │ • theme             ││ │
│  │  │ • noteVersions   │  │ • preferences       ││ │
│  │  │ • attachments    │  │ • migration flag     ││ │
│  │  └─────────────────┘  └─────────────────────┘│ │
│  └───────────────────────────────────────────────┘ │
│                                                    │
│  ┌─────────────────────┐  ┌──────────────────────┐ │
│  │ SERVICE WORKER       │  │ WEB WORKER           │ │
│  │ • Cache app shell    │  │ • Markdown parsing   │ │
│  │ • Offline fallback   │  │ • Search indexing    │ │
│  │ • Background sync    │  │ • Heavy computation  │ │
│  └─────────────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 3. Layer Architecture

### 3.1 UI Layer (React Components)

**Responsibility:** Render UI, handle user interactions, subscribe to state changes.

**Rules:**
- Components NEVER access IndexedDB or localStorage directly
- Components read state from Zustand stores via selectors
- Components dispatch actions to stores for state changes
- Components are organized by feature (not by type)

### 3.2 State Layer (Zustand Stores)

Three modular stores with clear responsibilities:

| Store | Persisted | Storage | Responsibility |
|---|---|---|---|
| **noteStore** | Yes | IndexedDB | Notes CRUD, search, filtering, sorting |
| **uiStore** | No | Memory | Sidebar state, view mode, modals, toasts |
| **settingsStore** | Yes | localStorage | Theme, font, editor preferences |

### 3.3 Storage Layer

**Primary Storage: IndexedDB via Dexie.js**

IndexedDB is the primary data store for all note content and metadata.

**Why Dexie.js:**
- Clean Promise-based API over raw IndexedDB
- Schema versioning and migrations built-in
- Multi-entry indexes (for tags)
- Transaction support
- Excellent TypeScript support
- Small bundle size (~20KB)

**Secondary Storage: localStorage**

Used ONLY for:
- User settings (theme, font size, preferences)
- Migration flag
- Active note ID (quick sync access)

### 3.4 IndexedDB Schema Design

```
Database: markups_db

Table: notes
  Primary Key: id (string)
  Indexes: title, createdAt, updatedAt, *tags (multi-entry), category, favorite

Table: noteVersions
  Primary Key: ++id (auto-increment)
  Indexes: noteId, timestamp
```

**Note Schema:**

| Field | Type | Description |
|---|---|---|
| id | string | UUID, primary key |
| title | string | Note title, indexed |
| content | string | Markdown content |
| createdAt | number | Unix timestamp, indexed |
| updatedAt | number | Unix timestamp, indexed |
| tags | string[] | Multi-entry index for tag queries |
| category | string | Folder/category, indexed |
| favorite | boolean | Quick access flag, indexed |
| wordCount | number | Cached word count |
| charCount | number | Cached character count |

---

## 4. Hybrid Data Strategy

### 4.1 Why Hybrid?

| Concern | localStorage | IndexedDB |
|---|---|---|
| Capacity | ~5MB | ~50% of disk (GBs) |
| API | Synchronous | Asynchronous |
| Data types | Strings only | Structured (objects, blobs) |
| Indexing | None | Full index support |
| Transactions | None | ACID transactions |
| Thread blocking | Yes (main thread) | No (async) |

**Decision:** Use IndexedDB for notes (large, structured, needs indexing). Use localStorage for settings (small, synchronous access appropriate).

### 4.2 Storage Abstraction Layer

All storage access goes through an abstraction layer (`src/storage/noteStorage.ts`). Components and stores NEVER import Dexie directly.

**Interface:**
- `getAllNotes(sort, direction)` → Note[]
- `getNote(id)` → Note
- `createNote(data)` → Note
- `updateNote(id, changes)` → Note
- `deleteNote(id)` → void
- `searchNotes(query)` → Note[]
- `getNotesByTag(tag)` → Note[]
- `getNotesByCategory(category)` → Note[]
- `toggleFavorite(id)` → void
- `getAllTags()` → string[]
- `getAllCategories()` → string[]
- `saveVersion(noteId, content, title)` → void
- `getNoteVersions(noteId)` → NoteVersion[]
- `getStorageInfo()` → { noteCount, estimatedSize }
- `exportAllNotes()` → { notes, exportedAt, version }
- `importNotes(notes, mode)` → number

### 4.3 Migration Strategy (localStorage → IndexedDB)

**Phase:** Run once on first load after upgrade.

**Steps:**
1. Check if migration flag exists → already migrated, skip
2. Check if localStorage contains note data → nothing to migrate, set flag, skip
3. Read all notes from localStorage
4. Convert to new Note format (add missing fields)
5. Write to IndexedDB in a single transaction
6. Verify data integrity (count match)
7. Set migration flag in localStorage
8. Keep localStorage data as backup (30 days)

**Safety:**
- If migration fails, fall back to localStorage gracefully
- Old data is never deleted automatically
- User can manually clear old data from settings
- Migration status visible in settings for debugging

---

## 5. PWA Strategy

### 5.1 Service Worker

**Caching Strategy:**

| Resource | Strategy | Reason |
|---|---|---|
| App shell (HTML) | Cache-first | Fast loads, offline support |
| JS/CSS bundles | Cache-first with versioning | Immutable after build |
| Fonts | Cache-first | Rarely change |
| Images | Cache-first | Static assets |
| API calls | N/A | No API calls (all local) |

**Implementation:** Use `next-pwa` or Workbox directly for Service Worker management.

### 5.2 Web App Manifest

```json
{
  "name": "Markups — Markdown Editor",
  "short_name": "Markups",
  "description": "Free, private, offline-first Markdown editor",
  "display": "standalone",
  "start_url": "/editor",
  "scope": "/",
  "theme_color": "#0a0a0a",
  "background_color": "#0a0a0a",
  "categories": ["productivity", "utilities"],
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 5.3 Storage Persistence

Request persistent storage via `navigator.storage.persist()` after the user creates their first note. This prevents the browser from evicting IndexedDB data under storage pressure.

---

## 6. Multi-Tab Safety

### 6.1 Problem

If a user opens Markups in multiple tabs, both tabs write to the same IndexedDB. Without synchronization, one tab can overwrite changes from another.

### 6.2 Solution: BroadcastChannel API

```
Tab 1:  User edits note → Save to IndexedDB → Broadcast "note-updated" event
                                                          ↓
Tab 2:  Receives "note-updated" → Reload note from IndexedDB → Update UI
```

**BroadcastChannel API:**
- Native browser API, no library needed
- Creates a named channel that all tabs can subscribe to
- Messages are broadcast to all tabs (except the sender)
- Perfect for "note updated", "note deleted", "settings changed" events

---

## 7. Cross-Device Sync (Future)

### 7.1 Philosophy

Markups does NOT sync data through its own servers. Cross-device sync is **user-managed** — the user chooses how to move data between devices.

### 7.2 Sync Options (Progressive)

| Level | Method | Privacy | Complexity | Phase |
|---|---|---|---|---|
| 1 | File export/import (.json, .zip) | Maximum | None | Phase 1 |
| 2 | User's cloud storage (Google Drive, Dropbox, OneDrive) | High | Medium | Phase 3-4 |
| 3 | WebRTC P2P sync (device-to-device) | Maximum | High | Phase 4+ |
| 4 | RemoteStorage protocol (user-owned storage server) | Maximum | Medium | Phase 4+ |

### 7.3 User-Managed Cloud Storage (Level 2)

- User authorizes Markups to write to a specific folder in their cloud storage
- Markups exports a JSON backup to that folder periodically
- On another device, user imports from that folder
- No Markups server ever sees the data
- OAuth tokens stored locally, never sent to Markups

### 7.4 WebRTC P2P Sync (Level 3)

- Device A creates a "room" → gets a room code
- Device B enters room code → establishes P2P connection via WebRTC
- Devices sync notes directly between each other
- Only a signaling server is needed (can use free services like PeerJS)
- No note data passes through any server

---

## 8. State Management Architecture

### 8.1 Modular Stores

**noteStore** (persisted to IndexedDB):
- State: notes[], activeNoteId, searchQuery, sortBy, sortDirection, filterTag, filterCategory, showFavoritesOnly, allTags[], allCategories[], saveStatus, isLoading
- Actions: initialize, loadNotes, createNote, updateNote, deleteNote, setActiveNote, setSearchQuery, setSortBy, toggleFavorite, searchNotes, saveVersion

**uiStore** (not persisted):
- State: sidebarOpen, viewMode, isMobile, activeModal, toasts[], shortcutsHelpOpen
- Actions: toggleSidebar, setViewMode, setIsMobile, openModal, closeModal, showToast, dismissToast

**settingsStore** (persisted to localStorage):
- State: theme, fontSize, fontFamily, editorFontFamily, autoSave, autoSaveInterval, tabSize, lineNumbers, wordWrap, previewMode, showToolbar, spellCheck
- Actions: updateSetting, updateSettings, resetSettings

---

## 9. Component Organization (Target)

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── editor/
│       └── page.tsx
├── components/
│   ├── editor/
│   │   ├── Editor.tsx
│   │   ├── MarkdownToolbar.tsx
│   │   ├── StatusBar.tsx
│   │   └── CodeBlock.tsx
│   ├── preview/
│   │   ├── Preview.tsx
│   │   └── SplitPane.tsx
│   ├── notes/
│   │   ├── NotesList.tsx
│   │   ├── SearchBar.tsx
│   │   ├── TagEditor.tsx
│   │   └── CategoryPanel.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   ├── MobileNav.tsx
│   │   └── MobileDrawer.tsx
│   ├── shared/
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   ├── EmptyState.tsx
│   │   ├── InstallPrompt.tsx
│   │   ├── OfflineIndicator.tsx
│   │   ├── KeyboardShortcutsHelp.tsx
│   │   ├── ExportOptions.tsx
│   │   ├── ImportExport.tsx
│   │   ├── DropZone.tsx
│   │   ├── Settings.tsx
│   │   └── ThemeToggle.tsx
│   └── ui/  (shadcn/ui primitives)
│       ├── button.tsx
│       ├── dialog.tsx
│       └── ...
├── store/
│   ├── noteStore.ts
│   ├── uiStore.ts
│   ├── settingsStore.ts
│   └── types.ts
├── storage/
│   ├── database.ts
│   ├── noteStorage.ts
│   ├── migration.ts
│   └── types.ts
├── hooks/
│   ├── useAutoSave.ts
│   ├── useKeyboardShortcuts.ts
│   ├── useEditorEnhancements.ts
│   ├── useScrollSync.ts
│   └── useMediaQuery.ts
├── lib/
│   ├── utils.ts
│   ├── exporters.ts
│   └── importers.ts
├── types/
│   └── index.ts
└── workers/
    └── markdownWorker.ts
```

---

## 10. Performance Architecture

### 10.1 Rendering Optimization

| Problem | Solution |
|---|---|
| Preview re-renders on every keystroke | Debounce markdown parsing (150-300ms) |
| Large notes cause slow preview | Use Web Worker for markdown parsing |
| Long notes lists re-render entirely | Virtualize with react-virtual or tanstack/virtual |
| Full app re-render on state change | Zustand selectors — subscribe to specific state slices |
| Large initial bundle | Route-based code splitting |
| Fonts block rendering | Use font display: swap |

### 10.2 Loading Strategy

**Initial Load:**
1. Server sends pre-rendered app shell → ~50ms
2. JS hydration begins → ~200ms
3. Service Worker installs, caches app shell → background
4. IndexedDB loads active note metadata → ~50ms
5. Active note content loads → ~20ms
6. Editor is interactive → ~500ms total

**Subsequent Loads (cached):**
1. Service Worker serves app shell from cache → ~10ms
2. JS loads from cache → ~50ms
3. IndexedDB loads active note → ~30ms
4. Editor is interactive → ~100ms total

### 10.3 Memory Management

- Unload note content when switching notes (keep only metadata in memory)
- Limit version history depth (keep last 50 versions per note)
- Clear search index periodically
- Use WeakRef or FinalizationRegistry for large objects if applicable

---

## 11. Error Handling & Resilience

### 11.1 Error Boundary Strategy

```
App Error Boundary (catch-all, show "something went wrong" with reload)
  └── Feature Error Boundaries
        ├── Editor Error Boundary (show "editor error" with recovery)
        ├── Preview Error Boundary (show raw markdown if preview fails)
        ├── NotesList Error Boundary (show "refresh notes")
        └── Settings Error Boundary (show "reset settings option")
```

### 11.2 Data Safety

- Auto-save with debounce (save 2 seconds after last keystroke)
- Save before page unload (beforeunload event)
- Save before visibility change (visibilitychange API)
- Periodic full backup to IndexedDB (every 5 minutes)
- Recovery mode: if IndexedDB fails, fall back to localStorage
- Export reminder: prompt user monthly to export a backup

---

## 12. Security Architecture

### 12.1 Client-Side Security

- **Content Security Policy:** Strict CSP headers via Vercel config
- **Markdown Sanitization:** DOMPurify to prevent XSS
- **No dangerouslySetInnerHTML:** Ever, anywhere
- **Subresource Integrity (SRI):** For any CDN resources
- **HTTPS Only:** Enforced via Vercel

### 12.2 Optional Client-Side Encryption

For users who want extra privacy:
- Offer optional AES-256-GCM encryption for note content
- User provides a passphrase (never transmitted anywhere)
- Use Web Crypto API for encryption/decryption
- Encrypted content stored in IndexedDB
- If passphrase is lost, data is unrecoverable (by design)

---

## 13. Architecture Decision Records

| Decision | Choice | Rationale |
|---|---|---|
| Primary storage | IndexedDB via Dexie.js | Capacity, indexing, async, structured |
| Settings storage | localStorage | Small data, sync access, simple |
| State management | Zustand (modular stores) | Already in use, lightweight, middleware |
| Offline strategy | PWA + Service Worker | Full offline capability |
| Multi-tab sync | BroadcastChannel API | Native, fast, no library needed |
| Cross-device sync | File export → User cloud storage → P2P | Progressive, privacy-preserving |
| Code organization | Feature-based modules | Scalable, maintainable |
| Markdown preview | Web Worker + debounce | Non-blocking, smooth UX |
| Error handling | Error boundaries + fallbacks | Resilient UX |
| Security | CSP + sanitization + optional encryption | Defense in depth |

---

*This document defines WHERE we want to go architecturally. See 03-IMPROVEMENT-AND-OPTIMIZATION-ROADMAP.md for HOW to get there.*
