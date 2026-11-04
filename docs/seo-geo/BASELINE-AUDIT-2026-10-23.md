# Source-backed code, SEO, GEO and release audit

**Audit date:** 2026-10-23. **main:** 9458092d60aa678e2bc8253f205bb56717a3fca6. **Tracked files:** 348 in recursive GitHub tree (no truncation).

## Evidence vocabulary
CONFIRMED LIVE: public request observed; SOURCE-CONFIRMED: proven repository configuration or code, but runtime consequence may need test; SUSPECTED: hypothesis; UNAVAILABLE: necessary account/runtime data inaccessible. Historic reviews are historical, not present-day validation.

## Verified findings and remediation

| ID | Severity | Evidence | Finding | Required proof |
|---|---|---|---|---|
| SEO-01 | P0 | CONFIRMED LIVE + SOURCE | /privacy-policy, /terms, /accessibility, /cookie-policy respond 404. Their root directories contain index.html, yet vite.config.js collects landing, seo, policy and strategy, not these four directories. | Add inputs without changing other route keys; build; inspect dist output; HTTP 200 + correct title/canonical for each on isolated preview |
| SEO-02 | P0 | CONFIRMED LIVE + SOURCE | /images/og-image.png responds 404, while public/image/og-image.png exists. SEO articles point OG/Twitter and JSON-LD publisher logo to the missing plural path. | Normalize URL to /image/og-image.png on verified affected pages; GET image 200 with image MIME, social card preview and schema image crawl |
| SEO-03 | P1 | SOURCE-CONFIRMED | Main editor links to /landing inside 1px clipped crawl-summary rather than a visible resources hub. Supporting SEO pages already cross-link. | Human-visible and keyboard-accessible resource navigation to primary guides; no editor layout regression; crawl rendered anchors |
| SEO-04 | P1 | SOURCE-CONFIRMED | /landing declares index,follow with canonical homepage /. Distinct tour content may be folded into home, or the canonical could be incorrect for independent ranking. | Content strategy written, then self-canonical or intentionally consolidate; Google-selected canonical checked |
| SEO-05 | P1 | SOURCE-CONFIRMED | public/sitemap.xml includes 10 URLs; /landing and indexable legal pages are absent. Omission of an intentional canonical duplicate is valid. Only canonical, indexable, 200 pages belong in sitemap. | Generated set equals approved URL inventory; lastmod matches substantive edits (not daily clock bumps) |
| SEO-06 | P1 | SOURCE-CONFIRMED | AGENTS.md mandates AI-DOCS/modification-guides/seo-geo-multi-agent-workflow.md and docs/seo-geo/MASTER-BACKLOG.md but neither existed in baseline tree. | Add actual workflow, backlog, ownership locks and evidence gate |
| SEO-07 | P1 | SOURCE-CONFIRMED | AI-DOCS/AI-MEMORY.md and QUICK-START.md describe E2E as absent; tests/e2e includes 12 spec files. Agent instructions are stale. | Update documents after full regression mapping; ensure real test commands |
| SEO-08 | P1 | SOURCE-CONFIRMED | Several SEO articles make broad export/supported-feature claims. src/main.js uses html2canvas/jsPDF and pdfPrep rasterization. src/services/export/docx.js writes HTML with .doc and application/msword, not true OOXML DOCX. | Truth table for every claim, real export fixtures and textual corrections; mark PDF non-selectable/search limitations |
| SEO-09 | P1 | SOURCE-CONFIRMED | seo/markdown-to-pdf describes linked text as clickable or rendered as visible URLs, while landing says PDF is a picture. Claims may conflict with actual output. | Download sample PDF; check selectable text, clickable link annotations, copy/paste, page breaks and diagram output |
| SEO-10 | P1 | SOURCE-CONFIRMED | Homepage index.html initializes Google Analytics, Microsoft Clarity, Vercel Insights. Privacy and cookie disclosures exist in source but live pages are 404. | Fix trust routes; audit disclosures, consent/law relevance, runtime scripts and telemetry details |
| SEO-11 | P1 | SOURCE-CONFIRMED | Vercel CSP includes unsafe-inline and unsafe-eval in script-src, and allows any https: in connect-src; localhost development origins also present. Some may be needed for Monaco/AI; not safe to remove without testing. | Document legitimate origins, test strict CSP in report-only/preview, test AI providers, Monaco workers, embeds, analytics |
| SEO-12 | P2 | SOURCE-CONFIRMED | Production src/main.js is ~8k lines with src/main.modular.js coexisting; existing docs show the production path differs from modular. | Guard current entry, compare smoke/feature regressions, do not refactor monolith in growth sprint |
| SEO-13 | P2 | SOURCE-CONFIRMED | vitest.config.js coverage include only src/core/storage/** and src/utils/**, not app/feature/UI code. | Explicit honest coverage scope and expansion plan; report overall and feature-specific separately |
| SEO-14 | P2 | SOURCE-CONFIRMED | public/sw.js cache networkFirst and staleWhileRevalidate, old named cache v4; offline behavior is qualified in landing. | Cold offline vs warm offline browser matrix; no unsupported 'works fully offline' claim |
| SEO-15 | P1 | SOURCE-CONFIRMED | Robots allow general crawlers, OAI-SearchBot, GPTBot, PerplexityBot and other user agents; llms.txt exists. This does NOT confirm that AI systems cite/recommend the site. | Inspect actual HTTP robots, CDN WAF and verified bot logs when authorized; benchmark citations across queries |
| SEO-16 | P1 | UNAVAILABLE | Connected Vercel account returned zero accessible Markups projects/team, so production branch, preview settings, build logs, errors, traffic and domain attachment cannot be confirmed via this account. | Connect the actual Markups Vercel scope, verify project ID/owner/Git production branch read-only |
| SEO-17 | P1 | UNAVAILABLE | Google Search Console, Bing Webmaster Tools and analytics data absent from this review. Rank/index/visitor KPIs unknown. | Capture 28-day and 7-day GSC and Bing export; analytics referrers and editor-start actions |
| SEO-18 | P2 | PUBLIC DIRECTORY RESEARCH | Awesome Markdown Editors and LibHunt have appeared to list old markups.vercel.app URLs. | Recheck listing at submission time; editorial request/PR; confirm live replacement |
| SEO-19 | P2 | SOURCE-CONFIRMED | SEO pages use Article / FAQPage / HowTo schema. Extra structured data does not force AI citation or enhanced snippets. | Validate parsable JSON-LD, accurate on-page matching and eligibility before addition/removal |
| SEO-20 | P2 | SOURCE-CONFIRMED | Site routes and policy copies use varied public/ vs root locations; duplicated robots, sitemap and llms.txt at root/public increase drift risk. | Confirm build source precedence and byte consistency; establish single source without accidentally removing production assets |

## Architecture and QA scope
Vite 6 / vanilla JS, Monaco, Marked, Mermaid, KaTeX, Dexie, DOMPurify, PWA, optional bring-your-own-key AI writer. Source: package.json, vite.config.js, src/main.js, src/features/ai-writer/service.js, src/core/storage/, src/services/export/, public/sw.js. Source tests: src/__tests__/** (Vitest); browser: tests/e2e/** (Playwright); verification: scripts/verify-health.mjs. Verify real status on branch; existing tests do not imply passing.

## Specific product-integrity requirements
- A draft may reside in browser storage, while AI Writer optionally sends submitted prompt/document context to a chosen model endpoint using a user key. Statements like 'no content is ever sent to a server' require a qualifying exception and security review.
- Image-based PDF != selectable, accessible text PDF. A Word-compatible .doc is not an OOXML .docx. Do not market native DOCX until implemented and tested.
- Do not make unsupported mobile/PWA/offline/performance claims or invented comparative results.
- Do not index the internal /seo/global-growth-playbook. Comparison pages currently marked noindex need substantial neutral original value before any indexing decision.

## Source and independent reading references
Repository: https://github.com/Nir-Bhay/markups
Google AI features: https://developers.google.com/search/docs/appearance/ai-features
Google Search essentials: https://developers.google.com/search/docs/essentials
Google indexing: https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
OpenAI crawler docs: https://platform.openai.com/docs/bots
Bing Webmaster: https://www.bing.com/webmasters/
IndexNow: https://www.indexnow.org/documentation
Vercel Git deployments: https://vercel.com/docs/git
Vercel deployment protection: https://vercel.com/docs/deployment-protection
