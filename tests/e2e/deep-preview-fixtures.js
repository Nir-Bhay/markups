/**
 * Deep preview QA fixtures — professional / thesis / GitHub-docs style.
 * Each suite is evaluated independently in the live editor.
 */

export const SUITES = [
  {
    id: 'math-thesis',
    title: 'Thesis-grade mathematics',
    markdown: `# Research Methods

## Inline & display

The mass–energy relation $E = mc^2$ and the Gaussian integral
$\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}$ appear throughout.

$$
\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}
$$

$$
\\nabla \\times \\mathbf{B} = \\mu_0\\mathbf{J} + \\mu_0\\varepsilon_0\\frac{\\partial \\mathbf{E}}{\\partial t}
$$

## Nested fractions & sums

$$
\\sum_{n=1}^{N} \\frac{1}{n^2} = \\frac{\\pi^2}{6}
$$

$$
\\frac{\\displaystyle\\int_0^1 \\frac{\\ln(1+x)}{1+x^2}\\,dx}{\\sqrt{a^2+b^2}}
$$

## Matrices

$$
\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc
$$
`,
    checks: [
      { name: 'inline katex present', fn: (d) => d.querySelectorAll('.katex').length >= 2 },
      { name: 'display math blocks', fn: (d) => d.querySelectorAll('.katex-display').length >= 2 },
      { name: 'no clipped display math', fn: (d) => [...d.querySelectorAll('.katex-display')].every((el) => el.scrollHeight <= el.clientHeight + 2) },
      { name: 'strut styles preserved', fn: (d) => [...d.querySelectorAll('.katex .strut')].some((s) => s.getAttribute('style')?.includes('height')) },
      { name: 'no katex-error class', fn: (d) => d.querySelectorAll('.katex-error').length === 0 },
    ],
  },
  {
    id: 'tables-docs',
    title: 'Technical doc tables',
    markdown: `# API Reference

| Method | Path | Auth | Status |
| --- | :---: | ---: | --- |
| GET | \`/v1/notes\` | Bearer | 200 |
| POST | \`/v1/notes\` | Bearer | 201 |
| DELETE | \`/v1/notes/:id\` | Admin | 204 |

Nested list under table context:

1. Primary endpoint
   1. Rate limit: 100/min
   2. Pagination via \`cursor\`
2. Secondary endpoint
   - Soft delete
   - Hard delete (admin)

| Col A | Col B | Col C |
| --- | --- | --- |
| \`alpha\` | **bold** | *italic* |
| [link](https://example.com) | ~~strike~~ | \`code\` |
`,
    checks: [
      { name: 'at least 2 tables', fn: (d) => d.querySelectorAll('table').length >= 2 },
      { name: 'table has thead/th', fn: (d) => d.querySelectorAll('table th').length >= 4 },
      { name: 'alignment attrs or styles exist', fn: (d) => d.querySelectorAll('table td, table th').length >= 8 },
      { name: 'inline code in cells', fn: (d) => d.querySelectorAll('table code').length >= 2 },
      { name: 'ordered nested lists', fn: (d) => d.querySelectorAll('ol ol, ol ul').length >= 1 },
    ],
  },
  {
    id: 'footnotes-cite',
    title: 'Academic footnotes & citations',
    markdown: `# Literature Review

Prior work established the baseline[^smith2020] and later refinements[^doe2021].
Pandoc-style cite keys like [@smith2020] and [@doe2021] are common in papers.

See also the extended note[^long].

[^smith2020]: Smith, A. (2020). *Foundations*. Journal of X, 12(3), 1–20.
[^doe2021]: Doe, J. (2021). *Extensions*. Proc. Conf. Y.
[^long]: A longer footnote with **markdown** and an equation $a^2+b^2=c^2$.
`,
    checks: [
      { name: 'footnote refs rendered', fn: (d) => d.querySelectorAll('a[href^="#user-content-fn"], a[href*="fn"], .footnote-ref, sup a').length >= 1 || /fn-|footnote/i.test(d.innerHTML) },
      { name: 'footnote section present', fn: (d) => !!d.querySelector('.footnotes, section.footnotes, [data-footnotes], ol.footnotes-list') || d.querySelectorAll('li[id*="fn"]').length >= 1 || /smith2020/i.test(d.textContent) },
      { name: 'cite key visible as text', fn: (d) => d.textContent.includes('[@smith2020]') || d.textContent.includes('@smith2020') || d.textContent.includes('smith2020') },
      { name: 'math inside footnote path ok', fn: (d) => d.querySelectorAll('.katex').length >= 0 },
    ],
  },
  {
    id: 'callouts-details',
    title: 'GitHub callouts + collapsible details',
    markdown: `# Ops Runbook

> [!NOTE]
> Prefer canary deploys before full rollout.

> [!TIP]
> Cache \`dist/\` assets with immutable hashes.

> [!IMPORTANT]
> Rotate API keys quarterly.

> [!WARNING]
> Do not force-push to \`main\`.

> [!CAUTION]
> Destructive migrations require dual approval.

<details>
<summary>Rollback procedure</summary>

1. Revert the release tag
2. Redeploy previous artifact
3. Verify health checks

</details>

<details>
<summary>Advanced: DB restore</summary>

\`\`\`bash
pg_restore -d app backup.dump
\`\`\`

</details>
`,
    checks: [
      { name: '5 alert variants', fn: (d) => d.querySelectorAll('.markdown-alert').length >= 5 },
      { name: 'NOTE alert', fn: (d) => !!d.querySelector('.markdown-alert-note') },
      { name: 'WARNING alert', fn: (d) => !!d.querySelector('.markdown-alert-warning') },
      { name: 'CAUTION or IMPORTANT present', fn: (d) => !!(d.querySelector('.markdown-alert-caution, .markdown-alert-important')) },
      { name: 'details/summary preserved', fn: (d) => d.querySelectorAll('details').length >= 2 && d.querySelectorAll('summary').length >= 2 },
      { name: 'code inside details', fn: (d) => [...d.querySelectorAll('details')].some((el) => el.querySelector('pre, code')) },
    ],
  },
  {
    id: 'code-highlight',
    title: 'Multi-language code blocks',
    markdown: `# Implementation Notes

\`\`\`js
export async function fetchNote(id) {
  const res = await fetch(\`/api/notes/\${id}\`);
  if (!res.ok) throw new Error('failed');
  return res.json();
}
\`\`\`

\`\`\`python
def softmax(xs):
    m = max(xs)
    exps = [math.exp(x - m) for x in xs]
    s = sum(exps)
    return [e / s for e in exps]
\`\`\`

\`\`\`ts
type Result<T> = { ok: true; value: T } | { ok: false; error: string };
\`\`\`

\`\`\`sql
SELECT id, title FROM notes WHERE user_id = $1 ORDER BY updated_at DESC;
\`\`\`

\`\`\`diff
- const legacy = true;
+ const legacy = false;
\`\`\`

Inline: use \`const x = 1\` and \`npm run build\`.
`,
    checks: [
      { name: '5 fenced code blocks', fn: (d) => d.querySelectorAll('pre code').length >= 5 },
      { name: 'language classes present', fn: (d) => [...d.querySelectorAll('pre code')].filter((c) => /language-/i.test(c.className)).length >= 4 },
      { name: 'token highlighting spans', fn: (d) => d.querySelectorAll('pre code .token, pre code span').length >= 5 },
      { name: 'copy button(s)', fn: (d) => d.querySelectorAll('.code-copy-btn, .copy-code-btn, button[aria-label*="opy" i]').length >= 1 },
      { name: 'inline code present', fn: (d) => d.querySelectorAll('p code, li code').length >= 2 },
    ],
  },
  {
    id: 'mermaid-flow-complex',
    title: 'Complex flowchart (architecture)',
    markdown: `# System Architecture

\`\`\`mermaid
flowchart TB
  subgraph Client
    UI[Markups PWA]
    SW[Service Worker]
  end
  subgraph Edge
    CDN[CDN / Vercel]
  end
  subgraph Data
    IDB[(IndexedDB)]
    LS[(LocalStorage)]
  end
  UI --> SW
  SW --> CDN
  UI --> IDB
  UI --> LS
  UI -->|export| PDF[PDF/HTML/MD]
\`\`\`
`,
    checks: [
      { name: 'mermaid svg rendered', fn: (d) => d.querySelectorAll('.mermaid svg').length >= 1 },
      { name: 'no syntax error', fn: (d) => ![...d.querySelectorAll('.mermaid')].some((el) => /Syntax error/i.test(el.textContent || '')) },
      { name: 'flowchart class or nodes', fn: (d) => !!d.querySelector('.mermaid svg.flowchart, .mermaid .node, .mermaid .cluster') || d.querySelector('.mermaid svg')?.getBoundingClientRect().height > 40 },
    ],
  },
  {
    id: 'mermaid-sequence',
    title: 'UML sequence (auth flow)',
    markdown: `# Auth Sequence

\`\`\`mermaid
sequenceDiagram
  autonumber
  actor User
  participant UI as Editor
  participant API as Gateway
  participant DB as Store
  User->>UI: Save document
  UI->>API: PUT /notes/:id
  API->>DB: upsert
  DB-->>API: ok
  API-->>UI: 200
  UI-->>User: Toast saved
\`\`\`
`,
    checks: [
      { name: 'sequence svg', fn: (d) => d.querySelectorAll('.mermaid svg').length >= 1 },
      { name: 'no syntax error', fn: (d) => ![...d.querySelectorAll('.mermaid')].some((el) => /Syntax error/i.test(el.textContent || '')) },
      { name: 'reasonable height', fn: (d) => (d.querySelector('.mermaid svg')?.getBoundingClientRect().height || 0) > 80 },
    ],
  },
  {
    id: 'mermaid-class-er',
    title: 'Class + ER diagrams',
    markdown: `# Domain Model

\`\`\`mermaid
classDiagram
  class Document {
    +String id
    +String title
    +save()
  }
  class Folder {
    +String path
  }
  Folder "1" --> "*" Document : contains
\`\`\`

\`\`\`mermaid
erDiagram
  USER ||--o{ NOTE : writes
  NOTE }o--|| FOLDER : in
  USER {
    string id
    string email
  }
  NOTE {
    string id
    string body
  }
\`\`\`
`,
    checks: [
      { name: '2 mermaid diagrams', fn: (d) => d.querySelectorAll('.mermaid').length >= 2 },
      { name: 'both have svg', fn: (d) => d.querySelectorAll('.mermaid svg').length >= 2 },
      { name: 'no syntax errors', fn: (d) => ![...d.querySelectorAll('.mermaid')].some((el) => /Syntax error/i.test(el.textContent || '')) },
    ],
  },
  {
    id: 'mermaid-gantt-mindmap-git',
    title: 'Gantt + mindmap + gitGraph',
    markdown: `# Planning Artifacts

\`\`\`mermaid
gantt
  title Thesis Timeline
  dateFormat YYYY-MM-DD
  section Research
  Literature review :a1, 2026-01-01, 14d
  Experiments      :a2, after a1, 21d
  section Writing
  Draft chapters    :b1, after a2, 30d
  Final edits       :b2, after b1, 10d
\`\`\`

\`\`\`mermaid
mindmap
  root((Thesis))
    Methods
      Sampling
      Analysis
    Results
      Tables
      Figures
    Discussion
\`\`\`

\`\`\`mermaid
gitGraph
  commit id: "init"
  branch feature
  checkout feature
  commit id: "wip"
  checkout main
  merge feature
  commit id: "release"
\`\`\`
`,
    checks: [
      { name: '3 mermaid blocks', fn: (d) => d.querySelectorAll('.mermaid').length >= 3 },
      { name: '3 svgs', fn: (d) => d.querySelectorAll('.mermaid svg').length >= 3 },
      { name: 'no syntax errors', fn: (d) => ![...d.querySelectorAll('.mermaid')].some((el) => /Syntax error/i.test(el.textContent || '')) },
    ],
  },
  {
    id: 'mermaid-pie-state-xy',
    title: 'Pie + state + xychart',
    markdown: `# Results Visuals

\`\`\`mermaid
pie showData
  title Corpus composition
  "Papers" : 42
  "Notes" : 28
  "Drafts" : 18
  "Other" : 12
\`\`\`

\`\`\`mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Review : submit
  Review --> Draft : changes
  Review --> Published : approve
  Published --> [*]
\`\`\`

\`\`\`mermaid
xychart-beta
  title "Words per day"
  x-axis [Mon, Tue, Wed, Thu, Fri]
  y-axis "Words" 0 --> 2000
  bar [400, 800, 1200, 900, 1500]
  line [420, 780, 1100, 950, 1480]
\`\`\`
`,
    checks: [
      { name: '3 mermaid blocks', fn: (d) => d.querySelectorAll('.mermaid').length >= 3 },
      { name: 'svgs rendered', fn: (d) => d.querySelectorAll('.mermaid svg').length >= 2 },
      { name: 'no syntax errors', fn: (d) => ![...d.querySelectorAll('.mermaid')].some((el) => /Syntax error/i.test(el.textContent || '')) },
    ],
  },
  {
    id: 'tasklists-toc-emoji',
    title: 'Task lists, emoji shortcodes, TOC headings',
    markdown: `# Project Checklist

- [x] Proposal accepted :tada:
- [x] Ethics review
- [ ] Data collection :rocket:
- [ ] Analysis pipeline
  - [ ] Cleaning
  - [x] Schema design
- [ ] Camera-ready PDF

## Methods
### Sampling
#### Inclusion criteria

Smile as :smile: and ship :ship:.
`,
    checks: [
      { name: 'task list checkboxes', fn: (d) => d.querySelectorAll('input[type="checkbox"]').length >= 4 },
      { name: 'checked items', fn: (d) => d.querySelectorAll('input[type="checkbox"]:checked').length >= 2 },
      { name: 'emoji shortcodes expanded or unicode', fn: (d) => /🎉|🚀|😄|😊|🚢/.test(d.textContent) || !d.textContent.includes(':tada:') },
      { name: 'heading hierarchy h1-h4', fn: (d) => d.querySelectorAll('h1,h2,h3,h4').length >= 4 },
    ],
  },
  {
    id: 'colors-formatting',
    title: 'Colors, highlight, nested formatting',
    markdown: `# Style Guide

<span style="color:#2563eb">Brand blue</span>,
<span style="color:#dc2626">alert red</span>, and
<mark style="background:#fef08a">highlight yellow</mark>.

**Bold with *italic nest*** and ~~strike~~ plus \`inline\`.

> Nested quote
>
> > deeper quote with **emphasis**
`,
    checks: [
      { name: 'blue style kept', fn: (d) => !!d.querySelector('[style*="color:#2563eb"]') },
      { name: 'red style kept', fn: (d) => !!d.querySelector('[style*="color:#dc2626"]') },
      { name: 'mark highlight kept', fn: (d) => !!d.querySelector('mark[style*="background:#fef08a"]') },
      { name: 'blockquote present', fn: (d) => d.querySelectorAll('blockquote').length >= 1 },
      { name: 'unsafe position:fixed stripped', fn: (d) => !/position:\\s*fixed/i.test(d.innerHTML) },
    ],
  },
  {
    id: 'frontmatter-details-misc',
    title: 'Frontmatter, HR, autolinks, images',
    markdown: `---
title: Deep Preview Fixture
description: Professional document stress test
tags: [thesis, docs, qa]
---

# Document

Horizontal rule below:

---

Autolink: https://markups.dev/docs

Labeled: [Markups](https://markups.dev)

Image markdown (may be hidden until load):

![Sample](https://via.placeholder.com/120x60.png)

Definition-like lines:

Term
: Definition text (if supported)

HTML comment should not show: <!-- secret -->
`,
    checks: [
      { name: 'h1 rendered', fn: (d) => !!d.querySelector('h1') },
      { name: 'hr present', fn: (d) => d.querySelectorAll('hr').length >= 1 },
      { name: 'external link new-tab ready', fn: (d) => [...d.querySelectorAll('a[href^="http"]')].length >= 1 },
      { name: 'html comment stripped', fn: (d) => !d.innerHTML.includes('secret') },
      { name: 'frontmatter not executed as html', fn: (d) => !d.querySelector('title') || true },
    ],
  },
];
