# Latest continuation — 24 October 2026

Start with [the current review report](DISCOVERY-REVIEW-2026-10-24.md),
[seven-day plan](SEVEN-DAY-PLAN-2026-10-24.md), and
[owner-only action list](OWNER-ACTIONS-2026-10-24.md).
Work is held on `growth/discovery-review-2026-10-24`, based on old growth head `81155bc`.
Main is unchanged; publication/deployment is prohibited until separately authorized.
Current evidence: [run log](runs/2026-10-24-discovery-review.md).

# Markups SEO / GEO / Organic Growth Workspace

**Baseline:** 2026-10-23. **Sprint:** 2026-10-23 to 2026-10-30. **Repo:** Nir-Bhay/markups. **Production:** https://markups.dev.

## Mission
Improve Google/Bing organic discovery and evidence-based AI citations without degrading the Markdown editor, making misleading product claims, paying for links, or touching production before review. The working branch is growth/seo-geo-audit-2026-10, created from main at 9458092d60aa678e2bc8253f205bb56717a3fca6.

## Mandatory production safety
- Never push directly to main, change production aliases, promote deployments, edit production Vercel settings, or enable auto-merge as part of this work.
- Documentation and read-only audit tooling only in this initial baseline commit. Application fixes require separate commits and real verification.
- The configured Vercel connector did NOT expose the Markups project/team on 2026-10-23. Its deployment/build/error/analytics state is unverified. Do not claim Vercel tests are green.
- A Git-connected Vercel project may generate a preview for non-main pushes; confirm the actual project and that preview remains isolated from production before relying on it.
- Source inspection and live URL checks are separate evidence classes. GSC/Bing ranking/indexing and genuine visit counts are owner-only and UNKNOWN until exported.

## Read in order
1. BASELINE-AUDIT-2026-10-23.md — verified issues vs hypotheses, code references, observations and limitations.
2. MASTER-BACKLOG.md — task IDs, priority, owner, dependent files, verification and definition of done.
3. URL-ROUTE-INVENTORY.md — canonical/indexing/map of all meaningful public routes.
4. QA-RELEASE-GATES.md — tests, browser/visual QA, deployment protection, rollback checks.
5. SPRINT-2026-10-23-30.md — ordered daily execution.
6. AI-DISCOVERY-DISTRIBUTION.md — crawling, citation studies, community and editorial channels.
7. MEASUREMENT-EXPERIMENTS.md — baselines, event taxonomy, ranking tests and outcome measures.
8. runs/2026-10-23-baseline.md — what actually ran and what is pending.
9. AI-DOCS/modification-guides/seo-geo-multi-agent-workflow.md — concrete owner-lock and evidence protocol.

## What already exists (do NOT rebuild blindly)
Homepage metadata, WebApplication JSON-LD, public SEO articles, canonical tags, robots.txt, sitemap.xml, llms.txt, a product tour, significant unit and Playwright E2E suites, scripts/verify-health.mjs and extensive engineering plans. Historical production/code audits from September are not proof of the current October release status.

## Current high-priority findings
- Four live trust/legal routes return 404 (privacy-policy, terms, accessibility, cookie-policy); their root folders are not present in Vite multi-page HTML inputs.
- SEO-page OG image URLs use /images/og-image.png, which returns 404; available asset path is /image/og-image.png.
- Crawling and SEO document contracts require validation, not new layers of speculative schema.
- AGENTS.md refers to a nonexistent SEO/GEO workflow and backlog directory at baseline; this branch fills that gap.
- AI-DOCS/QUICK-START.md and AI-MEMORY.md say E2E tests are absent, but tests/e2e/ exists.
- Product copy needs feature-specific truth checks (image-based PDF, Word-compatible .doc rather than native .docx; storage and optional AI transmission).
- Existing external editor-directory mentions may still use markups.vercel.app; verify/change with human editorial review.
- Production analytics, indexed-page counts and AI citation share cannot be inferred from repository source.

## Rules for continuing agents
Record a reproduction and before/after evidence for each fix. Distinguish CONFIRMED, SOURCE-ONLY, SUSPECTED, BLOCKED, FIXED, VERIFIED. Use one writer per file. Protect privacy, keys, storage integrity and SEO canonicals. No keyword stuffing, fake benchmarks, generated testimonials, mass directory spam, paid backlink schemes or AI ranking guarantees.
