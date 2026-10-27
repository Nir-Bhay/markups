# Public route and canonical inventory — branch source review (2026-10-27)

**Scope:** `growth/seo-geo-audit-2026-10` only; draft [PR #71](https://github.com/Nir-Bhay/markups/pull/71). This supersedes the *branch-source* decisions in the 2026-10-23 baseline inventory, **not** its historical production observations. Nothing here asserts that branch changes have shipped to `markups.dev`, that Google chose a canonical, or that a protected preview has passed interactive review.

## Canonical decision — M-005 / M-007

- **`/` is the primary Markdown editing application**: immediately usable Monaco-based editor, live preview and export controls. Its canonical is `https://markups.dev/`.
- **`/landing` is a separate explanatory product tour**, with examples, feature explanations, use cases, FAQ, six guide links and a CTA into `/`. Its source canonical is `https://markups.dev/landing` and it is included in the branch sitemap. This is a *provisional, distinct-intent self-canonical* decision, not evidence Google will index both. The titles overlap in "free online Markdown editor"; inspect duplicate/canonical signals after an approved release and consolidate if search evidence shows duplication.
- **`/seo/compatibility-lab` is a separate, source-backed technical guide** with a downloadable Markdown fixture. Its branch self-canonical and sitemap entry are intentional.
- Sitemap membership is limited to source pages intended to be indexable. The current branch `public/sitemap.xml` has **16 `<loc>` entries**. No `noindex` comparison/alternative page or internal playbook belongs there. `lastmod` values must reflect substantive changes, not daily automated refreshes.
- `public/robots.txt` points to `https://markups.dev/sitemap.xml`. An erroneously *submitted* `robots.txt` entry in Search Console is a separate owner UI problem: do not delete the actual robots file.

## Branch source inventory (not a live production or Google indexing report)

| Route | Source robots / canonical intent | In branch sitemap | Release/verification note |
|---|---|---|---|
| `/` | index,follow / self | Yes | Primary editor; test real editing/export on protected preview |
| `/landing` | index,follow / self | Yes | Distinct tour; review duplicate-intent risk and visual/mobile UX |
| `/license` | source contract to confirm / intended self | Yes | Confirm final HTTP, content and canonical before release |
| `/privacy-policy` | index,follow / self | Yes | Built by branch; owner must review accuracy/consent |
| `/terms` | index,follow / self | Yes | Built by branch; owner legal review |
| `/cookie-policy` | index,follow / self | Yes | Built by branch; consent/legal review |
| `/accessibility` | index,follow / self | Yes | Built by branch; manual accessibility review |
| `/seo/online-markdown-editor` | index,follow / self | Yes | Distinct editor-intent guide; inspect live canonical |
| `/seo/markdown-to-pdf` | index,follow / self | Yes | Raster/image-based PDF limitations explicitly disclosed |
| `/seo/markdown-to-html` | index,follow / self | Yes | Honest export claims; verify real HTML output |
| `/seo/markdown-live-preview-editor` | index,follow / self | Yes | Preview-use-case guide |
| `/seo/compatibility-lab` | index,follow / self | Yes | Downloadable fixture and browser regression; not a competitor benchmark |
| `/seo/cheatsheet` | index,follow / self | Yes | Original Markdown reference |
| `/seo/examples/mermaid` | index,follow / self | Yes | Working Mermaid example |
| `/seo/examples/math` | index,follow / self | Yes | Working KaTeX example |
| `/seo/tutorials/markdown-to-pdf` | index,follow / self | Yes | PDF tutorial; no selectable-text guarantee |
| `/seo/best-markdown-editor-for-developers` | noindex / self | No | Keep out until evidence-backed and approved |
| `/seo/stackedit-alternative` | noindex / self | No | No unsupported competitive claims |
| `/seo/typora-alternative` | noindex / self | No | No unsupported competitive claims |
| `/seo/markups-vs-typora` | noindex / self | No | Do not index untested comparisons |
| `/seo/markdown-to-docx` | noindex / self | No | Current Word output is HTML `.doc`, not native DOCX |
| `/seo/global-growth-playbook` | noindex source / not published by branch build | No | Internal operating content must stay out of published artifacts |
| `/robots.txt` | crawl rules, not HTML | N/A | Real file must remain; GSC submitted-sitemap error is separate |
| `/sitemap.xml` | XML sitemap, not HTML | N/A | Branch 16-URL inventory; GSC warning on production needs owner UI |
| `/llms.txt` | informational text, not a ranking mechanism | N/A | Check text response; no AI citation guarantee |
| `/qa/markdown-compatibility-fixture.md` | downloadable Markdown fixture | No | Fixture asset, not an HTML canonical |
| `/image/og-image.png` | social image asset | No | Confirm HTTP image bytes and card preview |
| `/images/og-image.png` | obsolete path | No | No references should advertise it |

## Evidence and release gates

- **Source read-back, 2026-10-27:** [branch sitemap](https://github.com/Nir-Bhay/markups/blob/growth/seo-geo-audit-2026-10/public/sitemap.xml) contains 16 URLs, including `/landing`, all four trust routes and `/seo/compatibility-lab`; [landing source](https://github.com/Nir-Bhay/markups/blob/growth/seo-geo-audit-2026-10/landing/index.html) has a self-canonical, distinct explanatory sections and a CTA to the editor; [root source](https://github.com/Nir-Bhay/markups/blob/growth/seo-geo-audit-2026-10/index.html) canonicalizes to `/`.
- **Latest pre-edit exact-head CI:** [Branch QA run 40271430549](https://github.com/Nir-Bhay/markups/actions/runs/40271430549) completed **success** for `06a28fab0e448523ca72cb41186895e374ca79ea`. Any new documentation commit must be checked at its own SHA before calling the new head green.
- **Production vs preview:** historical 2026-10-23 live checks saw trust-route 404s; branch builds/tests fixed the source/build contract. A 2026-10-24 authenticated HTTP/metadata handoff reported 16 preview URLs with 200s ([PR handoff](https://github.com/Nir-Bhay/markups/pull/71#issuecomment-6382220866)), but subsequent unauthenticated checks hit Vercel Login. Neither proves current-head browser/visual QA. Recheck the *current deployment SHA* under an authorized session.
- **Owner-only GSC:** remove erroneous `robots.txt` submission from the Sitemaps list, inspect `sitemap.xml` warning, and use URL Inspection for Google-selected canonical/indexing reasons **after approval and deployment**. Never submit protected preview URLs as production URLs.
- **No automatic release:** draft PR, human privacy/security and export-viewer checks, and separate explicit owner approval remain required.

## Release routing checklist

Every submitted canonical URL must resolve as intended with 200 HTML, unique useful visible content, appropriate robots and self-canonical, no login gate for the final public production site, no redirect/soft-404 and no misleading structured data. Verify HTTP/HTTPS, www, trailing slash and old domain redirect behavior independently. Do not infer ranking, impressions or AI citations from passing static tests.
