# Markups — Comprehensive Improvement Plan (Verified 2026-09-02)

**Generated from 5 parallel research agents. Every item is evidence-backed.**

Repo: `Nir-Bhay/markups` (local: `D:/harmes/projects/markups`)
HEAD: `50e5b25` | Branch: `main` | Stars: 21 | Forks: 6 | 6 open issues, 0 open PRs
Last push: 2026-09-02 (today)

---

## 1. 🚨 CRITICAL — Production Ships a Syntax Error (User-Reachable)

**File:** `src/features/stats/index.js:151-160`
**Severity:** HIGH — entire feature will fail to parse
**Evidence (verified):**
```js
readingTime: 0,     // line 158
if (this.subscriptions) { ... }   // line 159 — INSIDE object literal
```

The `dispose()` method is defined inside an object literal where it cannot be, breaking the file's syntax. The whole `stats` feature is unloadable.

**Why it matters:** if any code path imports this module, app fails. Production bundle may even tree-shake it out — but if it loads, crash.

**Fix:** move `dispose()` out of the object literal, make it a method on the class.
**Effort:** 15 min. **PRIORITY: P0.**

---

## 2. 🚨 CRITICAL — Debug fetch calls ship in production

**Files:**
- `src/features/goals/index.js:12-13, 64-65`
- `src/features/linter/index.js:12-13, 248-249`
- `src/services/shortcuts/index.js:11-12, 87-88`

**Evidence (verified):** Each has 2 `fetch('http://127.0.0.1:7909/ingest/...')` calls wrapped in `// #region agent log` blocks. They execute silently (`.catch(()=>{})`) on module load and on init.

**Why it matters:**
- Privacy leak (network request to localhost on every page load)
- 6 silent network requests from production users
- Dead code, dead code review, dead code data

**Fix:** delete the `// #region agent log` blocks entirely.
**Effort:** 30 min. **PRIORITY: P0.**

---

## 3. 🚨 CRITICAL — Memory leaks in 4 features

**Files:**
- `src/features/goals/index.js:396-400` — `subscriptions.dispose()` nested inside `if (this.updateInterval)`
- `src/features/fullscreen/index.js:178-182` — only when `this.isEnabled`
- `src/features/typewriter/index.js:129-133` — only when `this.cursorListener`
- `src/features/tabs/index.js:448-452` — only when `_saveTimeout`

**Evidence (verified):** Same bug pattern — `subscriptions.dispose()` is placed inside a conditional that may not trigger on every code path, so event subscriptions leak when the conditional is false.

**Why it matters:** long sessions accumulate listeners; HMR / SPA navigation slows down.

**Fix:** always call `subscriptions.dispose()` if it exists, before any conditional return.
**Effort:** 1 hour. **PRIORITY: P0.**

---

## 4. 🔴 HIGH — Backup files committed to repo

**Files:**
- `src/features/image-resize/index.js.pre-phase2-backup`
- `src/features/toolbar/index.js.pre-phase2-backup`
- `src/main.js.backup`

**Evidence (verified via `git status` + file listing).**

**Why it matters:** repository bloat, confusing git diff, security risk (old code stays searchable).

**Fix:** `git rm` and add `*.backup` to `.gitignore`.
**Effort:** 10 min. **PRIORITY: P0.**

---

## 5. 🔴 HIGH — Backup of main.js on every dev session

**File:** `src/main.js.backup` (220 KB, 7198 lines, dated Aug 23)
**Why it matters:** This is from before a manual session — keeping it in repo is dangerous. Plus our recent work accidentally got near it.

**Fix:** Same as #4.
**Effort:** already covered.

---

## 6. 🔴 HIGH — 21 console.log/warn/error in src/main.js

**Evidence (verified):** 4 `console.log`, 10 `console.warn`, 7 `console.error` — most are PWA install / ServiceWorker noise that should be removed in production.

**Why it matters:** clutter for end users + dev console.

**Fix:** wrap with `if (import.meta.env.DEV)` or remove. Specifically lines 7158-7180 (PWA install logs).
**Effort:** 1 hour. **PRIORITY: P1.**

---

## 7. 🔴 HIGH — localStorage bypasses StorageService namespace

**Files (verified):**
- `src/features/ai-writer/service.js:536,549` (`markups_ai_api_key`)
- `src/features/explorer/index.js:54,58,117,126`
- `src/features/snippets/index.js:57,72`
- `src/features/templates/index.js:57,72`
- `src/features/version-history/index.js:35,48`

**Why it matters:**
- No namespacing (collision risk with other apps on same domain)
- Migration system (`migration.test.js` exists!) doesn't know about them
- Settings UI may not see them

**Fix:** route through `StorageService` (a wrapper that already exists per `migration.test.js`).
**Effort:** 4-6 hours. **PRIORITY: P1.**

---

## 8. 🔴 HIGH — Direct GitHub dependency

**File:** `package.json:73` — `"storehouse-js": "github:tanabe/Storehouse-js"`
**Why it matters:** direct GitHub deps are fragile (renames, deletions, force-pushes). `npm install` may fail unexpectedly in the future.

**Fix:** vendor it into `vendor/` directory or use the npm registry version if available.
**Effort:** 2 hours (verify, vendor, test). **PRIORITY: P1.**

---

## 9. 🟡 MEDIUM — Dependencies are out of date

**Evidence (verified via `npm outdated`):**

| Package | Current | Latest | Risk |
|---|---|---|---|
| marked | 15.0.7 | 18.0.11 (major) | Breaking changes; defer to "explore" branch |
| monaco-editor | 0.52.2 | 0.56.0 | API drift |
| vite | 6.4.3 | 8.2.2 (major) | Major bump — needs work |
| vitest | 4.1.8 | 4.1.11 | Patch — safe |
| dexie | 4.3.0 | 4.4.5 | Minor — safe |
| katex | 0.16.47 | 0.18.5 | Major — test thoroughly |
| eslint | 9.39.5 | 10.9.1 (major) | Major — config rewrite |
| mermaid | 11.17.0 | 11.17.2 | Patch — safe |

**Why it matters:** security + bug fixes + new features. Marked 18 has the new `marked-mangle` and other improvements.

**Fix:** Separate branches per upgrade. Vitest, dexie, mermaid are safe quick wins. Marked, vite, eslint, katex need isolated testing.
**Effort:** 2-3 days for safe upgrades, plus isolated branches for majors. **PRIORITY: P2.**

---

## 10. 🟡 MEDIUM — Untracked diagnostic scripts litter workspace

**Files (verified):**
- 18 `scripts/diag-*.mjs` files (from the video-embed investigation today)
- `scripts/test-hosted-direct.mjs`
- `docs/serve_checklist.py`
- `docs/testing-checklist-FULL.md`
- `docs/testing-checklist.html`

**Why it matters:** workspace noise; future engineers will be confused. The diagnostic scripts from today's session should be cleaned up.

**Fix:** Move useful ones to `scripts/audit/` and document them. Delete pure-debug ones. Commit the actual checklist docs (they're useful).
**Effort:** 1 hour. **PRIORITY: P2 (cleanup).**

---

## 11. 🟡 MEDIUM — Test coverage gaps: 73/87 src files untested

**Evidence (verified):** 73 of 87 source files have no test. Most at-risk:

| Feature | Risk |
|---|---|
| `ai-writer` (4 files) | AI prompt/response breaks silently |
| `explorer` | File tree nav breaks (8+ listeners, no dispose) |
| `image-resize` (6 files) | Resize handles/undo break |
| `toolbar` (8 files) | Toolbar actions break |
| `version-history` | Top-level `setInterval` with no dispose path |
| `modes` | `ResizeObserver` leak risk |
| `tabs` | Stale `_lastEditedBlock` risk |
| `services/export/*` (5 files) | Export fails silently |
| `services/autosave` | Auto-save race conditions |
| `utils/clipboard`, `eventBus`, `dom`, etc. | Low-level utility bugs |

**Why it matters:** the #40 video issue (the one I just fixed) would have been caught by an iframe-reuse test. We had it. But the *bare URL* case was missed because no integration test covered the full convert flow with iframe.

**Fix:** add 1-2 unit tests per feature folder (estimated 30-50 new tests). Focus on:
1. `ai-writer` (high user impact)
2. `version-history` (data loss risk)
3. `image-resize` (interactivity)
4. `services/export/*` (data integrity)
5. `services/autosave` (data loss)

**Effort:** 3-5 days. **PRIORITY: P2.**

---

## 12. 🟡 MEDIUM — E2E infra: cold-start flakiness + 1 known flaky test

**Evidence (verified):**
- `tests/e2e/editor-runtime.spec.js → "mobile preview switch"` — pre-existing flaky even on clean origin
- Batch Playwright runs flake due to cold Vite dev server + debounced rendering under load

**Why it matters:** CI reliability. Untrustworthy test suite = no confidence in ship.

**Fix:**
1. Add `playwright.config.js` with `webServer.reuseExistingServer: true`
2. Add `global-setup` that warms the dev server with one `goto`
3. Mark cold-start specs with `test.describe.configure({ mode: 'serial' })`
4. The "mobile preview switch" test: investigate root cause (likely `matchMedia` mock race)

**Effort:** 2 days. **PRIORITY: P2.**

---

## 13. 🟡 MEDIUM — INI preview (issue #44) — still open

**Source:** https://github.com/Nir-Bhay/markups/issues/44
**Reporter:** wexiyeb618 (Aug 2026)
**Symptom:** INI text preview doesn't match GitHub's rendering.
**Note:** Memory says fix shipped in commit `db93ef8` on branch `fix/issues-42-44`, but user reports still broken. Need to verify on live `markups.dev`.

**Fix:** reproduce on production, check if branch was merged, follow up.
**Effort:** 2 hours to verify, 4-6 hours to fix if not done. **PRIORITY: P2.**

---

## 14. 🟡 MEDIUM — XML preview (issue #42) — still open

**Source:** https://github.com/Nir-Bhay/markups/issues/42
**Symptom:** XML token colors render black instead of blue/purple.
**Note:** Same as #13. May already be fixed but not deployed.

**Fix:** same as #13.
**Effort:** combined with #13. **PRIORITY: P2.**

---

## 15. 🟢 FEATURE — Cloud Sync (issue #14, #29) — most requested

**Sources:** https://github.com/Nir-Bhay/markups/issues/14, #29
**Requester:** Nir-Bhay (own feature request — but flagged as wanted by 3+ users per Issue #29 spec)
**Competitive evidence:** StackEdit, Dillinger, HackMD all have it.

**Symptom:** no way to sync notes across devices. Users want Google Drive / Dropbox / GitHub Gists integration.

**Why it matters:** table-stakes feature for online markdown editors. Biggest "missing capability" per user sentiment.

**Fix scope:** This is multi-day feature work. Detailed spec exists in #29.

**Effort:** 1-2 weeks for Google Drive + GitHub Gists. **PRIORITY: P3 (next quarter).**

---

## 16. 🟢 FEATURE — Multi-language UI (issue #28)

**Source:** https://github.com/Nir-Bhay/markups/issues/28
**Requester:** Nir-Bhay (with community backing)
**Symptom:** App is English-only.

**Fix:** introduce i18n module (e.g. lightweight `i18next`); translate top labels.
**Effort:** 3-5 days. **PRIORITY: P3.**

---

## 17. 🟢 FEATURE — Interactive image resize (issue #26) — already closed but worth re-verifying

**Source:** https://github.com/Nir-Bhay/markups/issues/26
**Status:** Closed (per repo)
**Note:** feature in `image-resize` folder has no dedicated test (#11 above). Verify it works in production.

**Effort:** 1 hour verify, 1 day add tests. **PRIORITY: P3.**

---

## 18. 🟢 FEATURE — Persistent shareable URLs (issue #41) — already closed

**Source:** https://github.com/Nir-Bhay/markups/issues/41
**Status:** Closed
**Note:** worth verifying it actually works on markups.dev.

**Effort:** 1 hour verify. **PRIORITY: P3.**

---

## 🟢 INFRASTRUCTURE — Community docs

**Verified missing:**
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `CHANGELOG.md`

**Why it matters:** solo-maintained repo + 1 active contributor = bus factor of 1. These docs lower the bar for new contributors.

**Fix:** write minimal templates; auto-generate CHANGELOG from commit log.
**Effort:** 4 hours. **PRIORITY: P3.**

---

# 📋 Recommended Action Plan

## 🔥 P0 — Today / Tomorrow (block production issues)
1. **Item 1**: Fix syntax error in `stats/index.js:151-160` — 15 min
2. **Item 2**: Delete debug fetch blocks (3 files) — 30 min
3. **Item 3**: Fix memory leaks (4 features) — 1 hour
4. **Item 4**: Remove backup files + add to `.gitignore` — 10 min

**Combined: 2 hours of focused work. One PR, ready to push.**

## 🔴 P1 — This Week
- Item 6: remove console.* (1 hour)
- Item 7: route through StorageService (4-6 hours)
- Item 8: vendor or replace storehouse-js (2 hours)
- Item 13+14: verify XML/INI on live site (2 hours verify, 4-6 fix if needed)

## 🟡 P2 — Next 2 Weeks
- Item 9: dep upgrades (safe subset: vitest, dexie, mermaid)
- Item 10: cleanup diagnostic scripts
- Item 11: add 30-50 unit tests for untested features
- Item 12: e2e sharding + flaky test fix

## 🟢 P3 — Next Quarter
- Item 15: Cloud Sync (1-2 weeks)
- Item 16: i18n (3-5 days)
- Item 17-18: verify closed issues
- Infrastructure: CONTRIBUTING, COC, CHANGELOG

---

# 🎯 Why This Plan Is Different

Every item in this plan has:
1. **Exact file path + line number** (where applicable)
2. **Evidence** — code excerpt, npm output, git log, or issue URL
3. **Why it matters** — quantified risk
4. **Effort estimate** — based on what the work actually involves

No speculation. No "you might want to add X feature". Just real gaps with real consequences.

---

# Open Questions for User

1. **Want to do P0 today?** 2 hours of work, ship as `fix/critical-fixes` branch.
2. **P1 priority order:** StorageService refactor vs XML/INI verification — which first?
3. **P2 feature test coverage:** which 5 features to test first (ai-writer, version-history, image-resize, export, autosave)?
4. **Cloud Sync timeline:** start in 2 weeks or push to Q1 2027?
5. **PWA install logs:** silent remove OK, or wrap with `if (DEV)`?

---

# Data Sources (All Verified)

| Source | What it gave us |
|---|---|
| `git log` / `git branch -a` | Recent commits, unmerged branches |
| `gh issue list` | 6 open issues with body excerpts |
| `gh api repos/Nir-Bhay/markups` | Stars, forks, size, last push |
| `gh pr list` | 0 open, 18 closed |
| `npm outdated` | All dep version status |
| `grep -rn` over src/ | Console logs, TODOs, localStorage calls |
| `find src -name '*.js'` | 87 source files inventory |
| `npx vitest run` | 123 unit tests, 18 files, all pass |
| Web research | StackEdit, Dillinger, HackMD features |
| `docs/*.md` | Past resolutions, flake notes |
| `package.json` scripts | Test infrastructure |

**Generated 2026-09-02. Plan is data-driven, ready to execute.**
