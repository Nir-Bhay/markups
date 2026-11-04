# Google / Bing / ChatGPT discovery + editorial distribution

**Date:** 2026-10-23. Content is a tested hypothesis/operating plan; directory acceptance and ranking are never guaranteed.

## Platform-specific rules
**Google Search and AI Overviews/AI Mode:** Google explicitly says traditional SEO technical accessibility, valuable original content, indexability and genuine quality still underpin generative AI search. There is no special AI tag or llms.txt requirement for these features. Google Search Console: https://search.google.com/search-console/ ; docs: https://developers.google.com/search/docs/appearance/ai-features and https://developers.google.com/search/blog/2026/05/a-new-resource-for-optimizing.

**ChatGPT Search:** Allow OAI-SearchBot in robots and avoid accidental CDN/WAF blocking if appearance in ChatGPT Search is desired. GPTBot is distinct (training-related), should be governed separately by site policy. OAI-SearchBot permission alone does not guarantee crawling, citation or recommendation. Docs: https://platform.openai.com/docs/bots.

**Bing/Copilot:** Submit domain and canonical sitemap to https://www.bing.com/webmasters/ ; check AI Performance data if available. IndexNow https://www.indexnow.org/documentation can notify about added/updated/deleted URLs but does not force indexing or rankings. Do not send unchanged URLs repeatedly.

**Other AI systems:** Perplexity, Claude, Google-Extended policies have different scopes; public robots directives have already been added. Verify actual bot identities and indexing behavior rather than inferring from User-Agent strings alone.

## Critical distribution prerequisites
1. Production URLs working and canonical (trust pages not 404, social image not 404).
2. Accurate capabilities: image PDF and Word-compatible .doc, honest AI/privacy limitations.
3. A real demo and independent reproducible example that explains *why* the editor is useful.
4. GitHub README: live domain, feature GIF or short authentic demonstration, installation and local run, limitations, issue link and developer docs.
5. UTM/referral measurement without leaking user text, API keys, personal data or document URLs.

## Ordered directory/channel list with exact tasks
| Rank | Channel | Target | Check and deliverable |
|---|---|---|---|
| 0 | Awesome Markdown Editors | https://github.com/mundimark/awesome-markdown-editors | Existing listing currently uses markups.vercel.app; propose editorial PR to change ONLY verified canonical URL |
| 0 | LibHunt | https://www.libhunt.com/r/markups | Audit old-domain website field, request correction if editable; confirm current status |
| 1 | AlternativeTo | https://alternativeto.net/faq/ | Search existing app first, create factual listing only if absent, clear category/platform/model |
| 1 | SaaSHub | https://www.saashub.com/services/submit | Check existing listing, accurate screenshots and free/no-signup details, status log |
| 1 | Product Hunt | https://www.producthunt.com/launch | Human-created media/demo, clear launch story; follow current eligibility/scheduling rules |
| 2 | DEV Community | https://dev.to/ | Original technical post on renderer/export engineering and actual tradeoffs |
| 2 | Hacker News Show HN | https://news.ycombinator.com/showhn.html | Check current eligibility; interactive original software, founder participates; do not solicit votes |
| 2 | Reddit Markdown | https://www.reddit.com/r/Markdown/ | Community rules first; ask for real feedback, not automated promotions |
| 2 | Reddit open-source | https://www.reddit.com/r/opensource/ | Same editorial rules; transparent affiliation |
| 2 | Relevant GitHub docs and discussions | repo/issue/discussions | Respond when useful, no irrelevant link insertion |

BetaList historically lacked zero-cost admission as of review; recheck pricing/policy before spending. Do not buy backlinks, submit to 100 spammy directories, fake testimonials, drop links in unrelated repos or pay for votes.

## Existing links audit
- Source-backed editorial appearance: https://github.com/mundimark/awesome-markdown-editors currently names Markups, links old markups.vercel.app and project GitHub URL.
- Earlier research also surfaced a LibHunt Markups listing linked to previous Vercel URL. Recheck it before edits.
- If old domain control is confirmed, review a 301/308 redirect to markups.dev with canonical and HTTPS checks. Do NOT change production domain settings without owner/preview gate.

## Value proposition and content angles
- Real developer sample with tables + Mermaid + KaTeX, compare preview rendering, editability, file sizes, mobile experience and no signup.
- Fast docs workflow: paste a README, render diagrams, export; demonstrate accurately, especially raster-PDF limitations.
- Local draft workflow with explicit cloud/AI sharing caveats.
- Accessibility: keyboard test, screen reader semantics and export limits rather than blanket accessibility claims.
- Example technical how-to: an API design document with architecture diagram and equation plus exact downloadable Markdown source.

## Reviewable content checklist
All product claims tested; unique insight; original screenshots; authorship and update date; no impersonation of third-party products; cite their own current docs, avoid untested superiority; fair comparison limitations and licensing; useful even without clicking product CTA.

## Suggested non-transactional outreach note
Hello, I maintain Markups, a free browser Markdown editor. The existing listing currently points to an older deployment URL. The canonical live URL is https://markups.dev. Could you update the site link while retaining the same GitHub project? Thanks for maintaining this resource.

## Citation experiment
Use MEASUREMENT-EXPERIMENTS.md: 30 fixed questions, 3 independent sessions/sampling rounds (90 evaluations), with platform, timestamp, model/search mode, geography/language when relevant, source URLs, ranked recommendation, explicit mention and citation. Do not confuse chatbot answer with Google indexed rank.
