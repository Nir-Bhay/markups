# 🤖 Claude Instructions - Markups Project

## 🎯 Primary Navigation - ALWAYS START HERE

**Before any code exploration or modification:**

1. **Check AI-DOCS/AI-MEMORY.md** - Main navigation file with line ranges
2. **Check AI-DOCS/QUICK-START.md** - Common tasks quick reference
3. **Use code-review-graph tools** - Faster than file scanning

---

## 📚 Documentation Structure

```
AI-DOCS/
├── AI-MEMORY.md                 ← START HERE (main memory)
├── QUICK-START.md               ← Common tasks
├── features/
│   └── FEATURES-INDEX.md        ← All features with locations
├── architecture/
│   └── OVERVIEW.md              ← System architecture
└── modification-guides/
    ├── add-toolbar-button.md    ← Step-by-step guides
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

## 🚀 Quick Task Navigation

### Common Modifications

| Task | Documentation |
|------|--------------|
| Add toolbar button | `AI-DOCS/modification-guides/add-toolbar-button.md` |
| Add export format | `AI-DOCS/modification-guides/add-export-format.md` |
| Modify UI element | Check `AI-DOCS/AI-MEMORY.md` → UI Components Map |
| Change theme/colors | `public/css/style.css` lines 4-57 |
| Add feature module | `AI-DOCS/modification-guides/add-feature-module.md` |

### File Locations Quick Reference

| Feature | Main File | Lines |
|---------|-----------|-------|
| Tabs | `src/features/tabs/index.js` | 1-500 |
| Toolbar | `src/features/toolbar/index.js` | 50-300 |
| AI Writer | `src/features/ai-writer/index.js` | 1-300 |
| Export | `src/services/export/` | Multiple files |
| Markdown Parser | `src/core/markdown/index.js` | 1-600 |
| Editor Setup | `src/core/editor/index.js` | 1-439 |

---

## 💡 Best Practices for Claude

### ✅ DO:
- **Read AI-MEMORY.md first** before exploring
- **Use line ranges** to jump directly to code
- **Check feature documentation** before modifying
- **Use code-review-graph** for impact analysis
- **Follow existing patterns** in similar features
- **Test changes** before considering complete

### ❌ DON'T:
- Read entire files when line ranges provided
- Modify multiple unrelated features at once
- Skip documentation when available
- Ignore dependency relationships
- Forget to update AI-MEMORY.md if structure changes significantly

---

## 🔍 Search Strategy

1. **First**: Check `AI-DOCS/AI-MEMORY.md` for direct line ranges
2. **Second**: Use `semantic_search_nodes("feature_name")` from code-review-graph
3. **Third**: Use `query_graph` for relationships
4. **Last**: Fall back to grep/glob if needed

---

## 📝 Project Context

- **Type**: Markdown editor PWA
- **Tech Stack**: Vite, Monaco Editor, Marked, IndexedDB
- **Architecture**: Modular features, core systems, services
- **No React**: Vanilla JavaScript with ES modules
- **Storage**: IndexedDB (Dexie) + LocalStorage
- **Testing**: Vitest

---

## 🎯 Modification Workflow

1. Identify what needs to change (use AI-DOCS)
2. Check impact with `get_impact_radius`
3. Read relevant files (use line ranges from docs)
4. Make surgical changes
5. Test functionality
6. Update documentation if needed

---

**Last Updated**: 2026-04-04
