# 🤖 AI Agents Instructions - Markups Project

## 🎯 For ALL AI Agents (Claude, Copilot, Gemini, Cursor, Windsurf, etc.)

### **CRITICAL: Navigation Protocol**

**Before ANY code exploration or modification:**

1. ✅ **Read `AI-DOCS/AI-MEMORY.md`** - Main navigation with exact line ranges
2. ✅ **Read `AI-DOCS/QUICK-START.md`** - Common task quick reference  
3. ✅ **Use code-review-graph MCP tools** - Structural analysis (fastest)
4. ✅ **Check feature docs** - `AI-DOCS/features/FEATURES-INDEX.md`
5. ❌ **DON'T** read entire files without checking docs first

---

## 📚 Documentation Structure

```
AI-DOCS/
├── AI-MEMORY.md                 ← 🎯 START HERE (complete codebase map)
├── QUICK-START.md               ← ⚡ Common tasks instant navigation
├── features/
│   └── FEATURES-INDEX.md        ← 📑 All 18+ features with file locations
├── architecture/
│   └── OVERVIEW.md              ← 🏗️ System design & data flow
└── modification-guides/
    ├── add-toolbar-button.md    ← 🔨 Step-by-step how-tos
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

## 🚀 Quick Task Routing Table

| What You Need to Do | Where to Look |
|---------------------|---------------|
| **Add UI button** | `AI-DOCS/modification-guides/add-toolbar-button.md` |
| **Add export format** | `AI-DOCS/modification-guides/add-export-format.md` |
| **Modify feature** | `AI-DOCS/features/FEATURES-INDEX.md` → find feature → check file |
| **Change styling** | `AI-DOCS/AI-MEMORY.md` → CSS Architecture → `public/css/style.css` lines 4-57 |
| **Understand architecture** | `AI-DOCS/architecture/OVERVIEW.md` |
| **Find feature location** | `AI-DOCS/AI-MEMORY.md` → Features Map |
| **Add markdown extension** | `src/core/markdown/index.js` lines 1-100 |
| **Modify export** | `src/services/export/{format}.js` |

---

## 💡 Universal Best Practices

### ✅ DO:
- **Check AI-DOCS first** - Save 90% of exploration time
- **Use exact line ranges** - Jump directly to relevant code
- **Verify with code-review-graph** - Understand impact before changing
- **Follow existing patterns** - Check similar features for consistency
- **Test your changes** - Verify functionality works
- **Stay modular** - Don't mix unrelated changes

### ❌ DON'T:
- Read entire files without checking documentation
- Modify code without understanding dependencies
- Skip impact analysis for core system changes
- Ignore existing coding patterns
- Make changes across multiple unrelated features at once
- Forget to handle errors and edge cases

---

## 🔍 Recommended Search Flow

```
User Request
    ↓
1. Check AI-DOCS/AI-MEMORY.md for direct navigation
    ↓ (if found)
    Go to specific file + line range
    
    ↓ (if not found)
2. Use semantic_search_nodes("keyword")
    ↓
3. Use query_graph(pattern="callers_of", target="function")
    ↓
4. Check feature documentation
    ↓
5. Grep/glob (last resort)
```

---

## 📋 Project Quick Facts

| Property | Value |
|----------|-------|
| **Type** | Markdown Editor PWA |
| **Framework** | None (Vanilla JS) |
| **Build Tool** | Vite 6.x |
| **Editor** | Monaco Editor 0.52 |
| **Parser** | Marked 15.x + extensions |
| **Storage** | Dexie (IndexedDB) + LocalStorage |
| **Testing** | Vitest |
| **Total Files** | ~160 (JS, CSS, HTML) |
| **Main Entry** | `src/main.js` (1000+ lines) |
| **UI Entry** | `index.html` (1980 lines) |

---

## 🏗️ Architecture Layers (Top to Bottom)

```
UI Layer → Features Layer → Core Layer → Services Layer → Utils Layer
```

**Key Directories**:
- `src/features/` - 18+ modular features
- `src/core/` - Editor, Markdown, Storage
- `src/services/` - Export, Shortcuts, PWA, Autosave
- `src/ui/` - Toast, Modal, Theme, Loading
- `src/utils/` - DOM, File, Clipboard, EventBus

---

## 🎯 Agent-Specific Tips

### For Cursor / Windsurf
- Use `.cursorrules` / `.windsurfrules` for additional context
- Reference AI-DOCS for precise locations
- Use CMD+K with specific file paths from docs

### For GitHub Copilot
- Read AI-MEMORY.md in chat for context
- Use `@workspace` with specific file paths
- Check modification guides for patterns

### For Claude Projects
- Load AI-DOCS as project knowledge
- Use thinking blocks to plan before coding
- Reference line ranges in prompts

### For Gemini Code Assist
- Include AI-MEMORY.md in context
- Use explicit file paths from documentation
- Reference architecture overview for system design

---

## 🔄 Modification Workflow Template

```
1. User Request
   ↓
2. Check AI-DOCS/AI-MEMORY.md or QUICK-START.md
   ↓
3. Identify files & line ranges
   ↓
4. Use get_impact_radius() to check dependencies
   ↓
5. Read specific files (with line ranges)
   ↓
6. Make surgical changes
   ↓
7. Test functionality
   ↓
8. Verify no breaking changes
   ↓
9. Complete ✓
```

---

## 📞 Need Help?

- **Main Memory**: `AI-DOCS/AI-MEMORY.md`
- **Quick Tasks**: `AI-DOCS/QUICK-START.md`
- **Features**: `AI-DOCS/features/FEATURES-INDEX.md`
- **Architecture**: `AI-DOCS/architecture/OVERVIEW.md`
- **How-To Guides**: `AI-DOCS/modification-guides/`
- **Code Graph**: `.code-review-graph/wiki/`

---

**Last Updated**: 2026-04-04  
**Goal**: 10x faster AI navigation with zero file scanning
