# Controlled release runbook

Scope: the production entry `src/main.js`, local editor/export/share, landing and editorial pages. Cloud/Drive/GitHub remain visibly unavailable until their external setup and live acceptance are complete. The modular entry is an experimental proof build, not the release entry.

## Before approving a release

1. Use Node 24 meeting `package.json` engines. Run `npm ci`, `npm run lint`, `npm run typecheck:landing`, `npm run verify:health`, `npm run test:e2e:built`, the SEO audits, and `python scripts/qa/verify-pdf-artifacts.py` with PyMuPDF installed.
2. Inspect the exact candidate SHA/diff and the generated production artifact. The compiled browser suite must initialize the actual editor, render fenced languages/Mermaid/math, preserve saved/quota-failure data, share safely, download real exports, and recover a warm offline draft. Successful compilation alone is not sufficient.
3. Review actual public-page/editor analytics requests on the protected/production-equivalent host; localhost intentionally emits none. Verify notices, consent decisions, clean URLs, sanitized titles/referrers and absence of document content/API keys.
4. Review the public page content and test the target browser scope. CI now contains Chromium built checks plus Firefox/WebKit release jobs. A configured job is not a recorded pass. Keep unsupported/unverified browsers explicitly out of broad compatibility claims until their jobs and manual acceptance pass.
5. Open the saved PDF artifacts and representative Word-compatible HTML in actual viewers. Retain the image-based PDF and HTML `.doc` limitations. The raster-review script rejects blank fixture pages; it does not certify every possible document or native Word version.
6. Capture the previous known-good deployment ID and exact commit/build configuration before promotion. Verify its rollback path in the existing Vercel project UI without changing aliases during review.

## Deployment approval and execution

- Owner/reviewer approves the concrete candidate and the chosen scope; no automatic deployment or main-branch push is part of these local fixes.
- Use the existing Git-connected Markups Vercel project and a reviewed branch/PR. Confirm build command/output and safe public build IDs. Never put a provider secret in a VITE variable.
- Review the preview's public route/HTML, security-header and real browser behavior before promotion. A READY deployment status does not prove the correct app content or successful editor boot.
- Promote through the established owner workflow, recording deployment ID, SHA, time and previous deployment. Run the following checks against the final production hostname, not localhost.

## Immediate acceptance

1. Re-run `python scripts/qa/search-readiness.py`. Confirm every intended canonical URL (currently 34) returns its own content; validate sitemap count, canonical tags, robots and noindex exclusions. This updates a dated worksheet; keep owner-filled GSC evidence privately before regenerating it.
2. Open `/` in a fresh browser with no cached worker: create a disposable note, type, reload and recover it, preview code/math/diagram, export a short PDF and share a disposable document. Check the console for startup/module/CSP failures.
3. Test a returning browser profile with an existing saved note and worker cache. Confirm the app does not force-update an active unsaved draft; test a warm offline reload after offline assets finish installing.
4. Check privacy/terms/cookie/accessibility, `/landing`, `/blog`, a post, `/markdown-guide` and `/blog/markdown-troubleshooting`. Missing pages must not masquerade as the editor with HTTP 200.
5. Confirm actual response security headers and AI proxy path behavior. Local preview tests are not production CDN/CSP proof. Use a disposable provider key only with deliberate authorization; never log its value.
6. Follow the separate GA4/GSC owner guide: verify events, submit the actual sitemap and inspect selected canonical/indexing states. Indexing is delayed and is not a same-day deployment acceptance guarantee.

## Monitoring and rollback

Owner chooses an existing monitoring/alert destination. Set public HTTP/content checks for `/`, `/landing`, `/blog`, `/privacy-policy` and `/sitemap.xml`, including the expected title/content so an editor fallback is caught. Assign a person who receives failures; no new tracking vendor has been installed by this work.

Rollback triggers: startup exception/empty editor, confirmed data-loss regression, persistent export failures, broad 5xx/route failures or unexpected private data in telemetry. Restore the recorded previous deployment through the same Vercel project, then repeat fresh/returning-client smoke checks. Do not clear user browser storage or change Appwrite data/schema as a rollback shortcut. Keep client data/export backups and migration compatibility in mind; code rollback does not automatically undo stored-data changes.

## External cloud gate

Read-only Appwrite verification still reports the organization as `readonly`, with zero configured tables/functions for the Markup project. Owner/admin must restore account write access before provisioning platforms/schema/functions and validating OAuth/provider writes. No billing/plan change or live provider writes were attempted. The local editor can remain the selected launch scope while these features stay unavailable.

## Docker deployment scope

The Docker build now generates nginx routes, both allowlisted AI proxy paths and shared headers directly from `vercel.json` via `scripts/generate-nginx-config.mjs`. Real Docker image build/run is unverified on this host because Docker is unavailable. Before claiming Docker support, run `docker build`, start the image, inspect nginx configuration/statuses/headers and test proxy streaming with disposable data. Do not equate a generated config with runtime validation.
