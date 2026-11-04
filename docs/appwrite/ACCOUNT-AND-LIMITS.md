# Account, entitlement and capacity

Plan rechecked 2026-10-28 through authenticated Appwrite MCP reads; organization usage snapshot is from 2026-10-27. Actual account fields, current public terms and our proposals are distinguished below.

## Verified account

| Item | Returned value |
|---|---|
| Organization | GitHub Student organization (name and ID omitted from this public repository) |
| Plan | `auto-1`, `GitHub Student Pack`, group `pro`, price `$0`, program active flag true |
| Accounting | `usagePerProject: true`; two-project organization limit |
| Existing project | `yoga`, New York (`nyc`); preserve it |
| Storage capacity | 150 GB stored per project; occupancy does not reset each billing period |
| API bandwidth | 2,000 GB per project per monthly usage period |
| Auth | 200,000 monthly active users |
| Database operations | 1,750,000 reads / 750,000 writes per period |
| Functions / compute | 3,500,000 executions / 1,000 GB-hours per period |
| Realtime | 500 concurrent connections / 6,000,000 messages per usage period |
| Platform file maximum | 5,000 MB; not the proposed Markups upload size |
| Scheduling | Cron flag false; interval minimum 60 minutes |
| Other flags | Dedicated databases unsupported; inactivity days 0; budget-cap flag false |
| Credits | None returned; credits and Education entitlement are different |
| Exact Education expiry | Not returned by the API; owner must check the Console. Current official policy says six months; older organizations past six months must choose a plan by 2026-11-01 or may be disabled. |

Count fields `databases`, `buckets`, `functions` returned zero in the plan API, but Appwrite's Education terms describe unlimited databases, buckets and functions per project. Treat the official Education terms as the entitlement description and verify actual resource creation in the new project; do not interpret those zero fields as a lack of service support.

Organization usage was read on 2026-10-27. It describes existing organization usage, not Markup consumption or a promise of future remaining capacity. Raw account evidence is intentionally kept out of this public repository.

## Requested project

**Name:** `Markup` · **proposed ID:** `markup` · **proposed region:** Singapore (`sgp`). The account reports Singapore as available; it is a reasonable starting region for an India-based owner. Latency/residency suitability has not been benchmarked. Region migration later is a separate project/data migration.

Expected regional endpoint after successful creation: `https://sgp.cloud.appwrite.io/v1`.

**Current status (2026-11-04):** The previously authorized empty project `Markup` (`markup`, Singapore) was created. The account now uses both project slots (`yoga` and `markup`). Appwrite reports the organization/project as read-only; attempts to add production and local web platforms were rejected with `402 team_read_only`. The new project has no tables, functions, users, storage buckets, credentials, or app data. Restore write access through the organization owner/support path before provisioning anything. Branch code is not deployed.

## Education policy and fallback

The [Appwrite Education page](https://appwrite.io/education) now describes six months, one redemption, two Pro-equivalent projects, no add-ons, and educational/non-commercial use. Its end-of-term policy can disable an organization until another plan is chosen. The [2026-09-30 notice](https://appwrite.io/changelog/entry/2026-09-30) says enforcement starts 2026-11-01 and existing organizations already past six months must choose a plan by then. The account API reports the plan active but omits the account-specific end date. Check Billing now; do not derive an expiry from the organization creation timestamp. Markups is intended as a public editor product, so do not use Education for its live cloud data unless Appwrite confirms the usage is allowed. Do not activate a paid plan or add-on automatically.

Live Education flags can differ from generic Pro marketing. For fallback planning, published Free limits are **2 GB storage, 5 GB monthly API bandwidth, 75,000 MAU, 750,000 executions, 500,000 reads and 250,000 writes**. Free resource counts are one database, one bucket, two Functions/project. Its two projects share resources, and inactivity can pause projects; resource exhaustion can freeze service. Recheck the Console before downgrade, including the existing `yoga` project. Sources: [pricing](https://appwrite.io/pricing), [operation accounting](https://appwrite.io/docs/advanced/billing/database-reads-and-writes).

## Pilot limits

The owner approved a **5 MiB total logical payload per user** and a **25-user allowlist ceiling** on 2026-10-28, with Google Drive and GitHub deferred. The remaining per-note, document-count, version-retention, daily-revision, physical-storage, and bandwidth controls below are implementation proposals; they still need owner review before live rollout.

| Application control | Current setting |
|---|---|
| Cohort | **Approved:** 25 invited/approved cloud users |
| Per-user logical payload | **Approved:** 5 MiB = 5,242,880 UTF-8 bytes, including notes, retained versions and later share copies |
| Documents | Proposal: 25, constrained by that same total quota |
| Per-note content | Proposal: 512 KiB UTF-8; local editor limits remain separate |
| Versions | Proposal: at most 3/document, at most 7 days, within the same 5 MiB |
| Cloud attachments / chat / AI keys | Disabled initially |
| Changed cloud revisions | Initial budget 50/day/user; independent of local autosave |
| Pilot physical storage ceiling | 500 MiB; alert/restrict new uploads at 80% |
| Pilot bandwidth budget | 2 GB/month; alert/restrict at 80% |

The application limits are implemented in the disabled cloud Function source. A refusal preserves local work and the UI offers manual export/provider save. The code does not automatically delete local notes. **These are not yet live-enforced** because no Appwrite project/function/database has been provisioned or exercised. Physical database/index/backup overhead differs from logical payload bytes, so monitor both after deployment.

### Capacity model

- 25 × 5 MiB = **125 MiB** logical payload; 100 users need 500 MiB and 200 users about 1,000 MiB before platform overhead.
- 25 × 50 changed revisions/day × 30 days = **37,500 revisions/month**.
- An assumed 4–5 row writes/revision for content, version, quota and idempotency state yields **150,000–187,500 writes/month**. Cleanup, failures, other tables and actual transaction costs must be measured. If the POC costs more, lower the pilot budget.
- At 20 KiB source/revision, uploads alone carry **768,000,000 bytes/month**. This is raw payload arithmetic, not an Appwrite bill: metering semantics, responses, downloads, provider relays and retries need measurement.
- Row reads/writes are counted by affected rows, not just HTTP calls. Do not multiply only user note saves and ignore ledger/version operations.
- The 150 GB entitlement is not a permanent user-storage promise. Expansion needs verified duration, permitted use and bandwidth/write capacity.

Enforce byte/count/revision budgets in authenticated server handlers with atomic accounting and idempotency. A browser counter or maximum file size does not enforce per-user totals. Current plan supports database encryption; public Free does not include that feature, so downgrade compatibility needs a schema/migration decision.

## Account actions before implementation

1. Sign in to the Appwrite Console in the connected in-app browser and check the account's Education end date/notice.
2. If the term has ended or is due to end by 2026-11-01, choose an eligible plan. Confirm Markups' public production use is allowed; Education terms prohibit non-educational or commercial use.
3. After the plan decision, finish the already-authorized empty `Markup` project creation and read it back; no resource provisioning is implied by this step.
4. Validate resource count/schedule/encryption capabilities in a bounded POC.
5. Validate the implemented transaction guard and owner ACL model against the actual TablesDB API.
6. Measure quota operation cost and physical usage before accepting real cloud notes.
7. Recheck plan/usage before increasing pilot size; do not change billing to resolve a quota error automatically.
