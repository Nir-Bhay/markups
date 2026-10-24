# Public route and canonical inventory (baseline 2026-10-23)

Status = source markup unless LIVE specified. This is not a Google indexed-pages report. Clean URLs assumed from vercel.json. Confirm final HTTP status, cache, redirect and Google canonical in GSC.

| URL / source | Source robots | Source canonical | Sitemap | Decision / owner | Runtime |
|---|---|---|---|---|---|
| / (index.html) | index,follow | / | yes | primary editor and brand; visible resource links | live content previously read |
| /landing (landing/index.html) | index,follow | / | no | intentionally consolidated OR self-canonical after intent review | live content returned |
| /seo/online-markdown-editor | index,follow | self | yes | primary nonbrand landing | LIVE page returned |
| /seo/markdown-to-pdf | index,follow | self | yes | capability-specific, clarify raster export | live content previously returned |
| /seo/markdown-to-html | index,follow | self | yes | HTML use case, validate exported structure | live content previously returned |
| /seo/markdown-live-preview-editor | index,follow | self | yes | distinct preview intent, avoid near-duplicate | source |
| /seo/cheatsheet | index,follow | self | yes | useful reference and internal links | live content previously returned |
| /seo/examples/mermaid | index,follow | self | yes | example intent | source |
| /seo/examples/math | index,follow | self | yes | example intent | source |
| /seo/tutorials/markdown-to-pdf | index,follow | self | yes | practical tutorial; check links/layout | source |
| /seo/best-markdown-editor-for-developers | noindex | self | no | do not index without first-hand evidence | source |
| /seo/stackedit-alternative | noindex | self | no | comparison neutral and factual before index | source |
| /seo/typora-alternative | noindex | self | no | desktop/browser difference, truth test | source |
| /seo/markups-vs-typora | noindex | self | no | comparison neutral, duplicate strategy | source |
| /seo/markdown-to-docx | noindex | self | no | keep noindex while not native OOXML | source |
| /seo/global-growth-playbook | noindex | self | no | internal strategy: keep noindex | source |
| /privacy-policy (privacy-policy/index.html) | index,follow | self | no | build and link from visible footer | LIVE 404 |
| /terms (terms/index.html) | index,follow | self | no | build and link from visible footer | LIVE 404 |
| /accessibility (accessibility/index.html) | index,follow | self | no | build and link from visible footer | LIVE 404 |
| /cookie-policy (cookie-policy/index.html) | index,follow | self | no | build and link from visible footer | LIVE 404 |
| /license (license.html) | index? verify | verify | yes | verify path and content | source |
| /robots.txt (public/robots.txt) | N/A | N/A | N/A | served crawl rules | LIVE |
| /sitemap.xml (public/sitemap.xml) | N/A | N/A | N/A | approved canonical 200 indexable URLs only | LIVE, 10 URL set |
| /llms.txt (public/llms.txt) | N/A | N/A | N/A | supplementary public reference, not Google ranking mechanism | source |
| /image/og-image.png (public/image/og-image.png) | N/A | N/A | N/A | actual asset; confirm correct media response | binary extraction inconclusive |
| /images/og-image.png (no public/images file) | N/A | N/A | N/A | eliminate references | LIVE 404 |

## Release routing conditions
- Every included canonical URL must return 200 and not be noindex, login-protected, soft-404, redirect chain or canonicalized to a different destination.
- Preserve intentional noindex pages in content as appropriate; do not add to sitemap.
- If /landing canonical stays /, keep it out of sitemap and document why; if self-canonical, require substantial distinct value and add to sitemap after live proof.
- Add live legal pages to sitemap only after they are actually built, return 200, and are worth discovery. Sitemap inclusion is optional for well-linked pages, not an indexing guarantee.
- Internal anchor graph should lead humans AND crawlers to resource pages. Avoid hidden keyword blocks and doorway-like pages.
- www, trailing slash, non-www, HTTP and old Vercel domain 301/308 policies require live verification; don't change domains blindly.
- Also check 404 template route, media files, service worker caching, and any landing links to root legal URLs.
