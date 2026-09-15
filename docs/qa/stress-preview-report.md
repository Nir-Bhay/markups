# Stress Preview Visual QA Report

Generated: 2026-09-15T07:42:00.000Z  
Source: `markups-markdown-preview-stress-test.md` (~42KB, 42 sections)  
Method: Playwright DOM audit + live Cursor Browser visual review (Split view)

---

## Executive verdict

The stress document mostly renders well for typography, tables, alerts, math, images, and most Mermaid types. **Three product-level issues need attention before calling media + Document Mode “delivery ready”:**

1. **CRITICAL — Welcome auto-clear wipe:** After programmatic `setValue` / paste-over-welcome, first real edit can replace the entire document with only the typed characters (`src/main.js` ~1050–1065).
2. **CRITICAL — Document Mode destroys Mermaid:** One Document Mode edit + sync ballooned markdown ~42KB → ~162KB; ` ```mermaid ` fences became raw SVG/CSS lines (~20KB each). Images mostly kept (picsum 13→11), no `data:` poison.
3. ~~**MAJOR — Mermaid `requirementDiagram`:**~~ **FIXED (test fixture):** Unquoted IDs like `REQ-001` break Mermaid 11.17.2 (`Expecting 'NEWLINE', got 'LINE'`). Stress doc now uses `id: "REQ-001"` / quoted `text:` / `docRef`. Verified live — diagram renders (REQ-001/002 + satisfies/contains).

Everything below is point-by-point from the actual stress file.

---

## Severity summary

| Severity | Count | Areas |
|----------|------:|-------|
| Critical | 2 | Welcome wipe; Document Mode Mermaid serialization |
| Major | 2 | raw `<video>` not embeddable; audio `<source>` stripped |
| Minor | 3 | Matrix bracket visual; broken/empty img `#9` (0×0 → `/`); scroll desync after programmatic jump |
| Pass / OK | many | Listed per section (incl. requirementDiagram after fixture quote fix) |

---

## Point-by-point section review

### 1. Frontmatter / TOC
- YAML frontmatter shows as plain text (expected — no structured frontmatter UI).
- TOC links present; internal jump anchors exist for major headings.

### 2. Typography / headings H1–H6
- **PASS** — All 6 ATX levels render. Setext headings present.
- Spacing between heading → paragraph looks normal (no huge empty gaps in first 80 top-level blocks).

### 3. Emphasis / inline code / escaping
- **PASS** — bold, italic, bold-italic, strike, nested italic, `inline code`, HTML `<u>`, `<mark>`, `<kbd>`, `<sub>`, `<sup>`.
- Escaped punctuation survives.

### 4. Literal dollar signs
- **PASS** with nuance: `$100` not treated as math; escaped `\$` works. Nested backtick+math probe is visually odd but not broken.

### 5. Links
- **PASS** — inline, autolink `<url>`, mailto, reference links, bold/italic/code links.
- External links open-new-tab behavior applied by sanitizer.

### 6. Images
- **PASS (visual)** — picsum landscape/square/portrait load; rounded corners; width fits preview.
- **PASS (stability)** — After welcome flag cleared, append typing did **not** change image `src` or wipe media (Playwright: imgSrcChanged=0, doc kept ~42KB).
- **MINOR** — 1 broken image (0×0, `src` resolves to app origin `/`) — decorative/empty probe in accessibility section.
- **Loaded:** 11/12 remote images with `naturalWidth > 0`.

### 7. Blockquotes / nested quotes / code-in-quote
- **PASS** — nested `>` levels and fenced code inside quotes render.

### 8. Lists (ul/ol/nested/start-at-7)
- **PASS** — deep nesting and non-1 start number work.

### 9. Task lists
- **PASS** — many checkboxes (DOM count includes nested cases).

### 10. Tables (basic / align / rich / escaped pipe / wide)
- **PASS** — 15 tables. Wide stress table scrolls/layout survives. Alignment columns OK. `$1,999.99` in cell not broken by math.

### 11. GitHub-style alerts
- **PASS (visual + DOM)** — NOTE / TIP / IMPORTANT / WARNING / CAUTION all styled with correct colors; Split sync aligned for this section.

### 12. Collapsible `<details>`
- **PASS** — closed + `open` variants; markdown/table/code inside details work.

### 13. Footnotes
- **PASS** — refs + footnote section + backlinks; rich footnote (bold/link/code) OK.

### 14. Code blocks (js/ts/tsx/python/bash/json/yaml/html/css/sql/nested md)
- **PASS** — highlighting + copy controls present across languages. Diff block OK.

### 15. Math (inline + display + matrix + aligned + research loss)
- **PASS** — 9 display blocks, 0 `.katex-error`, no clip metric failures.
- **MINOR visual** — `bmatrix` grid numbers render; bracket chrome can look weak/missing vs classic LaTeX (worth a follow-up KaTeX/CSS check).
- Inline Greek / Bayes / summation look correct in Split view.

### 16–32. Mermaid family

| Diagram | Result |
|---------|--------|
| Flowcharts (basic / styled / decision) | PASS |
| Sequence | PASS |
| Class | PASS |
| State | PASS |
| ER | PASS |
| Gantt | PASS |
| Pie | PASS |
| Journey | PASS |
| Mindmap | PASS |
| Timeline | PASS |
| XY chart | PASS |
| Quadrant | PASS |
| Architecture (`architecture-beta`) | PASS — SVG ~576px tall, no syntax error |
| Git graph | PASS |
| **Requirement diagram** | **PASS** — fixed fixture (`id: "REQ-001"` etc.); renders REQ boxes + satisfies/contains |
| Edge probes (“end” labels / special edges) | Render as small flowcharts (~70px) — OK / limited |

~20 Mermaid SVGs in primary suite; requirement diagram OK after quoted-ID fixture fix.

### 33. Raw HTML
- Semantic `<p>/<strong>/<em>/<del>/<mark>`, `<kbd>`, HTML table, `<hr>`: mostly **PASS**.
- `align="center"` div: sanitized/predictable (may lose centering — acceptable security tradeoff).

### 34. Media (critical for your ask)
- Markdown + HTML images: **PASS**.
- `<picture>`: **preserved** in Media section (1 picture + fallback img).
- **Raw `<video>`: intentionally stripped** by `sanitize.js` (`FORBID_TAGS` includes `video`/`source`). Only URL-validated embeds via `video-embed.js` / Insert Video / bare MP4 URL path.
  - Fallback `[Open demo video](...flower.mp4)` link **does** remain.
- **Audio:** `<audio controls>` shell may remain but **`<source>` stripped** → empty player (broken UX for HTML audio in markdown).
- **Implication:** Stress doc’s HTML video probe will never show a player; this is security-by-design, but the doc expectation vs product behavior should be documented for users.

### 35. Colors / SVG probe
- **PASS** — red/green/blue/purple spans kept; background highlight badges kept; inline SVG probe present (many SVGs including Mermaid).

### 36–41. Research / README / tech docs / fixtures / edge cases / a11y
- Large prose sections render; edge Mermaid probes mostly OK.
- Emoji shortcodes / GitHub chips (`#123`, `@octocat`) styled as chips — OK for preview.

---

## Document Mode (live edit) — deep findings

| Check | Result |
|-------|--------|
| Toggle enables `contenteditable` | PASS |
| Images marked `contenteditable=false` | PASS |
| Edit paragraph syncs marker into MD | PASS (`DOCMODE_EDIT_*` appeared) |
| No `data:` / `blob:` image poison | PASS |
| Image URL survival | MOSTLY PASS (picsum 13→11) |
| Mermaid round-trip | **CRITICAL FAIL** — fences removed; SVG CSS dumped into markdown; size 42KB→162KB; longest line ~20KB starting `#mermaid-…@keyframes` |
| Write ↔ Preview ↔ Split after clean load | PASS (head/tail stable) |
| Same toggles after welcome-wipe bug | False failures earlier — wiped buffer |

**User flow risk:** Open welcome → paste/import large doc via paths that don’t clear `isShowingWelcome` → first keystroke **deletes the whole document**. Confirmed in Playwright; code path in `src/main.js` lines 1050–1065.

---

## Images / video flicker while typing

| Scenario | Result |
|----------|--------|
| Append text at end (after welcome cleared) | Image `src` stable; counts stable; Mermaid SVG count stable |
| Same append while welcome flag still true | **Whole doc replaced** by typed fragment — looks like “everything reloaded/vanished” |
| Mode switch Write/Preview/Split (clean) | Markdown head/tail stable; media counts stable |

So the “reload/flicker” report users may see is often the **welcome wipe**, not Mermaid/image re-fetch — once welcome is cleared, media stays put.

---

## Side-by-side alignment / sync

- **Alerts section:** Editor lines and preview callouts horizontally aligned — **PASS**.
- **Images / Math:** Good sync when scroll-sync follows user scroll.
- **After programmatic `scrollIntoView` on preview only:** Editor can lag (preview at Media, editor still on Details) — sync is directional; not a layout gap bug, but **scroll-sync can feel broken** on huge docs after jumps.
- No systematic double-line / overlapping text observed.
- Extra vertical gap only where oversized Mermaid diagrams sit (not an error-box gap anymore for requirement).

---

## What needs major improvement (priority)

1. **Welcome flag must clear on any successful content replace** (`setValue` of non-welcome, Import, tab restore) — prevent wipe.
2. **Document Mode serializer must keep fenced `mermaid` source**, never serialize rendered SVG/CSS back into markdown.
3. ~~**requirementDiagram**~~ — fixture fixed (quote hyphenated IDs / text for Mermaid 11.17.2).
4. **Media UX honesty** — if raw `<video>`/`<source>` are forbidden, preview should show a clear placeholder (“use Insert Video / bare URL”) instead of silent deletion; fix audio source stripping or document it.
5. **Matrix bracket chrome** — minor KaTeX/CSS polish.

## What is already solid

- GitHub alerts, tables, footnotes, details, multi-language code, most Mermaid types, KaTeX display math, remote images, color spans, architecture/pie/sequence/etc.
- Typing stability **after** welcome cleared.
- Mode toggles not corrupting markdown when doc is intact.
- Document Mode image protection (`contenteditable=false`, no data-URL poison).

---

## Artifacts

- JSON: `docs/qa/stress-preview-report.json`
- Screenshots dir: `docs/qa/stress-shots/` (viewport captures)
- Harness: `tests/e2e/stress-preview-visual.spec.js`
- Stress file served at: `/qa/markups-markdown-preview-stress-test.md` (from `public/qa/`)

### Latest automated summary (post welcome-clear fix)

- Sections present: **31/33** (architecture/requirement often SVG-only in text probes)
- Mermaid SVGs: **20+** primary; requirement diagram **PASS** after fixture quote fix
- Images loaded: **11/12**
- Videos in DOM: **0** (expected for raw HTML video)
- Stability / mode switch / Document Mode image refs: **PASS** in automated run
- Document Mode Mermaid inflation: confirmed **manually in browser** (not fully asserted in harness yet)

---

## Recommended next fixes (when you want implementation)

1. Clear `isShowingWelcome` inside wrapped `editor.setValue` when value ≠ welcome default.
2. In live-preview-edit serializer: detect `.mermaid` nodes and emit original fence from `data-` attribute / stored source, never `textContent` of SVG.
3. ~~Pin/test `requirementDiagram`~~ — done in stress fixture (`"REQ-001"` quotes).
4. For stripped `<video>`, emit a visible sanitized placeholder + keep the MP4 link.
