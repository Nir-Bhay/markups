# 🤖 AI Memory - Markups Codebase Navigation Guide

> **Purpose**: Help AI models (Claude, Copilot, Gemini, etc.) quickly understand and navigate the Markups codebase without reading all files.

**Last Updated**: 2026-04-04  
**Codebase Version**: 2.0.0  
**Total Files**: ~160 JavaScript/CSS/HTML files  
**Total Lines of Code**: ~10,000+

---

## 🎯 Quick Navigation

| What You Need | Go To |
|---------------|-------|
| **Add new feature** | [Modification Guides](#modification-guides) → `AI-DOCS/modification-guides/` |
| **Modify UI element** | [UI Components Map](#ui-components-map) |
| **Change export functionality** | [Services Map](#services-map) → `src/services/export/` |
| **Add toolbar button** | [Line 350-450 in index.html](#toolbar-buttons) |
| **Modify markdown rendering** | `src/core/markdown/index.js` (lines 1-200) |
| **Add new tab feature** | `src/features/tabs/index.js` (lines 1-400) |
| **Change theme** | `src/ui/theme/index.js` + `public/css/premium-ui.css` |

---

## 📁 Project Structure Overview

```
markups/
├── index.html                 # Main HTML (1980 lines) - UI structure
├── src/
│   ├── main.js               # Entry point (1000+ lines) - initialization
│   ├── app.js                # App initialization wrapper
│   ├── core/                 # CORE SYSTEMS (editor, markdown, storage)
│   │   ├── editor/           # Monaco editor setup
│   │   ├── markdown/         # Markdown parser & renderer
│   │   └── storage/          # IndexedDB/LocalStorage
│   ├── features/             # FEATURES (18 modular features)
│   │   ├── tabs/             # Multi-tab management
│   │   ├── toolbar/          # Toolbar functionality
│   │   ├── ai-writer/        # AI writing assistant
│   │   ├── goals/            # Writing goals tracker
│   │   ├── stats/            # Word/character statistics
│   │   ├── toc/              # Table of contents
│   │   ├── templates/        # Document templates
│   │   ├── snippets/         # Quick text insertions
│   │   ├── linter/           # Markdown linting
│   │   ├── import/           # File import
│   │   ├── focus/            # Focus mode
│   │   ├── fullscreen/       # Fullscreen toggle
│   │   ├── modes/            # Editor modes
│   │   ├── typewriter/       # Typewriter mode
│   │   ├── search/           # Find & replace
│   │   ├── mobile/           # Mobile responsiveness
│   │   ├── divider/          # Resizable divider
│   │   └── image-upload/     # Image handling
│   ├── services/             # SERVICES (export, shortcuts, PWA)
│   │   ├── export/           # PDF/HTML/DOCX/MD export
│   │   ├── shortcuts/        # Keyboard shortcuts
│   │   ├── pwa/              # Progressive Web App
│   │   └── autosave/         # Auto-save functionality
│   ├── ui/                   # UI COMPONENTS
│   │   ├── toast/            # Toast notifications
│   │   ├── modal/            # Modal dialogs
│   │   ├── theme/            # Theme management
│   │   ├── loading/          # Loading indicators
│   │   └── autosave/         # Autosave indicator
│   ├── utils/                # UTILITIES
│   │   ├── scroll-sync.js    # Editor-preview sync
│   │   ├── debounce.js       # Debounce utility
│   │   ├── clipboard.js      # Clipboard operations
│   │   ├── dom.js            # DOM utilities
│   │   ├── file.js           # File operations
│   │   └── errorHandler.js   # Error handling
│   └── config/               # CONFIGURATION
│       ├── app.config.js     # App settings
│       ├── templates.js      # Document templates
│       ├── snippets.js       # Snippet definitions
│       └── default-content.js # Default markdown
└── public/
    ├── css/                  # STYLES
    │   ├── premium-ui.css    # Main UI styles (5000+ lines)
    │   ├── style.css         # Base styles
    │   └── github-markdown-light.css # Markdown preview styles
    ├── sw.js                 # Service worker
    └── manifest.json         # PWA manifest
```

---

## 🎨 UI Components Map

### 📍 **index.html Structure** (1980 lines)

| Section | Lines | DOM ID/Class | Purpose |
|---------|-------|--------------|---------|
| **Header** | 134-320 | `.premium-header` | Top navigation bar |
| - Brand | 136-139 | `.header-brand` | Logo & title |
| - Tabs | 142-157 | `#tabs-list` | Document tabs |
| - Mobile Menu | 160-220 | `#mobile-header-menu` | Mobile navigation |
| - Search Button | 225-232 | `#search-btn` | Search trigger |
| - Import Button | 258-266 | `#import-button` | File import |
| - Help Button | 269-277 | `#help-button` | Help modal |
| - View Toggle | 280-285 | `.view-mode-toggle` | Editor/Split/Preview |
| - Theme Toggle | 288-309 | `#dark-mode-toggle` | Dark/Light mode |
| **Toolbar** | 350-550 | `.enhanced-toolbar` | Rich text controls |
| - Bold/Italic/etc | 380-480 | `.toolbar-btn` | Formatting buttons |
| - Headings | 500-530 | `.dropdown` | H1-H6 dropdown |
| - Insert Menu | 540-600 | `.insert-menu` | Link/Image/Table |
| **Main Container** | 650-750 | `.main-container` | Editor + Preview |
| - Editor | 670-680 | `#editor` | Monaco editor mount |
| - Divider | 690-695 | `.divider` | Resizable split |
| - Preview | 700-720 | `#preview` | Rendered markdown |
| **Sidebar (Left)** | 800-1000 | `.sidebar-left` | TOC, Stats, Goals |
| - TOC | 820-850 | `#toc-container` | Table of contents |
| - Stats | 860-900 | `#stats-panel` | Word count, etc. |
| - Goals | 910-950 | `#goals-panel` | Writing goals |
| **Sidebar (Right)** | 1050-1200 | `.sidebar-right` | Templates, Snippets, Linter |
| - Templates | 1070-1100 | `#templates-panel` | Template selector |
| - Snippets | 1110-1140 | `#snippets-panel` | Quick insertions |
| - Linter | 1150-1190 | `#linter-panel` | Markdown errors |
| **Modals** | 1250-1850 | Various | Dialogs & overlays |
| - Export Modal | 1260-1450 | `#export-modal` | Export options |
| - Help Modal | 1460-1620 | `#help-modal` | Keyboard shortcuts |
| - Import Modal | 1630-1700 | `#import-modal` | File import dialog |
| - AI Writer Modal | 1710-1820 | `#ai-modal` | AI assistant |
| **Footer** | 1900-1950 | `.status-bar` | Status indicators |

### 🔘 **Adding a Toolbar Button**

**Location**: `index.html` lines 350-550

```html
<!-- Line ~420 in index.html -->
<button class="toolbar-btn" id="new-button-id" title="Tooltip">
    <svg><!-- icon --></svg>
    <span>Label</span>
</button>
```

**Handler**: Add in `src/features/toolbar/index.js` (lines 50-300)

---

## ⚙️ Core Systems Map

### 🖊️ **Editor** (`src/core/editor/`)

| File | Lines | Purpose |
|------|-------|---------|
| `index.js` | ~400 | Monaco editor initialization, config, API |
| `themes.js` | ~200 | Editor themes (VS Light/Dark, Dracula, etc.) |
| `workers.js` | ~50 | Web worker setup for Monaco |

**Key Functions**:
- `createEditor()` - Lines 50-150 - Initialize Monaco
- `updateEditorValue()` - Lines 200-220 - Set content
- `getEditorValue()` - Lines 230-240 - Get content
- `changeTheme()` - Lines 300-320 - Switch editor theme

**Modification Points**:
- Add new theme: `themes.js` lines 80-180
- Change font: `index.js` lines 60-70 (Monaco options)
- Add keybinding: `index.js` lines 250-350

---

### 📝 **Markdown** (`src/core/markdown/`)

| File | Lines | Purpose |
|------|-------|---------|
| `index.js` | ~600 | Parser config, rendering pipeline |

**Key Functions**:
- `initMarkdown()` - Lines 1-100 - Setup marked + extensions
- `renderMarkdown()` - Lines 150-250 - Parse & render
- `sanitizeHTML()` - Lines 300-320 - DOMPurify sanitization
- `renderMermaid()` - Lines 400-450 - Mermaid diagrams
- `renderKaTeX()` - Lines 500-550 - Math equations

**Extensions Loaded**:
- Lines 20-40: `marked-highlight` (Prism.js)
- Lines 50-60: `marked-katex-extension`
- Lines 70-80: `marked-gfm-heading-id`
- Lines 90-100: `marked-footnote`
- Lines 110-120: `marked-alert`

**Modification Points**:
- Add markdown extension: Lines 1-100
- Change sanitization: Lines 300-350
- Modify code highlighting: Lines 200-250

---

### 💾 **Storage** (`src/core/storage/`)

| File | Lines | Purpose |
|------|-------|---------|
| `database.js` | ~200 | Dexie IndexedDB setup |
| `noteStorage.js` | ~400 | CRUD operations for notes |
| `migration.js` | ~150 | Data migration logic |
| `keys.js` | ~50 | Storage key constants |

**Key Functions**:
- `saveNote()` - `noteStorage.js` lines 50-100
- `loadNote()` - `noteStorage.js` lines 150-200
- `deleteNote()` - `noteStorage.js` lines 250-280
- `getAllNotes()` - `noteStorage.js` lines 300-350

**Database Schema**:
```javascript
// database.js lines 30-60
notes: 'id, title, content, createdAt, updatedAt, tags'
settings: 'key, value'
history: 'noteId, timestamp, content'
```

---

## 🎯 Features Map

### 📑 **Tabs** (`src/features/tabs/`)

**File**: `index.js` (~500 lines)

| Function | Lines | Purpose |
|----------|-------|---------|
| `initTabs()` | 1-50 | Initialize tab system |
| `createNewTab()` | 100-150 | Create new document tab |
| `switchTab()` | 200-250 | Switch active tab |
| `closeTab()` | 300-350 | Close tab with save prompt |
| `updateTabTitle()` | 400-430 | Update tab name |

**DOM Elements**:
- `#tabs-list` - Tab container
- `.header-tab` - Individual tabs
- `#new-tab-button` - New tab button

**Storage**: Tabs stored in IndexedDB `notes` table

---

### 🎯 **AI Writer** (`src/features/ai-writer/`)

| File | Lines | Purpose |
|------|-------|---------|
| `index.js` | ~300 | Main AI feature logic |
| `ui.js` | ~400 | Modal UI & interactions |
| `service.js` | ~200 | API integration |
| `system-prompt.js` | ~100 | AI prompts |

**Key Functions**:
- `initAIWriter()` - `index.js` lines 1-50
- `generateText()` - `service.js` lines 50-150
- `insertAIContent()` - `index.js` lines 200-250

**Modal**: `#ai-modal` in index.html lines 1710-1820

---

### 📊 **Stats** (`src/features/stats/`)

**File**: `index.js` (~300 lines)

| Function | Lines | Purpose |
|----------|-------|---------|
| `updateStats()` | 50-150 | Calculate word/char count |
| `calculateReadingTime()` | 200-230 | Estimate reading time |
| `displayStats()` | 250-290 | Update UI |

**DOM**: `#stats-panel` (index.html lines 860-900)

**Triggers**: Updates on every editor change (debounced 300ms)

---

### 🎯 **Goals** (`src/features/goals/`)

**File**: `index.js` (~250 lines)

| Function | Lines | Purpose |
|----------|-------|---------|
| `setGoal()` | 50-100 | Set word count goal |
| `trackProgress()` | 150-200 | Calculate % complete |
| `displayGoal()` | 220-250 | Update UI |

**DOM**: `#goals-panel` (index.html lines 910-950)

**Storage**: Goals stored in IndexedDB `settings` table

---

### 📋 **Templates** (`src/features/templates/`)

**File**: `index.js` (~200 lines)

**Templates Config**: `src/config/templates.js` (~500 lines)

| Function | Lines | Purpose |
|----------|-------|---------|
| `loadTemplate()` | 50-100 | Load template content |
| `applyTemplate()` | 150-180 | Insert template |

**Templates Available**:
- `templates.js` lines 10-80: Blank
- Lines 90-150: README
- Lines 160-230: Blog Post
- Lines 240-310: Research Paper
- Lines 320-390: Documentation
- Lines 400-470: Meeting Notes

---

### ✂️ **Snippets** (`src/features/snippets/`)

**File**: `index.js` (~150 lines)

**Snippets Config**: `src/config/snippets.js` (~300 lines)

| Function | Lines | Purpose |
|----------|-------|---------|
| `insertSnippet()` | 50-100 | Insert at cursor |
| `loadSnippets()` | 120-140 | Load from config |

**Snippets Available** (`snippets.js`):
- Lines 10-50: Table snippet
- Lines 60-90: Code block
- Lines 100-130: Math equation
- Lines 140-170: Mermaid diagram
- Lines 180-210: Checklist

---

## 🛠️ Services Map

### 📤 **Export** (`src/services/export/`)

| File | Lines | Purpose |
|------|-------|---------|
| `index.js` | ~200 | Export manager, modal control |
| `pdf.js` | ~300 | PDF export (html2pdf.js) |
| `html.js` | ~250 | HTML export with styles |
| `markdown.js` | ~100 | Plain markdown download |
| `docx.js` | ~400 | DOCX export (experimental) |

**Key Functions**:

#### PDF Export (`pdf.js`)
- `exportToPDF()` - Lines 50-200
  - Uses html2pdf.js
  - Configurable margins, header, footer
  - Page breaks handling

#### HTML Export (`html.js`)
- `exportToHTML()` - Lines 50-180
  - Standalone HTML with CSS
  - Embedded GitHub markdown styles
  - Syntax highlighting included

#### Markdown Export (`markdown.js`)
- `downloadMarkdown()` - Lines 20-60
  - Plain text download
  - Filename from tab title

**Modal**: `#export-modal` (index.html lines 1260-1450)

**Modification Points**:
- Add export format: Create new file in `src/services/export/`
- Modify PDF style: `pdf.js` lines 100-150
- Change export modal: index.html lines 1260-1450

---

### ⌨️ **Keyboard Shortcuts** (`src/services/shortcuts/`)

**File**: `index.js` (~400 lines)

| Shortcut | Lines | Action | Handler |
|----------|-------|--------|---------|
| Ctrl+S | 50-70 | Save as Markdown | Export service |
| Ctrl+P | 80-100 | Export to PDF | PDF export |
| Ctrl+O | 110-130 | Import file | Import feature |
| Ctrl+D | 140-160 | Toggle dark mode | Theme service |
| Ctrl+B | 170-190 | Bold text | Toolbar |
| Ctrl+I | 200-220 | Italic text | Toolbar |
| Ctrl+K | 230-250 | Insert link | Toolbar |
| Ctrl+1-6 | 260-320 | Headings | Toolbar |
| Ctrl+Shift+F | 330-350 | Focus mode | Focus feature |
| Ctrl+Shift+E | 360-380 | Export modal | Modal service |

**Modification Point**: Add shortcut at lines 390-400

---

## 🎨 Styling System

### 📄 **CSS Files**

| File | Lines | Purpose |
|------|-------|---------|
| `public/css/premium-ui.css` | ~5000 | Main UI styles |
| `public/css/style.css` | ~500 | Base styles |
| `public/css/github-markdown-light.css` | ~1000 | Markdown preview |

### 🎨 **premium-ui.css Structure**

| Section | Lines | What It Styles |
|---------|-------|----------------|
| CSS Variables | 1-100 | Color scheme, spacing |
| Reset & Base | 101-200 | Normalize styles |
| Header | 201-500 | Top navigation bar |
| Toolbar | 501-800 | Rich text toolbar |
| Editor Container | 801-1000 | Monaco editor wrapper |
| Preview Panel | 1001-1300 | Markdown preview area |
| Sidebars | 1301-1800 | Left & right panels |
| Modals | 1801-2500 | All modal dialogs |
| Buttons | 2501-2800 | Button styles |
| Forms | 2801-3000 | Input, select, etc. |
| Toast | 3001-3100 | Notifications |
| Responsive | 3101-4500 | Mobile breakpoints |
| Themes | 4501-5000 | Dark mode overrides |

**CSS Custom Properties** (Lines 10-90):
```css
--primary-color: #5865f2;
--bg-color: #ffffff;
--text-color: #1e1e1e;
--border-color: #e1e4e8;
--sidebar-width: 280px;
--header-height: 60px;
--toolbar-height: 48px;
```

---

## 🔄 Common Modification Guides

### ➕ Add a New UI Button

**Files to modify**:
1. **index.html** (lines 350-550) - Add button HTML
2. **src/features/toolbar/index.js** (lines 50-300) - Add event handler
3. **public/css/premium-ui.css** (lines 2501-2800) - Style button (optional)

**Example**:
```javascript
// toolbar/index.js line ~280
document.getElementById('my-new-btn').addEventListener('click', () => {
    // Your logic here
});
```

---

### ➕ Add a New Feature Module

**Steps**:
1. Create folder: `src/features/my-feature/`
2. Create `index.js` with `initMyFeature()` function
3. Import in `src/features/index.js`
4. Call in `src/main.js` initialization section

**Template**:
```javascript
// src/features/my-feature/index.js
export function initMyFeature() {
    console.log('My feature initialized');
    
    // Setup event listeners
    // Load settings
    // Initialize UI
}

export default { initMyFeature };
```

---

### ➕ Add a New Export Format

**Files to create/modify**:
1. Create `src/services/export/myformat.js`
2. Import in `src/services/export/index.js`
3. Add button in export modal (index.html lines 1260-1450)

**Template**:
```javascript
// src/services/export/myformat.js
export async function exportToMyFormat(content, title) {
    // Convert content to your format
    const converted = convertContent(content);
    
    // Create blob and download
    const blob = new Blob([converted], { type: 'application/myformat' });
    downloadBlob(blob, `${title}.myext`);
}
```

---

### 🎨 Modify Theme Colors

**File**: `public/css/premium-ui.css` lines 10-90

```css
/* Light theme */
:root {
    --primary-color: #YOUR_COLOR;
    --bg-color: #YOUR_BG;
}

/* Dark theme */
body.dark-mode {
    --primary-color: #YOUR_DARK_COLOR;
    --bg-color: #YOUR_DARK_BG;
}
```

---

### 📝 Add Markdown Extension

**File**: `src/core/markdown/index.js` lines 1-100

```javascript
import myExtension from 'marked-my-extension';

// Line ~90
marked.use(myExtension({
    // configuration
}));
```

---

## 🧪 Testing

**Test Files**: `src/__tests__/`
- `database.test.js` - Database operations
- `noteStorage.test.js` - Storage CRUD
- `migration.test.js` - Data migration
- `setup.js` - Test environment setup

**Test Framework**: Vitest
**Commands**:
- `npm run test` - Run tests
- `npm run test:watch` - Watch mode
- `npm run test:coverage` - Coverage report

---

## 📦 Dependencies Quick Reference

**Core Libraries**:
- `monaco-editor` - Code editor (src/core/editor/)
- `marked` - Markdown parser (src/core/markdown/)
- `dompurify` - XSS sanitization (src/core/markdown/)
- `dexie` - IndexedDB wrapper (src/core/storage/)
- `mermaid` - Diagrams (src/core/markdown/)
- `katex` - Math (src/core/markdown/)
- `prismjs` - Syntax highlighting (src/core/markdown/)
- `html2pdf.js` - PDF export (src/services/export/)
- `html2canvas` - Canvas rendering (src/services/export/)

---

## 🚀 Initialization Flow

**Entry Point**: `src/main.js`

1. **Lines 1-100**: Import dependencies
2. **Lines 100-200**: Monaco worker setup
3. **Lines 200-300**: Initialize core systems
   - Editor setup
   - Markdown parser
   - Storage connection
4. **Lines 300-500**: Initialize features
   - Tabs
   - Toolbar
   - Stats, Goals, TOC
   - Templates, Snippets
   - AI Writer
5. **Lines 500-700**: Initialize services
   - Export handlers
   - Keyboard shortcuts
   - PWA setup
   - Autosave
6. **Lines 700-900**: Initialize UI
   - Theme management
   - Modals
   - Toast notifications
   - Mobile responsiveness
7. **Lines 900-1000**: Event listeners & final setup

---

## 🎯 AI Agent Best Practices

### ✅ DO:
1. **Always check this memory file first** before exploring code
2. **Use line ranges** provided to jump directly to relevant code
3. **Check feature maps** to understand module boundaries
4. **Follow modification guides** for common changes
5. **Use code-review-graph tools** for impact analysis

### ❌ DON'T:
1. **Read entire files** when line ranges are provided
2. **Modify unrelated modules** - stay within feature boundaries
3. **Ignore existing patterns** - follow established code style
4. **Skip testing** after modifications
5. **Forget to update this memory** after major changes

---

## 📚 Additional Documentation

- **Feature Details**: `AI-DOCS/features/*.md`
- **Architecture Diagrams**: `AI-DOCS/architecture/*.md`
- **Modification Guides**: `AI-DOCS/modification-guides/*.md`
- **Code Review Graph Wiki**: `.code-review-graph/wiki/`

---

## 🔗 Related Files

- `.cursorrules` - Cursor AI configuration
- `.windsurfrules` - Windsurf AI configuration
- `CLAUDE.md` - Claude-specific instructions
- `GEMINI.md` - Gemini-specific instructions
- `AGENTS.md` - Multi-agent coordination

---

**🎯 Goal**: Make AI navigation 10x faster by providing instant access to exact file locations and line ranges for any modification task.
