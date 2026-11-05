# Master backlog â€” Markups 2026-10 growth audit

Statuses: TODO, IN_PROGRESS, BLOCKED, VERIFIED, DEFERRED. All default TODO. Priority = P0 stop-ship, P1 this sprint, P2 near-term, P3 later. Acceptance criteria are mandatory, not optional.

| Ticket | Prio | Owner/area | Change | Acceptance/evidence |
|---|---|---|---|---|
| M-001 | P0 | Build | Add privacy-policy, terms, accessibility, cookie-policy roots to vite.config.js HTML input collection; avoid rewrites to main editor | npm run build + dist files and 4 preview HTTP 200s; route screenshots |
| M-002 | P0 | SEO pages | Normalize /images/og-image.png to real asset /image/og-image.png in SEO-page OG/Twitter and JSON-LD | static audit green, image GET 200, social image card proof |
| M-003 | P0 | QA | Add route smoke for legal pages and image asset | CI or local Playwright assertion on preview; no false green if route missing |
| M-004 | P1 | Content/legal | Compare published policy with actual Analytics, Clarity, Vercel Insights and optional AI Writer data flow | Accurate privacy and consent review, no false absolute claims |
| M-005 | P1 | Architecture | Keep /landing canonical / OR make self-canonical based on distinct intent decision | Written decision and URL inspection, no duplicate-page index |
| M-006 | P1 | UX + SEO | Add small human-visible resources/navigation entry without covering editor | Accessible links from real UI; keyboard/desktop/mobile E2E; no accidental layout shift |
| M-007 | P1 | SEO | Canonical robots sitemap route contract and substantive lastmod | XML valid, indexable URLs correct, GSC submitted, exclude noindex and canonical duplicates |
| M-008 | P1 | GEO | Audit OAI-SearchBot, Googlebot, Bingbot and CDN allow/block without changing production firewall | live robots and CDN checks, verified bot log if available |
| M-009 | P1 | Content | Reconcile PDF selective text/link/page-break claims vs actual exports | fixture outputs + copy corrections, no unverified promise |
| M-010 | P1 | Product | Test native DOCX claims; preserve explicit .doc limitation until actual implementation | Downloaded file type and Word/LibreOffice inspection; documentation truthful |
| M-011 | P1 | QA | Gate existing E2E + unit + both Vite builds + lint + health script | captured versions/exits, no waived failures |
| M-012 | P1 VERIFIED (branch CI) | Docs | Fix stale AGENTS / AI-DOCS navigation assertions (source corrected 2026-10-25) | Source read-back and exact-head Branch QA success on 5a492331; Playwright E2E acknowledged; no preview/production claim |
| M-013 | P1 | SEO | GSC property, query/URL breakdown and Bing index report | 28-day pre-sprint baseline exported and stored outside repo if private |
| M-014 | P1 | Growth | Instrument qualified editor_start, export_success, save and outbound CTA using privacy-aware analytics | event appears in analytics, no raw text/keys/PII transmitted |
| M-015 | P1 | Product evidence | Reproducible Markups-vs-competitor comparison; feature/date/source and screenshot each | no fabricated rankings, cited product facts, objective matrix |
| M-016 | P1 | Site content | Build 1 focused tutorial/resource asset with working Markdown examples/screenshots | original source, clear author date, exact test passed |
| M-017 | P1 | Link hygiene | Correct old-domain mentions in Awesome Markdown Editors and LibHunt | live existing entry inspected, editorial PR/request, resulting URL |
| M-018 | P1 | Distribution | Review submissions to AlternativeTo and SaaSHub | policy-compliant submissions, tracking sheet and review status |
| M-019 | P2 | Distribution | Product Hunt assets and real launch plan | eligible account, demo, screenshots, real value proposition |
| M-020 | P2 | Communities | Technical DEV article + rules-first HN/Reddit outreach | editorial original content, no astroturfing, no votes solicit |
| M-021 | P2 | Content | Audit all noindex comparison/alternative pages | neutrality, original testing, source references; keep noindex until useful |
| M-022 | P2 | Docs | Make internal /seo/global-growth-playbook non-search-indexable | keep noindex; verify not in sitemap |
| M-023 | P2 | Schema | JSON-LD semantic consistency, no bogus logo URL, correct FAQ/HowTo applicability | validation + on-page text matches schema |
| M-024 | P2 | Accessibility | Keyboard semantics, heading hierarchy, contrast, focus and accessible PDF limitation | axe/Playwright/manual checklist and issues |
| M-025 | P2 | Performance | CWV baseline on mobile for editor and landing pages | real Lighthouse URL/conditions, LCP INP CLS; no invented metrics |
| M-026 | P2 | Security | Audit CSP unsafe-inline/eval and connect-src breadth; AI endpoints & key storage | report-only policy spike; no provider breakage or secret exposure |
| M-027 | P2 | Privacy | Review consent/cookies by actual jurisdictions and telemetry | legal sign-off where necessary; avoid legal guarantees |
| M-028 | P2 | Product | Browser offline cold/warm behavior, storage and share-link size limits | recorded browser pass/fail scenarios |
| M-029 | P2 | CI/Docs | Replace stale QA wording; map exact smoke tests to critical user journeys | reproducible commands, scoped coverage |
| M-030 | P2 | Release | Safe PR workflow with required reviews, preview, tests, rollback notes | human merge approval only; main unchanged until approved |
| M-031 | P2 | Analytics | Nonbranded Google query growth and qualified referral attribution | before/after numbers with explicit small-sample caveat |
| M-032 | P2 | GEO | Predefined 30-prompt x 3-run AI visibility study with citation scoring | raw prompts/date/platform output links or screenshots; no guarantee |
| M-033 | P3 | Product | Evaluate genuinely selectable/accessibility-preserving PDF path | technical spike with comparison, not rushed into growth sprint |
| M-034 | P3 | Engineering | Decompose production main.js after growth sprint | impact map, modular-entry parity, regression gates |
| M-035 | P3 | Maintenance | Remove root/public duplicate crawler files only after build precedence tests | no regressions in robots/sitemap/llms HTTP responses |

## New confirmed Search Console/public-release tickets â€” 2026-10-23
- **M-036 P0 EXTERNAL OWNER ACTION:** Remove incorrectly submitted robots.txt from Search Console Sitemaps list (not from website); Windsor cannot write.
- **M-037 P1 EXTERNAL OWNER ACTION:** Inspect actual sitemap.xml warning, validate branch sitemap on production after approved release and resubmit.
- **M-038 P1 BUILD:** Stop publishing the internal global-growth-playbook as public HTML; replace cheatsheet link; built artifact must not exist.
- **M-039 P1 INDEX:** Run GSC URL Inspection for root, landing, primary SEO guides and legal routes, save reasons privately.
- **M-040 P1 ANALYTICS:** Keep site vs URL impressions separately; ensure GA4 connected account is actually Markups before using counts.
- **M-041 P1 CONTENT:** Publish original technical documentation and pursue genuine third-party discovery, not promised one-week #1 rankings.
## Compatibility Lab implementation â€” 2026-10-23
- **M-042 P1 CONTENT/QA:** Publish a real, downloadable sample Markdown design note with Mermaid flowchart, table, KaTeX and code. Distinct learning intent; no fabricated benchmark ranking.
- **M-043 P1 QA:** Assert real editor can render sample Mermaid SVG, KaTeX, table, code; browser route and fixture HTTP 200.
- **M-044 P1 INDEX:** Add approved canonical lab route to sitemap and direct landing / resource links. After reviewed production release inspect Google-selected canonical and index status; avoid claiming search visibility before Search Console confirms.
- **M-045 P2 RESEARCH:** Compare other products only when independently tested under the same fixture with screenshots, dates and version/methodology; this first lab is NOT an untested cross-product comparison.

## Export-copy correctness â€” 2026-10-23
- **M-046 P1 SOURCE FIX COMPLETE / CI VERIFIED ON 81155bc:** Reconciled PDF guides and FAQ/HowTo JSON-LD with raster output. Removed assertions of clickable PDF links, perfect preview fidelity, '90%' checks, guaranteed page breaks and unlimited file capability.
- **M-047 P1 TEST / CI VERIFIED ON 81155bc:** Add browser regression that PDF guides clearly explain image-based output and avoid unsupported absolute claims.
- **M-048 P2 SOURCE FIX COMPLETE / CI VERIFIED ON 81155bc:** Remove misleading DOCX references in HTML guide; link to true Compatibility Lab.
- **M-049 P2 PENDING:** Download/open real browser exports in PDF viewers, verify link annotations, text selection, long-document breaks; implementation/content review is not a substitute.
## Download integrity QA â€” 2026-10-23
- **M-050 P1 TEST / CI VERIFIED ON 81155bc:** Playwright exports an actual small PDF from the editor, validates download and nonempty PDF magic bytes; does not falsely claim selectable text or perfect page fidelity.
- **M-051 P1 TEST / CI VERIFIED ON 81155bc:** Playwright downloads Word output, checks extension is .doc and file is HTML rather than ZIP/OOXML .docx.
- **M-052 P2 MANUAL PENDING:** Inspect those files in at least one PDF/Word viewer for layout, pagination, link annotations and accessibility. File-signature checks alone are insufficient.

## Canonical product identity â€” 2026-10-23
- **M-053 P1 SOURCE FIX / CI VERIFIED ON 81155bc:** AI Writer system prompt still identified Markups by markups.vercel.app; changed to canonical https://markups.dev/ and added a unit regression test. This does not alter the chosen AI provider or message content policy.
- **M-054 P2 SOURCE FIX / CI VERIFIED ON 81155bc:** Removed remaining DOCX-promotional footer links from public PDF/HTML guides in favor of the honest Compatibility Lab, keeping the separately marked noindex DOCX explanatory page in source.
- **M-055 P1 EXTERNAL BLOCKED:** Live Awesome Markdown Editors and LibHunt listings still point to the old domain. The owner's existing upstream issue #109 cannot be updated via the connected GitHub app (403 on third-party repository). Requires website editor/authorized GitHub account or independent maintainer review.

## React landing-page refresh â€” 2026-11-03
- **M-056 P2 IN_PROGRESS:** Replace `/landing` with the supplied React design, pre-render it for crawlable build output, keep `/` as the editor, maintain accurate feature claims and metadata, and restore direct links to all six route-inventory guides. Source and copy review are recorded in `runs/2026-11-03-landing-refresh.md`.
- **Acceptance:** production and modular builds; landing typecheck; SEO static and built-page audits; confirm built `/landing` includes substantive pre-rendered copy, matching FAQ JSON-LD, self-canonical metadata, six guide links and the same-host editor CTA. Complete desktop/mobile visual and keyboard review and an authenticated preview check before marking verified. Do not infer indexing or ranking from source/build checks.

## Dependency and execution order
M-001 â†’ M-003 â†’ M-011 â†’ safe preview. M-002 â†’ M-023 â†’ M-011. M-004 â†’ M-001 and M-027. M-005 â†’ M-007 â†’ M-013. M-009/M-010 â†’ M-015/M-016 (credible content). M-013/M-014 â†’ M-031/M-032. M-017/M-018/M-019/M-020 happen ONLY after accurate canonical destination and a working product/preview.

## Branch ownership lock
SEO-engineer: vite.config.js, robots/sitemap/SEO pages, never concurrently edited by anyone else.
App-UX: index.html, public/css/** (freeze during SEO-engineer homepage work).
Content/editorial: SEO comparison and landing copy after engineering feature proof.
QA: tests/e2e/**, scripts/qa/**.
Security/privacy: privacy/terms/cookie-policy copy and CSP reviewed with UX owner.
PM/audit: docs/seo-geo/** and run evidence. All changes must be small independent commits; branch is never force-pushed.

## Workflow for each ticket
Before: assign, verify main and branch SHA, link source and reproducible failing case. During: implementation plus the narrowest passing test, peer review for claims. After: run complete branch tests, preview verification, attach evidence and change ticket TODO to VERIFIED only when proof exists. No fabricated checkmarks.

## Verification refresh â€” 2026-10-24
- **M-011 branch CI: VERIFIED on application SHA `81155bcabd0ef7586529d4cd98d5ef751991eae0`.** GitHub Actions https://github.com/Nir-Bhay/markups/actions/runs/39988242957 passed static SEO, lint, 566 Vitest, both builds, built-page audit, 46 Playwright, PDF/Word downloaded-file signatures and screenshot capture. Every newer head needs its own green run.
- **M-029 stale QA documentation: SOURCE FIXED.** `docs/seo-geo/QA-RELEASE-GATES.md` now distinguishes the successful CI from unverified preview. Evidence: `docs/seo-geo/runs/2026-10-24-branch-qa.md`. Do not mark full G3 preview gate VERIFIED.
- **G3 / M-001 preview portion: BLOCKED by preview authentication.** PR #71 Vercel bot reports READY but read-only `/landing`, `/privacy-policy`, `/seo/compatibility-lab` checks returned `login_required`. Vercel project/deployment API calls for the actual team returned 403 pending owner team grant. Production was not changed.
- **M-036, M-037, M-039: OWNER GSC ACTIONS remain BLOCKED.** **M-049/M-052:** full PDF/Word viewer visual, pagination, link, selection and accessibility tests remain open. CI does not validate those properties.

## M-012 agent navigation refresh â€” 2026-10-25
- Updated `AGENTS.md` in commit `fe1107e55251915e48166cb29a86ae82dd1539ce`: code-review-graph only when available/current, GitHub source fallback, no stale fixed line counts, Vitest + Playwright coverage documented. The two AI-DOCS navigation files already acknowledged Playwright.
- Source read-back passed; **exact-head GitHub Actions Branch QA passed on `5a4923319e6cb493c1cba1fae641496784f82b4c`**: https://github.com/Nir-Bhay/markups/actions/runs/40165629998 (completed success, quality job `121086149084`). Logs confirm 566/566 Vitest, 47/47 Playwright, static audit, lint, both builds and built-page audits passed. Evidence: `docs/seo-geo/runs/2026-10-25-agent-navigation.md`. This is **not** a preview/production pass.

## 2026-10-26 exact-head verification / outstanding gates
- **M-012 VERIFIED for branch-only documentation + CI** at pre-evidence SHA `5a4923319e6cb493c1cba1fae641496784f82b4c`; [successful Branch QA](https://github.com/Nir-Bhay/markups/actions/runs/40165629998) (quality job `121086149084`). Workflow completed successfully: static SEO audit, lint, 566 Vitest, both Vite builds, built-pages audits, 47 Playwright tests and screenshot capture. Commit status also reported Vercel success, which is **not** authenticated preview smoke evidence.
- This backlog evidence edit creates a newer commit; its own exact-head CI must be checked separately before describing the newest head as green. No application source changed here.
- Still open: authenticated Vercel preview G3 (the Vercel API project connection now reads successfully, but preview HTTP/browser pages remain behind login); GSC owner-only M-036/M-037/M-039; viewer-based PDF/Word M-049/M-052; owner privacy/security review; third-party listing M-055. Do not merge or claim indexing/ranking improvements from branch CI.
- **Vercel connection recheck (2026-10-26):** read-only team `nirbhay-987s-projects` `list_projects` returned the actual `markups` project `prj_9rmevkUjnWCKL5GklOCaVKmDa8Wz`, and `get_deployment` returned READY deployment `dpl_3iDf1DUbBNULmq8mbSr9DqVi7EMR` for commit `5a492331`. The previous API 403 blocker is no longer reproducible; do not claim deployment content validated. Browser read-only visits to [landing](https://markups-git-growth-seo-geo-audit-2026-10-nirbhay-987s-projects.vercel.app/landing), [privacy](https://markups-git-growth-seo-geo-audit-2026-10-nirbhay-987s-projects.vercel.app/privacy-policy), and [Compatibility Lab](https://markups-git-growth-seo-geo-audit-2026-10-nirbhay-987s-projects.vercel.app/seo/compatibility-lab) all redirected to **Vercel Login** (final HTTP 200 is login HTML, not Markups route HTTP 200). Authenticated preview access via authorized browser/team session is still required; no protection settings were changed.
- **CI for evidence commit `1cacb1d511716c6b7b90c4b55aa9d85c814b539e`:** push workflow https://github.com/Nir-Bhay/markups/actions/runs/40271213223 was `in_progress` at inspection, PR workflow https://github.com/Nir-Bhay/markups/actions/runs/40271216092 `pending`; recheck final results on latest head before marking CI green.

## Editorial SEO foundation â€” 2026-11-04

- **M-057 P1 IN_PROGRESS:** Add a source-backed `/blog` with the first five original Markdown workflow articles, a comprehensive `/markdown-guide`, matching sitemap and `llms.txt` routes, responsive styling, Vite route inputs, QA manifest entries, and landing-page footer discovery links. Local source and build checks pass; these pages are **not deployed or published**.
- **Acceptance:** supported-runtime CI/build and current SEO/build audits pass; a Markups maintainer reviews technical claims/examples and sources before release (do not invent a named reviewer); preview pages return 200 and are visually/keyboard reviewed; approved deployment; post-release sitemap fetch and GSC inspection. No ranking promise or search-volume claim from the current small sample.
- **Evidence:** `docs/seo-geo/SEO-AUDIT-2026-11-04.md` and `docs/seo-geo/runs/2026-11-04-markups-seo-audit.md`.
- **M-058 P0 TODO / RELEASE ROUTING:** Reconcile current production sitemap with source and repair live route availability before submitting editorial URLs. On 2026-11-04, production sitemap had 10 URLs and omitted live `/landing`; direct checks against 23 source-sitemap URLs found 12 HTTP 404s: four policy routes, `/seo/compatibility-lab`, `/markdown-guide`, `/blog`, and five blog articles. Source build succeeds for these pages; production was not changed.
- **Acceptance:** reviewed deployment includes intended legal/trust/editorial pages; every intended sitemap URL returns the expected public HTML status, with canonical/robots metadata checked; sitemap contains the intended set including `/landing`; owner-only GSC sitemap and URL Inspection checks recorded after release. Do not mark complete based on local build alone.

## Editorial expansion follow-up — 2026-11-04
M-057 now includes ten blog posts and a visible landing Blog section. Both source sitemaps contain 28 URLs. Local build and SEO audits pass; evidence: runs/2026-11-04-editorial-expansion.md. M-058 production routing remains pending release. Earlier 23-URL source counts are historical snapshots before this expansion.

## Blog UX and problem-first editorial update
M-057 now includes 15 articles, search/category library, contents navigation, code-copy controls and accessible process figures. Source sitemaps contain 33 URLs. Evidence: runs/2026-11-04-blog-redesign.md. Production release M-058 remains pending.

## Search readiness recheck — 2026-11-04
- Follow-up: M-059 shared public-page analytics is now SOURCE FIXED with initialization deduplication and static page titles; 12 telemetry tests pass. Production/privacy/account verification remains pending. New troubleshooting CollectionPage links eight solutions; sitemap now 34 URLs, still 15 blog articles. Evidence: `runs/2026-11-04-help-and-analytics.md`.
- M-058 fresh HTTP evidence: 33 built intended URLs; 11 live 200 and 22 live 404; production sitemap 10. Per-page evidence: `runs/2026-11-04-search-readiness/PAGE-INDEXING-TRACKER.csv`. Google index status remains NOT_INSPECTED.
- **M-059 P1 SOURCE FIXED; OWNER LIVE MEASUREMENT TODO:** shared privacy-reviewed telemetry is present for landing/blog/guide, with initialization deduplication and static page titles. Keep URL/content protections; verify real editorial pageviews and activation events in GA4 DebugView after a genuine visit. Production receipt, privacy/account verification and any future CTA instrumentation remain open; never use synthetic production traffic or send document content. Latest account evidence: `runs/2026-11-05-post-deploy-search-console.md`.
- **M-060 P1 IN_PROGRESS:** source-reviewed 1 of 15 articles (`commonmark-vs-gfm-markdown`) against the CommonMark 0.31.2 and GFM primary specifications on 2026-11-05; replaced generic workflow advice with a syntax comparison, focused examples, a mismatch diagnosis and portability checklist. Static SEO audit, production build, and built-page audit pass for this change. Still required: reproduce examples in named renderers, add verified input/output fixtures, and obtain maintainer editorial review for all 15 drafts; do not mark the content program complete from this one article. Evidence: `runs/2026-11-05-content-review.md`.
- Owner action steps: `GOOGLE-ANALYTICS-SEARCH-CONSOLE-OWNER-GUIDE.md`; priorities: `SEARCH-REMAINING-WORK-2026-11-04.md`; outreach plan: `BACKLINKS-DISTRIBUTION-PLAN.md`; content inventory: `CONTENT-KEYWORD-MAP.md`. No external writes or deployment performed.
