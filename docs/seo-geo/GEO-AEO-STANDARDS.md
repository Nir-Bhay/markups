# GEO/AEO Structure Standards

## Objective

Make pages easier for AI systems to extract, quote, and cite while remaining useful for human users.

## Required Content Block Types

1. **Definition block** (40-60 words, direct answer)
2. **Step block** (numbered sequence for how-to intent)
3. **Comparison block** (table for alternatives intent)
4. **FAQ block** (natural language Q/A)
5. **Stat block** (specific number + source + date)

## Heading Rules

- H2/H3 should match real query patterns.
- Do not use vague headings.
- Every key section starts with a direct answer sentence.

## Citation Readiness Rules

- Use verifiable claims only.
- Include source links for statistics.
- Include visible recency signal (`Last updated`).
- Include author/ownership trust context where applicable.

## Schema Guardrails

- Use only truthful, visible, supportable structured data.
- Preferred schemas for this project:
  - `WebApplication`
  - `SoftwareApplication`
  - `FAQPage`
  - `HowTo`
  - `Organization`
  - `BreadcrumbList`
- Avoid unverifiable review/rating claims.

## AI Crawler Policy

- Keep intended citation crawlers allowed.
- Block training-only crawlers only when policy requires.
- Keep robots and llms guidance consistent.

## QA Checklist

- [ ] At least one direct-answer block per target intent section
- [ ] At least one table for comparison pages
- [ ] At least one source-backed stat where claims are numeric
- [ ] Schema matches visible page content
- [ ] No unsupported trust claims
