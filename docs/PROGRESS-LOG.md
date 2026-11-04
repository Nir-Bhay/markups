# Progress Log — single source of truth for where we are

## 2026-09-08 — Audit complete, execution begins
- Audits: `docs/PRODUCTION-AUDIT-REPORT.md` (+§11 recheck addendum),
  `docs/CODE-REVIEW.md` (+§12 recheck addendum), `docs/IMPLEMENTATION-PLAN.md`,
  `docs/WORKING-PROTOCOL.md` (this run).
- Tree state: parallel session active (30 modified files, `AI-DOCS/`, `tests/e2e/smoke.spec.js`,
  `storehouse.test.js` new). Already-fixed by them: flags, EVENTS.ERROR, focus/linter imports,
  toast textContent, backlinks wiring, `#tabs-list`, first smoke spec.
- Still open P0: `storageService.initialize` missing · `downloadBlob` crash ·
  `#toc-container`/`#search-container` mismatch.
- Next: Phase 0 (diff review + baseline) → Phase 1 Gate 0.

## Phase 1 Gate 0 — COMPLETE (2026-09-08, late session)
- 1.1 `storageService.initialize()`: added sync non-throwing probe
  (`core/storage/index.js`) + `storageService.test.js` (4 tests). Modular boot no longer throws.
- 1.2 events guardrail: `events-existence.test.js` scans all of src/ — MISSING=0 independently
  confirmed (subagent catalog rechecked); 4 alias pairs locked. Fixed 2 self-bugs in the test
  (Windows path skip, self-match on comment).
- 1.3 containers: `app.js` toc→`#toc-sidebar`, search→`#search-overlay`; `main.modular.js`
  all 9 overrides → real IDs (snippets→`#snippets-dropdown`; `#snippets-button` absent from
  HTML — toggle UX logged as Phase 6 follow-up, palette actions already null-guarded).
- 1.4 `downloadBlob(blob, filename)` added to `utils/file.js` (mirrors `downloadFile`);
  docx import resolves (proven by clean modular build).
- EVIDENCE: eslint 0 errors · targeted 34/34 · full suite 54 files, 361 passed (62s) ·
  `npm run build:modular` clean (2m19s). Note: modular build overwrote local dist/ (gitignored).
- Next: Phase 2 data integrity (backup docs first).

## Phase 2 data integrity — COMPLETE (2026-09-08, late session)
- 2.0 mapped live pipeline (subagent, rechecked): autosave inert in default build
  (never initialized/fed); saveCurrentDoc does IDB+tree+mirror+tabs+tree-sync per fire.
- 2.1 autosave false-saved: early-return false + no saved signal when no active note;
  NaN id re-queues content. +2 tests (5/5 in file).
- 2.0 dirty-check: `lastSavedSnapshot` Map skips full fan-out when unchanged.
- 2.2 title lock: `deriveDocumentTitle()` exported from markdown service (+5 tests);
  manual renames (tab + explorer) set `titleLocked`; load-time heuristic preserves
  old manual titles. New docs stay auto (locked=false).
- 2.3 quota: evicted docs' IDB rows deleted (recursive + allSettled, never throws) +
  snapshots pruned. Previously array-slice only (tabs↔explorer fork).
- 2.4 reorder: Dexie transaction (all-or-nothing, false on rollback) +2 tests (6/6 file).
  Migration proof test: literal keys migrate (1 note), MD5-shim keys ignored (0) — locked
  as accepted behavior (shim path self-consistent, low risk). beforeunload: sync
  localStorage-mirror pagehide flush added (IDB can't finish during unload).
- SCOPING: full single-writer unification DEFERRED to Phase 6 (dual entries + parallel
  session conflict risk). Dirty-check removes the cost; correctness fixed now.
- EVIDENCE: eslint 0 errors · full suite 54/54 files, 369/369 passed (53s). One transient
  stats-import timeout in a loaded 185s run — 10/10 alone, then full re-run green. Flake, not regression.
- Next: Phase 3 correctness (wrapSelection first).

## Phase 3 correctness — COMPLETE (2026-09-09 early session)
- 3.1 wrapSelection: exact-adjacency toggle (non-destructive wrap on boundary
  crossing) + `toolbarWrap.test.js` (6 tests, faithful fake Monaco model).
  Proven: old code FAILS the regression test (stash check), new code 6/6.
- 3.2 TXT single pipeline: `services/export/txt.js` canonical converter; all three
  main.js call sites delegate (preview === download). Bonus: image-before-link
  ordering bug fixed (was `!alt (url)`). +7 tests.
- 3.3 word count: goals + toolbar popover → `extractStats`; paragraphs regex aligned
  (`/\n\s*\n/`); +2 tests. Footer already matched (M5).
- 3.4 search double-bind: VERIFIED no live conflict (main.js never imports
  searchManager) — scoped to Phase 6, no deletion per protocol §5.
- 3.5 typewriter dedupe (one center per move), fullscreen `editor.layout()` on all
  four paths, mermaid `securityLevel:'strict'` on both inits.
- DEFERRED (logged, not forgotten): callout multi-line prefix, table keyboard
  default, link/image URL-part selection, slugify unification, KaTeX engine pick —
  UX-visible, need browser proof; do with manual QA in Phase 6/8.
- EVIDENCE: eslint 0 errors · full suite 384/384 passed (80s).
- Next: Phase 4 security hardening (AI settings escaping, key consent design).

## Recheck-all-phases (2026-09-09) — 6 review fixes applied
- Fresh-eyes agent caught 6 real issues in my Phase 2-3 work; all fixed + tested:
  1. Autosave NaN path left status stuck at `saving` → reset to `unsaved` (+test).
  2. Tab rename persisted localStorage-only → now `void saveCurrentDoc()` (IDB+tree).
  3. Escape-cancel locked titles → `renameCancelled` guard.
  4. Reorder `false` ignored by both callers → error toast (+await on tab-drop).
  5. Snapshot leak on close/delete → `lastSavedSnapshot.delete` in both.
  6. Typewriter orphan on editor recreate → defensive re-bind on enter.
- Marker script: 14/14 present. Full suite: 385/385 green (one transient single-fail
  in a loaded run, clean on re-run — flake).
- Coordination notes for parallel session: MERMAID_CONFIG `loose` contradicts code
  `strict` (their file, not touched); quick-export now follows modal checkboxes
  (intended output change); their `chrome.js` exports must stay stable (my imports).
- Next: Phase 4 security hardening.

## Phase 4 security hardening — COMPLETE (2026-09-09)
- 4.1 VERIFIED pre-fixed (escapeHtml on all settings `value=`); no change needed.
- 4.2 AI key safety: `isCustomEndpoint()` + explicit `confirm()` before a key
  follows a newly-typed custom host; `setConfig` rejects non-http(s) endpoints;
  session-only keys (`setSessionApiKey`/`clearSessionApiKey`/`isSessionKey`,
  memory-first, persisted copies removed) + settings checkbox wiring. +8 tests.
- 4.3 import: extension allowlist enforced, `importFromURL` http(s)-only + caps
  (found parallel session's own content-length/Blob caps mid-edit — kept their
  byte caps + my scheme gate + allowlist; removed only my redundant length check
  after verifying coherence). +4 tests.
- 4.4 SECURITY.md: date, connect-src allowlist truth, AI-key + import rows.
  (§8 deps already refreshed by parallel session.) CSP `report-to` DEFERRED —
  needs a reporting backend; logged.
- EVIDENCE: eslint 0 errors · full suite 405 pass + 1 known stats-import flake
  (10/10 isolated, 3rd occurrence under load — infra flake, monaco transform).
- Next: Phase 5 dead-code removal (safe order).

## Phase 0 — COMPLETE (2026-09-08, late session)
- Diff reviewed (subagent, rechecked): parallel session fixed flags, event aliases (~25 keys),
  focus/linter imports, toast textContent, explorer escaping, backlinks split, `#tabs-list`,
  global error handler in main.js, Storehouse quota returns, find+replace overlay, vim bundling.
  Risks noted: CSP meta/headers drift, vim budget raise, header-tabs scope loss, Storehouse callers
  unchecked, `.windsurfrules` deleted. Full summary in subagent report this session.
- BASELINE (evidence): `npx vitest run` → 52 files, 355 passed, 78.34s (1 harmless monaco
  sourcemap warning). `npm run build` → clean in 1m39s; main 1137.53KB, monaco 2287.09KB.
- Phase 1 Gate 0 remaining: storageService.initialize · events test · toc/search containers ·
  downloadBlob. Flags/ERROR/toast/backlinks/tabs-list CLOSED by parallel session (verified).

## 2026-10-27 — Appwrite research and review proposal

- User requested an empty `Markup` Appwrite project and research documents before product implementation, with cloud user content opt-in only.
- Authenticated Appwrite account reads confirm GitHub Student Pack `auto-1`, $0, two projects, per-project 150 GB storage / 2 TB bandwidth / 750K writes. Exact account expiry is not returned. Public Education terms now differ from GitHub Pack duration wording; permitted use and expiry require clarification.
- Created `docs/appwrite/README.md`, `ACCOUNT-AND-LIMITS.md`, `FEATURE-GAP-REVIEW.md`, `ARCHITECTURE-AND-ROLLOUT.md` and sanitized `account-evidence.json` on the existing sync branch.
- Source review confirms no existing Drive/GitHub sync/auth implementation; production history lacks document identity and shared text omits local image payloads. Reviewed Appwrite contribution, consent boundaries, provider scopes, quota races and downgrade risks. Two read-only agents covered code and primary-source research; lead rechecked key source paths. No code-review-graph connection was available.
- Proposed, not implemented: 5 MiB per-user text/version quota and a 25-user pilot; foreground provider Save/Open first. Runtime POCs and SDK wiring await owner review.
- Project creation remains pending: the exposed `appwrite_call_tool` rejected the write and required `appwrite_call_write_tool`, absent from enabled tools. Owner said they will enable it. Account context readback still shows only existing `yoga`; no document uploads/resources/API keys were created.
- Verification scope: documentation/source/account review only; product tests were not rerun for documentation-only changes. Next: expose the write gateway, create/read back empty project, then owner review of the proposal.

## 2026-10-28 — Opt-in cloud/provider implementation

- Continued on `Nir-Bhay/sync-main-seo-geo-2026-10-25`; production `main` was not changed or deployed.
- Implemented the optional Appwrite client/account UI and disabled-by-default cloud Function source, schema/provisioning manifest, selected text-note API, per-note consent, quota/revision/idempotency rules and bounded deletion flow. Missing public configuration keeps sign-in/cloud storage unavailable and does not affect local editing.
- Implemented foreground Google Drive and selected-repository GitHub adapters. Credentials/app registrations are absent; no real user/provider account or file operation was used.
- Implemented note-scoped version-history restore, binary local image storage in IndexedDB with legacy recovery, and bounded portable image handling for share/export. Cloud backup explicitly rejects local image data.
- Verification completed: 96 unit-test files / 652 tests, ESLint (0 errors), production build and modular build. Real Appwrite/Google/GitHub POCs remain outstanding.
- Appwrite project creation remains blocked by the unavailable `appwrite_call_write_tool`. Existing account read access shows only the old `yoga` project; no project/resources/API keys/data were created or deployed.
- Updated the editor FAQ, landing FAQ/schema and privacy policy to distinguish local editing from optional account/provider actions, without claiming the current development build has a live Appwrite backend.
- Targeted Playwright checks now pass: local document recovery under localStorage quota, IndexedDB image insert/reload under localStorage image quota, and Appwrite/Drive setup-required state with zero backend requests on boot/open. Verified the same setup-required panel in the in-app browser.
- The first E2E run exposed a sanitizer bug: object URLs were dropped from image `src`. Added an exact allowlist for current-document local Blob image URLs on `<img src>` only and tests confirming links/unlisted URLs stay blocked. Added an image-input readiness marker to make the end-to-end interaction deterministic and waited for local note autosave before reload.
- Final local verification: 653 unit tests passed across 96 files; ESLint reports 0 errors; production and modular builds both pass when run sequentially; all 50 Playwright end-to-end tests pass in a serial run. Parallel Playwright first exposed the sandbox's denied artifact paths and startup timing; QA artifacts now stay in ignored `test-results`, and the cloud test waits for its control binding.
- `npm audit --omit=dev` could not reach the npm registry audit endpoint in this environment and returned no vulnerability data; no clean audit result is claimed.
- Appwrite readback on 2026-10-28 confirms the organization still has only `yoga`. The authorized `Markup` project create call was rejected with `INVALID_ARGUMENT` because the MCP requires the unavailable `appwrite_call_write_tool`; no project or resource was created.
- Remaining gate: review the final branch diff and, when Appwrite write access and provider credentials are available, complete live project/schema/auth/provider proof. No production deployment or push was performed.

## 2026-10-28 — Follow-up cloud/provider research

- Rechecked the implementation against current official Appwrite Functions, TablesDB row/transaction, Google Drive v3 and GitHub REST documentation. Appwrite synchronous `createExecution` supports custom request headers and returns the function response; the SDK forwards the signed-in user's `x-appwrite-user-jwt`. TablesDB's row transaction support, commit/rollback calls and conflict behavior align with the local REST adapter. OAuth state is supported by the installed Appwrite SDK's typed API.
- Google Drive v3 supports multipart `files.update`, but its official v3 docs do not establish `If-Match` support or stale-ETag response behavior. The source audit found the previous adapter could overwrite if the precondition were ignored. Existing-file updates are now disabled by default and the panel saves a separate copy; unit tests cover the fail-closed path. GitHub documents the Contents API limitation above 1 MiB and Git Blobs support up to 100 MB; the adapter uses the blob endpoint for content missing from the Contents response and caps files at 5 MiB.
- No source mismatch was found in Appwrite auth/function/transaction behavior. The Drive documentation gap resulted in a code change. This review is not live-service proof. In-app browser inspection shows Appwrite and Drive credentials are absent in the running build; provider actions remain unavailable.
- Focused verification: Appwrite client, cloud REST/service and connector suites passed (3 files, 38 tests). Earlier full branch verification remains 653 unit tests, lint/builds and 50 serial E2E tests; no full suite was rerun during this docs-only audit.

## 2026-10-28 — Full recheck and owner checklist

- Added `docs/appwrite/RECHECK-AND-OWNER-ACTIONS.md` as the single gate-by-gate record of local implementation, live-service blockers, credential placement, owner decisions, acceptance evidence, and later-scope features.
- Rechecked branch/status, Appwrite account context, function/client environment names, provider code paths, schema, and prior research. Appwrite still lists only the existing `yoga` project; the project/function/table write gateway is not exposed. No remote resources were changed.
- Fresh verification after the toolbar guard: 654 unit tests passed across 96 files, lint passed, production build passed, and modular build passed. All 50 full E2E cases reported `ok` before the fix; Playwright remained alive after the last case without a final summary, so that invocation was interrupted. It logged a Monaco toolbar `Illegal value for lineNumber` during stress preview.
- Guarded stale/out-of-range Monaco selection line numbers and added a stress-E2E assertion for this runtime error. After the fix, the toolbar unit suite (9 tests), lint, production build, and modular build pass. The focused stress E2E reports `ok` with zero stress blockers and no matching console error, but Playwright still stays alive after its final case and needs interruption.
- The previous in-app preview reported a local image-database warning; this turn’s Browser Use browser could not access the owner machine’s loopback URL, although a local HTTP probe to port 5174 returned 200. Visual confirmation in the owner’s in-app tab remains open.
- Retried `npm audit --omit=dev`; npm could not reach the registry endpoint, so dependency vulnerability status remains unknown. Appwrite OAuth, ACL, transaction, quota-race, deletion, Drive, and GitHub flows remain untested against live services.

## 2026-10-28 — Account-bound cloud recheck

- Rechecked every browser call to the Appwrite cloud and connector Functions. The client now requires the UI-captured Appwrite user ID, creates one JWT, verifies that exact JWT against `/account`, and refuses a mismatch before function execution. Cloud document reads/writes/deletes, quota calls, account deletion, GitHub API calls, and GitHub identity linking pass the captured user ID through. Account changes clear cloud list/usage, GitHub selection, and in-memory Drive tokens.
- Added regression coverage for absent expected identity, a JWT that resolves to another user, OAuth identity-link mismatch, and GitHub account binding. Full unit suite: **659 passed across 96 files**; focused cloud/provider/client suites: **44 passed**. ESLint and `git diff --check` pass.
- Production and modular builds pass. Local Playwright smoke on the owner’s `http://127.0.0.1:5174/` passes cleanly: no Vite error overlay, page errors, image-storage warning, or backend requests before setup. The in-app tab is visible in browser inventory, but direct CUA access returns `browser.user is unavailable`; the earlier port-5173 Monaco worker overlay did not reproduce on port 5174.
- The account-bound calls are source/mocked-tested only. Live account switching, Appwrite JWT forwarding, ACLs, transactions, quotas/deletion, Drive and GitHub still require the Appwrite project and provider setup listed in `docs/appwrite/RECHECK-AND-OWNER-ACTIONS.md`. The npm audit endpoint remains unreachable; no clean dependency audit is claimed. No branch push or deployment was performed.

## 2026-10-28 — Editor telemetry privacy hardening

- A focused privacy audit confirmed two source risks: Clarity replay was loaded over the editor DOM without an explicit boundary, and GA4's default page view could include Appwrite OAuth query values before the Cloud panel removed them. Official Clarity documentation also notes that CSS/style content is outside its masking behavior.
- Removed Clarity replay from the editor and removed its script/connect origins from both the editor CSP and Vercel CSP. Kept `data-clarity-mask="True"` on the full body as defense in depth if replay is accidentally reintroduced.
- Replaced inline analytics loaders with a tested bootstrap. GA4 receives a static title, path without query/hash, and origin-only referrer; Google Signals/ad personalization are disabled. It only allows bounded UTM source/medium/campaign parameters, while OAuth/other query values and all fragments suppress trackers. Vercel Insights is loaded only on the canonical clean URL. Product events remain limited to editor start and export format and now require the bootstrap allow flag.
- Updated the privacy policy and F12 gap/recheck docs with exact behavior and remaining production proof. References: [Clarity masking docs](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking) and [GA4 page-view docs](https://developers.google.com/analytics/devguides/collection/ga4/views).
- Verification on the final telemetry source: **666 unit tests across 97 files**, 11 focused telemetry tests, lint, production build, modular build, and local Chromium cloud-setup smoke (1/1) passed. The local smoke sees no Vite overlay, page errors, storage warning, external telemetry script, or backend call. Production network proof remains gated on an approved deploy; no push or deploy occurred.

## 2026-10-28 — Project-wide recheck and owner gates

- Refreshed Vercel project, deployment and alias data. `markups.dev` points at a READY production deployment from `main` commit `9458092d60aa678e2bc8253f205bb56717a3fca6` (2026-10-06). The current working branch has a READY preview for `b5d5c666330c908154b4b6278fb9105097ecb03a`; this turn's uncommitted changes were not deployed. A newer READY preview is on `growth/seo-geo-audit-2026-10`, not production.
- Rechecked Appwrite project inventory: only `yoga` exists. Retried the explicitly authorized empty `Markup` project creation; the exposed wrapper rejected the write because `appwrite_call_write_tool` is not available. No project or resource was created.
- Read-only stable-note-identity trace: keep numeric note primary keys and add UUIDs only as a new immutable field, with a populated-v3 migration test. Existing deletion leaves `note_versions` and `cloud_links` orphans; cleanup/tombstones need distinct tests and lifecycle policy.
- Fresh checks: **666/666 unit tests**, lint, production build, modular build, and focused cloud setup E2E (1/1) passed. Full E2E reached the final video customization test but did not return; the isolated test also hung beyond 80 seconds and was interrupted. `verify:health` stopped at the npm audit gate because the registry endpoint was unreachable; separately run tests/builds passed. No clean dependency audit or full-suite completion is claimed.
- E2E follow-up narrowed that issue: the isolated `video-customize` test passes 1/1 and exits cleanly when it reuses the already-running `5174` server. With a Playwright-managed Vite server, browser context and browser close, but the runner remains open without a final report. This points to managed-server/runner teardown on Windows; it still needs a clean full-suite run.
- Full-suite confirmation: reused-server run completed **50/50 E2E tests**, including `video-customize`, in 3.9 minutes and exited with code 0. Only the Playwright-managed Vite server shutdown path remains to clean up; the complete application E2E suite passes when reusing the existing local server.
- Implemented the safe local-identity slice: Dexie v4 adds and backfills immutable note UUIDs without changing numeric primary keys; create/bulk migration paths generate IDs and migration recovery JSON contains the same IDs as stored notes. A populated-v3 upgrade test preserves `note_versions`, `file_nodes`, and `cloud_links` references. Final verification after this change: **668/668 unit tests**, lint, production/modular builds, and **50/50 E2E (4.8 minutes, clean exit)** passed.
- Local note deletion still leaves history and cloud-link metadata. An attempted automatic cascade was rejected by approval review because it would irreversibly delete user data without an explicit retention choice. No cascade was applied; the owner checklist asks whether these records should be purged or preserved for recovery. No Appwrite project/resources were created and no push/deploy occurred.
- Expanded `docs/appwrite/RECHECK-AND-OWNER-ACTIONS.md` into the master branch/deployment, implementation and owner checklist. Broader historical SEO/PWA/a11y findings remain clearly marked as not all re-measured in this pass.
- Follow-up verification fixed the Windows Playwright teardown by running Vite as a direct child from `scripts/run-e2e.mjs`; production browser E2E now completes **50/50, exit code 0, 3.8 minutes**, with stress blockers 0. The modular script uses the same lifecycle wrapper.
- Modular entry check caught a stale named import in `src/app.js`; aliasing the actual `showLoading`/`hideLoading` exports fixed boot. Added dev-only editor/document diagnostic hooks for the shared E2E harness. Modular build passes; editor-shell smoke passed 1/1. Its Mermaid compatibility fixture renders an SVG but lacks the two embedded MathML nodes expected by the shared fixture; full modular E2E parity remains open. Production compatibility fixture passes 1/1.
- Re-ran current unit suite (**668/668, 97 files**), ESLint, production build, and modular build successfully. Production and modular bundles still contain the large Monaco vendor chunk (~2.27 MB raw / ~585 KB gzip). `npm audit` remains unverified because the registry endpoint was unreachable; no push or deploy occurred.
- Owner confirmed first-pilot quota/cap (5 MiB/user, 25 users), deferred Drive/GitHub, and chose to keep deleted-note history/cloud-link metadata recoverable. Current local delete still removes the note row and leaves those related rows orphaned; next lifecycle work is a trash/restore path without cascade deletion.
- Owner chose Appwrite write-gateway access, but the gateway is still not present in the available tool surface: the explicitly authorized `organization_create_project(markup, Markup, sgp)` call still fails with “Call it through appwrite_call_write_tool”. No project/resources were created. Vercel reads identified `markups.dev` as production and `markups-git-nir-bhay-sync-main-seo-be4512-nirbhay-987s-projects.vercel.app` as the current branch preview alias; owner confirmation of those exact allowlist hosts remains pending.

## 2026-10-28 — Recoverable local Trash implementation

- Added Dexie v5 `deletedAt` fields/indexes for notes and file-tree nodes. The upgrade backfills active rows while preserving numeric note IDs, note-version rows, cloud links and local media references.
- File/folder deletion now soft-deletes the entire tree subtree and linked notes in one transaction. Active lists/search/tag/category/favorites/counts hide trashed notes; usage fallback still counts them. Folder restore preserves IDs and nested relationships, handles sibling-name collisions safely, and restores linked notes. Standalone trashed notes restore atomically with a new root file node. No purge action or automatic expiry was added.
- Added an Explorer Trash entry point, accessible restore rows built with safe DOM text, and user-facing recoverable-delete copy. Dirty active documents are saved and checked before delete. The runtime image cache protects references in Trash so restored notes keep their local previews.
- Added migration, query, history/cloud-link/media retention, recursive restore, name-collision, folder-cycle and browser journey coverage. A populated-v3 migration fixture retains relation IDs.
- Verification after the final source change: **672 unit tests across 97 files**, ESLint, production build and modular build passed. Production Playwright completed **51/51 tests in 3.7 minutes with a clean exit**; stress QA blockers: 0. A first four-worker run had one focus-mode timeout; that test passed alone and the complete serial run passed.
- Owner’s recoverable-data choice is implemented. Local Trash occupies browser storage indefinitely until restored; retention/permanent-purge policy remains an owner decision. Appwrite project provisioning is still blocked because `appwrite_call_write_tool` is not exposed. Confirm exact production/preview host allowlist and review component quota proposals before live provisioning. No push or deploy occurred; production `main` remains unchanged.

## 2026-10-28 — Mermaid label security and modular parity recheck

- Reproduced the modular Mermaid MathML regression in Chromium. Mermaid's raw SVG contained both MathML labels, but DOMPurify removed the HTML subtree under SVG `foreignObject` because that integration point was not enabled.
- Updated the Mermaid-only sanitizer invocation to allow SVG, HTML and MathML profiles plus the `foreignObject` HTML integration point. The shared sanitizer continues to block scripts, unsafe URI values and event-handler attributes.
- Added browser coverage for Mermaid MathML and an unsafe HTML label. Both focused checks pass in production and modular entries (**2/2 each**); the malicious label adds no event-handler/script nodes and does not execute.
- Re-ran the complete modular E2E suite to assess parity with the documented drop-in claim. Result: **22/51 passed, 29 failed** across toolbar/responsive controls, Document Mode, exports, image/storage, spellcheck, sharing, Trash test hooks, video editing, deep preview and stress diagrams. This path is not production-ready. `main.js` remains the actual production entry; no entry switch, push or deployment occurred.

## 2026-10-28 — Modular view controls, toolbar persistence and theme recovery

- Fixed the modular toolbar bootstrap so the static production toolbar is preserved while shared popovers use the hidden host. Responsive toolbar widths, production toolbar ordering, and spellcheck now pass in the modular entry.
- Connected the modular preview and top-level view controls to `modesManager`, including body classes and `aria-pressed` state. Added abortable listeners and event-bus cleanup on app disposal.
- Fixed an invalid storage-key mapping for app and editor themes. The theme manager now validates persisted/runtime values and safely falls back to system/light mode rather than stopping app initialization. Added unit coverage for old/invalid values.
- Verification: **674 unit tests across 98 files**, ESLint, production build, modular build, and the affected modular browser set **18/18 passed** (responsive toolbar, smoke flows, preview toggle, and spellcheck). The previous complete modular result remains **22/51**; the full 51-case run has not yet been repeated after these fixes.
- Retried Appwrite project creation through the connector; its wrapper still routes writes to the unavailable `appwrite_call_write_tool`. Browser Use reached the Appwrite Console but required sign-in and stopped without changes. Owner action: sign in at `https://cloud.appwrite.io/console` in the connected browser and let me know when ready. No Appwrite project/resources were created.
- No push, deploy, or `main` changes. Production remains on `main.js`; the working branch still contains uncommitted changes.

## 2026-10-28 — Complete modular parity recheck

- Re-ran the complete modular E2E suite after the toolbar/view-mode fixes. Result: **39/52 passed, 13 failed**. The failures cover deep preview diagrams/code-copy, Document Mode, export modal, image/video no-blink behavior, backlinks, incoming-share handling, image readiness/quota flow, and the missing Explorer/Trash file-creation hook.
- Traced a blocking lifecycle mismatch: modular tabs use string IDs while the shared autosave service requires numeric note IDs for IndexedDB writes. The modular entry therefore needs a stable tab-to-note identity design before it can claim document persistence parity. No test-only workaround was added.
- Added [MODULAR-ENTRY-PARITY-RECHECK-2026-10-28.md](MODULAR-ENTRY-PARITY-RECHECK-2026-10-28.md) with the test-by-test triage, scope boundary, implementation order and unresolved verification gates. Updated the master owner checklist and implementation-plan verification snapshot.
- Read Appwrite context again: the account still lists only the existing `yoga` project. `Markup` and its resources are absent because the write gateway is still unavailable. `npm outdated --json` had earlier failed with `EACCES` while fetching the npm registry; dependency versions remain unverified.
- The modular run exercised `main.modular.js`, not production `main.js`. At that point in the recheck, production still had to be rerun on this working tree; the follow-up result is recorded below. No push, deploy, or `main` change was made.
- Follow-up production E2E on the same working tree completed **52/52 passed with a clean exit in 3.5 minutes**; stress-preview blockers: 0. The shared editor features represented in the modular failure set passed through `main.js`. The modular parity gaps remain. No push, deployment, or `main` change was made.

## 2026-10-28 — Comprehensive branch, parity and owner-gate recheck

- Refreshed GitHub branch comparison: `Nir-Bhay/sync-main-seo-geo-2026-10-25` is **40 commits ahead of `main`, 0 behind**. Local HEAD `b5d5c666330c908154b4b6278fb9105097ecb03a` tracks the same branch; the working tree remains extensively dirty and uncommitted.
- Refreshed Vercel aliases: `markups.dev` still points to READY production deployment `dpl_CdT7fmwR9apbKWDdAH1BPc2egqwQ`, built from `main` commit `9458092d60aa678e2bc8253f205bb56717a3fca6`. The current feature-branch alias still points to READY preview `dpl_3mGuDC1qebfe3vg34FzGfqbo7qei` at commit `b5d5c666330c908154b4b6278fb9105097ecb03a`; it does not include these local edits. Newest Vercel deployment overall remains a preview on `growth/seo-geo-audit-2026-10`, commit `90f142cf8a6420f4b0f1dca14a01ccce41b99f63` (`dpl_BigEkSzAijxiDL8xUgeLa6FfN7q3`, READY, target null), not production.
- Fresh local checks: **686 unit tests across 100 files**, lint (0 errors), production build, and modular build all passed. Production Playwright completed **52 passed, 1 modular-only test skipped**, clean exit in 6.0 minutes; stress-preview blockers: 0.
- Latest complete modular Playwright run remains **42/53 passed, 11 failed**. The failures are in deep preview Mermaid/code-copy, two Document Mode journeys, two export journeys, image resize's editor API contract, focus-mode state, two storage-quota/readiness journeys, stress Mermaid/KaTeX, and the video editor API contract. Focused persistent-tab, Trash/restore, sidebars and incoming-share journeys pass. The current failure matrix is in `docs/MODULAR-ENTRY-PARITY-RECHECK-2026-10-28.md`.
- Repeated `npm outdated --json` and `npm audit --omit=dev --json`: registry requests fail with `EACCES`/endpoint errors. Dependency freshness and vulnerability status remain unknown; no clean audit is claimed.
- Re-read Appwrite account context on 2026-10-28: only project `yoga` exists in the `GitHub Student Organization`; `Markup` is absent. The authorized `organization_create_project` request remains blocked because the connector routes writes to unavailable `appwrite_call_write_tool`. The Browser Use attempt finished at the sign-in gate after two handoffs expired; no project/settings were changed. The Appwrite sign-in page is open in the in-app browser.
- Owner decisions: 5 MiB/user and 25-user pilot cap; defer Drive/GitHub; retain deleted-note history/cloud-link metadata. The exact Appwrite production/preview host allowlist and the remaining per-document/version caps still need confirmation. The current account readback reports an active $0 GitHub Student Pack (`auto-1`) with two project slots, but omits account-specific term expiry. Current Education terms specify six months, educational/non-commercial use, and a 2026-11-01 enforcement date for older accounts; owner must verify exact Billing status and Markups eligibility before public cloud use.
- No branch push, Vercel deployment, or change to `main` was made. The master action checklist is `docs/appwrite/RECHECK-AND-OWNER-ACTIONS.md`.

## 2026-11-03 — Git recovery and editor/provider implementation (in progress)

- Located intact original Git metadata in hidden .git_disabled. Backed it up to E:/markups-recovery/2026-11-03-original-git/git-metadata; saved tracked binary diff, checked connectivity and fetched origin. Feature HEAD b5d5c66 is 40 ahead/0 behind main; working edits remain preserved. scripts/git-original.ps1 selects original metadata explicitly. Added .git_disabled/ ignore rule. No reset, rename, push or deploy.
- Ownership: root recovery/reports; provider_flow cloud UI and connector clients; security_browser AI transport/CSP/connector backend/Firefox config; modular_parity modular app wiring/entry selector. Code-review-graph tools unavailable; navigation used targeted source/tree reads.
- Provider and security focused tests pass; root lint passes. Full root production and Firefox attempts hit server startup timeout before tests under concurrent host load, so are not acceptance passes. Retrying sequentially after source stabilizes.
- Appwrite connector read calls still return UNAUTHORIZED/reconnect required. No live project/configuration/provider writes performed. Owner acknowledgement does not establish restored API access.
# 2026-11-03 — Modular editor parity and save/recovery recheck

- Final source-frozen Node24 Chromium modular run: **64/64 passed**, exit 0, **6.6 minutes**, one worker, video off, stress blockers 0. Runner and an explicit HTTP fetch confirmed `src/main.modular.js`; `test-results/chromium-modular/.last-run.json` reports passed with no failed tests. Complete stdout is `test-results/modular-final-2026-11-03.log`.
- Fixed modular export-dialog/copy wiring, source-preserving preview controls, escaped-dollar math, startup view-control readiness, AI readiness publication, durable local images and portable share/export, real localStorage-quota recovery of tab identities from IndexedDB, persistent autosave feedback and manual-save readback confirmation. New browser regression verifies an injected note-write failure emits no Saved event and preserves editor content, followed by successful recovery.
- Source lint passed. Focused seven-file autosave/media/tabs/export/source-mapping unit run passed 42 tests; subsequent four-file affected unit run passed 28 after the final math/manual-save fix. Parent review records final whole-project unit/build/security totals separately.
- Earlier HMR/interrupted/mislabeled attempts are not passes. Final detailed evidence, source inventory and remaining advanced export-option fidelity limitations: `docs/MODULAR-ENTRY-PARITY-RECHECK-2026-11-03.md`. Production entry was not switched, no push/deploy occurred, and real cloud/provider OAuth remains a separate gate.


## 2026-11-03 — Final editor/provider/security pass

- Recovered and preserved the original project Git metadata; `origin/main` is the deployed baseline while the working feature branch retains its uncommitted code. No merge, push, or deployment was made. See `docs/GIT-RECOVERY-2026-11-03.md`.
- Current source verification: **723 unit tests across 105 files**, ESLint, production build, and modular build pass under Node24.22.2. Full production Chromium suite passed **62**, with 2 modular-only tests skipped; the modular Chromium suite passed **64/64**. Stress QA blockers: 0. The final tiny GitHub import-failure UI guard was followed by the full unit/lint/production-build checks and cloud setup E2E 1/1.
- GitHub import failures now clear the previous path and disable commit until a successful import or a deliberate new destination; the regression verifies no commit call after local persistence fails. In-app browser confirms the editor preview and Cloud panel render, with provider actions unavailable until project setup.
- Release blockers remain: Appwrite plugin session/tool access unavailable for live configuration validation; OAuth/Appwrite/GitHub App secrets and accepted origins require owner-side setup; Firefox cannot launch a blank local page in this environment (CI check not run); broad CSP allowances need a separate compatibility-based tightening; Docker image and remote CI were not run. Modular entry remains experimental because some advanced export options lack parity.
- No push/deploy/main changes.

## 2026-11-03 — React landing-page refresh

- Replaced the `/landing` page with the React design supplied in `design-markups-landing-page.zip`. Added a Vite pre-render step so the build emits readable landing content before React hydrates it; the editor at `/` remains its own app.
- Kept `/landing` self-canonical, aligned the FAQ schema with visible FAQ copy, restored links to the six SEO guides and Compatibility Lab, and clarified that Drive/GitHub connection setup is pending rather than a live feature.
- Landing typecheck, lint, production/modular builds, the SEO static audit, built-page audit, and built FAQ/schema read-back passed. Unit/browser and visual/mobile/keyboard review and authenticated preview remain open; this local change has not been deployed. Evidence: `docs/seo-geo/runs/2026-11-03-landing-refresh.md`.

## 2026-11-03 — Landing interaction and feature-section redesign

- Removed inner scrolling from the editable Markdown showcase, made its source pane expand with edits, shortened the examples, and reorganized its sample and mode controls. Redesigned the rich Markdown, draft organization, export, and writing-process visuals.
- Landing typecheck, production build, and built-page audit passed. Browser screenshot/keyboard review remains open because the browser automation kernel could not initialize and Chrome is unavailable to the Playwright connector. Evidence and limitation: `docs/seo-geo/runs/2026-11-03-landing-refresh.md`.
- Redesigned the use-case section shown in the owner screenshot as an asymmetric visual layout for engineering, research, and technical writing. Landing typecheck, production build, and the 9-page built-site audit passed again; browser visual review remains open because Chrome/UI automation is unavailable here.

## 2026-11-03 — GitHub Dependabot digest

- Reconciled the supplied Oct 27–Nov 3 digest against the local branch and deployed `origin/main`. Current local resolved packages are patched: undici 7.30.1, brace-expansion 1.1.21, DOMPurify 3.4.17, source-map-js 1.2.2, Vitest mocker 5.0.5 and Vite 8.3.5; Happy DOM is no longer installed. Fresh `npm audit --json`: 0 findings.
- `origin/main` package manifest still has the older Vite 6/Vitest 4/Happy DOM 20/DOMPurify 3.4.12 dependency set. The alert therefore remains on GitHub until a reviewed fix is pushed to a monitored branch and rescanned. No push or deploy was made.
- Package-by-package reconciliation and official advisory links: `docs/DEPENDABOT-SECURITY-ALERTS-2026-11-03.md`.

## 2026-11-03 — User-visible Cloud panel check

- Used the user's in-app browser at `http://127.0.0.1:5174/`: Cloud & connections opens, closes, and reopens; editor remains rendered with “All changes saved.” Visible UI explicitly marks Markups Cloud and Google Drive unavailable; GitHub is gated on the Markups account service. Connection/action buttons are hidden, so the live provider file-sync path cannot currently be exercised from this build. No sign-in, consent, file transfer, or remote write was attempted. Details and exact post-setup manual checks are in `docs/PROVIDER-CONNECTION-FLOWS-2026-11-03.md`.


## 2026-11-04 — Whole-product production readiness evaluation

Decision NO-GO for current candidate. Fresh Node24 production-output browser load/reload reproduces Prism is not defined from highlight-vendor; editor uninitialized and preview empty. Unit suite: 724/724 across 105 files under Node25; focused supported Node24 sanitizer/telemetry: 25/25. Lint/typecheck and both compilations pass; npm full/prod audits zero findings. Isolated Node24 dev deep-preview passes 13 suites/52 checks; this does not rescue built startup. Diagnostic dev suite has cache invalidation failures and obsolete landing selectors, so no full browser green claim. Fresh live crawl: 34 intended URLs, 11 HTTP200, 23 HTTP404; production sitemap 10. Full decision and exact remaining gates: PRODUCTION-READINESS-2026-11-04.md; evidence: production-readiness-evidence-2026-11-04.json. No application fix, push or deployment performed.


## 2026-11-04 — Production fixes and verified candidate

Fixed compiled Prism boot, offline asset caching/update safety, PDF pagination/diagram capture and React hydration corruption. Added compiled browser runner and CI checks; reduced initial landing chunk via deferred Markdown renderer and fixed audited labels/headings/contrast. Node24 units 729/729; compiled whole browser 65/65; subsequent PDF export 3/3 and landing/routes 16/16; PDF raster review 1/7 pages nonblank with diagram/final page visually reviewed; offline typed-save recovery 3/3 repeats. Static built SEO: 40 HTML/34 URLs, zero errors/warnings. Local optimized mobile Lighthouse 39 performance/96 accessibility/100 best practices/100 SEO, so performance remains open. Engineering readiness judgment 78/100, not production approval. Appwrite org readonly with no backend resources; live 23/34 routes missing; Firefox/WebKit/native viewer/Docker and deployed observability pending. Nested source checkout lacks Git metadata despite outer submodule tracking, so candidate provenance must be reconciled. No push/deploy/account writes. Full follow-up: PRODUCTION-FIXES-AND-SCORE-2026-11-04.md; release steps: RELEASE-RUNBOOK-2026-11-04.md.


- Continued scorecard work: split the six aggregate areas into a 44-checkpoint evidence ledger. Tightened script CSP by removing inline/eval permissions; compiled local editor plus Mermaid manual smoke rendered with no CSP violations. Mermaid loads only when a diagram is present. Firefox compiled run attempted but failed before product assertions because the browser target crashed/interstitial; recorded without pass credit. Readiness rubric now 79/100 with core unresolved gates retained.

- Latest Lighthouse rerun after landing accessibility fixes: landing accessibility 100, best practices 100, SEO 100. Performance was 25 with a 6.36s local root-document response under heavy host load (earlier run 39); not treated as attributable or stable. Readiness rubric 80/100 credits the automated landing accessibility result. Full 44-check ledger in the production-fixes report.

## 2026-11-04 — Final editor and performance regression follow-up

- Fixed a startup race in the debug/test editor hook: `window.editor` is now exposed after the active tab restore completes, so boot cannot overwrite an automation edit. Fresh Node24 health gate passed: npm audit 0 advisories, 729/729 unit tests, production and modular builds; ESLint 0 errors.
- Fresh compiled Chromium E2E initially found one deep spellcheck context-menu timeout using a fixed click point. Replaced it with a Monaco cursor-position click and an explicit menu-visible check; the final fresh full rerun then passed **65/65**, with stress-preview blockers 0. Security boundary also passes under the final suite.
- Current mobile Lighthouse 13.6 runs: landing 64/65 performance (LCP 2.4/2.5s, TBT 1.78/2.08s, CLS 0); editor 36 (LCP 14.0s, TBT 7.01s, CLS 0.059). Host benchmark index varied 300–1,038; earlier landing runs scored 85/89 but were not reproduced in the final window. Editor startup remains a production gate; real field CWV remains unverified.
- Lighthouse's editor Best Practices 88 flagged Monaco's hidden textarea as paste-preventing and noted missing JS source maps. A separate clipboard-permission browser probe pasted successfully into the live editor, so the paste warning was not reproduced manually; missing public maps remain a diagnostics/build-policy choice.
- Score remains 80/100; no promotion to production. Source checkout provenance, deployed route/security checks, cross-browser coverage and cloud setup are still open. No push or deployment. Detailed evidence: `docs/PRODUCTION-FIXES-AND-SCORE-2026-11-04.md` and `docs/production-fixes-evidence-2026-11-04.json`.
