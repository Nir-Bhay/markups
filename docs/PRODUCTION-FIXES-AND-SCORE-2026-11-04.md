# Production fixes and current release decision

Date: 2026-11-04 (Asia/Kolkata). This follow-up supersedes the initial audit's unresolved Prism-crash verdict, while retaining its historical evidence. **Core editor: preview candidate. Whole platform: not yet approved for production.** No push or deployment was performed.

## Latest validation checkpoint

After the lazy Mermaid/KaTeX and lightweight stats changes, a fresh Node24 health run passed dependency audit (0 advisories), unit tests (729/729), production and modular builds, and ESLint (0 errors). An initial compiled rerun found and fixed an editor-startup readiness race; a later full run had a spellcheck menu timeout caused by fixed test coordinates. The spellcheck test now right-clicks Monaco's actual cursor position and asserts menu visibility. The final fresh compiled Chromium run passed **65/65**, including the formerly failing security-boundary and spellcheck workflows; stress preview blockers: **0**.

Current-build mobile Lighthouse runs (Lighthouse 13.6, Edge 156, local Windows host) scored **64 and 65** on `/landing` (FCP/LCP 2.4/2.5 s, TBT 1.78/2.08 s, CLS 0); `/` scored **36** (LCP 14.0 s, TBT 7.01 s, CLS 0.059). The editor startup remains a release blocker. The host benchmark index varied from 300 to 1,038 across these runs, so lab scores are noisy; earlier same-session landing runs were 85/89 with 1.7 s LCP, but those results were not reproduced in this final measurement window. Field CWV still requires a hosted preview and real-user data.

The editor's Lighthouse Best Practices score was **88**: it flagged Monaco's hidden textarea as preventing paste and reported missing source maps for large JS bundles. A separate clipboard-permission browser probe successfully pasted text into the real editor, so the paste finding is a Lighthouse/Monaco heuristic in this run; production source maps remain a diagnostics/build-policy decision.

## Honest readiness score: 80/100 (8.0/10)

This is an explicit engineering judgment rubric, not a Lighthouse score, security certification or ranking prediction. A numerical score does not override release gates.

| Area | Earned / maximum | Basis |
|---|---:|---|
| Core functionality and exports | 28/30 | Actual compiled startup, rendering, storage, sharing and downloaded exports tested; native Word-viewer acceptance remains |
| Draft safety and resilience | 15/15 | Typed draft recovery through warm offline reload repeated three times; quota and safe-update paths covered |
| Security and privacy | 13/15 | Sanitizer/boundary coverage, clean dependency audit and now script CSP without inline/eval permission; deployed header/provider acceptance still required |
| Regression and browser coverage | 12/15 | Node24 units and compiled Chromium pass; optimized landing scored 100/100 on Lighthouse automated accessibility; Firefox crashed before assertions, and WebKit remains unrun |
| Release operations | 8/15 | Runbook and CI prepared; production mismatch, source checkout provenance and deployment/rollback verification remain |
| Performance and search foundations | 4/10 | Static SEO clean, landing demo and editor diagrams now load on demand; mobile lab performance still too low for a strong release claim |
| **Total** | **80/100** | Cloud readiness is an additional blocking gate, not hidden in this average |



### What the category points mean

| Area | Points awarded within the category | Points held back |
|---|---|---|
| Core functionality and exports — 28/30 | Bootstrap 8/8; Markdown and previews 8/9; local save and restore 5/5; share/import 3/4; PDF and `.doc` delivery 4/4 | Share/import and native Word viewer variation still need broader acceptance |
| Draft safety and resilience — 15/15 | IndexedDB and quota recovery 8/8; warm offline and lazy asset cache 4/4; safe service-worker update 3/3 | First-visit offline has no cached app by definition and is documented as a limit |
| Security and privacy — 13/15 | Sanitization and hostile HTML 5/5; audited package snapshot 3/3; script CSP 3/4; data minimization/privacy review 2/3 | Live response headers and full CSP integrations remain unverified |
| Regression and browser coverage — 12/15 | Supported-runtime unit coverage 4/4; compiled Chromium workflows 4/4; responsive and keyboard flows 2/2; automated landing accessibility 2/2 | Firefox runner crashed before assertions, WebKit is unrun, and screen-reader/manual editor accessibility remain |
| Release operations — 8/15 | CI/build/review pipeline 2/3; runbook and rollback procedure 3/3; deployment configuration 2/3; source provenance 1/3 | No candidate SHA from nested source, no preview deployment or executed rollback, no live monitoring check |
| Performance and search foundations — 4/10 | Static content/routes and metadata 2/2; sitemap/internal crawl 1/2; reduced landing/demo startup cost 1/2; field performance and indexing 0/4 | Lab run was host-limited; verified CWV, GSC indexing/query data and user consent/event checks are pending |

## Fixes delivered

- Fixed the production Prism grammar initialization crash using explicit core imports before grammar execution.
- Added an isolated compiled-artifact browser runner. CI now checks actual production files, includes the user's branch prefix, and defines Firefox/WebKit release jobs.
- Corrected outdated landing selectors and strengthened browser checks for routes, mobile layouts, keyboard example selection, startup and hydration errors.
- Fixed offline startup precaching of compiled/lazy assets, cache Vary handling and awaited cache writes. API routes bypass service-worker caching. Updates no longer replace active tabs automatically; an unsaved/error save state blocks explicit activation.
- Fixed PDF boundary-margin changes, clipped table rows and blank later pages caused by removing in-flow DOM during capture. Preserved Mermaid IDs/markers; fixed percentage SVG dimensions and export images hidden by the preview's unloaded-image CSS. Export images decode before capture.
- Added real PDF/Word artifact retention and a raster PDF review script; the multipage browser test now checks that the diagram has visible dimensions rather than only checking a PDF signature.
- Fixed React hydration corruption: inserting prerendered HTML through a replacement string interpreted Markdown `$$` as replacement tokens. A replacement callback preserves the literal markup.
- Deferred the interactive Markdown renderer until its section approaches the viewport. Initial landing JS chunk fell from about 613 KB / 186 KB gzip to 270 KB / 80 KB gzip. Markdown examples load their heavy renderer near the demo; the editor loads Mermaid only for diagram fences. Adjusted audited label names, heading order and muted-text contrast while retaining the theme.
- Removed broad manual vendor grouping after it pulled editor-only Monaco/KaTeX into the landing route. Moved editor title/word statistics to lightweight helpers and loads KaTeX only for actual math. The editor's first load still includes a large Monaco payload; no claim of a fast editor startup is made.
- Exposed the browser editor test hook only after the active tab finishes restoring, preventing boot from overwriting an automation edit. Stabilized the spellcheck browser test to right-click the current Monaco cursor position and wait for the menu to open.
- Removed invalid CSP `about:blank` source tokens and removed `unsafe-inline`/`unsafe-eval` from `script-src` in both the HTML policy and Vercel response policy. The style policy stays inline-enabled for existing component styles. A compiled local browser loaded the editor and rendered a Mermaid diagram with no CSP violation. Deployed HTTP headers still need inspection. Clarified privacy disclosures. Prepared Docker/nginx routing and proxy parity generation, without claiming an unrun Docker image passes.
- Bounded unit-worker concurrency and documented release/rollback/account checks in `RELEASE-RUNBOOK-2026-11-04.md`.

## Verified evidence and limits

| Check | Result | Limit |
|---|---|---|
| Node24 unit regression | **729/729 passed** | Final PDF image readiness change additionally checked by focused 10/10 PDF unit tests and real browser exports; subsequent changes are landing presentation/loading |
| Whole compiled browser regression | **65/65 passed on the final fresh run** | Chromium/Edge; includes production CSP/XSS, Mermaid/math, exports, offline recovery, storage, spellcheck, stress preview and sitemap routes |
| Latest real export rerun | **3/3 passed** | HTML `.doc`, not native DOCX; PDFs are image-based |
| PDF artifact review | 1-page and 7-page PDFs, every page nonblank | First and last multipage pages visually reviewed; final diagram is visible; not proof for every possible document |
| Warm offline persistence | **3/3 repeated passes** | Previously cached app and a genuinely typed, persisted draft; first-ever offline visits cannot work |
| Latest compiled landing/routes rerun | **16/16 passed** | Includes 320/390/768/1440 layout and hydration checks; final additional contrast-only adjustment is not a new Lighthouse pass |
| Landing typecheck / source lint | Passed | Not a substitute for cross-browser acceptance |
| Repository health | Passed under Node24 | Includes dependency checks, unit suite and production/modular build budgets; modular remains experimental |
| Final built static SEO | 40 HTML artifacts / 34 sitemap URLs; zero errors/warnings | Does not establish live HTTP or Google indexing |
| Local Lighthouse, latest compiled output | Landing **64/65**; editor **36**. Landing accessibility/best-practices/SEO **100/100/100** | Landing FCP/LCP 2.4/2.5 s and TBT 1.78/2.08 s; editor LCP 14.0 s and TBT 7.01 s. Benchmark index varied 300–1,038, so results are host-sensitive; prior landing runs scored 85/89 but were not reproduced. Neither lab run is production CrUX; hosted preview and field CWV remain pending |

Machine summary: `production-fixes-evidence-2026-11-04.json`. Generated PDF evidence lives under `test-results/built-export-final/pdf-review/`. Local lab inputs/results remain under `.tmp/release-lighthouse-*.json`.

## Expanded checkpoint ledger

Status terms: **Pass** means supported by source/artifact evidence recorded above; **Partial** means a portion works but the acceptance scope remains open; **Pending** means not verified or dependent on an owner/external system; **Blocked** means unavailable because of a named account/environment constraint. This ledger adds detail without inventing a higher score.

| # | Checkpoint | Status | Evidence / next proof |
|---:|---|---|---|
| 1 | Supported Node runtime selection | Pass | Node 24.22.2 used for final unit/build evidence |
| 2 | Production build | Pass | Vite production output compiles |
| 3 | Experimental modular build | Partial | Compiles and budgets pass; not the selected release entry |
| 4 | Production editor bootstrap | Pass | Prism crash fixed; compiled editor initializes |
| 5 | Markdown/GFM/code rendering | Pass | Compiled browser fixtures and 729 unit tests after final lazy loading change |
| 6 | Mermaid editor preview | Pass locally | Compiled production Mermaid and math/diagram export journeys passed in the latest full browser run |
| 7 | Math rendering | Pass | KaTeX fixtures and real PDF visual review |
| 8 | Landing prerender/hydration | Pass | Replacement-string corruption fixed; compiled responsive/hydration run passed 16 checks |
| 9 | Landing first JS payload | Pass | About 613 KB to 270 KB raw; measure compressed transfer too |
| 10 | Editor initial CPU/transfer | Partial | KaTeX/Mermaid/stats renderer are lazy; Monaco remains about 571 KB gzip, while current mobile editor Lighthouse is 36 |
| 11 | Mobile performance / Core Web Vitals | Pending | Current lab: landing 64/65, editor 36; results are host-sensitive. Repeat hosted, then use CrUX/Search Console for field quality |
| 12 | Local persistence | Pass | IndexedDB storage/quota regression coverage |
| 13 | Warm offline start | Pass | Service-worker shell and lazy-asset precache, repeated saved-draft reload |
| 14 | First-ever offline visit | Known limit | Browser has no cached application on first visit; explain as expected PWA behavior |
| 15 | Unsaved-update protection | Pass | Existing draft/error status prevents update activation; install waits for user action |
| 16 | Share privacy boundary | Pass | OAuth/share query/hash telemetry filtering and share browser flows |
| 17 | XSS sanitization | Pass | DOMPurify/browser hostile-markup boundary checks |
| 18 | Dependency advisories | Pass | Audit snapshot reported zero known issues for audited install |
| 19 | Executable script CSP | Improved / partial | Meta and Vercel source policy remove inline/eval permissions; deployed response header unverified |
| 20 | Style CSP | Partial | `unsafe-inline` remains for style attributes; plan nonce/hash migration only with visual/feature parity |
| 21 | CSP origin minimization | Partial | `connect-src https:` and broad media origins remain for integrations/imports; map provider needs before narrowing |
| 22 | Deployed security headers | Pending | Inspect the actual authorized deployment's response headers, redirects and cached paths |
| 23 | Data/secret telemetry disclosure | Pass locally | Bootstrap rules and privacy text reviewed; verify GA4 events on protected live host |
| 24 | File type/size handling | Partial | Signature validation/storage covered in source; acceptance across large/malformed files and browsers remains |
| 25 | PDF page boundaries | Pass | Real one- and seven-page PDFs, every rendered page nonblank |
| 26 | PDF diagram/image/math fidelity | Pass on fixture | Diagram visible in final rendered PDF; broad user documents remain variable |
| 27 | Word export contract | Pass with limit | Real `.doc` is honest HTML; native DOCX is not produced |
| 28 | Responsive public landing | Pass | 320, 390, 768 and 1440 CSS pixels locally |
| 29 | Keyboard landing demo | Pass | Tab and Enter interaction verified |
| 30 | Accessibility | Partial | Latest landing Lighthouse accessibility 100; full application axe/screen-reader/manual keyboard acceptance remains open |
| 31 | Metadata/canonical/structured data | Pass statically | 40 built HTML artifacts audited; deployed selected canonicals not established |
| 32 | Sitemap and static internal links | Pass statically | 34 sitemap URLs, static route audit clean |
| 33 | Live route parity | Fail / release gate | Prior live crawl 11/34 HTTP 200 and 23/34 HTTP 404 |
| 34 | Google indexing | Pending | Requires deployed crawl and owner Search Console; sitemap submission is not indexing proof |
| 35 | Blog usefulness/keyword fit | Partial | Published static pages and map exist; rankings, originality/reader testing and GSC query fit need real data |
| 36 | Analytics consent/events | Pending | Local intentionally skips localhost. Owner must test on deployed hostname and consent states |
| 37 | Vercel build/config parity | Partial | Configuration prepared; candidate preview and actual response assertions pending |
| 38 | Release rollback/review | Pending | Runbook exists; known-good deployment ID and tested owner-controlled rollback not recorded |
| 39 | Firefox | Blocked in this runner | Attempt ended with browser target crash/interstitial before product assertions; no pass or product failure counted |
| 40 | WebKit/Safari | Pending | CI matrix exists but job not run |
| 41 | Docker runtime | Pending | Docker executable unavailable; generated nginx config alone is not runtime proof |
| 42 | Appwrite schema/functions/storage | Blocked | Organization readonly and project services unprovisioned |
| 43 | Google Drive/GitHub OAuth paths | Blocked | Depend on backend, secrets, provider configuration and granted owner consent |
| 44 | Source candidate SHA/diff | Blocked | Outer workspace tracks a submodule pointer; nested source lacks Git metadata |

## Remaining gates — exact action and owner

1. **Mobile performance — code work.** Current final local runs scored landing 64/65 and editor 36; editor LCP was 14.0 s / TBT 7.01 s, with Monaco still about 571 KB gzip. An earlier landing pair scored 85/89, but the current result did not reproduce it. Profile the editor boot on an otherwise idle machine and a hosted preview; reduce Monaco/main-thread cost and verify repeat runs. Treat the low latest results as a release blocker until a stable improvement is demonstrated.
2. **Production deployment mismatch — release owner.** Last live inventory: 11 of 34 intended URLs return 200, 23 return 404; live sitemap contains 10 URLs. Review the concrete candidate, deploy to an authorized preview, verify all 34 paths/headers/canonicals, save the previous deployment ID, and approve promotion. No deployment performed here.
3. **Cloud backend — Appwrite account owner plus implementation.** Connected project remains in a read-only organization; service totals show no tables, functions or storage setup. Restore account write access, then provision and validate schema/functions/OAuth/provider flows using disposable data. Local code cannot resolve organization billing/access state. Keep Cloud/Drive/GitHub unavailable until acceptance passes.
4. **Cross-browser/device and native viewer acceptance — QA.** Rerun Firefox when the browser runner is healthy, execute WebKit, review real mobile editing/import/export and representative `.doc` files in supported viewers. Docker runtime also remains unverified because Docker is unavailable locally.
5. **Release provenance — repository owner.** The outer repository tracks `markups` as a Git submodule, but this source directory currently has no `.git` metadata. Preserve these files and reconcile them into the intended source checkout/branch before recording an exact candidate SHA and creating a review. Outer `git status` cannot demonstrate the nested source diff. No repository history was reinitialized or overwritten.
6. **Deployed observability/search — account owner.** Verify GA4 DebugView/consent and sanitized events on the actual deployment; submit the deployed sitemap in Search Console, inspect representative URLs, and monitor indexing/CWV/errors. Runbook and existing owner guide contain the sequence. Submission is not an indexing/ranking guarantee.

## Realistic time estimate

- **Preview review of local editor scope:** candidate available now; final release is still gated above.
- **Core editor production hardening:** budget roughly **1–2 focused working days** for remaining performance, cross-browser/viewer acceptance and a reviewed preview/rollback verification, assuming repository/deployment access is available. This is an estimate, not a promised release date; regressions can extend it.
- **Full cloud platform:** no defensible date until Appwrite write access and provider configuration are restored. Re-estimate after a successful backend provisioning and end-to-end connection test.

Code-review graph tooling was unavailable; repository navigation and direct source/test inspection were used. No audit can establish that every possible defect is absent.
