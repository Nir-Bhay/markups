# Markups: remaining SEO, GEO and indexing work

Latest source update: `runs/2026-11-04-help-and-analytics.md` supersedes the missing-editorial-bootstrap finding below. Shared public-page initialization and deduplication are now implemented and tested locally. Production receipt and privacy/release checks remain pending. A troubleshooting hub brings the source sitemap to 34 URLs; the earlier 33-URL live crawl remains a dated snapshot.

Reviewed 2026-11-04 IST. This is the current task list; older 23/28-URL counts are historical snapshots. Source has 15 blog articles, a guide and 33 intended sitemap URLs. Read this with `GOOGLE-ANALYTICS-SEARCH-CONSOLE-OWNER-GUIDE.md`, `BACKLINKS-DISTRIBUTION-PLAN.md`, `CONTENT-KEYWORD-MAP.md`, and the per-page CSV under `runs/2026-11-04-search-readiness/`.

## Evidence and limits

Fresh read-only HTTP crawl: **33 source URLs, all built; 11 live 200, 22 live 404; live sitemap 10 URLs**. Exact observations and timestamps are in `summary.json` and `PAGE-INDEXING-TRACKER.csv`. This is not a Google index report. No Search Console URL Inspection result, backlink database export or new keyword-volume data was obtained in this pass. Same-day Windsor baseline remains 91 GSC impressions/2 clicks and 56 GA4 organic sessions over approximately 90 days; it is historical usage, not a result of these new articles.

SEO means discoverability in conventional search. GEO/AEO here means being understandable and eligible as a source in answer/AI search. The user's term IEO is treated as indexing and AI/search-engine discoverability for this document; it is not assumed to be a separate Google product or formal score.

## P0: release and crawling

| Work | Owner | Definition of done |
|---|---|---|
| Release current pages through reviewed workflow | Maintainer | Correct deployment SHA verified; 33 intended canonical URLs return actual content, not editor fallback/login/error pages |
| Repair four legal routes and Compatibility Lab in production | Maintainer | HTTP 200 with correct page title/canonical; privacy/legal text reviewed |
| Publish blog hub, 15 posts and guide | Maintainer/editor | Examples verified, sources valid, content reviewed; pages served publicly |
| Synchronize production sitemap | Maintainer | XML contains the same intended canonical set as deployed pages; no 404, noindex, redirects or internal strategy pages |
| Check redirects | Maintainer | HTTP→HTTPS, www→chosen host, old domain and trailing slash behavior recorded; no loop or duplicate canonical content |
| Inspect root/landing canonical decisions | GSC owner | URL Inspection records Google's actual selected canonical; resolve duplicate intent if Google consolidates them |

Source already builds the missing routes; publishing more source files will not fix the current deployment mismatch. Do not request indexing for a localhost URL, protected preview, or live 404. Do not change `lastmod` merely to look fresh. A 33-URL site does not need a sitemap index or invented priority/changefreq values. Maintain one accurate public sitemap and real internal links. [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## P1: measurement gap confirmed in source

`src/utils/telemetryBootstrap.js` is imported by `src/main.js`. No equivalent import appears in landing, blog or guide source. Those editorial routes currently have no shared GA4 initialization. GA4 setup in the admin UI alone cannot measure pages without a working tag.

Required implementation before a content performance experiment:

1. Decide consent/privacy handling for all public pages and reconcile the notices with actual collection.
2. Reuse a shared, reviewed low-data bootstrap on editorial and landing pages. Give it the real public article title rather than the current hard-coded `Markups editor` title.
3. Preserve hostname restrictions and stripping of document content, hashes, arbitrary query parameters and detailed referrers. Current policy suppresses telemetry on URLs with fragments or non-allowlisted queries. Document that undercount rather than silently weakening privacy controls.
4. Use the existing stream after verifying its measurement ID (`G-8WMNRN5GFM` in source); do not install a duplicate GA tag through GTM as well.
5. Track `resource_cta` as a proposed low-data event using an allowlisted destination class, plus `editor_start` and `export_completed` already present in source. Do not send article search text, document titles, filenames, content, keys or share links.
6. Verify real pageview, article→editor navigation and deliberate edit/export paths on production with approved debug tooling. Localhost is intentionally excluded.

Current source event semantics: `editor_start` once per browser session after deliberate editing; `export_completed` only after a success code path, parameter `export_format` from pdf/html/md/doc/txt/png. Neither proves a file was opened. GA4 admin instructions are in the separate owner guide. No tracking configuration was changed in this audit.

## P1: editorial depth and search intent

The 15 articles are AI-assisted drafts with primary source links. Useful first drafts still need real example verification and accountable editorial ownership. Several shorter posts reuse general review advice and several diagrams share a generic three-step structure. Before more articles, replace generic sections with unique before/after outputs, failure cases and tested fixtures. A heuristic content score does not establish first-hand expertise.

- Add one reproducing `.md` fixture per troubleshooting topic and show expected output in a named renderer/version.
- Verify relative images using a real packaged image, line breaks under both strict CommonMark and the Markups breaks option, list continuation indentation, and unsupported highlighting languages.
- Add topic-specific diagrams: image URL resolution, list indentation structure, fence parsing and Markdown→HTML sanitization. Use explanatory figures, not invented traffic charts.
- Add a real author/editor page only with accurate identity and agreement. Link correction/reporting instructions and visible substantive update dates.
- Retain an answer-first paragraph, descriptive H2s, readable examples, primary citations, constraints and useful related links. Keep tool mentions optional and relevant.
- Review overlap between product-intent SEO pages, the full guide, compatibility guide and new troubleshooting posts. Give each one distinct intent; consolidate true duplicates with a deliberate canonical/redirect plan.
- Map keywords to one primary page. No meta-keyword tag, keyword density target or repeated exact-match anchor program is needed.

Existing clusters and next research briefs are in `CONTENT-KEYWORD-MAP.md`. Ahrefs previously returned `Insufficient plan`; no reliable volume or trend series was obtained. Current sources show recurring questions, not a ranked list of the most popular terms. [Google Search Essentials](https://developers.google.com/search/docs/essentials).

## P1: GEO/AEO and answer engines

Google states that ordinary SEO foundations apply to AI Overviews/AI Mode; there is no special required AI schema or extra AI indexing file. Eligible content must still be indexed and snippet-eligible. [Google AI guidance](https://developers.google.com/search/docs/appearance/ai-features).

1. Keep substantive answers in initial HTML, canonical URLs stable, headings descriptive and source citations visible. Current static editorial build supports this.
2. Validate Article/CollectionPage JSON-LD against visible content; include no fabricated reviews, ratings, credentials, screenshots or experimental results. Rich-result display is not guaranteed.
3. Keep `llms.txt` accurate as an optional discovery aid. It is not proof of indexing or a Google ranking requirement.
4. `robots.txt` currently allows OAI-SearchBot and GPTBot. Search crawling and model-training crawling are separate policy choices. Review the choice intentionally; allow rules alone do not prove access through CDN/firewall. [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots).
5. Verify Googlebot/Bingbot and relevant answer-engine access against current official crawler verification guidance and server logs. A spoofed User-Agent test is not verified crawler traffic.
6. Verify Bing Webmaster ownership, submit the production sitemap and consider IndexNow for genuinely changed public URLs after deployment. IndexNow submission does not prove Google indexing. [Bing guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a).
7. Run a fixed prompt study monthly: exact question, region/language, platform/mode, date, fresh context, linked citations, whether Markups appears, and a screenshot/result record. Separate mentions, citations and actual referral sessions. No citation guarantee.

## P2: performance, accessibility and technical hygiene

- Obtain fresh mobile/desktop PSI/Lighthouse results for `/`, `/landing`, `/blog` and a representative article. Earlier PSI returned a rate limit. Field CWV remains unknown; no numeric claim should fill that gap.
- Review editor/landing bundles independently of lightweight static articles. Check font loading, layout shift, unused scripts and actual LCP elements before optimizing.
- Browser review already checked library search/filter and 390px overflow on representative pages; finish keyboard/focus, contrast, zoom, long code, screen-reader navigation and copy failure behavior across pages.
- Validate OG image bytes/dimensions and social previews; add meaningful unique figures where useful, not decorative screenshots with false claims.
- Keep internal search/filter states from producing duplicate crawlable URLs. The present client-side filter does not create new URL inventory.
- Confirm no service-worker fallback serves the editor at editorial URLs, especially offline. The local extensionless routing bug was fixed; current production still needs separate verification.
- Review CSP and privacy in their existing security tickets; do not tighten policy blindly and break editor/AI integrations.
- Check sitemap/robots HTTP content types, cache freshness, noindex pages excluded, genuine missing routes return 404 and strategy documents stay unbuilt.

## Sequenced delivery plan

| When | Work | Evidence |
|---|---|---|
| Before release | Editorial fixtures/review; supported Node CI; route and privacy review | Reviewed diff, passing CI and preview content |
| Release day | Approved release, crawl deployed URL set, canonical and sitemap checks | CSV statuses and deployment SHA |
| Same day | Owner GA4 and GSC setup per runbook | Tag/DebugView screenshots, sitemap receipt, URL Inspection results |
| First week | Fix concrete indexing exclusions, earn relevant discovery links, inspect a few high-value pages | GSC reasons and outreach tracker |
| Day 28 | Compare page/query impressions, organic visits and qualified activation | Same-window GSC/GA4 export, low-sample caveat |
| Day 90 | Consolidate overlap, improve performing content, decide next articles from actual queries | Content decisions with evidence |

Production deployment, account writes and outreach were not performed. Use the linked owner guide to execute account-side steps.
