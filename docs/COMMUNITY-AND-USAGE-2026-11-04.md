# Community and usage measurement — 2026-11-04

## Screenshot evidence

GitHub's supplied 14-day screenshot shows 949 clones, 340 unique cloners, 47 repository views and 36 unique repository visitors. Vercel's supplied Production/30-day screenshot shows 188 visitors, 265 page views, 80% bounce rate and 42 visitors attributed to github.com. These are different surfaces and date windows, not a conversion funnel with a shared denominator.

Cloning downloads source; it does not require opening GitHub's web page or the hosted application. Local/self-hosted use does not create markups.dev page views. Automation, CI and tools can clone too, but these aggregate graphs cannot establish which clones are automation or identify what cloners did. Do not report 340 cloners as 340 active users or claim the spike was definitely bots.

GitHub retains traffic for 14 days. Export/snapshot privately each week if longer history is useful. The connected GitHub fetch tool rejects traffic/community-profile endpoints, so fresh traffic totals were not retrieved. Counts above are screenshot observations.

## Changes prepared

Added contribution guidance, a community conduct policy, bug/feature issue forms, a PR template and an accessibility document. README now exposes a clear hosted-editor CTA, guide and troubleshooting links, corrects stale verification wording, and links community policies. Community profile recognition requires the files on the default branch and GitHub processing; it has not been claimed complete yet.

## Measure useful work

Keep GitHub traffic, hosted page views and hosted product activity as separate reports. Existing first-party GA4 hooks already emit `editor_start` once per browser session and allowlisted `export_completed` format. An export event means the application success branch ran, not that the user opened/read the downloaded file. Verify actual receipt in the intended GA4 stream before using these events in reports.

Use GA4 for activation/export analysis instead of buying Vercel Pro solely for event tracking. Vercel's custom events require Pro/Enterprise; the screenshot's upgrade prompt is consistent with that limitation. A high page-view bounce rate alone cannot establish failure in a writing app where a user may work on a single page.

README uses a clean canonical editor link so both current page-view collectors can run under existing privacy rules. Current bootstrap strips campaign query values from page_location and skips Vercel collection on query-bearing URLs; adding UTM links alone would not establish reliable campaign attribution. Use the existing GitHub referral host as a coarse signal until a privacy-reviewed campaign implementation is validated. Never add hidden telemetry to cloned/local installations.

On the production hostname, verify one page_view per page, correct static titles, one editor_start for actual typing and one export_completed for a disposable export. No document content, titles, filenames, share fragments or keys should be sent. Configure export_completed as a GA4 key event after receipt is verified. Compare equal full 14-day windows by hostname/source and landing page. Counts differ between providers because of privacy rules, blocked scripts and metric definitions.

## Next account actions

1. Verify the post-merge site route/sitemap deployment and GA4 stream/events. The main merge's Vercel status returned success in this review; that alone does not prove every deployed route.
2. Publish these community files through a reviewed PR, then inspect GitHub Insights → Community standards.
3. Review GitHub referral visitors → editor_start → export_completed in GA4. Do not use clones as the first funnel stage.
4. Test with a small number of consenting real users; record their concrete writing/export problems. Improve those before increasing promotion.
5. Share useful tutorials/templates in relevant communities with affiliation disclosed. Community files improve collaboration and trust; they do not themselves guarantee search ranking.

## Sources

- https://docs.github.com/en/repositories/viewing-activity-and-data-for-your-repository/viewing-traffic-to-a-repository
- https://vercel.com/docs/analytics/custom-events
- https://vercel.com/docs/analytics/using-web-analytics

Code-review graph was unavailable; navigation docs and targeted source inspection were used. No account settings or telemetry collection rules were changed.
