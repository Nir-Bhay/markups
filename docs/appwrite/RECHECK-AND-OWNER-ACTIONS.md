# Appwrite rollout recheck and owner actions

**Rechecked:** 2026-10-28  
**Branch:** `Nir-Bhay/sync-main-seo-geo-2026-10-25`  
**Purpose:** Master recheck of the current branch, production/preview boundary, local implementation, Appwrite and provider rollout gates, remaining product gaps, and owner actions. “Implemented” means source exists locally; it does not mean a service is deployed or safe for real documents.

**Appwrite status superseded 2026-11-04:** MCP access now works and the previously authorized empty `Markup` project (`markup`, Singapore) has been created. It has no services or app data. The organization reports read-only mode; web-platform writes failed with `402 team_read_only`. This blocks Appwrite provisioning until the organization owner restores write access. See [the current MCP status](MCP-STATUS-RECHECK-2026-11-04.md). Earlier Appwrite observations below are historical snapshots.

## Current snapshot

- Work remains on `Nir-Bhay/sync-main-seo-geo-2026-10-25`; the branch tracks its origin branch and has uncommitted/untracked work. Do not reset, clean, or overwrite it. This turn made no push or deploy.
- Appwrite account readback shows only the existing `yoga` project; `Markup` and all of its resources are absent. The connected organization is on the $0 `GitHub Student Pack` Education plan (`auto-1`, program flag active), with a two-project ceiling. One of the two project slots is occupied by `yoga`.
- The plan readback reports Pro-equivalent per-project resources (150 GB storage, 2 TB monthly bandwidth, 200K MAU, 1.75M reads, 750K writes, 3.5M Function executions and 1,000 GB-hours). Current usage of the existing organization was last sampled on 2026-10-27; there is no Markup project usage.
- The authorized `Markup` create request was rejected because the connector routes writes to unavailable `appwrite_call_write_tool`. The Browser Use attempt ended after two sign-in handoffs expired, without changes. The Appwrite sign-in page is now open in a new in-app browser tab; the owner must sign in before UI creation can continue.
- Appwrite's current Education terms limit use to educational/non-commercial purposes, provide six months, and announce plan enforcement beginning 2026-11-01. Older organizations may need to choose another plan by then or be disabled. The connected API reports the plan as active but does not return its term end date. Treat Markups' eligibility and the owner's plan selection as an urgent gate before public production use.
- Owner decisions recorded 2026-10-28: pilot cap 5 MiB/user and 25 users; Drive/GitHub deferred; deleted notes and history/cloud-link metadata remain recoverable. The exact production/preview host allowlist and component limits are still pending.
- Hostname candidates read from Vercel: production `markups.dev`; current branch alias `markups-git-nir-bhay-sync-main-seo-be4512-nirbhay-987s-projects.vercel.app`. These are observed values, not yet configured in Appwrite; confirm the preview alias before allowlisting it.
- No Google OAuth/Picker app, GitHub OAuth app, or Markups GitHub App has been configured. No provider file has been read or written.
- The local `.env.example` has blank project/function/provider IDs. `.env.local` is ignored by Git and is the right place for local public build values. No credentials were added.
- Ordinary notes remain local. Login does not upload notes; private cloud backup requires a separate per-note consent. Cloud media, chat, automatic sync, and public cloud shares are not enabled.
- Local notes now receive an immutable UUID in addition to the existing numeric key. Dexie v4 backfills old notes; numeric IDs and their local history/tree/cloud-link references stay unchanged. Dexie v5 adds indexed soft-delete state and backfills active notes/tree nodes without changing those keys.
- Local file/folder deletion now moves items and linked notes to Trash in one IndexedDB transaction. Restore keeps the original file, note, version, and cloud-link IDs; a name conflict gets a safe suffix. The editor has a Trash button and restore view; no permanent purge action exists. Standalone deleted notes also restore with a new root file node.
- Trashed notes remain in browser storage indefinitely, including local image references; this protects recovery but means Trash does not reclaim storage. Per the owner's choice, no automatic expiry or permanent-delete control is enabled.
- E2E now starts Vite as a direct child process and exits cleanly on Windows. The fresh production suite passed **52 tests with one modular-only test skipped**; latest complete modular run: **42/53 passed, 11 failed**. See [modular entry parity recheck](../MODULAR-ENTRY-PARITY-RECHECK-2026-10-28.md). Focused Mermaid MathML and active-content checks pass in both entry paths.
- Existing Drive files are protected: the UI creates a separate copy; overwriting a selected Drive file stays disabled until a live stale-write test proves conditional update behavior.
- Clarity session replay is disabled in the editor and removed from its CSP; the body remains marked for masking as defense in depth. Analytics bootstrap skips previews/local builds, fragments, and unapproved query strings; GA page location/referrer are sanitized. Live dashboards and production network capture still need proof.

## Branch and deployment boundary

Read-only Vercel account data was refreshed on 2026-10-28:

| Target | Current observed deployment | Meaning |
|---|---|---|
| Production alias `markups.dev` | `main`, commit `9458092d60aa678e2bc8253f205bb56717a3fca6`, deployment `dpl_CdT7fmwR9apbKWDdAH1BPc2egqwQ`, READY; deployed 2026-10-06 14:24 UTC | This is the production source observed for the domain. Keep changes off `main` until explicitly approved. |
| Current working-branch preview | `Nir-Bhay/sync-main-seo-geo-2026-10-25`, commit `b5d5c666330c908154b4b6278fb9105097ecb03a`, deployment `dpl_3mGuDC1qebfe3vg34FzGfqbo7qei`, READY; deployed 2026-10-27 17:44 UTC | Existing preview for this branch; it does not include this turn's uncommitted changes. |
| Newest Vercel deployment overall | `growth/seo-geo-audit-2026-10`, commit `90f142cf8a6420f4b0f1dca14a01ccce41b99f63`, deployment `dpl_BigEkSzAijxiDL8xUgeLa6FfN7q3`, READY; deployed 2026-10-28 05:21 UTC, target `null` | A preview deployment, not the `markups.dev` production alias. |

These values came from fresh Vercel project/deployment/alias reads. GitHub currently reports the working branch 40 commits ahead of `main` and 0 behind. The local HEAD is `b5d5c66`, matching the working-branch preview deployment; all edits since that commit are local and uncommitted.

For Appwrite host restrictions, the observed candidates are `markups.dev` (production) and `markups-git-nir-bhay-sync-main-seo-be4512-nirbhay-987s-projects.vercel.app` (the current feature-branch alias). The preview alias currently points to the existing deployed commit, not this uncommitted working tree.

## What the project owner needs to do

Local implementation, review, and tests can continue without account changes. To start live cloud work, these owner actions remain:

1. Sign in to Appwrite in the in-app browser tab titled **Appwrite Console**. The Browser Use attempt expired at the login handoff; no changes were made. The empty `Markup` create (`markup`, `sgp`) is already authorized, but remains gated on the plan decision below.
2. In Appwrite Billing, check the Education term end and choose an eligible plan before **2026-11-01** if the account is past six months. The account API currently reports `GitHub Student Pack` active/$0 but does not return its end date. Appwrite's Education terms prohibit non-educational or commercial use; confirm with Appwrite or choose a plan that permits the intended public Markups service before onboarding users.
3. Confirm the Appwrite host allowlist: production `markups.dev` and preview `markups-git-nir-bhay-sync-main-seo-be4512-nirbhay-987s-projects.vercel.app`, or provide the replacement preview host. The preview alias points to the old deployed commit. Your 5 MiB/user and 25-user cap are approved; Drive/GitHub are deferred. The 512 KiB/document, 25 documents/user, three previous versions/seven days, and 50 changed revisions/day remain proposals.
4. After auth is configured, identify one test account and provide only its Appwrite user ID for the server allowlist. Keep passwords, API keys, OAuth secrets, and private keys in the relevant service settings; do not send them in chat.

Local deletion policy is implemented as requested: files and folders stay recoverable with history, cloud links and referenced local images. No expiry or permanent purge is enabled. You can review/restore a folder in the local preview; this is not a blocker for Appwrite setup.

After the project ID/region and decisions are available, I can set local public IDs, provision the reviewed schema/functions, and run the live POCs. Nothing from this branch has been pushed or deployed.

## Recheck results

| Area | Result | Remaining proof or fix |
|---|---|---|
| Unit tests | **686/686 passed** across 100 files; fresh full rerun 2026-10-28 | Vitest reported 193 seconds; warning logs in quota/migration tests are expected assertions |
| Lint | **Passed**; fresh rerun 2026-10-28, 0 ESLint errors | None for this local run |
| Production build | **Passed**; fresh rerun 2026-10-28 | Monaco remains a large chunk (~2.27 MB raw / ~585 KB gzip); profile startup and lazy loading separately |
| Modular build | **Passed**; fresh rerun 2026-10-28 | Browser E2E for this build remains separate |
| Focused cloud setup E2E | **1/1 passed** on 2026-10-28; runner exited cleanly | Does not prove live provider/backend behavior |
| Full production browser E2E | **52 passed, 1 modular-only test skipped**, clean exit in 6.0 minutes, fresh on 2026-10-28 against the current source tree. Stress-preview blockers: 0. Production counterparts of the modular failures passed. | Preview screenshot, Safari/Firefox, Lighthouse and axe evidence remain separate. |
| Modular entry browser check | Latest complete suite: **42/53 passed; 11 failed**. Focused tab persistence, Trash restore, sidebars and incoming-share checks pass. | Remaining failures cover code-block copy/Mermaid and stress KaTeX rendering, Document Mode, export modal, focus state, image/video editor API wiring and storage quota/readiness. See the [failure matrix](../MODULAR-ENTRY-PARITY-RECHECK-2026-10-28.md). `main.modular.js` remains experimental; keep production on `main.js` until parity is proven. |
| Repository health script | **Blocked at its first gate**: `npm audit --json` could not reach `registry.npmjs.org`; the script stopped before its own unit/build checks. Those checks were separately run and passed above. | Retry when registry connectivity and npm log-cache permissions are available; vulnerability status is unknown. |
| Stress-preview runtime | **Fixed locally and regression-checked** | The toolbar now ignores stale/out-of-range Monaco selection lines. The focused stress test reported `ok`, `STRESS_QA blockers: 0`, and the new assertion saw no `Illegal value for lineNumber` console error. |
| Browser preview | The in-app browser at `http://127.0.0.1:5174/` loads the editor and exposes Explorer's **Open Trash** control. The cloud-setup Playwright smoke passed 1/1 with no Vite overlay, page errors, local image-storage warning, or Appwrite/provider requests before setup. | The earlier screenshot at port 5173 showed a Monaco worker import overlay; it did not reproduce at 5174. Large-file/media and restore behavior still need an owner walkthrough in the current browser profile. |
| Account-switch protection | **Implemented and unit-checked:** the UI captures the initiating account ID; the client requires it, validates the exact JWT via Appwrite `/account`, and stops a mismatched request before function execution. Account changes clear cached cloud/GitHub selection and in-memory Drive credentials. | The live multi-tab/session-switch flow still needs an Appwrite project and test users. |
| Telemetry privacy | **Source-level fix:** Clarity is disabled on the editor and blocked by CSP; body masking remains as defense in depth. GA path/title/referrer are sanitized; GA and Vercel are restricted to canonical clean URLs and bounded campaign parameters; fragments and unknown query values suppress all trackers. Tests cover OAuth credentials and shared-link URLs. | Confirm production GA payloads and the absence of Clarity requests through approved production network capture after deployment. |
| Appwrite Education eligibility | **Plan/API readback confirms** GitHub Student Pack (`auto-1`), $0, active flag, two project slots (one used), Pro-equivalent project quotas. Public terms now impose a six-month term and prohibit non-educational/commercial use. | Check exact term end and choose a permitted plan by 2026-11-01 if applicable; confirm Markups' public production use is eligible before creating live data. |
| Dependency security audit | **Unverified** | Retried `npm audit --omit=dev`; the npm audit endpoint failed to connect. No vulnerability result was returned; do not describe dependencies as vulnerability-free yet. |
| Dependency version freshness | **Unverified** | `npm outdated --json` terminated with `EACCES` while fetching `registry.npmjs.org`; no current-version comparison was returned. Retry when registry access and npm cache/log permissions work. Do not claim versions are current. |
| Appwrite, OAuth, provider APIs | **Not live-tested** | Need project, credentials, deployments, test users, and account setup below. |

## Cross-check against the broader product audit

Detailed evidence remains in [FEATURE-GAP-REVIEW.md](FEATURE-GAP-REVIEW.md), [ARCHITECTURE-AND-ROLLOUT.md](ARCHITECTURE-AND-ROLLOUT.md), the earlier [PRODUCTION-AUDIT-REPORT.md](../PRODUCTION-AUDIT-REPORT.md), [CODE-REVIEW.md](../CODE-REVIEW.md), and [SEO/GEO baseline audit](../seo-geo/BASELINE-AUDIT-2026-10-23.md). This pass does not mark every older hypothesis as freshly verified. Current known open work is:

| Workstream | Current status | Next proof/fix |
|---|---|---|
| Appwrite private cloud pilot | Local source and mocked tests exist; live foundation is blocked | Create/read back the empty project, then prove ACL/JWT/transactions/quotas/deletion before enabling saves |
| Google Drive and GitHub | Adapters exist; provider apps/accounts are not configured | Owner chooses which provider(s) enter the pilot; configure each at its gate and run real conflict/revoke tests |
| Note identity | **Local additive UUID implemented:** Dexie v4 backfills existing notes and new/bulk-migrated notes get immutable UUIDs. Numeric primary keys remain intact; tests verify a populated v3 upgrade preserves history/tree/cloud-link references and migration backup IDs match stored IDs. | Before using UUIDs remotely, design account-scoped mappings, outbox and tombstones; prove multi-device recovery |
| Note lifecycle | **Local recoverable Trash implemented:** Dexie v5 soft-deletes note/tree rows transactionally; normal note queries omit trashed rows; Explorer can restore files/folders and same IDs. Unit coverage checks migration, recursive restore, conflict-safe names and preservation of history/cloud-link metadata; focused and full production browser journeys passed. Permanent purge is intentionally unavailable. | Owner walkthrough remains useful for confirming the restore flow on their own notes. Appwrite tombstone behavior remains a separate live-cloud gate. |
| Automatic sync/offline outbox | Not implemented | Design after durable identity and live account-switch/recovery proof |
| Public revocable shares, cloud media, synced chat/settings, collaboration | Not implemented | Separate consent, retention, abuse, quota and architecture review; outside the first pilot |
| Telemetry privacy | Source protections implemented | Confirm no Clarity requests and sanitized GA payloads on the production deployment after an approved release |
| Dependency audit | Unknown; npm audit service did not return data | Retry when registry access works; do not interpret this as a clean result |
| Full browser regression | Production: **52 passed, 1 modular-only test skipped**. Modular: **42/53 passed, 11 failed**. | Keep the production entry unchanged. Modular requires complete feature parity before any switch. Safari/Firefox, Lighthouse and axe checks remain separate release evidence. |
| Local editor performance and storage | Unit/build checks pass; Monaco remains a large eager chunk. The current in-app preview and Playwright smoke show no image-storage warning. | Profile large Markdown, images, diagrams, exports and quota behavior; the prior warning is not reproduced, so its cause is still unknown. |
| SEO/PWA/accessibility/deploy parity | Older audit contains detailed findings, but not every item was re-measured in this pass | Recheck routes/assets, PWA install/update, sitemap/crawlers, keyboard/contrast and non-Vercel deployment before making release claims |

### Recheck coverage boundary

The first complete modular run in this recheck series passed 22/51 with 29 failures; an intermediate run passed 39/52 with 13 failures. The latest modular suite passed 42/53 with 11 failures. A fresh production suite on the same source tree passed 52 tests with one modular-only test skipped. This pass refreshed branch/status, Appwrite account/plan/project inventory and current Education policy, Vercel deployment/alias metadata, local identity/storage, telemetry protections and test/build evidence. It did not execute live OAuth, create Appwrite resources, verify live production analytics, run Lighthouse/axe, profile every editor feature, or complete Safari/Firefox coverage. Those remain open evidence gates, not assumed successes.

## Release checklist

### Gate 0 — owner decisions and account access

- [ ] Sign in to Appwrite in the in-app browser. The `appwrite_call_write_tool` is unavailable; the earlier browser run ended at sign-in without changes. The exact empty project create remains authorized.
- [ ] Check the Education plan end date and choose an eligible plan by **2026-11-01** if the term has ended. Confirm Markups' intended public use complies with Education's educational/non-commercial condition; otherwise use a plan that permits it.
- [x] Approve a 5 MiB total logical text/version cap per user and a 25-user allowlist ceiling; defer Drive/GitHub. The 512 KiB per-document cap, 25 documents, three previous versions/seven days and 50 revisions/day remain proposed component controls to review. These are application checks, not platform guarantees.
- [ ] Confirm the exact host allowlist: production `markups.dev`, preview `markups-git-nir-bhay-sync-main-seo-be4512-nirbhay-987s-projects.vercel.app`. Do not allow every `*.vercel.app` preview.
- [x] Set local note deletion policy to preserve/recover note history and cloud-link metadata; implement trash/restore before enabling permanent cleanup.

### Gate 1 — Appwrite foundation

- [ ] Create the Appwrite project, then read it back and verify ID, `sgp` region, plan, project count, and no unexpected billing change.
- [ ] Add only the approved local and production/preview platform hostnames. Configure email/password auth and only the OAuth providers selected for the pilot.
- [ ] Deploy the `cloud-api` Function with Node 22+, entrypoint `src/main.js`, user execution permission, bounded timeout, private/no-store responses, and logging that excludes note content, tokens, and provider bodies.
- [ ] Grant that Function only the dynamic key scopes it needs (`rows.read` and `rows.write`). Appwrite provides a short-lived Function key in `x-appwrite-key`; keep temporary schema-administration permissions separate from runtime permissions. [Function key documentation](https://appwrite.io/docs/products/functions/develop)
- [ ] Run the schema provisioner in dry-run mode first. Apply the `markups_cloud` TablesDB schema only after review; verify every table/column/index is ready, row security is on, and no public or broad parent permission exists.
- [ ] Seed/read back the pilot control row without resetting counters. Keep `MARKUPS_CLOUD_ENABLED=false` until ACL, JWT forwarding, quota, transaction, and deletion POCs pass. An empty user allowlist must deny grants/saves.
- [ ] For the first live POC, add only the owner’s Appwrite user ID to `MARKUPS_CLOUD_USER_IDS`; never send passwords, API keys, private keys, or OAuth secrets in chat.

### Gate 2 — Google identity and Drive

- [ ] If Google sign-in is wanted, configure its OAuth client/secret in Appwrite’s provider settings and register the approved callbacks.
- [ ] Create a separate Google web OAuth client for Drive and enable Google Picker. Restrict the browser API key to the approved referrers and Picker API.
- [ ] Supply the public build values `VITE_GOOGLE_DRIVE_CLIENT_ID`, `VITE_GOOGLE_DRIVE_API_KEY`, and `VITE_GOOGLE_DRIVE_APP_ID` through local `.env.local` first. For later previews, use Vercel **Preview** variables only.
- [ ] Test the exact `drive.file` consent, picker selection, open, new-copy save, disconnect/revoke, and token expiry flows with a test Google account.
- [ ] Keep existing-file overwrite disabled until two clients prove a stale remote edit is rejected and preserved. Google’s v3 docs do not establish the `If-Match` behavior required for safe overwrite.

### Gate 3 — GitHub identity and repository access

- [ ] If GitHub sign-in is wanted, configure the Appwrite GitHub OAuth provider separately from the GitHub App.
- [ ] Create the Markups GitHub App with only repository metadata and Contents read/write access. Set its installation URL/callback and webhook URL after the Function URL exists; retain the webhook secret only if webhook delivery is enabled.
- [ ] Keep the GitHub App private key, app ID/slug, and webhook secret in Appwrite Function secret variables. Never put them in `VITE_*`, `.env.example`, browser storage, or chat.
- [ ] Deploy `connector-api` on Node 22+, then install it for one test repository only. Verify user-to-installation ownership, read, branch listing, review-before-save, current-SHA conflict, protected branch, token expiry, uninstall, and repository removal.

### Gate 4 — local config, test evidence, and rollout

- [ ] Once Appwrite supplies IDs, set `VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT_ID`, `VITE_APPWRITE_CLOUD_FUNCTION_ID`, and `VITE_APPWRITE_CONNECTOR_FUNCTION_ID` in local `.env.local`, restart Vite, and verify the setup panel changes without changing local autosave behavior.
- [ ] Keep Appwrite runtime values (`MARKUPS_DATABASE_ID`, `MARKUPS_CLOUD_ENABLED`, `MARKUPS_CLOUD_USER_IDS`) in Function settings. Use the Function’s ephemeral `x-appwrite-key`; if a manually provisioned key is needed for the schema script, keep it outside the repo and remove temporary admin scopes afterward.
- [ ] Run two-account privacy checks: cross-user list/get/delete denied; unconsented note absent; logout/account switch cannot submit the previous user’s queued request; server logs/cache contain no note content or credentials.
- [ ] Run live conflict, idempotency, near-quota concurrent save, per-day limit, version expiry, consent revoke, batched account deletion, and recovery/export checks. Keep the local copy intact through every failure case.
- [ ] Walk through Trash restore and large-file/media paths in the current in-app browser profile. The earlier image-database warning is not reproduced in the current preview or Playwright smoke; its cause is still unknown.
- [ ] After an approved production deploy, confirm the editor makes no Clarity requests and GA contains no query/hash/referrer path or OAuth values.
- [ ] Retry full `npm audit` with working registry access, rerun unit/lint/build checks and the browser suites, then review the diff. Do not add these environment values to Vercel Production or deploy from `main` during this review.

## Deliberately later work

Automatic sync and a durable outbox, cross-device use of the new local note UUID, cloud attachments/media, public/revocable cloud shares, synced preferences/chat, multi-user editing, and server-side exports still need separate product/consent, abuse, quota, recovery, and architecture reviews. Existing local image recovery, editor performance, browser storage warning, and telemetry/privacy behavior remain editor-quality workstreams; Appwrite does not solve them automatically.

## Owner actions to unblock the next step

1. Sign in to Appwrite in the in-app browser tab. The empty `Markup` project create is already authorized; I can continue after sign-in.
2. Check the Education term end and choose a permitted plan by **2026-11-01** if needed. Confirm that the planned Markups use complies with Education's non-commercial/educational restriction before enabling public cloud users.
3. Confirm the exact host allowlist: production `markups.dev` and preview `markups-git-nir-bhay-sync-main-seo-be4512-nirbhay-987s-projects.vercel.app`, or send the replacement preview host.
4. Review the remaining component limits: 512 KiB/document, 25 documents, three previous versions for seven days and 50 revisions/day. Your 5 MiB/user and 25-user caps are recorded as approved.
5. Providers are deferred. After auth setup, create/identify one test account and share only its Appwrite user ID for the server allowlist, never credentials.
6. Local deletion behavior is settled and implemented: keep note history/cloud-link metadata recoverable through Trash/restore; no permanent purge or expiry is enabled.

I can handle schema review/provisioning, Function deployment/configuration, local `.env.local`, verification, and the branch fixes once the relevant console/write access and IDs are available.
