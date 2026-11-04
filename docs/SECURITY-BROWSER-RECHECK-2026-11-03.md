# Security and browser recheck — 2026-11-03

Scope: editor AI transport, authenticated repository browsing, provider CSP compatibility, and browser regression infrastructure. This is not a penetration-test certification or a live provider integration approval. No code-review-graph connector was available; review used the documented source map, targeted source reads and regression tests.

## Fixed boundaries

- AI endpoint validation previously allowed arbitrary remote plain HTTP whenever the provider label was `ollama`. HTTP now requires an actual loopback host; remote providers require HTTPS. Endpoint credentials, query strings and fragments are rejected. The legacy non-streaming send path now performs endpoint validation too.
- All three AI provider request formats now use `redirect: 'error'`, `credentials: 'omit'` and `referrerPolicy: 'no-referrer'`. A provider redirect cannot silently send chosen context/API headers to another endpoint; browser cookies and page referrers are not attached. Custom endpoints must use their final URL. This does not change the explicitly selected provider's own retention policies or the risks of opting to persist a key.
- Added authenticated `github.files` directory browsing. Each request re-verifies Appwrite identity and selected personal-account GitHub App installation/repository access. The minted token requests read-only contents access for that repository. Paths cannot traverse, name arbitrary URLs, or use encoded separators. Responses contain direct child folders and Markdown/text files only, no provider URLs/tokens; symlinks and submodules are excluded. Output is bounded to 200 entries; provider directory limits/incomplete results are flagged.
- Google Drive Picker's official script/frame origins are now permitted in both Vercel headers and the editor CSP meta fallback. This repairs a source-level configuration conflict; it does not provision OAuth or prove a real Drive session. No broad Google domain wildcard was added.
- Playwright supports `PLAYWRIGHT_BROWSER=firefox` or `webkit`, keeping Chromium as the default. `tests/e2e/security-boundaries.spec.js` applies the actual deployment CSP to a production editor navigation and checks preview/Mermaid rendering while hostile HTML remains inert; it also checks the entry to prevent a mislabeled reused modular server.

## Evidence

- Focused unit run: 5 files, 40 tests passed (AI transport/service, authenticated directory browsing, sanitizer and telemetry policy).
- Targeted ESLint: zero errors; test files are excluded by the repository lint configuration.
- Repeated focused AI/backend/connectors run passed 42/42 tests.
- Firefox 157 installed successfully. Initial runner timed out waiting for Vite readiness under heavy host load. Retry reached the runner, but all eight tests failed at `browserContext.newPage: Target crashed`, before application navigation. An independent `firefox.launch()` + `browser.newPage()` + `about:blank` attempt reproduced the crash without the application or Vite. Firefox compatibility remains blocked on this host/runtime; no Firefox application pass is claimed. Browser selection and artifact isolation are now configurable for retry on a working host.
- Updated SECURITY.md to remove stale no-backend/no-auth/no-PII, Clarity, universal-eval-requirement and always-latest-client claims. Optional configured services, AI proxy boundaries and remaining enforcement allowances are stated explicitly.
- Repeated the independent Firefox blank-page probe using supported Node **24.22.2** (`npm exec --yes --package=node@24 -- node ...`): same `browser.newPage: Target crashed`, exit 1, without app navigation. Unsupported Node25 is therefore not sufficient to explain this Firefox failure. Broader Firefox suite was not repeated after the independent probe failed.
- Added opt-in `PLAYWRIGHT_VIDEO=off` for diagnosing slow video teardown; default retention remains unchanged, and screenshots/traces keep their existing settings.

## Remaining release gates

- Enforced CSP still includes `unsafe-inline`, `unsafe-eval` and broad HTTPS connections. Do not remove these blindly: inline application scripts, Monaco/diagram/export paths and user-configured BYOK providers need a complete inventory and preview proof. Broad HTTPS is also what permits deliberate custom provider endpoints; restricting it changes that product capability. Prefer a scoped allowlist/nonce strategy once the final provider architecture is configured.
- Live Drive/GitHub installation, OAuth consent, user/account switching, revoked access, stale writes and protected-branch behavior need real configured pilot accounts. Existing Drive overwrite restriction stays enabled.
- Recheck actual candidate telemetry requests and AI proxy rewrites. Source telemetry policy blocks local/preview/fragment URLs and disables Clarity, but source policy alone is not production network evidence.
- Real Firefox/WebKit export, storage-quota and recovery journeys remain separate from unit tests. A successful browser download/install is not a successful browser test.

## Primary research

- Google Picker integration: https://developers.google.com/workspace/drive/picker/guides/web-picker
- Official Google Picker component CSP origins: https://github.com/googleworkspace/drive-picker-element
- MDN redirect security: https://developer.mozilla.org/en-US/docs/Web/API/Response/redirected
- MDN CSP script restrictions: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src

These sources support limiting key-bearing request redirection and explicitly permitting required provider origins. They do not establish the current build's end-to-end safety.
