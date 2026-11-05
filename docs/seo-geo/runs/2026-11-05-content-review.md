# Editorial improvement — CommonMark vs GFM

**Date:** 2026-11-05
**Base:** `origin/main` at `3b34ea1b33e7385f3d2772d60b19c2b8c499d6c7`
**Branch:** `Nir-Bhay/seo-editorial-examples-2026-11-05`
**Scope:** `blog/commonmark-vs-gfm-markdown/index.html`

## Finding and change

The previous two-minute article repeated generic preview-and-check advice and had one mixed example. Updated it to directly answer why Markdown can render differently across destinations. It now:

- compares CommonMark core syntax with GFM extensions in an HTML table;
- separates a core Markdown example from a GFM-specific sample;
- names tables, task-list items, strikethrough and bare-URL autolinks as GFM extensions;
- distinguishes math, Mermaid and alert support from those specifications;
- explains soft and hard line breaks with a compatibility-focused diagnosis sequence;
- links the exact CommonMark 0.31.2 and GFM specifications plus the Markups guide and compatibility lab;
- updates title, description, social titles/descriptions, article schema headline/description, `dateModified`, table of contents and reading time.

## Technical source check

- [CommonMark 0.31.2](https://spec.commonmark.org/0.31.2/) says a soft break may render as a space or line ending, and permits renderers to offer a hard-break option. Its hard-break forms include two or more spaces or a backslash before the newline.
- [GitHub Flavored Markdown](https://github.github.com/gfm/) specifies tables, task-list items, strikethrough and autolinks as extensions.
- Current Markups parser source (`src/core/markdown/index.js`) sets GFM and `breaks: true` in the modular renderer. The article does not assert identical configuration in every Markups build or destination; it treats renderer settings as a variable to test.

## Verification

- `node scripts/qa/check-seo-geo-static.mjs` — **PASS**, 27 source routes checked, 0 errors, 0 warnings.
- `npm run build` under Node `24.22.1` — **PASS**, Vite production build completed.
- `node scripts/qa/verify-built-pages.mjs` — **PASS**, 17 built pages checked, 0 failures.
- Built output readback confirms the updated title, description, Article JSON-LD modification date, H1, linked sections and source list are present in `dist/blog/commonmark-vs-gfm-markdown/index.html`.

## Remaining acceptance

- No browser visual/keyboard review, deployment, production HTTP check, Google indexing check, or rank change was performed.
- The snippets have not yet been run against a named external renderer matrix. This is a source/spec review, not the required maintainer review for the 15-article set.
- Continue M-060 one article at a time; preserve non-overlapping query intent and do not claim keyword volume or ranking improvement from the two Search Console impressions available.
