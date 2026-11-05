# Editorial improvement — Markdown XSS prevention

**Date:** 2026-11-05  
**Base:** `origin/main` at `3b34ea1b33e7385f3d2772d60b19c2b8c499d6c7`  
**Branch:** `Nir-Bhay/seo-editorial-examples-2026-11-05`  
**Scope:** `blog/safe-markdown-html-rendering/index.html`

## Finding and change

The existing article covered the general sanitize-and-test advice but gave readers no short insertion example and blurred what happens after the first sanitization. Revised it for the distinct developer intent “Markdown XSS prevention” / safe Markdown-to-HTML rendering. It now includes:

- a small Marked + DOMPurify + `innerHTML` pattern, explicitly labeled minimal rather than universally complete;
- a comparison of sanitizer, URL policy, and CSP roles and limits;
- an explicit warning that extensions and post-sanitization DOM transformations need their own reviewed policy;
- Markups-specific detail that parsed Markdown is sanitized before insertion and Mermaid SVG is sanitized separately, while image/video processing is also performed afterward;
- updated title, description, social metadata, Article JSON-LD, `dateModified`, H1, reading time, and research note.

## Primary-source and implementation check

- [OWASP Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) recommends a maintained HTML sanitizer such as DOMPurify when markup must be rendered, warns that modifying sanitized output can invalidate protection, and describes CSP as an additional control rather than the primary defense.
- [DOMPurify project documentation](https://github.com/cure53/DOMPurify) documents `DOMPurify.sanitize(dirty)` and cautions against changing sanitized output or passing it through mutating libraries without review.
- Current `src/core/markdown/index.js` parses using Marked, sanitizes via `sanitizePreviewHtml`, assigns the result to the preview, processes image/video elements, and separately sanitizes generated Mermaid SVG before adding it. The article now distinguishes these paths and makes no blanket security guarantee.
- Current sanitizer implementation is in `src/utils/sanitize.js`.

## Verification

- `node scripts/qa/check-seo-geo-static.mjs` — **PASS**, 27 source routes, 0 errors, 0 warnings.
- `npm run build` under Node `24.22.1` — **PASS**, Vite production build completed.
- `node scripts/qa/verify-built-pages.mjs` — **PASS**, 17 built pages, 0 failures.
- The updated article title, metadata and content were emitted in `dist/blog/safe-markdown-html-rendering/index.html`.

## Remaining acceptance

- The code example is illustrative and has not been checked as a named-renderer compatibility fixture.
- No browser visual/keyboard review, deployment, production HTTP check, Search Console inspection, or ranking change was verified.
- M-060 remains open: review 13 more articles, create verified fixtures, and obtain maintainer review of the complete set.
