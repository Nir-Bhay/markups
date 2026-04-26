# SEO/GEO Multi-Agent Workflow

## Purpose

Use this workflow for all SEO, AEO, and GEO work on `markups.dev` and `markups.app`.
Primary objective: improve rankings and AI citation visibility without destabilizing product behavior.

## Scope

- Technical SEO hygiene
- GEO/AEO content extractability
- Schema and metadata quality
- Content expansion and internal linking
- Measurement and reporting

## Non-Negotiable Guardrails

1. No deep refactors in SEO runs unless explicitly approved.
2. One owner per file at a time.
3. Every change must include rollback notes.
4. No speculative schema claims.
5. Small batches only; verify after each batch.

## Agent Roles

- **Orchestrator**: creates work packets, assigns owners, resolves conflicts, controls merge readiness.
- **Technical SEO Agent**: robots/sitemap/canonical/indexability/asset integrity/performance quick wins.
- **GEO/AEO Agent**: AI-citability formatting, answer blocks, crawler policy alignment, llms guidance.
- **Content Strategy Agent**: keyword clusters, page briefs, internal linking map, wave planning.
- **Schema Agent**: JSON-LD validation, schema simplification, property integrity.
- **QA & Evidence Agent**: pre/post checks, release notes, acceptance verdict.

## Standard Handoff

1. Orchestrator defines scope and lock map.
2. Specialists execute only assigned files.
3. QA verifies outputs with evidence.
4. Orchestrator decides merge or rework.

## Lock Map Template

```md
Run ID: YYYY-MM-DD-scope-name

Owner Map
- Technical SEO Agent: public/robots.txt, public/sitemap.xml, public/404.html
- GEO/AEO Agent: index.html, landing/index.html
- Schema Agent: index.html, landing/index.html
- Content Strategy Agent: docs/seo-geo/MASTER-BACKLOG.md
- QA Agent: docs/seo-geo/runs/YYYY-MM-DD-scope.md
```

## Required Gates

### Gate 1 - Discovery
- Baseline crawl/index/schema/metadata state recorded.
- Risks and assumptions listed.

### Gate 2 - Scope Lock
- Explicit owner map defined.
- Exact files and acceptance criteria frozen.

### Gate 3 - Implementation
- No file overlap between agents.
- No out-of-scope edits.

### Gate 4 - Validation
- Technical checks pass (robots/sitemap/canonical/index/noindex rules).
- Schema sanity pass completed.
- Metadata and social cards validated.

### Gate 5 - Evidence
- Before/after notes attached.
- User-visible impact stated.

### Gate 6 - Release
- Rollback notes included.
- Monitoring window and owner assigned.

## Validation Checklist (Per Run)

- [ ] Sitemap contains only live canonical URLs
- [ ] Robots allows intended search/AI crawlers
- [ ] 404 page marked `noindex,follow`
- [ ] Canonical tags align with domain strategy
- [ ] OG/Twitter/image references are valid
- [ ] JSON-LD is truthful and minimal
- [ ] Internal links updated for new pages
- [ ] Analytics tracking plan updated

## Safety Release Strategy

- Phase A: docs + strategy only
- Phase B: low-risk technical hygiene
- Phase C: schema/GEO formatting
- Phase D: content expansion in controlled waves
- Phase E: KPI optimization loop

## Escalation Rules

- If an agent finds contradictory SEO recommendations, escalate to Orchestrator with evidence, not opinion.
- If an edit affects rendering, stop and require explicit approval.
- If multiple domains conflict (`markups.dev` vs `markups.app`), choose one canonical policy and document it before edits.

## Deliverables Required Each Run

- Updated run log in `docs/seo-geo/runs/`
- Updated backlog status in `docs/seo-geo/MASTER-BACKLOG.md`
- Gate verdict: PASS/BLOCKED with rationale

## Definition of Done

A run is done only when:

1. All assigned tasks are completed.
2. All gates are passed.
3. Rollback is documented.
4. KPI impact hypothesis is logged for follow-up measurement.
