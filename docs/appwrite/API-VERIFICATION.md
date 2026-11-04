# Cloud and provider API verification

Checked 2026-10-28 against official primary documentation. This verifies documented request shapes, not a live Appwrite project or provider account.

## Appwrite Functions

The browser SDK's synchronous `Functions.createExecution` accepts custom request headers and returns the function's response body and HTTP status code. Its `status` field is the execution lifecycle state, so code must inspect `responseStatusCode` for the handler's HTTP status. Appwrite also forwards `x-appwrite-user-jwt` when a signed-in user invokes a function. The current client supplies an explicit user JWT header and reads the synchronous response; the function independently validates the JWT with `GET /account`.

Sources: [createExecution API](https://appwrite.io/docs/references/cloud/client-web/functions), [Develop Appwrite Functions](https://appwrite.io/docs/products/functions/develop).

## Appwrite TablesDB

TablesDB supports transactions for row creation, update, upsert, deletion and numeric operators. Pass the transaction ID in each operation; create/update carry it in JSON request bodies, while get/list/delete use a query parameter. Reads in a transaction can see earlier staged operations. Commit and rollback use `PATCH /tablesdb/transactions/{transactionId}` with `commit: true` or `rollback: true`. The documented operation limits are 100 on Free, 1,000 on Pro and 2,500 on Scale.

The local REST adapter's request placement and transaction lifecycle match these documented shapes. The shared pilot guard and quota behavior still need a deployed concurrency POC.

Sources: [TablesDB rows](https://appwrite.io/docs/products/databases/tablesdb/rows), [Transactions](https://appwrite.io/docs/products/databases/tablesdb/transactions), [TablesDB API reference](https://appwrite.io/docs/references/cloud/server-rest/tablesDB).

## Google Drive v3

`files.update` uses `PATCH` and supports `media`, `multipart` and `resumable` uploads. The API reference lists a 5,120 GB maximum, while Google's upload guide recommends multipart/simple uploads for small transfers and resumable uploads for larger or interruption-prone transfers. Markups caps its provider files at 5 MiB.

The official v3 `files.update` reference does not establish that `If-Match` is honored for uploaded file updates or document a stale-ETag response. The v2-to-v3 migration table also maps the old `etag` resource field to `n/a`. The earlier adapter therefore could have overwritten remote edits if the conditional header were ignored. **Existing-file overwrites are now disabled by default.** The UI saves a separate Drive copy and preserves the selected remote file. Re-enable overwrite only after a live two-client stale-write POC proves the remote file remains unchanged and the stale update is rejected.

Sources: [files.update](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/update), [Upload file data](https://developers.google.com/workspace/drive/api/guides/manage-uploads), [Drive v2-to-v3 reference](https://developers.google.com/workspace/drive/api/guides/v2-to-v3-reference).

## GitHub REST

The Contents API supports all response features for files up to 1 MB. From 1–100 MB, it supports only raw/object media types; files over 100 MB are unsupported by that endpoint. The Git Blobs endpoint supports up to 100 MB. Updating an existing file requires the current file SHA, and the API lists conflict responses; the docs do not define one exact error body for every stale-SHA case.

The connector reads the current SHA, uses Git Blobs when the Contents response does not include file bytes, caps Markups files at 5 MiB, submits the expected SHA for writes, and maps provider conflicts to a safe local-preserving error.

Sources: [Repository contents endpoints](https://docs.github.com/en/rest/repos/contents), [Git blobs endpoints](https://docs.github.com/en/rest/git/blobs), [Repository limits](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits).

## Local verification and limits

- `src/__tests__/appwriteClient.test.js`, `src/__tests__/cloud-backend.test.js` and `src/__tests__/connectors.test.js`: 39 tests passed after the Drive overwrite gate was added.
- `tests/e2e/cloud-setup.spec.js`: passed with the copy-only Drive notice and disabled controls visible in the no-credentials build; it also found no local media-database startup warning in Playwright Chromium. The ChatGPT in-app browser did show that warning on its fresh load. The cause is unverified; the UI says the legacy image backup was preserved.
- `npm run build` passed; targeted ESLint on the changed JavaScript modules passed; `git diff --check` passed with only the existing LF-to-CRLF warning.
- Appwrite project creation remains blocked: the connector write gateway is unavailable and the Browser Use run ended at sign-in without changes. The Appwrite sign-in page is open in the in-app browser. The organization is on a six-month GitHub Student Pack Education plan whose current terms prohibit non-educational/commercial use; check eligibility and the 2026-11-01 plan deadline before a public production POC. The local build has no Appwrite or Drive credentials, so auth, ACLs, transactions, provider revocation and live conflict behavior are not verified.
