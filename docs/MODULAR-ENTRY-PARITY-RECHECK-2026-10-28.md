# Modular entry parity recheck

**Date:** 2026-10-28  
**Branch:** `Nir-Bhay/sync-main-seo-geo-2026-10-25`  
**Checked revision:** `b5d5c666330c908154b4b6278fb9105097ecb03a` plus the current uncommitted working tree  
**Purpose:** Record the latest complete browser run against `main.modular.js`, keep the failure evidence actionable, and separate that experimental entry from the production entry.

## Result

The latest complete modular Playwright run finished with **42/53 passing and 11 failing tests**. It ran on 2026-10-28 against the modular Vite entry, not the production `main.js` entry:

| Spec | Observed failure | Area to address |
|---|---|---|
| `deep-preview.spec.js` | Code-block copy controls were absent; five Mermaid cases produced no SVG. | Inspect modular renderer post-processing and event timing. |
| `document-mode.spec.js` (2 tests) | Document Mode did not keep the Markdown source and edited block in sync. | Wire the mode controls to the modular editor and shared document state. |
| `export-file-integrity.spec.js` (2 tests) | PDF and Word flows left `#export-modal` without the `active` state; downloads were not reached. | Bind the static export dialog actions and close/confirm state to the modular entry. |
| `image-ir-update.spec.js` | Image resize called `getValue()` on a non-Monaco editor object. | The resize manager receives the wrong editor contract in the modular path; no-blink behavior remains unverified there. |
| `responsive-toolbar.spec.js` | Focus-mode assertion did not observe `body.focus-mode`. | Reproduce the focus button/manager event path in the modular page. |
| `storage-quota.spec.js` (2 tests) | Local-backup full-storage message was not found; image input lacked `data-ready="true"`. | Exercise the real quota feedback and image-ready lifecycle, not only test hooks. |
| `stress-preview-visual.spec.js` | Stress document produced zero Mermaid SVGs and one KaTeX error. | Diagnose Mermaid/KaTeX processing for large mixed documents. |
| `video-customize.spec.js` | `window.editor.setValue` was unavailable and the test stopped before exercising video editing. | Fix the modular editor diagnostic/API contract, then re-run the no-blink journey. |

The failure folders under `test-results/*-chromium-modular/error-context.md` contain the full Playwright page/error snapshots. The count above is 11 failed Playwright tests.

## Blocking architecture gap

The earlier string-tab-ID mismatch has been addressed locally: modular tabs now receive a stable note UUID, hydrate from IndexedDB, and share the Explorer/Trash identity. Unit and focused E2E coverage exercises persistence and Trash restoration. The latest full modular run confirms several of those flows, but does not certify every editor path; keep the remaining failures below as open parity work.

## What this says about production

- `src/main.js` remains the production entry. The modular run does not show that the production entry failed these tests.
- A fresh production full-suite run completed against the same source tree: **52 passed, 1 modular-only test skipped**, clean exit in 6.0 minutes; stress-preview blockers: 0. The production counterparts for Document Mode, export, image/video no-blink behavior, focus mode, storage quota, sharing, Trash, and deep preview passed.
- Focused modular coverage also passes for persistent tabs, Explorer/Trash restore, preview sidebars, and incoming shares. These passes do not certify full modular parity or all large-document flows.
- Keep the production entry on `main.js` until a complete suite, data-lifecycle checks, and owner review prove the modular entry safe to switch.

## Next implementation order

1. Repair the modular editor API contract used by image resize and test diagnostics.
2. Wire and verify Document Mode and export modal interactions.
3. Fix focus-mode click path and real storage quota feedback/readiness state.
4. Diagnose Mermaid/KaTeX stress rendering and missing code-block copy controls.
5. Re-run the complete modular suite; then run the complete production suite against the same source tree.

Do not switch the entry, push, or deploy based only on this modular pass count.

## Other unresolved recheck gates

- Fresh `npm outdated --json` could not fetch package metadata from `registry.npmjs.org` because npm terminated with `EACCES`. No current-version comparison was returned.
- `npm audit` could not reach its registry endpoint. Dependency vulnerability status remains unknown.
- Appwrite account context was re-read on 2026-10-28: only the existing `yoga` project is listed. The authorized `Markup` create is still unavailable through the connector because its write gateway is not exposed. The Browser Use attempt completed at the sign-in gate after two handoffs expired; no project/settings were changed. The Appwrite sign-in page is open in the in-app browser.
- A fresh `npm outdated --json` failed while fetching `appwrite` metadata from `registry.npmjs.org` (`EACCES`); a fresh `npm audit --omit=dev --json` also failed at the registry endpoint. Dependency freshness and advisories remain unknown.
- No push, deployment, or change to `main` was made.

