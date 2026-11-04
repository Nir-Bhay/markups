# Modular editor parity recheck — 2026-11-03

## Verified result

The final complete Chromium modular run passed **64/64 tests**, exit **0**, in **6.6 minutes**. There were no skips or failed tests. This supersedes the 2026-10-28 browser failure count for the workflows covered by the current suite. It does not switch the deployed entry or certify unsupported/live connected services.

Command executed from `E:/markups/markups`:

```powershell
$env:PLAYWRIGHT_PORT='4273'
$env:PLAYWRIGHT_VIDEO='off'
npm exec --yes --package=node@24 -- node scripts/run-e2e-modular.mjs --workers=1
```

The final command additionally piped stdout/stderr through Tee-Object to `test-results/modular-final-2026-11-03.log`, preserving the native exit status. Node24 ran the wrapper, Vite and Playwright children. The actual HTML was fetched during this run and showed `/src/main.modular.js`; the runner also verifies the expected entry before starting Playwright. Tests ran with one worker and video disabled to reduce resource pressure. Failure screenshots and the configured retry traces remained enabled; this was not a Firefox/Safari run.

Evidence:

- `test-results/modular-final-2026-11-03.log`: final `64 passed (6.6m)`, owned server stopped, exit 0 observed.
- `test-results/chromium-modular/.last-run.json`: `status: passed`, `failedTests: []`.
- Stress fixture: `STRESS_QA blockers: 0 []` in final log. Fixture reports/screenshots are under `test-results/qa/` and can be overwritten by later audits; the final run log is the durable local evidence for this pass.
- `npm run lint`: exit 0, no source errors.
- Focused autosave/tabs/media/export/source-mapping unit recheck: seven files, 42 tests passed before the final math/manual-save fix; subsequent affected Markdown/autosave/tabs/export unit recheck: four files, 28 tests passed, including the escaped-dollar regression. The parent review owns final whole-project unit/build totals.

## Source changes and the resulting behavior

1. **Real editor contract.** Modular diagnostics and image resize use the actual Monaco instance. Document Mode and image/video edits preserve the preview DOM while updating the note content. Browser coverage exercises editing, persistence and no-blink flows.
2. **Preview controls.** Code fences receive real copy controls without copying UI chrome; Mermaid wrappers retain source metadata and expose the shared preview class. Source-line annotation continues using original Markdown. Modular view controls remain disabled until asynchronous boot has bound their handlers, preventing the first click from being discarded during note hydration.
3. **Math parser.** The former custom dollar regex truncated escaped dollars inside math, causing a real stress-fixture KaTeX error. Modular Markdown initialization now uses the same installed marked-katex-extension as the production entry. A unit regression checks escaped-dollar math and ordinary currency prose; final stress coverage reports zero blockers.
4. **Export dialog.** The modular entry now binds the existing format dialog to the current document. Basic PDF/Word/Markdown/HTML/text/PNG/print and copy actions route through shared services, with real errors, busy feedback and focus restoration. Portable local-image conversion happens at the export/share boundary. PDF and Word tests verify actual downloaded file signatures/format, not every pagination or formatting property.
5. **Local images.** Validated uploaded images are stored in IndexedDB before a `markups-img:` reference is inserted. Preview resolves only stored image blobs, passes known local blob URLs to the sanitizer, caches them and revokes them on disposal. Share/export converts references to portable content; missing images stop the operation instead of silently generating a broken document. Browser coverage verifies image persistence/reload while the legacy localStorage image mirror is full.
6. **Recovery when the tab backup is full.** IndexedDB stores open-tab identity metadata separately from note content. When localStorage tab state is unavailable, the modular entry restores these identities and hydrates from the existing note rows. Recovery metadata has an intentionally old positive timestamp so it cannot overwrite a newer durable note with its empty metadata placeholder. A unit checks this sentinel; the browser quota test restores seven tabs/documents with the actual modular localStorage key blocked. Initial backup warnings are replayed after the application's notification listeners are ready.
7. **Truthful save feedback.** The modular entry binds its existing save-status element to actual autosave states. Errors remain visible until a later confirmed save. The autosave hash guard restores Saved only for the same active note/content already confirmed by a successful write; tests verify different-note and failed-write cases do not borrow that success. Manual app.save now waits for persistence and reads back the captured text before returning success or emitting Saved; a browser test forces note writes to fail, verifies no Saved event and unchanged editor text, then verifies recovery after restoring storage.
8. **AI readiness.** The readiness marker is published only after successful initialization. The layout persistence test waits for initialization and opens the panel only if it was not already restored, avoiding an accidental close after reload. Settings sizing, composer visibility and all layout choices pass the final browser run.
9. **Failure and test isolation.** The modular boot error view uses textContent and a bound reload listener, replacing interpolated error HTML and an inline handler. The Vite entry selector handles timestamp query strings after HMR. The runner rejects a server serving the wrong entry and uses longer bounded readiness probes. Browser/entry artifacts are isolated by Playwright configuration.

New modules/tests requiring inclusion in a reviewed candidate: `src/features/export-dialog/index.js`, `src/features/preview-code/index.js`, `src/__tests__/modularExportDialog.test.js`, and `tests/e2e/modular-manual-save.spec.js`. The complete working tree includes other pre-existing/untracked changes; do not commit a tracked diff alone and assume it contains the whole application.

## Earlier attempts and limits

Earlier partial runs were invalidated by HMR, entry-selection fallback, resource contention, deliberate interruption or process cleanup. One full attempt returned 60/63: an HMR navigation failure plus genuine preview-startup and escaped-dollar issues. Those issues were diagnosed and fixed; the final 64-case run was source-frozen and passed. No earlier interrupted/contaminated attempt is counted as a pass. An overly broad process-cleanup filter also stopped the parent's concurrent production run; the parent reran that suite independently. No project files or user documents were removed by that process cleanup.

The original code-review graph was unavailable; source navigation and targeted reads were used. The final tests cover Chromium user workflows, not a penetration test, exact large-file capacity, all export fidelity, Firefox/Safari compatibility or real OAuth/provider writes. The modular export dialog still lacks full parity for some advanced option controls (PDF headers/page numbers, HTML theme/minification, detailed PNG options and cancelable progress). Keep this entry experimental until that option fidelity and broader release checks are explicitly reviewed. Production remains on `src/main.js`.

Relevant primary references: Vite transformIndexHtml hook behavior at https://vite.dev/guide/api-plugin.html and Playwright server reuse at https://playwright.dev/docs/test-webserver. The installed marked-katex-extension source was inspected to compare canonical escaped-delimiter handling with the removed custom tokenizer.
