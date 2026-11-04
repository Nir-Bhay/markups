# Appwrite integration review — Markups

**Research:** 2026-10-27 · **Implementation status:** 2026-10-28 · **Branch:** `Nir-Bhay/sync-main-seo-geo-2026-10-25`

**Local implementation is present on this branch; no Appwrite project or provider application has been provisioned, and nothing has been deployed.** The Appwrite write gateway is unavailable in this session. The Browser Use attempt expired at sign-in without changes; the Appwrite sign-in page is open in the in-app browser. Do not treat source-level implementation or mocked tests as evidence of a live cloud service.

## Recommendation

Keep ordinary editing in the browser. Add optional identity and explicit Drive/GitHub Save/Open, followed by a small, separately enabled private backup. Sign-in alone must not upload existing notes. Provider connection, cloud backup, attachments, history and public sharing require separate choices.

The owner approved a **5 MiB combined note/version quota per opted-in user** and a **25-user allowlist cap**. The source also proposes 25 document slots, 512 KiB per note, at most three previous versions/document for seven days, and a 50-revision daily limit; those component limits still need review. Cloud attachments remain disabled. These are application limits in source, not provisioned or live-enforced Appwrite controls; the real transaction/ACL behavior still needs a project POC.

The connected organization currently returns **$0 GitHub Student Pack / Education (`auto-1`)**, active flag true, with two projects maximum; `yoga` uses one slot, so `Markup` would be the second. Per-project limits include 150 GB storage, 2 TB monthly bandwidth, 200K MAU, 1.75M reads, 750K writes and 3.5M Function executions. The API omits the term end date. Appwrite now states the Education plan lasts six months and prohibits non-educational or commercial use; its 2026-09-30 notice sets **2026-11-01** enforcement and requires older accounts to choose a plan by then. Check the Appwrite Console and confirm Markups' eligibility before creating live public user data. Do not promise permanent free use.

The implementation now scopes restore history to a local note ID, stores media in IndexedDB with bounded portable export, and refuses silent cloud backups containing unresolved local images. Appwrite does not solve those local editor concerns automatically.

## Implementation status

| Area | Branch status | Live proof still needed |
|---|---|---|
| Optional Appwrite auth and manual cloud notes | Implemented behind public config; no login or upload runs on editor boot; per-document consent is required | Create/read back project, configure OAuth/domain, provision Functions/TablesDB with private access, then test real auth, ACLs, transactions and deletion |
| Google Drive | Foreground OAuth/Picker and bounded Markdown Save/Open are implemented; saves create separate copies. Existing-file overwrite is disabled until conditional-write behavior is proven. | Configure Google OAuth/Picker credentials, verify consent/revoke/file operations, and prove stale-write rejection before enabling overwrite |
| GitHub | Selected personal repository adapter, server-side GitHub App bridge and SHA-guarded Save/Open are implemented | Create/install the GitHub App and Function; verify identity, scope, token expiry, uninstall and protected-branch behavior |
| Local history and media | Note-scoped restore and IndexedDB image storage/portable export implemented | Browser end-to-end regression and migration checks |
| Automatic sync, public cloud shares, remote media, preference/chat sync | Not implemented; intentionally outside this first manual-save slice | Separate design and proof gates before implementation |

The panel is expected to report setup required when public Appwrite configuration is missing. Google Drive and GitHub remain unavailable until their separate public/server configuration is supplied. No live provider file was read or written.

## Review documents

1. [Account, entitlement and pilot budget](ACCOUNT-AND-LIMITS.md)
2. [Feature gaps and source evidence](FEATURE-GAP-REVIEW.md)
3. [Consent, architecture, security and proof gates](ARCHITECTURE-AND-ROLLOUT.md)
4. [Cloud and provider API verification](API-VERIFICATION.md)
5. [Sanitized account evidence](account-evidence.json)
6. [Full recheck and owner action checklist](RECHECK-AND-OWNER-ACTIONS.md)

## Decisions for owner review

| Decision | Recommendation |
|---|---|
| Initial backend role | Optional account/connection metadata; foreground manual Save/Open |
| Private cloud copies | Selected documents, separate consent, 5 MiB pilot quota |
| Drive | Visible `.md` files, `drive.file`, Google Picker; foreground authorization first |
| GitHub | Selected-repository GitHub App, Contents permissions, branch/path/diff review |
| Automatic sync | Later, after quota, conflict, account-switch and revocation POCs |
| Public shares | Later, separate upload consent, expiry, revoke and metered traffic |
| Plan dependence | Check the Console term deadline and choose a plan by 2026-11-01 if needed; confirm Markups' public production use complies with Education terms; prepare fallback |

## Scope and evidence

Authenticated Appwrite reads, official Appwrite/Google/GitHub research, targeted source review, branch implementation and mocked/unit verification were completed. No note contents were uploaded, no end-user accounts/API keys were created, and no tables/buckets/functions or product cloud saving were enabled. Code-review-graph was not connected; repository navigation and targeted source reads were used. Historical audits and local tests are not treated as live runtime proof. Real Appwrite/provider POCs have not been executed.

Sources: [Appwrite Education](https://appwrite.io/education), [Education term-enforcement notice](https://appwrite.io/changelog/entry/2026-09-30), [Education project limits](https://appwrite.io/changelog/entry/2026-04-07), [GitHub Pack](https://education.github.com/pack), [Appwrite pricing](https://appwrite.io/pricing), [database operation accounting](https://appwrite.io/docs/advanced/billing/database-reads-and-writes), [Appwrite OAuth](https://appwrite.io/docs/products/auth/oauth2), [Drive scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth), [GitHub Apps vs OAuth](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps).
