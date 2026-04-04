# 🤖 Gemini Instructions - Markups Project

## 🎯 Primary Navigation System

**IMPORTANT: Before exploring or modifying code:**

1. **Read `AI-DOCS/AI-MEMORY.md`** first - Complete codebase map with exact line ranges
2. **Check `AI-DOCS/QUICK-START.md`** - Instant navigation for common tasks
3. **Use code-review-graph tools** - Structural code analysis (faster than file scanning)
4. **Reference feature docs** - `AI-DOCS/features/FEATURES-INDEX.md` for detailed feature info

**This saves you from reading entire files and provides instant, accurate navigation.**

---

## 📂 Documentation Hub

```
AI-DOCS/
├── AI-MEMORY.md                 ← 🎯 Main navigation (START HERE)
├── QUICK-START.md               ← ⚡ Common tasks
├── features/
│   └── FEATURES-INDEX.md        ← 📑 All features catalog
├── architecture/
│   └── OVERVIEW.md              ← 🏗️ System design
└── modification-guides/
    ├── add-toolbar-button.md    ← 🔨 How-to guides
    ├── add-export-format.md
    └── ...more guides
```

---

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

---

## 🚀 Task → Documentation Routing

| Task Type | Go To |
|-----------|-------|
| **Add toolbar button** | `AI-DOCS/modification-guides/add-toolbar-button.md` |
| **Add export format** | `AI-DOCS/modification-guides/add-export-format.md` |
| **Modify existing feature** | `AI-DOCS/features/FEATURES-INDEX.md` → find feature |
| **Change UI styling** | `AI-DOCS/AI-MEMORY.md` → CSS Architecture section |
| **Understand data flow** | `AI-DOCS/architecture/OVERVIEW.md` |
| **Find feature code** | `AI-DOCS/AI-MEMORY.md` → Features Map |
| **Change theme colors** | `public/css/style.css` lines 4-57 (CSS variables) |
| **Add markdown extension** | `src/core/markdown/index.js` lines 1-100 |

---

## 💡 Gemini-Specific Best Practices

### ✅ DO:
- **Read AI-MEMORY.md comprehensively** - Gemini's context window handles it well
- **Use multi-turn conversations** - Reference docs across turns
- **Leverage code understanding** - Use graph tools for deeper analysis
- **Think step-by-step** - Plan modifications before implementing
- **Verify dependencies** - Use `get_impact_radius` before changes
- **Test incrementally** - Make small, testable changes

### ❌ DON'T:
- Skip documentation in favor of file exploration
- Make assumptions about code structure
- Modify core systems without impact analysis
- Ignore existing patterns in similar features
- Forget error handling and edge cases
- Make broad changes without testing

---

## 🔍 Efficient Search Strategy

```
User Query
    ↓
Step 1: Check AI-DOCS/AI-MEMORY.md
    ├─ Found? → Use line ranges directly
    └─ Not found? → Continue to Step 2
    
Step 2: Use code-review-graph
    ├─ semantic_search_nodes("keyword")
    ├─ query_graph(pattern="callers_of", target="func")
    └─ get_architecture_overview()
    
Step 3: Check feature documentation
    └─ AI-DOCS/features/FEATURES-INDEX.md
    
Step 4: Targeted file reading
    └─ Use specific line ranges from docs

Step 5: Grep/glob (last resort)
```

---

## 📊 Project Overview

**Markups** - A powerful, privacy-focused markdown editor

| Aspect | Details |
|--------|---------|
| **Type** | Progressive Web App (PWA) |
| **Framework** | Vanilla JavaScript (no React/Vue/Angular) |
| **Build** | Vite 6.x |
| **Editor** | Monaco Editor (VS Code's editor) |
| **Parser** | Marked + extensions (KaTeX, Mermaid, GFM) |
| **Storage** | Dexie (IndexedDB) + LocalStorage |
| **Testing** | Vitest with coverage |
| **Files** | ~160 JS/CSS/HTML files |
| **Lines** | ~10,000+ total |
| **Features** | 18+ modular features |

---

## 🏗️ Architecture Quick Map

```
┌─────────────────────────────────────┐
│     Presentation (index.html)       │  1980 lines
│     + CSS (premium-ui.css)          │  6500+ lines
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│     Features (src/features/)        │  18 modules
│  Tabs, Toolbar, AI Writer, Stats... │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│     Core (src/core/)                │  3 systems
│  Editor, Markdown, Storage          │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│     Services (src/services/)        │  Export, PWA
│  Export, Shortcuts, Autosave        │  Shortcuts, etc
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│     Utils (src/utils/)              │  Helpers
│  DOM, File, Clipboard, EventBus     │
└─────────────────────────────────────┘
```

---

## 🎯 Modification Workflow for Gemini

### Standard Workflow:
1. **Understand requirement** - What needs to change?
2. **Check documentation** - AI-DOCS for exact locations
3. **Analyze impact** - Use `get_impact_radius()`
4. **Plan approach** - Think through implementation
5. **Read specific code** - Use line ranges from docs
6. **Implement changes** - Follow existing patterns
7. **Test functionality** - Verify it works
8. **Verify no breaks** - Check dependent code
9. **Document if needed** - Update AI-DOCS if major change

### For Complex Changes:
1. Break into smaller steps
2. Use code-review-graph for each step
3. Implement incrementally
4. Test each increment
5. Document dependencies

---

## 📋 Feature Locations (Quick Reference)

| Feature | File | Lines | Description |
|---------|------|-------|-------------|
| **Tabs** | `src/features/tabs/index.js` | 1-500 | Multi-document tabs |
| **Toolbar** | `src/features/toolbar/index.js` | 50-300 | Rich text controls |
| **AI Writer** | `src/features/ai-writer/index.js` | 1-300 | AI assistant |
| **Stats** | `src/features/stats/index.js` | 50-290 | Word/char count |
| **Goals** | `src/features/goals/index.js` | 50-250 | Writing goals |
| **TOC** | `src/features/toc/index.js` | 1-300 | Table of contents |
| **Export** | `src/services/export/` | Multiple | PDF/HTML/MD/DOCX |
| **Markdown** | `src/core/markdown/index.js` | 1-600 | Parser + extensions |
| **Editor** | `src/core/editor/index.js` | 1-439 | Monaco setup |
| **Storage** | `src/core/storage/noteStorage.js` | 1-400 | CRUD operations |

---

## 🔗 Key Dependencies

**Core Libraries:**
- `monaco-editor@0.52` - Code editor
- `marked@15.0` - Markdown parsing
- `dompurify@3.2` - XSS sanitization
- `dexie@4.3` - IndexedDB wrapper
- `mermaid@11.12` - Diagrams
- `katex@0.16` - Math equations
- `prismjs@1.30` - Syntax highlighting
- `html2pdf.js@0.12` - PDF export

---

## 📞 Documentation Resources

| Resource | Purpose |
|----------|---------|
| `AI-DOCS/AI-MEMORY.md` | Complete codebase navigation |
| `AI-DOCS/QUICK-START.md` | Common tasks quick ref |
| `AI-DOCS/features/` | Feature documentation |
| `AI-DOCS/architecture/` | System design docs |
| `AI-DOCS/modification-guides/` | How-to guides |
| `.code-review-graph/wiki/` | Code graph wiki |

---

## 🎓 Learning the Codebase

**For New Context:**
1. Read `AI-DOCS/AI-MEMORY.md` (comprehensive overview)
2. Read `AI-DOCS/architecture/OVERVIEW.md` (system design)
3. Skim `AI-DOCS/features/FEATURES-INDEX.md` (all features)
4. Use code-review-graph tools as needed

**For Specific Tasks:**
1. Check `AI-DOCS/QUICK-START.md` first
2. Follow links to detailed docs
3. Use provided line ranges

---

**Last Updated**: 2026-04-04  
**Objective**: Enable Gemini to navigate codebase 10x faster with AI-optimized documentation
