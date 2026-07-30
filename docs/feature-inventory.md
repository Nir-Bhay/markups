# Feature Inventory — Markups

> Status legend:
> - `✅ Complete` — code exists, wired in app, tests/build pass
> - `⚠️ Partial` — code exists but incomplete/unfinished or not fully integrated
> - `🧪 Experimental` — prototype/POC added, not production-ready end-to-end
> - `🚫 Missing` — requested/planned but no working implementation found
> - `🧹 Removable` — exists but appears dead/unused or superseded

---

## Repository Status

| Branch | Last Commit | Status |
|---|---|---|
| `main` | docs: add API specification draft | Stable |
| `markups-reduction` | feat: enhance accessibility and security in UI components | Active |
| `origin/arena/019f9fac-markups` | Polish preview editing UI and video controls | Merged into `markups-reduction` |

**Merge result:** Arena branch merged successfully into `markups-reduction`. Build passes. Tests pass: `65 / 65`.

---

## Test & Build Health

| Check | Result |
|---|---|
| `npm run build` | ✅ Pass |
| `npm test` | ✅ 65/65 pass |
| Failing tests | None |
| Pre-existing blocker | `localStorage` setup in `src/__tests__/migration.test.js` |
| Fix applied | ✅ Safe localStorage polyfill in `src/__tests__/setup.js` + Vitest environment set to `jsdom` |

---

## Core Systems

| System | Location | Status | Notes |
|---|---|---|---|
| Monaco Editor | `src/core/editor/index.js` | ✅ Complete | Editor init, themes, API |
| Markdown Rendering | `src/core/markdown/index.js` | ✅ Complete | marked + extensions + DOMPurify |
| Storage / IndexedDB | `src/core/storage/*` | ✅ Complete | Dexie schema, noteStorage, fileTreeStorage |
| Migration | `src/core/storage/migration.js` | ✅ Complete | Legacy localStorage → IndexedDB migration |
| Sanitization | `src/utils/sanitize.js` | ✅ Complete | DOMPurify wrapper |
| Video Embeds | `src/utils/video-embed.js` | ✅ Complete | Direct/GitHub/YouTube/Vimeo handling |
| Scroll Sync | `src/utils/scroll-sync.js` | ✅ Complete | Editor-preview sync |
| Event Bus | `src/utils/eventBus.js` | ✅ Complete | Central events |
| Debounce | `src/utils/debounce.js` | ✅ Complete | Performance helper |
| Clipboard | `src/utils/clipboard.js` | ✅ Complete | Copy helpers |
| DOM Helpers | `src/utils/dom.js` | ✅ Complete | Focus trap, selectors |
| File Helpers | `src/utils/file.js` | ✅ Complete | Image signature + SVG data URL |
| Error Handling | `src/utils/errorHandler.js` | ✅ Complete | Global error UI |

---

## Features

| Feature | Entry / Files | Status | Remarks |
|---|---|---|---|
| Tabs | `src/features/tabs/index.js` | ✅ Complete | Multi-doc tabs, switch/close/create |
| Toolbar | `src/features/toolbar/index.js` | ✅ Complete | Rich-text controls, overflow sheet, color controls |
| AI Writer | `src/features/ai-writer/index.js` | ✅ Complete | Modal + service + prompts |
| Statistics | `src/features/stats/index.js` | ✅ Complete | Words, chars, reading time |
| Goals | `src/features/goals/index.js` | ✅ Complete | Daily/session goal + progress |
| Table of Contents | `src/features/toc/index.js` | ✅ Complete | H1-H6 nav, active heading |
| Search | `src/features/search/index.js` | ✅ Complete | Find/replace via Monaco |
| Templates | `src/features/templates/index.js` | ✅ Complete | Built-in templates |
| Snippets | `src/features/snippets/index.js` | ✅ Complete | Quick insert snippets |
| Linter | `src/features/linter/index.js` | ✅ Complete | Markdown lint panel |
| Focus Mode | `src/features/focus/index.js` | ✅ Complete | Focus mode toggle |
| Fullscreen | `src/features/fullscreen/index.js` | ✅ Complete | Fullscreen toggle |
| Typewriter Mode | `src/features/typewriter/index.js` | ✅ Complete | Typewriter scrolling |
| Divider | `src/features/divider/index.js` | ✅ Complete | Resizable split pane |
| Mobile UI | `src/features/mobile/index.js` | ✅ Complete | Mobile responsiveness |
| Import | `src/features/import/index.js` | ✅ Complete | Local import flow |
| Modes | `src/features/modes/index.js` | ✅ Complete | Editor/Preview/Split |
| Explorer | `src/features/explorer/index.js` | ✅ Complete | File explorer + file tree |
| Image Upload | `src/features/image-upload/index.js` | ✅ Complete | Image insertion flow |
| Image Resize | `src/features/image-resize/index.js` | ✅ Complete | Resize + history + UI |
| Version History | `src/features/version-history/index.js` | ✅ Complete | Snapshot history |
| Video Controls | `src/features/video-controls/index.js` | 🧪 Experimental | Video preview layout controls; wired but POC-level |
| Live Preview Edit | `src/features/live-preview-edit/index.js` | 🧪 Experimental | Document/Markdown mode POC; not production-ready |

---

## Services

| Service | Location | Status | Notes |
|---|---|---|---|
| Export PDF | `src/services/export/pdf.js` | ✅ Complete | html2pdf path |
| Export HTML | `src/services/export/html.js` | ✅ Complete | HTML export |
| Export DOCX | `src/services/export/docx.js` | ✅ Complete | DOCX export |
| Export Markdown | `src/services/export/markdown.js` | ✅ Complete | MD export |
| Shortcuts | `src/services/shortcuts/index.js` | ✅ Complete | Keyboard shortcuts |
| PWA | `src/services/pwa/index.js` | ✅ Complete | Service worker + manifest |
| Autosave | `src/services/autosave/index.js` | ✅ Complete | Auto-save flow |

---

## UI Components

| Component | Location | Status | Notes |
|---|---|---|---|
| Toast | `src/ui/toast/index.js` | ✅ Complete | Notifications |
| Modal | `src/ui/modal/index.js` | ✅ Complete | Modal dialogs |
| Theme | `src/ui/theme/index.js` | ✅ Complete | Theme management |
| Loading | `src/ui/loading/index.js` | ✅ Complete | Loading states |
| Autosave Indicator | `src/ui/autosave/index.js` | ✅ Complete | Status indicator |

---

## Issue Tracker Summary

| Issue | Title | Status | Likely Owner Area |
|---|---|---|---|
| #43 | Video preview controls + runtime quality gates | Open / PR present | Video/live-preview |
| #42 | Minor issue — Update XML preview | Open | Preview/sanitize/Prism |
| #41 | Persistent shareable document URLs | Open | Storage/routing/backend |
| #40 | Video preview instead of link click | Open | Video embed |
| #39 | Improve sync scrolling for long pages | Open | Scroll sync |
| #29 | External account connections | Open | OAuth/cloud import-export |
| #28 | Translator / multi-language | Open | i18n/ui |
| #16 | Data persistence & version history | Open | Storage/history |
| #14 | Cloud sync & account linking | Open | Cloud sync/OAuth |

---

## Removable / Cleanup Candidates

| Item | Why it may be removable |
|---|---|
| `src/features/image-resize/index.js.pre-phase2-backup` | Backup file from prior phase split |
| `src/features/toolbar/index.js.pre-phase2-backup` | Backup file from prior phase split |
| `src/main.js.backup` | Backup file |
| Old `origin/*` remote branches | Already deleted; keep `main`, `markups-reduction`, `arena` |

---

## Recommended Next Actions

1. **Stabilize live preview/video POC** before wider release.
2. **Fix sync scrolling** (#39) — likely in `src/utils/scroll-sync.js`.
3. **Update XML preview rendering** (#42) — likely in markdown/preview pipeline.
4. **Decide backend strategy for sharing** (#41) before building cloud sync (#14/#29).
5. **Keep version history feature** — already implemented in `src/features/version-history/index.js`.
