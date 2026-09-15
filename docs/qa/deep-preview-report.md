# Deep Preview QA Report

Generated: 2026-09-14T10:24:17.688Z

## Summary

- Suites: **13/13** passed
- Checks: **52/52** passed
- Failed suites: none

## Suite results

### PASS — Thesis-grade mathematics (`math-thesis`)

- PASS inline katex present
- PASS display math blocks
- PASS no clipped display math
- PASS strut styles preserved
- PASS no katex-error class
- PASS aligned or matrix content rendered

```json
{
  "katex": 6,
  "katexDisplay": 5,
  "katexStyles": 175,
  "mermaid": 0,
  "mermaidSvg": 0,
  "mermaidErrors": 0,
  "tables": 0,
  "alerts": 0,
  "details": 0,
  "codeBlocks": 0,
  "checkboxes": 0,
  "textSample": "\n            \n                Research Methods\n                \n                    \n                \n            \n        \n            \n                Inline & display\n          "
}
```

### PASS — Technical doc tables (`tables-docs`)

- PASS at least 2 tables
- PASS table has thead/th
- PASS cells present
- PASS inline code in cells
- PASS ordered nested lists

```json
{
  "katex": 0,
  "katexDisplay": 0,
  "katexStyles": 0,
  "mermaid": 0,
  "mermaidSvg": 0,
  "mermaidErrors": 0,
  "tables": 2,
  "alerts": 0,
  "details": 0,
  "codeBlocks": 0,
  "checkboxes": 0,
  "textSample": "\n            \n                API Reference\n                \n                    \n                \n            \n        \n\n\nMethod\nPath\nAuth\nStatus\n\n\n\nGET\n/v1/notes\nBearer\n200\n\n\nPOS"
}
```

### PASS — Academic footnotes & citations (`footnotes-cite`)

- PASS footnote refs rendered
- PASS footnote section present
- PASS cite key visible as text

```json
{
  "katex": 1,
  "katexDisplay": 0,
  "katexStyles": 16,
  "mermaid": 0,
  "mermaidSvg": 0,
  "mermaidErrors": 0,
  "tables": 0,
  "alerts": 0,
  "details": 0,
  "codeBlocks": 0,
  "checkboxes": 0,
  "textSample": "\n            \n                Literature Review\n                \n                    \n                \n            \n        Prior work established the baseline1 and later refinemen"
}
```

### PASS — GitHub callouts + collapsible details (`callouts-details`)

- PASS 5 alert variants
- PASS NOTE alert
- PASS WARNING alert
- PASS CAUTION or IMPORTANT
- PASS details/summary
- PASS code inside details

```json
{
  "katex": 0,
  "katexDisplay": 0,
  "katexStyles": 0,
  "mermaid": 0,
  "mermaidSvg": 0,
  "mermaidErrors": 0,
  "tables": 0,
  "alerts": 5,
  "details": 2,
  "codeBlocks": 1,
  "checkboxes": 0,
  "textSample": "\n            \n                Ops Runbook\n                \n                    \n                \n            \n        \nNote\nPrefer canary deploys before full rollout.\n\n\nTip\nCache d"
}
```

### PASS — Multi-language code blocks (`code-highlight`)

- PASS 5 fenced code blocks
- PASS language classes
- PASS token highlighting
- PASS copy button(s)
- PASS inline code

```json
{
  "katex": 0,
  "katexDisplay": 0,
  "katexStyles": 0,
  "mermaid": 0,
  "mermaidSvg": 0,
  "mermaidErrors": 0,
  "tables": 0,
  "alerts": 0,
  "details": 0,
  "codeBlocks": 5,
  "checkboxes": 0,
  "textSample": "\n            \n                Implementation Notes\n                \n                    \n                \n            \n        jsCopyexport async function fetchNote(id) {\n  const r"
}
```

### PASS — Complex flowchart (architecture) (`mermaid-flow-complex`)

- PASS mermaid svg
- PASS no syntax error
- PASS height ok

```json
{
  "katex": 0,
  "katexDisplay": 0,
  "katexStyles": 0,
  "mermaid": 1,
  "mermaidSvg": 1,
  "mermaidErrors": 0,
  "tables": 0,
  "alerts": 0,
  "details": 0,
  "codeBlocks": 0,
  "checkboxes": 0,
  "textSample": "\n            \n                System Architecture\n                \n                    \n                \n            \n        #mermaid-1789381464934{font-family:\"trebuchet ms\",verd"
}
```

### PASS — UML sequence (auth flow) (`mermaid-sequence`)

- PASS sequence svg
- PASS no syntax error
- PASS height ok

```json
{
  "katex": 0,
  "katexDisplay": 0,
  "katexStyles": 0,
  "mermaid": 1,
  "mermaidSvg": 1,
  "mermaidErrors": 0,
  "tables": 0,
  "alerts": 0,
  "details": 0,
  "codeBlocks": 0,
  "checkboxes": 0,
  "textSample": "\n            \n                Auth Sequence\n                \n                    \n                \n            \n        StoreGatewayEditorStoreGatewayEditor#mermaid-1789381468335{f"
}
```

### PASS — Class + ER diagrams (`mermaid-class-er`)

- PASS 2 mermaid diagrams
- PASS both have svg
- PASS no syntax errors

```json
{
  "katex": 0,
  "katexDisplay": 0,
  "katexStyles": 0,
  "mermaid": 2,
  "mermaidSvg": 2,
  "mermaidErrors": 0,
  "tables": 0,
  "alerts": 0,
  "details": 0,
  "codeBlocks": 0,
  "checkboxes": 0,
  "textSample": "\n            \n                Domain Model\n                \n                    \n                \n            \n        #mermaid-1789381471821{font-family:\"trebuchet ms\",verdana,ari"
}
```

### PASS — Gantt + mindmap + gitGraph (`mermaid-gantt-mindmap-git`)

- PASS 3 mermaid blocks
- PASS 3 svgs
- PASS no syntax errors

```json
{
  "katex": 0,
  "katexDisplay": 0,
  "katexStyles": 0,
  "mermaid": 3,
  "mermaidSvg": 3,
  "mermaidErrors": 0,
  "tables": 0,
  "alerts": 0,
  "details": 0,
  "codeBlocks": 0,
  "checkboxes": 0,
  "textSample": "\n            \n                Planning Artifacts\n                \n                    \n                \n            \n        #mermaid-1789381475340{font-family:\"trebuchet ms\",verda"
}
```

### PASS — Pie + state + xychart (`mermaid-pie-state-xy`)

- PASS 3 mermaid blocks
- PASS svgs rendered
- PASS no syntax errors

```json
{
  "katex": 0,
  "katexDisplay": 0,
  "katexStyles": 0,
  "mermaid": 3,
  "mermaidSvg": 3,
  "mermaidErrors": 0,
  "tables": 0,
  "alerts": 0,
  "details": 0,
  "codeBlocks": 0,
  "checkboxes": 0,
  "textSample": "\n            \n                Results Visuals\n                \n                    \n                \n            \n        #mermaid-1789381478698{font-family:\"trebuchet ms\",verdana,"
}
```

### PASS — Task lists, emoji shortcodes, TOC headings (`tasklists-toc-emoji`)

- PASS task checkboxes
- PASS checked items
- PASS emoji expanded
- PASS heading hierarchy

```json
{
  "katex": 0,
  "katexDisplay": 0,
  "katexStyles": 0,
  "mermaid": 0,
  "mermaidSvg": 0,
  "mermaidErrors": 0,
  "tables": 0,
  "alerts": 0,
  "details": 0,
  "codeBlocks": 0,
  "checkboxes": 7,
  "textSample": "\n            \n                Project Checklist\n                \n                    \n                \n            \n        \n Proposal accepted 🎉\n Ethics review\n Data collection \ud83d"
}
```

### PASS — Colors, highlight, nested formatting (`colors-formatting`)

- PASS blue style
- PASS red style
- PASS mark highlight
- PASS blockquote

```json
{
  "katex": 0,
  "katexDisplay": 0,
  "katexStyles": 0,
  "mermaid": 0,
  "mermaidSvg": 0,
  "mermaidErrors": 0,
  "tables": 0,
  "alerts": 0,
  "details": 0,
  "codeBlocks": 0,
  "checkboxes": 0,
  "textSample": "\n            \n                Style Guide\n                \n                    \n                \n            \n        Brand blue,\nalert red, and\nhighlight yellow.\nBold with italic "
}
```

### PASS — Frontmatter, HR, autolinks, images (`frontmatter-details-misc`)

- PASS h1 rendered
- PASS hr present
- PASS external link
- PASS html comment stripped

```json
{
  "katex": 0,
  "katexDisplay": 0,
  "katexStyles": 0,
  "mermaid": 0,
  "mermaidSvg": 0,
  "mermaidErrors": 0,
  "tables": 0,
  "alerts": 0,
  "details": 0,
  "codeBlocks": 0,
  "checkboxes": 0,
  "textSample": "\n\n            \n                title: Deep Preview Fixture\ndescription: Professional document stress test\ntags: [thesis, docs, qa]\n                \n                    \n           "
}
```

## Gaps & observations (professional markdown focus)

These are not suite failures — they are product-behavior notes for thesis / GitHub-docs style writing:

1. **Pandoc cite keys** ([@smith2020]) — inserted by toolbar, shown as plain text (no bibliography panel / CSL formatting).
2. **YAML frontmatter** — kept as document text (or lightly treated); not a structured metadata UI.
3. **Definition lists** (Term / : Definition) — classic Markdown extension; not asserted as supported in Markups GFM path.
4. **Footnotes** — work (refs + footer list). Math inside footnote definitions renders.
5. **Mermaid** — complex variants verified: flowchart (subgraphs), sequence (actors/autonumber), class, ER, gantt, mindmap, gitGraph, pie, state, xychart-beta.
6. **KaTeX** — thesis-style multi-block math (Maxwell-style, nested fractions, matrices) renders with strut styles preserved after sanitizer fix.
7. **Callouts** — all GitHub alert types used in suite (NOTE/TIP/IMPORTANT/WARNING/CAUTION) + HTML `details`/`summary`.
8. **Code** — JS/Python/TS/SQL/diff highlighting + copy buttons.

### How to re-run

`ash
npx playwright test tests/e2e/deep-preview.spec.js --reporter=list
`

Reports:
- `docs/qa/deep-preview-report.md`
- `docs/qa/deep-preview-report.json`
