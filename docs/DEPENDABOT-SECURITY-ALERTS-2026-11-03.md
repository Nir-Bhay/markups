# GitHub Dependabot digest reconciliation — 2026-11-03

## Result

The supplied Oct 27–Nov 3 digest matches vulnerable dependency declarations still present on `origin/main` at `9458092d60aa678e2bc8253f205bb56717a3fca6`. The active local feature working tree already contains patched dependency resolutions and a fresh full `npm audit --json` reports **0 vulnerabilities** (510 dependency entries). The lockfile/package changes are local and uncommitted, so GitHub's default-branch alert will remain open until a reviewed fix reaches the monitored branch and GitHub rescans it. No push or deployment was performed.

## Reported packages and local state

| Package | Digest range | Local resolved state |
|---|---|---|
| `undici` | `>=7.24.1 <7.29.1` (plus six linked findings) | `7.30.1`, patched for the listed TLS, DoS, and WebSocket findings |
| `brace-expansion` | `<1.1.21` | `1.1.21` via ESLint-scoped minimatch override |
| `dompurify` | `>=3.4.13 <=3.4.15` | `3.4.17` |
| `source-map-js` | `<1.2.2` | `1.2.2` |
| `@vitest/mocker` | `>=4.1.11 <4.1.12` | `5.0.5` |
| `happy-dom` | `>=17.0.0 <=21.0.3` | Removed from current dev dependencies; not installed in the resolved tree |
| `vite` | `<=6.4.3` | `8.3.5` |

The old default-branch `package.json` still declares Vite 6, Vitest 4, Happy DOM 20, and DOMPurify 3.4.12. The local branch has moved to Vite 8/Vitest 5, removed Happy DOM, and pins DOMPurify 3.4.17. The attached alert is therefore not evidence that the current local lockfile is still vulnerable; it is evidence that GitHub has not yet seen these local dependency changes on its monitored branch.

## Verification

- `npm audit --json`: 0 info/low/moderate/high/critical findings; exit 0.
- Resolved package tree: `npm ls undici brace-expansion dompurify source-map-js happy-dom vite --all` confirms the listed patched resolutions and no installed Happy DOM.
- On the same current dependency tree: 723 unit tests across 105 files pass, lint passes, production and modular builds pass, and production Chromium/browser suites pass as recorded in `EDITOR-FIXES-AND-RELEASE-GATES-2026-11-03.md`.
- These results describe the local working tree only. The deployed branch, remote GitHub alert state, and production runtime are unchanged until a reviewed commit is pushed and scanned.

## Primary advisories

- [undici TLS options dropped by BalancedPool (CVE-2026-84961)](https://github.com/advisories/GHSA-w293-vg96-wgc3)
- [undici unhandled error from excessive content encodings (CVE-2026-109869)](https://github.com/advisories/GHSA-xjj6-f33q-929c)
- [DOMPurify SAFE_FOR_TEMPLATES shadow-root bypass (GHSA-cg2g-xh64-v4q7)](https://github.com/cure53/DOMPurify/security/advisories/GHSA-cg2g-xh64-v4q7)
- [Happy DOM ESM alias injection (CVE-2026-115895)](https://github.com/advisories/GHSA-834v-8h66-3h79)
