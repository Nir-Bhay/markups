# Master backlog — Markups 2026-10 growth audit

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
| M-012 | P1 | Docs | Fix stale AGENTS / AI-DOCS navigation assertions | documented code map matches tree; outdated 'no E2E' gone |
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

## New confirmed Search Console/public-release tickets — 2026-10-23
- **M-036 P0 EXTERNAL OWNER ACTION:** Remove incorrectly submitted robots.txt from Search Console Sitemaps list (not from website); Windsor cannot write.
- **M-037 P1 EXTERNAL OWNER ACTION:** Inspect actual sitemap.xml warning, validate branch sitemap on production after approved release and resubmit.
- **M-038 P1 BUILD:** Stop publishing the internal global-growth-playbook as public HTML; replace cheatsheet link; built artifact must not exist.
- **M-039 P1 INDEX:** Run GSC URL Inspection for root, landing, primary SEO guides and legal routes, save reasons privately.
- **M-040 P1 ANALYTICS:** Keep site vs URL impressions separately; ensure GA4 connected account is actually Markups before using counts.
- **M-041 P1 CONTENT:** Publish original technical documentation and pursue genuine third-party discovery, not promised one-week #1 rankings.
## Compatibility Lab implementation — 2026-10-23
- **M-042 P1 CONTENT/QA:** Publish a real, downloadable sample Markdown design note with Mermaid flowchart, table, KaTeX and code. Distinct learning intent; no fabricated benchmark ranking.
- **M-043 P1 QA:** Assert real editor can render sample Mermaid SVG, KaTeX, table, code; browser route and fixture HTTP 200.
- **M-044 P1 INDEX:** Add approved canonical lab route to sitemap and direct landing / resource links. After reviewed production release inspect Google-selected canonical and index status; avoid claiming search visibility before Search Console confirms.
- **M-045 P2 RESEARCH:** Compare other products only when independently tested under the same fixture with screenshots, dates and version/methodology; this first lab is NOT an untested cross-product comparison.

## Dependency and execution order
M-001 → M-003 → M-011 → safe preview. M-002 → M-023 → M-011. M-004 → M-001 and M-027. M-005 → M-007 → M-013. M-009/M-010 → M-015/M-016 (credible content). M-013/M-014 → M-031/M-032. M-017/M-018/M-019/M-020 happen ONLY after accurate canonical destination and a working product/preview.

## Branch ownership lock
SEO-engineer: vite.config.js, robots/sitemap/SEO pages, never concurrently edited by anyone else.
App-UX: index.html, public/css/** (freeze during SEO-engineer homepage work).
Content/editorial: SEO comparison and landing copy after engineering feature proof.
QA: tests/e2e/**, scripts/qa/**.
Security/privacy: privacy/terms/cookie-policy copy and CSP reviewed with UX owner.
PM/audit: docs/seo-geo/** and run evidence. All changes must be small independent commits; branch is never force-pushed.

## Workflow for each ticket
Before: assign, verify main and branch SHA, link source and reproducible failing case. During: implementation plus the narrowest passing test, peer review for claims. After: run complete branch tests, preview verification, attach evidence and change ticket TODO to VERIFIED only when proof exists. No fabricated checkmarks.
