# React landing refresh — 2026-11-03

## Scope and baseline

- Request: replace the existing Markups `/landing` page with the React design supplied in `design-markups-landing-page.zip`.
- Owner: Codex. Branch: `Nir-Bhay/sync-main-seo-geo-2026-10-25`. Baseline HEAD: `b5d5c666330c908154b4b6278fb9105097ecb03a`.
- The shared worktree already contained many unrelated user changes. Those were preserved; no files were reset, staged, committed, pushed, or deployed.
- The canonical and route decision in `URL-ROUTE-INVENTORY.md` is retained: `/` is the editor and `/landing` is a distinct, self-canonical product tour.

## Ownership and review

| Owner | Files / responsibility |
|---|---|
| Codex (single writer) | `landing/index.html`; `landing/src/**`; `landing/tsconfig.json`; `scripts/prerender-landing.mjs`; landing-specific additions to `vite.config.js`, `package.json`, and `package-lock.json`; this report; M-056 and progress/navigation notes |
| `landing_claim_review` (read-only) | Reviewed product claims and required guide links; did not edit files |

The code-review-graph utility was unavailable. Review used direct reads of the landing source, product/provider implementation notes, and SEO/GEO route inventory.

## Changes

- Imported the supplied React/TypeScript landing experience under `landing/src/`; kept the editor root route separate.
- Added server rendering into `.tmp/landing-prerender.html` before each build and injects that HTML into `/landing`; the browser hydrates the result. The demo's initial state is deterministic for hydration and works without JavaScript content disappearing.
- Retained `/landing` self-canonical and added page/social metadata and FAQ structured data. FAQ schema wording matches the rendered FAQ.
- Added direct links to the six guides required by the route inventory and the Compatibility Lab.
- Clarified that Drive/GitHub integrations require project setup and verification; no background-sync availability is promised. Kept export, privacy, and AI statements bounded to current behavior.
- Sanitized rendered Mermaid SVG with the existing DOMPurify dependency.

## Verification record

Commands ran on the final source with Node `v25.2.0`. Passing a local static or build check is source/build evidence only; it does not verify the hosted route, indexing, or ranking.

| Gate | Evidence | Status |
|---|---|---|
| G0 static SEO/route audit | `node scripts/qa/check-seo-geo-static.mjs`: 20 checked, 0 errors, 0 warnings | Pass (source only) |
| Landing TypeScript | `npm run typecheck:landing` | Pass |
| Lint | `npm run lint` | Pass (0 ESLint errors in `src/`) |
| Production build | `npm run build` | Pass; `/landing` HTML 84.50 kB (15.88 kB gzip) |
| Modular build | `npm run build:modular` | Pass; `/landing` pre-render also emitted |
| Built-page audit and pre-render read-back | `node scripts/qa/verify-built-pages.mjs`: 9 checked, 0 failures; built `/landing` has H1, self-canonical, six guide links, editor CTA and legal links | Pass |
| FAQ structured data | Parsed built JSON-LD and compared all eight answers against visible SSR text | Pass (8/8 exact answers present) |
| Unit / browser tests | Not run; not requested | Open |
| Desktop/mobile visual and keyboard review (G2) | Not run | Open |
| Authenticated preview / live route (G3) | Not run; no deployment | Open |
| Product-claim review | Read-only claim review plus source/route inventory cross-check; corrected cloud-provider wording | Source review complete; owner approval open |
| Owner privacy/legal approval | Not requested/performed | Open |
| Search Console indexing / ranking | Not checked | Open |

The landing entry JavaScript is 603.38 kB raw / 185.12 kB gzip and its CSS is 60.29 kB raw / 13.23 kB gzip. Real browser loading and performance were not measured.

## UI refinement follow-up — 2026-11-03

- Reworked the interactive workspace: removed pane scroll-sync controls and inner scrolling, auto-expanded the editable source as it grows, shortened the example documents, reorganized sample/mode controls, and gave the rendered page a centered paper surface. Added a slim page scrollbar treatment.
- Rebuilt the rich Markdown visual as aligned code, math, flow, and table examples; refined the executive-draft organization visual and grouped export formats with the existing icons and accurate `.pdf` / `.doc` notes.
- Replaced the three generic writing steps with a capture → shape → deliver storyboard.
- Follow-up checks: `npm run typecheck:landing` passed; `npm run build` passed; `node scripts/qa/verify-built-pages.mjs` checked 9 pages with 0 failures. Landing entry size is 607.33 kB raw / 185.42 kB gzip. Unit/browser tests were not run.
- Browser visual review remains open. CUA could not initialize its kernel in this session and the Playwright browser service could not find its required Chrome installation. These source/build checks do not establish desktop, mobile, or keyboard appearance.
- Replaced the flat three-column use-case strip with a dark section and a responsive editorial grid: an illustrated engineering plan, a research note, and a technical-writing outline. Follow-up `npm run typecheck:landing`, `npm run build`, and the 9-page built-site audit all pass. The final landing entry size is 610.70 kB raw / 185.94 kB gzip. Browser visual review remains open for the same tooling limitation.

## Environment and release boundary

The host Node version is `v25.2.0`, outside the repository's declared supported range (`^22.22.2 || ^24.15.0 || >=26.0.0`). Any results from this host carry that environment limitation. Production remains unchanged; no deployment or external publication was requested or performed. The ignored ZIP extraction and generated pre-render scratch files remain in `.tmp/`; the command policy blocked their deletion, which is unnecessary for builds and does not affect tracked project files.
