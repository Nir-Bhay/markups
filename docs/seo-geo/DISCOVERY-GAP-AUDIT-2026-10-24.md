# Markups — SEO, GEO and off-site discovery audit

Updated: 2026-10-24. Applies to the **unreleased** content + landing changes on `fix/markups-browser-qa-2026-10-24`. This file is operational documentation, not a claim of improved rankings or indexation.

## Evidence-backed diagnosis

- Google Search Console baseline (2026-09-25 to 2026-10-22): 24 page-level impressions across three surfaced URLs, zero clicks. Very small sample; average rank is not a useful success metric yet. Existing GSC has one **incorrectly submitted** `robots.txt` sitemap entry (one error) and a proper `sitemap.xml` entry with one warning that needs the owner's Search Console detail view. **Do not delete the publicly served robots.txt file.**
- Existing root URL is the editor tool, while `/landing` is a product overview. Keep separate canonical URLs only because they deliver distinct content; avoid creating many nearly identical "free markdown editor" doorway pages.
- Public `/landing` was re-authored with a clear workflow, interactive sample, honest export limitations, and descriptive links. Its deployment/indexing remains gated by PR review.
- A reproducible README guide and downloadable source are new. A factual tutorial and real source file are stronger evidence than reworded keyword lists.
- Google states its AI Overviews and AI Mode follow normal SEO and require an indexable, snippet-eligible URL. There is **no special GEO schema or requirement for llms.txt**: https://developers.google.com/search/docs/appearance/ai-features and https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Bing offers an **AI Performance** dashboard with citations, cited pages and grounding-query trends, not a ranking score: https://www.bing.com/webmasters/help/ai-performance-9f8e7d6c
- `OAI-SearchBot` should be allowed if ChatGPT Search discovery is desired; crawler permission alone does not guarantee recommendations. Check actual CDN allow rules rather than assuming robots proves access. https://platform.openai.com/docs/bots

## Search intent: what each URL is for

| Intent | URL | Role / next action |
|---|---|---|
| Open a usable Markdown editor now | `/` | Tool/product canonical; retain fast onboarding and metadata. Do not rewrite editor logic. |
| Explore features, examples, trust and limits | `/landing` | Newly redesigned product overview; distinct product intent; manual visual review before merge |
| "online markdown editor free no signup" | `/seo/online-markdown-editor` | Refreshed focused explanatory guide; avoid copying landing sections |
| How do Mermaid blocks work? | `/seo/examples/mermaid` | Real syntax examples, diagram correctness |
| How does math render in Markdown? | `/seo/examples/math` | KaTeX examples, renderer limitations |
| Download a README.md starter | `/seo/markdown-readme-template` | **New original resource** and real Markdown file `/qa/markdown-readme-template.md`; promote only after deployed |
| Convert a document to PDF | `/seo/markdown-to-pdf` | Disclose raster output and non-selectable text |
| Check preview/export compatibility | `/seo/compatibility-lab` | Reproducible multi-format fixture; independent testing |
| General reference | `/seo/cheatsheet` | Syntax reference and contextual internal links |

Don't publish rewritten competitor landing pages, duplicated near-identical long tails, self-serving "top 10" claims, or dozens of templated pages. Google's 2026 guidance explicitly discourages scaled-content manipulation.

## Distribution gaps and verified external opportunities

| Priority | Platform | Evidence | Action | Who |
|---|---|---|---|---|
| P0 | Google Search Console | Bad sitemap entry `robots.txt` and 1 warning on valid `sitemap.xml` in connected report | Remove only invalid **Sitemaps submission**; inspect warning and URL inspection; after release, resubmit canonical sitemap | Owner UI |
| P0 | Bing Webmaster Tools | Not verified connected/claimed | Add/verify property and canonical sitemap; inspect crawl/index and AI Performance; export baseline | Owner account |
| P0 | Awesome Markdown Editors | Existing listing points to **markups.vercel.app**, not markups.dev: https://github.com/mundimark/awesome-markdown-editors | Review contribution policy, submit minimal factual PR to correct an *existing* listing, not create duplicate | Editorial submission (separate external PR) |
| P1 | GitHub repository/profile | Public repo is a major discovery/referral path; external description may lag | Human review: About website field markups.dev, accurate README screenshots, direct landing link, explicit PDF/.doc limits, topic tags; do not invent star counts | Repository owner |
| P1 | ChatGPT Search | Crawler access policy is in robots.txt; CDN or verification unknown | Check `OAI-SearchBot` delivery/edge rules and investigate actual referrals/mentions | Operator/hosting |
| P1 | Bing/Copilot AI | Report available, property state not verified | Record citations, pages cited, grounding phrases; don't treat counts as Google ranking | Owner account |
| P1 | AlternativeTo | No verified existing listing found in targeted discovery search; this is **not proof of absence** | Search site while signed in; propose neutral listing only if absent; verify screenshots and licenses | Human/editorial |
| P1 | SaaSHub | No verified existing listing found in targeted search; not proof of absence | Check existing profiles first and submit truthful description if eligible | Human/editorial |
| P2 | Product Hunt | No launch verified; requires authentic demo assets and active founder engagement | Prepare screenshots, 45–60s real demo and a modest public changelog before picking date | Human/editorial |
| P2 | DEV/HN/Reddit | Real dev audiences; moderation & rules apply | Original post: reproducing Markdown+Mermaid+Math export edge cases, compare results candidly; no mass cross-post or vote solicitation | Human/editorial |
| Investigate | LibHunt | Search result at https://www.libhunt.com/r/markups currently prominently names **ThisIs-Developer** while mentions include `Nir-Bhay/markups` | **Do not claim or edit someone else's listing.** Verify repo identity, link destination and canonical record before a correction request | Owner research |

### Prepared one-paragraph listing description

> Markups is a free, open-source browser Markdown editor (https://markups.dev) with a Monaco-based editing surface, live preview, GitHub-style tables, Mermaid diagrams and KaTeX math. It works without signup for core editing and can download Markdown and HTML. PDF exports are image-based (not selectable/searchable text). The Word option saves Word-compatible HTML as .doc, not native .docx. Source: https://github.com/Nir-Bhay/markups.

Only include tested capabilities. Avoid blanket "everything stays private" promises because optional AI/share flows can transmit content.

### Prepared existing-link correction note

> Hi! I maintain Markups, which already appears in your Markdown editor list. The listing's live URL points to our previous deployment. Could you update the website to https://markups.dev while preserving the repository link https://github.com/Nir-Bhay/markups? Thanks for curating this resource.

No unsolicited external outreach has been sent.

## Post-release measurements

- Day 0: Verify production HTTP 200s, canonical, snippets, resource download, XML sitemap, structured data consistency and all new link targets; submit to GSC/Bing.
- Day 7: Record index coverage, query impressions, unique nonbranded queries, clicks, page-specific CTR (small-sample caveat), referral sessions and new directory acceptance. Do not guarantee indexing.
- Day 30: Compare matched 28-day GSC ranges, organic sessions (GA4 differences vs GSC), accepted third-party citations, and repeat an identical, timestamped 30-prompt by 3-round AI recommendation sample. Record exact source URLs and whether there was a citation, not just a product mention.
- Day 60–90: Rework only the pages with evidence of intent mismatch; prioritize original examples and earned references over keyword density.

## Explicit boundaries

No ranking position, AI recommendation, directory approval or indexation was confirmed as improved from this branch. Do not merge or deploy based solely on green lint/Playwright. All external webmaster submissions, domain and trust policies require account owner verification and post-release checks.

## Sources

- Google SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google AI features: https://developers.google.com/search/docs/appearance/ai-features
- Google's 2026 AI optimization guidance: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Bing AI performance help: https://www.bing.com/webmasters/help/ai-performance-9f8e7d6c
- Awesome Markdown Editors live listing: https://github.com/mundimark/awesome-markdown-editors
- LibHunt colliding "markups" result: https://www.libhunt.com/r/markups
