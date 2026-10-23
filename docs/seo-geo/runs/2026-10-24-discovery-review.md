# Discovery review execution evidence — 24 October 2026

Branch: growth/discovery-review-2026-10-24. Inherited 81155bc; main baseline 9458092d. Owner explicitly prohibits deploying/publishing/main changes. One writer (lead) owns all changed files; content and QA agents performed read-only independent reviews. Graph MCP unavailable; followed AI navigation docs and targeted source review.

## Completed checks before dependency remediation

- lint: exit 0.
- unit suite: 91 files, 575 tests passed (including GA bootstrap hostname/URL config and Document-mode callback regressions).
- production and modular Vite builds: exit 0.
- source SEO audit: 21 entries, zero errors/warnings.
- built route audit: required assets/trust routes present; zero failures.
- built-site audit: 22 HTML pages, 16 sitemap URLs, zero errors/warnings; local assets and canonical equality checked.
- Vite-dev source-module media regressions: 2/2 passed.
- Initial built-browser run: 47/50 passed. Two failures were tests importing /src from dist; these now run separately on dev. Third was inaccessible external image CDN; deterministic image responses preserve dimensions in stress QA and do not pretend to validate external CDN access.
- Desktop About panel screenshot visually inspected: text/links fit, native details keyboard interaction passes. Mobile test initially chose a hidden legacy footer menu control; corrected to actual header menu. Final results are recorded below.

## Runtime and limits

Playwright's standard Chromium download failed (truncated archive). Local checks use Chromium 153 from a separately installed npm runtime, default web security retained, one worker, no failure video (ffmpeg unavailable). This is different from CI's Playwright-pinned Chromium; CI must pass on the final commit. No runtime-only dependency was added to package.json.

Vendor trackers were not contacted during synthetic bootstrap tests. Tests establish queued GA4 configuration and script hostname gating, not all actual vendor network payloads. Vercel Insights share-URL handling needs owner network review. Clarity loader is disabled pending masking review.

GSC/GA4 were read-only through Windsor. Private numbers/account identifiers were not copied into this public branch. Property-level and per-URL GSC aggregations differ; query rows are incomplete. Coverage and Google-selected canonicals remain unknown. Vercel project found but detail read denied by scoped 403. No bot-log/WAF/redirect/production configuration check was completed.

## Dependency, build-entry and interaction findings resolved

- Initial npm audit: 10 vulnerable package entries. Updated compatible patches plus required Mermaid/KaTeX ranges; resulting audit: 0. Versions checked by `npm ls --depth=0`: DOMPurify 3.4.17, Vite 6.4.5, Vitest/coverage 4.1.12, KaTeX 0.18.10, Mermaid 12.2.0. Peer graph clean. No claim of exploitability or historical incident.
- Former modular artifact was byte-identical to production because entry selection happened after HTML parsing. Pre-hook now selects the actual modular entry; generateBundle rejects wrong/opposite source modules, with Windows-normalized paths. Removed stale unused loading imports and misleading dynamic imports of already-eager export bindings. Public exporter API preserved.
- Actual modular browser smoke: core DOM editing→Markdown preview and route/assets pass (2/2). This is deliberately narrower than production feature parity; production tests use hooks unavailable in modular mode.
- Optional dictionary: shared idle dynamic import, no load for disabled startup, toggle-on load, retry after initialization failure; three tests. Startup main changes ~1794.96→1220.47 kB. Dictionary 563.54 kB is deferred, not deleted. Optional ELK 1477.47 kB remains a documented lazy cost under its own 1500 kB ceiling; built gate forbids root modulepreload. No Lighthouse/CWV score measured.
- KaTeX upgrade renamed `.strut` to `.katex-strut`; regression checks now accept either actual class while retaining height/layout requirements. Deep preview 13/13 suites and 52/52 checks passed after correction.
- Long spell menu own-scroll/focus dismissal fixed. Unit covers own vs external scroll; browser covers native Window target with no TypeError. Dedicated spellcheck flow passes (suggestions, ignore, add-to-dictionary and toggle). Menu own-scroll guard checks Node before contains(Window).
- Mobile drawer screenshot waits for transform to settle and asserts viewport bounds. Native details keyboard open/close, mobile guide access and product-copy tests pass. Desktop and mobile screenshots visually inspected.

## Final local verification

- `npm run lint`: exit 0.
- `npm run verify:health`: exit 0 after the final native Window guard. Audit 0, unit tests pass (579), production and true modular builds pass with no rejected build warnings or budget violations.
- `node scripts/qa/check-seo-geo-static.mjs`: exit 0; 21 routes checked, 0 errors/warnings.
- `node scripts/qa/verify-built-pages.mjs`: exit 0; 9 required files, no missing routes/assets, optional ELK not preloaded.
- `node scripts/qa/audit-built-site.mjs`: exit 0; 22 HTML pages, 16 sitemap URLs, 0 errors/warnings.
- Dev-only media browser regressions: 2/2 passed after dependency updates.
- Complete final built-production Chromium rerun: **49/49 passed**, 2.5 minutes, including actual PDF/Word download bytes, Document Mode, deep math, stress fixture (0 blockers), responsive editor/landing, guides, sharing, spellcheck and native Window scroll. Command: `PLAYWRIGHT_BUILT=1 npx playwright test --workers=1 --config /tmp/markups.playwright.config.mjs` (temporary config points to local Chromium 153 and disables failure video only).
- Actual modular build after final changes: **2/2 smoke tests passed**. Source media regressions: **2/2 passed**. These are distinct suites, not 53 production-feature tests.
- Final CI must still be checked at the exact remote branch head; historical PR #71 results are not substituted.
- `git diff --check`: exit 0.

## Review boundaries and final CI

Code revision for final verification: `4068efd3771a7171688554d25550a9d7b53812ef` plus documentation/screenshots only in the subsequent handoff commit. Main baseline remains `9458092d60aa678e2bc8253f205bb56717a3fca6`. Compare branch heads through GitHub, not the unpushed local commit IDs; writes used the authenticated GitHub connector after shell push lacked credentials.

Check the current exact branch head in GitHub Actions: https://github.com/Nir-Bhay/markups/actions . CI installs its own Playwright-pinned Chromium and runs unit/lint/audits, source media checks, the complete built-production suite and true modular smoke. Local Chromium 153 is supplemental evidence, not a substitute for this head's check. CI status is live and is not frozen into a stale checkbox here.

No publication, deployment, main write, merge, directory submission, message to a third party, scheduler or background monitoring task was performed. Correct Vercel scope, live redirect/WAF/crawler checks, GSC UI inspection, real viewer/device QA and owner review remain explicit external gates. Live rankings, indexed counts, AI recommendations and a complete jurisdictional privacy assessment were not verified.
