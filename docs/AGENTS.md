# AGENTS.md

> Configuration file for AI coding agents working on **Markups** - Free Online Markdown Editor.

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start Vite dev server (http://localhost:5173) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |

## Architecture

**Frontend-only** Vite + vanilla JavaScript application.
**Live URL**: https://markups.vercel.app/

### Entry Points
- `index.html` — Main HTML file
- `src/main.js` — Primary JavaScript entry point

### Key Libraries
| Library | Purpose |
|---------|---------|
| Monaco Editor | Code editor (VS Code's editor) |
| Marked | Markdown parser |
| Mermaid | Diagram rendering |
| KaTeX | Math equation rendering |
| Prism.js | Syntax highlighting |
| DOMPurify | XSS sanitization |
| html2pdf.js | PDF export |

### Storage
- LocalStorage for document persistence
- Settings stored under `markdown_editor_settings` key

## Project Structure

```
src/
├── main.js             # Main entry point
├── config/             # Configuration files
│   ├── app.config.js   # App settings & feature flags
│   ├── default-content.js
│   ├── snippets.js
│   └── templates.js
├── core/               # Core services
│   ├── editor/         # Monaco editor setup
│   ├── markdown/       # Markdown parser config
│   └── storage/        # LocalStorage service
├── features/           # Feature modules
│   ├── tabs/           # Multi-tab support
│   ├── toc/            # Table of contents
│   ├── goals/          # Writing goals
│   ├── stats/          # Word/char statistics
│   ├── linter/         # Markdown linting
│   ├── search/         # Search in preview
│   ├── templates/      # Document templates
│   ├── snippets/       # Text snippets
│   ├── toolbar/        # Formatting toolbar
│   ├── modes/          # Editor modes
│   ├── focus/          # Focus mode
│   ├── typewriter/     # Typewriter mode
│   ├── fullscreen/     # Fullscreen mode
│   ├── divider/        # Resizable divider
│   ├── image-upload/   # Image handling
│   ├── import/         # File import
│   └── mobile/         # Mobile optimizations
├── services/           # Application services
│   ├── export/         # Export (PDF, HTML, MD, DOCX)
│   ├── pwa/            # PWA service worker
│   └── shortcuts/      # Keyboard shortcuts
├── ui/                 # UI components
│   ├── toast/          # Notifications
│   ├── modal/          # Modal dialogs
│   ├── theme/          # Theme management
│   └── autosave/       # Autosave indicator
└── utils/              # Utility functions
    ├── eventBus.js     # Event system
    ├── debounce.js     # Debounce utility
    ├── dom.js          # DOM helpers
    ├── clipboard.js    # Clipboard helpers
    ├── file.js         # File utilities
    └── scroll-sync.js  # Scroll synchronization
```

## Code Style

- **Language**: Vanilla JavaScript (ES6+)
- **Modules**: ES modules with named imports
- **Pattern**: Singleton services, event-driven communication
- **DOM**: `document.querySelector` for DOM access
- **Formatting**: Semicolons required, consistent indentation

## Deployment

Optimized for **Vercel** deployment:
- `vercel.json` — Deployment configuration
- Framework: Vite
- Build: `npm run build`
- Output: `dist/`

<!-- code-review-graph MCP tools -->
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
| `detect_changes` | Reviewing code changes � gives risk-scored analysis |
| `get_review_context` | Need source snippets for review � token-efficient |
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
