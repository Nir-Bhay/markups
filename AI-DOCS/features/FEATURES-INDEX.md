# 📑 Features Index - Markups

> Complete listing of all 18+ features with file locations and quick access

## 🎯 Feature Categories

### 📝 **Document Management**
- [Tabs (Multi-document)](#tabs)
- [Templates](#templates)
- [Import/Export](#import-export)
- [Autosave](#autosave)

### 🎨 **Editor Features**
- [Toolbar (Rich Text)](#toolbar)
- [AI Writer](#ai-writer)
- [Snippets](#snippets)
- [Image Upload](#image-upload)

### 📊 **Productivity**
- [Statistics](#statistics)
- [Goals (Writing)](#goals)
- [Table of Contents](#toc)
- [Search & Replace](#search)
- [Linter](#linter)

### 👁️ **View Modes**
- [Focus Mode](#focus)
- [Fullscreen](#fullscreen)
- [Typewriter Mode](#typewriter)
- [Divider (Resizable)](#divider)

### 📱 **Responsive**
- [Mobile View](#mobile)

---

## 📑 Tabs

**Multi-document tab management**

| Property | Value |
|----------|-------|
| **File** | `src/features/tabs/index.js` |
| **Lines** | 1-500 |
| **DOM ID** | `#tabs-list`, `.header-tab` |
| **Storage** | IndexedDB `notes` table |
| **Dependencies** | `noteStorage`, `eventBus` |

**Key Functions**:
- `initTabs()` - Lines 1-50
- `createNewTab()` - Lines 100-150
- `switchTab()` - Lines 200-250
- `closeTab()` - Lines 300-350
- `updateTabTitle()` - Lines 400-430

**HTML Location**: `index.html` lines 142-157

**Modification Guide**: `AI-DOCS/modification-guides/tabs.md`

---

## 🎨 Toolbar

**Rich text formatting controls**

| Property | Value |
|----------|-------|
| **File** | `src/features/toolbar/index.js` |
| **Lines** | 50-300 |
| **DOM ID** | `#toolbar`, `.toolbar-btn` |
| **HTML** | `index.html` lines 350-550 |
| **CSS** | `premium-ui.css` lines 442-554 |

**Buttons Provided**:
- Text formatting: Bold, Italic, Strikethrough
- Headings: H1-H6
- Links & Media: URL, Image, Table
- Code: Block, Inline
- Lists: Bullet, Numbered, Tasks
- Blocks: Quote, HR
- Tools: Emoji, AI, TOC

**Key Functions**:
- `initToolbar()` - Lines 50-100
- `formatText()` - Lines 150-200
- `insertElement()` - Lines 250-280

**Add New Button**: See `AI-DOCS/modification-guides/add-toolbar-button.md`

---

## 🤖 AI Writer

**AI-powered writing assistant**

| Property | Value |
|----------|-------|
| **Main** | `src/features/ai-writer/index.js` (300 lines) |
| **UI** | `src/features/ai-writer/ui.js` (400 lines) |
| **Service** | `src/features/ai-writer/service.js` (200 lines) |
| **Prompts** | `src/features/ai-writer/system-prompt.js` (100 lines) |
| **Modal** | `#ai-modal` (HTML lines 1710-1820) |

**Key Functions**:
- `initAIWriter()` - `index.js` lines 1-50
- `openAIModal()` - `ui.js` lines 50-100
- `generateText()` - `service.js` lines 50-150
- `insertAIContent()` - `index.js` lines 200-250

**API Integration**: Configurable in `service.js`

---

## 📊 Statistics

**Word/character count and reading time**

| Property | Value |
|----------|-------|
| **File** | `src/features/stats/index.js` |
| **Lines** | 1-300 |
| **DOM ID** | `#stats-panel` |
| **HTML** | `index.html` lines 860-900 |
| **Update Trigger** | Editor change (debounced 300ms) |

**Metrics Tracked**:
- Word count
- Character count (with/without spaces)
- Reading time (200 WPM)
- Paragraph count
- Sentence count

**Key Functions**:
- `updateStats()` - Lines 50-150
- `calculateReadingTime()` - Lines 200-230
- `displayStats()` - Lines 250-290

---

## 🎯 Goals

**Writing goals tracker**

| Property | Value |
|----------|-------|
| **File** | `src/features/goals/index.js` |
| **Lines** | 1-250 |
| **DOM ID** | `#goals-panel` |
| **HTML** | `index.html` lines 910-950 |
| **Storage** | IndexedDB `settings` table |

**Key Functions**:
- `setGoal()` - Lines 50-100
- `trackProgress()` - Lines 150-200
- `displayGoal()` - Lines 220-250

**Features**:
- Daily/session word count goals
- Progress bar visualization
- Goal persistence

---

## 📋 Table of Contents

**Auto-generated navigation from headings**

| Property | Value |
|----------|-------|
| **File** | `src/features/toc/index.js` |
| **Lines** | 1-300 |
| **DOM ID** | `#toc-container` |
| **HTML** | `index.html` lines 820-850 |
| **Update Trigger** | Preview render |

**Key Functions**:
- `generateTOC()` - Lines 50-150
- `scrollToHeading()` - Lines 200-230
- `updateTOC()` - Lines 250-280

**Features**:
- H1-H6 hierarchy
- Click to scroll
- Active heading highlight

---

## 📑 Templates

**Pre-built document templates**

| Property | Value |
|----------|-------|
| **File** | `src/features/templates/index.js` |
| **Lines** | 1-200 |
| **Config** | `src/config/templates.js` (500 lines) |
| **DOM ID** | `#templates-panel` |
| **HTML** | `index.html` lines 1070-1100 |

**Templates Available**:
- Blank document
- README
- Blog post
- Research paper
- Documentation
- Meeting notes

**Key Functions**:
- `loadTemplate()` - Lines 50-100
- `applyTemplate()` - Lines 150-180

**Add Template**: Edit `src/config/templates.js`

---

## ✂️ Snippets

**Quick text insertions**

| Property | Value |
|----------|-------|
| **File** | `src/features/snippets/index.js` |
| **Lines** | 1-150 |
| **Config** | `src/config/snippets.js` (300 lines) |
| **DOM ID** | `#snippets-panel` |
| **HTML** | `index.html` lines 1110-1140 |

**Snippets Available**:
- Tables
- Code blocks
- Math equations
- Mermaid diagrams
- Checklists

**Key Functions**:
- `insertSnippet()` - Lines 50-100
- `loadSnippets()` - Lines 120-140

---

## 🔍 Search

**Find and replace functionality**

| Property | Value |
|----------|-------|
| **File** | `src/features/search/index.js` |
| **Lines** | 1-350 |
| **Shortcut** | Ctrl+F, Ctrl+Shift+H |
| **Monaco API** | Uses editor.find/replace |

**Features**:
- Case-sensitive search
- Whole word matching
- Regex support
- Replace all
- Navigation (next/prev)

**Key Functions**:
- `openSearch()` - Lines 50-100
- `findNext()` - Lines 150-180
- `replaceAll()` - Lines 250-280

---

## 🔍 Linter

**Markdown best practices checker**

| Property | Value |
|----------|-------|
| **File** | `src/features/linter/index.js` |
| **Lines** | 1-400 |
| **Library** | `markdownlint` |
| **DOM ID** | `#linter-panel` |
| **HTML** | `index.html` lines 1150-1190 |

**Checks**:
- Heading hierarchy
- List formatting
- Line length
- Trailing whitespace
- Link formatting

**Key Functions**:
- `lintDocument()` - Lines 50-150
- `displayErrors()` - Lines 200-250
- `autoFix()` - Lines 300-350

---

## 📤 Import/Export

**File import and multi-format export**

| Property | Value |
|----------|-------|
| **Import** | `src/features/import/index.js` (250 lines) |
| **Export** | `src/services/export/` (multiple files) |
| **Formats** | PDF, HTML, Markdown, DOCX |

**Export Files**:
- `pdf.js` - 300 lines (html2pdf.js)
- `html.js` - 250 lines (standalone HTML)
- `markdown.js` - 100 lines (plain text)
- `docx.js` - 400 lines (Word format)

**Import Supported**:
- `.md` files
- `.txt` files
- Clipboard content

**Key Functions**:
- Import: `importFile()` - Lines 50-150
- Export: See individual export files

**Modal**: `#export-modal` (HTML lines 1260-1450)

---

## 🎯 Focus Mode

**Distraction-free writing**

| Property | Value |
|----------|-------|
| **File** | `src/features/focus/index.js` |
| **Lines** | 1-200 |
| **Shortcut** | Ctrl+Shift+F |
| **CSS Class** | `.focus-mode` |

**Features**:
- Hides header/toolbar/sidebars
- Centers content
- Dim background
- ESC to exit

**Key Functions**:
- `enableFocus()` - Lines 50-100
- `disableFocus()` - Lines 120-160

---

## 📺 Fullscreen

**Fullscreen toggle**

| Property | Value |
|----------|-------|
| **File** | `src/features/fullscreen/index.js` |
| **Lines** | 1-150 |
| **Shortcut** | F11 |
| **API** | `document.fullscreenElement` |

**Key Functions**:
- `toggleFullscreen()` - Lines 50-100
- `exitFullscreen()` - Lines 120-140

---

## ⌨️ Typewriter Mode

**Keep cursor centered**

| Property | Value |
|----------|-------|
| **File** | `src/features/typewriter/index.js` |
| **Lines** | 1-180 |
| **CSS** | Scroll-margin adjustment |

**Features**:
- Centers active line
- Smooth scrolling
- Configurable offset

**Key Functions**:
- `enableTypewriter()` - Lines 50-100
- `centerCursor()` - Lines 120-150

---

## 📏 Divider

**Resizable split pane**

| Property | Value |
|----------|-------|
| **File** | `src/features/divider/index.js` |
| **Lines** | 1-250 |
| **DOM Class** | `.divider` |
| **Storage** | LocalStorage (split ratio) |

**Features**:
- Drag to resize
- Min/max widths
- Persist ratio
- Double-click reset

**Key Functions**:
- `initDivider()` - Lines 50-100
- `handleDrag()` - Lines 150-200

---

## 📱 Mobile

**Mobile responsiveness**

| Property | Value |
|----------|-------|
| **File** | `src/features/mobile/index.js` |
| **Lines** | 1-300 |
| **Breakpoint** | 768px |
| **View Modes** | Write, Preview |

**Features**:
- Responsive toolbar
- Mobile menu
- Touch gestures
- View switcher

**Key Functions**:
- `initMobile()` - Lines 50-100
- `switchView()` - Lines 150-180
- `handleTouch()` - Lines 200-250

---

## 💾 Autosave

**Automatic document saving**

| Property | Value |
|----------|-------|
| **File** | `src/services/autosave/index.js` |
| **Lines** | 1-200 |
| **Interval** | 30 seconds (configurable) |
| **Indicator** | `#autosave-indicator` |

**Key Functions**:
- `enableAutosave()` - Lines 50-100
- `saveDocument()` - Lines 120-160

---

## 🔗 Related Documentation

- **AI Memory**: `AI-DOCS/AI-MEMORY.md`
- **Quick Start**: `AI-DOCS/QUICK-START.md`
- **Architecture**: `AI-DOCS/architecture/OVERVIEW.md`
- **Guides**: `AI-DOCS/modification-guides/`

---

**Last Updated**: 2026-04-04
