# QA gates and production-isolation protocol

## Scope and source
Branch growth/seo-geo-audit-2026-10 only. Existing scripts: package.json npm scripts, tests/e2e/**, src/__tests__/**, scripts/verify-health.mjs, scripts/qa/**. The new static checker is scripts/qa/check-seo-geo-static.mjs. The baseline is intentionally red until P0 issues are fixed.

## Before any app-source change
- Read AGENTS.md, AI-DOCS and the SEO/GEO workflow guide, inspect caller/side effect/test coverage and exact current source (line ranges in old docs can drift).
- Verify Git branch is not main and git status has only intended files.
- Ensure no production access, tokens, raw analytics exports or user content in commits.
- Write failing reproduction first; classify evidence (source-only vs live).

## Suggested local command order
    git branch --show-current
    git status --short
    npm ci
    node scripts/qa/check-seo-geo-static.mjs
    npm run lint
    npm test
    npm run build
    npm run build:modular
    npm run verify:health
    npx playwright install chromium
    npm run test:e2e

NOTE: verify:health itself reruns several checks; inspect its current implementation and budget. Do not bypass failures without documented approval. Browser tests need dependencies/browser binaries, may require display/headless configuration. npm audit output must be understood in context.

## Route-by-route preview matrix
| Case | Method | Expected |
|---|---|---|
| Home | GET / | 200 HTML correct title/canonical, editor loads |
| Landing | GET /landing | 200, distinct tour; canonical decision documented |
| Main SEO guides | GET all canonical sitemap /seo URLs | 200 HTML, H1, title, working anchors, canonical, index directive |
| Trust pages | GET /privacy-policy, /terms, /cookie-policy, /accessibility | 200 distinct pages and metadata (baseline LIVE 404) |
| OG image | GET /image/og-image.png | 200 image/png, nonempty valid 1200x630 or actual measured dimensions |
| Deprecated OG path | GET /images/og-image.png | no HTML soft 200; eliminate all references |
| robots | GET /robots.txt | 200 plain text, correct sitemap and allowed crawler policy |
| sitemap | GET /sitemap.xml | 200 XML, locs 200/canonical/indexable |
| llms | GET /llms.txt | 200 text (not indexing guarantee) |
| noindex comparison pages | GET /seo/* alternative pages | noindex remains until explicitly approved |
| editor actions | Playwright | type, render, save, export, shortcuts, mobile layout, keyboard |
| data safety | Playwright | offline cold/warm, IDB load and persistence, no test doc leak |
| export facts | manually open/download | raster-vs-selectable PDF, hyperlink, word .doc, HTML, Mermaid, KaTeX |
| security | static + browser | CSP errors, no unsafe prompt/URL exfil, no XSS |
| share link | unit + browser | max size, malformed content, cancellation, URL hash safe |

## Gated exit statuses
G0 static audit: no incorrect canonical/noindex/sitemap/OG asset paths, 4 trust route inputs present.
G1 quality: lint and tests green, production/modular builds succeed with budget.
G2 visual: editor and informational pages desktop/mobile screenshot baselines and keyboard smoke.
G3 deploy: correct existing Vercel project/team verified, preview-only deployment READY from branch commit, safe preview access; never assume project from name alone.
G4 data and claims: privacy policies reachable and accurate; AI Writer handling verified; export claims match actual.
G5 marketing: third-party outreach permitted only with public canonical page correct and editorial/factual review.
G6 release: human reviewer approval, protect main, no automatic merge. Production rollback strategy documented but not invoked.

## Baseline runtime limitations
This remote-source audit did not execute npm ci/build/Vitest/Playwright/Lighthouse, because a working repo checkout with dependencies was not available in its runtime. Connected Vercel account did not expose the Markups project. Those checks remain UNVERIFIED and MUST NOT be marked green. Logs/results should be appended to runs/ with commit SHA when actually executed.

## Suggested E2E coverage additions
1. legal-routes.spec.js fetch each trust URL and verify visible heading and canonical; run against preview and local.
2. seo-metadata.spec.js crawl sitemap and check canonical/noindex 200; validate JSON-LD.
3. asset-social.spec.js confirm og:image URLs are valid images.
4. editor-smoke existing tests preserved; add feature regressions for added nav links.
5. compare normal vs modular builds for P0 flows before any entry-point refactor.
6. PDF export integration with real browser download and text/annotation checks, not just render snapshot.
7. privacy browser network trace test without exposing document content.
