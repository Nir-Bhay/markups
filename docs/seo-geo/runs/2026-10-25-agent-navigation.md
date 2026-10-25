# 2026-10-25 — M-012 agent navigation guidance correction (isolated branch)

## Evidence before edit
- Draft PR: https://github.com/Nir-Bhay/markups/pull/71, original branch head `9eecd2b8e81676bd3ffbfb94a1d221e9c3879f20`.
- Exact-head Branch QA run for original head: https://github.com/Nir-Bhay/markups/actions/runs/40066202678 — success. This is branch CI, not protected Vercel preview validation.
- `AGENTS.md` at original head required code-review-graph tools unconditionally, asserted stale fixed line counts and mentioned only Vitest testing. The connected tools available for this run did not include code-review-graph. Existing `AI-DOCS/QUICK-START.md` and `AI-DOCS/AI-MEMORY.md` already acknowledge Playwright E2E in `tests/e2e/`.

## Branch-only source fix
- Commit: https://github.com/Nir-Bhay/markups/commit/fe1107e55251915e48166cb29a86ae82dd1539ce.
- Corrected graph usage to be conditional on actual connection and fresh index; required transparent fallback to GitHub tree/file searches. Removed stale fixed file/line counts and documented Vitest + Playwright test suites.
- Read-back confirmed changed AGENTS blob `60f749bbf608f185d30ec03789a28ca1d035fb5a` contains conditional graph instruction and Playwright E2E.
- Branch QA after source change: https://github.com/Nir-Bhay/markups/actions/runs/40165601605 (queued at first check; final result must be rechecked on the eventual exact head). Existing GitHub Pages workflow also auto-started; no manual deployment/promotion requested.

## Outstanding release gates
- M-012 documentation source corrected; **CI pending on final evidence commit**. No claim of production validation.
- Vercel preview remains login-protected; connected project/team read was 403 in prior evidence. Owner must grant Vercel app access to team `nirbhay-987s-projects` and authorize preview QA without disabling protection.
- Owner-only GSC tasks M-036/M-037/M-039, manual PDF/Word viewer QA M-049/M-052, consent/security review and editorial third-party corrections remain open.
- No changes to main, Vercel settings, credentials, analytics, third-party repositories or marketing channels. No ranking/indexing/AI-citation guarantees.
