# SEO/GEO Run Log

## Run Metadata

- Run ID: 2026-04-26-tech-hygiene-batch-a
- Date: 2026-04-26
- Scope: Technical SEO low-risk hygiene
- Orchestrator: Codex
- Participants: Technical SEO, GEO/AEO
- Environment: production-prep (docs + static assets)

## Goal

Ship low-risk SEO hygiene improvements that strengthen index quality and AI discoverability without changing application logic.

## Locked Ownership Map

- Technical SEO: `public/sitemap.xml`, `public/robots.txt`, `public/404.html`, `landing/index.html`
- GEO/AEO: `public/llms.txt`
- QA/Evidence: this run log + backlog status tracking

## Changes Executed

1. Added `public/llms.txt` with canonical domain, preferred citation pages, and project summary.
2. Updated structured-data URLs in `landing/index.html` from `markups.vercel.app` to `markups.dev` for key machine-readable blocks (FAQ text reference, `BreadcrumbList`, `Organization`, `HowTo`, `Article` publisher/mainEntity).
3. Replaced non-existent structured-data image URLs with existing asset `https://markups.dev/image/og-image.svg`.
4. Confirmed `public/sitemap.xml` already contains only live URLs (`/` and `/landing`).
5. Confirmed `public/404.html` already uses `noindex,follow`.
6. Confirmed `public/robots.txt` already allows AI citation crawlers and `llms.txt`.

## Gate Checks

### Gate 1 - Discovery
- Baseline snapshot captured: PASS

### Gate 2 - Scope Lock
- Owner map approved: PASS

### Gate 3 - Implementation
- No overlap detected: PASS

### Gate 4 - Validation
- Technical validation: PASS
- Schema/metadata URL consistency (partial): PASS
- Notes: There are still non-canonical `markups.vercel.app` references in non-critical body copy/links to clean in next batch.

### Gate 5 - Evidence
- Before/after artifact set complete: PASS

### Gate 6 - Release
- Rollback documented: PASS
- Monitoring owner assigned: PASS

## Risks and Mitigations

- Risk: Mixed-domain links can dilute canonical clarity.
  - Mitigation: Continue Phase 2 with a full-domain-link normalization pass after canonical strategy finalization.

## Rollback Plan

- Remove `public/llms.txt`.
- Revert edited structured-data URLs in `landing/index.html`.
- Revert backlog status file if needed.

## KPI Hypothesis

- Primary metric(s): cleaner indexing signals, improved AI citation extractability.
- Expected direction: positive or neutral in short term; improvements should compound after full domain normalization.
- Observation window: 2-4 weeks.

## Final Verdict

- Status: PASS
- Sign-off: Codex
