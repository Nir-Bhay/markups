# Markups — Issue #42 & #44 Resolution (2026-08-23)

Two code-highlighting bugs in the preview. Both were diagnosed from the actual
running app (live Chromium measurement), not guessed.

---

## The real, shared root cause — highlighting was globally broken

The preview showed **every** code block in plain black text (not just XML/ini).
A live check of the page revealed the cause:

- `Prism.languages` had all grammars registered (`xml`, `markup`, `javascript`, …)
  **except `ini`**.
- Calling `Prism.highlight(code, Prism.languages.xml, 'xml')` directly in the
  browser threw:

  > `TypeError: Cannot read properties of undefined (reading 'tokenizePlaceholders')`

  The stack pointed at **`prism-php.js`**, which calls
  `Prism.languages['markup-templating'].tokenizePlaceholders(...)`. The app
  imported `prism-php` but **never imported `prism-markup-templating`**, so that
  object was `undefined`. Because PHP's grammar hooks into markup, **every**
  markup-based highlight (HTML/XML/SVG) crashed and fell back to raw text.
  The bug is masked/impossible to see in a Node test because plain `prismjs`
  does not wire the components together the way the browser bundle does.

**Fix** (`src/main.js` & `src/core/markdown/index.js`):
- Import `prismjs/components/prism-markup-templating` (defines
  `tokenizePlaceholders` / `buildPlaceholders`), satisfying the PHP dependency
  and un-breaking all markup-templating / markup highlighting.

---

## Issue #42 — XML preview colors

After the dependency fix, `marked`/Prism highlight XML again:
- Tag name (`Sid`) → `.token.tag`
- Attribute names (`Name`, `Timing`, `Flag`) → `.token.attr-name`
- Attribute values → `.token.attr-value`
- Character entity references → `.token.entity`

Verified live: computed colors differ from the plain code color (no longer all
black) and tag vs attribute colors differ (GitHub-style blue/purple). Test:
`tests/e2e/highlight-xml-ini.spec.js`. Both uppercase `` ```XML `` and lowercase
`` ```xml `` resolve (case-insensitive alias handling already existed).

## Issue #44 — INI preview

`prism-ini` was **not imported**, so `ini` fences fell back to plain text.
**Fix**: import `prismjs/components/prism-ini`. Now `[Section]` headers get
`.token.section` / `.token.section-name`, and `key = value` pairs get
`.token.key` / `.token.value`. Verified via `tests/e2e/highlight-xml-ini.spec.js`.

---

## Files changed
- `src/main.js` — add `prism-markup-templating` + `prism-ini` imports
- `src/core/markdown/index.js` — same, for the MarkdownService path
- `tests/e2e/highlight-xml-ini.spec.js` — #42 + #44 regression tests (new)

## Verification
- Live browser: XML 19 tokens, INI section/key/value tokens, non-black colors.
- `tests/e2e/highlight-xml-ini.spec.js` — passes (isolated run).
- Full unit suite: 101/101 pass. Production build: clean.

> Note on the E2E harness: running many heavy Playwright specs in one batch is
> flaky in this repo (cold Vite dev server + debounced rendering under load).
> The pre-existing `editor-runtime` "mobile preview" test is also flaky on clean
> origin. Each fix-specific spec passes reliably in isolation.
