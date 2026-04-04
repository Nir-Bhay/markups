# 🚀 AI Quick Start Guide - Markups

> **For AI Agents**: Start here for instant navigation to any part of the codebase.

## 🎯 Common Tasks - Direct Navigation

### ➕ Adding Features

| Task | File(s) to Modify | Lines |
|------|-------------------|-------|
| **Add toolbar button** | `index.html` + `src/features/toolbar/index.js` | HTML: 350-550, JS: 50-300 |
| **Add export format** | `src/services/export/{format}.js` + `index.js` | Create new file + import |
| **Add keyboard shortcut** | `src/services/shortcuts/index.js` | 390-400 (add new) |
| **Add template** | `src/config/templates.js` | 10-500 (add new entry) |
| **Add snippet** | `src/config/snippets.js` | 10-300 (add new entry) |
| **Add theme** | `src/core/editor/themes.js` | 80-180 (define new) |

### 🎨 UI Modifications

| Task | File(s) to Modify | Lines |
|------|-------------------|-------|
| **Change colors** | `public/css/style.css` | 4-57 (CSS variables) |
| **Modify header** | `index.html` + `public/css/premium-ui.css` | HTML: 134-320, CSS: 122-440 |
| **Style modals** | `public/css/premium-ui.css` | 1100-1230 |
| **Edit toolbar** | `index.html` + `public/css/premium-ui.css` | HTML: 350-550, CSS: 442-554 |
| **Dark mode colors** | `src/ui/theme/index.js` | 23-56 (theme properties) |

### 🔧 Core Systems

| Task | File(s) to Modify | Lines |
|------|-------------------|-------|
| **Markdown parsing** | `src/core/markdown/index.js` | 1-100 (extensions), 150-250 (render) |
| **Editor config** | `src/core/editor/index.js` | 50-150 (Monaco setup) |
| **Database schema** | `src/core/storage/database.js` | 30-60 (Dexie schema) |
| **Storage operations** | `src/core/storage/noteStorage.js` | 50-350 (CRUD) |

### 📤 Services

| Task | File(s) to Modify | Lines |
|------|-------------------|-------|
| **PDF export** | `src/services/export/pdf.js` | 50-200 |
| **HTML export** | `src/services/export/html.js` | 50-180 |
| **Markdown export** | `src/services/export/markdown.js` | 20-60 |
| **Keyboard shortcuts** | `src/services/shortcuts/index.js` | 50-390 |

---

## 📂 File Organization

```
AI-DOCS/
├── AI-MEMORY.md                 ← Main memory file (START HERE)
├── QUICK-START.md               ← This file
├── features/
│   ├── FEATURES-INDEX.md        ← All features overview
│   ├── tabs.md                  ← Multi-tab system
│   ├── toolbar.md               ← Rich text toolbar
│   ├── export.md                ← Export system
│   ├── ai-writer.md             ← AI assistant
│   └── ...                      ← Individual feature docs
├── architecture/
│   ├── OVERVIEW.md              ← System architecture
│   ├── data-flow.md             ← How data moves
│   ├── initialization.md        ← App startup
│   └── dependencies.md          ← Module relationships
└── modification-guides/
    ├── add-ui-button.md         ← Step-by-step guides
    ├── add-export-format.md
    ├── add-feature-module.md
    └── modify-theme.md
```

---

## 🔍 Search Strategies

### Strategy 1: Use Code Review Graph (FASTEST)
```
1. Use semantic_search_nodes("tabs") to find tab-related code
2. Use query_graph(pattern="callers_of", target="saveNote") to find all callers
3. Use get_impact_radius(changed_files=["src/features/tabs/index.js"]) for impact
```

### Strategy 2: Use AI-MEMORY.md
```
1. Search AI-MEMORY.md for feature name
2. Jump to listed file and line range
3. Modify code
```

### Strategy 3: Use Feature Docs
```
1. Check AI-DOCS/features/{feature}.md
2. Follow modification guidelines
3. Update related files
```

---

## 🎯 Feature Locations Quick Reference

| Feature | Main File | Lines | Secondary Files |
|---------|-----------|-------|-----------------|
| **Tabs** | `src/features/tabs/index.js` | 1-500 | HTML: 142-157 |
| **Toolbar** | `src/features/toolbar/index.js` | 50-300 | HTML: 350-550 |
| **TOC** | `src/features/toc/index.js` | 1-300 | HTML: 820-850 |
| **Stats** | `src/features/stats/index.js` | 50-290 | HTML: 860-900 |
| **Goals** | `src/features/goals/index.js` | 50-250 | HTML: 910-950 |
| **AI Writer** | `src/features/ai-writer/index.js` | 1-300 | `ui.js`, `service.js` |
| **Templates** | `src/features/templates/index.js` | 50-200 | `config/templates.js` |
| **Snippets** | `src/features/snippets/index.js` | 50-140 | `config/snippets.js` |
| **Focus** | `src/features/focus/index.js` | 1-200 | — |
| **Fullscreen** | `src/features/fullscreen/index.js` | 1-150 | — |
| **Typewriter** | `src/features/typewriter/index.js` | 1-180 | — |
| **Linter** | `src/features/linter/index.js` | 1-400 | HTML: 1150-1190 |
| **Search** | `src/features/search/index.js` | 1-350 | — |
| **Import** | `src/features/import/index.js` | 1-250 | HTML: 258-266 |

---

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────────┐
│         UI Layer (index.html)           │
│  - Header, Toolbar, Modals, Sidebars   │
└─────────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────────┐
│      Features Layer (src/features/)     │
│  - Tabs, Stats, Goals, AI Writer, etc.  │
└─────────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────────┐
│       Core Layer (src/core/)            │
│  - Editor, Markdown, Storage            │
└─────────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────────┐
│     Services Layer (src/services/)      │
│  - Export, Shortcuts, PWA, Autosave     │
└─────────────────────────────────────────┘
              ↓ ↑
┌─────────────────────────────────────────┐
│      Utils Layer (src/utils/)           │
│  - DOM, File, Clipboard, EventBus       │
└─────────────────────────────────────────┘
```

---

## 💡 Tips for AI Agents

### ✅ DO:
- Start with AI-MEMORY.md for overview
- Use line ranges to jump directly to code
- Check feature docs before modifying
- Use code-review-graph tools for impact analysis
- Follow existing code patterns

### ❌ DON'T:
- Read entire files when line ranges provided
- Modify multiple unrelated modules at once
- Skip testing after changes
- Ignore dependency relationships
- Forget to update documentation

---

## 📞 Getting Help

- **Main Memory**: `AI-DOCS/AI-MEMORY.md`
- **Feature Details**: `AI-DOCS/features/*.md`
- **Architecture**: `AI-DOCS/architecture/*.md`
- **How-To Guides**: `AI-DOCS/modification-guides/*.md`
- **Code Graph Wiki**: `.code-review-graph/wiki/`

---

**Last Updated**: 2026-04-04
