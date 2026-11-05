# Markups post-deployment search and analytics review

**Reviewed:** 2026-11-05 (Asia/Kolkata)
**Production:** `https://markups.dev/`
**Source reference:** GitHub `main` at `3b34ea1b33e7385f3d2772d60b19c2b8c499d6c7`
**Scope:** live sitemap/routes, page metadata, Search Console sitemap/indexing/performance, GA4 page-view coverage.

## Verified current state

- Production `sitemap.xml` contains 34 URLs. A direct HTTP fetch of all 34 returned 200. For every page, the title, meta description and canonical were present and unique; no page had a duplicate title or description. Each canonical matched its requested URL.
- `robots.txt` returns 200, allows general and named AI/search crawlers, and names `https://markups.dev/sitemap.xml`.
- Google Search Console accepted `https://markups.dev/sitemap.xml` on 2026-11-05 09:32 UTC: 34 submitted, 0 errors, 0 warnings. This is a submission/processing result, not an indexing guarantee.
- The Search Console Page indexing report still says “Last update: 23/10/2026”. Its sitemap snapshot shows 1 indexed, 7 “Discovered – currently not indexed”, and 2 “Crawled – currently not indexed”. The listed URLs are older guide/product pages; this snapshot predates the current 34-URL sitemap and does not establish the index status of the newly published editorial URLs.
- Search Console’s last-28-day web query pull returned only two rows: `mark down online` and `editor markdown online`, each with one impression, zero clicks, and average positions 100 and 97. Both were on the homepage in Brazil. This is too small a sample for volume, trend, or ranking conclusions.
- Search Console Links report lists 4 external links from 3 domains (`x.com` 2, `dev.to` 1, `moussouni.dev` 1), all pointing to `/`. Its one visible referring page on Dev.to is `https://dev.to/nirbhay_hiwse/i-built-markups-a-free-open-source-markdown-editor-that-doesnt-need-an-account-5bb6`. The report shows 2 internal links, which conflicts with the live static HTML graph below and should be treated as stale/partial rather than as the current site graph.
- A direct static-anchor crawl across the 34 live sitemap pages found every URL reachable from `/`, and every URL had at least one incoming same-sitemap link. No orphaned sitemap URLs were found. Outgoing unique in-sitemap link counts ranged from 2 on `/` to 21 on `/blog`.
- The sitemap pages expose 29 JSON-LD blocks; all parsed as valid JSON. This verifies syntax only, not factual matching, rich-result eligibility, or display in Google. Google does not guarantee a rich result for valid markup.
- The Search Console property was linked to the Markups GA4 stream after the owner approved the data-sharing notice. GA4 last-28-day page-view data for `markups.dev` returned 192 views on `/` and 1 on `/?ref=producthunt`; no other path appeared in that query. Treat this as observed data, not proof that other pages are broken. The live `/landing`, `/blog`, and `/markdown-guide` bundles include the shared telemetry bootstrap; confirm real editorial pageviews in GA4 as visits arrive.
- No reliable Core Web Vitals lab result was available. The public PageSpeed Insights API returned HTTP 429 with the project’s daily quota set to zero; Search Console’s prior CWV report had insufficient field data. Do not substitute estimates or scores.
- In the sitemap sample, the six legal/trust routes have titles, descriptions, canonicals, and one H1 but no Open Graph title/image. This is a social-sharing completeness improvement, not an indexing blocker. `/landing` renders two H1 elements; Google can process multiple headings, so no change is justified from that observation alone.

## Work completed

- Re-read the current live sitemap and checked all 34 listed routes over HTTPS.
- Built a same-sitemap static-anchor graph from the live HTML and checked reachability and incoming links for every listed URL.
- Confirmed the current sitemap submission and its zero warning/error counts in the connected Search Console data.
- Reviewed the current index-exclusion sample and its report timestamp.
- Queried Search Console query data and GA4 page-view paths for the last 28 days.
- Read the Search Console Links report and recorded the Dev.to source URL shown there.
- Confirmed canonical URLs align with each live sitemap URL and that the crawler files point to the canonical sitemap.

## Remaining actions

1. **Indexing:** wait for Search Console’s report to refresh after the 2026-11-05 sitemap read. Then inspect `/`, `/landing`, `/blog`, `/markdown-guide`, and the primary product guides individually. If Google still excludes a live URL, inspect its canonical, visible content, internal links, and exclusion reason before requesting indexing. A prior request-indexing attempt hit Google’s reCAPTCHA service error; do not bypass or automate that challenge.
2. **Analytics:** use real visits to verify pageviews on the editorial routes and the existing privacy-reviewed `editor_start` / `export_completed` event paths. Current GA4 query did not return those custom events. Do not create synthetic production activity or send document content, filenames, search text, or share links.
3. **Content:** keep the existing 15 articles and guide stable until technical examples receive accountable review and Search Console has enough query/page data to identify an actual content gap. Prefer improving an existing page with verified examples over adding near-duplicate keyword pages.
4. **Performance:** obtain field data once traffic is sufficient or run a properly authorized lab assessment when a valid PageSpeed/Lighthouse route is available. Current numbers do not support a mobile performance claim.
5. **Discovery:** verify any third-party listing against its live page before proposing an update. Earn links through useful examples and transparent contributions; do not buy links or automate outreach.

## Limitations

- Search Console’s index coverage is stale relative to the current sitemap; no current Google-selected canonical or per-URL index status was available in this report.
- The two query rows are not enough to infer keyword popularity, country opportunity, or likely rank.
- GA4 contains very little editorial-route activity in the selected 28-day window; absence of a path in this result does not prove the tag failed.
- PageSpeed Insights daily quota was unavailable, and no fresh CWV measurement is claimed.
- No external link outreach, public post, deployment, or source-code change was made during this review.

## Follow-up connector read — 2026-11-05

- Re-read the connected Search Console property through Windsor.ai with `include_fresh_data` enabled. The 34-URL sitemap remains downloaded/submitted with 0 errors and 0 warnings. The last-28-day query table still contains only the two rows above, dated 2026-10-24 and 2026-10-27; there are no newer query rows in this connector result.
- Re-read GA4 account `467580741` for 2026-10-08 through 2026-11-04. Returned event paths were `/` and one `/index.html` event path; returned event names were standard automatic events (`page_view`, `session_start`, `first_visit`, `scroll`, `user_engagement`, `click`). This confirms current editorial-page and custom-event observations remain absent from the connector result, but does not by itself prove that telemetry is broken or that nobody visited those pages.
- Current local source has the editorial telemetry bootstrap in blog and guide page HTML; it applies only on `markups.dev` and rejects URL fragments or non-allowlisted query parameters. No production browser visit was generated to validate DebugView or simulate a user.
- The connected Ahrefs batch-analysis call for Markups and two Markdown-editor peers returned `Insufficient plan`; no Ahrefs domain rating, backlink total, keyword volume, or competitor metric is asserted from this run.
- Tool boundary: Windsor.ai exposed read access for the connected Search Console and GA4 datasets in this turn. It did not expose per-URL Google index inspection or GA4 DebugView validation. Computer Use remained unavailable after failing its browser-URL safety check. No SEO source change, property mutation, public post, or outreach was made.
