# Google Search Console — Connected account owner-action runbook

**Verified 2026-10-23:** Windsor.ai Search Console read access works for https://markups.dev/.
Keep account-level clicks, impressions and query exports PRIVATE; do not publish raw user analytics to this public repo.

## Confirmed findings (account statistics intentionally omitted)
- Search visibility is very low, especially for generic unbranded editor searches.
- A record for https://markups.dev/robots.txt appears in the SUBMITTED SITEMAPS list and has an error. That file is not a sitemap; do not delete or block robots.txt itself.
- The real https://markups.dev/sitemap.xml appears in the submitted list, with a warning; it has an older submission and a URL count different from the working branch.
- Historic impressions on a page do not prove its present-day indexing status. No URL Inspection or coverage data was accessible through Windsor.
- Some connected GA4 account names did not identify Markups. Verify ownership before claiming site traffic.

## Ordered owner-only actions (Search Console UI)
1. Select the https://markups.dev/ property at https://search.google.com/search-console/.
2. Indexing > Sitemaps > open submitted robots.txt entry > three-dot menu > Remove sitemap. Do NOT remove https://markups.dev/robots.txt from the website; its Sitemap declaration is valid.
3. Open the sitemap.xml entry and inspect the warning details. Record screenshots/details privately.
4. After production changes are explicitly approved, deployed and live-tested, verify sitemap.xml is HTTP 200 and canonical URLs are 200/indexable; then resubmit sitemap.xml. Submitting never guarantees indexing.
5. Indexing > Pages: record indexed and excluded counts and specific reasons in the private baseline.
6. URL Inspection: check /, /landing, /seo/online-markdown-editor, /seo/cheatsheet, /seo/examples/mermaid, /seo/examples/math, /seo/markdown-to-pdf, /seo/markdown-to-html and /privacy-policy. Record last crawl, Google-selected canonical, crawl status, index status and soft 404.
7. Performance > Search results: compare 28-day totals with branded/nonbranded queries, page breakdown and referrals. Different aggregation by property versus URL can yield different impression totals.
8. Verify an actual Markups GA4 web stream before attributing traffic; do not send document content, API keys or full share links into analytics.
9. Repeat after 7 and 30 days, document lag and query anonymization. Use neutral ChatGPT/Gemini/Perplexity prompt samples for AI citation evaluation, not branded prompts.

## External blockers and evidence
- Windsor Search Console integration is read-only; it cannot remove or submit sitemaps or execute URL Inspection.
- Vercel connected account currently exposes no Markups project/team. Do not merge/deploy without preview and owner approval.
- Report full numbers in a private owner-owned document; keep this repo public-safe.

## Official sources
- https://support.google.com/webmasters/answer/7451001
- https://developers.google.com/webmaster-tools/v1/how-tos/all-your-data
- https://developers.google.com/search/blog/2022/10/performance-data-deep-dive
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
