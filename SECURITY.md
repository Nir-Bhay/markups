# Security policy — Markups

Last source review: 2026-11-03. This describes current working-tree controls and remaining checks; it does not certify that the public deployment contains them.

## Scope and data boundaries

Markups provides a browser Markdown editor. Ordinary local editing and autosave do not require a Markups account or cloud upload. Local drafts, versions, settings and image references can contain personal or confidential information: browser storage is neither a backup nor encrypted application storage. Clearing browser data, storage limits and device/profile changes affect availability.

Optional AI requests send chosen prompt/context and provider keys to configured providers. Some explicitly allowlisted gateways use a same-origin proxy rewrite; do not claim every provider request bypasses hosting infrastructure. Share URLs contain document data and anyone with the link can read it. Exported content may reference external assets. Loading remote media or importing a URL makes network requests.

Source also contains optional Appwrite authentication/cloud backup and Drive/GitHub connector code. These require explicit project/provider configuration and live verification; source is not evidence of a live service. Sign-in alone must not upload local notes. Backup/save requires user intent. Pilot consent, quotas, permissions, account switching, recovery and concurrency must be validated before onboarding users.

## Deployment headers and CSP

`vercel.json` is the source configuration for Vercel headers. The editor has a CSP meta fallback in `index.html`; multiple policies restrict requests together. Check actual response headers after an approved deployment.

Configured headers include nosniff, same-origin frame protection, strict-origin referrer policy, restricted browser permissions, HSTS, COOP same-origin-allow-popups, CORP same-origin, and CSP. OAuth popups are deliberately supported; this is not full cross-origin isolation. HSTS preload eligibility does not prove inclusion in a browser preload list.

Current allowances:

- Scripts: self, inline/evaluated script and explicit external sources. Google Identity/Picker uses accounts.google.com and apis.google.com. No Clarity source remains in the editor policy.
- Frames: same-origin export frames, supported YouTube/Vimeo embeds and explicit Google Picker/identity origins.
- Connections: HTTPS destinations support user-selected BYOK providers, URL imports and configured services. The HTML development fallback also permits loopback/WebSocket connections; Vercel response headers omit those development sources.
- Objects are disabled, base URIs and form submissions are limited to self, and production frame-ancestors is self.

Unsafe-inline, unsafe-eval, broad HTTPS connections and CDN scripts remain hardening work. Do not assert Monaco/Mermaid/KaTeX universally require each allowance. Inventory production paths, externalize inline scripts or use appropriate hashes/nonces, then test workers, diagrams, exports, providers and OAuth in preview before changing enforcement. Broad permissions reduce CSP protection against injection/exfiltration. They do not prove an exploit exists and are not categorically excluded from security review.

## Application controls

| Surface | Current source control and limitation |
|---|---|
| Markdown and diagrams | Shared DOMPurify policy removes active content; Mermaid uses strict mode and sanitized output. Regression checks cover hostile HTML/SVG and supported MathML. Not proof against every parser/browser exploit. |
| AI transport | Remote HTTPS required; HTTP limited to actual loopback hosts regardless of provider label. Endpoint userinfo/query/fragment rejected. Provider fetches reject redirects, omit cookies and send no referrer. Use the final endpoint URL. |
| AI keys | Session-only mode keeps a key in memory and removes persisted copies. Explicit persistence uses plaintext browser storage; XSS or a compromised browser may access it. Custom endpoints require user confirmation. |
| Provider access | Drive uses user-initiated limited file access and an in-memory session token. Existing-file overwrites remain blocked until conditional-write validation. GitHub backend derives personal selected-installation access from verified identity, uses repository-scoped tokens and checks expected file SHA on writes. |
| Repository browsing | Authenticated, bounded relative-directory requests return Markdown/text files and folders. Symlinks/submodules/provider tokens and URLs are excluded. |
| Imports | Supported extension, size and URL guards apply. Imported data must pass the same rendering sanitizer; a Markdown extension does not make content trustworthy. |
| Deletion | Local Trash/recovery preserves identity/history links; it is not an automatic storage reclamation or remote deletion guarantee. |
| Telemetry | Current bootstrap disables Clarity and skips local/preview URLs, fragments and unapproved query strings. Enabled GA sanitizes page location/referrer. Verify actual network payloads after approved release; source does not prove zero collection or cookie-free behavior. |

## Reporting a vulnerability

Avoid posting sensitive payloads, tokens, documents or exploit details publicly. Prefer the repository private reporting flow when enabled:

[GitHub vulnerability reporting](https://github.com/Nir-Bhay/markups/security/advisories/new)

Include affected commit/deployment, browser/OS, a minimal non-sensitive reproduction, expected versus actual behavior and potential impact. Do not send real user documents or credentials. No unverified support address or response-time guarantee is published here.

## Release verification

1. Preserve local work, identify the exact candidate commit and compare with deployed source.
2. Audit production/development dependencies and record advisory scope; zero advisories does not cover application logic.
3. Run unit, production-entry and relevant modular/browser tests, plus hostile rendering, export, quota/recovery and account-isolation checks.
4. Inspect actual headers, CSP violations, analytics payloads and AI/provider destinations in preview.
5. Exercise consent, revocation, stale writes and recovery with configured pilot accounts before enabling cloud features.

Do not automatically deploy or claim header-scanner scores establish application security. Service workers/open tabs can retain old code; a merge to main does not guarantee every client immediately runs it. Verify deployed artifacts and update/reload behavior, and retain a rollback plan.

Latest dated evidence/residual gates: `docs/SECURITY-BROWSER-RECHECK-2026-11-03.md`. Browser installation or a launch failure is not a successful compatibility check.
