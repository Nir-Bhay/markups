# Technical SEO Hygiene Queue (Risk-Ranked)

## Priority Rubric

- Impact: High/Medium/Low
- Risk: High/Medium/Low
- Score: prioritize High impact + Low/Medium risk first

## Queue

| Priority | Task | Impact | Risk | Owner | Notes |
|----------|------|--------|------|-------|-------|
| 1 | Canonical domain policy decision (`markups.dev` vs `markups.app`) | High | Medium | Technical SEO | Must be fixed before canonical/sitemap edits |
| 2 | Remove dead URLs from sitemap | High | Low | Technical SEO | Prevent crawl waste and stale indexing signals |
| 3 | Align canonical tags to chosen domain strategy | High | Medium | Technical SEO | Ensure consistent indexation source |
| 4 | Validate OG/Twitter/meta asset paths | Medium | Low | Technical SEO | Broken cards reduce share quality and trust |
| 5 | Confirm AI/search crawler directives in robots | Medium | Low | Technical SEO + GEO | Keep citation bots accessible if visibility is goal |
| 6 | Add 404 noindex hygiene | Medium | Low | Technical SEO | Avoid accidental low-quality indexing |
| 7 | Add `llms.txt` guidance file | Medium | Low | GEO/AEO | Improve machine-readable site guidance |
| 8 | Validate schema consistency with visible content | High | Medium | Schema | Remove unverifiable claims |

## Batch Strategy

- **Batch A (safe quick wins)**: items 2, 4, 6
- **Batch B (policy-dependent)**: items 1, 3
- **Batch C (GEO technical)**: items 5, 7, 8

## Exit Criteria

- Sitemap has only live canonical URLs.
- Canonicals are domain-consistent.
- Metadata assets resolve correctly.
- 404 noindex is in place.
- Robots and llms policy align with ranking and citation goals.
