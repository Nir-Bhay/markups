# 📚 AI-DOCS - AI Navigation System for Markups

> **Purpose**: Help AI models navigate the Markups codebase 10x faster

## 🎯 Start Here

**For AI Agents (Claude, Copilot, Gemini, Cursor, Windsurf, etc.):**

1. **Read `AI-MEMORY.md` first** - Complete codebase map with exact line ranges
2. **Check `QUICK-START.md`** - Common tasks instant navigation
3. **Use code-review-graph tools** - Structural code analysis
4. **Reference feature docs** - Detailed module information

---

## 📂 Directory Structure

```
AI-DOCS/
├── README.md                    ← You are here
├── AI-MEMORY.md                 ← 🎯 MAIN NAVIGATION FILE
├── QUICK-START.md               ← ⚡ Common tasks quick reference
│
├── features/
│   └── FEATURES-INDEX.md        ← Complete feature catalog (18+ features)
│
├── architecture/
│   └── OVERVIEW.md              ← System architecture & data flow
│
└── modification-guides/
    ├── add-toolbar-button.md    ← Step-by-step: Add toolbar button
    ├── add-export-format.md     ← Step-by-step: Add export format
    └── (more guides)            ← Additional how-to guides
```

---

## 📖 File Descriptions

### Core Navigation Files

#### `AI-MEMORY.md` ⭐ **START HERE**
- **Purpose**: Complete codebase map with exact file locations and line ranges
- **Contains**:
  - Project structure overview
  - UI components map with DOM IDs and line numbers
  - Core systems (editor, markdown, storage) locations
  - Features map (18+ features with files and lines)
  - Services map (export, shortcuts, PWA)
  - CSS architecture
  - Common modification points
  - Quick navigation tables
- **When to use**: Before ANY code exploration or modification

#### `QUICK-START.md`
- **Purpose**: Fast navigation for common tasks
- **Contains**:
  - Direct links to modification guides
  - File organization summary
  - Search strategies
  - Feature locations table
  - Architecture layers diagram
  - Tips for AI agents
- **When to use**: For routine modifications and quick lookups

---

### Feature Documentation

#### `features/FEATURES-INDEX.md`
- **Purpose**: Complete catalog of all features
- **Contains**:
  - 18+ features with descriptions
  - File locations and line ranges
  - Key functions and their purposes
  - DOM IDs and CSS classes
  - Dependencies
  - Storage mechanisms
- **When to use**: When working with specific features

---

### Architecture Documentation

#### `architecture/OVERVIEW.md`
- **Purpose**: System design and architecture
- **Contains**:
  - High-level architecture diagram
  - Data flow diagrams
  - Component dependencies
  - Initialization sequence
  - Module system
  - Storage architecture
  - Event communication
  - Performance considerations
  - Security architecture
- **When to use**: When understanding system design or making architectural changes

---

### Modification Guides

#### `modification-guides/add-toolbar-button.md`
- **Purpose**: Step-by-step guide for adding toolbar buttons
- **Contains**:
  - Complete workflow
  - Code examples
  - HTML, JavaScript, CSS steps
  - Keyboard shortcut integration
  - Mobile considerations
  - Testing checklist
- **When to use**: Adding new toolbar functionality

#### `modification-guides/add-export-format.md`
- **Purpose**: Step-by-step guide for adding export formats
- **Contains**:
  - Complete workflow
  - Module creation template
  - Registration process
  - UI integration
  - Conversion examples
  - Testing checklist
- **When to use**: Adding new export capabilities

---

## 🚀 Quick Navigation Examples

### Example 1: "Add a bold button to toolbar"
```
1. Read: AI-MEMORY.md → Toolbar section
2. See: index.html lines 350-550 (HTML)
3. See: src/features/toolbar/index.js lines 50-300 (Logic)
4. Follow: modification-guides/add-toolbar-button.md
5. Implement changes
```

### Example 2: "Change dark mode colors"
```
1. Read: AI-MEMORY.md → Styling System
2. See: src/ui/theme/index.js lines 23-56 (theme properties)
3. Modify CSS variables
4. Test in both modes
```

### Example 3: "Add CSV export"
```
1. Read: modification-guides/add-export-format.md
2. Create: src/services/export/csv.js
3. Register in: src/services/export/index.js
4. Add button to: index.html (export modal)
5. Test export
```

---

## 💡 Best Practices for AI Agents

### ✅ Always Do:
1. **Read AI-MEMORY.md first** before exploring code
2. **Use exact line ranges** provided in documentation
3. **Check modification guides** for step-by-step workflows
4. **Use code-review-graph tools** for impact analysis
5. **Follow existing patterns** in similar code
6. **Test changes** before marking complete

### ❌ Never Do:
1. Read entire files without checking documentation
2. Modify code without understanding dependencies
3. Skip impact analysis for core changes
4. Ignore existing code patterns
5. Make changes across unrelated modules simultaneously

---

## 🔍 Search Hierarchy

**Recommended order:**
1. `AI-MEMORY.md` - Direct navigation (fastest)
2. `QUICK-START.md` - Common tasks
3. Feature docs - Detailed module info
4. Code-review-graph - Structural analysis
5. Grep/glob - Last resort

---

## 📊 Project Stats

- **Total Documentation Files**: 7+
- **Total Features Documented**: 18+
- **Total Line Ranges Mapped**: 100+
- **Modification Guides**: 2+ (growing)
- **Time Saved**: ~90% reduction in file exploration

---

## 🔄 Keeping Documentation Updated

**When to update AI-DOCS:**
- Major feature additions
- Significant architectural changes
- New file structure
- Modified initialization flow
- New modification patterns

**How to update:**
1. Modify relevant .md files
2. Update line ranges if they shifted
3. Add new guides as needed
4. Update AI-MEMORY.md indexes

---

## 🎯 Documentation Goals

1. **Speed**: Enable AI to find code 10x faster
2. **Accuracy**: Provide exact file locations and line ranges
3. **Completeness**: Document all features and systems
4. **Usability**: Clear, structured, searchable
5. **Maintainability**: Easy to update as code evolves

---

## 📞 Related Resources

- **Code Review Graph Wiki**: `.code-review-graph/wiki/`
- **Agent Instructions**: `CLAUDE.md`, `GEMINI.md`, `AGENTS.md`
- **Cursor Rules**: `.cursorrules`
- **Windsurf Rules**: `.windsurfrules`

---

## 📝 Changelog

**2026-04-04**: Initial creation
- Created AI-MEMORY.md with complete codebase map
- Created QUICK-START.md for common tasks
- Created features/FEATURES-INDEX.md
- Created architecture/OVERVIEW.md
- Created modification guides (2 guides)
- Updated all agent instruction files

---

## 💬 Feedback

This documentation system is designed to evolve. As AI models use it, patterns will emerge for what works best. The goal is continuous improvement in AI-codebase navigation efficiency.

---

**Last Updated**: 2026-04-04  
**Version**: 1.0.0  
**Maintained for**: Claude, GitHub Copilot, Gemini, Cursor, Windsurf, and all AI code assistants
