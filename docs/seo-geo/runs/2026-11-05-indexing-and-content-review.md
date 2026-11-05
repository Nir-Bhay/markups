# Search Console indexing and product-page review — 2026-11-05

## Scope and account evidence

Reviewed the connected Google Search Console URL-prefix property `https://markups.dev/` and the Markups GA4 web stream `G-8WMNRN5GFM` in the authenticated Brave session. The owner approved linking this Search Console property to that GA4 stream; GA4 Admin displayed the Search Console link after completion (Nov 5, 2026, 15:29 local time). This is an account configuration change; it does not imply that GSC data is already present in GA4 reports.

## Search Console observations

- `/sitemap.xml` submission status was **Success**, last read Nov 5, with 34 discovered URLs and zero discovered videos.
- The Page Indexing aggregate was last updated Oct 23, so its counts are historical and not a current sitewide verdict: 2 indexed, 11 not indexed. Listed reasons were 7 discovered-not-crawled, 3 crawled-not-indexed, and 1 redirect error.
- URL Inspection for `https://markups.dev/seo/online-markdown-editor` showed **Discovered – currently not indexed**. Sitemap and referring-page links were detected; Google had not crawled the URL. Its live test at 20:27 local time said the URL was available to Google and can be indexed. The separate “Request indexing” action failed with a Google submission error; the UI also showed a reCAPTCHA connection warning. **No successful request is claimed.** Retry after the service/UI error clears, then record the resulting request and inspection status.
- A live HTTP check of the seven URLs surfaced by the GSC report returned 200 responses, self-canonicals and no `noindex` directive. This checks fetchability only, not Google indexing.
- The old `/landing/index.html` redirect warning resolves to the canonical `/landing` route (308 then 200); the alias is absent from internal links and sitemap, so retain the redirect.
- Manual Actions and Security Issues reports displayed “No issues detected.” HTTPS report, updated Nov 5, displayed zero non-HTTPS URLs / no issues in the last 90 days.
- Core Web Vitals report had insufficient 90-day field data for both mobile and desktop. Do not infer good CWV from the lack of reportable data.
- GSC query evidence was very small: two rows in the retrieved 28-day view, each one impression, zero clicks, positions 100 and 97. It cannot support keyword-volume, rank-growth or trend claims.

## Page improvements made in source

Updated `/seo/online-markdown-editor` metadata and copy around the actual product intent. The page now has a clearer title/description, a concrete GFM task-list/table sample, and more accurate notes on local browser drafts, optional first-visit PWA setup, front matter parsing, standalone HTML, image-based PDF export and HTML-based `.doc` output. Corrected a duplicate Mermaid description and aligned visible FAQ content with the FAQ schema. Updated the article schema modification date and sitemap `lastmod` values for the two reviewed Nov 5 blog articles and this page.

Verification on the source branch: Node 24.22.1 Vite production build succeeded; SEO static audit checked 27 routes with zero errors/warnings; built-pages audit checked 17 pages with zero failures; `git diff --check` passed. These source checks do not establish that the page is deployed, indexed or ranking. No browser visual review, deployment or indexing success is claimed.

## Next owner actions

1. After the temporary Google submission/reCAPTCHA error clears, run one URL Inspection request for the online editor page and record whether Google accepts it.
2. Refresh the Page Indexing report after Google’s next processing cycle; inspect the 7 discovered-not-crawled and 3 crawled-not-indexed URLs individually rather than treating the stale aggregate as current.
3. Check GA4 Search Console reports after data becomes available. GA4 association does not create conversion events; configure key events only after verifying meaningful user actions and privacy behavior.
4. Preserve the successful sitemap submission; avoid repeated submissions as a substitute for crawlability, unique value and internal discovery.

