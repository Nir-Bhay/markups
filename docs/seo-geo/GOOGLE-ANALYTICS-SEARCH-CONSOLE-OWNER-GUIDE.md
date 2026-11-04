# Owner runbook: GA4, Search Console and every-page indexing

Source update: shared analytics initialization for editorial/landing pages is now implemented locally; production deployment and owner DebugView verification are still required. The new troubleshooting hub brings the intended sitemap to 34 URLs. Regenerate the HTTP worksheet after deployment; the existing 33-row worksheet records the earlier snapshot.

Prepared 2026-11-04 for markups.dev. UI labels can vary; use Admin search when a menu moved. Complete the deployment/measurement prerequisites in `SEARCH-REMAINING-WORK-2026-11-04.md` first. This document specifies actions to take; it does not claim those account settings have been changed.

## 1. Prepare your evidence folder

Keep account screenshots and raw analytics exports in a private owner folder. Copy `runs/2026-11-04-search-readiness/PAGE-INDEXING-TRACKER.csv` there; it contains one row for every one of the 33 intended pages. Fields marked NOT_INSPECTED are deliberately unknown. Never replace that value with “indexed” because a page returns 200.

Record release date/SHA, sitemap URL count, page status, selected canonical, inspection date, exclusion reason, indexing request date, and next action. Keep the public repo free of private visitor/account data.

## 2. Select and verify the GA4 property

1. Open [Google Analytics](https://analytics.google.com/) and select the Markups property. Verify **Admin → Data collection and modification → Data streams → Web stream** and confirm website `https://markups.dev/` and measurement ID against the deployed tag. Source currently uses `G-8WMNRN5GFM`; an account label alone is insufficient.
2. Avoid creating a second property or installing the same measurement ID twice. Confirm only one config initialization/pageview per page load with Tag Assistant/network inspection.
3. Check the stream's Enhanced Measurement options; choose only measurements consistent with actual privacy notices. Do not enable form/search collection on the editor without reviewing content exposure.
4. New blog, guide and landing pages currently lack the shared bootstrap. Ask the developer to complete it before diagnosing those pages as “zero visitors.”

## 3. Validate real events

1. On the approved production host, use [Google Tag Assistant](https://tagassistant.google.com/) or a controlled debug-enabled session. In GA4 open **Admin → Data display → DebugView** (or search DebugView).
2. Enable debug mode with the supported tag/debug tooling. Do not enable permanent debug mode for every visitor. A debug extension is an option; consent/browser privacy settings can prevent debug collection.
3. Visit the blog, one article, landing and editor after measurement is implemented. Confirm a pageview for each expected page, sanitized URL and accurate public-page title. Current safe URL policy excludes fragments and unapproved query strings, so use clean URLs for the first check.
4. In the editor, deliberately type a character. Expect `editor_start` once per browser session. Programmatic loads should not count as deliberate editing.
5. Export a small test document. Expect `export_completed` with allowed `export_format`. Treat this as completion of the export routine, not confirmed file receipt.
6. Inspect outgoing event parameters: no document title/text, filename, content hash, keys, arbitrary search text or share URL should be present. Stop and fix collection if they appear.
7. Check Realtime after DebugView; ordinary report processing can take time. Debug events and local tests are not a growth result. Do not bypass hostname/privacy gates simply to make a local event appear.

[Google DebugView documentation](https://support.google.com/analytics/answer/7201382).

## 4. Configure useful reporting

1. In **Admin → Data display → Events/Key events**, mark `export_completed` as a key event once verified; treat `editor_start` as a leading activation metric, optionally a secondary key event. UI may allow creating the key-event name before it appears in standard reports. Editor access is required. [Google key-event guide](https://support.google.com/analytics/answer/13128484).
2. In **Admin → Data display → Custom definitions → Create custom dimension**, register event-scoped `export_format` if format-level reporting is needed. Use that exact parameter name; do not register private document values. Registration is not retroactive.
3. Use **Reports → Acquisition → Traffic acquisition** with Session default channel group = Organic Search. Compare 28 complete days with the prior 28 days; keep the same timezone and hostname scope.
4. Use Landing page reports or an Exploration with Landing page, Session source/medium, Sessions, Engaged sessions, and key events. Filter hostname to `markups.dev`; separate `/blog/`, `/markdown-guide`, `/landing` and `/`.
5. Create a funnel exploration: article/guide pageview → proposed `resource_cta` (only after implemented) → `editor_start` → `export_completed`. Separate ordered funnel completion from all-event totals; cross-session behavior may not be captured by a simple funnel.
6. Review internal traffic definitions under stream tag settings. Test filters before making them active: filters can permanently exclude data from processing. Keep a private record of exclusions and bot/internal-test limitations.
7. Put an annotation in your change log for the deployment and measurement start date. Missing historical pageviews/events cannot be reconstructed by installing tags today.

## 5. Link Search Console and Analytics

1. You need a verified Search Console owner and GA4 Editor permission for the relevant property.
2. In GA4, **Admin → Product links → Search Console links → Link**. Choose the verified Markups Search Console property, then the correct Markups web stream; review and submit.
3. Open the Search Console report collection in GA4 Reports. If unavailable in navigation, use **Reports → Library** to publish the collection when supported by your role.
4. Keep GSC clicks/impressions separate from GA4 sessions/users. They have different definitions, attribution, consent coverage and processing delays; they will not reconcile one-to-one.

[Official link setup and limitations](https://support.google.com/analytics/answer/10737381).

## 6. Verify Search Console ownership and sitemap

1. Open [Search Console](https://search.google.com/search-console) and select the existing `https://markups.dev/` property. Verify its exact scope. A Domain property covers subdomains/protocols and requires DNS verification; a URL-prefix property covers its configured prefix. Reuse existing verified ownership where possible.
2. If DNS verification is necessary, copy Google's exact TXT verification value into the domain's DNS provider. Preserve existing records. Return to Search Console and Verify after DNS propagation; retain the verification record.
3. After the approved release, open `https://markups.dev/sitemap.xml` publicly. Confirm it is XML listing the current intended pages, with no missing/redirected/noindex URLs. Current local set is 33; use the deployed inventory if it changes.
4. **Indexing → Sitemaps → Add a new sitemap**: submit `sitemap.xml` under the correct URL-prefix property, or the full production URL as required by the UI.
5. If the old mistaken `robots.txt` sitemap submission still exists, remove only its Search Console submission entry. Keep the site's actual robots.txt file. This earlier account-side finding was not reverified in this pass.
6. Open the submitted sitemap row; record last read, processing status, discovered-page count and specific errors. Fix fetching/parsing problems before resubmitting. Submission success means received/processed, not every page indexed.

## 7. Index each page with a repeatable workflow

Use the CSV's 33 URL rows. Priority batches: root/landing/blog hub/guide; five strongest reviewed articles; remaining articles; remaining useful reference/trust pages. A sitemap covers the whole set; manual requests are for a few important or repaired URLs, not quota circumvention.

For each URL:

1. Confirm the live public page has HTTP 200 and the expected article, not the editor fallback, login page or soft error.
2. Paste the full canonical URL into the **URL Inspection** bar. Read the indexed report and record actual status, last crawl if present, crawl/indexing permissions, referring sitemap/page and Google-selected canonical.
3. Use **Test live URL** if it is new, changed or failing. Inspect the rendered HTML/screenshot when offered. A passing live test proves current accessibility/eligibility only; it does not mean the stored Google index already updated.
4. Fix any concrete issue, then use **Request indexing** for a small number of important corrected pages. Record the date. Google applies quotas; repeating a request does not make crawling faster. Use sitemap discovery for the complete set.
5. Revisit the indexed report after processing time and fill the CSV with the real result. Record UNKNOWN/NOT_INSPECTED rather than guessing when evidence is missing.

[Official recrawl instructions](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).

| Inspection/Page indexing result | What to do |
|---|---|
| Not found (404) | Release/fix the intended route; confirm expected HTML and canonical before requesting again |
| Soft 404 | Fix empty/error/editor-fallback content or return a real 404 for an intentionally absent page |
| Excluded by noindex | Keep deliberate exclusions; remove only if the page is genuinely approved for indexing |
| Blocked by robots | Review actual crawl rule and CDN access; do not remove intentional controls blindly |
| Discovered, currently not indexed | Improve discovery, stability and value; inspect internal links/sitemap and wait for processing; no guaranteed “force index” action |
| Crawled, currently not indexed | Review uniqueness, usefulness, duplication and canonical choice; strengthen original evidence rather than repeatedly resubmitting |
| Duplicate / Google chose a different canonical | Compare user-declared and Google-selected URLs, content overlap, redirects and internal links; consolidate deliberately |
| Redirected page | Submit and internally link to the final canonical URL; do not request the obsolete URL as a separate page |
| Server/authorization error | Repair availability/login/WAF issue, then retest and record response |

Check **Indexing → Pages**, **Experience/Core Web Vitals**, **Security & Manual actions**, and **Settings → Crawl stats** for broader evidence. A `site:` search is an informal spot check, not a complete indexing ledger. No person or service can guarantee indexing of every eligible page. [Google technical requirements](https://developers.google.com/search/docs/essentials/technical).

## 8. Monitor keywords and outcomes

In **Performance → Search results**, choose Web, complete dates, and compare equivalent periods. Inspect Pages then Queries for each article. Keep branded/nonbranded query lists separate; small/anonymized queries may not appear. Review country and device splits only when there is enough data. Export aggregate evidence privately each week; note meaningful changes instead of daily rank noise.

Decision rules: impressions without clicks → examine real query intent/title and SERP; clicks without engagement → improve answer/readability; engaged readers without editor use → confirm the tool is relevant and CTA measurement works; no impressions → verify indexing first. Avoid claiming AI Overviews traffic can be isolated if the report does not provide that breakdown.

## 9. Repeatable owner schedule

- Release day: sitemap, high-priority URL live tests, GA4 measurement verification.
- Week 1: indexing exclusions and unexpected 404s; action tracker updates; legitimate relevant discovery links.
- Weekly: GSC page/query review and GA4 content→activation funnel; do not change titles daily.
- Day 28/90: compare complete periods, improve existing pages before adding near-duplicate articles; report uncertainty with low samples.

Done means you have saved real indexed-state evidence and verified events, not just completed the UI clicks.
