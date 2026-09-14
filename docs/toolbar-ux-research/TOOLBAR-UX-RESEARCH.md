# Toolbar UX research

**Status:** implemented on the production `#toolbar` (2026-09-08). This file remains the research record. Live UI: compact Heading / Insert / More / Customize chrome in `index.html`, menus in `src/features/toolbar/chrome.js`, shared inserts in `src/features/toolbar/catalog.js`.

Markups already has a formatting toolbar under the header. This document maps what was on screen at research time, what was hidden in code, what repeated, what was missing for modern Markdown work (docs, GitHub, research), and how comparable products present the same job. The goal was a smaller, more logical bar that still covers more Markdown — by putting the right commands in the right layer, not by adding more icons.

---

## Current inventory

Production entry uses the static bar in `index.html` (`#toolbar` / `.premium-toolbar`). `src/main.js` wires most of those buttons. A second, richer toolbar lives in `src/features/toolbar/dropdowns.js` (`TOOLBAR_GROUPS`) and `ToolbarManager`, but production initializes it on `#enhanced-toolbar` with `render: false`, so that richer bar is **not shown**. Mobile overflow (`#toolbar-overflow-btn` / `#toolbar-overflow-sheet`) is the only place many of those extra inserts appear.

### Visible groups (left → right)

| Group | Control ids | User-facing job | Layer today |
| --- | --- | --- | --- |
| Navigation / history | `explorer-toggle-btn`, `toolbar-undo`, `toolbar-redo` | Open files, undo, redo | Primary bar |
| Inline format | `toolbar-bold`, `toolbar-italic`, `toolbar-strikethrough`, `toolbar-highlight` | Bold / italic / strike / `<mark>` | Primary bar |
| Headings | `toolbar-h1`, `toolbar-h2`, `toolbar-h3` | Prefix `#` / `##` / `###` | Primary bar |
| Insert media & structure | `toolbar-link`, `toolbar-url`, `toolbar-image`, `toolbar-video`, `toolbar-table` | Link, URL wrap, image, video, table picker | Primary bar |
| Code | `toolbar-code`, `toolbar-inline-code` | Fenced block vs `` `inline` `` | Primary bar |
| Lists | `toolbar-ul`, `toolbar-ol`, `toolbar-task` | `- `, `1. `, `- [ ] ` | Primary bar |
| Blocks + color | `toolbar-quote`, `toolbar-hr`, `callout-dropdown-btn`, `toolbar-text-color`, `toolbar-highlight-color`, `toolbar-special-chars` | Quote, rule, alerts, HTML color, Ω | Primary bar |
| Writing tools | `toolbar-emoji`, `ai-writer-button`, `toc-button`, `scroll-sync-button`, `lint-button`, `stats-button` | Emoji, AI, outline, sync, lint, stats | Primary bar (right) |
| Modes | `focus-button`, `typewriter-button`, `fullscreen-button` | Distraction / typewriter / fullscreen | Primary bar |
| Extras | `templates-button`, `goals-button` | Templates, writing goals | Primary bar |
| Overflow | `toolbar-overflow-btn`, `toolbar-overflow-sheet` | Extra formatting / insert / diagrams | Visible on mobile; desktop CSS often hides sibling groups instead |
| Callout menu | `callout-dropdown-sheet` | Alert styles | Popover owned by the bar |

The production toolbar also uses preference groups `workspace`, `format`, `heading`,
`lists`, `link`, `insert`, and `ai`; the customization controls are
`toolbar-customize` and `toolbar-customize-sheet`.

### Hidden or secondary (already in code, not on the primary bar)

From `TOOLBAR_GROUPS` and the mobile overflow renderer:

- Underline, superscript, subscript, `<kbd>`
- Headings H4–H6
- Indent / outdent
- Footnote, abbreviation, definition list, `<details>`
- Inline math `$…$` and block math `$$`
- Mermaid presets: flowchart, sequence, class, state, mindmap, gantt
- HTML comment, `<br>`, anchor id
- Case / sort / trim / strip-markdown / URL encode
- Date-time inserts and lorem ipsum
- Snippets panel and a dedicated word-count popover
- Language-specific fenced code (toolbar v2 dropdown)
- Toolbar settings / hide-buttons prefs (v2 only)

Slash commands (`src/features/slash-commands/registry.js`) only cover H1–H3, lists, quote, code, HR, image, link, table, task. They do **not** cover math, mermaid, footnotes, callouts, or video.

The former command palette was mostly app chrome (export, theme, tabs, focus,
templates, snippets, search), not a Markdown insert palette; it was removed in
the 2026-09-09 cleanup pass in favor of the existing toolbar and feature UI.

Parser already supports GFM, GitHub-style alerts (`marked-alert`), footnotes, heading ids, Mermaid, and KaTeX (`src/core/markdown/index.js`). The visible toolbar does not match that parser.

---

## What works

- **Core GFM formatting is one click away:** bold, italic, strike, headings 1–3, lists, task list, quote, link, image, table, fenced and inline code. That matches how people actually write READMEs and docs ([GFM spec](https://github.github.com/gfm/), [GitHub Markdown guide](https://macmdviewer.com/blog/github-markdown-guide)).
- **Video insert is a real product differentiator.** Most Markdown toolbars stop at images. Markups has a dedicated `toolbar-video` popover.
- **Callouts exist** and match GitHub alerts (`> [!NOTE]` family), which GitHub shipped as a renderer feature in 2023 and which Typora also added ([Typora stable notes](https://typora.io/releases/stable)).
- **Table size picker** is better than dumping a 2×2 stub, which is the usual cheap insert.
- **Undo/redo on the bar** is expected in web editors (MDXEditor ships `UndoRedo` as a first-class toolbar primitive: [MDXEditor toolbar](https://mdxeditor.dev/editor/docs/customizing-toolbar)).
- **Overflow already contains the “power user” set** (math, mermaid, footnotes, transforms). The capability is not missing from the product; it is missing from the *primary* information architecture.
- **Document Mode / live preview edit** (header, not toolbar) is the same bet Typora makes: hide syntax when people want to write, keep source when they need it ([Typora](https://typora.io/), [Typora Markdown reference](https://support.typora.io/Markdown-Reference/)).

---

## What does not work

These are current-product facts from source, not taste.

1. **`toolbar-hr` is a dead control.** It exists in `index.html` and nowhere else. `setupToolbar()` in `src/main.js` never binds it. Horizontal rule in the v2 dropdown is unused because `#enhanced-toolbar` is not rendered. Slash `/divider` still works. The visible button does not.
2. **Two toolbars, one shown.** Production: static HTML + `setupToolbar()`. Modular `src/app.js` can `toolbarManager.initialize(this.containers.toolbar)` and *render* the v2 bar. Users on the live app never see underline, H4–H6, math, mermaid, footnotes, transform, or snippets unless they find the overflow menu (and on desktop that overflow button is easy to miss because `.toolbar-overflow-btn` is shown mainly in the 768px CSS).
3. **Too many equal-weight icons.** Microsoft’s toolbar guide: put frequent groups first, consolidate with menu buttons, and keep overflow for *lack of space*, not as a junk drawer ([Windows UX: Toolbars](https://learn.microsoft.com/en-us/windows/win32/uxguide/cmd-toolbars)). Markups currently shows ~35 chrome controls at once. Hick’s law: more parallel choices, slower decisions ([NN/g on Hick’s law](https://www.nngroup.com/videos/hicks-law-long-menus/)).
4. **Icon-only with weak scent.** NN/g: overflow and mystery icons need labels or a stronger tooltip pattern ([contextual menus](https://www.nngroup.com/articles/contextual-menus-guidelines/)). Several Markups icons collide semantically (clock-like `goals-button` vs header history; checkmark `lint-button` titled “Check Spelling” but aria “Lint Document”; globe `toolbar-url` next to link).
5. **Explorer does not belong in a formatting toolbar.** File tree is navigation. Mixing it with Bold teaches the wrong mental model. UX Patterns: toolbars are *view-scoped command regions*; navigation and primary workflow belong elsewhere ([Toolbar pattern](https://uxpatternsguide.com/patterns/toolbar/)).
6. **Modes mixed with formatting.** Focus, typewriter, fullscreen, scroll-sync, TOC are *view state*, not *insert Markdown*. They compete with Bold for the same row. Comparable products put those in View menus, status bar, or a command palette ([Obsidian command palette](https://obsidian.md/help/plugins/command-palette)).
7. **Slash commands are too thin** for a Notion-like promise. `/` cannot insert the things the parser can render (math, mermaid, callout, footnote, video).
8. **Desktop overflow is inverted.** CSS at 768px *hides* `.toolbar-tools-group`, `.toolbar-modes-group`, `.toolbar-extras-group` and *shows* overflow. Between ~769px and ~1200px the full icon row still fights the header for width; there is no progressive collapse like Toast UI / Word (important items stay, rest chevron).
9. **No selection-aware UI.** MDXEditor’s `ConditionalContents` swaps the bar when a code block is focused ([MDXEditor](https://mdxeditor.dev/editor/docs/customizing-toolbar)). Typora shows a *table* toolbar only when the caret is in a table ([Typora Markdown reference](https://support.typora.io/Markdown-Reference/)). Markups always shows the same 35 buttons, including Video while editing a list.
10. **HTML color / highlight is not portable Markdown.** `toolbar-text-color` and `toolbar-highlight-color` inject HTML. That is fine inside Markups preview; it is a foot-gun for GitHub README authors. Highlight via `<mark>` (`toolbar-highlight`) is the same class of problem, though Typora also supports highlight as an extension.

---

## Duplicates and overlap

| User intent | Surfaces today | Problem |
| --- | --- | --- |
| Make a link | `toolbar-link`, `toolbar-url`, paste-URL handler, slash `/link` | Two adjacent toolbar buttons. `toolbar-url` is “format selection as link”; `toolbar-link` is the generic insert. Most people cannot tell them apart. |
| Highlight text | `toolbar-highlight` (`<mark>`) vs `toolbar-highlight-color` (palette) | Two highlight metaphors. One is enough on the primary bar; color belongs in a Format menu. |
| Headings | H1–H3 on the bar; H4–H6 only in overflow; slash H1–H3 | Three H buttons waste ~90px. Industry default is **one** Block Type select (MDXEditor `BlockTypeSelect`, Quarto Format menu, Toast UI heading dropdown). |
| Code | `toolbar-code` + `toolbar-inline-code`; overflow has language list in v2 only | Language picker never appears on the visible bar. Users get a bare fence. |
| TOC | `toc-button` toggles a **panel**; v2 insert is `[[toc]]` | Name collision: “Table of Contents” sounds like insert, does outline UI. |
| Word count | Status bar + overflow “Word Count” popover + `stats-button` | Three stats entry points. |
| New file / templates | Header `+`, explorer new file, `templates-button`, slash none | Templates are a document action, not formatting. |
| Theme / focus | Header theme, `focus-button`, `fullscreen-button` | View chrome split across header and toolbar. |
| Search | Header search, command palette `open-search` | Fine (different layers). Not a toolbar issue. |
| Callout vs quote | `toolbar-quote` and `callout-dropdown-btn` | Related but distinct; keep both, group them. |
| Date insert | Overflow date/time vs command palette `insert-date` | Duplicate insert paths; palette is the right home. |
| Mermaid | Overflow presets vs v2 single “Mermaid Diagram” | Overflow is actually richer. Primary bar has **zero** diagram entry. |

**Do not add more duplicate buttons.** Connect existing layers: one primary control, slash + palette as discovery, overflow for rare.

---

## Platform comparison

How modern products split **always visible / menu / type-to-run**:

| Product | Primary bar | Menus / overflow | Typed discovery | Markdown-special |
| --- | --- | --- | --- | --- |
| **Typora** | Optional, off by default; writing surface is the doc | Format + context menus; **contextual table toolbar** | “Open Quickly” for files | Math, Mermaid, GFM tasks, GitHub alerts, footnotes, YAML, TOC ([site](https://typora.io/), [reference](https://support.typora.io/Markdown-Reference/), [releases](https://typora.io/releases/stable)) |
| **Obsidian** | Minimal ribbon; not a Word clone | Right-click, Commander plugin for custom buttons | **Command palette** (Ctrl+P) + **slash commands** ([palette](https://obsidian.md/help/plugins/command-palette), [slash](https://obsidian.md/help/plugins/slash-commands), [Obsidian Rocks](https://obsidian.rocks/for-beginners-and-pros-alike-the-command-palette-in-obsidian/)) | Wikilinks, callouts, embeds; power users almost never hunt a 35-icon bar |
| **VS Code** | Almost no Markdown formatting ribbon | Preview, outline, extensions | Command palette; Copilot for alt text ([VS Code Markdown](https://code.visualstudio.com/Docs/languages/markdown)) | Keyboard-first; toolbar would feel wrong |
| **GitHub.com** | Comment box: compact B / I / quote / code / link / list / task / mention / image | Nothing like Markups’ mode cluster | None in the comment box | GFM + alerts + mermaid + math + footnotes on **render**, not on a fat bar ([GFM](https://github.github.com/gfm/), [2026 guide](https://macmdviewer.com/blog/github-markdown-guide), [CommonMark vs GFM](https://formatarc.com/en/blog/commonmark-vs-gfm/)) |
| **Quarto visual editor** | Frequent format buttons | **Format / Insert / Table menus** for the long tail | Cite-as-you-type `@` | Citations, cross-refs, footnotes, math, code cells — academic default ([visual editor](https://quarto.org/docs/visual-editor/), [technical writing](https://quarto.org/docs/visual-editor/technical.html)) |
| **MDXEditor** | Composed groups: UndoRedo, BoldItalicUnderline, Lists, Insert* | `ButtonOrDropdownButton`, `ConditionalContents` for code | App-dependent | Admonitions, frontmatter, tables as plugins ([toolbar docs](https://mdxeditor.dev/editor/docs/customizing-toolbar)) |
| **TOAST UI Editor** | Grouped `toolbarItems`; insert/remove by index | Overflow + WYSIWYG/Markdown toggle | — | Charts/UML extensions; toolbar is explicitly grouped ([toolbar.md](https://github.com/nhn/tui.editor/blob/master/docs/en/toolbar.md)) |
| **Word / Google Docs** | Frequency-ordered ribbon; overflow chevron | Format menus | Occasional search | Not Markdown, but the **IA**: Home = format, Insert = objects, View = chrome |

**Pattern that wins in 2026 Markdown UIs**

1. **Very small always-on format cluster** (undo, B/I, heading select, list, link, more).
2. **One Insert menu** for objects (table, image, video, math, mermaid, footnote, callout).
3. **Typed insert** (`/` ) for the same objects — Obsidian/Notion muscle memory.
4. **Command palette** for app commands (focus, export, theme) — not mixed into Bold’s row.
5. **Contextual mini-bars** for table / code / image when the caret is inside that block (Typora, MDXEditor).

Markups today is closest to a **2014 blog CMS toolbar**: every feature gets an icon. That is the opposite of Typora (hide chrome) and Obsidian (search commands).

---

## Missing markdown tools

Parser-capable or user-expected, weak or absent on the **primary** bar. Split by audience.

### GitHub / docs / README (highest demand)

Already rendered or partially inserted:

| Need | In parser? | On primary bar? | Better home |
| --- | --- | --- | --- |
| GFM table | Yes | Yes (`toolbar-table`) | Keep, maybe contextual table tools later |
| Task list | Yes | Yes | Keep |
| Strikethrough | Yes | Yes | Keep |
| Alerts / callouts | Yes | Yes | Keep in Insert or next to quote |
| Footnotes `[^1]` | Yes (`marked-footnote`) | Overflow only | Insert menu + `/footnote` |
| Mermaid | Yes | Overflow only | Insert → Diagram |
| Math (KaTeX) | Yes | Overflow only | Insert → Math |
| Autolink bare URL | Paste handler yes | `toolbar-url` confusing | Merge into Link |
| Emoji shortcodes `:smile:` | Preview emoji ext. | Emoji picker | Keep picker; add `/emoji` |
| Collapsible `<details>` | HTML | Overflow | Insert → More |
| Language on code fence | Highlight yes | No on visible bar | Code dropdown (v2 already has this) |

Still missing for GitHub-ish docs:

- **YAML frontmatter** (`---` title/description) — MDXEditor has `InsertFrontmatter`; docs sites and Quarto need it.
- **Relative vs pasted image** workflow is OK; **alt-text prompt** after insert is not (VS Code Copilot now now this).
- **Copy as GitHub-flavored Markdown** / “will this render on GitHub?” lint — `lint-button` is spelling-oriented, not flavor-oriented.

### Research papers / technical writing (Quarto / Pandoc users)

| Need | Today | Recommendation |
| --- | --- | --- |
| Citations `[@key]` + bibliography | No | Insert → Citation (even a stub `[@citekey]`) if academic is in scope |
| Cross-references to figures/tables | No | Only if Document Mode grows captions |
| Footnote **editing pane** | Insert dump only | Quarto edits footnotes in a sub-pane ([technical writing](https://quarto.org/docs/visual-editor/technical.html)) |
| Math preview while typing | KaTeX in preview pane | Enough if split view is obvious; optional inline preview |
| Definition lists | Overflow insert | Keep in More |
| Line numbers / code-fold comments | No | Out of scope unless exporting to Quarto |

Do **not** turn Markups into Zotero. A citation *snippet* plus documentation is enough unless you explicitly want academic as a persona.

### Notes / second brain (Obsidian-like)

| Need | Today | Recommendation |
| --- | --- | --- |
| Wikilinks `[[Note]]` | Weak / not first-class | Only if wiki/backlinks are a product bet (`src/features/backlinks` exists) |
| Embed other notes | No | Later |
| Tags | No | Status bar / frontmatter, not toolbar |

### What not to put on the primary bar

Lorem ipsum, URL encode, unix timestamp, sort lines, unique lines. Those are **command palette** or **Transform** submenu items. They train users that the bar is a junk drawer.

---

## Recommended information architecture

Three layers, one job each. This is the strategy to present interconnected tools without extra clicks for the common path.

```text
Layer A — always visible (≈ 10–12 controls)
  History: Undo Redo
  Format:  Bold Italic [more format ▾]
  Block:   Heading ▾   Lists ▾
  Insert:  Link   Insert ▾
  Extra:   More ▾     (overflow; same catalog as today)

Layer B — menus (one extra click, grouped)
  Heading ▾     H1–H6 + paragraph
  Lists ▾       bullet / numbered / task
  Insert ▾      Table, Image, Video, Callout, Code, Math, Diagram, Footnote, HR, Emoji
  Format more ▾ Strike, highlight, quote, special chars, color (advanced)
  View ▾        TOC panel, scroll sync, focus, typewriter, fullscreen
                (or move these to header / status / palette)

Layer C — typed, zero toolbar
  /           same Insert catalog (expand slash registry)
  Ctrl+K      command palette for app + insert
  Right-click selection: Bold / Link / Comment
```

**Priority order (left is highest frequency for Markdown authors)**

1. Undo / Redo  
2. Bold / Italic  
3. Heading  
4. List  
5. Link  
6. Insert (table, image, code — inside menu)  
7. More  

**Move off the formatting bar**

- `explorer-toggle-btn` → already have explorer; keep a folder control in the explorer chrome, not beside Bold.
- `focus-button`, `typewriter-button`, `fullscreen-button`, `scroll-sync-button` → View menu, status bar, or palette (Obsidian model).
- `stats-button`, `goals-button`, `templates-button` → palette + header/status. Templates are “new document”, closer to the file `+` than to Italic.
- `ai-writer-button` → keep visible **or** header; it is a product differentiator, but it is not formatting. One dedicated AI entry is enough.
- `lint-button` → status bar indicator (errors) + palette. A checkmark icon does not mean “spellcheck”.

**Connect flows (fewer clicks)**

| Flow | Today | After |
| --- | --- | --- |
| Insert diagram | Hunt overflow → Diagrams | Insert ▾ → Diagram, or `/mermaid` |
| Insert equation | Overflow | Insert ▾ → Math, or `/$` |
| Insert footnote | Overflow | Insert ▾ or `/fn` |
| Change heading | Click H1 or H2 or H3 | Heading ▾ or `/h2` |
| Link a URL | Guess Link vs URL button | One Link control; paste URL still auto-formats |
| Toggle outline | `toc-button` | View ▾ Outline, or a pin on the left of the editor (not in format group) |

**Responsive**

Reuse the header lesson: **collapse by priority**, do not shrink icons until they wrap.

- Wide: Layer A + AI + maybe TOC toggle.  
- Laptop: Layer A only; View and extras in More.  
- Phone: Keep current Write/Preview header; formatting row = Bold, Heading, List, Link, More. Overflow sheet already has the long tail — **teach More**, don’t hide Diagrams behind a 16px meatball with no label.

---

## Do and do not

**Do**

- Treat the toolbar as **Markdown insert + inline format**, not as a second app menu.
- Group by task, separators between groups, frequency first ([Microsoft toolbars](https://learn.microsoft.com/en-us/windows/win32/uxguide/cmd-toolbars), [UX Patterns toolbar](https://uxpatternsguide.com/patterns/toolbar/)).
- Put one control on screen when three surfaces already do the job (slash, palette, button).
- Match the parser: if KaTeX and Mermaid ship in preview, they must be discoverable in Insert + `/`.
- Use **menu buttons** for Insert / Heading / Lists instead of five sibling icons ([toolbar vs menu vs palette](https://uxpatternsguide.com/compare/toolbar-vs-button-group-vs-menu-button-vs-command-palette/)).
- Show **pressed/disabled** state (bold on when selection is bold). MDXEditor toggles do this; Markups mostly does not.
- Fix dead controls before adding new ones (`toolbar-hr`).
- Keep video; it is rare in competitors and useful.
- Label overflow “Insert more” or “More markdown”, not a silent ⋮ ([NN/g overflow scent](https://www.nngroup.com/articles/contextual-menus-guidelines/)).
- Expand slash commands to the Insert catalog so keyboard users never need the bar.

**Do not**

- Do not add another primary icon for a command that already lives in overflow + v2 + slash.
- Do not put Lorem, URL-encode, or unix time on Layer A.
- Do not HTML-color the default GitHub-doc path without marking it “HTML / Markups-only”.
- Do not keep explorer, templates, and fullscreen in the same visual group as Bold.
- Do not render two toolbar implementations (`#toolbar` vs `#enhanced-toolbar`) with different catalogs. Pick one source of truth, then theme it.
- Do not grow Hick’s-law cost by celebrating “we have 40 tools.” Discovery ≠ visibility.
- Do not hide Mermaid/math only on mobile overflow while desktop users never see them.
- Do not copy Word’s full ribbon. Markdown users chose Markdown to *avoid* that.

---

## Suggested additions

Phased so review can approve a slice. **Implemented on `#toolbar` in 2026-09-08** except P3 contextual bars / GitHub linter (those stay out of the format row; linter is owned by a parallel production pass).

### P0 — correctness (do first)

1. Bind `toolbar-hr` or remove the button. **Done** (`chrome.js`).
2. Decide single source of truth: static `#toolbar` **or** `ToolbarManager.render()`. Production stays on static `#toolbar`; v2 remains on hidden `#enhanced-toolbar`.
3. Rename `lint-button` tooltip to match behavior (lint vs spelling). **Done** (“Check document”); control lives in More → View.
4. Merge `toolbar-link` and `toolbar-url` into one Link control (smart: selection URL → format; else insert dialog). **Done** (`smart-link.js`). URL host kept for existing listeners.

### P1 — organize the existing bar (no new features)

1. Heading dropdown (H1–H6). **Done**
2. Lists stay as a 3-icon group (high frequency).
3. Insert menu: Table, Image, Video, Code, Callout, Quote, HR, Emoji, plus extras. **Done**
4. Move Focus / Typewriter / Fullscreen / Scroll sync / Stats / Goals / Templates off the format row. **Done** (host bin + More → View). Explorer stays as the files affordance on the left.
5. Desktop More menu that is the **same catalog** as mobile overflow. **Done** (overflow button always labeled More).
6. Align slash registry with Insert menu 1:1. **Done** via `catalog.js` → `EXTRA_SLASH_COMMANDS`.

### P2 — Markdown extras users actually look for (parser already there)

1. **Math** (inline + block) on Insert + `/math`. **Done**
2. **Mermaid** submenu (reuse `DIAGRAM_PRESETS`). **Done**
3. **Footnote** on Insert + `/footnote`. **Done**
4. **Code language** dropdown stays in More / v2 (not a primary icon).
5. Optional **frontmatter** snippet. **Done**
6. Optional **citation stub** `[@citekey]`. **Done** (light, not Zotero).

### P3 — modern feel (more design, still not 40 icons)

1. Contextual table toolbar (add row/column, align) like Typora. **Deferred** (needs caret-in-table detection).
2. Contextual code toolbar (language, copy). **Deferred**
3. Selection bubble on desktop (Bold/Italic/Link). **Deferred** (would fight Monaco selection UX).
4. Bold/italic **toggle state**. **Done** (adjacent `**` / `*` / `~~` markers).
5. “GitHub preview warnings” in linter. **Not this pass** (parallel production work owns linter).

### Ideas worth a product yes/no (not automatic)

- Wikilinks in the Insert menu (only if backlinks stay a real feature).  
- Zotero / DOI lookup (Quarto-class; heavy).  
- Emoji shortcode autocomplete `:fire` (GitHub muscle memory).  
- Customizable bar (v2 `toolbar-settings` / hidden buttons) — power users only; default must still be small.

---

## Review questions

Answer these before any code pass:

1. Is the primary customer **GitHub/docs**, **notes**, or **academic papers**? That picks P2 citations vs mermaid vs wikilinks.  
2. Should View controls (focus, fullscreen, TOC) live in the **header**, **status bar**, or a **View menu**?  
3. Keep AI on the toolbar or move it beside Export in the header?  
4. One rendered toolbar (`ToolbarManager`) or keep the static HTML bar?

---

## Sources

Live pages used for this note (unique https URLs):

- https://uxpatternsguide.com/patterns/toolbar/
- https://uxpatternsguide.com/compare/toolbar-vs-button-group-vs-menu-button-vs-command-palette/
- https://learn.microsoft.com/en-us/windows/win32/uxguide/cmd-toolbars
- https://www.nngroup.com/videos/hicks-law-long-menus/
- https://www.nngroup.com/articles/contextual-menus-guidelines/
- https://typora.io/
- https://support.typora.io/Markdown-Reference/
- https://typora.io/releases/stable
- https://obsidian.md/help/plugins/command-palette
- https://obsidian.md/help/plugins/slash-commands
- https://obsidian.rocks/for-beginners-and-pros-alike-the-command-palette-in-obsidian/
- https://github.github.com/gfm/
- https://macmdviewer.com/blog/github-markdown-guide
- https://formatarc.com/en/blog/commonmark-vs-gfm/
- https://mdxeditor.dev/editor/docs/customizing-toolbar
- https://quarto.org/docs/visual-editor/
- https://quarto.org/docs/visual-editor/technical.html
- https://github.com/nhn/tui.editor/blob/master/docs/en/toolbar.md
- https://code.visualstudio.com/Docs/languages/markdown
- https://github.com/mundimark/awesome-markdown-editors
- https://danholloran.me/posts/obsidian-hotkeys-and-the-command-palette-a-keyboard-first-vault
- https://www.readmecodegen.com/blog/complete-markdown-editor-guide-2025
