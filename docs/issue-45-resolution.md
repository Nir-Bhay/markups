# Markups — Issue #45 Resolution (2026-08-23)

**Title:** Allow emoji syntax (`:smile:`) to give GitHub Markdown preview

## The ask
`wexiyeb618` wants GitHub-style emoji shortcodes (`:smile:`, `:+1:`, `:tada:`)
to render as emoji in the preview, instead of requiring copy-paste / picture
emojis (which slow Markups down).

## Approach
- Added the **`marked-emoji`** extension to the Markdown pipeline.
- Emoji data comes from **`gemoji`** (GitHub's own emoji dataset) so shortcode
  → Unicode mappings match GitHub exactly: `:smile:` → 😄, `:heart:` → ❤️,
  `:rocket:` → 🚀, `:fire:` → 🔥, `:+1:` → 👍, `:-1:` → 👎.

> Why gemoji and not emojilib? emojilib's alias list is ambiguous — `:heart:`,
> `:rocket:`, `:fire:` can resolve to the wrong emoji (e.g. 🧑‍🚀 astronaut
> instead of 🚀). gemoji maps GitHub's canonical names, giving correct results.

## Behaviour
- `:name:` where `name` is a GitHub shortcode → rendered as the emoji.
- Unknown `:name:` (`:not-a-real-name:`), times (`12:30`) and CSS pseudo-classes
  (`:hover`) stay **literal** — the extension only converts names present in
  the map, so real content is never clobbered.
- GitHub's image-only custom emojis (`:octocat:`, `:shipit:`) have no Unicode,
  so they are left as-is (not regressed).

## Implementation
- `src/utils/emoji-shortcodes.js` (new) — builds `shortcode → unicode` from
  gemoji and exports `marked-emoji` options (renderer returns the raw emoji).
- `src/main.js` — `marked.use(markedEmoji(...))` (standard preview path).
- `src/core/markdown/index.js` — added the extension to the MarkdownService path.
- New deps: `gemoji` + `marked-emoji`.

## Verification
- Unit: `src/__tests__/emojiShortcodes.test.js` (2 tests) — exact mappings +
  thousands of entries.
- e2e: `tests/e2e/emoji.spec.js` (2 tests) — shortcodes render as emoji;
  unknown/times/css stay literal.
- Full unit suite: 92 passed / 0 failed. Production build: clean.
