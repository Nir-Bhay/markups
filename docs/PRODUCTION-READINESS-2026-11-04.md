# Production readiness decision — Markups

> **Follow-up:** The production crash and additional source defects were fixed after this initial evaluation. See [current fixes, score and remaining gates](PRODUCTION-FIXES-AND-SCORE-2026-11-04.md). The observations below are historical, not the current unresolved-crash status.

**Date:** 2026-11-04, Asia/Kolkata. **Decision: NO-GO for releasing the current candidate.**

The release build compiles, but its editor fails at runtime with `ReferenceError: Prism is not defined`. In a fresh browser opening the independently built production files, `window.editor` is absent and the preview is empty. This is a confirmed release blocker. Earlier “build passed” statements established successful compilation/static contracts, not production browser startup. They are insufficient for a release approval.

The existing public site is a different deployment. This report does not claim its root editor has this crash. Its freshly checked route inventory is incomplete relative to current source: 34 intended URLs, 11 live HTTP 200 and 23 live HTTP 404; production sitemap has 10 URLs.

## 1. What was actually checked

Read-only evaluation of source, tests, local browser behavior, current public routes, dependencies and deployment configuration. No feature fixes, production deployment, OAuth grants, external writes or user-data migrations were performed. Temporary test configuration/builds and this report were created. Source navigation followed AGENTS/AI-DOCS; graph tooling was unavailable.

| Check | Current evidence | Practical limit |
|---|---|---|
| Unit suite | 105 files / **724 tests passed** | Run under installed Node 25.2.0, outside supported engine range |
| Supported-runtime focused security/telemetry suite | **25 tests / 3 files passed under Node 24.22.2** | Not the entire supported-runtime regression suite |
| ESLint | Pass | Configured source scope only; not every public/static script |
| Landing TypeScript | Pass | Does not establish browser rendering or accessibility |
| Production and modular builds | Both compile successfully | Modular is not the chosen production entry and still needs parity evidence |
| Supported Node 24 production build | Compiles to `.tmp/readiness-production-20261104` | Fresh browser startup **fails with Prism undefined** |
| Static build SEO audit | 40 HTML pages / 34 sitemap URLs; 0 errors/warnings | Not runtime, Google indexing or production content proof |
| npm dependency audit | Full and production-only audits: **0 reported vulnerabilities** | Known advisory snapshot, not a security certification or proof deployed dependencies match |
| Dev-server deep-preview retry on Node 24 | **13/13 fixture suites, 52/52 checks passed** | Demonstrates dev behavior; does not rescue broken bundled output |
| Initial dev browser suite | Not green; dev dependency imports invalidated and stale landing selectors fail | Do not count environment-contaminated diagram/export failures as independently proven functional defects |
| Production-output browser probe | Independently reproduced crash on load and reload in a fresh Edge session | **Confirmed blocker**, not a dev-cache failure |
| Built-output feature suite | Selected deep-preview/export/storage/share/smoke suite started; startup-dependent cases failed; stopped after the common root error was reproduced | No 18-test pass claimed; fix startup before broader built E2E |
| Live routes | 34 intended source URLs: 11 HTTP 200 / 23 HTTP 404; live sitemap 10 | A 200 response does not prove Google indexing |

Raw local logs are in the system temp directory with prefix `markups-readiness-`; the durable HTTP worksheet is `docs/seo-geo/runs/2026-11-04-search-readiness/`. Browser screenshot: `output/playwright/readiness-built-editor.png`. Test failure contexts are under `test-results/readiness-built-production/` and `test-results/chromium-production/`. Temporary build/preview config are under `.tmp/`.

## 2. Exact blockers and required actions

### R-01 / P0 — production editor bootstrap crashes

**Reproduction:** build using Node 24.22.2 with `node_modules/vite/bin/vite.js build --outDir .tmp/readiness-production-20261104`, serve that output using Vite preview, and open `/` in a fresh browser. Console reports `ReferenceError: Prism is not defined` from `assets/highlight-vendor-Bdip0EZY.js:2:512`. Reload reproduces it. The preview remains empty and `typeof window.editor?.getValue` is not a function.

Relevant source: `src/core/markdown/index.js:15` imports Prism; lines 24–41 import side-effect language components; `vite.config.js:109` groups Prism in `highlight-vendor`. The emitted chunk contains language code referencing global `Prism`. Import/global initialization ordering is the investigation target; the root cause must be verified before selecting a fix. Do not just suppress the exception or remove syntax highlighting without checking supported languages.

**Done when:** production-output browser loads with no uncaught startup error; editor accepts typing; preview updates; JavaScript/TypeScript/Python and other supported fences highlight; Mermaid/math still render; actual PDF/Word downloads work; those checks run against the built production entry under a supported Node version.

### R-02 / P0 — the deployed route set does not match the candidate

Fresh crawl shows **23 intended URLs return live 404**. These include legal/trust pages, Compatibility Lab, editorial pages and the troubleshooting hub. Source HTML exists for all 34; production sitemap still lists only 10. See the CSV for the exact URL list. Publishing the broken candidate is not the solution; resolve R-01 first, then release a reviewed build and repeat every HTTP/content/canonical check.

**Done when:** approved deployment SHA is recorded; each intended public route returns the correct HTML instead of a login/editor/error fallback; sitemap lists the deployed canonical set; legal routes and policy text are available and correct. No deployment was performed here.

### R-03 / P1 — current release evidence is not green

The previous successful CI/browser reports predate recent landing/editorial changes. Fresh landing tests still require `.hero h1` and `.editor-frame`; current React source uses `.hero-section` and a different hero visual. All four landing viewport cases in the diagnostic dev run failed on the obsolete H1 selector. That is a confirmed test-contract defect, not proof that the visible hero is missing.

The normal E2E runner checks `/src/main.js` or `/src/main.modular.js` and starts **Vite dev**. It cannot establish that bundled output starts correctly; that is exactly the gap exposed by R-01. Also, `.github/workflows/branch-qa.yml` push filters list older branches, not current `Nir-Bhay/deployment-readiness-fixes-2026-11-03`; a PR to main or explicit workflow dispatch is needed unless filters change.

**Done when:** update landing assertions to accessible/current semantics; isolate Vite caches or avoid concurrent dev-server invalidation; add built-output startup and critical journeys to CI; run all required checks on the exact release SHA under Node 24/another declared supported version. Retain at least one real browser artifact and treat compilation separately from runtime.

### R-04 / P1 — production privacy/telemetry acceptance is incomplete

Shared editorial telemetry is now source-wired and deduplicated; focused tests pass. Production GA4 event receipt and real payloads are unverified. Current collection policy intentionally skips localhost/preview, fragment URLs and unsafe query strings. Do not remove those protections merely to generate data.

**Done when:** review notices/consent behavior for the intended deployment audience; inspect actual network requests for clean URLs, share links, OAuth callbacks and custom queries; verify no draft text/title, keys, filenames or share payload enters analytics; validate one public-pageview/title and genuine `editor_start`/`export_completed` flows; verify duplicate tags are absent. The owner GA4/GSC runbook has exact account steps. No claim of legal compliance is made.

### R-05 / P1 if offered — cloud/provider features are not launch-ready

Local source has gated Appwrite/Drive/GitHub paths and tests using mocks. Latest saved Appwrite account evidence (`docs/appwrite/MCP-STATUS-RECHECK-2026-11-04.md`) says project `markup` was created but platform writes returned HTTP 402 `team_read_only`; tables/functions/platform configuration were not provisioned. This report did not refresh that external account state. Real provider credentials and production OAuth round trips are not verified.

**Done when offered:** restore Appwrite write access through the owner/support path; provision the reviewed schema/functions/platforms; put server secrets only in server settings; configure exact OAuth origins/callbacks; test auth, per-user authorization, quotas, account switching, revocation, expired tokens, GitHub stale-SHA conflicts, controlled writes, deletion/recovery and separation from local drafts using disposable accounts.

**Limited local-editor launch option:** keep these features visibly unavailable and do not advertise cloud backup or provider sync as available. Cloud setup is then not a dependency for ordinary local editing. This does not waive R-01/R-02/R-03.

### R-06 / P1 — data-recovery, browser and export acceptance remains partial

Source includes quota-aware storage failures, autosave status and local recovery mechanisms. Tests exist for storage quota and share import. Local browser storage is not an external backup; browser deletion/eviction, private mode and device changes still affect it.

**Done when:** after startup is repaired, verify real production-output note creation, rapid tab switching, reload, failed/quota-exceeded saves, import failure, trash/restore and version recovery; confirm failed persistence never shows “saved”; exercise offline warm/cold startup and a service-worker update with an unsaved draft. Offer a clear backup/export route and accurate data-loss guidance.

PDF output is intentionally raster/image-based and Word output intentionally HTML `.doc`; those are disclosed format limitations, not automatically defects. Download signatures do not prove pagination, selectable text, link annotations, equation legibility or accessibility. Open representative short/long/mixed-media files in actual PDF/Word viewers before making those claims. Never call the current Word output native `.docx`.

### R-07 / P1 release assurance — cross-browser/security review remains incomplete

Prior Firefox blank-page probes crashed before app navigation on this host; no new Firefox/WebKit application pass is claimed. Successful Chromium dev tests do not imply Safari/mobile persistence, export and share compatibility. Test supported browser versions on a working environment and state the actual supported scope.

Sanitization/endpoint/security tests and zero npm findings are positive evidence. Remaining policy issues include `unsafe-inline`, `unsafe-eval`, broad HTTPS connections and external script sources. This is a known allowance, not proof of an exploitable XSS. Inventory actual dependencies/custom-provider requirements and experiment with report-only tightening before enforcing a change. Current meta CSP also emits invalid-source warnings for `about:blank` in frame/child directives; clean those tokens and verify export/provider frames rather than assuming the directives work as intended.

AI keys can be session-only or deliberately persisted in browser storage. Persisted browser storage is not encrypted application storage. Confirm the choice and clear/revoke behavior in real UI; do not describe BYOK as risk-free. Live AI streaming/cancel/timeout/429/provider-error handling needs a disposable key test before claiming every provider works.

### R-08 / P1/P2 — release operations and performance proof are incomplete

Record the chosen entry, exact SHA/build env, preview acceptance, owner release approval, previous known-good deployment and rollback steps. Verify uptime/error monitoring and who receives alerts. A performance budget or large bundle size is not a measured LCP/INP/CLS result. Current Lighthouse/CrUX evidence is unavailable; prior PSI was rate-limited. Measure the real editor/landing and representative article on mobile, then fix observed bottlenecks.

If Docker is offered as a supported deployment: its image currently copies the static build into default nginx. Vercel security headers and AI proxy rewrites do not automatically apply in nginx. Verify matching headers, routes, proxy behavior and the chosen cloud configuration, plus a real image build/run. If only Vercel is supported for this release, state that scope instead of requiring an unoffered Docker path.

## 3. Feature-by-feature decision

| Area | Status | What remains |
|---|---|---|
| Built production editor | **Blocked** | Prism startup crash |
| Dev editor rendering/Markdown features | Strong unit/dev evidence | Revalidate compiled output, all supported languages and critical flows |
| Local notes/autosave/quota | Source/tests present | Built browser recovery/offline/update and failure acceptance |
| Sharing | Source/tests present | Built cross-browser payload/size/error/reload checks; public links disclose content |
| PDF/Word | Explicit limitations | Built downloads after startup fix, native viewer inspection |
| Blog/guide/hub | Local pages built | Production release, original-example/editorial review, index inspection |
| Analytics | Source fixed/focused tests pass | Actual production network/DebugView/privacy acceptance |
| Cloud/Drive/GitHub | Unavailable/gated | External setup and controlled live acceptance if included |
| AI providers | Endpoint/key controls present | Real configured-provider acceptance, consent/payload/error/abort checks |
| Dependency hygiene | Current local audit clean | Confirm exact released lockfile/bundled assets; ongoing monitoring |
| SEO/GEO | Static foundations pass | 23 live 404s, actual index/canonical status and crawl/analytics evidence |
| Full software release | **NO-GO** | Resolve required gates above |

## 4. Recommended order

1. Fix R-01 and prove a fresh built browser can edit/preview; do not deploy this candidate first.
2. Repair outdated landing tests and add real built-output CI. Run the exact candidate on a supported runtime.
3. Complete local persistence/export/share/security and chosen-browser acceptance. Keep optional providers disabled unless their live setup is accepted.
4. Review privacy/network behavior and finish real production performance/operations acceptance on an approved preview.
5. Deploy only the reviewed candidate, verify its SHA and all 34 intended routes, then check GA4/GSC using the separate owner runbook.

This evaluation does not authorize a deployment. It also does not require implementing every possible feature: optional unavailable features can remain gated. The unhandled built-editor startup error cannot be accepted for a local-editor release.
