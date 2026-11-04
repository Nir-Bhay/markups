# Copy-and-paste design prompt

You are a principal product designer, web art director, UX writer, and conversion-focused SaaS marketer. Design a complete, high-fidelity, modern landing page for **Markups**, a browser-based Markdown editor. Deliver one cohesive page system with precise desktop, tablet, and mobile behavior. Treat every instruction below as a design and content contract.

## 1. Assignment and guardrails

Create a fresh, polished marketing page for Markups. Use a bright white-first palette, carefully restrained glass surfaces, a few bento-grid moments, and a strong product demonstration. The visual quality should feel current beside excellent software products in 2026: calm, precise, content-first, tactile, editorial, and technically credible.

Do not inspect, copy, extend, or redesign any current Markups landing, SEO, legal, or marketing page. Do not change the editor application. This is a self-contained design direction for a new landing page concept only. Do not reuse a generic SaaS template, generic AI landing pattern, or stock dashboard composition.

The page must answer these questions within a few seconds:

1. What is Markups? A free, open-source Markdown editor that runs in the browser.
2. What can I do with it? Write and preview Markdown, use code/math/diagrams/media, organize drafts, and export or share documents.
3. Why trust it? No account is needed to start, drafts stay in the current browser by default, and the editor is open source.
4. What should I do next? Open the editor or inspect the GitHub project.

Build the page around **one focused writing workspace**, not around a fictional cloud dashboard or analytics product. No invented user counts, customer logos, testimonials, performance numbers, security certifications, search rankings, “#1” claims, or promised launch dates. Never make an unavailable integration look live.

## 2. Brand and product truth

The product name is **Markups**. The canonical product is `https://markups.dev/`; the public source repository is `https://github.com/Nir-Bhay/markups`. The repository is MIT licensed. At research time on 2026-11-03 the GitHub page showed 24 stars; treat that only as a research snapshot, never as a value to hardcode. Fetch the current star count from GitHub at runtime or show a plain “Star on GitHub” link without a number when the count cannot be loaded.

### Features available in the editor now

- Monaco-based Markdown editor with **Write**, **Split**, and **Preview** modes; resizable split panes and scroll synchronization.
- Live Markdown preview with headings, tables, task lists, callouts, emoji, footnotes, and syntax-highlighted code.
- KaTeX math and Mermaid diagrams, with clear loading/error states where rendering takes time.
- Multiple document tabs and an in-browser file/folder explorer.
- Local autosave and local version history.
- Image insertion and resizing, plus supported video embeds.
- Import from a local Markdown/text file, a Markups share link, or an allowed URL.
- Export to Markdown, image-based PDF, standalone HTML, plain text, PNG, and print; a Word-compatible `.doc` export is HTML, not a native OOXML `.docx` file.
- Share by a URL-encoded document link or by exporting/sharing a Markdown file. Explain that anyone who receives a share link can read its contents.
- Optional AI Writing Assistant with bring-your-own provider/API key, selection-aware writing actions, configurable context, and right, split, or floating panel layouts. A user-selected excerpt/document context is sent to the AI provider they configure; do not imply AI requests stay only in the browser.
- Focus, typewriter, fullscreen, Vim keybindings, find/replace, templates, snippets, Markdown linting, goals, document statistics, table of contents, and backlinks.
- Local-first use: editing and local saving do not require a Markups account. Documents stay in this browser until the user chooses an export, share action, or a separately configured connected service.

Keep claims exact. “Word export” means Word-compatible `.doc`, not native `.docx`. PDF output is image-based. Do not promise selectable PDF text, clickable PDF links, exact page fidelity, unlimited document size, or guaranteed offline behavior. A first visit needs the network; service-worker behavior can make some later visits available from cache, but do not market this as a full offline guarantee.

### Future work: visibly planned, not live

The codebase contains an opt-in cloud/provider direction that is not connected to a live, provisioned backend in the current build. Present it only in a clearly marked **Planned** or **In development** roadmap area, with no dates or guarantees:

- Markups Cloud account and small, bounded, user-consented text-document backup.
- Manual Google Drive save/open.
- Manual save/open to a user-selected GitHub repository.
- Explicit quotas, per-document consent, and recovery/deletion controls before any cloud pilot is enabled.

Do not depict Appwrite sign-in, cloud saving, Drive, GitHub sync, cross-device synchronization, collaboration, or cloud attachment backup as available. Do not suggest documents upload automatically. The intended direction is optional and user-initiated; cloud attachment support and automatic sync are not part of this promise.

## 3. Creative direction

### Design idea: “A clear surface for structured thought”

Show the pleasure of seeing source become a readable document. The main visual story is a real Markdown editing surface beside an elegant rendered preview. The page should feel like a well-made creative tool: warm white canvas, ink-dark typography, precise indigo/blue accents, fine borders, balanced whitespace, useful details, and soft depth.

Glass is a **functional navigation/control material**, never a blanket treatment. Use it selectively on the sticky top navigation and perhaps one compact floating demo control. Keep the editor, document preview, cards, FAQ, roadmap, and long-form content surfaces opaque or nearly opaque so text remains easy to read. Never stack glass on glass. Avoid translucent panels over small code, long text, or busy diagrams.

Take inspiration from current software design principles—clear hierarchy, scannable information, restrained navigation, compact controls, useful customization, and purposeful motion—but do not imitate another brand, screen, exact layout, icon, or copy. The page must feel recognizably Markups.

### Visual character

- Bright, white-first, open, crisp, and light. The page background can use a barely tinted cool-white base (`#F7F9FD` or equivalent) with large white content surfaces.
- Accent palette: deep ink/navy for text, a confident indigo/cobalt for primary actions, a restrained violet transition as a secondary accent, and a small fresh teal for “saved/healthy” status. Use color with meaning rather than making every card glow.
- Suggested initial tokens (tune only while preserving contrast and a white-first feel):
  - Canvas: `#F7F9FD`
  - Surface: `#FFFFFF`
  - Primary ink: `#141A2B`
  - Secondary text: `#667085`
  - Border: `#E6EAF1`
  - Primary indigo: `#4F46E5`
  - Soft indigo surface: `#EEF0FF`
  - Teal success: `#0F9D83`
  - Warm highlight: `#F6B84B`
- Use a quiet, low-saturation indigo-to-blue wash behind the hero product visual, not a giant purple gradient background. Gradients are accents, not a substitute for layout.
- Use a sans-serif such as Geist or Inter for UI and headlines, with JetBrains Mono for code, keyboard hints, and technical labels. Keep code monospace visually distinct but never tiny.
- Illustrations should be interface-derived: real editor chrome, rendered Markdown, diagrams, status indicators, and document thumbnails. Avoid floating 3D blobs, robot heads, crystal balls, random sparkles, abstract “AI energy,” generic stock photos, or decorative icons without meaning.

## 4. Design system and pixel-level layout

### Canvas and grid

- Desktop reference viewport: **1440 × 1000 px**.
- Primary content max width: **1200 px** (allow up to 1240 px only for the full-width editor demonstration); centered.
- Desktop side margins: 32 px minimum, increasing naturally with viewport width.
- 12-column desktop grid, 24 px gutters. Tablet: 8 columns, 20 px gutters. Mobile: 4 columns, 16 px gutters.
- Use a consistent 8 px spacing system; 4 px is allowed for tight icon/label alignment only.
- Section vertical spacing: 112–136 px desktop, 80–96 px tablet, 60–76 px mobile. Dense feature rows may use 72–88 px desktop. Do not create accidental blank regions.
- Header height: 72 px desktop, 64 px mobile. Hero top spacing begins below the header; sticky navigation must never cover anchor destinations.
- A section’s text column should stay near 620 px wide. Body copy should normally remain 55–70 characters per line.

### Shape, border, elevation

- Major demo/hero frame: 24 px radius.
- Bento cards: 20 px radius; compact controls: 12–14 px radius; pills only for status labels and tiny category tokens.
- Use 1 px cool-gray borders, subtle inner highlights, and soft layered shadows. Example shadow family: `0 14px 40px rgba(23, 35, 70, .08)` for the hero frame and `0 4px 16px rgba(23, 35, 70, .045)` for small cards. Never use dark, heavy, floating shadows on every card.
- Glass navigation: translucent white around 74–84% opacity, subtle `backdrop-filter: blur(16–22px) saturate(140%)`, thin white/gray border, and a soft shadow. Provide an opaque fallback for unsupported browsers and `prefers-reduced-transparency`/high-contrast situations.

### Typography scale

- Hero H1: 60–68 px desktop, 48–54 px tablet, 38–44 px mobile; line-height 1.02–1.08; max width about 760 px.
- Section H2: 40–48 px desktop, 34–38 px tablet, 30–34 px mobile; line-height 1.1.
- Card H3: 20–24 px; body: 16–18 px with 1.55–1.7 line height; helper text: 14–15 px.
- Eyebrows/overlines: 12–13 px, medium weight, modest tracking, never low contrast.
- Mono labels: 12–14 px. Do not shrink feature details into unreadable captions.
- Keep hierarchy to a small set of weights. Avoid excessive all-caps, letter spacing, and multi-gradient text.

### Controls

- Primary button: 48 px high desktop, 48–52 px mobile, 16–20 px horizontal padding, indigo fill, white semibold text, 12–14 px radius, clear hover/focus/pressed states.
- Secondary button: same height, white surface, clear border, ink text. Links have visible hover and keyboard focus.
- Icon buttons must have an accessible text label or tooltip and a minimum 44 × 44 px practical target; do not rely on unlabeled icons.
- Use real brand marks and a consistent icon family (Lucide-like stroke icons or the project’s current line-icon language). No emoji in navigation or major UI controls.

## 5. Page structure and exact content direction

Design the page in this order. The copy below is a strong starting point; refine it for clarity and rhythm without changing product truth.

### A. Sticky navigation

At the top, place a centered, floating-but-grounded white glass bar, 68–72 px high, max width 1240 px, with 12–16 px inset from the top. On scroll, reduce its height slightly to 60–64 px; keep it legible and do not add a second nested glass layer.

Left: Markups brand mark (simple white “M” in a blue/indigo rounded square) and wordmark “Markups”.

Middle links: **Features**, **How it works**, **Privacy**, **Roadmap**, **FAQ**. Use compact spacing and quiet text; the active anchor gets a subtle text/accent state, not a glowing pill.

Right: a small GitHub star control and primary **Open editor** button. The star control links to `https://github.com/Nir-Bhay/markups`; if implementing a dynamic count, render a loading placeholder that does not shift width, then the current count. If data cannot load, preserve the plain link and suppress the stale number.

Mobile: use the logo, a compact **Open editor** action, and a clearly labeled menu button. Open a single opaque or gently translucent menu sheet with large tap targets. Do not squeeze all desktop links into the bar.

### B. Hero: the promise and the product

Use a balanced two-column layout at 1440 px: copy on the left (5/12 columns) and a large product demonstration on the right (7/12). At 1024 px and below, let the demonstration move under the copy. At 720 px and below, stack fully and keep the two CTAs visible without an oversized vertical gap.

Eyebrow: **FREE · OPEN SOURCE · NO ACCOUNT NEEDED**

H1: **Write in Markdown. See the whole picture.**

Body: **A focused browser editor for ideas that mix words, code, math, and diagrams. Write on one side, see your document take shape on the other, then export or share when you’re ready.**

Primary CTA: **Open the editor** → `https://markups.dev/` (or the product’s approved editor route).

Secondary CTA: **Explore the workspace** → scroll to the interactive product demonstration.

Below CTAs, one calm reassurance line: **Free to use · Your drafts stay in this browser by default · Export whenever you choose**.

#### Hero product frame

Create a 720–820 px wide, 500–560 px tall high-fidelity desktop editor mock; use realistic Markups proportions and editor details. It should resemble an application preview, not a dashboard. Include:

- a thin tab row with “Project brief” and “Untitled” tabs plus a small add-tab control;
- a very compact editor toolbar with a few recognizable formatting controls;
- source pane on the left showing readable Markdown with a title, short prose, a small table, one Mermaid code fence, and a math expression;
- rendered preview pane on the right showing the same title, text, one rendered diagram, and a neatly typeset equation;
- a restrained Write / Split / Preview segmented control;
- a small **Saved locally** status with a check icon, shown as secondary product detail rather than a hero claim;
- clean dividers, adequate font size, and natural pane spacing. Preserve readable text at desktop and crop intentionally on mobile.

Do not invent a 3D glass editor or hide source text behind blur. Editor and document content surfaces are opaque white; only the navigation/control layer receives glass. Make it obvious this is the actual kind of work Markups supports.

Add one small, tasteful floating note outside the editor frame: **No setup. Start writing.** Keep it anchored to the composition, not floating randomly.

### C. Proof strip: practical reasons to trust the product

Immediately below the hero visual, include four evenly spaced, compact proof items with line icons and text:

- **No account required**
- **Local-first drafts**
- **Open source · MIT**
- **Markdown stays portable**

Beside or just below this row, show **Star Markups on GitHub** with a live star count when successfully fetched. Link to the repository and distinguish this community signal from a customer/testimonial claim. Do not fabricate user, download, or retention numbers.

### D. Interactive “See it take shape” workspace demonstration

Section eyebrow: **A WRITING WORKSPACE, NOT A FORMAT FIGHT**

H2: **From first line to finished document.**

Body: **Keep your Markdown visible while the rendered page stays close at hand. Switch views when you need room to write, room to review, or both at once.**

Use a large 1200 px container with a light-gray surround, white editor frame, subtle border, and 20–24 px radius. Add three functional mode buttons: **Write**, **Split**, **Preview**. The selected mode must be obvious and keyboard accessible.

Demonstration content should be concise and authentic: a “Release notes” document with a heading, a short paragraph, a three-row feature table, a small highlighted code fence, a Mermaid flow with 3–4 nodes, and one KaTeX formula. Use legible scale and do not show a fake document full of lorem ipsum.

Interactions:

- **Write** shows source only and expands it to the available width.
- **Split** shows source and rendered preview with a visible divider; dragging works with pointer and has a keyboard-accessible equivalent or alternative control.
- **Preview** shows the document only.
- Changing a mode should preserve document position and content; do not simulate a loading spinner that implies actual processing latency.
- Add a “Try another example” control that swaps among two authored samples (e.g. technical notes and a math/diagram page). The control must not discard user text if this is connected to a real editor; as a standalone demo, label the samples as examples.
- A small caption below: **The sample is illustrative; open Markups to work with your own document.**

### E. Bento feature grid: show the real breadth

Eyebrow: **MORE THAN A TEXT BOX**

H2: **All the pieces of a good Markdown workflow, together.**

Intro: **Draft, preview, organize, and export without switching between a handful of disconnected tools.**

Design a deliberate asymmetrical bento grid with 6 cards across 12 desktop columns. Use 20 px gaps. Keep card copy short and visuals meaningful. Use solid white surfaces, thin borders, and at most one soft-tinted card per row. Avoid a uniform grid of identical floating rounded cards. Desktop suggested composition:

1. **Large 7-column card — Write and preview together.** Show a mini split view and tiny mode control. Copy: **Switch between writing, split, and preview modes as your focus changes. Keep the source and finished page in sync.**
2. **5-column card — Rich Markdown, rendered clearly.** Show 4 small content chips or a miniature composition: **Code · Math · Diagrams · Tables**. Copy: **Syntax highlighting, KaTeX, Mermaid, tables, alerts, and more—inside one document.**
3. **5-column card — Keep drafts organized.** Show 3 document tabs and a simple two-folder tree. Copy: **Work across multiple documents, group files in folders, and return to recent drafts.**
4. **7-column card — A document that travels with you.** Show export actions in a clean vertical or horizontal list. Label them truthfully: **Markdown, PDF, HTML, text, PNG, print, and Word-compatible .doc.** Copy: **Choose the format that suits the next step. Share a link or download your file when you decide.**
5. **7-column card — Add useful media.** Show a small image being resized by corner handles and a video preview thumbnail. Copy: **Insert and resize images, then bring supported video links into the preview.** Do not suggest arbitrary iframes or every media host works.
6. **5-column card — Your AI provider, your choice.** Show a compact AI panel with a selection chip and “Review selection” action. Copy: **Bring a provider key, select the context you want to send, and apply writing help from a side, split, or floating panel.** Supporting note: **AI requests go to the provider you configure.** No robot imagery, purple magic aura, or default AI sticker.

Optional second mini-row for useful secondary features: **Focus and typewriter modes**, **Find and replace**, **Local version history**, **Goals and document stats**, **Vim keybindings**, **TOC and backlinks**. Keep this row compact; do not overwhelm the primary feature story.

Card micro-interactions: a 1–2 px lift or subtle border tint on hover, 140–200 ms; keyboard focus uses a clear outline. Animated diagrams and text must not loop independently in every card.

### F. A three-step workflow

H2: **A simple loop for serious writing.**

Use a horizontal numbered sequence on desktop and stacked sequence on mobile:

1. **Write** — “Start with Markdown. Use familiar syntax or the toolbar.”
2. **Review** — “Check structure, formatting, math, diagrams, and media in the live preview.”
3. **Take it with you** — “Download a file or create a share link when you choose.”

Connect the steps with a fine indigo line or progressively lit dots. Animate progress only when the section enters the viewport and only once; never make scrolling feel like a required animation sequence.

### G. Privacy and ownership section

Use a calm full-width two-column section. Left: heading and copy. Right: a simple three-state data-flow diagram with icons: **Write → Save in this browser → Export/share only when you choose**.

Eyebrow: **LOCAL FIRST BY DEFAULT**

H2: **Your draft begins in your browser.**

Body: **Open Markups and start writing without creating a Markups account. Local editing and autosave keep your draft in this browser. Export and share actions happen when you choose them.**

Three factual bullets:

- **No account to start writing.**
- **No automatic Markups cloud upload in the current build.**
- **Sharing creates a link that anyone who receives it can open. Treat the link as the document.**

Small AI qualifier: **If you use the AI assistant, the context you choose is sent to the provider configured with your key.**

Link CTA: **Read the privacy details** → the approved privacy-policy destination. Do not call the product “zero knowledge,” “encrypted end-to-end,” or “fully private” unless separately proven.

### H. Roadmap / what is being built

This is a transparent, restrained section with 3 feature tiles. It must not look like a currently active settings page. Place a clear section-level label **IN DEVELOPMENT — NOT AVAILABLE IN THIS BUILD** and a brief note: **These ideas are being prepared for a future opt-in pilot. No account or provider connection is required for local editing. Availability depends on setup and validation.**

Cards:

- **Markups Cloud** — “An optional account and small, bounded text backup, with explicit consent before a document is stored.”
- **Google Drive** — “A manual save/open connection for documents you choose.”
- **GitHub repositories** — “A manual save/open workflow for a repository you select.”

Add small “Planned” labels. No dates, waitlist, enable buttons, live OAuth buttons, or fake “connected” states. If the roadmap status changes later, only update it after a live production proof. Do not advertise automatic sync, cloud collaboration, cloud image storage, or unlimited storage.

### I. Open source / GitHub community section

Use a centered, high-contrast but still light section with a repository-preview card: Markups repository name, MIT license, concise repository description, current dynamic stars, and CTA **Explore Markups on GitHub**. Show **Star this project** as a secondary action.

Current repo snapshot for research only: GitHub displayed **24 stars** on 2026-11-03. Prefer a live value fetched from `https://api.github.com/repos/Nir-Bhay/markups`; cache conservatively and reserve layout width to avoid CLS. If the API is unavailable or rate-limited, show the repository link and button with no numeric claim. Do not claim “loved by thousands” or turn star count into social proof about active users.

Optional short line: **Built in the open. Useful by design.**

### J. Audience / use-case section

H2: **For work that is clearer in Markdown.**

Use three editorial columns, not customer testimonials:

- **Learning and research** — “Keep notes, equations, and structured references in one portable document.”
- **Engineering and product** — “Write implementation notes with code fences, diagrams, tables, and checklists.”
- **Technical writing** — “Draft readable guides, export files, and share a review copy.”

No invented quotes, names, organizations, avatars, or outcome metrics. Make these use cases feel concrete using small sample snippets, not marketing photos.

### K. FAQ accordion

Use a 2-column layout on wide desktop (questions left, selected answer right) or a single accessible accordion with 6 items. Keep all answers concise and truthful:

1. **Is Markups free?** “Yes. You can start writing in the browser without an account.”
2. **Where are my documents saved?** “Local documents are saved in this browser. Export or share them when you choose.”
3. **Does Markups upload my document automatically?** “No automatic Markups cloud backup is enabled in this build.”
4. **Can I share a document?** “Yes. You can create a share link or share/download a Markdown file. Anyone with the link can read that document.”
5. **Which export formats are available?** “Markdown, image-based PDF, HTML, plain text, PNG, print, and Word-compatible .doc.”
6. **Is the Word export a native .docx file?** “No. It is Word-compatible HTML saved with a .doc extension.”
7. **Can I connect Drive or GitHub?** “Those provider workflows are planned and are not available in the current build.”
8. **How does the AI assistant work?** “You configure a supported provider and key, then choose an action and context. Requests go to that provider.”

Use plus/minus or chevron icons, `aria-expanded`, keyboard operation, visible focus, and no content hidden solely on hover. If answers link to policies or documentation, use real destinations only.

### L. Final CTA and footer

Final CTA section: soft tinted indigo panel on white, not dark mode.

H2: **Make room for the next good idea.**

Body: **Open a draft, bring your Markdown, and see it take shape. No account needed.**

Primary: **Open the editor**. Secondary: **Browse the source on GitHub**.

Footer columns: Markups brand and short line (**A free, open-source Markdown editor for the browser.**); Product links (Editor, Features, Roadmap); Resources (GitHub, documentation if a real URL exists, privacy); Legal (Privacy, Terms, Accessibility). Use only confirmed routes. Keep a subdued MIT license mark and dynamic GitHub star link. Do not add a second about page, newsletter gate, or invented social accounts.

## 6. Motion and feedback specification

Motion should make the product feel responsive, not busy. The page is for people reading and writing; protect their focus.

### The one signature loop

The hero editor demonstration may contain **one** quiet, self-contained workflow loop, approximately 10–12 seconds, once visible in the viewport:

1. A single Markdown line receives a soft insertion/highlight state.
2. The corresponding preview paragraph/table/diagram appears with a short fade/translate (4–8 px maximum).
3. A tiny local save indicator changes from **Saving…** to **Saved locally**.
4. Hold the completed preview long enough to read it, then reset without a visible jump.

Do not type at a distracting speed, move the full panel, jitter the cursor, scroll automatically, or rerender the entire document. The loop must have a visible pause/play control and stop when the component is out of view. Under `prefers-reduced-motion: reduce`, display the final static state; do not require animation to understand the product.

### Component transitions

- Hover and pressed feedback: 120–180 ms, subtle color, border, or 1 px elevation shift.
- Navigation/menu/accordion transitions: 180–240 ms, ease-out, no overshoot.
- Demo mode switch: 180–240 ms crossfade/layout transition; preserve content and avoid width-induced text reflow where possible.
- Scroll reveal: optional opacity and 6–10 px movement once, disabled for reduced motion; never animate every paragraph.
- Loading/success state must always have text, not just color or motion.
- Do not use animated gradients, perpetual floating cards, parallax, auto-scrolling marquees, bouncing CTA buttons, continuous blinking cursors, confetti, or full-page entrance animations.

## 7. Responsive behavior

Produce complete layouts at **1440 px, 1024 px, 768 px, 390 px, and 360 px**. Also check a 320 px narrow viewport for overflow resilience.

- 1440: centered 1200 px content, 12-column grid, hero copy/demo split, 3-column trust strip, bento mosaic, spacious sections.
- 1024: reduce the hero visual width and typography; nav links may compact; keep CTAs clear. Bento cards can move to 2 columns.
- 768: hero stacks; demo frame becomes 2-pane only if text remains usable. Otherwise make mode toggle switch one pane at a time. Bento becomes 2 columns; section gaps reduce.
- 390/360: one-column layout, 20 px side padding (16 px at 320), no horizontal page scrolling. Keep the editor mock as a purposeful crop/one-pane interactive preview, never a microscopic fake IDE. Use 36–42 px headline text, readable 16 px body, 44 px action controls. Roadmap and FAQ stack.
- At mobile widths, do not keep a desktop navigation row, 3 tiny preview panes, dense tab bar, or overlong monospace lines. Keep the source legible and show a single-pane mode switch.
- Respect safe areas where applicable. Sticky navigation and bottom CTA must not obscure keyboard focus, content, or anchor targets.
- All images, cards, diagrams, and code snippets must scale without layout shift. Reserve exact dimensions/aspect ratios for visuals and the GitHub count slot.

## 8. Accessibility, trust, and content quality

- Target WCAG 2.2 AA: text contrast of at least 4.5:1 for normal text and 3:1 for large text; meaningful focus indicators; keyboard-operable navigation, accordion, demo modes, and pause control; focus not obscured by sticky UI; semantic headings in order; descriptive alt text or empty alt on decorative art.
- Every translucent surface must preserve contrast over the content behind it. If reliable contrast cannot be ensured, use an opaque surface.
- Do not encode selected, success, error, or roadmap status by color alone; include text and/or an icon with a label.
- Ensure code in screenshots remains readable at its presented scale; avoid long unwrapped lines.
- Link text describes its destination. `Open the editor`, `Explore on GitHub`, and `Read privacy details` are clearer than repeated “Learn more.”
- Use respectful, specific, non-hype copy. No “revolutionary,” “supercharge,” “game-changing,” “all-in-one OS,” fabricated “trusted by,” or SEO keyword stuffing.
- Clearly distinguish the app’s stable current behavior from optional AI and future cloud work.

## 9. Avoid these common visual failures

- Do not use glassmorphism on every section/card. Keep content surfaces solid; use glass for a limited control/navigation layer only.
- Do not put translucent cards on top of translucent cards or blur text/code behind panels.
- Do not add fake metric cards, invented ratings, testimonials, avatars, customer logos, or animated user counters.
- Do not copy Linear, Apple, Notion, Raycast, Vercel, or any reference product screen. Use references for hierarchy and restraint only.
- Do not produce the generic AI landing recipe: purple glow background, giant floating orb, four gradient cards, “AI-powered” as the headline, or sparkles on every CTA. AI is one optional feature among several and should be represented matter-of-factly.
- Do not create excessive pills, nested rounded rectangles, tiny uppercase microcopy, random blobs, giant empty hero whitespace, endless card walls, or icon-only feature explanations.
- Do not claim cloud sync, collaboration, account storage, native DOCX, unlimited uploads, guaranteed private share links, or tested offline behavior.
- Do not make the logo/navigation, hero CTA, demo controls, or primary copy disappear behind animation.

## 10. Deliverables and acceptance checklist

Return a cohesive, implementation-ready landing-page design specification/prototype containing:

1. Full desktop page composition from navigation through footer.
2. Responsive layouts for the five reference widths above.
3. Reusable design tokens for color, typography, spacing, borders, radii, shadows, and motion.
4. Component states for nav, primary/secondary buttons, GitHub star loading/fallback, tabs, demo mode controls, card hover/focus, FAQ, and roadmap labels.
5. Finished English marketing copy for every section listed above.
6. Hero editor mock and bento-card visuals based on real Markups workflows.
7. Accessibility and reduced-motion handling, including an opaque fallback for glass surfaces.
8. A concise interaction map showing each CTA destination and each interactive state.

Before calling it complete, verify:

- The page explains Markups and the value proposition above the fold.
- “Open the editor” and GitHub destinations are unambiguous.
- The product demo shows Markdown source becoming rendered output.
- All current-feature claims match the product-truth section.
- Future integrations are explicitly marked not live.
- GitHub stars are dynamic or omitted gracefully; no numeric value is hardcoded.
- No made-up social proof, testimonials, or metrics appear.
- The Word/PDF/privacy descriptions remain accurate.
- Glass is restrained to navigation/controls and never harms reading.
- The bento grid feels editorial and varied, not a wall of identical cards.
- The page has no horizontal overflow at 320–390 px.
- Keyboard focus, high contrast, `prefers-reduced-motion`, and a non-glass fallback work.
- Only one signature animation loop exists, it can be paused, and it stops outside the viewport.

## 11. Research references

Use these as principle-level references, not as templates to copy:

- Apple Human Interface Guidelines — Materials: https://developer.apple.com/design/human-interface-guidelines/materials
- Apple WWDC25 — Meet Liquid Glass: https://developer.apple.com/videos/play/wwdc2025/219/
- Apple Human Interface Guidelines — Motion: https://developer.apple.com/design/human-interface-guidelines/motion
- W3C Web Content Accessibility Guidelines 2.2: https://www.w3.org/TR/WCAG22/
- Linear — March 2026 interface refresh notes: https://linear.app/changelog/page/3
- Linear — Display options and user-controlled views: https://linear.app/docs/display-options
- Markups repository and live star count source: https://github.com/Nir-Bhay/markups

Design synthesis: current platform guidance treats translucent glass as a distinct navigation/control layer, keeps the content layer readable, and uses motion purposefully. Modern software interfaces benefit from consistent navigation, clear scanning, and focused controls. Apply those ideas to Markups’ writing workflow; do not imitate the reference product’s appearance.
