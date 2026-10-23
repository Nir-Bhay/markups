# Owner action list — review-ready, no live changes made

## First: review and access

- [ ] Review the dependency changes (including Mermaid 12 / KaTeX 0.18), actual output screenshots and the optional ELK payload tradeoff. Zero npm findings does not replace product/output review.
- [ ] Review the new branch diff against old growth head `81155bc`, then the combined growth diff against main. Do not merge both independently: this new branch already contains old PR #71's work.
- [ ] Allow the Vercel connection access to team `nirbhay-987s-projects`. Project listing works; scoped project detail returns 403. This audit could not read project production-branch settings, current deployments, build logs, traffic, WAF/bot policy or domain redirect rules. No available team-authorization tool returned a link.
- [ ] Inspect real downloaded PDF and Word .doc files: visual pagination, tables, diagrams, math, link annotations and text selection. Word-compatible HTML is not native DOCX. Test mobile installation on actual target devices before advertising it.
- [ ] Decide whether session replay is needed. This branch stops loading Clarity in the editor pending verified masking of drafts and API keys. No historical collection claim is made. Review existing analytics/privacy configuration as part of release.

## Search Console (actual UI, correct property)

- [ ] Open `https://markups.dev/` property → Sitemaps. Remove only the submitted sitemap entry ending in `robots.txt`; do NOT delete the website's robots.txt file.
- [ ] Open the actual `sitemap.xml` warning and capture its exact message. 'One warning' alone is not a diagnosis.
- [ ] URL Inspection: `/`, `/landing`, `/seo/online-markdown-editor`, `/seo/compatibility-lab`, `/seo/markdown-live-preview-editor`, `/seo/markdown-to-html` and trust pages. Record last crawl, fetch/index permission, user canonical, Google-selected canonical, and indexing/exclusion reason.
- [ ] Check manual actions/security reports directly before calling this a penalty. None was established here.
- [ ] After a separately approved release only: verify production sitemap (16 canonical routes in this candidate), submit/resubmit it, and request inspection for a small set of materially changed pages. Indexing is not guaranteed.
- [ ] Open Bing Webmaster Tools and confirm the canonical site. Import from GSC if appropriate in your account; inspect Bing's own coverage. No connected Bing account was available in Windsor.

## Existing references — correct first

- [ ] Awesome Markdown Editors: existing Markups entry still points at old domain. Existing owner issue #109 may already cover it. Update that issue or use an allowed upstream change with the minimal URL correction; avoid another duplicate promotion request.
- [ ] LibHunt and market.dev: request/update canonical website `https://markups.dev/`; check editorial process first. Direct LibHunt request was blocked, so verify current entry in your browser.
- [ ] Update owned LinkedIn launch posts/profile links that still use `markups.vercel.app` where editing is supported. Do not publish another 'new launch' just to correct a URL.
- [ ] Existing DEV article already uses markups.dev. Improve it with a verified fixture workflow and screenshots instead of reposting the same announcement. Link to it from your profile/product documentation if useful.
- [ ] Old Vercel domain: inspect whether it redirects to markups.dev with preserved paths. Prepare redirect changes only after reviewing current domain attachment; do not redirect preview deployments or unknown third-party mirrors blindly.

## After approval and publication

- [ ] Verify new GA4 `editor_start`/`export_completed` in DebugView/Realtime using a synthetic document. Confirm production host filter, page_location has no query/share fragment, and key/document text never appears in event params or network URLs. These are prospective events, not retroactive metrics.
- [ ] Use the distribution CSV; record dates, actual URLs, platform approval and feedback. A submitted listing is not an accepted backlink.
- [ ] Ask five relevant developers/technical writers to complete the same fixture/export task; record problems and permissioned feedback. No fabricated review or vote requests.
- [ ] Run the fixed 30-prompt study in MEASUREMENT-EXPERIMENTS.md on ChatGPT, Gemini and Perplexity. Save outputs, model/mode/date/region/language/search state and canonical citations. Do not inject the Markups name into generic prompts.

## Release decision

- [ ] Keep new-branch `git.deploymentEnabled` rule until you authorize deployment. It disables only `growth/discovery-review-2026-10-24`, not main.
- [ ] Approve a preview/release separately after exact-commit checks and review. The agent has no permission to deploy under the current instruction.
- [ ] Preserve previous production commit and rollback procedure; validate live behavior after release before calling any finding fixed in production.
