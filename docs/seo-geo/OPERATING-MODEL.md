# SEO/GEO Operating Model

## Mission

Build sustained search growth for `markups.dev` and `markups.app` using a controlled, evidence-driven multi-agent workflow.

## Objectives

- Improve organic rankings for high-intent markdown editor queries.
- Increase AI citation share across major answer engines.
- Maintain product stability while shipping SEO improvements.

## Canonical Principles

1. Stability first, growth second.
2. Evidence over opinion.
3. Incremental releases over large SEO rewrites.
4. Clear ownership and auditable handoffs.

## Team Roles

- **Orchestrator**: sequencing, owner map, merge decision.
- **Technical SEO**: indexing/crawling/canonical/sitemaps/asset integrity.
- **GEO/AEO**: answer extraction patterns, AI crawler compatibility.
- **Content Strategy**: clusters, briefs, publication waves, linking.
- **Schema**: truthful JSON-LD and validation.
- **QA/Evidence**: checks, changelog integrity, release verdict.

## Working Agreement

- Single writer per file during each run.
- Scope freeze after lock map approval.
- Any blocker escalates to Orchestrator.
- No hidden changes outside declared files.

## Escalation Matrix

- **P0 Risk** (possible production breakage): stop run, escalate immediately.
- **P1 Risk** (indexing/canonical mismatch): pause merge, request correction.
- **P2 Risk** (content quality gaps): allow with remediation ticket.
- **P3 Risk** (non-critical optimization): defer to future wave.

## Core Artifacts

- Workflow SOP: `AI-DOCS/modification-guides/seo-geo-multi-agent-workflow.md`
- Backlog: `docs/seo-geo/MASTER-BACKLOG.md`
- Run logs: `docs/seo-geo/runs/`

## Cadence

- Weekly: execution + QA check cycle.
- Monthly: ranking and citation trend review.
- Quarterly: strategy recalibration and cluster reprioritization.

## Definition of Stable Growth

- No app regressions from SEO changes.
- Consistent technical hygiene score.
- Positive trend in indexed high-intent pages and query visibility.
- Improved AI citation presence on target query set.
