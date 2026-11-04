# Editor readiness — 2026-11-03

> Follow-up correction: original Git history was subsequently located in hidden `.git_disabled`. Explicit metadata access and fetch succeeded: the feature branch is 40 commits ahead of main, zero behind, plus local edits. The Initial-commit finding below describes ordinary Git discovery in the enclosing workspace, not loss of project history. See `GIT-RECOVERY-2026-11-03.md`. Baseline tests below predate subsequent provider/security/modular fixes; post-fix evidence belongs in the progress log.

Review only; no application fixes, push or deployment in this review.

## Fresh evidence

- Vercel `get_deployment(markups.dev)` returns READY production from `main`, SHA `9458092d60aa678e2bc8253f205bb56717a3fca6`, deployment `dpl_CdT7fmwR9apbKWDdAH1BPc2egqwQ`.
- `npm test`: exit 0; 101 files, 691 tests passed. jsdom emitted stylesheet/navigation warnings; passing tests are not a complete browser/security certification.
- `npm run build`: exit 0. Monaco output is about 2.27 MB before gzip; performance profiling remains relevant.
- `npm audit --omit=dev --json`: exit 0; zero reported production dependency advisories. This excludes development dependencies and application-logic vulnerabilities.
- Focused production browser regression cases passed: divider resize/view modes; typing/live preview; Mermaid source spacing; Markdown paragraph gaps; green toolbar density control. Full cross-browser/export/security coverage was not rerun.
- Current `git rev-parse --show-toplevel` resolves to `E:/markups`; HEAD is `31d2cf9 Initial commit`; `git remote -v` is empty. The earlier feature-branch history is not the active Git history here. Do not reset or replace files to repair this. Recover the original repository/history safely, preserve the full working tree, then compare to production.

## Cloud explanation

`src/features/cloud/index.js` displays setup-required text and disables Drive actions unless public provider configuration exists. `src/services/cloud/appwriteClient.js` requires a valid endpoint/project and appropriate Function IDs; it loads the SDK lazily on requested actions. Local editing/autosave does not require Appwrite. Cloud is an optional future copy/backup, not the current local-save mechanism. Drive is a separate provider connection; new-copy saving is designed separately from overwriting, which remains blocked pending conditional-write validation. Do not advertise either service as live based on source scaffolding.

## Release priorities

1. Restore trustworthy Git ancestry/remote and produce an exact production-to-candidate diff; current history cannot support exact commit/improvement counts.
2. Package a local-editor release separately from unconfigured cloud/provider activation. Simplify the confusing setup popup before public exposure.
3. Run full production E2E, real export integrity, recovery/quota, Firefox/Safari, keyboard/accessibility, large-document and image stress checks on the exact release candidate.
4. Review CSP: current vercel.json permits unsafe-inline/unsafe-eval and broad https connect destinations. Test a restricted policy in preview before enforcing it; this is a hardening concern, not proof of exploitation.
5. Verify telemetry network payloads, AI key/context handling, hostile Markdown/links/SVG/imports and share-content leakage on the actual candidate. Source sanitization and Mermaid strict mode exist but are not a penetration test.
6. Keep the production main.js entry. The 2026-10-28 modular parity report had 11 failures; it is historical evidence, not a fresh result. Resolve/retest before switching entry paths.
7. Enable cloud only after project/plan/configuration, owner isolation, per-note consent, quotas, concurrent-write/account-switch/recovery and real provider tests. Account/plan state was not freshly rechecked in this editor review.

Historical changes recorded in the prior implementation documents include Trash/restore and stable note identity, local version handling, editor regression fixes, AI panel changes, preview sanitization, telemetry restrictions and cloud/provider scaffolding. Treat these as implemented areas to reconcile against the recovered production diff, not an exact verified list of changes absent from production.

Verdict: local production-entry candidate passes the checks above; exact release diff and broader release/security evidence remain open. Full cloud release is not ready.
