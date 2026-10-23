# Current candidate amendment — 24 October 2026

The following original audit records baseline behavior. This review branch now loads GA4 and
Vercel Insights only on markups.dev, configures GA4 with query/fragment-free page_location and
origin-only referrer, and stops loading editor Clarity pending verified masking review.
Tests prove script gating and queued GA configuration; actual vendor network payloads, enhanced
measurement settings, consent requirements and historical replay collection were not verified.
No historical document/API-key leak is asserted. CSP tightening remains a separate reviewed task.

# Security, privacy, correctness and trust review — engineering checklist

This is NOT a penetration test or legal opinion. Treat every claim as triaged and check existing SECURITY.md and verified runtime before changes.

## Static source observations
- index.html injects GA4, Microsoft Clarity and Vercel Insights on non-localhost. These calls are not conditioned here on an explicit cookie-consent acceptance (jurisdictional determination and other logic need review).
- privacy-policy/index.html and cookie-policy/index.html describe analytics and storage but both live routes were 404. This is a user-trust and discovery defect.
- src/features/ai-writer/service.js connects to user-selected model endpoints via BYOK. It stores configuration and has remember-key support; verify exact secret storage lifetime/clearing behavior. Never log or commit API keys.
- Site describes local drafts; optional AI Writer requests and share URLs need qualification to avoid a categorical 'never sent' promise.
- src/utils/sanitize.js uses DOMPurify and a DOM fallback with extra handling. Security review must preserve this and test risky Markdown/link/embed cases.
- vercel.json CSP currently has unsafe-inline/unsafe-eval, broad connect-src https: and localhost exceptions. The editor/Monaco and optional AI integrations may need exceptions; shrinking CSP without runtime testing is hazardous.
- vercel.json rewrites /api/ai-proxy/kilo and /api/ai-proxy/tokenrouter to upstream APIs. Confirm exact method/header/query propagation, cost/rate limits and abuse model; never assume routes are secured by origin alone.
- public/sw.js caches assets and has stale-while-revalidate behavior; confirm updates and old-worker caches don't keep stale editor or metadata after deployment.

## Review workstream
1. Inventory network egress destinations and when content/API keys are transmitted (owner must approve documentation).
2. Verify browser storage migration, deletion, private browsing and quota error recovery with current tests.
3. Test XSS through Markdown/raw HTML/URLs, Mermaid, embeds, filenames, AI outputs and decoded shared content with crafted fixtures; do not add unsafe HTML sinks.
4. Review CSP report-only experiment in preview; load Monaco workers, Markdown, KaTeX, Mermaid, video embed, downloads and AI models before enforcement change.
5. Review service worker install/activate/cache and cold-vs-warm offline promise.
6. Validate privacy, cookies, analytics consent/opt-out and accessibility against actually loaded scripts and user geography with appropriate advisor if needed.
7. Check GitHub dependency advisories and npm audit output; do not claim clean without commands.
8. Compare WebApplication structured data, privacy copies and marketing claims to demonstrated features; no hidden page content primarily for crawlers.

## Acceptance
Privacy/trust URLs open, policy accurately describes observed egress/storage/analytics, API keys absent from logs/events/URLs, core editor and previews work under any proposed CSP, security-oriented tests pass, no unreviewed disclosure or legal claims.
