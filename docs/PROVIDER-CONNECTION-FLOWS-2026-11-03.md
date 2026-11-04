# Provider connections — implementation and owner setup

## What the user does

**Google Drive:** Load tools → Connect Google Drive → Google's file-access consent. To import, choose a Markdown/plain-text file in Google Picker and open it as a new local document. To save, use Save current document as a new Drive file and confirm content transfer. No existing-file selection is required to save a new file. Existing Drive files are not overwritten. This is a manual copy flow, not background synchronization. Browser-session tokens stay in memory; expired sessions require reconnecting.

**GitHub:** Sign in to the configured Markups account → Link GitHub identity → install the GitHub App with selected repositories on a personal account → return and reopen the panel → Load repositories → choose repository and branch → Browse files → choose folder/file → Open as a new local document. Edit locally, then Commit current document after reviewing repository, branch and relative path. Updating an existing file requires its opened SHA and server conflict checks. New paths can be entered explicitly; no automatic commits. Organization repositories are outside this pilot's supported identity model.

Local autosave continues independently of both providers. Neither connection uploads the entire local workspace. Unsupported binary/native Google Docs files are not Markdown imports. Provider previews use text-safe DOM operations.

## What the project owner must configure

Drive needs a Google Cloud project, enabled Drive and Picker APIs, web OAuth client with exact permitted JavaScript origins, OAuth consent/test-user/publishing configuration, restricted browser Picker API key and project number. Set public build IDs through VITE_GOOGLE_DRIVE_CLIENT_ID, VITE_GOOGLE_DRIVE_API_KEY and VITE_GOOGLE_DRIVE_APP_ID. A browser API key is not a server secret but still needs referrer/API restrictions. Never place OAuth client secrets into VITE_* values. Request only drive.file scope. CSP must permit the official Google Identity and Picker dependencies; a local mock test does not prove production CSP/OAuth correctness.

GitHub needs Appwrite project/auth platform and callback configuration, enabled GitHub OAuth identity linking, the authenticated connector Function, and a GitHub App restricted to selected repositories with Contents read/write permissions. Keep GitHub App private key and related secrets only in Function server settings. Browser config identifies the Appwrite endpoint/project/connector Function; browser callers never receive installation credentials. Review app permissions and exact return URL before real authorization.

No owner accounts, provider credentials, live OAuth configuration or remote documents were changed by this lane. Real authorization, new-copy writes, revoked-access handling, concurrency conflict behavior and production CSP must be validated in a controlled test account before advertising connections as available. Drive overwrite remains blocked pending a live conditional-write POC.

## Fixes in this pass

- Replaced infrastructure-heavy setup text with a clear unavailable state and manual-flow explanation. Hidden unusable Drive actions when build IDs are absent.
- Removed erroneous dependency on choosing a remote Drive file before saving a new copy; added explicit transfer confirmation.
- Recomputed provider control availability after async operations, including token expiration/disconnection; preserved disabled state after successful connection.
- Reported unconfirmed Google token revocation honestly instead of claiming provider revocation succeeded.
- Added authenticated GitHub folder/file browsing client and relative-folder validation, coordinated with backend github.files endpoint.
- Captured reviewed GitHub destination across async conversion; rejected stale account/destination changes before opening or committing.
- Reset previous branch/file selections when repository data reloads. Fixed modal focus restoration to the actual header button.
- Added UI regressions for missing configuration, new-file save without selection, declined confirmation, disconnect, focus restoration and GitHub browse selection; adapter regressions reject traversal/URL directory paths.

## Primary references

- Google Drive scope and Picker: https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- Google Picker web integration: https://developers.google.com/workspace/drive/picker/guides/web-picker
- GitHub Contents API and SHA update contract: https://docs.github.com/en/rest/repos/contents

These references define provider behavior; local tests use mocks and do not substitute for live provider acceptance.

## Verification and safe manual acceptance — 2026-11-03

- **Visible UI check on the user's local editor:** opened the existing `http://127.0.0.1:5174/` tab, opened Cloud & connections, closed and reopened it. The panel worked and returned focus correctly; the editor remained loaded and showed “All changes saved.” The visible panel says Markups Cloud is not available, GitHub depends on that account service, and Google Drive is not available in this build. Provider action buttons are intentionally absent/hidden, so the real import/commit buttons could not be exercised from this UI. No sign-in, consent, or transfer occurred.
- Automated connector/UI/backend tests: **63 passed across 4 test files** (`cloud-provider-ui`, `connectors`, `cloud-backend`, `appwriteClient`). Production Chromium cloud setup check: **1 passed**. This verifies local state handling, content confirmation, stale-document guards, GitHub destination/SHA behavior, Appwrite client requests, backend authorization/limits and the unavailable-state UI using test doubles.
- A live provider round-trip was not run. The current local shell has no Appwrite or Google Drive build IDs configured, and the cloud UI intentionally makes provider actions unavailable in this build. The tests above do not prove Google/GitHub OAuth, Appwrite deployment, or writes to external accounts.
- There is no background/two-way sync. Drive uses deliberate open/import and save-new-copy actions; GitHub uses deliberate file open and a confirmed single-file commit. Local autosave remains browser-local.

After the project owner configures the required services, test with disposable data and a non-production GitHub branch:

1. **Drive:** Set the reviewed Google OAuth IDs and allowed origin; restart Vite so it receives build variables. Open the editor's cloud button → load Drive tools → connect → choose a disposable `.md` file → open it as a new tab. Change a short line and save as a new Drive file. Confirm the new file appears and the source Drive file remains unchanged. Also decline the confirmation once and confirm that no file is created.
2. **GitHub:** Configure the Appwrite auth/connector functions, link GitHub identity, and install the app with access to a disposable test repository only. Select a non-production branch and a Markdown file, open it locally, make a small change, and use Commit only after reviewing repo/branch/path. Confirm GitHub records one changed file on that test branch. Re-open the same file and test a stale-SHA conflict by changing it remotely before saving; the editor should report the conflict and must not overwrite it.
3. **Markups Cloud (if enabled):** Sign into a test account, review and check per-document storage consent, save a non-sensitive note, refresh the document list, open the saved copy, then delete that cloud copy and verify local browser data remains. Use only disposable test content and verify the configured document/account quotas.
4. **Negative checks:** disconnect/revoke the provider and verify actions disable; switch to another local note during the confirmation step and verify the old note is not uploaded; test account switching and expired-session errors. Do not use production documents or a production GitHub branch for the first pass.

Environment readiness on the current local shell: Appwrite endpoint/project/function IDs and Google Drive client/API/app IDs are unset. This is the blocker for the real account test, not a failing local connector test.
