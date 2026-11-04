# Markups — complete supporting-pages design prompt

Act as principal product designer, information architect, technical UX writer, accessibility specialist, and web art director. Create the essential supporting website pages for Markups, a free, open-source browser Markdown editor. Produce finished, connected desktop and mobile page designs with real copy, explicit states, and implementation-ready specifications. This is a design assignment, not authorization to deploy or change the running editor.

Use `MARKUPS-MODERN-LANDING-PAGE-PROMPT.md` as the companion landing-page direction. Preserve that file. This prompt supplies the missing multi-page architecture, precise shared components, SEO requirements, and supporting-page content. Do not create an About Us page, imaginary company story, team biographies, generic blog archive, pricing plans, account dashboard, or unsupported service status dashboard.

## 1. Product truth and writing contract

Brand: **Markups**. Product: `https://markups.dev/`. Source: `https://github.com/Nir-Bhay/markups`. License: MIT. Start editing without an account. Local drafts and local versions live in this browser; browser data clearing, quota failures, private browsing, and switching devices can affect availability. Encourage exports of important work. Local autosave is not a cloud backup.

Current features: Monaco editing; Write/Split/Preview; adjustable divider and scroll synchronization; multiple tabs and browser file/folder organization; local autosave/history; Markdown tables, lists, tasks, alerts, footnotes, code highlighting, KaTeX and Mermaid; image insertion/resizing and supported video embeds; find/replace, shortcuts, Vim, focus/typewriter/fullscreen, templates/snippets, statistics, goals, TOC and backlinks. Describe individual features only with controls and behavior verified in the current build.

Exports: Markdown, image-based PDF, standalone HTML, plain text, PNG, print, and Word-compatible HTML saved as `.doc`. Never call the latter native `.docx`. Do not promise selectable PDF text, functioning PDF hyperlinks, unlimited file sizes, exact print pagination, or guaranteed offline support. Share links encode document content; anyone possessing one can read it. Do not call them private, access-controlled, revocable, or expiring unless verified later.

AI is optional and requires a supported provider/key. Chosen context is sent to that provider. Do not imply the provider has no retention, AI is free, keys are always session-only, or all content stays on the device. AI responses can be wrong; review changes before applying them. Explain actual configured behavior, not hoped-for behavior.

Future: opt-in Markups Cloud with bounded text backup, consent and quota controls; manual Drive save/open; manual GitHub repository save/open. These are planned/in development and not connected to a provisioned live backend in the reviewed build. Never offer live sign-in/connect/upload buttons for these workflows. Do not advertise automatic sync, collaboration, cross-device backup, attachment backup, or an unlimited free cloud tier.

Marketing voice: clear, specific, useful English. Write for someone trying to finish a document. Name the benefit, show an example, explain the limitation near the decision. No keyword stuffing, invented statistics, fake testimonials, outcome guarantees, fabricated release notes, or unsupported trust badges. Never represent GitHub stars as active-user counts. If used, fetch the current count or omit the number on failure.

## 2. Information architecture and route ownership

The following are **proposed design destinations**, not claims that deployed routes exist. Before implementation, resolve current routes and redirects. Retain an existing equivalent path rather than creating a competing duplicate. Keep the editor at its approved existing URL. Do not move `/` to a marketing page silently.

| Purpose | Proposed route | Navigation location | Distinct visitor intent |
|---|---|---|---|
| Help hub | `/help` | Main site navigation, footer | Find an answer or workflow |
| Getting started | `/help/getting-started` | Help first card | Make a first draft and export it |
| Editing and preview | `/help/editor-and-preview` | Help: writing | Understand views, line breaks, spacing and split resize |
| Documents and recovery | `/help/local-documents` | Help: documents | Autosave, tabs, history, exports and recovery limits |
| Export guide | `/help/export` | Help: export | Choose the right format and solve export problems |
| Share guide | `/help/sharing` | Help: sharing | Understand links, files and disclosure |
| AI guide | `/help/ai-assistant` | Help: optional AI | Configure a provider and understand context |
| Troubleshooting | `/help/troubleshooting` | Help, article footers | Diagnose symptoms safely |
| Markdown reference | `/seo/cheatsheet` | Resources | Look up syntax with output examples |
| Mermaid examples | `/seo/examples/mermaid` | Reference, related guides | Learn diagram syntax and limitations |
| Math examples | `/seo/examples/math` | Reference, related guides | Learn inline/block math |
| Keyboard shortcuts | `/help/keyboard-shortcuts` | Help and editor help entry | Discover verified bindings |
| FAQ | `/faq` | Help and footer | Quick product answers |
| Roadmap | `/roadmap` | Product navigation | Understand current versus planned |
| Open source | `/open-source` | Footer and GitHub control | Inspect source, license and contribution routes |
| Privacy | `/privacy-policy` | Persistent footer | Understand actual data flows |
| Cookies/storage | `/cookie-policy` | Privacy and footer | Understand storage and optional telemetry |
| Terms | `/terms` | Persistent footer | Understand service conditions |
| Accessibility | `/accessibility` | Persistent footer | Accessibility practices and known limits |
| License | `/license` | Open source and footer | Read the actual project license |
| Error page | Real HTTP 404 route | Broken/unknown URLs | Recover without losing a local draft |

Use a resource menu grouping **Help**, **Markdown reference**, **Examples**, and **Keyboard shortcuts**. Keep the first navigation level to at most five text items plus Open editor. Put legal links in the footer. About/company content is outside this scope.

Existing export-intent pages such as `/seo/markdown-to-pdf` and `/seo/markdown-to-html` must retain distinct purpose: explain that conversion workflow to a new visitor, while `/help/export` serves existing users across formats. If the content cannot remain meaningfully distinct, consolidate deliberately with an approved redirect. No mass-produced keyword variants or city/industry doorway pages.

## 3. Exact shared design system

### Canvas, type and rhythm

Use a white-first theme: canvas `#F7F9FD`, content `#FFFFFF`, primary ink `#141A2B`, secondary ink `#475467`, muted text `#667085`, border `#E6EAF1`, accent `#4F46E5`, accent wash `#EEF0FF`, success `#087F6B`. Verify final contrast; these are starting tokens, not evidence of conformance. Warnings require an icon and text as well as amber. A roadmap label must say Planned or In development.

One sans family, preferably Inter Variable with system fallback, and a mono family for source only. Self-host approved font assets with swap behavior. Use weights 400/500/600/700. Body 16/26 px; documentation body 17/29 px; helper 14/21 px; nav 14/20 px; H1 48/54 px desktop and 34/40 mobile; H2 32/40 desktop and 26/34 mobile; H3 22/30 desktop and 20/28 mobile; code 14/22 px. Keep prose at 62–72 characters per line and legal text at 65–75. Never justify body text.

At 1440 px, content width is exactly 1200 px and side margins 120 px. At 1280, margins are 40 px. At 1024 use 32 px, at 768 use 24 px, at 390/360 use 20 px, and at 320 use 16 px. Shared spacing scale: 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96 px. Align section headings, breadcrumbs, tables and page footers to the same content edges. Documentation prose follows its own narrower reading column within this grid.

### Surfaces and glass

Navigation alone may use white at 84% opacity, blur 18 px, saturation 140%, 1 px pale border and `0 8px 24px rgba(20,26,43,.06)` shadow. Readable opaque fallback is mandatory. Article bodies, code, policy text, data tables and search results stay opaque. Never nest translucent panels or blur text behind a content surface. Main card radius 20 px; inset illustration 12 px; controls 12 px; code 10 px. Default cards have a 1 px border; reserve elevation for overlays and the key demonstration.

### Header, footer, controls

Header shell height 88 px desktop, 80 px mobile; inner bar 64 px desktop/56 px mobile, centered with 12 px top inset. A fixed header reserves this height in document flow. Markups logo is a 32 px rounded-square M with 10 px gap to an 18 px/600 wordmark; neither is underlined. Link destination is the approved marketing home, not an invented About page. Hover changes color subtly; focus ring is visible. Menu and icon targets are 44 px minimum.

Buttons: primary 48 px high, padding 20 px horizontal, 14/20 px semibold; secondary same size, white with border; small utility 36 px visual height inside a 44 px interaction target. Focus uses 2 px accent outline and 3 px offset; pressed state deepens fill; disabled states include explanation. Text links in prose are visibly underlined, unlike the logo. Never make the link style global in a way that underlines brand marks or toolbar controls.

Footer begins 80 px after main content, with 48 px vertical padding desktop/32 mobile. Four groups: Product (Editor, Roadmap), Learn (Help, Reference, Examples), Project (GitHub, Open source, License), Trust (Privacy, Cookies, Terms, Accessibility). Only output links whose destinations are defined and implemented. Copyright owner/name must come from verified project information; do not invent a company or address.

### Responsive documentation shell

At >=1280 px: 1200 px container = 224 px left navigation + 32 px gap + 712 px article + 32 px gap + 200 px right TOC. At 1024–1279: 208 px left navigation + 24 px gap + remaining article; move right TOC to a collapsible block above article. At 768–1023: hide the persistent sidebar and show a 44 px Documentation menu button; article max width 712 px. Below 768: single column; navigation opens an opaque modal sheet, TOC is an inline disclosure, tables scroll within their own frame. Preserve headings, reading order and visible focus at 200% text size and 400% zoom.

Breadcrumb baseline is 24 px below reserved header, font 13/20 px. H1 begins 24 px later. Intro margin top 16 px; metadata margin top 16 px; first article section margin top 40 px. Paragraph gap 16 px, H2 top 48 px/bottom 16 px, H3 top 32 px/bottom 12 px. List rows gap 8 px; example blocks have 24 px padding desktop/16 mobile. Article ends with related links, then Previous/Next cards with 24 px gap.

TOC sticky top offset 112 px; active item has a 2 px accent rule plus semibold text. Use intersection tracking that does not move focus. Every anchor target has scroll margin of at least header reservation + 16 px. Left navigation active state uses accent wash, text and `aria-current`, never color alone.

## 4. Page-by-page content and composition

### A. Help hub

Title: **Find your next step.** Intro: **Learn the editor, understand where drafts are saved, and take your Markdown wherever it needs to go.** Search label: **Search help and guides**. Placeholder: **Try “PDF export” or “recover a draft”**.

At desktop, a 720 px intro/search region sits above a two-column 3-row task grid, gap 24 px. Search height 56 px, icon 20 px, input 16 px. Task cards minimum height 168 px, padding 24 px, heading 20/28 px, explanation max 2 lines. Mobile cards auto-height with 20 px padding. Each entire card is one anchor, with no nested buttons.

Six exact cards: **Start a document** — “Write, preview, and export your first draft.”; **Editing and preview** — “Choose a view and understand Markdown spacing.”; **Your local documents** — “Learn autosave, versions, and recovery limits.”; **Export and share** — “Choose a format or understand share links.”; **Use your AI provider** — “Configure optional writing assistance and context.”; **Something looks wrong** — “Follow safe troubleshooting steps.”

Below: compact reference links for Markdown, Mermaid, math and shortcuts. Then a quiet **Need to report a problem?** block linking to the verified GitHub issue flow. Explain: “Share the steps and browser details. Remove private document content before posting.” No fabricated live chat, response SLA, support email or contact form backend.

Search must be real local index search or be omitted; never display a decorative nonfunctional input. Index public help content only. Show title, category and two-line excerpt. Keyboard arrows move results, Enter opens, Escape closes; announce result count. Query belongs to help UI only: never read editor documents or encode note contents in a URL or analytics. Empty input shows useful starting topics. No results: **No matching guide yet. Try a shorter phrase or browse the topics below.** Index load failure: **Help search is unavailable. You can still browse every guide below.** Loading uses reserved space and text. For an overlay, trap focus, restore it on close, and lock background interaction.

### B. Getting started article

H1 **Your first document in Markups**. Intro **Start with a local draft, see the preview, and export a copy when you are ready.** Avoid invented read-time estimates; calculate from published copy if shown.

Sections in order: Open editor; write a short note; switch Write/Split/Preview; adjust split; use a second tab; export a copy; understand local saving. Use one realistic source example:

```markdown
# Project notes

## Next steps
- [x] Capture the idea
- [ ] Review the draft

| Item | Status |
| --- | --- |
| First draft | In progress |
```

Show the matching rendered example next to the source on wide screens and stacked below it on narrow screens. Label both. CTA **Try this in the editor** uses a supported safe mechanism or simply opens the editor; never overwrite an existing note. Export reminder: **Keep an exported copy of important work. Local browser storage is not a separate backup.** Related: local documents, editing/preview, export.

### C. Editing and preview article

H1 **Make the editor fit your writing.** Intro **Choose space for the source, the finished page, or both.** Sections: view modes; resizing with a visible divider; preview updates; scrolling; Markdown line breaks; paragraph spacing; preview typography versus source position; focus and writing preferences.

Include a source/output comparison showing that a soft newline inside a paragraph can render as a space under normal Markdown rules, while a blank line begins a new paragraph. Explain hard breaks using two trailing spaces or the parser-supported alternative verified for this build. Never promise source and rendered text align line for line: headings, wrapping, diagrams and block margins make their geometry different. This addresses user confusion without representing normal Markdown behavior as a broken editor.

Show a before/after **same document, different view** illustration. If a compact-spacing preference is not implemented, do not add a fake toggle to the public design. Distinguish a visual illustration from a functional preference. Link real preview failures to troubleshooting, with exact reproduction steps instead of “clear everything.”

### D. Local documents and recovery article

H1 **Know where your drafts live.** Lead **Local drafts are stored in this browser. Export copies you want to keep independently.**

Sections: tabs and browser folders; autosave indicators and failure states; local versions; finding an existing draft; browser/device boundaries; storage limits; recovery checklist; deletion behavior. A plain diagram separates Current browser storage, Exported file, and Planned cloud backup; cloud is dashed and labeled Planned. A saved indicator proves local persistence only, never remote backup.

Recovery checklist starts with preserving any visible text by download/copy, checking the same browser profile/origin, inspecting available tabs/history, and documenting errors. Do not instruct clearing site data, reinstalling, or deleting storage as the first fix. Never guarantee recovery. Document actual deletion/version behavior after verification; user preference is to keep versions/link metadata recoverable, but a preference is not proof that the current UI fulfills it. Provide no destructive buttons in the guide.

### E. Export guide

H1 **Choose the right format for the next step.** Lead **Keep editable Markdown, make a visual PDF, or share a standalone page.**

Use a format matrix with columns Format, Best for, Important limit. Rows: `.md` — portable source — destination renderer may differ; PDF — visual handoff — image-based, text/link behavior not guaranteed; HTML — standalone rendered document — external resources may still require connectivity; `.txt` — plain content — no rich formatting; PNG — visual snapshot — large output can be expensive; `.doc` — Word-compatible handoff — HTML wrapper, not native `.docx`; Print — system printing workflow — browser/printer pagination varies. Verify exactly what HTML embeds before implying assets travel with the file.

Desktop table columns approximately 16%/36%/48%; row min height 64 px, padding 16 px; mobile convert to labeled format cards rather than forcing unreadable three-column text. Include 3-step instructions using the actual export menu labels once verified. Follow with troubleshooting: missing diagram, large image/document memory pressure, pagination, browser download blocking. State no invented hard file-size threshold. CTA **Open export in the editor** only if a supported deep link exists; otherwise **Open the editor**.

### F. Sharing guide

H1 **Share a document deliberately.** Lead **Choose a Markdown file or a link that includes the document content.**

Two comparison cards: **Send a file** — recipient gets an exported copy; **Create a share link** — link contains document data and anyone with it can read it. Clarify whether media actually travels with a share payload based on implementation. Mention URL length limits without promising a universal maximum. Put **Do not include secrets or private information in a public share link** beside the link method. Explain that a link is a snapshot if verified; do not describe it as a continuously synchronized document. No fake password, revoke, permissions or expiration controls.

### G. Optional AI assistant guide

H1 **Writing help with your chosen AI provider.** Intro **Connect a supported provider key when you want assistance. Review the context and the result.**

Order: what is optional; provider/key setup; session versus persistent key preference as actually implemented; context selection; sending a request; reviewing/applying output; errors and disconnect. Use redacted fictional key text, never real secrets. Provider/model names should come from the current supported configuration, not a stale list. No default paid provider recommendation or invented compatibility.

Show a compact 3-step diagram: Chosen text → Configured provider → Suggestion to review. Show settings in a fit-to-height pane with fixed header/footer, independently scrollable body, visible input labels and helper text. A chat composer stays visible above the safe area, uses 16 px input text on mobile and grows from 44 to 120 px before scrolling. Avoid clipped send buttons. No functional provider calls in marketing demos.

Troubleshooting cards: missing key, provider rejection, network/CORS/endpoint issue, rate/usage limit, canceled request. Explain errors without exposing keys in screenshots, URLs, logs or telemetry. Link to provider documentation only after verifying destinations. Never silently expand context or send the entire note to make the demo work.

### H. Markdown reference and example pages

H1 **Markdown syntax, with the result beside it.** Intro **Look up the syntax, copy a small example, and see what Markups renders.**

Grouped in-page navigation: Basics, Lists, Code, Tables, Links/media, Tasks/alerts, Math, Diagrams. Each example has heading, one-sentence purpose, source, corresponding output, Copy example button and compatibility note when needed. Show exact supported syntax; no unsupported extension showcase. Copy success lasts 2 seconds and is announced politely; clipboard rejection reveals a selectable source block with **Select the example and copy it manually**. Never shift card height on success.

Mermaid page: flowchart first, then only verified supported diagram types; each source has a matching actual rendered preview or an explicitly static illustration. Math page: inline expression, block equation, fractions/sums and escaping pitfalls. Retain source on rendering failure. An example may be copied locally without sending it to a service. Lazy-load expensive renderers; text/source must remain available before enhancement.

### I. Keyboard shortcuts

H1 **Keep your hands on the keyboard.** Intro **Find shortcuts for editing, navigating, and changing views.** Categories: formatting, search, documents, views, optional writing modes. Table columns Action, Windows/Linux, macOS. Use semantic `kbd` styling, 12/20 px, 1 px border, 5 px radius, 4 px horizontal padding. A platform selector changes labels and table entries without losing filter text.

Populate from the actual shortcut registry and verified browser behavior. Never invent Ctrl/Cmd bindings or override reserved browser commands in a marketing page. Include **Some shortcuts depend on your browser or writing mode**. Search/filter state uses the same empty/failure patterns as Help. No “press /” shortcut while typing inside fields.

### J. Troubleshooting

H1 **Get back to your document.** Intro **Start with the symptom. Preserve your work before changing browser settings.**

Six expandable symptom groups: Preview not updating; Split divider not moving; Unexpected spacing or line breaks; Draft not appearing; Export incomplete; AI request failed. Each contains What to check, Safe next step, What to include in a report. Start with non-destructive steps. Connect spacing to the Markdown explanation; connect missing drafts to the local recovery guide. Do not add a Clear all data action.

Issue report template: browser/version, OS, editor mode, steps, expected result, actual result, non-sensitive minimal Markdown example, console message with secrets removed. External reporting opens the verified repository issue URL; no background submission. Do not automatically attach documents, keys, local storage, account IDs, screenshots or request payloads.

### K. FAQ

H1 **A few useful answers before you write.** Use exactly eight default questions: Is it free? Do I need an account? Where are drafts saved? Can a lost draft be recovered? Which formats can I export? Who can read a share link? How does AI use my text? Are cloud/Drive/GitHub connections available?

Answers must be complete and consistent with sections 1 and 4 above, each about 35–65 words, with a single useful guide link when relevant. Do not use placeholder “learn more” answers. All answers remain available in crawlable HTML. Accordion headers are buttons, 56 px minimum, 18/26 px text; answers padding 0 20 20 px. Initially all items are closed unless the URL fragment targets one; multiple answers may remain open. Opening an answer leaves focus on its trigger. Do not automatically generate FAQ rich-result claims.

### L. Roadmap

H1 **What works today. What is being prepared.** Intro **Use the local editor now. Future connected workflows will be optional and clearly labeled.**

Two stacked groups: **Available now** contains local writing/preview, document tools, export/share and optional BYOK AI; **Planned / In development** contains Markups Cloud, Drive and GitHub manual file workflows. On desktop planned cards use three columns, gap 24 px, min height 224 px, padding 24 px; mobile single column. Card order: status label, feature name, value, boundaries. No dates, progress percentages, voting counts or fake kanban activity.

Cloud boundaries: consent, bounded text storage, quota/recovery controls and no automatic content upload. Do not publish a per-user quota as final until configured and tested. Provider workflows require setup/validation. One real GitHub discussion/issue link may invite feedback if that destination exists. No “Connect now,” OAuth buttons, waitlist capture, fake toggles or disabled buttons that resemble available features.

### M. Open source and license

H1 **Inspect the tool you write with.** Intro **Explore Markups on GitHub, read the license, and see how the project is built.** Main CTA **View source on GitHub**. Secondary **Read the MIT license**.

Repository card: actual repo name/description/license; optional live stars with fixed-width slot and graceful omission on failure. Star snapshot from another date must not appear as current. Link to actual contribution instructions or repository issues; do not invent contributor names, sponsor plans, security reporting channels or community chat. A public issue warning says not to post secrets or sensitive vulnerabilities; use a private reporting route only when verified.

License page renders the repository's actual license text verbatim with verified copyright information, a small explanatory introduction and source link. Do not use a paraphrase as the license or claim MIT grants rights to every third-party font/icon/dependency. If dependency notices exist, link their actual location.

### N. Privacy, storage/cookies, terms and accessibility

Use a shared trust-document template: breadcrumb, H1, short plain-language summary, genuine last-reviewed date, inline TOC, narrow article body, numbered sections, related policies, verified contact route. Do not stamp today's date as evidence of legal review. Typography 17/29 px, reading width 712 px, H2 top gap 48 px, no decorative glass around legal text.

Privacy lead: **Understand what stays in your browser and what leaves when you choose a connected action.** Include a data-flow table with columns Activity, Data involved, Destination, User control. Cover local drafts/history, exported files, share-link content, external image/video requests, optional AI provider requests and keys, and actual telemetry/hosting requests. Inventory analytics, consent state, retention and third-party scripts before making exact claims; local-first document storage does not prove zero network collection. Link provider policies where verified. No invented legal entity, retention duration, residency, compliance badge or “we collect nothing” claim.

Storage/cookies page distinguishes browser storage for documents/preferences from optional analytics cookies and third-party embeds. State actual purpose, storage type, lifetime and controls only after verifying them. Explain consequences of removing site data. Do not add a decorative consent banner or pretend all regions require one identical legal flow; implement any consent UI only after a confirmed policy decision. No settings toggle without real behavior.

Terms outlines verified service scope, local-data responsibility, optional provider services, acceptable use, license distinction, limitations and revision handling. Leave unresolved jurisdiction/operator clauses as explicit review requirements in the design handoff, never invented public legal copy. Policy publication requires owner/legal review; do not present generated draft text as approved law.

Accessibility page lead: **A writing workspace should stay usable with different ways of navigating and reading.** Explain actual keyboard access, focus, view controls, contrast and motion support, known editor/diagram limitations and a verified feedback route. Target WCAG 2.2 AA; never assert certified or fully compliant without evidence. Use an honest reviewed state rather than a fake accessibility score.

### O. 404 and exceptional states

H1 **This page could not be found.** Body **The address may have changed. Open the editor or browse the help guides to continue.** Two links: Open editor and Browse help. Return a genuine HTTP 404, not a soft 404 or editor-shell success response. Do not imply local documents were deleted. No automatic redirect countdown, decorative lost robot, infinite spinner or unrelated illustration.

Public guide load failure: keep the header and safe navigation, show **This guide could not load. Try again or browse Help.** Retrying must not discard editor content or clear browser storage. Offline message should describe the current failed request, not advertise a guaranteed offline mode.

## 5. Complete state and interaction contract

Every component requires default, hover, focus-visible, pressed, loading, success, empty, error and disabled/unsupported states where applicable. Do not manufacture states for static text. Every actionable element has a destination or a defined state transition. Buttons perform actions; anchors navigate.

Menus: Escape closes, outside click closes, focus restores to trigger; route changes close mobile menu. Accordions preserve focus and announce expansion. Back/forward navigation restores meaningful scroll position. Article hash navigation reveals headings and any closed container. No hover-only explanations. External links announce a new tab when one is deliberately used; do not force all links into new tabs.

Motion: hover 140 ms; menus 180 ms; accordion 200 ms; source/output tab transition 160 ms, ease-out with no bounce. Supporting articles do not have looping decoration. At most one controlled example animation on an example page; pause control and final static reduced-motion state are required. Honor reduced motion, forced colors and reduced transparency. Avoid sticky elements that jump when the address bar or mobile keyboard changes viewport height.

Print styles: white background and dark ink; remove global navigation, sticky sidebars, search and decorative controls; print article title, source/output examples and related references. Expand FAQ answers for print, unwrap or responsibly wrap code, repeat table headers where supported and avoid splitting short warnings across pages. Do not promise exact browser pagination. Article screenshots need descriptive captions; oversized illustrations may be omitted when they add no printable information.

## 6. SEO and discoverability specification

Design for people finding a specific answer. Each route has one main intent, descriptive H1, unique title, useful introduction and a natural link back to the editor. Meaningful page text and anchors must exist in initial HTML or equivalent indexable rendering; do not hide the article in a screenshot or require interactions to expose its only content.

Use these title/description drafts, refining to the actual published article. Character counts are editorial guides, not ranking guarantees; Google may rewrite titles/snippets.

| Page | Title draft | Meta description draft |
|---|---|---|
| Help | Markups Help — Markdown Editor Guides | Find practical guides for editing Markdown, local drafts, exports, sharing, and optional AI assistance in Markups. |
| Getting started | Get Started with Markups — Write, Preview, Export | Create a local Markdown draft, switch editor views, and export your first document without creating an account. |
| Editor/preview | Markdown Editing and Live Preview — Markups Help | Learn Write, Split, and Preview modes, adjust the divider, and understand Markdown line breaks and paragraph spacing. |
| Documents | Local Drafts, Autosave and Recovery — Markups Help | Understand where Markups saves drafts, how local history works, and what to check when a document is missing. |
| Export | Export Markdown to PDF, HTML and More — Markups | Compare Markups export formats, including image-based PDF and Word-compatible .doc, and learn their limitations. |
| Sharing | Share Markdown Files and Links — Markups Help | Choose a file or a content-bearing share link, and understand who can read a shared Markups document. |
| AI | AI Writing Assistant Setup — Markups Help | Configure an optional AI provider, understand which context is sent, and review writing suggestions before applying them. |
| Reference | Markdown Cheat Sheet with Examples — Markups | Look up supported Markdown syntax with source and rendered examples for headings, lists, code, tables, math, and diagrams. |
| Troubleshooting | Markdown Editor Troubleshooting — Markups Help | Diagnose preview, split-view, local saving, export, and AI issues with steps that help preserve your work. |
| FAQ | Markups FAQ — Storage, Sharing, Exports and AI | Get clear answers about accounts, browser storage, recovery, sharing, exports, optional AI, and planned cloud connections. |
| Roadmap | Markups Roadmap — Current and Planned Features | See what the local editor supports today and what is planned for optional cloud, Google Drive, and GitHub workflows. |
| Open source | Markups Open Source — Repository and MIT License | Inspect the Markups source, read its MIT license, and find verified project contribution and issue links. |

Supply matching unique titles/descriptions for remaining pages in the deliverable. Keep privacy/terms titles plain and accurate. Only use language alternates for real translated equivalents. Do not generate fake locale routes.

Canonical: one approved canonical URL per distinct page, respecting existing trailing-slash/redirect policy. Keep canonical, internal links, sitemap and social metadata consistent. Never canonical every help article to `/`. Resolve the existing `/` versus `/landing` ownership decision before changing either. Old equivalent URLs require explicit redirect mapping, not a second self-canonical duplicate.

Structured data: use truthful WebSite/WebPage and BreadcrumbList where appropriate; an article may use Article/TechArticle with real author and actual dates. If a SoftwareApplication description is used, it must match visible product facts and valid current schema requirements. Never invent AggregateRating, Review, Offer, author credentials or download counts. Design the FAQ for readable answers, without promising FAQ rich results; recheck Google's current supported features before adding enhancement-specific markup. Schema is not a ranking guarantee.

Social cards: 1200 × 630 image with Markups logo, page-specific short title and restrained workspace/diagram visual; keep essential type 64 px inside edges. Provide meaningful OG/Twitter fields and a verified absolute image URL. No fake browser error/UI text on previews.

Sitemap includes only approved canonical, indexable, successful pages; lastmod reflects substantive changes. Search-results/utility pages may use noindex according to the approved route plan. Do not block crawling with robots and expect crawlers to read a noindex directive behind that block. A noindex or robots rule is not access control for a document. Never submit private/editor/share content to indexing systems.

Link relevant guides using descriptive anchors, two to four per article as useful. Reference examples connect to workflows, and troubleshooting connects back to the relevant explanation. Avoid identical keyword-heavy footer lists. No hidden text, crawler-specific claims or AI-ranking guarantees.

## 7. Performance, accessibility and privacy acceptance

Targets: LCP <=2.5 s, INP <=200 ms, CLS <=0.1 at the 75th percentile of real visits when field data exists. These are goals, not measured results. A Lighthouse run alone does not establish field performance. Do not initialize Monaco, AI SDKs, KaTeX or Mermaid globally across policy/help pages. Render static useful content first; load demos/renderers only where needed. Reserve example/image dimensions; never lazy-load the main above-fold LCP image. Prefer CSS/material simplicity over multiple full-screen blur layers.

Use semantic landmarks, one descriptive H1, logical heading order, skip link, correct focus order, visible focus, accessible names, text contrast >=4.5:1 normal and >=3:1 large, usable non-text controls, 44 px practical targets and keyboard-operable menus/search/tabs. Verify contrast over glass rather than testing only the background swatch. Do not use a fake accessibility overlay widget as a substitute for usable components.

Telemetry, if approved, records coarse UI actions only. Never include document contents, prompts, provider keys, share payloads, note names or sensitive query strings. Help search should work without a remote analytics request. No additional marketing trackers, external chat embeds, newsletter collection or auto-upload during the design prototype.

## 8. Companion landing-page review alignment

The original landing prompt stays unchanged. When these designs are implemented together, resolve these documented ambiguities explicitly:

1. The original FAQ mentions six items but lists eight. Use the actual listed set consistently; the standalone FAQ above has eight deliberately defined questions.
2. A 720–820 px hero visual cannot fit naturally inside a 7/12 column at 1200 px. Use a full-width hero demo below the intro, or scale its layout to the actual column width while preserving readable text. Do not overflow the grid to satisfy incompatible dimensions.
3. Resolve overlapping hero breakpoint instructions with one rule: two-column marketing hero at >=1280 px; stacked below 1280. Supporting documentation breakpoints follow section 3.
4. Four proof items require four equal desktop columns, two at tablet and one/two at mobile according to readable width; do not use a three-column instruction for four identical items.
5. The marketing home H1 may remain benefit-led, but its title/meta and visible introductory context must clearly identify the browser Markdown editor. Do not repeat a keyword mechanically across every section.
6. Add the shared route, metadata, canonical, initial-HTML, loading/failure, font-loading and performance rules above to the implementation handoff. Do not assume visual detail alone covers these requirements.
7. Use real policy destinations such as `/privacy-policy`, and verify served routes before enabling footer links. A local source file is not evidence that production serves the page.

## 9. Deliverable and verification contract

Return a complete, connected multi-page prototype/specification. Include: route inventory with existing/proposed status; full desktop Help hub; complete article template applied to every requested guide; reference/example pages; FAQ; Roadmap; Open source; trust-document templates with accurate finished factual copy and clearly identified legal-review dependencies; 404; shared header/footer/search; mobile layouts and critical states. No lorem ipsum, fake metrics, copied competitor screens, dead CTAs or invented product behavior.

Provide exact frames at 1440 × 1000, 1024 × 900, 768 × 1024 and 390 × 844, plus 360 and 320 px overflow checks. Pages scroll naturally; viewport frame height is not a page-height constraint. Include annotated grid, type, spacing, icon size, corner radius, overlay stacking, focus and motion specs. Use z-index roles: base 0, sticky article navigation 10, global header 30, menu backdrop 40, modal/search 50, ephemeral toast 60; avoid unnecessary stacking contexts from blur/transforms.

For every interactive component document trigger → state change → feedback → keyboard behavior → close/recovery path. For every page document entry path → main question answered → useful next action. Include a metadata and redirect matrix, related-link matrix, verified destination checklist, and content-status markers for unresolved claims. Do not publish placeholders as completed legal or support information.

Verify the design against these journeys: first-time writer starts and exports; user understands why source lines and preview differ; user finds recovery guidance without clearing data; user chooses PDF knowing it is image-based; user understands share-link visibility; user configures AI without exposing a key; user sees cloud is planned; keyboard-only visitor navigates Help/search/FAQ; narrow-screen visitor reads tables/examples; failed search/star request still leaves the site useful.

All design review outputs must distinguish proposed behavior from implemented/tested behavior. Do not claim these prompts certify deployment readiness, live route availability, accessibility conformance, SEO ranking, export fidelity or actual performance.

## 10. Research foundation

Use these as primary principles, not visual templates. Current research is dated 2026-11-03; verify changeable platform/provider information again before implementation.

- Apple Materials: https://developer.apple.com/design/human-interface-guidelines/materials
- Apple Meet Liquid Glass: https://developer.apple.com/videos/play/wwdc2025/219/
- Apple Motion: https://developer.apple.com/design/human-interface-guidelines/motion
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Google SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google developer search guidance: https://developers.google.com/search/docs/fundamentals/get-started-developers
- Core Web Vitals: https://web.dev/articles/vitals
- Google current search documentation and feature changes: https://developers.google.com/search/updates
- Markups feature/license verification: https://github.com/Nir-Bhay/markups

Apply the principles to a coherent Markups site: clear white reading surfaces, restrained glass navigation, precise typography, practical examples, candid product boundaries and useful links between pages. A visitor should understand both how to use the editor and what happens to their document.
