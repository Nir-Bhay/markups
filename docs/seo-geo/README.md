# Markups SEO / GEO / Organic Growth Workspace

**Historical baseline:** 2026-10-23. **Current audit:** 2026-11-04. **Repo:** Nir-Bhay/markups. **Production:** https://markups.dev.

## Mission
Improve Google/Bing organic discovery and evidence-based AI citations without degrading the Markdown editor, making misleading product claims, paying for links, or touching production before review. The route inventory and dated audit reports distinguish current workspace source from current production; no automatic release is authorized.

## Mandatory production safety
- Never push directly to main, change production aliases, promote deployments, edit production Vercel settings, or enable auto-merge as part of this work.
- Documentation and read-only audit tooling only in this initial baseline commit. Application fixes require separate commits and real verification.
- The configured Vercel connector did NOT expose the Markups project/team on 2026-10-23. Its deployment/build/error/analytics state is unverified. Do not claim Vercel tests are green.
- A Git-connected Vercel project may generate a preview for non-main pushes; confirm the actual project and that preview remains isolated from production before relying on it.
- Source inspection and live URL checks are separate evidence classes. GSC/Bing ranking/indexing and genuine visit counts are owner-only and UNKNOWN until exported.

## Read in order
Current owner/action documents (2026-11-04):
- [Remaining SEO/GEO/indexing work](SEARCH-REMAINING-WORK-2026-11-04.md)
- [GA4 and Search Console owner steps](GOOGLE-ANALYTICS-SEARCH-CONSOLE-OWNER-GUIDE.md)
- [Backlinks and distribution](BACKLINKS-DISTRIBUTION-PLAN.md)
- [Existing content and keyword map](CONTENT-KEYWORD-MAP.md)
- [Every-page indexing tracker](runs/2026-11-04-search-readiness/PAGE-INDEXING-TRACKER.csv)

1. SEO-AUDIT-2026-11-04.md — latest connected-data and production/source audit, editorial plan and limitations.
2. MASTER-BACKLOG.md — task IDs, priority, owner, dependent files, verification and definition of done.
3. URL-ROUTE-INVENTORY.md — current source route map and dated live-route snapshot.
4. QA-RELEASE-GATES.md — tests, browser/visual QA, deployment protection, rollback checks.
5. SPRINT-2026-10-23-30.md — ordered daily execution.
6. AI-DISCOVERY-DISTRIBUTION.md — crawling, citation studies, community and editorial channels.
7. MEASUREMENT-EXPERIMENTS.md — baselines, event taxonomy, ranking tests and outcome measures.
8. runs/2026-11-04-markups-seo-audit.md — current check outputs and live-vs-source evidence.
9. AI-DOCS/modification-guides/seo-geo-multi-agent-workflow.md — concrete owner-lock and evidence protocol.

## What already exists (do NOT rebuild blindly)
Homepage metadata, WebApplication JSON-LD, SEO articles, canonical tags, robots.txt, sitemap.xml, llms.txt, a product tour, unit and Playwright E2E suites, scripts/verify-health.mjs, and now a source-only blog and Markdown guide. Historical audits and branch builds are not proof of current production route availability or Google indexing.

## Current high-priority findings
- Latest source follow-up: editorial analytics bootstrap is implemented/tested locally; verify production receipt after approved release. New troubleshooting hub brings the sitemap to 34 URLs. See `runs/2026-11-04-help-and-analytics.md`; older counts and missing-bootstrap notes below are historical snapshots.
- **Current production check (2026-11-04):** four trust/legal routes and `/seo/compatibility-lab` return 404 even though current source contains/builds them. The five new blog pages, blog index and Markdown guide are source-only and also return 404 until release.
- Fresh crawl: all 33 intended source URLs build; 11 return live HTTP 200, 22 return 404. Production sitemap has 10 entries. Current source contains 15 blog posts. The older 23/28 counts are historical snapshots. Treat the production mismatch as a release gate.
- Blog, guide and landing source do not initialize the editor's GA4 bootstrap; content-level traffic/activation measurement needs a shared reviewed implementation before experiments.
- Historical source findings about legal-page build inputs and the OG image path have since been corrected in branch source; do not repeat them as current source failures.
- Crawling and SEO document contracts require validation, not new layers of speculative schema.
- AGENTS.md refers to a nonexistent SEO/GEO workflow and backlog directory at baseline; this branch fills that gap.
- AI-DOCS/QUICK-START.md and AI-MEMORY.md say E2E tests are absent, but tests/e2e/ exists.
- Product copy needs feature-specific truth checks (image-based PDF, Word-compatible .doc rather than native .docx; storage and optional AI transmission).
- Existing external editor-directory mentions may still use markups.vercel.app; verify/change with human editorial review.
- Production Analytics/GSC readings are small; page-level index status, backlink authority, Bing coverage, and AI citations remain unknown unless checked in their owner-facing tools.

## Rules for continuing agents
Record a reproduction and before/after evidence for each fix. Distinguish CONFIRMED, SOURCE-ONLY, SUSPECTED, BLOCKED, FIXED, VERIFIED. Use one writer per file. Protect privacy, keys, storage integrity and SEO canonicals. No keyword stuffing, fake benchmarks, generated testimonials, mass directory spam, paid backlink schemes or AI ranking guarantees.
