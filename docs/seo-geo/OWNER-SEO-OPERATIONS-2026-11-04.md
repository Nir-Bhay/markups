# Markups SEO operations and launch checklist — 2026-11-04

This runbook gives the owner the next steps for production SEO, Google Search Console, GA4, Bing, and legitimate link building.

## Current verdict

**Markups is not production indexing-ready yet, and ranking readiness cannot be claimed.** The source has a 34-URL sitemap, a Markdown guide, 15 blog articles, and shared low-data GA4 initialization. The live site is out of sync with that source:

- On 2026-11-04, a read-only HTTP crawl of all 34 source sitemap URLs found **11 HTTP 200 and 23 HTTP 404**.
- The live `https://markups.dev/sitemap.xml` returned HTTP 200 but contains only **10 URLs**.
- Search Console's connected sitemap data shows the live `sitemap.xml` has 10 submitted URLs, 0 errors and 0 warnings; it was last downloaded on 2026-11-01. Search Console also lists `https://markups.dev/robots.txt` as a submitted sitemap with 1 error. Open that row to confirm the reported error. If it is the robots.txt file submitted as a sitemap, remove that report entry only; keep the real `robots.txt` file and its `Sitemap:` line.
- The connected Search Console property is `https://markups.dev/`. For 2026-08-05 through 2026-11-02, the connector returned 2 clicks. Impression totals varied by query shape (73 without a page dimension; 98 summed across four returned page rows; a prior audit snapshot recorded 91). Search Console explains that chart and table totals can differ because property-level and page-level aggregation differ. Use the native Search Console Performance report as the baseline; the consistent conclusion is that current search visibility is very small.
- GA4 data filtered to hostname `markups.dev` returned 556 sessions for the same period, including 56 Organic Search sessions and 11 engaged Organic Search sessions. This is a small baseline, not a growth forecast.
- GA4's production event history previously had no observed `editor_start` or `export_completed`. Those events exist in source but still need post-deploy receipt validation.
- No Search Console URL Inspection/indexing diagnosis or reliable backlink/referring-domain export has been reviewed. Ranking, indexing, and backlink outcomes therefore remain unverified.

The source checks are useful but do not prove that production is correct. The full compiled browser suite and static SEO checks passed in the prior local release review, but the live route mismatch is a production release blocker. A prior mobile Lighthouse run also showed weak editor performance (score 36, LCP about 14 seconds and TBT about 7 seconds); treat that as a separate product-performance item to remeasure after the editor optimization. No ranking position or indexing date can be promised.

## Step 0 — make a reviewed production release possible

1. Restore the correct nested repository/worktree and confirm its remote and branch before committing. In this workspace, the outer repository tracks `markups` as a Git mode-160000 gitlink and `git -C markups` resolves to the outer root, so this checkout does not currently expose a normal independent source repository for a safe push.
2. Build a reviewed preview from the intended source commit. Check the landing page, editor, guide, blog index, all 15 articles, legal pages, and SEO examples.
3. Fix routing/deployment so every intended public sitemap URL serves the expected public HTML page with HTTP 200. Keep genuinely unavailable routes out of the sitemap. Do not turn accidental 404s into redirects to `/`.
4. Confirm each page has the intended title, description, self-canonical, indexability, and useful internal links. Check that private/editor-only routes are not added to the public sitemap.
5. Verify the deployed sitemap contains exactly the intended canonical URL set. At the time of this runbook, that source set has 34 URLs.
6. Run the reviewed release process; then repeat the public HTTP crawl and check deployed security headers, consent/privacy behavior, analytics, and mobile performance. This runbook does not deploy or change account settings.

## Exact Google Search Console steps

### A. Check the property and sitemap

1. Open [Google Search Console](https://search.google.com/search-console) and select the existing URL-prefix property `https://markups.dev/`. Do not create a duplicate property. If it is missing, ask the verified property owner to add you or verify the existing property.
2. Open **Indexing → Sitemaps**.
3. Open the `https://markups.dev/robots.txt` row and read its error. If it is the robots.txt document entered as a sitemap, use the row's **More options → Remove sitemap** action. This removes the report entry; it does not remove the website's robots.txt file. Keep `https://markups.dev/robots.txt` publicly accessible and keep its real `Sitemap: https://markups.dev/sitemap.xml` declaration.
4. Do not submit the new 34-URL source sitemap while production is serving the old 10-URL sitemap and 23 source URLs return 404.
5. After the reviewed release, open `https://markups.dev/sitemap.xml` in a private browser window. Confirm it returns HTTP 200, valid XML, and only public canonical pages that load successfully. Then in **Indexing → Sitemaps**, enter `sitemap.xml` under **Add a new sitemap** and click **Submit**. Check the row's status, last read time, discovered URLs, warnings, and errors later. A successful sitemap fetch does not mean every listed URL is indexed.

Google's instructions require the sitemap to be hosted and fetchable before submission. Google may not crawl every listed URL. [Google's Sitemaps report guide](https://support.google.com/webmasters/answer/7451001)

### B. Inspect and request indexing for priority URLs

After the URLs are live and return HTTP 200:

1. Use the top **URL Inspection** search box for each priority URL below.
2. Click **Test live URL**. Confirm the page is available to Google, crawling is allowed, the page is not `noindex`, and the declared canonical is the intended public URL.
3. If the live test passes, click **Request indexing** for a few important new or materially updated pages. Start with:
   - `https://markups.dev/`
   - `https://markups.dev/markdown-guide`
   - `https://markups.dev/blog`
   - `https://markups.dev/blog/markdown-troubleshooting`
   - one or two new articles that answer a real user problem
   - `https://markups.dev/seo/online-markdown-editor`
   - `https://markups.dev/seo/markdown-to-pdf`
4. Do not request indexing for a 404, localhost URL, protected preview, duplicate URL, or all URLs repeatedly. Use the sitemap for broad discovery. A request can take days or weeks and does not guarantee inclusion or ranking. [Google's recrawl guidance](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)
5. Open **Indexing → Pages** and record reasons for **Not found (404)**, **Soft 404**, **Crawled — currently not indexed**, duplicate/canonical issues, and `noindex` pages. Fix the cause in the site before repeating requests.

### C. Check Google's generative AI visibility control (GEO)

1. In the same `https://markups.dev/` property, open **Settings → Search generative AI**.
2. Confirm the setting is **Include my site's links and content in Search generative AI features**, or that it inherits an included setting from its parent property. If it is explicitly excluded and you want Google AI Overviews/AI Mode visibility, switch it to **Include** and save.
3. Look for the **Generative AI performance report** in Search Console. If it is absent, that can mean the property has not received enough impressions in those features; it is not proof of a setup failure.
4. This inclusion setting only controls eligibility for those generative Search features; it does not boost the site's normal organic ranking. For Google, GEO/AEO work still relies on technical SEO and useful, original content. Do not spend time on “GEO hacks,” artificial mentions, forced text chunking, or `llms.txt` as a presumed Google ranking shortcut. Markups' `llms.txt` file may still be useful to tools that choose to consume it, but do not attribute ranking gains to it.

Google says this control rolled out worldwide on 2026-08-31. [Search generative AI control](https://support.google.com/webmasters/answer/16908024), [Generative AI performance report](https://support.google.com/webmasters/answer/16984139), [Google's guide to generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

### C. Establish a search baseline

1. Open **Performance → Search results** and set **Search type: Web**.
2. Record clicks, impressions, CTR, and average position for the last complete 28 days and the previous 28 days. Also save a 90-day view because current volume is low.
3. Review **Queries** and **Pages** separately. Filter by country/device only when the sample is large enough. Separate brand queries (Markups and variants) from non-brand terms such as Markdown editor, Markdown guide, and export tasks.
4. Export the report monthly. Small query rows are noisy and anonymized queries are omitted, so do not treat the visible query list as a complete keyword list.

## Exact GA4 steps

### A. Confirm the correct account and stream

1. Open [Google Analytics](https://analytics.google.com/) and select the GA4 property that owns the **markups.dev** website stream. The Windsor connection currently exposes four GA4 account names that do not identify Markups, so verify the property and stream in the Google UI rather than guessing from those names.
2. Go to **Admin → Data streams → Web** and open the stream. Confirm its website URL is `https://markups.dev` and its measurement ID matches the deployed site. The current source bootstrap is configured for `G-8WMNRN5GFM`; confirm the production build is using that stream.
3. Check that the page contains one GA4 installation, not a duplicate `gtag.js` plus an independently firing GTM GA4 tag. Do not add a second tag to fix a missing event until Tag Assistant identifies the actual issue.

### B. Verify events on the deployed site

1. Use **Tag Assistant** to connect to the live site and open GA4 **Admin/Reports → DebugView**. Test only your own session in debug mode; do not make all visitors debug traffic.
2. Visit `/`, `/landing`, `/markdown-guide`, `/blog`, one article, and `/` in the editor. Confirm one `page_view` per page with the correct page path and title.
3. Type in the editor and confirm `editor_start` fires once for the browser session, not on every keystroke. Complete one test export and confirm `export_completed` fires once with only the allowlisted `export_format` (`pdf`, `html`, `md`, `doc`, `txt`, or `png`).
4. Confirm no Markdown/document text, document title, filename, arbitrary query value, URL fragment, or private referrer is sent. The source's shared public-page initialization and low-data event allowlist were added locally; live receipt and consent behavior still need verification after release.
5. Check **Reports → Realtime** for the test visit. Then check **Admin → Data display → Events** after processing. If `export_completed` is received and represents a meaningful successful action, mark it as a **key event**. Treat `editor_start` as a product activation metric; only mark it as a key event if it is genuinely a business outcome you intend to optimize. Do not create fake events to make the report look populated. [GA4 key event setup](https://support.google.com/analytics/answer/13128484)

### C. Link Search Console and review reports

1. In GA4 go to **Admin → Product links → Search Console links → Link**.
2. Select the verified `https://markups.dev/` Search Console property, then select the matching GA4 web data stream. Save the link. You need the relevant GA Editor access and verified Search Console ownership.
3. If Search Console reports do not show under **Reports**, open **Reports → Library** and publish the Search Console collection if available.
4. Use **Reports → Acquisition → Traffic acquisition** and filter **Session default channel group = Organic Search**. Use the landing-page report/Explore view to compare `/`, `/markdown-guide`, `/blog/`, and `/seo/` page groups. Keep host `markups.dev` in scope.
5. Compare completed, equal date windows. GA4 sessions and Search Console clicks are different measures; do not expect them to match. Search Console data can take up to 48 hours to appear in the linked reports. [Google's linking guide](https://support.google.com/analytics/answer/10737381?hl=en)

Use DebugView/Tag Assistant to verify event delivery; a source-code test alone does not prove a live event arrived. [GA4 DebugView guide](https://support.google.com/analytics/answer/7201382?hl=en-GS)

## Other platforms to set up or check

| Platform | Exact next action | What it answers |
|---|---|---|
| Bing Webmaster Tools | Add/import `markups.dev`, verify ownership, submit the deployed `sitemap.xml`, inspect representative URLs, and review crawl/index errors. | Bing discovery and Bing-specific indexing/crawl diagnostics. |
| IndexNow | After deployment, create the required host key file and configure the site/CI to ping Bing's IndexNow endpoint only when public URLs are added, materially updated, or removed. Test one real changed URL. | Faster change notification to Bing and participating engines; it is not a Google indexing request or guarantee. |
| PageSpeed Insights and Search Console Core Web Vitals | After the editor performance work is released, test `/`, `/landing`, `/markdown-guide`, `/blog`, and the editor on mobile. Record Lighthouse lab results separately from field/CrUX results. | Lab bottlenecks and real-user Core Web Vitals when field data exists. |
| Google Trends / a keyword tool | Compare a small set of problem-led phrases and related questions; record country, date, and tool. Do not call relative Trends interest a monthly search volume. | Topic direction; Search Console is the source for Markups' actual impressions/clicks. |
| GitHub and developer communities | Complete the GitHub README, description, topics, demo, screenshots, and docs. Share a useful Markdown compatibility/test asset in relevant communities only where it answers the thread and follows that community's rules; disclose that you own Markups. | Relevant discovery and earned links, not guaranteed rankings. |
| Google Business Profile | Skip unless Markups has a real eligible local customer-facing business/location. Do not create a fictitious local listing for a browser-based SaaS. | Local business visibility only when eligibility is real. |

For Bing, use its own [IndexNow documentation](https://www.bing.com/webmasters/help/indexnow-0z209wby?tid=3671e39d-fb71-4efe-b37b-bf15de135100) and [sitemap guide](https://www.bing.com/webmasters/help/sitemaps-3b5cf6ed). Do not claim that IndexNow makes Google index a URL.

## Backlinks: measured, relevant, earned

There is no verified current backlink count in the connected data. First establish a baseline:

1. In Search Console open **Links** and export **Top linking sites**, **Top linked pages**, and **Top linking text**. Treat these as sampled reports, not a complete web-wide backlink index.
2. If an Ahrefs/Semrush plan is available, export referring domains, linked pages, and new/lost links for `markups.dev`. The connected Ahrefs keyword endpoint previously returned `Insufficient plan`; no volume or backlink metric was available from that call.
3. Record each prospect in `docs/seo-geo/runs/2026-11-04-search-readiness/BACKLINK-OPPORTUNITIES.csv`: relevant page/domain, why Markups helps its audience, contact/source, status/date, and resulting live URL.
4. Create genuinely useful linkable resources: a tested Markdown compatibility matrix, export-fidelity examples, a carefully sourced Markdown template library, or a reproducible open-source fixture. Ask maintainers to review or link only when it helps their readers. Contribute fixes/docs to relevant open-source projects and let maintainers choose the editorial wording/anchor.
5. Do not buy ranking links, use automated link blasts, trade excessive reciprocal links, stuff exact-match anchors, or submit to low-quality directories. Disclose sponsorships and qualify paid placements with `rel="sponsored"` or `nofollow` as appropriate. Google's [spam policies](https://developers.google.com/search/docs/essentials/spam-policies) describe link spam and scaled-content abuse.

Keep the 15 blog posts focused on distinct reader problems. Improve each with tested examples, named reviewer approval only when a real reviewer agrees, source citations, a clear answer near the top, and useful internal links. Do not publish thin, repetitive posts just to increase URL count. Google's guidance favors original, helpful, people-first content: [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

## Weekly and monthly routine

- **Once after release:** verify all sitemap URLs return the intended status; submit the correct sitemap; inspect key URLs; verify GA4 page views and product events; record consent and mobile performance results.
- **Weekly for the first month:** check Search Console Pages/Sitemaps errors and GA4 Organic Search landing pages. Fix technical errors before making content changes based on tiny samples.
- **Every 28–30 days:** compare equal windows in Search Console (queries/pages/clicks/impressions/CTR/position), GA4 (organic sessions/engagement/key events by landing page), backlink/referring-domain exports, and mobile performance. Note release dates beside changes.
- **After 60–90 days of live data:** decide which posts deserve improvement, consolidation, or no further work based on actual impressions, queries, engagement, and citations. The site's current data is too small to declare a winning keyword strategy.

## References and related workspace reports

- [SEO audit and current evidence](SEO-AUDIT-2026-11-04.md)
- [Remaining search-readiness work](SEARCH-REMAINING-WORK-2026-11-04.md)
- [GSC owner action runbook](GSC-OWNER-ACTION-RUNBOOK.md) — older snapshots are historical; use this document's 2026-11-04 production counts.
- [Backlinks distribution plan](BACKLINKS-DISTRIBUTION-PLAN.md)
- [Page indexing tracker](runs/2026-11-04-search-readiness/PAGE-INDEXING-TRACKER.csv)
- [Backlink opportunities tracker](runs/2026-11-04-search-readiness/BACKLINK-OPPORTUNITIES.csv)

