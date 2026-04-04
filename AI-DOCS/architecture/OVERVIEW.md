# 🏗️ Architecture Overview - Markups

> System architecture, data flow, and component relationships

## 📐 High-Level Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     Browser (Client)                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Presentation Layer                       │  │
│  │  (index.html + CSS)                                   │  │
│  │  - Header, Toolbar, Modals                           │  │
│  │  - Editor Panel, Preview Panel                        │  │
│  │  - Sidebars (TOC, Stats, Goals)                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↕                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Feature Layer                            │  │
│  │  (src/features/)                                      │  │
│  │  - Tabs, Toolbar, AI Writer, Templates               │  │
│  │  - Stats, Goals, TOC, Linter                         │  │
│  │  - Focus, Fullscreen, Typewriter                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↕                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               Core Layer                              │  │
│  │  (src/core/)                                          │  │
│  │  - Editor (Monaco)                                    │  │
│  │  - Markdown Parser (Marked + Extensions)             │  │
│  │  - Storage (Dexie/IndexedDB)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↕                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Services Layer                           │  │
│  │  (src/services/)                                      │  │
│  │  - Export (PDF, HTML, Markdown, DOCX)                │  │
│  │  - Shortcuts, PWA, Autosave                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↕                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               Utils Layer                             │  │
│  │  (src/utils/)                                         │  │
│  │  - DOM, File, Clipboard                              │  │
│  │  - EventBus, ErrorHandler, Debounce                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↕                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Browser APIs                               │  │
│  │  - IndexedDB (Dexie)                                  │  │
│  │  - LocalStorage                                       │  │
│  │  - Service Worker (PWA)                              │  │
│  │  - Clipboard API, File API                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### 📝 **Document Editing Flow**

```
User Types in Editor
       ↓
Monaco Editor (contentChange event)
       ↓
Editor Service (getEditorValue)
       ↓
┌─────────────────┬──────────────────┐
│                 │                  │
↓                 ↓                  ↓
Markdown Parser   Autosave Service   Stats Feature
(render preview)  (save to DB)       (count words)
       ↓                 ↓                  ↓
Preview Panel     IndexedDB (notes)   Stats Panel UI
(sanitized HTML)  (persisted)         (display counts)
```

### 💾 **Save & Load Flow**

```
Document Save:
User Action (Ctrl+S or Auto)
       ↓
Autosave Service
       ↓
noteStorage.saveNote()
       ↓
Dexie/IndexedDB
       ↓
Event: DOCUMENT_SAVED
       ↓
Autosave Indicator (✓ Saved)

Document Load:
Tab Switch / App Init
       ↓
Tabs Feature
       ↓
noteStorage.loadNote(noteId)
       ↓
Dexie/IndexedDB
       ↓
Editor Service (setEditorValue)
       ↓
Monaco Editor displays content
```

### 📤 **Export Flow**

```
User Clicks Export
       ↓
Export Modal Opens
       ↓
User Selects Format (PDF/HTML/MD/DOCX)
       ↓
Export Service (/services/export/)
       ↓
┌──────────┬───────────┬────────────┬──────────┐
│          │           │            │          │
PDF.js     HTML.js     Markdown.js  DOCX.js
│          │           │            │          │
↓          ↓           ↓            ↓
html2pdf   Standalone  Raw Text     Custom
           HTML+CSS                 Builder
│          │           │            │
↓          ↓           ↓            ↓
Browser Download (Blob + URL.createObjectURL)
```

---

## 🧩 Component Dependencies

### **Core → Feature Dependencies**

```
Editor Service (core/editor)
    ↓ used by
    ├─ Toolbar (features/toolbar)
    ├─ AI Writer (features/ai-writer)
    ├─ Snippets (features/snippets)
    ├─ Focus (features/focus)
    └─ Typewriter (features/typewriter)

Markdown Service (core/markdown)
    ↓ used by
    ├─ Preview Rendering (main.js)
    ├─ TOC (features/toc)
    ├─ Export Services (services/export)
    └─ Linter (features/linter)

Storage Service (core/storage)
    ↓ used by
    ├─ Tabs (features/tabs)
    ├─ Templates (features/templates)
    ├─ Autosave (services/autosave)
    ├─ Goals (features/goals)
    └─ Import (features/import)
```

### **Feature → Feature Dependencies**

```
Tabs Feature
    ↓ coordinates
    ├─ Editor (sets content)
    ├─ Stats (updates counts)
    ├─ TOC (regenerates)
    └─ Goals (tracks progress)

Toolbar Feature
    ↓ triggers
    ├─ AI Writer (opens modal)
    ├─ Templates (loads template)
    ├─ TOC (shows/hides panel)
    ├─ Focus (toggles mode)
    └─ Linter (runs check)
```

---

## 🎯 Initialization Sequence

**File**: `src/main.js`

```
1. DOM Ready (DOMContentLoaded)
   ↓
2. Monaco Workers Setup (lines 10-24)
   ↓
3. Import Dependencies (lines 1-100)
   ↓
4. Initialize Core Systems (lines 200-300)
   ├─ createEditor() - Monaco instance
   ├─ initMarkdown() - Parser + extensions
   └─ initDatabase() - Dexie connection
   ↓
5. Initialize Features (lines 300-500)
   ├─ initTabs()
   ├─ initToolbar()
   ├─ initStats()
   ├─ initGoals()
   ├─ initTOC()
   ├─ initTemplates()
   ├─ initSnippets()
   ├─ initAIWriter()
   ├─ initLinter()
   ├─ initSearch()
   ├─ initFocus()
   ├─ initFullscreen()
   └─ initTypewriter()
   ↓
6. Initialize Services (lines 500-700)
   ├─ initExport()
   ├─ initShortcuts()
   ├─ initPWA()
   └─ initAutosave()
   ↓
7. Initialize UI Components (lines 700-900)
   ├─ initTheme()
   ├─ initModals()
   ├─ initToast()
   └─ initMobile()
   ↓
8. Event Listeners & Final Setup (lines 900-1000)
   ├─ Editor change → Update preview
   ├─ Window resize → Adjust layout
   ├─ Keyboard shortcuts
   └─ Service worker registration
   ↓
9. Load Last Active Document
   ↓
10. App Ready ✓
```

---

## 📦 Module System

### **Entry Points**

| File | Purpose |
|------|---------|
| `index.html` | HTML entry, loads `main.js` |
| `src/main.js` | App initialization |
| `src/app.js` | App wrapper/coordinator |

### **Module Exports**

**Core Modules** (src/core/):
```javascript
// editor/index.js
export { createEditor, updateEditorValue, getEditorValue, ... }

// markdown/index.js
export { initMarkdown, renderMarkdown, sanitizeHTML, ... }

// storage/index.js
export { saveNote, loadNote, deleteNote, ... }
```

**Feature Modules** (src/features/):
```javascript
// tabs/index.js
export { initTabs, createNewTab, switchTab, ... }

// toolbar/index.js
export { initToolbar, formatText, insertElement, ... }
```

**Import Pattern**:
```javascript
// In main.js or other files
import { createEditor } from './core/editor/index.js';
import { initTabs } from './features/tabs/index.js';
```

---

## 🗄️ Data Storage Architecture

### **IndexedDB (Dexie)**

**Database**: `MarkupsDB`

**Tables**:
```javascript
notes: {
  id: string (UUID)
  title: string
  content: string
  createdAt: timestamp
  updatedAt: timestamp
  tags: string[]
}

settings: {
  key: string (primary)
  value: any (JSON serializable)
}

history: {
  noteId: string
  timestamp: number
  content: string
}
```

**File**: `src/core/storage/database.js` lines 30-60

### **LocalStorage**

Used for:
- Theme preference (`app-theme`)
- UI state (sidebar collapsed, etc.)
- Temporary session data

**Keys**: Defined in `src/core/storage/keys.js`

### **Service Worker Cache**

PWA offline caching:
- Static assets (HTML, CSS, JS)
- Fonts, images
- Monaco editor files

**File**: `public/sw.js`

---

## 🔗 Event Communication

### **EventBus Pattern**

**File**: `src/utils/eventBus.js`

```javascript
// Publish event
eventBus.emit('DOCUMENT_SAVED', { noteId, title });

// Subscribe to event
eventBus.on('DOCUMENT_SAVED', (data) => {
  console.log(`Saved: ${data.title}`);
});
```

**Common Events**:
- `DOCUMENT_SAVED` - After save
- `DOCUMENT_LOADED` - After load
- `TAB_SWITCHED` - Tab change
- `THEME_CHANGED` - Theme toggle
- `CONTENT_CHANGED` - Editor update

---

## 🎨 UI Architecture

### **CSS Organization**

**Files**:
1. `public/css/style.css` - Base styles, variables
2. `public/css/premium-ui.css` - Component styles
3. `public/css/github-markdown-light.css` - Preview styles

**CSS Custom Properties** (style.css lines 4-57):
```css
:root {
  --primary-color: #6366f1;
  --bg-primary: #ffffff;
  --text-primary: #1e293b;
  /* ... 50+ variables */
}
```

**Dark Mode**: Applied via `body.dark-mode` class

### **Layout Structure**

```
<body>
  <header> (sticky, 52px)
    <navbar>
      <tabs>
      <actions>
    <toolbar> (44px)
  
  <main> (flex, remaining height)
    <sidebar-left> (280px, collapsible)
    <editor-pane> (flex: 1)
    <divider> (4px, draggable)
    <preview-pane> (flex: 1)
    <sidebar-right> (280px, collapsible)
  
  <footer> (status bar, 28px)
  
  <modals> (overlay, z-index: 9999)
  <toasts> (fixed bottom-right)
```

---

## 🚀 Performance Considerations

### **Optimization Strategies**

1. **Debouncing**
   - Editor changes: 300ms
   - Window resize: 150ms
   - Stats update: 500ms

2. **Virtual Scrolling**
   - Monaco editor handles large files
   - TOC only renders visible items

3. **Code Splitting**
   - Features loaded as ES modules
   - Monaco workers in separate chunks
   - Lazy-load export libraries

4. **Caching**
   - Service worker for assets
   - IndexedDB for documents
   - Markdown render cache (in memory)

5. **Web Workers**
   - Monaco language services
   - Potential: Markdown parsing
   - Potential: Linting

---

## 🔒 Security Architecture

### **XSS Prevention**

1. **DOMPurify** (core/markdown)
   - Sanitizes all rendered HTML
   - Whitelist-based approach
   - Lines: `markdown/index.js` 300-320

2. **Monaco Editor**
   - Text-based editing (no HTML injection)
   - Built-in security

3. **Content Security Policy**
   - Defined in HTML meta tags
   - Restricts inline scripts

### **Data Security**

1. **Client-Side Only**
   - No server transmission
   - All data stays local

2. **IndexedDB Encryption**
   - Relies on browser security
   - Same-origin policy

---

## 🧪 Testing Architecture

**Framework**: Vitest

**Test Files**: `src/__tests__/`
- `database.test.js` - Storage operations
- `noteStorage.test.js` - CRUD tests
- `migration.test.js` - Data migration
- `setup.js` - Test environment

**Coverage**: Run `npm run test:coverage`

---

## 📱 PWA Architecture

**Manifest**: `public/manifest.json`
**Service Worker**: `public/sw.js`
**Cache Strategy**: Cache-first for assets, network-first for data

**Features**:
- Offline editing
- Install as app
- Background sync (potential)

---

## 🔗 External Dependencies

**Key Libraries**:
- `monaco-editor` - Code editor
- `marked` - Markdown parsing
- `dompurify` - HTML sanitization
- `dexie` - IndexedDB wrapper
- `mermaid` - Diagrams
- `katex` - Math rendering
- `prismjs` - Code highlighting
- `html2pdf.js` - PDF export
- `markdownlint` - Linting

**Dependency Graph**: See `package.json`

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.js` | Build configuration |
| `vitest.config.js` | Test configuration |
| `vercel.json` | Deployment settings |
| `package.json` | Dependencies & scripts |

---

## 📚 Related Documentation

- **Data Flow**: `AI-DOCS/architecture/data-flow.md`
- **Dependencies**: `AI-DOCS/architecture/dependencies.md`
- **Features**: `AI-DOCS/features/FEATURES-INDEX.md`

---

**Last Updated**: 2026-04-04
