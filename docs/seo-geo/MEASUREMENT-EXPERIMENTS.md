# Measurement, KPIs and AI search evaluation protocol

## Baseline confidentiality
Analytics and Search Console are owner-only. The user mentioned ~10–20 daily people, unverified against distinct visitors and meaningful actions. Do not commit raw private analytics exports or visitor IP/device data to this public repository. Keep private exports in a secured analytics workspace and commit only aggregated non-sensitive values.

## Funnel definitions
1. Search impressions: Google Search Console / Bing Webmaster.
2. Search clicks: verified organic clicks, segregated branded vs non-branded and per URL.
3. Landing visits: GA4 or equivalent sessions on pages, bot-filter as feasible.
4. Qualified editor start: editor loaded AND user performs a deliberate edit/import/paste; never send document text.
5. Activation: user exported or saved a meaningful document (privacy-preserving event with format flag only).
6. Referral activation: editor activations from a directory/review/community source.
7. AI mentions/citations: stable count measured through the same question sampling, NOT traffic or ranking.

## Collection worksheet (fill from owner source)
| Metric | 7d before | 28d before | Sprint day 7 | 30d follow-up | Source |
|---|---|---|---|---|---|
| nonbrand search impressions | unknown | unknown | pending | pending | GSC query export |
| nonbrand clicks | unknown | unknown | pending | pending | GSC query export |
| indexed eligible URLs | unknown | unknown | pending | pending | GSC page indexing/URL inspection |
| Bing pages | unknown | unknown | pending | pending | Bing Webmaster |
| organic sessions | unknown | unknown | pending | pending | analytics |
| qualified editor starts | not instrumented/unknown | unknown | pending | pending | privacy-aware client event |
| PDF/HTML/MD export success | unknown | unknown | pending | pending | privacy-aware client event |
| referrer sources | unknown | unknown | pending | pending | analytics |
| AI cited/mentioned in fixed prompts | unknown | unknown | pending | pending | manual reproducible prompts |

## Query portfolio — record 30 prompts verbatim
10 transactional: free markdown editor no signup, markdown live preview tool, browser markdown editor with Mermaid, free markdown editor with math, markdown PDF export tool, browser markdown to HTML, markdown cheatsheet website, markdown editor for README, Markdown vs HTML converter browser, simple technical documentation editor.
10 comparative: StackEdit alternative no signup, Typora alternative browser, Dillinger alternative, privacy oriented markdown editor, Monaco editor online for Markdown, browser editor with Mermaid and KaTeX, markdown editor that exports pdf, markdown editor for technical writers, free alternatives to paid Markdown editors, editor with live preview and multiple export options.
10 informational: how to preview Mermaid inside Markdown, how to render math in markdown browser, how to create a PDF from Markdown, why Markdown editor split preview, how to export Markdown to standalone HTML, how to create README with diagrams, how to format tables in Markdown, how to insert YouTube in Markdown, online markdown writing workflow, markdown tool to write API docs.

Protocol: conduct each query in 3 separate independent rounds using fresh context as appropriate. State platform and product mode, region, language, whether web search was enabled, exact prompt and result URL. Score Markups explicit recommendation, linked citation to canonical site, relative recommendation position and competitors mentioned. Record negative as well as positive. No stealth brand injection and no fabricated counts.

## Seven-day limits
SEO indexing, AI retrieval and third-party editorial approval are delayed phenomena. Separate *leading indicators* (fixes/requests/content/engagement) from *lagging indicators* (rank, citations, conversion). A 7-day improvement is not causal proof; compare a 30-day interval and search seasonality.

## Event schema (proposed, not yet implemented)
- editor_start: boolean once per session, no payload containing content/title.
- export_success: output format only (pdf/html/md/doc), approximate bucket not filename.
- resource_cta: destination page class (not full raw URL/hash).
- acquisition_source: analytics-supplied referrer/UTM with privacy settings.
Consent/configuration: do not introduce new trackers without reviewing current notices and applicable consent requirements.

## Acceptance
Analytics event appears for real interaction, deduplicates re-renders, works without requiring an account, respects privacy, doesn't leak draft text/API keys in URLs or GA4 params. Reconcile analytics against browser network requests.
