# 2026-11-04 SEO audit evidence log

## Provenance and release scope

- Worktree: `E:\markups\markups`.
- Audit date: 2026-11-04 Asia/Kolkata.
- No production deployment, Search Console write, Analytics write, DNS/firewall change, commit, push, or publication was performed.
- Windsor was used read-only for the Markups GSC property and host-filtered GA4 data. Only aggregate values are recorded in `../SEO-AUDIT-2026-11-04.md`.
- `claude-seo` v2.5.0 source was cloned to `C:\Users\lenovo\AppData\Local\Temp\claude-seo-audit-2026-11-04`; its Python runtime is isolated under that folder. The global user installer was not run.

## Connected measurement

- Search Console period: approx. 2026-08-05 through 2026-11-02; 91 impressions, 2 clicks. Recent 28 days: 6 impressions, 0 clicks. Previous 28 days: 28 impressions, 1 click.
- Ahrefs keyword endpoint access was checked after reading its tool schema; the API returned `Insufficient plan`, so no search volume, difficulty or trend series were retrieved.
- GA4: host `markups.dev`, last 90 days, 556 sessions total and 56 Organic Search sessions. Last 28 days: 184 sessions, 130 users, 38 engaged; previous 28 days: 187 sessions, 153 users, 49 engaged.
- The queried 90-day event names included generic page/session/scroll events; no `editor_start` or `export_completed` rows were returned. This describes production observations, not branch source capability; privacy-limited event code exists but has no observed production sample yet.
- Data is low volume. No keyword volume, index coverage, backlink, or AI citation values were inferred from it.

## Live HTTP evidence

- `python <isolated-runtime> run sitemap_discovery.py https://markups.dev --json`: exit 0. Live robots file declares sitemap URL; sitemap HTTP 200, valid XML URL set; 10 live sitemap entries. Conventional alternate sitemap URLs returned 404 as expected.
- `fetch_page.py https://markups.dev/ --json --max-text 1200`: exit 0; homepage HTTP 200. Header capture included CSP directives with `unsafe-inline`, `unsafe-eval` and broad `https:` `connect-src`; see security ticket, unchanged here.
- Metadata fetch of the 10 live-sitemap routes: HTTP 200. Root metadata includes a self canonical and `index, follow`.
- Direct GET against each of the 23 current source-sitemap URLs: 11 HTTP 200, 12 HTTP 404. 404 paths: `/privacy-policy`, `/terms`, `/cookie-policy`, `/accessibility`, `/seo/compatibility-lab`, `/markdown-guide`, `/blog`, `/blog/markdown-instructions-for-coding-agents`, `/blog/architecture-decision-records-markdown-template`, `/blog/markdown-meeting-notes-template`, `/blog/github-readme-template`, `/blog/safe-markdown-html-rendering`.
- Production sitemap contains 10 entries; it does not yet include `/landing`, which currently returns 200 and is in source sitemap. New branch pages and several source legal/trust pages must not be described as live.

## Source changes and verification

- Added editorial routes:
  - `/blog`
  - `/blog/markdown-instructions-for-coding-agents`
  - `/blog/architecture-decision-records-markdown-template`
  - `/blog/markdown-meeting-notes-template`
  - `/blog/github-readme-template`
  - `/blog/safe-markdown-html-rendering`
  - `/markdown-guide`
- Added `public/css/editorial.css`, routes to Vite inputs and QA manifests, matching 23-URL root/public sitemaps, matching root/public `llms.txt`, and two footer links in `landing/src/components/SiteChrome.tsx`.
- `npm run build`: exit 0; Vite 8.3.5, Node 25.2.0. Runtime is outside the repository's supported Node range; CI/support-range rerun is still needed.
- `node scripts/qa/check-seo-geo-static.mjs`: exit 0; 27 checked, 0 errors, 0 warnings.
- `node scripts/qa/audit-built-site.mjs`: exit 0; 29 HTML pages, 23 sitemap URLs, 0 errors, 0 warnings.
- `node scripts/qa/verify-built-pages.mjs`: exit 0; 17 checked, 0 failures.
- `git diff --check`: exit 0.
- Isolated `claude-seo` `content_quality.py --json`: blog hub and 6 long-form pages scored 78–83, no filler or AI-pattern flags. Heuristic output is non-authoritative.
- Isolated `claude-seo` `pagespeed_check.py https://markups.dev --strategy mobile --psi-only --json`: API returned rate-limit error; no speed metrics were available.
- `runtime.py doctor --json`: core runtime ready, browser not ready. Chromium download failed with Windows temporary-file ENOENT, so browser-rendered checks and Lighthouse were not run.
- `parse_html.py` did not extract anchors from one article (reported no links though anchors are present); source was manually inspected for cited source and internal links. Treat parser link extraction as an audit-tool limitation.

## Available workflow gates

- Local repository-only source/static/build gates pass for this content change.
- Production route integrity does not pass: 12 of the 23 source-sitemap paths are live 404s.
- GSC URL inspection, protected-preview HTTP/browser review, supported-runtime CI, Chromium-based visual/performance checks, and post-release index validation remain pending.
- Code-review graph tooling is not available in the current workspace tool set; source searches and the existing SEO QA scripts were used instead.

