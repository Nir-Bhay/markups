# Markup private text backup Function

Node 22+ Function, entrypoint `src/main.js`. Uses built-in fetch and the documented Appwrite TablesDB REST API; no production in-memory database or third-party dependency. No cloud resources were deployed by this implementation.

## Deployment configuration

- `APPWRITE_FUNCTION_API_ENDPOINT`: verified regional HTTPS Cloud endpoint, e.g. `https://sgp.cloud.appwrite.io/v1`.
- `APPWRITE_FUNCTION_PROJECT_ID`: verified project ID.
- `MARKUPS_DATABASE_ID`: `markups_cloud` after schema provisioning.
- Runtime dynamic API key header `x-appwrite-key`, with `rows.read`/`rows.write` scopes, or server-only `APPWRITE_API_KEY`. Verify transaction authorization with the deployed account. Never expose this key in frontend variables.
- `MARKUPS_CLOUD_ENABLED=true`: allows selected-note grants/saves. Missing/false pauses those actions while owner export/delete/revoke remain available.
- `MARKUPS_CLOUD_USER_IDS`: comma-separated explicit Appwrite user IDs, maximum 25. No automatic enrollment. Empty allowlist permits no grants/saves.
- Function execution permission `users`, logging disabled, timeout 120 seconds. Apply platform rate controls; the application mutation limits do not replace HTTP/WAF abuse protection.

Run `node provision.mjs` for a dry resource plan. Explicit `--apply` provisions/validates `../../schema.json` with server credentials. Setup needs temporary schema administration scopes; keep them out of the runtime key. Existing mismatched/public table configuration aborts setup rather than silently accepting broad permissions. Never reset the `control/pilot` row's live counters.

## Client protocol

POST JSON `{action,...payload}`. Supply an Appwrite JWT in `x-markups-user-jwt` (preferred for `Functions.createExecution` headers), or the runtime `x-appwrite-user-jwt`. Identity is verified through `GET /account`; client owner IDs and claimed user headers are never trusted. Response: `{ok:true,data}` or `{ok:false,error:{code,message,...safeDetails}}`, with private/no-store headers.

| Action | Additional fields |
|---|---|
| `consent.get` / `usage.get` / `documents.list` | none |
| `consent.grant` | `documentId` UUID, `policyVersion: "2026-10-27"` |
| `consent.revoke` / `documents.get` | `documentId` UUID |
| `documents.save` | `documentId`, `title`, `content`, `expectedRevision` (0 for create), `operationId` UUID |
| `documents.delete` | `documentId`, `expectedRevision`, `operationId` UUID |
| `account.deleteData` | `confirmation: "DELETE MY CLOUD DATA"`; call again while `complete:false` |

Save returns `{document: metadata, usage}` without echoing or duplicating Markdown in its idempotency record. Get returns `{document:{...metadata,content,versions}}`; list returns metadata. Revoke stops saves and retains owner export/delete. `account.deleteData` removes cloud data, not the Auth account/provider grants; the caller must finish all batches before separately deleting identity.

Quotas: 5 MiB UTF-8 title/text/current-and-retained versions, 512 KiB/note, 25 notes, three previous versions for seven days, 50 changed revisions/day and 50 new save/delete operation IDs/day. Other mutations cap at 100/day. Dates reset on UTC days. Daily limits and byte quotas are authoritative server checks. Up to 25 allowlisted users share a 125 MiB logical payload guard; this does not measure all physical indexes/logs/backups/bandwidth. Monitor actual platform metrics separately.

Local `markups-img:`/inline image data is refused to avoid a misleading complete backup. No cloud attachments or public sharing are offered here. Deleted document IDs remain in bounded 30-day metadata tombstones; stale queues must not outlive that horizon. Recreate deliberately under a new UUID. `usage.get` compacts expired snapshots when due, and reads never return expired versions. Expired operation rows are removed in bounded batches on a new day's mutation; no exact-time scheduling is assumed.

## Concurrency and required deployment proof

Every mutation stages a unique write to the shared `control/pilot` guard **before** reading document/revision/quota state. All writes are committed in the same TablesDB transaction. API transaction conflicts refetch/re-stage with a bounded retry; an application revision mismatch returns `REVISION_CONFLICT` and is never retried into an overwrite. This serializes a small pilot globally; scale work should remove contention only with equivalent verified guarantees.

Official behavior checked: [transactions](https://appwrite.io/docs/products/databases/tablesdb/transactions), [REST routes](https://appwrite.io/docs/references/cloud/server-rest/tablesDB), and account catalog API-key scopes. A real Cloud POC must still confirm guard-before-read conflict semantics, large text column support, schema/index readiness, JWT forwarding and private ACL denial. Do not enable real note storage merely because local adapter tests pass. No note text, tokens, provider response bodies or upstream errors are logged by this handler.
