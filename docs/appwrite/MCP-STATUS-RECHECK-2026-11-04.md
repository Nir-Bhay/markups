# Appwrite MCP status recheck — 2026-11-04

## Readback

- Appwrite MCP OAuth connection is working in `oauth_console` mode.
- The connected organization reports a two-project limit. Organization identifiers and raw account evidence are kept out of this public repository.
- Existing project: `yoga` (`nyc`).
- Created the previously authorized empty project: **Markup**, ID `markup`, region `sgp`, active.
- Organization now has 2/2 projects (`yoga`, `markup`). The new project has zero TablesDBs, users, storage buckets, Functions, sites, messaging, and teams. No API keys or app data were created.
- Readback reports the organization status as `readonly`.

## Write attempt and blocker

Tried to add two web platforms to the new project: production `markups.dev` and local development `127.0.0.1`. Both Appwrite writes returned **HTTP 402 `team_read_only`**: “This project is in readonly mode. Please contact the organization admin for details.” Neither platform was added.

The MCP now exposes its write gateway and project creation succeeded. Remaining writes are blocked by Appwrite's organization/project read-only state, not by missing MCP tools. Do not work around this by switching plans or adding billing without the owner's decision.

## Remaining after Appwrite restores write access

1. Confirm organization eligibility/status in Appwrite Console and restore write access through the organization owner/support path.
2. Add the exact production, local, and confirmed preview web hosts.
3. Provision the `markups_cloud` TablesDB schema and deploy the local `cloud-api` and `connector-api` Functions with least-privilege scopes.
4. Configure `VITE_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1`, `VITE_APPWRITE_PROJECT_ID=markup`, and the resulting cloud/connector Function IDs in local/Vercel build environments.
5. Configure GitHub OAuth/App credentials and Google Drive OAuth separately. GitHub App private keys and Appwrite runtime keys belong only in server-side Function settings; never in VITE variables.
6. Run a controlled test-account flow before enabling cloud saves or provider writes.

Project creation was previously authorized. No production deployment, user data, additional plan, billing change, secret, function, table, or provider grant was created in this recheck.
