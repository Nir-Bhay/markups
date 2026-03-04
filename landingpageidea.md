# 🏯 MARKUPS — THE ULTIMATE LANDING PAGE DESIGN SPECIFICATION

## *The Most Exhaustively Detailed Design Document Ever Written*

---

# 📋 TABLE OF CONTENTS

1. Project Understanding & Content Strategy
2. Global Design Philosophy & Rules
3. Complete Design Token System
4. Light Mode — Liquid Glass Theme (Full Specification)
5. Dark Mode — Deep Immersive Theme (Full Specification)
6. Section 0 — Pre-loader / Page Load Experience
7. Section 1 — Navigation Bar (Sticky, Glass)
8. Section 2 — Hero Section (Bento Grid)
9. Section 3 — Marquee / Infinite Scroll Trust Bar
10. Section 4 — Dashboard Preview Section (Product Showcase)
11. Section 5 — Main Features Section (Irregular Bento Grid)
12. Section 6 — How It Works / Story Section
13. Section 7 — Advanced Features Showcase
14. Section 8 — Export Formats Deep-Dive Section
15. Section 9 — Testimonials / Social Proof
16. Section 10 — Comparison Table Section
17. Section 11 — FAQ Accordion Section
18. Section 12 — Final CTA Section
19. Section 13 — Footer
20. Global Animations & Micro-Interactions
21. Responsive Design Complete Breakdown
22. Accessibility Specification
23. Performance Optimization Notes
24. Print Stylesheet Specification

---

# 1. 🧠 PROJECT UNDERSTANDING & CONTENT STRATEGY

## What is Markups?

Markups is a **free, open-source, browser-based Markdown editor** built with modern web technologies. It is a **SaaS-style tool** that requires **no sign-up, no payment, and no installation** — users simply open the URL and begin writing. The project is hosted at `https://markups.vercel.app` and the source code lives at `https://github.com/Nir-Bhay/markups`.

## Core Value Proposition

*"The most powerful free markdown editor that gives you VS Code's editing engine, instant live preview, diagram support, math rendering, and multi-format export — all inside your browser, completely free and open source."*

## Complete Feature Inventory (Extracted from Repository)

### Editor Core
- **Monaco Editor Integration** — The same editor engine that powers Visual Studio Code, running directly in the browser. Provides IntelliSense autocompletion, advanced syntax highlighting for 20+ programming languages within code blocks, customizable font size and font family, line numbers with toggleable visibility, word wrap toggle, minimap navigation panel, bracket matching, auto-closing pairs, multi-cursor editing, find and replace with regex support, code folding, and a command palette.
- **Multi-Tab Document Management** — Users can open and work on up to 50 documents simultaneously in separate tabs. Each tab maintains its own independent content state, scroll position, and undo/redo history. Tabs can be renamed, reordered, and closed individually.
- **Auto-Save System** — Every keystroke is automatically persisted to the browser's LocalStorage. There is zero risk of data loss from accidental page closure, browser crashes, or power failures. The save happens debounced at approximately 300ms after the last keystroke.

### Preview & Rendering
- **Live Real-Time Preview** — Markdown is rendered to beautiful HTML output in real-time as the user types, with effectively zero perceptible delay. The rendering pipeline uses the `marked` library with custom extensions.
- **Split View with Resizable Divider** — The interface can be divided into editor on the left and preview on the right, with a draggable divider that the user can position anywhere. Three view modes are available: editor-only, preview-only, and split view.
- **Synchronized Scrolling** — When the user scrolls in the editor pane, the preview pane scrolls proportionally to maintain visual correspondence, and vice versa.
- **GitHub Flavored Markdown (GFM)** — Full support for GFM extensions including task lists with checkboxes, data tables with alignment, strikethrough text, alert/callout blocks (NOTE, TIP, IMPORTANT, WARNING, CAUTION), footnotes, and automatic URL linking.

### Diagrams & Math
- **Mermaid Diagram Rendering** — Users can write Mermaid syntax inside fenced code blocks tagged with `mermaid`, and the preview will render them as interactive SVG diagrams. Supported diagram types include flowcharts, sequence diagrams, Gantt charts, pie charts, class diagrams, state diagrams, entity-relationship diagrams, and journey maps.
- **KaTeX Mathematical Typesetting** — LaTeX mathematical expressions are rendered with KaTeX. Inline math uses single dollar signs `$E=mc^2$` and display/block math uses double dollar signs `$$\int_0^\infty e^{-x^2} dx$$`. Rendering is fast and produces publication-quality output.

### Export System
- **PDF Export** — Generates a beautifully formatted PDF document that preserves all markdown styling, code syntax highlighting, rendered Mermaid diagrams, and KaTeX equations. The PDF is print-ready and professional.
- **HTML Export** — Produces a standalone HTML file with all CSS styles embedded inline, ensuring the document looks identical when opened in any browser without external dependencies.
- **Markdown File Export** — Downloads the raw `.md` source file for use in other tools, version control, or archival purposes.
- **Clipboard Copy** — Copies the rendered HTML or raw markdown to the system clipboard with a single click, enabling easy pasting into emails, CMS platforms, or chat applications.

### Writing Experience
- **8+ Editor Themes** — Visual Studio Light, Visual Studio Dark, Dracula, GitHub Light, GitHub Dark, Solarized Light, Solarized Dark, High Contrast, and more. Themes affect the editor's syntax highlighting colors, background, and overall feel.
- **Focus Mode** — Hides the preview pane, toolbar, sidebar, and all UI chrome, leaving only the editor with a clean, distraction-free writing surface. Toggled via keyboard shortcut or button.
- **Typewriter Mode** — Keeps the active editing line vertically centered on the screen at all times as the user types, mimicking the experience of a physical typewriter and reducing eye strain during long writing sessions.
- **Fullscreen Mode** — Activates the browser's native fullscreen API (F11) to maximize the writing area to the entire screen, removing even the browser's address bar and tab strip.
- **Writing Goals** — Users can set a daily word count target. The system tracks progress with a visual progress bar and maintains a writing streak counter to encourage consistent writing habits.

### Productivity
- **Document Statistics** — A persistent status bar displays real-time metrics: total word count, character count (with and without spaces), paragraph count, sentence count, line count, and estimated reading time based on an average reading speed of 200-250 words per minute.
- **Table of Contents Generation** — Automatically generates a navigable table of contents from the document's heading structure (H1 through H6). Clicking a TOC entry scrolls the editor and preview to the corresponding section.
- **Keyboard Shortcuts** — Comprehensive shortcut support including Ctrl+S (save/download), Ctrl+B (bold), Ctrl+I (italic), Ctrl+K (insert link), Ctrl+Shift+V (paste as plain text), F11 (fullscreen), and many more. A shortcut reference panel is accessible via Ctrl+/.
- **Quick Snippets** — One-click insertion of common markdown structures: tables (with configurable rows and columns), code blocks (with language selector), alert/callout boxes, Mermaid diagram templates, horizontal rules, image placeholders, and more.
- **Built-in Templates** — Pre-made document templates for common use cases: README.md for GitHub projects, Resume/CV, Blog Post, Meeting Notes, API Documentation, Changelog, Contributing Guide, and License files. One click inserts the full template.

### Technical
- **Progressive Web App (PWA)** — Markups can be installed as a standalone application on desktop (Windows, macOS, Linux) and mobile (Android, iOS) devices. Once installed, it works completely offline with full functionality, syncing to LocalStorage.
- **Smart Markdown Linting** — Real-time analysis of the markdown document against best practices and common mistakes, providing inline warnings and suggestions for improvement.
- **Responsive Design** — The application itself adapts to all screen sizes, from large desktop monitors to tablets and smartphones, maintaining full functionality across all devices.

### Technology Stack
- **Vite** — Next-generation frontend build tool for instant hot module replacement and optimized production builds
- **Monaco Editor** — Microsoft's browser-based code editor (VS Code's core)
- **Marked.js** — Fast, standards-compliant markdown parser and compiler
- **Mermaid.js** — JavaScript-based diagramming and charting tool
- **KaTeX** — Fastest math typesetting library for the web
- **Highlight.js** — Syntax highlighting for code blocks
- **Vanilla JavaScript** — No framework dependency, pure JS for maximum performance
- **CSS3** — Modern CSS with custom properties, grid, flexbox, and animations
- **Service Worker** — For PWA offline functionality and caching
- **LocalStorage API** — For persistent auto-save without a backend

---

# 2. 🎨 GLOBAL DESIGN PHILOSOPHY & RULES

## Design DNA

The landing page embodies the aesthetic principle of **Japanese Bento Box design (弁当)** — where each distinct element occupies its own carefully proportioned compartment within a harmonious whole. Just as a bento box presents a curated meal with visual balance, variety, and intentional negative space, our layout presents information in irregularly-sized grid cells that together create a cohesive, scannable, and visually stunning composition.

## 20 Unbreakable Design Rules

**Rule 1 — Abundant Whitespace:** Every element must breathe. Minimum 24px gap between bento boxes. Sections have at minimum 80px vertical padding. Content within cards has generous internal padding (minimum 24px, preferred 32px for large cards). Never let content feel cramped.

**Rule 2 — Soft Squircle Corners:** All rectangular elements use smoothly rounded corners (iOS-style squircles, not simple CSS border-radius circles). Radius values range from 12px (small elements) to 24px (large cards). This creates a warm, approachable, premium feel.

**Rule 3 — Subtle Shadow Hierarchy:** Shadows establish depth and importance. Background elements have barely perceptible shadows. Foreground cards have medium shadows. Interactive elements on hover gain prominent shadows. All shadows use warm tones (not pure black).

**Rule 4 — Glassmorphism with Restraint (Light Mode):** The liquid glass effect is applied sparingly to key cards and surfaces using `backdrop-filter: blur()` and semi-transparent backgrounds. Not every element is glass — only those that benefit from depth perception against varied backgrounds.

**Rule 5 — No Bright Loud Colors:** The palette is muted, sophisticated, and calm. Accent colors (Jade Green, Persimmon Orange, Indigo) are used at controlled saturation levels. Large areas of color are tinted and desaturated. Only CTA buttons use full-saturation accent colors, and even those are warm, not neon.

**Rule 6 — Strong Visual Hierarchy:** The eye follows a clear path: eyebrow label → heading → description → supporting content → CTA. Size, weight, color, and spacing all reinforce this hierarchy consistently across every section.

**Rule 7 — Bento Irregularity is Intentional:** Grid cells are deliberately different sizes (1×1, 2×1, 2×2, 3×1, etc.). This irregularity creates visual interest and naturally guides the eye to larger, more important cells first, then to smaller supporting cells.

**Rule 8 — Micro-Animations Enhance, Never Distract:** Every animation serves a purpose — revealing content, providing feedback, or creating delight. Animations are smooth (300-600ms duration), use appropriate easing curves, and never block user interaction.

**Rule 9 — Content is King:** Design serves the content, not the other way around. Every decorative element must justify its existence by enhancing the message, not competing with it.

**Rule 10 — Mobile is Not an Afterthought:** Every section is designed mobile-first conceptually, even if implemented desktop-first technically. The bento grid gracefully restructures on smaller screens without losing information or visual appeal.

**Rule 11 — Consistent Component Language:** Cards, buttons, pills, badges, and icons follow rigid style rules throughout the entire page. A card in the hero section must share DNA with a card in the features section.

**Rule 12 — Typography is the Foundation:** Font choices, sizes, weights, line heights, and letter spacing are meticulously defined and never deviated from. Text must be legible at all sizes on all devices.

**Rule 13 — Icons are Cohesive:** Whether using emoji or SVG icons, the style must be consistent — all outline, all filled, or all emoji. Mixing icon styles within a section is prohibited.

**Rule 14 — Color Consistency:** Each color token has a specific semantic meaning and is never used outside that context. Jade is for trust/positive/links. Orange is for CTAs/urgency. Indigo is for technical/secondary accents.

**Rule 15 — Two-Mode Parity:** Both light and dark modes must feel equally premium and complete. Dark mode is not just "colors inverted" — it has its own personality (deep, immersive, ambient) while light mode has its own (airy, glass, paper-like).

**Rule 16 — Texture Over Flatness:** Subtle textures (noise grain, gradient shifts, soft shadows) prevent the design from feeling overly flat or digital. The aim is a tactile, almost physical quality.

**Rule 17 — Entry Animations are Sequential:** When a section scrolls into view, its child elements animate in with staggered timing — creating a "choreographed reveal" effect rather than everything appearing at once.

**Rule 18 — Interactive Elements Announce Themselves:** Anything clickable has a clear hover/focus state change. Cursor changes to pointer. Background, shadow, or position shifts. Users never guess what's interactive.

**Rule 19 — No Orphaned Elements:** Every element belongs to a clear group. Labels are close to their data. Icons are close to their text. CTAs are close to the value proposition they follow.

**Rule 20 — Performance is Aesthetic:** A laggy animation is worse than no animation. All effects must run at 60fps. Images are optimized. Fonts are preloaded. The page must feel snappy.

---

# 3. 🎛️ COMPLETE DESIGN TOKEN SYSTEM

## 3.1 Typography Tokens

### Font Stacks

```
--font-display: "SF Pro Display", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
--font-body: "Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", "SF Mono", "Cascadia Code", "Consolas", monospace;
```

### Type Scale

| Token | Desktop Size | Tablet Size | Mobile Size | Weight | Line Height | Letter Spacing | Usage |
|-------|-------------|-------------|-------------|--------|-------------|----------------|-------|
| `--text-hero` | 72px | 56px | 38px | 800 | 1.05 | -0.035em | Hero H1 only |
| `--text-h1` | 56px | 44px | 34px | 800 | 1.08 | -0.03em | Section main headings (rare) |
| `--text-h2` | 44px | 36px | 28px | 700 | 1.15 | -0.025em | Section headings |
| `--text-h3` | 32px | 28px | 24px | 700 | 1.2 | -0.02em | Sub-section headings |
| `--text-h4` | 24px | 22px | 20px | 700 | 1.25 | -0.015em | Card headings (large) |
| `--text-h5` | 20px | 18px | 17px | 600 | 1.3 | -0.01em | Card headings (medium) |
| `--text-h6` | 17px | 16px | 15px | 600 | 1.35 | 0 | Card headings (small) |
| `--text-body-lg` | 18px | 17px | 16px | 400 | 1.7 | 0.005em | Lead paragraphs, hero sub-text |
| `--text-body` | 16px | 15px | 15px | 400 | 1.65 | 0.01em | Standard body text |
| `--text-body-sm` | 14px | 14px | 13px | 400 | 1.6 | 0.01em | Secondary descriptions |
| `--text-caption` | 13px | 13px | 12px | 500 | 1.4 | 0.015em | Captions, metadata |
| `--text-label` | 12px | 12px | 11px | 700 | 1.3 | 0.1em | Uppercase eyebrow labels |
| `--text-tiny` | 11px | 11px | 10px | 600 | 1.3 | 0.06em | Badges, pill text, tiny labels |
| `--text-button` | 16px | 15px | 14px | 600 | 1 | 0.02em | Button text |
| `--text-button-sm` | 14px | 13px | 13px | 600 | 1 | 0.02em | Small button text |
| `--text-nav` | 14px | 13px | 14px | 500 | 1 | 0.04em | Navigation links |
| `--text-code` | 14px | 13px | 13px | 500 | 1.5 | 0 | Inline code, code blocks |
| `--text-stat-number` | 48px | 40px | 32px | 900 | 1 | -0.03em | Large stat numbers |
| `--text-quote` | 18px | 17px | 16px | 500 | 1.7 | 0.005em | Testimonial quotes |

### Font Loading Strategy
- Preload `Inter` (weights 400, 500, 600, 700, 800) via `<link rel="preload" as="font" type="font/woff2" crossorigin>`
- Preload `JetBrains Mono` (weight 500) same way
- Use `font-display: swap` for all custom fonts
- System font fallback stack ensures no layout shift

## 3.2 Spacing Tokens

| Token | Value | Usage Examples |
|-------|-------|---------------|
| `--space-0` | 0px | Reset |
| `--space-1` | 2px | Hairline separators, border adjustments |
| `--space-2` | 4px | Icon-to-label gap within tight inline elements |
| `--space-3` | 6px | Pill badge vertical padding |
| `--space-4` | 8px | Tight element gap, badge horizontal padding |
| `--space-5` | 12px | Small card internal element gap |
| `--space-6` | 16px | Standard internal element gap within cards |
| `--space-7` | 20px | Bento grid gap (tight) |
| `--space-8` | 24px | Standard card internal padding, medium element gap |
| `--space-9` | 28px | Comfortable card padding |
| `--space-10` | 32px | Large card internal padding, page horizontal padding |
| `--space-11` | 40px | Between heading and content within a section |
| `--space-12` | 48px | Hero card padding, section inner top/bottom |
| `--space-13` | 56px | Generous spacing |
| `--space-14` | 64px | Between major sub-sections |
| `--space-15` | 80px | Section vertical padding (standard) |
| `--space-16` | 96px | Hero section top padding (to clear nav) |
| `--space-17` | 112px | Extra generous section padding |
| `--space-18` | 128px | CTA section vertical padding |
| `--space-19` | 160px | Maximum breathing room |

### Grid Configuration Tokens
| Token | Value |
|-------|-------|
| `--grid-columns` | 12 |
| `--grid-gap` | 20px |
| `--grid-gap-tight` | 16px |
| `--grid-gap-loose` | 24px |
| `--grid-max-width` | 1280px |
| `--grid-padding-x` | 32px (desktop), 24px (tablet), 20px (mobile) |

## 3.3 Border Radius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | 6px | Inline code, small tags |
| `--radius-sm` | 8px | Input fields, small tooltips |
| `--radius-md` | 12px | Buttons, small cards, secondary elements |
| `--radius-lg` | 16px | Standard bento cards, modals |
| `--radius-xl` | 20px | Large bento cards, step cards |
| `--radius-2xl` | 24px | Hero cards, dashboard frame |
| `--radius-3xl` | 32px | Extra-large decorative containers |
| `--radius-full` | 999px | Pills, badges, avatar circles, theme toggle |

## 3.4 Shadow Tokens

### Light Mode Shadows
| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs-light` | `0 1px 2px rgba(28, 25, 20, 0.03)` | Barely perceptible, resting state for flat elements |
| `--shadow-sm-light` | `0 1px 3px rgba(28, 25, 20, 0.04), 0 1px 2px rgba(28, 25, 20, 0.03)` | Subtle resting shadow for small cards |
| `--shadow-md-light` | `0 4px 12px rgba(28, 25, 20, 0.05), 0 2px 4px rgba(28, 25, 20, 0.03)` | Standard card shadow |
| `--shadow-lg-light` | `0 8px 24px rgba(28, 25, 20, 0.07), 0 4px 8px rgba(28, 25, 20, 0.04)` | Elevated cards, hover state |
| `--shadow-xl-light` | `0 16px 40px rgba(28, 25, 20, 0.09), 0 8px 16px rgba(28, 25, 20, 0.04)` | Dashboard mockup, hero featured card |
| `--shadow-2xl-light` | `0 24px 56px rgba(28, 25, 20, 0.12), 0 12px 24px rgba(28, 25, 20, 0.05)` | Maximum elevation, floating elements |
| `--shadow-inner-light` | `inset 0 2px 4px rgba(28, 25, 20, 0.04)` | Inset inputs, search bars |
| `--shadow-glow-jade-light` | `0 0 32px rgba(45, 159, 111, 0.12)` | Jade accent glow |
| `--shadow-glow-orange-light` | `0 0 32px rgba(232, 98, 62, 0.15)` | CTA button glow |
| `--shadow-glow-indigo-light` | `0 0 32px rgba(88, 101, 242, 0.1)` | Indigo accent glow |

### Dark Mode Shadows
| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs-dark` | `0 1px 2px rgba(0, 0, 0, 0.2)` | Subtle resting |
| `--shadow-sm-dark` | `0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)` | Small card |
| `--shadow-md-dark` | `0 4px 12px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.2)` | Standard card |
| `--shadow-lg-dark` | `0 8px 24px rgba(0, 0, 0, 0.45), 0 4px 8px rgba(0, 0, 0, 0.25)` | Elevated/hover |
| `--shadow-xl-dark` | `0 16px 40px rgba(0, 0, 0, 0.55), 0 8px 16px rgba(0, 0, 0, 0.3)` | Dashboard, hero |
| `--shadow-2xl-dark` | `0 24px 56px rgba(0, 0, 0, 0.65), 0 12px 24px rgba(0, 0, 0, 0.35)` | Maximum |
| `--shadow-inner-dark` | `inset 0 2px 4px rgba(0, 0, 0, 0.3)` | Inset |
| `--shadow-glow-jade-dark` | `0 0 40px rgba(61, 220, 132, 0.2)` | Jade glow |
| `--shadow-glow-orange-dark` | `0 0 40px rgba(255, 107, 66, 0.25)` | CTA glow |
| `--shadow-glow-indigo-dark` | `0 0 40px rgba(124, 138, 255, 0.2)` | Indigo glow |

## 3.5 Animation Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General transitions |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements exiting |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy hover lifts |
| `--ease-smooth` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Smooth general |
| `--duration-instant` | `100ms` | Color changes, opacity |
| `--duration-fast` | `200ms` | Hover state changes |
| `--duration-normal` | `300ms` | Standard transitions |
| `--duration-slow` | `500ms` | Theme mode switch, page elements |
| `--duration-slower` | `700ms` | Scroll entrance animations |
| `--duration-slowest` | `1000ms` | Hero entrance choreography |
| `--stagger-delay` | `80ms` | Delay between siblings in stagger animation |

## 3.6 Z-Index Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--z-base` | `0` | Default |
| `--z-raised` | `1` | Cards above background |
| `--z-floating` | `10` | Floating pills, decorative elements |
| `--z-sticky` | `100` | Sticky nav bar |
| `--z-overlay` | `200` | Mobile nav overlay |
| `--z-modal` | `300` | Modals if any |
| `--z-tooltip` | `400` | Tooltips |
| `--z-toast` | `500` | Notification toasts |
| `--z-max` | `999` | Scroll-to-top button |

---

# 4. ☀️ LIGHT MODE — LIQUID GLASS THEME (COMPLETE COLOR SPECIFICATION)

## Philosophy
The light mode feels like a sunlit room with translucent glass panels floating over a warm cream surface. Think Apple's visionOS design language crossed with Japanese minimalist interiors. Colors are warm, not clinical. White is not #FFFFFF white but a warm off-white. Everything has a slight organic warmth.

## Complete Color Token Table

| Token | Hex / Value | RGB | Usage Description |
|-------|------------|-----|-------------------|
| `--bg-page` | `#FAF9F6` | `250, 249, 246` | Main page background — warm ivory, very subtle yellow undertone |
| `--bg-page-alt` | `#F4F2ED` | `244, 242, 237` | Alternating section backgrounds (every other section) — slightly darker warm |
| `--bg-card` | `#FFFFFF` | `255, 255, 255` | Opaque card background for non-glass cards |
| `--bg-card-glass` | `rgba(255, 255, 255, 0.55)` | — | Primary glassmorphism card background |
| `--bg-card-glass-hover` | `rgba(255, 255, 255, 0.75)` | — | Glass card on hover (becomes more opaque) |
| `--bg-card-glass-heavy` | `rgba(255, 255, 255, 0.82)` | — | Heavier glass for high-importance cards (hero main) |
| `--bg-card-tint-jade` | `#EDF8F2` | `237, 248, 242` | Jade-tinted card background for jade-themed boxes |
| `--bg-card-tint-orange` | `#FFF2ED` | `255, 242, 237` | Orange-tinted card for CTA-related boxes |
| `--bg-card-tint-indigo` | `#EEEFFE` | `238, 239, 254` | Indigo-tinted card for tech/code-related boxes |
| `--bg-nav` | `rgba(250, 249, 246, 0.82)` | — | Sticky nav background with blur |
| `--bg-input` | `#FFFFFF` | — | Input field background |
| `--bg-code-inline` | `rgba(88, 101, 242, 0.06)` | — | Inline code background |
| `--bg-code-block` | `#F6F5F2` | — | Code block background |
| `--border-default` | `rgba(28, 25, 20, 0.06)` | — | Standard card/element border |
| `--border-subtle` | `rgba(28, 25, 20, 0.04)` | — | Very subtle borders, dividers |
| `--border-medium` | `rgba(28, 25, 20, 0.1)` | — | More visible borders for inputs, active states |
| `--border-glass-inner` | `rgba(255, 255, 255, 0.6)` | — | Inner highlight border on glass cards (top/left) |
| `--border-glass-outer` | `rgba(28, 25, 20, 0.05)` | — | Outer subtle shadow border on glass cards |
| `--border-jade` | `rgba(45, 159, 111, 0.2)` | — | Jade accent border |
| `--border-orange` | `rgba(232, 98, 62, 0.2)` | — | Orange accent border |
| `--border-indigo` | `rgba(88, 101, 242, 0.2)` | — | Indigo accent border |
| `--text-heading` | `#1A1917` | `26, 25, 23` | Main headings — deep warm charcoal, almost black but warm |
| `--text-body` | `#44433F` | `68, 67, 63` | Body text — dark warm gray, high readability |
| `--text-secondary` | `#6B6A64` | `107, 106, 100` | Secondary descriptions, sub-text |
| `--text-tertiary` | `#96958E` | `150, 149, 142` | Captions, labels, metadata, timestamps |
| `--text-muted` | `#B8B7B0` | `184, 183, 176` | Placeholder text, disabled states |
| `--text-on-dark` | `#FFFFFF` | — | Text on dark backgrounds (CTA buttons, dark footer) |
| `--text-on-jade` | `#FFFFFF` | — | Text on jade background |
| `--text-on-orange` | `#FFFFFF` | — | Text on orange background |
| `--accent-jade` | `#2D9F6F` | `45, 159, 111` | Primary accent — trust, premium, links, positive signals |
| `--accent-jade-hover` | `#258F60` | `37, 143, 96` | Jade hover/active state |
| `--accent-jade-light` | `#EDF8F2` | `237, 248, 242` | Jade light background tint |
| `--accent-jade-medium` | `rgba(45, 159, 111, 0.15)` | — | Jade medium tint for pill badges |
| `--accent-orange` | `#E8623E` | `232, 98, 62` | CTA accent — warm persimmon orange, eye-catching but not aggressive |
| `--accent-orange-hover` | `#D4532F` | `212, 83, 47` | Orange hover/pressed state |
| `--accent-orange-light` | `#FFF2ED` | `255, 242, 237` | Orange light background tint |
| `--accent-orange-medium` | `rgba(232, 98, 62, 0.15)` | — | Orange medium tint |
| `--accent-indigo` | `#5865F2` | `88, 101, 242` | Secondary accent — technical, modern, code-related |
| `--accent-indigo-hover` | `#4752D6` | `71, 82, 214` | Indigo hover |
| `--accent-indigo-light` | `#EEEFFE` | `238, 239, 254` | Indigo light tint |
| `--accent-indigo-medium` | `rgba(88, 101, 242, 0.12)` | — | Indigo medium tint |
| `--accent-gold` | `#D4A843` | `212, 168, 67` | Star ratings, premium signals |
| `--surface-gradient-page` | `linear-gradient(180deg, #FAF9F6 0%, #F4F2ED 50%, #FAF9F6 100%)` | — | Subtle page-level gradient |
| `--surface-gradient-hero` | `linear-gradient(135deg, rgba(45,159,111,0.03) 0%, transparent 40%, rgba(88,101,242,0.03) 100%)` | — | Very subtle color wash on hero |
| `--surface-gradient-cta` | `linear-gradient(135deg, #F4F2ED 0%, #EDF8F2 40%, #EEEFFE 100%)` | — | CTA section gradient |

## Glassmorphism Specification (Light Mode)

### Standard Glass Card
```
background: rgba(255, 255, 255, 0.55);
backdrop-filter: blur(20px) saturate(1.4);
-webkit-backdrop-filter: blur(20px) saturate(1.4);
border: 1px solid rgba(255, 255, 255, 0.6);
box-shadow: 
  0 4px 12px rgba(28, 25, 20, 0.05),
  0 2px 4px rgba(28, 25, 20, 0.03),
  inset 0 1px 0 rgba(255, 255, 255, 0.5);
```

### Heavy Glass Card (Hero Main)
```
background: rgba(255, 255, 255, 0.78);
backdrop-filter: blur(24px) saturate(1.5);
border: 1px solid rgba(255, 255, 255, 0.7);
box-shadow: 
  0 8px 24px rgba(28, 25, 20, 0.07),
  0 4px 8px rgba(28, 25, 20, 0.04),
  inset 0 1px 0 rgba(255, 255, 255, 0.6);
```

### Light Reflection Pseudo-Element (on glass cards)
```css
.glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(
    180deg, 
    rgba(255, 255, 255, 0.25) 0%, 
    transparent 100%
  );
  border-radius: inherit;
  pointer-events: none;
}
```

### Noise Texture Overlay (Page-level)
```css
body::after {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,..."); /* Tiny noise SVG pattern */
  opacity: 0.025;
  pointer-events: none;
  z-index: 9999;
}
```
The noise adds an ultra-subtle paper grain texture that gives the page a tactile, premium quality. At 2.5% opacity, it's felt more than seen.

---

# 5. 🌙 DARK MODE — DEEP IMMERSIVE THEME (COMPLETE COLOR SPECIFICATION)

## Philosophy
The dark mode is not simply an inversion of light mode. It is a completely different experience — imagine a sleek, high-tech control room with deep blacks, subtle ambient lighting, and luminous accent glows. Think of a premium car dashboard at night or a deep-space observatory interface. Colors are deeper, shadows are more dramatic, and accent colors gain a subtle luminous quality.

## Complete Color Token Table

| Token | Hex / Value | RGB | Usage Description |
|-------|------------|-----|-------------------|
| `--bg-page` | `#0A0C10` | `10, 12, 16` | Main page — very deep blue-black, not pure black |
| `--bg-page-alt` | `#10121A` | `16, 18, 26` | Alternating sections — slightly lighter with more blue |
| `--bg-card` | `#161820` | `22, 24, 32` | Card surfaces — visible against page bg but still very dark |
| `--bg-card-glass` | `rgba(22, 24, 32, 0.65)` | — | Glassmorphism card in dark mode |
| `--bg-card-glass-hover` | `rgba(28, 30, 40, 0.8)` | — | Glass card hover |
| `--bg-card-glass-heavy` | `rgba(22, 24, 32, 0.85)` | — | Heavy glass |
| `--bg-card-elevated` | `#1C1E28` | `28, 30, 40` | Slightly elevated card (nested cards) |
| `--bg-card-tint-jade` | `rgba(61, 220, 132, 0.06)` | — | Dark jade tint |
| `--bg-card-tint-orange` | `rgba(255, 107, 66, 0.06)` | — | Dark orange tint |
| `--bg-card-tint-indigo` | `rgba(124, 138, 255, 0.06)` | — | Dark indigo tint |
| `--bg-nav` | `rgba(10, 12, 16, 0.85)` | — | Sticky nav with blur |
| `--bg-input` | `#12141C` | — | Input background |
| `--bg-code-inline` | `rgba(124, 138, 255, 0.1)` | — | Inline code bg |
| `--bg-code-block` | `#0E1016` | — | Code block bg |
| `--border-default` | `rgba(255, 255, 255, 0.06)` | — | Standard border |
| `--border-subtle` | `rgba(255, 255, 255, 0.04)` | — | Subtle border |
| `--border-medium` | `rgba(255, 255, 255, 0.1)` | — | More visible |
| `--border-glow-jade` | `rgba(61, 220, 132, 0.15)` | — | Jade glow border |
| `--border-glow-orange` | `rgba(255, 107, 66, 0.15)` | — | Orange glow |
| `--border-glow-indigo` | `rgba(124, 138, 255, 0.15)` | — | Indigo glow |
| `--border-gradient-accent` | `linear-gradient(135deg, rgba(124,138,255,0.25), rgba(61,220,132,0.25))` | — | Gradient border for featured cards |
| `--text-heading` | `#EEEEE8` | `238, 238, 232` | Main headings — warm off-white |
| `--text-body` | `#B0B0A8` | `176, 176, 168` | Body — readable gray with warm cast |
| `--text-secondary` | `#888880` | `136, 136, 128` | Secondary text |
| `--text-tertiary` | `#58585A` | `88, 88, 90` | Captions, labels |
| `--text-muted` | `#3A3A40` | `58, 58, 64` | Disabled, placeholder |
| `--text-on-dark` | `#FFFFFF` | — | On accent backgrounds |
| `--accent-jade` | `#3DDC84` | `61, 220, 132` | Brighter mint-jade for dark — more luminous |
| `--accent-jade-hover` | `#50E896` | `80, 232, 150` | Even brighter on hover |
| `--accent-jade-dim` | `rgba(61, 220, 132, 0.08)` | — | Jade background tint |
| `--accent-jade-medium` | `rgba(61, 220, 132, 0.15)` | — | Jade medium tint |
| `--accent-orange` | `#FF6B42` | `255, 107, 66` | Vivid warm orange CTA |
| `--accent-orange-hover` | `#FF5530` | `255, 85, 48` | Brighter hover |
| `--accent-orange-dim` | `rgba(255, 107, 66, 0.08)` | — | Orange bg tint |
| `--accent-orange-medium` | `rgba(255, 107, 66, 0.15)` | — | Orange medium tint |
| `--accent-indigo` | `#7C8AFF` | `124, 138, 255` | Lighter indigo for dark readability |
| `--accent-indigo-hover` | `#929FFF` | `146, 159, 255` | Lighter on hover |
| `--accent-indigo-dim` | `rgba(124, 138, 255, 0.08)` | — | Indigo bg tint |
| `--accent-indigo-medium` | `rgba(124, 138, 255, 0.15)` | — | Indigo medium |
| `--accent-gold` | `#F0C850` | `240, 200, 80` | Star ratings in dark |
| `--surface-ambient-glow` | `radial-gradient(ellipse 800px 600px at 25% -5%, rgba(88,101,242,0.06) 0%, transparent 70%)` | — | Subtle ambient indigo glow at top of page |
| `--surface-ambient-glow-2` | `radial-gradient(ellipse 600px 400px at 75% 40%, rgba(61,220,132,0.04) 0%, transparent 70%)` | — | Secondary jade ambient glow mid-page |
| `--surface-gradient-cta` | `linear-gradient(135deg, #10121A 0%, rgba(61,220,132,0.04) 40%, rgba(124,138,255,0.04) 100%)` | — | CTA section |

## Dark Mode Special Effects

### Ambient Background Glows
```css
body::before {
  content: '';
  position: fixed;
  top: -200px;
  left: -100px;
  width: 900px;
  height: 700px;
  background: radial-gradient(ellipse, rgba(88,101,242,0.06) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}
body::after {
  content: '';
  position: fixed;
  bottom: -100px;
  right: -200px;
  width: 700px;
  height: 500px;
  background: radial-gradient(ellipse, rgba(61,220,132,0.04) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}
```
These are ultra-subtle, large-scale radial gradients fixed to the viewport, giving the page a faint ambient glow as if soft colored lights illuminate the room from the edges.

### Card Glow on Hover (Dark Mode Only)
When a card is hovered in dark mode, in addition to the lift and shadow increase, a very subtle colored glow appears around the card:
```css
.card:hover {
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.45),
    0 0 24px rgba(88, 101, 242, 0.06);
}
```
The glow color can vary: jade-themed cards glow jade, orange-themed glow orange, default glow indigo.

### Featured Card Gradient Border (Dark Mode)
For the featured/highlighted card (like the hero main card or the featured testimonial), use a gradient border:
```css
.featured-card {
  border: 1px solid transparent;
  background: 
    linear-gradient(var(--bg-card), var(--bg-card)) padding-box,
    linear-gradient(135deg, rgba(124,138,255,0.3), rgba(61,220,132,0.3)) border-box;
}
```
This creates a beautiful subtle gradient border that transitions from indigo to jade.

---

# 6. 🔄 SECTION 0 — PRE-LOADER / PAGE LOAD EXPERIENCE

### What Happens When the Page First Loads

**Duration:** Maximum 1.5 seconds, then fade out regardless of load state

**Visual:**
- The entire viewport is filled with the page background color (`--bg-page`)
- In the exact center, the Markups logo mark appears:
  - The `"✨"` sparkle emoji scaled to 48px
  - Below it, `"Markups"` text in 24px, weight 700, `--text-heading` color
- A thin progress line (2px height, 120px width) centered below the text:
  - Background: `--border-default`
  - Fill: `--accent-jade` color, animates from left to right
  - Animation: `width: 0% → 100%` over 1.2 seconds with `ease-in-out`

**Fade-Out Transition:**
- After the progress line completes, or after 1.5 seconds (whichever comes first):
  - The loader container fades out: `opacity: 1 → 0` over `400ms ease`
  - Simultaneously, `transform: scale(1) → scale(1.05)` (zooms slightly)
  - After fade complete, `display: none` is applied
  - The page content beneath begins its entrance choreography

**Light vs Dark:**
- Light: Loader background is `#FAF9F6`, text is `#1A1917`, line fill is `#2D9F6F`
- Dark: Loader background is `#0A0C10`, text is `#EEEEE8`, line fill is `#3DDC84`

---

# 7. 🧭 SECTION 1 — NAVIGATION BAR

## Overall Structure

**Type:** Sticky horizontal navigation bar, always visible at the top of the viewport
**Position:** `position: sticky; top: 0; z-index: var(--z-sticky);`
**Height:** Exactly 68px (with 1px bottom border, total visual height 69px)
**Width:** Full viewport width (edge to edge), content constrained
**Content Max Width:** `var(--grid-max-width)` = 1280px, centered with `margin: 0 auto;`
**Horizontal Padding:** `var(--space-10)` = 32px on each side
**Layout:** CSS Flexbox — `display: flex; justify-content: space-between; align-items: center;`

## Background Treatment

**Light Mode:**
```
background: rgba(250, 249, 246, 0.82);
backdrop-filter: blur(20px) saturate(1.35);
-webkit-backdrop-filter: blur(20px) saturate(1.35);
border-bottom: 1px solid rgba(28, 25, 20, 0.05);
```

**Dark Mode:**
```
background: rgba(10, 12, 16, 0.85);
backdrop-filter: blur(20px) saturate(1.25);
-webkit-backdrop-filter: blur(20px) saturate(1.25);
border-bottom: 1px solid rgba(255, 255, 255, 0.05);
```

**Scroll State Enhancement:** When the user scrolls past 50px from the top, the nav gains slightly more opacity and a stronger shadow:
- Light: background opacity goes from 0.82 → 0.92, adds `--shadow-sm-light`
- Dark: background opacity goes from 0.85 → 0.93, adds `--shadow-sm-dark`
- Transition: `0.3s ease`

## Left Region — Brand

**Logo Container:** `display: flex; align-items: center; gap: 10px;`

**Sparkle Emoji:**
- Character: `"✨"` rendered as native emoji
- Font-size: 24px
- **Idle animation:** Subtle continuous rotation `rotate(0deg) → rotate(10deg) → rotate(0deg)`, duration 4 seconds, `ease-in-out`, infinite. Very slow and subtle, barely noticeable but adds life.
- On hover of entire logo container: rotation speed increases (duration becomes 1.5s)

**Brand Text:**
- Text: `"Markups"`
- Font: `var(--font-display)`, weight 700, size 21px
- Color: `var(--text-heading)`
- Letter-spacing: -0.02em
- Cursor: pointer (links to page top)

**Version Badge (adjacent to brand text, vertically centered):**
- Text: `"v2.0"`
- Background: `var(--accent-indigo-light)` (Light) / `var(--accent-indigo-dim)` (Dark)
- Color: `var(--accent-indigo)` (Light) / `var(--accent-indigo)` (Dark)
- Font: `var(--text-tiny)` = 11px, weight 700
- Padding: 3px 8px
- Radius: `var(--radius-full)` = 999px
- Vertical-align: middle, offset 2px up from brand text baseline with `position: relative; top: -2px;`

**Entire logo hover:** `opacity: 0.85` on hover, returns to 1 on mouse out. Transition: `0.2s ease`.

## Center Region — Navigation Links (Desktop Only)

**Visible on:** `min-width: 1024px` (tablet-landscape and above)
**Hidden on:** Below 1024px (replaced by hamburger menu)

**Container:** `display: flex; align-items: center; gap: 36px;`

**Links (in order):**
1. `"Features"`
2. `"Preview"`
3. `"How It Works"`
4. `"Export"`
5. `"Testimonials"`

**Link Style:**
- Font: `var(--text-nav)` = 14px, weight 500
- Text-transform: none (sentence case)
- Letter-spacing: 0.01em
- Color: `var(--text-tertiary)` (default state)
- Text-decoration: none
- Cursor: pointer
- Position: relative (for underline pseudo-element)
- Padding: 8px 0 (for larger click target)
- Transition: `color var(--duration-fast) var(--ease-default)`

**Link Hover State:**
- Color transitions to `var(--text-heading)`
- The underline pseudo-element becomes visible:
  ```css
  .nav-link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: var(--accent-jade);
    border-radius: 1px;
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .nav-link:hover::after {
    transform: scaleX(1);
  }
  ```
  The underline slides in from the left with a spring easing, giving it a snappy, satisfying feel.

**Link Active State (when section is in view):**
- Color: `var(--text-heading)`
- Underline is persistently visible (`scaleX(1)`)
- Background: very subtle `var(--accent-jade-light)` / `var(--accent-jade-dim)` with `padding: 6px 12px; border-radius: 8px;`

## Right Region — Action Buttons

**Container:** `display: flex; align-items: center; gap: 12px;`

### Theme Toggle Button

**Shape:** Circle, 40px × 40px
**Border-radius:** 999px
**Background:**
- Light: `var(--bg-card)` with `border: 1px solid var(--border-default)`
- Dark: `var(--bg-card)` with `border: 1px solid var(--border-default)`
**Display:** `flex; align-items: center; justify-content: center;`
**Cursor:** pointer

**Icons:**
- Light mode shows: Moon icon (🌙 emoji at 18px, or a custom SVG moon outline, stroke-width 1.5px, stroke `var(--text-secondary)`)
- Dark mode shows: Sun icon (☀️ emoji at 18px, or SVG sun with rays, stroke-width 1.5px, stroke `var(--text-secondary)`)

**Click Animation:**
1. The current icon rotates out: `transform: rotate(0deg) → rotate(90deg)` + `opacity: 1 → 0`, duration 200ms
2. Simultaneously, the button background does a quick flash: scales to 0.95 then back to 1 (100ms)
3. New icon rotates in: `transform: rotate(-90deg) → rotate(0deg)` + `opacity: 0 → 1`, duration 200ms
4. Total perceived transition: ~350ms

**Hover State:**
- Light: background becomes `var(--accent-jade-light)`, border becomes `var(--border-jade)`
- Dark: background becomes `var(--accent-jade-dim)`, border becomes `var(--border-glow-jade)`
- Transition: `var(--duration-fast) var(--ease-default)`

### GitHub Star Button

**Shape:** Pill/capsule
**Display:** `inline-flex; align-items: center; gap: 6px;`
**Padding:** 8px 16px
**Border-radius:** `var(--radius-full)` = 999px
**Background:**
- Light: `var(--bg-card)` with `border: 1px solid var(--border-default)`
- Dark: `var(--bg-card)` with `border: 1px solid var(--border-default)`

**Content:**
- Star icon: `"⭐"` emoji at 14px, or SVG star outline at 14px
- Text: `"Star on GitHub"` — `var(--text-caption)` = 13px, weight 600, color `var(--text-secondary)`
- Optional: Live star count `" · 2"` appended in `var(--text-tertiary)` color

**Hover State:**
- Background: `var(--accent-jade-light)` / `var(--accent-jade-dim)`
- Border: `var(--border-jade)` / `var(--border-glow-jade)`
- Text color: `var(--accent-jade)` / `var(--accent-jade)`
- Star icon: gets a quick `scale(1.15)` bounce (spring easing, 300ms)

**Link:** `https://github.com/Nir-Bhay/markups`
**Target:** `_blank` with `rel="noopener noreferrer"`

### Primary CTA Button (Desktop Only)

**Visible on:** `min-width: 1024px`
**Shape:** Rounded rectangle
**Text:** `"Try Editor →"`
**Font:** `var(--text-button-sm)` = 14px, weight 600
**Color:** `var(--text-on-dark)` = white
**Background:** `var(--accent-orange)`
**Padding:** 10px 22px
**Border-radius:** `var(--radius-md)` = 12px
**Border:** none
**Shadow:** `0 2px 8px rgba(232, 98, 62, 0.2)` (Light) / `0 2px 8px rgba(255, 107, 66, 0.3)` (Dark)

**Hover:**
- Background: `var(--accent-orange-hover)`
- Transform: `translateY(-1px)`
- Shadow: increases to `0 4px 16px rgba(232, 98, 62, 0.3)` / `0 4px 16px rgba(255, 107, 66, 0.4)`
- The `→` arrow moves 3px to the right: `margin-left` transitions from 0 to 3px

**Active/Press:**
- Transform: `translateY(0px)` (pressed down)
- Shadow: decreases to `0 1px 4px ...`

**Link:** `https://markups.vercel.app`

## Mobile Navigation (< 1024px)

### Hamburger Button (replaces center links + primary CTA)
**Position:** Right side, replaces CTA button
**Size:** 44px × 44px (minimum touch target)
**Display:** Three horizontal lines:
  - Each line: 22px wide, 2px height, `var(--text-secondary)` color
  - Gap between lines: 5px
  - Centered within the 44px container
  - `border-radius: 1px` on each line

**Animation to X on open:**
1. Top line: rotates 45° and translates down to center position
2. Middle line: `opacity: 0` and `scaleX: 0`
3. Bottom line: rotates -45° and translates up to center position
4. Duration: 300ms, easing: `var(--ease-default)`

### Mobile Menu Panel

**Appearance:** Slides down from below the nav bar
**Animation:**
- `max-height: 0; opacity: 0; overflow: hidden;` → `max-height: 400px; opacity: 1;`
- Duration: 400ms, easing: `var(--ease-out)`

**Background:**
- Light: `rgba(250, 249, 246, 0.96)` with `backdrop-filter: blur(24px)`
- Dark: `rgba(10, 12, 16, 0.96)` with `backdrop-filter: blur(24px)`

**Layout:** Vertical stack, padding 24px 32px

**Links:**
- Same 5 links as desktop, stacked vertically
- Each link: 48px height (large touch target), `display: flex; align-items: center;`
- Font: 16px, weight 500
- Color: `var(--text-body)`
- Border-bottom: `1px solid var(--border-subtle)` between each
- On tap: jade background highlight flash (200ms)

**Mobile CTA (at bottom of panel):**
- Full-width `"Try Editor →"` button, `var(--accent-orange)` background
- Padding: 14px, radius: 12px
- Margin-top: 16px

**Overlay:** A semi-transparent backdrop behind/below the panel:
- `background: rgba(0, 0, 0, 0.2)` (Light) / `rgba(0, 0, 0, 0.5)` (Dark)
- Clicking it closes the menu
- Fade in: 300ms

---

# 8. 🦸 SECTION 2 — HERO SECTION (Bento Grid Layout)

## The Most Important Section — First Impression

### Container
- **Width:** Full viewport width
- **Content Max Width:** `var(--grid-max-width)` = 1280px, centered
- **Padding:** `96px 32px 80px` (top accounts for sticky nav overlap + breathing room)
- **Background:** `var(--bg-page)` with `var(--surface-gradient-hero)` overlay — an extremely subtle, nearly invisible gradient wash with hints of jade and indigo at the far corners, adding depth without being perceptible as a distinct gradient
- **Min-height:** `calc(100vh - 68px)` on desktop, auto on mobile (content determines height)

### Background Decoration (Behind the Grid)
- **Light Mode:** A large (600px × 600px) radial gradient centered at approximately 30% from left, 40% from top: `radial-gradient(circle, rgba(45,159,111,0.04) 0%, transparent 70%)`. Another smaller one (400px) at 70% left, 20% top: `radial-gradient(circle, rgba(88,101,242,0.03) 0%, transparent 70%)`. These create barely-visible warm color pools behind the bento grid, giving the section dimensional depth.
- **Dark Mode:** Similar but using `rgba(61,220,132,0.03)` and `rgba(124,138,255,0.04)`. These glow more noticeably against the dark background, creating a moody ambient light effect.

### Bento Grid Configuration

```
display: grid;
grid-template-columns: repeat(12, 1fr);
grid-template-rows: auto auto auto;
gap: var(--grid-gap); /* 20px */
```

**Grid Map (Desktop 1024px+):**
```
Row 1:  [A──────────────────A] [B──────B] [C────C]
        col 1─────────────7    col 8──10   col 11─12
        
Row 2:  [A──────────────────A] [D──────────────────D]
        col 1─────────────7    col 8──────────────12
        
Row 3:  [E──────────E] [F──F] [G──────────────────G]
        col 1──────5    6──7   col 8──────────────12
```

### BOX A — Hero Main Content Card
**Grid Position:** `grid-column: 1 / 8; grid-row: 1 / 3;
# 🏯 MARKUPS — LANDING PAGE DESIGN SPECIFICATION (CONTINUED)

---

### BOX A — Hero Main Content Card (Continued)

**Grid Position:** `grid-column: 1 / 8; grid-row: 1 / 3;`
**This card spans 7 of 12 columns and 2 rows — it is the single largest and most dominant element in the entire hero grid, commanding immediate visual attention.**

**Card Dimensions:**
- Approximate width: ~58% of grid container
- Approximate height: determined by content, minimum ~420px on desktop
- The card naturally stretches to fill both grid rows

**Card Surface Treatment:**

Light Mode:
```
background: rgba(255, 255, 255, 0.78);
backdrop-filter: blur(24px) saturate(1.5);
-webkit-backdrop-filter: blur(24px) saturate(1.5);
border: 1px solid rgba(255, 255, 255, 0.7);
box-shadow: 
  0 8px 24px rgba(28, 25, 20, 0.07),
  0 4px 8px rgba(28, 25, 20, 0.04),
  inset 0 1px 0 rgba(255, 255, 255, 0.6);
border-radius: var(--radius-2xl); /* 24px */
```

Dark Mode:
```
background: var(--bg-card); /* #161820 */
border: 1px solid transparent;
background-clip: padding-box;
/* Gradient border technique: */
background: 
  linear-gradient(var(--bg-card), var(--bg-card)) padding-box,
  linear-gradient(135deg, rgba(124,138,255,0.2), rgba(61,220,132,0.15)) border-box;
box-shadow: 
  0 8px 24px rgba(0, 0, 0, 0.45),
  0 0 30px rgba(88, 101, 242, 0.05);
border-radius: var(--radius-2xl); /* 24px */
```

**Internal Padding:** `48px` on all sides (desktop), `32px` on tablet, `24px` on mobile

**Content Layout Inside Card A (top to bottom):**

---

**Element A1 — Eyebrow Pill Badge**

Position: Top-left of the card content area, first element
Display: `inline-flex; align-items: center; gap: 6px;`

Text content: `"✨ FREE & OPEN SOURCE"`

Breakdown:
- The `"✨"` sparkle emoji at the same size as the text
- `"FREE & OPEN SOURCE"` in uppercase

Styling:
- Font: `var(--text-label)` = 12px, weight 700, letter-spacing 0.1em
- Text-transform: uppercase
- Color: `var(--accent-jade)` (both modes)
- Background: `var(--accent-jade-light)` (#EDF8F2) in Light / `var(--accent-jade-dim)` (rgba(61,220,132,0.08)) in Dark
- Padding: 6px 14px
- Border-radius: `var(--radius-full)` = 999px (full pill shape)
- Border: `1px solid var(--accent-jade-medium)` — adds definition
- The sparkle emoji has a subtle infinite pulse animation: `scale(1) → scale(1.15) → scale(1)`, duration 2.5s, `ease-in-out`, infinite. This creates a tiny "breathing" twinkle effect.

Margin-bottom from eyebrow to headline: `24px`

---

**Element A2 — Main Headline**

The most important text on the entire page. Every word must be perfectly chosen, perfectly sized, and perfectly spaced.

Text content (3 lines):
```
Line 1: "Write Markdown."
Line 2: "See It Beautiful."
Line 3: "Instantly."
```

Each line is rendered as a separate block-level element (using `<span>` with `display: block` or `<br>` tags) to ensure precise line control.

Typography:
- Font: `var(--font-display)`, weight 800 (ExtraBold)
- Size: `var(--text-hero)` = 72px desktop, 56px tablet, 38px mobile
- Line-height: 1.05 — very tight, because each line is a standalone phrase
- Letter-spacing: -0.035em — tight tracking for large display text
- Color: `var(--text-heading)` = #1A1917 (Light) / #EEEEE8 (Dark)

**Word-level highlights:**

The word `"Beautiful"` on Line 2 receives special treatment:
- Color: `var(--accent-jade)` — stands out as the key emotional word
- Background: `var(--accent-jade-light)` (Light) / `var(--accent-jade-dim)` (Dark)
- Padding: 2px 10px 4px 10px (slightly more bottom for visual centering under the text)
- Border-radius: 8px
- This creates a "highlighter marker" effect, as if someone carefully highlighted this word with a green marker
- `display: inline; box-decoration-break: clone;` to ensure padding works inline

The word `"Instantly."` on Line 3 has a special animated underline:
- A pseudo-element (`::after`) positioned below the word:
  ```
  position: absolute;
  bottom: 4px;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--accent-orange);
  border-radius: 2px;
  ```
- Animation on page load (after hero entrance choreography): 
  ```
  @keyframes underline-draw {
    0% { transform: scaleX(0); transform-origin: left; }
    100% { transform: scaleX(1); transform-origin: left; }
  }
  animation: underline-draw 0.8s ease-out 1.2s both;
  ```
  The underline draws in from left to right 1.2 seconds after page load, creating a satisfying reveal moment.

---

**Element A3 — Sub-headline / Description Paragraph**

Position: Below the headline
Margin-top: `20px`

Text content: `"The most powerful free markdown editor with Monaco Editor (VS Code's engine), live preview, Mermaid diagrams, KaTeX math, and export to PDF/HTML — all in your browser. No sign-up needed."`

Typography:
- Font: `var(--font-body)`, weight 400
- Size: `var(--text-body-lg)` = 18px desktop, 17px tablet, 16px mobile
- Line-height: 1.7
- Color: `var(--text-body)` = #44433F (Light) / #B0B0A8 (Dark)
- Max-width: 560px (prevents the line from stretching too wide in the large card)

Special inline formatting:
- `"Monaco Editor"` — slightly bolder (weight 500) with `var(--accent-indigo)` color, indicating it's a notable technology
- `"VS Code's engine"` — inside parentheses, same indigo color, confirming the value
- `"No sign-up needed."` — the final sentence is weight 500, slightly bolder, to emphasize the zero-friction aspect

---

**Element A4 — CTA Buttons Group**

Position: Below sub-headline
Margin-top: `32px`
Layout: `display: flex; flex-direction: row; align-items: center; gap: 16px;`
On mobile: `flex-direction: column; gap: 12px;` — buttons stack full-width

**Primary CTA Button:**

Text: `"Start Writing — It's Free"`
Icon: Small pencil icon `"✏️"` (emoji) or SVG edit icon (16px), positioned before the text with 8px gap

Full styling specification:
```
display: inline-flex;
align-items: center;
gap: 8px;
font-family: var(--font-body);
font-size: var(--text-button); /* 16px */
font-weight: 600;
letter-spacing: 0.02em;
color: #FFFFFF;
background: var(--accent-orange); /* #E8623E light / #FF6B42 dark */
padding: 16px 32px;
border-radius: var(--radius-md); /* 14px — note, slightly larger than standard 12px for hero CTA prominence */
border: none;
cursor: pointer;
text-decoration: none;
position: relative;
overflow: hidden;
transition: 
  background var(--duration-fast) var(--ease-default),
  transform var(--duration-fast) var(--ease-spring),
  box-shadow var(--duration-fast) var(--ease-default);
```

Shadow:
- Light resting: `0 4px 16px rgba(232, 98, 62, 0.25), 0 2px 4px rgba(232, 98, 62, 0.15)`
- Dark resting: `0 4px 16px rgba(255, 107, 66, 0.3), 0 0 24px rgba(255, 107, 66, 0.15)`

Hover state:
```
background: var(--accent-orange-hover); /* #D4532F light / #FF5530 dark */
transform: translateY(-2px);
box-shadow: 
  0 8px 24px rgba(232, 98, 62, 0.35), 
  0 4px 8px rgba(232, 98, 62, 0.2);
/* Dark: even stronger glow */
```

Pencil icon micro-interaction on hover:
```css
.cta-primary:hover .icon-pencil {
  animation: pencil-wiggle 0.4s ease;
}
@keyframes pencil-wiggle {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-8deg); }
  50% { transform: rotate(8deg); }
  75% { transform: rotate(-4deg); }
  100% { transform: rotate(0deg); }
}
```
This gives a playful "getting ready to write" wiggle to the pencil icon.

Shimmer effect (optional premium touch):
A subtle light sweep that passes across the button surface on hover:
```css
.cta-primary::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(
    90deg, 
    transparent, 
    rgba(255,255,255,0.15), 
    transparent
  );
  transition: left 0.5s ease;
}
.cta-primary:hover::after {
  left: 120%;
}
```
This creates a premium "light passing over the surface" effect.

Active/pressed state:
```
transform: translateY(0px) scale(0.98);
box-shadow: 0 2px 8px rgba(232, 98, 62, 0.2);
```

Focus-visible state (for keyboard navigation):
```
outline: 3px solid var(--accent-jade);
outline-offset: 3px;
```

Link: `https://markups.vercel.app`

**Secondary CTA Button:**

Text: `"View on GitHub"`
Icon: GitHub logo SVG (16px × 16px), either the octocat mark or the simple GitHub logo, stroke `currentColor`, positioned before text with 8px gap

Full styling:
```
display: inline-flex;
align-items: center;
gap: 8px;
font-family: var(--font-body);
font-size: var(--text-button); /* 16px */
font-weight: 600;
letter-spacing: 0.02em;
color: var(--text-body); /* #44433F light / #B0B0A8 dark */
background: transparent;
padding: 15px 28px; /* 1px less than primary to account for border */
border-radius: var(--radius-md); /* 12px */
border: 1.5px solid var(--border-medium); /* rgba(28,25,20,0.1) light / rgba(255,255,255,0.1) dark */
cursor: pointer;
text-decoration: none;
transition: 
  background var(--duration-fast) var(--ease-default),
  border-color var(--duration-fast) var(--ease-default),
  color var(--duration-fast) var(--ease-default),
  transform var(--duration-fast) var(--ease-spring);
```

Hover state:
```
background: var(--bg-card); /* #FFFFFF light / #161820 dark */
border-color: var(--border-jade); /* jade-tinted border */
color: var(--text-heading);
transform: translateY(-1px);
box-shadow: var(--shadow-sm-light) or var(--shadow-sm-dark);
```

Active state: `transform: translateY(0px); background slightly darker;`

Link: `https://github.com/Nir-Bhay/markups`
Target: `_blank` with `rel="noopener noreferrer"`

On mobile (< 768px):
```
Both buttons: width: 100%; justify-content: center; text-align: center;
```

---

**Element A5 — Trust Micro-Text Line**

Position: Below CTA buttons
Margin-top: `20px`

Text content: `"⚡ No sign-up  ·  🔒 Privacy-first  ·  💻 Works offline"`

Display: `inline-flex; align-items: center; gap: 6px; flex-wrap: wrap;`

Styling:
- Font: `var(--text-caption)` = 13px, weight 500
- Color: `var(--text-tertiary)`
- The emoji icons (⚡, 🔒, 💻) are displayed at native size (matches text line height)
- The `"·"` separators are in `var(--text-muted)` color for visual quietness
- Each phrase can be wrapped in a `<span>` for individual styling control
- On mobile: this line may wrap to two lines, which is acceptable

---

### BOX B — Stat Box 1 (Features Count)

**Grid Position:** `grid-column: 8 / 11; grid-row: 1 / 2;`
**Spans:** 3 columns wide, 1 row tall

**Card Surface:**
Light Mode:
```
background: var(--bg-card-glass); /* rgba(255,255,255,0.55) */
backdrop-filter: blur(20px) saturate(1.4);
border: 1px solid rgba(255,255,255,0.6);
box-shadow: var(--shadow-md-light);
border-radius: var(--radius-xl); /* 20px */
```

Dark Mode:
```
background: var(--bg-card);
border: 1px solid var(--border-default);
border-bottom: 3px solid var(--accent-jade); /* Jade accent bottom border */
box-shadow: var(--shadow-md-dark);
border-radius: var(--radius-xl);
```

**Padding:** `28px`

**Layout:** Flex column, left-aligned content

**Content Elements:**

Decorative icon (top-right corner):
- Icon: 📦 (package emoji) or a custom SVG box/cube icon
- Size: 28px
- Position: absolute, top: 20px, right: 20px
- Opacity: 0.35 — very subtle, decorative only
- On card hover: opacity increases to 0.6 and rotates 15° (transition 0.3s)

Stat number:
- Text: `"20+"`
- Font: `var(--font-display)`, weight 900
- Size: `var(--text-stat-number)` = 48px desktop, 40px tablet, 32px mobile
- Color: `var(--accent-jade)`
- Line-height: 1
- Margin-bottom: 6px

Stat label:
- Text: `"Features Packed"`
- Font: `var(--font-body)`, weight 500
- Size: `var(--text-body-sm)` = 14px
- Color: `var(--text-secondary)`
- Line-height: 1.3

**Hover Animation:**
- Card: `transform: translateY(-4px)` with `var(--ease-spring)` easing
- Shadow increases to `var(--shadow-lg-light)` / `var(--shadow-lg-dark)`
- In dark mode: subtle jade glow appears: `box-shadow: ... , 0 0 20px rgba(61,220,132,0.08)`
- The number `"20+"` does a quick count-up animation on first scroll-into-view:
  - Starts at `"0"`, counts up to `"20+"` over 1.2 seconds
  - Uses `requestAnimationFrame` with easing
  - Only triggers once (tracked via IntersectionObserver + flag)

---

### BOX C — Stat Box 2 (Export Formats)

**Grid Position:** `grid-column: 11 / 13; grid-row: 1 / 2;`
**Spans:** 2 columns wide, 1 row tall

**Card Surface:**
Light Mode:
```
background: var(--bg-card-tint-orange); /* #FFF2ED */
border: 1px solid var(--border-orange); /* rgba(232,98,62,0.2) */
box-shadow: var(--shadow-sm-light);
border-radius: var(--radius-xl); /* 20px */
```

Dark Mode:
```
background: var(--bg-card-tint-orange); /* rgba(255,107,66,0.06) */
border: 1px solid var(--border-glow-orange); /* rgba(255,107,66,0.15) */
box-shadow: var(--shadow-sm-dark), 0 0 20px rgba(255,107,66,0.05);
border-radius: var(--radius-xl);
```

**Padding:** `24px`

**Content Elements:**

Stat number:
- Text: `"4"`
- Font: weight 900, 48px
- Color: `var(--accent-orange)`
- Margin-bottom: 6px

Stat label:
- Text: `"Export Formats"`
- Font: weight 500, 14px
- Color: `var(--text-secondary)`

Format list (below label):
- Text: `"PDF · HTML · MD · Copy"`
- Font: `var(--text-tiny)` = 11px, weight 600
- Color: `var(--text-tertiary)`
- Margin-top: 10px
- Each format separated by ` · ` in even lighter color
- Optional: Each format word is in a micro-pill with very subtle orange tint background

**Hover:** Same lift + shadow pattern as Box B, with orange glow in dark mode

---

### BOX D — Benefit Features Row

**Grid Position:** `grid-column: 8 / 13; grid-row: 2 / 3;`
**Spans:** 5 columns wide, 1 row tall

**Card Surface:** Standard glass card (Light) / Standard card (Dark)
**Border-radius:** `var(--radius-xl)` = 20px
**Padding:** `24px`

**Layout:** `display: flex; flex-direction: row; gap: 16px; align-items: flex-start;`
Three mini-feature items displayed horizontally within the card.

**Each Benefit Item Structure:**

Container:
- `flex: 1;` (equal width distribution)
- `display: flex; flex-direction: column; align-items: center; text-align: center;`
- Padding: `12px 8px`
- Border-radius: `var(--radius-lg)` = 16px
- On hover of individual item: background becomes very subtly tinted

Icon Circle:
- Size: 48px × 48px
- Border-radius: `var(--radius-full)` = 999px (circle)
- `display: flex; align-items: center; justify-content: center;`
- Icon/emoji size: 22px

Item Title:
- Font: `var(--text-caption)` = 13px, weight 700
- Color: `var(--text-heading)`
- Margin-top: 10px

Item Description:
- Font: 12px, weight 400
- Color: `var(--text-tertiary)`
- Margin-top: 4px
- Single line or max two lines

**The Three Items:**

| Item | Icon | Circle Background | Circle Icon Color | Title | Description |
|------|------|-------------------|-------------------|-------|-------------|
| 1 | ⚡ (or lightning SVG) | `var(--accent-jade-light)` / `var(--accent-jade-dim)` | `var(--accent-jade)` | `"Lightning Fast"` | `"No lag, ever"` |
| 2 | 🎨 (or palette SVG) | `var(--accent-indigo-light)` / `var(--accent-indigo-dim)` | `var(--accent-indigo)` | `"8+ Themes"` | `"Match your vibe"` |
| 3 | 📱 (or mobile SVG) | `var(--accent-orange-light)` / `var(--accent-orange-dim)` | `var(--accent-orange)` | `"Install as App"` | `"Works offline"` |

**On card hover:** Each icon circle does a subtle `scale(1.08)` and the shadow grows slightly. Stagger: 50ms delay between each (left to right).

---

### BOX E — Teaser Image / Editor Screenshot

**Grid Position:** `grid-column: 1 / 6; grid-row: 3 / 4;`
**Spans:** 5 columns wide, 1 row tall

**Purpose:** This box contains a cropped, beautifully composed screenshot or illustration of the Markups editor showing the split-view experience. It is a visual "proof" element that immediately demonstrates what the product looks like.

**Card Surface:**
```
border-radius: var(--radius-xl); /* 20px */
overflow: hidden; /* Critical — clips the image to rounded corners */
box-shadow: var(--shadow-lg-light) / var(--shadow-lg-dark);
position: relative;
```

**Image Specifications:**
- Source: A high-quality screenshot (PNG or WebP, 2x resolution for retina) of the Markups editor showing:
  - Left pane: Monaco editor with markdown code visible (headings, bullet lists, a code block)
  - Right pane: Beautiful rendered preview with styled headings, formatted lists, and possibly a small Mermaid diagram
  - Status bar visible at bottom with word count
  - A pleasant theme active (VS Dark or Dracula for dark mode version, VS Light for light mode version)
- Display: `width: 100%; height: 100%; object-fit: cover;`
- Minimum height: 200px (prevent collapse on empty load)
- `loading="lazy"` attribute for performance
- `alt="Markups editor showing split view with markdown code on the left and beautiful rendered preview on the right"`

**Image Overlay Effects:**
```css
.teaser-image::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(
    to top,
    rgba(250, 249, 246, 0.3) 0%,  /* Light mode */
    transparent 100%
  );
  /* Dark mode: rgba(10, 12, 16, 0.4) */
  pointer-events: none;
}
```
This creates a subtle fade at the bottom of the image, softening its edge and integrating it with the page.

**Hover Effect:**
- Image: `transform: scale(1.03)` over 500ms with `ease-out` — gentle zoom-in feel
- Shadow increases from `shadow-lg` to `shadow-xl`
- The gradient overlay becomes slightly more transparent (image becomes clearer)

**Light vs Dark Image:**
- Ideally, serve TWO different screenshots: one of the editor in a light theme (for light mode) and one in a dark theme (for dark mode). Swap them based on the active page theme.
- If only one image is possible, use the dark theme screenshot (it looks more impressive/techy) and rely on the overlay to integrate it.

---

### BOX F — Tech Stack Badge Box

**Grid Position:** `grid-column: 6 / 8; grid-row: 3 / 4;`
**Spans:** 2 columns wide, 1 row tall

**Card Surface:**
Light Mode:
```
background: var(--bg-card-tint-indigo); /* #EEEFFE */
border: 1px solid var(--border-indigo); /* rgba(88,101,242,0.2) */
border-radius: var(--radius-xl);
box-shadow: var(--shadow-sm-light);
```

Dark Mode:
```
background: var(--bg-card-tint-indigo); /* rgba(124,138,255,0.06) */
border: 1px solid var(--border-glow-indigo);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-sm-dark);
```

**Padding:** `24px`

**Layout:** `display: flex; flex-direction: column; gap: 10px;`

**Header:**
- Text: `"Built With"`
- Font: `var(--text-label)` = 12px, weight 700, uppercase, letter-spacing 0.08em
- Color: `var(--accent-indigo)`
- Margin-bottom: 4px

**Tech Stack Pills (vertical list):**

Each pill:
```
display: inline-flex;
align-items: center;
gap: 6px;
padding: 7px 14px;
background: var(--bg-card); /* white light / #161820 dark */
border: 1px solid var(--border-subtle);
border-radius: var(--radius-full); /* 999px pill */
font-size: var(--text-caption); /* 13px */
font-weight: 600;
color: var(--text-body);
width: fit-content;
transition: transform 0.2s ease, box-shadow 0.2s ease;
```

On individual pill hover:
```
transform: translateX(4px); /* slides slightly right */
box-shadow: var(--shadow-sm-light);
border-color: var(--accent-indigo-medium);
```

**Pills Content:**
| Emoji/Icon | Text |
|-----------|------|
| ⚡ | `"Vite"` |
| 💎 | `"Monaco"` |
| 📝 | `"Marked"` |
| 🔄 | `"Mermaid"` |
| ∑ | `"KaTeX"` |

The `"∑"` for KaTeX is rendered in `var(--font-mono)` at the same size.

---

### BOX G — Trust Signal / Social Proof Compact

**Grid Position:** `grid-column: 8 / 13; grid-row: 3 / 4;`
**Spans:** 5 columns wide, 1 row tall

**Card Surface:** Standard glass card (Light) / Standard card (Dark)
**Border-radius:** `var(--radius-xl)` = 20px
**Padding:** `28px`

**Layout:** `display: flex; flex-direction: column; gap: 16px;`

**Top Row — Avatar Stack + Text:**
Layout: `display: flex; align-items: center; gap: 14px;`

Avatar stack:
- 5 circular avatars, each 38px × 38px
- `border-radius: var(--radius-full)` (circle)
- `border: 2.5px solid var(--bg-page)` (creates a white/dark ring, making overlapping avatars visually distinct)
- Positioned with `margin-left: -10px` on each (except first), creating a horizontal overlap stack
- Avatars use generic developer avatars or GitHub-style default colored octicons
- Light mode border: white ring around each
- Dark mode border: `var(--bg-page)` (#0A0C10) ring

Text next to avatars:
- Text: `"Loved by 2K+ developers worldwide"`
- Font: 15px, weight 600
- Color: `var(--text-heading)`

**Bottom Row — Badge Pills:**
Layout: `display: flex; flex-wrap: wrap; gap: 8px;`

Three pill badges:
| Badge Text | Background | Text Color | Icon |
|-----------|-----------|-----------|------|
| `"⭐ GitHub Stars"` | `var(--accent-jade-light)` / `var(--accent-jade-dim)` | `var(--accent-jade)` | ⭐ |
| `"MIT Licensed"` | `var(--accent-indigo-light)` / `var(--accent-indigo-dim)` | `var(--accent-indigo)` | 📄 |
| `"100% Free"` | `var(--accent-orange-light)` / `var(--accent-orange-dim)` | `var(--accent-orange)` | 💰 |

Each badge:
```
display: inline-flex;
align-items: center;
gap: 4px;
padding: 5px 12px;
border-radius: var(--radius-full);
font-size: var(--text-tiny); /* 11px */
font-weight: 600;
```

**Card Hover:** Standard lift + shadow increase

---

### Hero Section Entrance Choreography

When the page loads and the pre-loader fades away, the hero section elements animate in with a carefully timed sequence. Each element starts from `opacity: 0; transform: translateY(16px)` and transitions to `opacity: 1; transform: translateY(0)`.

| Element | Delay from Page Ready | Duration |
|---------|----------------------|----------|
| Box A — Eyebrow pill | 0ms | 600ms |
| Box A — Headline line 1 | 100ms | 600ms |
| Box A — Headline line 2 | 200ms | 600ms |
| Box A — Headline line 3 | 300ms | 600ms |
| Box A — "Beautiful" highlight | 450ms | 400ms (background fills in) |
| Box A — "Instantly" underline | 700ms | 800ms (draws from left) |
| Box A — Sub-headline | 500ms | 600ms |
| Box A — Primary CTA | 650ms | 500ms |
| Box A — Secondary CTA | 750ms | 500ms |
| Box A — Trust text | 850ms | 400ms |
| Box B — Stat Box 1 | 400ms | 500ms |
| Box C — Stat Box 2 | 500ms | 500ms |
| Box D — Benefits Row | 600ms | 500ms |
| Box E — Teaser Image | 700ms | 600ms |
| Box F — Tech Stack | 800ms | 500ms |
| Box G — Trust Signal | 900ms | 500ms |

Easing for all: `cubic-bezier(0, 0, 0.2, 1)` (ease-out) — elements decelerate as they arrive, feeling natural.

The stat numbers (20+, 4) begin their count-up animation at their respective delays + 200ms.

---

### Hero Section — Mobile Responsive Layout

**Tablet (768px — 1023px):**
```
Grid changes to:
grid-template-columns: repeat(6, 1fr);

Box A: grid-column: 1 / 7 (full width), grid-row: 1
Box B: grid-column: 1 / 4, grid-row: 2
Box C: grid-column: 4 / 7, grid-row: 2
Box D: grid-column: 1 / 7, grid-row: 3
Box E: grid-column: 1 / 7, grid-row: 4
Box F: grid-column: 1 / 3, grid-row: 5
Box G: grid-column: 3 / 7, grid-row: 5
```
- H1 reduces to 56px
- Card padding reduces to 32px
- Gap remains 20px

**Mobile (< 768px):**
```
Grid changes to:
grid-template-columns: 1fr;
All boxes: grid-column: 1 / -1; each gets its own row
```
Order: A → B → C (side by side in 2-col sub-grid) → D → E → G → F

Wait, let me be more specific:

```
The grid becomes a single column stack EXCEPT:
- B and C remain side by side in a 2-column sub-grid within their container:
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
```

- H1 reduces to 38px
- Card padding reduces to 24px
- CTAs become full-width stacked buttons
- Gap reduces to 16px
- Trust text wraps naturally
- Teaser image gets a fixed height of 200px with `object-fit: cover`

---

# 9. 🎪 SECTION 3 — MARQUEE / INFINITE SCROLL TRUST BAR

## Purpose

A thin, horizontally auto-scrolling strip that sits between the hero and the dashboard preview. It shows technology names, trust phrases, and feature highlights in a continuously moving ribbon — creating a sense of dynamism and credibility. Think of the scrolling ticker at the bottom of news channels, but premium and subtle.

## Container

**Position:** Immediately after the Hero section, no gap (seamlessly connected)
**Width:** Full viewport width (edge to edge, breaks out of the 1280px max-width)
**Height:** 56px
**Overflow:** `overflow: hidden` — content extends beyond viewport and is clipped
**Background:**
- Light: `var(--bg-page-alt)` (#F4F2ED) — slightly different from hero bg to create subtle section delineation
- Dark: `var(--bg-page-alt)` (#10121A)
- Top border: `1px solid var(--border-subtle)`
- Bottom border: `1px solid var(--border-subtle)`

## Scrolling Content

**Mechanism:** Two identical copies of the content laid side-by-side in a horizontal container. CSS animation translates the entire container leftward at a constant speed. When the first copy has fully scrolled out of view, it seamlessly loops because the second copy has taken its place.

```css
.marquee-track {
  display: flex;
  animation: marquee-scroll 40s linear infinite;
  width: max-content;
}
@keyframes marquee-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

**Speed:** 40 seconds for full cycle — slow enough to read individual items, fast enough to feel dynamic.

**Hover behavior:** On hover, animation `animation-play-state: paused;` — the strip pauses so the user can read the current item. On mouse leave, it resumes smoothly.

## Items in the Marquee

Each item is a small inline element with consistent styling, separated by decorative dots.

**Item styling:**
- Font: `var(--text-caption)` = 13px, weight 600
- Color: `var(--text-tertiary)`
- Text-transform: uppercase
- Letter-spacing: 0.05em
- Inline with icons/emoji before each text

**Separator:** A small diamond `"◆"` character at 8px, `var(--text-muted)` color, with 24px horizontal margin on each side.

**The items (in order):**

1. `"⚡ MONACO EDITOR"`
2. `"◆"`
3. `"👁️ LIVE PREVIEW"`
4. `"◆"`
5. `"📊 MERMAID DIAGRAMS"`
6. `"◆"`
7. `"📐 KATEX MATH"`
8. `"◆"`
9. `"📤 PDF EXPORT"`
10. `"◆"`
11. `"🎨 8+ THEMES"`
12. `"◆"`
13. `"💾 AUTO-SAVE"`
14. `"◆"`
15. `"📱 PWA SUPPORT"`
16. `"◆"`
17. `"⌨️ KEYBOARD SHORTCUTS"`
18. `"◆"`
19. `"🔍 SMART LINTING"`
20. `"◆"`
21. `"📑 MULTI-TAB"`
22. `"◆"`
23. `"🎯 FOCUS MODE"`
24. `"◆"`
25. `"✅ GITHUB FLAVORED MD"`
26. `"◆"`
27. `"🆓 FREE & OPEN SOURCE"`
28. `"◆"`
29. `"🌍 WORKS EVERYWHERE"`

This sequence repeats (duplicated for seamless loop).

## Light vs Dark Differences

- Light: Items slightly more muted (tertiary text), background warm cream
- Dark: Items slightly brighter (secondary text color), the emoji icons appear more vivid against dark background, adding colorful personality

## Mobile
- Same behavior, no changes needed — the marquee naturally works at any width
- Height reduces to 48px, font to 12px

---

# 10. 🖥️ SECTION 4 — DASHBOARD PREVIEW SECTION

## Purpose

This is the **"money shot"** of the entire landing page — a large, gorgeous, hyper-realistic mockup of the Markups editor interface that makes visitors think *"I want to use this RIGHT NOW."* It should be the single most visually impressive element on the page.

## Container

**Background:**
- Light: `var(--bg-page-alt)` (#F4F2ED) — subtle contrast from hero
- Dark: `var(--bg-page-alt)` (#10121A)
**Padding:** `80px 32px`
**Max-width:** 1280px centered

## Section Header

Position: Centered above the dashboard mockup
Text-align: center
Margin-bottom: 48px (space between text and mockup)

**Eyebrow Label:**
- Text: `"EXPERIENCE THE EDITOR"`
- Font: `var(--text-label)` = 12px, weight 700, uppercase, letter-spacing 0.1em
- Color: `var(--accent-indigo)`
- Display: inline-flex with a small eye icon (👁️) before text, gap 6px
- Margin-bottom: 12px

**Main Heading:**
- Text: `"See Your Markdown Come Alive"`
- Font: `var(--text-h2)` = 44px, weight 700
- Color: `var(--text-heading)`
- `"Come Alive"` — colored in `var(--accent-jade)`, adding emphasis to the real-time nature of the preview
- Margin-bottom: 16px

**Supporting Text:**
- Text: `"Real-time preview powered by Monaco Editor — the same engine behind VS Code. Write once, export anywhere."`
- Font: `var(--text-body-lg)` = 18px, weight 400
- Color: `var(--text-secondary)`
- Max-width: 620px
- Margin: 0 auto (centered)
- Line-height: 1.7

## Dashboard Mockup Frame

**Container:**
- Max-width: 1100px
- Margin: 0 auto (centered)
- Border-radius: `var(--radius-2xl)` = 24px
- Overflow: hidden
- Box-shadow: `var(--shadow-xl-light)` / `var(--shadow-xl-dark)` — this is the most heavily shadowed element on the page, creating dramatic depth
- Position: relative (for floating elements)

**Light Mode additional:** A very subtle `1px solid var(--border-default)` border
**Dark Mode additional:** The gradient border technique (indigo-to-jade gradient at 15% opacity)

### Browser Chrome Bar (Top of Mockup)

**Purpose:** Simulates a browser window to make the mockup feel realistic and contextual
**Height:** 48px
**Background:**
- Light: `#F0EDE6` (warm gray, slightly darker than page bg)
- Dark: `#1A1C24` (dark gray, slightly lighter than page bg)
**Border-bottom:** `1px solid var(--border-subtle)`
**Layout:** `display: flex; align-items: center; padding: 0 16px;`

**Left side — Traffic light dots:**
- Three circles in a row, gap 8px between each
- Each circle: 12px × 12px, `border-radius: 999px`
- Colors: `#FF5F57` (red), `#FFBD2E` (yellow), `#28C840` (green)
- These are purely decorative — no interactivity
- Dark mode: Same colors but at 80% opacity (slightly dimmer, simulating an inactive window)

**Center — URL/Tab Bar:**
- Container: `flex: 1; max-width: 400px; margin: 0 auto;`
- Background: `var(--bg-card)` (Light: white, Dark: #161820)
- Border-radius: 8px
- Padding: 7px 16px
- Height: 32px total
- Border: `1px solid var(--border-subtle)`

URL text inside:
- Icon: 🔒 lock emoji at 12px (indicating HTTPS)
- Text: `"markups.vercel.app"` in `var(--font-mono)`, 13px, weight 500, `var(--text-secondary)` color
- The domain name gives credibility — it's a real, working product

**Right side (optional):**
- Two tiny dots or lines representing browser menu icons, `var(--text-muted)` color, purely decorative

### Editor Area — The Main Showcase

**Height:** 480px on desktop, 380px on tablet, 300px on mobile
**Layout:** Side-by-side split (flex-row on desktop, stacked with tabs on mobile)

#### Left Pane — Code Editor (50% width)

**Background:**
- Light mode: `#FFFFFF` (clean white editor)
- Dark mode: `#1E1E1E` (VS Code's signature dark background)

**Line Number Gutter (left edge):**
- Width: 48px
- Background: slightly different shade (Light: `#FAFAF8`, Dark: `#1C1C1C`)
- Right border: `1px solid var(--border-subtle)`
- Numbers: 1 through ~20, displayed in `var(--font-mono)`, 12px, `var(--text-muted)` color (very subtle)
- Active line number (line 8): slightly brighter color `var(--text-tertiary)`

**Code Content (the fake markdown text):**

The following markdown content is displayed with full syntax highlighting:

```
Line  1: # Welcome to Markups ✨
Line  2: 
Line  3: ## The Modern Markdown Editor
Line  4: 
Line  5: Write **beautiful** documents with ease.
Line  6: 
Line  7: ### Key Features
Line  8: |  (cursor blinking here)
Line  9: - ⚡ **Live Preview** — See changes in real-time
Line 10: - 📊 **Mermaid Diagrams** — Flowcharts from text
Line 11: - 📐 **KaTeX Math** — $E = mc^2$
Line 12: - 📤 **Export** — PDF, HTML, Markdown
Line 13: 
Line 14: ```javascript
Line 15: const editor = new MarkupsEditor({
Line 16:   theme: 'dracula',
Line 17:   preview: true,
Line 18:   autoSave: true
Line 19: });
Line 20: ```
```

**Syntax highlighting colors (Light mode editor):**
- `#` heading markers: `#2D9F6F` (jade/green)
- `##`, `###` heading text: `#1A1917` bold
- `**bold**` markers: `#8B5CF6` (purple)
- Bold text content: `#1A1917` bold
- `-` list markers: `#E8623E` (orange)
- Inline code backticks + content: `#5865F2` (indigo) with light indigo bg
- `$...$` math delimiters: `#D4A843` (gold)
- Code block language tag: `#2D9F6F`
- Code block keywords (`const`, `new`, `true`): `#5865F2`
- Code block strings: `#2D9F6F`
- Code block property names: `#E8623E`
- Regular text: `#44433F`

**Syntax highlighting colors (Dark mode editor):**
- `#` heading markers: `#3DDC84` (bright jade)
- Heading text: `#EEEEE8` bold
- `**` markers: `#C084FC` (light purple)
- Bold text: `#EEEEE8` bold
- `-` markers: `#FF6B42` (bright orange)
- Inline code: `#7C8AFF` (light indigo) with dark indigo bg
- Math: `#F0C850` (bright gold)
- Code keywords: `#7C8AFF`
- Code strings: `#3DDC84`
- Code properties: `#FF6B42`
- Regular text: `#B0B0A8`

**Active Line Highlight (line 8):**
- Background: `rgba(45, 159, 111, 0.06)` (Light) / `rgba(61, 220, 132, 0.06)` (Dark)
- Full width of the editor pane
- The cursor on line 8 is a blinking vertical bar (1.5px wide, `var(--accent-jade)` color):
  ```css
  @keyframes cursor-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  animation: cursor-blink 1.1s step-end infinite;
  ```

#### Center Divider (between editor and preview)

- Width: 4px
- Background: `var(--accent-indigo)` at 25% opacity
- A small handle circle centered vertically on the divider:
  - 10px × 10px circle
  - Background: `var(--accent-indigo)` at 40% opacity
  - Border: `2px solid var(--bg-card)` (creates a ring effect)
  - `border-radius: 999px`
- On hover of divider area: cursor becomes `col-resize`, handle becomes `var(--accent-indigo)` at 100% opacity
- Note: This is non-functional (it's a mockup), just visual

#### Right Pane — Preview (50% width)

**Background:**
- Light: `#FFFFFF`
- Dark: `#161820`
**Padding:** 32px

**Rendered Content (matches the markdown from left pane):**

The heading `"Welcome to Markups ✨"`:
- Rendered as H1: 28px, weight 800, `var(--text-heading)` color
- Bottom border: `2px solid var(--border-subtle)` (GitHub-style heading underline)
- Sparkle emoji rendered natively

Sub-heading `"The Modern Markdown Editor"`:
- Rendered as H2: 22px, weight 700
- Bottom border: `1px solid var(--border-subtle)`

Paragraph `"Write beautiful documents with ease."`:
- 15px body text, "beautiful" is bold

Sub-heading `"Key Features"`:
- H3: 18px, weight 700

Bullet list:
- Each item has a small colored circle bullet (not standard disc)
- Emoji renders inline
- Bold text is actually bold
- The items are well-spaced (line-height 2)

Code block:
- Background: `var(--bg-code-block)`
- Border-radius: 8px
- Padding: 16px
- Syntax highlighting matches the code (keywords blue, strings green, etc.)
- Language badge top-right: `"javascript"` in tiny text

**A small Mermaid diagram rendered at the bottom of the preview:**
- Simple flowchart:
  ```
  [Write Markdown] → [Preview] → [Export]
  ```
- Rendered as SVG with clean lines
- Node boxes: rounded rectangles with jade stroke
- Arrows: simple lines with arrowheads
- Text inside nodes: `var(--font-body)`, 12px
- The diagram is compact (~120px height) and serves as a visual proof of Mermaid support

### Status Bar (Bottom of Mockup)

**Height:** 36px
**Background:**
- Light: `#F0EDE6` (same as browser chrome)
- Dark: `#14161E`
**Border-top:** `1px solid var(--border-subtle)`
**Layout:** `display: flex; align-items: center; padding: 0 20px; gap: 24px;`

**Status items (from left to right):**
Each item: `var(--font-mono)`, 12px, `var(--text-tertiary)`, weight 500

| Item | Value |
|------|-------|
| `"Words"` | `"342"` |
| `"Characters"` | `"1,847"` |
| `"Reading Time"` | `"2 min"` |
| `"Lines"` | `"48"` |
| Separator | Small vertical line `|` in `var(--text-muted)` |
| Theme indicator | `"● VS Dark"` with a small colored circle matching theme color |

**Right side of status bar:**
- `"✓ Auto-saved"` with a green check — `var(--accent-jade)` color

### Floating Accent Elements (Around the Dashboard)

These are small decorative pills/cards that float around the dashboard mockup, positioned with `position: absolute` relative to the mockup container. They add visual interest and communicate key features.

**Floating Element 1 — Top Left:**
- Position: `top: -16px; left: -20px` (slightly overlapping the mockup corner)
- Content: `"✨ Auto-Save Enabled"`
- Background: glass card (light) / dark card (dark)
- Font: 12px, weight 600, `var(--text-secondary)`
- Padding: 8px 14px
- Border-radius: `var(--radius-full)` (pill)
- Shadow: `var(--shadow-md)`
- **Animation:** Gentle floating up-down:
  ```css
  @keyframes float-up-down {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
  animation: float-up-down 3.5s ease-in-out infinite;
  ```

**Floating Element 2 — Top Right:**
- Position: `top: -12px; right: -24px`
- Content: `"📱 PWA Ready"`
- Same styling as Float 1
- Animation: Same float but with `animation-delay: 1.2s` (offset from Float 1 so they don't move in sync)

**Floating Element 3 — Bottom Right:**
- Position: `bottom: -20px; right: 40px`
- Content: A mini-card (not pill) showing:
  - Top: `"Export Options"` in 11px, weight 700, uppercase
  - Below: Four tiny format icons in a row: 📄 PDF · 🌐 HTML · 📝 MD · 📋 Copy — each 12px with 8px gap
- Background: glass card with slightly heavier opacity
- Padding: 12px 16px
- Border-radius: `var(--radius-lg)` (16px)
- Shadow: `var(--shadow-lg)`
- Animation: float with `animation-delay: 2.4s`

**Floating Element 4 — Bottom Left (Dark mode only or both):**
- Position: `bottom: -16px; left: 30px`
- Content: `"⚡ Zero Lag Preview"` with a tiny green status dot before text
- Pill shape, same as Float 1
- Animation: float with `animation-delay: 0.8s`

**Desktop only:** All floating elements visible
**Tablet:** Hide Float 4, reduce size of others
**Mobile:** Hide ALL floating elements (they would overlap/be distracting on small screens)

### Background Glow Behind Dashboard

**Light Mode:**
A very large, very subtle radial gradient centered behind the mockup:
```css
.dashboard-section::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  height: 600px;
  background: radial-gradient(
    ellipse,
    rgba(45, 159, 111, 0.06) 0%,
    rgba(88, 101, 242, 0.03) 40%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
}
```

**Dark Mode:**
```css
.dashboard-section::before {
  /* Same positioning */
  background: radial-gradient(
    ellipse,
    rgba(61, 220, 132, 0.04) 0%,
    rgba(124, 138, 255, 0.06) 40%,
    transparent 70%
  );
}
```

These create a subtle "spotlight" effect behind the dashboard, making it feel illuminated and important.

### Dashboard Scroll Animation

When the dashboard scrolls into view (IntersectionObserver, threshold 0.2):

1. The entire mockup frame starts from: `opacity: 0; transform: translateY(40px) scale(0.97)`
2. Transitions to: `opacity: 1; transform: translateY(0) scale(1)` over 800ms with `ease-out`
3. The floating elements appear 400ms after the frame, staggering 150ms between each
4. This creates a dramatic "rising into view" effect, befitting the most important visual on the page

### Mobile Dashboard Adaptation

**On screens < 768px:**
- The split view is replaced with a **tabbed view**:
  - Two tab buttons above the editor area: `"Editor"` and `"Preview"`
  - Active tab has jade underline and bold text
  - Only the active pane is shown (toggle between them)
  - Default: Preview pane shown (it's more visually impressive)
- Browser chrome simplifies: Only 3 dots + simplified URL
- Status bar shows only 2 items: Words count + Reading time
- Height reduces to 300px
- Floating elements all hidden
- Border-radius reduces to 16px

---

# 11. ⚡ SECTION 5 — MAIN FEATURES SECTION (Irregular Bento Grid)

## Container

**Background:** `var(--bg-page)` — returns to the primary page background color
**Padding:** `80px 32px`
**Max-width:** 1280px centered

## Section Header

**Layout:** Left-aligned (not centered — this section uses a bento grid, so left-alignment feels more natural and asymmetric)

**Eyebrow Label:**
- Text: `"POWERFUL FEATURES"`
- Standard eyebrow styling: 12px, weight 700, uppercase, letter-spacing 0.1em
- Color: `var(--accent-indigo)`
- Includes small lightning bolt icon: `"⚡"` before text
- Margin-bottom: 12px

**Main Heading:**
- Text (2 lines):
  ```
  "Everything You Need.
   Nothing You Don't."
  ```
- Font: `var(--text-h2)` = 44px, weight 700
- Color: `var(--text-heading)`
- `"Everything"` — colored `var(--accent-jade)` for emphasis
- Line-height: 1.15
- Margin-bottom: 16px

**Supporting Text:**
- Text: `"From live preview to Mermaid diagrams, KaTeX math to PDF export — Markups packs professional-grade features into a beautifully simple editor."`
- Font: `var(--text-body-lg)` = 18px, weight 400
- Color: `var(--text-secondary)`
- Max-width: 640px
- Line-height: 1.7
- Margin-bottom: 48px

## Bento Grid Configuration

```css
display: grid;
grid-template-columns: repeat(12, 1fr);
gap: var(--grid-gap); /* 20px */
```

**Desktop Grid Map:**
```
Row 1:  [MONACO─────────────] [LIVE PREVIEW────────] [THEMES──]
        col 1────────────5     col 6───────────9      col 10──12
        (spans 2 rows)         (spans 2 rows)         (1 row)

Row 2:  [MONACO continued──] [LIVE PREVIEW cont──]  [LINTER──]
                                                      col 10──12
                                                      (1 row)

Row 3:  [MERMAID───] [KATEX───]  [EXPORT SUITE─────────] [SNIPPETS]
        col 1────3   col 4────6   col 7──────────10       col 11──12
        (1 row)      (1 row)      (1 row, wide)           (1 row)

Row 4:  [MULTI-TAB──────────]  [SHORTCUTS──] [TOC───] [AUTO-SAVE]
        col 1────────────5      col 6─────8   col 9─10 col 11──12
        (1 row, wide)           (1 row)       (1 row)  (1 row)
```

This creates a truly irregular, bento-box layout with a pleasing mix of large dominant cards, medium cards, and small accent cards.

## Feature Card Designs

### LARGE CARD TYPE — Monaco Editor (⭐ Primary Feature)

**Grid Position:** `grid-column: 1 / 6; grid-row: 1 / 3;`
**Spans:** 5 columns, 2 rows — the largest feature card, signaling this is the #1 feature

**Card Surface:**
Light Mode:
```
background: var(--bg-card-tint-indigo); /* #EEEFFE — light indigo wash */
border: 1px solid var(--border-indigo);
border-radius: var(--radius-xl); /* 20px */
box-shadow: var(--shadow-md-light);
position: relative;
overflow: hidden;
```

Dark Mode:
```
background: var(--bg-card-tint-indigo); /* rgba(124,138,255,0.06) */
border: 1px solid var(--border-glow-indigo);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-md-dark);
```

**Padding:** `36px`

**Featured Badge (top-right corner):**
- Text: `"⭐ Core Feature"`
- Position: absolute, top: 20px, right: 20px
- Background: `var(--accent-jade-light)` / `var(--accent-jade-dim)`
- Color: `var(--accent-jade)`
- Font: `var(--text-tiny)` = 11px, weight 700
- Padding: 4px 10px
- Border-radius: `var(--radius-full)`

**Icon:**
- A large (56px × 56px) icon container
- Background: `var(--accent-indigo)` at 12% opacity (Light) / at 10% opacity (Dark)
- Border-radius: `var(--radius-lg)` = 16px (squircle)
- Icon inside: VS Code logo SVG (or a code editor icon) at 28px, `var(--accent-indigo)` color
- Margin-bottom: 20px

**Heading:**
- Text: `"Monaco Editor"`
- Font: `var(--text-h4)` = 24px, weight 700
- Color: `var(--text-heading)`
- Margin-bottom: 6px

**Sub-heading:**
- Text: `"VS Code's Engine, In Your Browser"`
- Font: `var(--text-body-sm)` = 14px, weight 500, italic
- Color: `var(--text-tertiary)`
- Margin-bottom: 16px

**Description:**
- Text: `"Get the full power of Visual Studio Code's editor — IntelliSense autocomplete, syntax highlighting for 20+ languages, customizable font size & family, line numbers, word wrap, and minimap. The same editor used by millions of developers, now for your markdown."`
- Font: `var(--text-body)` = 16px, weight 400
- Color: `var(--text-body)`
- Line-height: 1.65
- Margin-bottom: 20px

**Feature Pills Row:**
- Layout: `display: flex; flex-wrap: wrap; gap: 8px;`
- Pills: `"IntelliSense"` · `"20+ Languages"` · `"Minimap"` · `"Word Wrap"` · `"Multi-Cursor"`
- Each pill:
  ```
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  background: var(--bg-card); /* white light / dark surface dark */
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  font-size: var(--text-tiny); /* 11px */
  font-weight: 600;
  color: var(--text-secondary);
  ```
- Optional tiny icon before each (⚙️ for IntelliSense, 🌐 for Languages, etc.)

**Hover State:**
- Card: `transform: translateY(-4px)` with `var(--ease-spring)`, 300ms
- Shadow: increases to `var(--shadow-lg)`
- Border: color intensifies to `var(--accent-indigo)` at 35% opacity
- Dark mode: adds `box-shadow: ... , 0 0 24px rgba(124,138,255,0.08)` (glow)
- Icon container: `scale(1.05)` and slight `rotate(3deg)` (playful lift)

**Background Decoration:**
- A large, very faint (4% opacity) code bracket pattern `"{ }"` or grid lines in the bottom-right corner of the card, rendered as SVG or CSS, acting as a subtle watermark
- This gives the card a "code/tech" personality without being distracting

---

### LARGE CARD TYPE — Live Preview (👁️ Primary Feature)

**Grid Position:** `grid-column: 6 / 10; grid-row: 1 / 3;`
**Spans:** 4 columns, 2 rows

**Card Surface:** Standard glass card (Light) / Standard card (Dark)
- Light: `var(--bg-card-glass)` with glassmorphism
- Dark: `var(--bg-card)` with default dark border
**Border-radius:** `var(--radius-xl)`
**Padding:** `36px`

**Icon:**
- 56px squircle container with `var(--accent-jade)` tinted background
- Eye icon (👁️ emoji at 28px or SVG eye icon) in `var(--accent-jade)` color

**Heading:** `"Live Preview"` — 24px, weight 700
**Sub-heading:** `"See Changes as You Type"` — 14px, weight 500, italic, `var(--text-tertiary)`

**Description:** `"Real-time rendering with zero delay. Split-view with a resizable divider puts your markdown and beautiful rendered output side by side. Synchronized scrolling keeps both panes in perfect alignment. Switch between editor-only, preview-only, or split modes."`

**Mini Visual (unique element for this card):**
A small inline illustration showing a split-pane mockup:
- A rectangle (160px × 80px) divided in the middle by a vertical line
- Left half: 3-4 horizontal lines representing code (varying widths, `var(--text-muted)` color)
- Right half: Larger line (heading), smaller lines (paragraph), a small circle (image placeholder)
- Small bidirectional arrows between the two halves indicating scroll sync
- Colors: `var(--border-default)` for lines, `var(--accent-jade)` for the divider and arrows
- This illustration is hand-drawn/minimal style, not photographic

**Feature Pills Row:**
# 🏯 MARKUPS — LANDING PAGE DESIGN SPECIFICATION (CONTINUED — Part 3)

---

### LARGE CARD — Live Preview (Continued)

**Feature Pills:**
- Layout: `display: flex; flex-wrap: wrap; gap: 8px;`
- Pills: `"Split View"` · `"Scroll Sync"` · `"3 View Modes"` · `"Resizable"` · `"Zero Delay"`
- Each pill follows the standard pill styling defined in the Monaco card specification
- `"Zero Delay"` pill gets a special treatment: jade tinted background (`var(--accent-jade-light)` / `var(--accent-jade-dim)`) instead of default card background, to emphasize the speed claim

**Hover State:**
- Same lift/shadow pattern as Monaco card
- The mini illustration arrows get a subtle pulse animation: `scale(1) → scale(1.15) → scale(1)` over 600ms, triggered on card hover
- Border subtly tints jade

**Background Decoration:**
- A faint (3% opacity) horizontal split-line pattern in the bottom-right corner, representing the split-view concept abstractly

---

### SMALL CARD TYPE — Themes (🎨)

**Grid Position:** `grid-column: 10 / 13; grid-row: 1 / 2;`
**Spans:** 3 columns, 1 row

**Card Surface:**
Light Mode:
```
background: var(--bg-card-glass);
backdrop-filter: blur(20px) saturate(1.4);
border: 1px solid rgba(255,255,255,0.6);
border-radius: var(--radius-xl); /* 20px */
box-shadow: var(--shadow-sm-light);
```

Dark Mode:
```
background: var(--bg-card);
border: 1px solid var(--border-default);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-sm-dark);
```

**Padding:** `24px`
**Layout:** `display: flex; flex-direction: column; gap: 12px;`

**Icon Container:**
- Size: 48px × 48px
- Border-radius: `var(--radius-md)` = 12px (squircle)
- Background: A diagonal gradient of multiple theme colors to represent variety:
  ```
  Light: linear-gradient(135deg, #1E1E1E 0%, #1E1E1E 33%, #F8F8F2 33%, #F8F8F2 66%, #FDF6E3 66%, #FDF6E3 100%)
  ```
  This creates a tri-stripe showing dark, light, and warm themes
- The palette icon (🎨 at 24px) sits centered on top of this gradient
- Border: `1px solid var(--border-default)`

**Heading:**
- Text: `"8+ Editor Themes"`
- Font: `var(--text-h6)` = 17px, weight 700
- Color: `var(--text-heading)`

**Description:**
- Text: `"VS Light, VS Dark, Dracula, GitHub, Solarized, and more. Match your editor to your mood."`
- Font: `var(--text-body-sm)` = 14px, weight 400
- Color: `var(--text-secondary)`
- Line-height: 1.6
- Max 3 lines — concise

**Theme Color Dots (bottom of card, decorative):**
- A row of 6 tiny circles (10px each, gap 6px)
- Colors representing themes: `#1E1E1E` (VS Dark), `#FFFFFF` with border (VS Light), `#282A36` (Dracula), `#24292E` (GitHub Dark), `#FDF6E3` (Solarized Light), `#002B36` (Solarized Dark)
- Each has `border: 1px solid var(--border-default)` for definition
- `border-radius: 999px`
- On card hover: dots do a sequential pop animation (`scale(0.8) → scale(1.1) → scale(1)`) staggered 50ms apart — like a little Mexican wave

**Hover:** Standard lift + shadow

---

### SMALL CARD TYPE — Linter (🔍)

**Grid Position:** `grid-column: 10 / 13; grid-row: 2 / 3;`
**Spans:** 3 columns, 1 row

**Card Surface:** Standard glass/card styling
**Padding:** `24px`

**Icon Container:**
- 48px × 48px squircle
- Background: `var(--accent-jade-light)` / `var(--accent-jade-dim)`
- Icon: 🔍 magnifying glass at 24px, or a custom SVG lint/check icon, color `var(--accent-jade)`

**Heading:** `"Smart Linting"`
- Font: 17px, weight 700

**Description:** `"Real-time markdown best practices checking. Write cleaner, more consistent documents automatically."`
- Font: 14px, weight 400, `var(--text-secondary)`

**Inline Visual (optional, space permitting):**
- A tiny mock lint message: a 1-line element showing:
  - Yellow warning triangle `⚠` at 10px
  - Text: `"Line 12: Heading level skipped"` in `var(--font-mono)`, 10px, `var(--text-tertiary)`
  - Background: `rgba(212,168,67,0.08)` (gold tint for warning)
  - Padding: 4px 8px, border-radius: 6px
  - This gives a concrete, tangible preview of what linting looks like

**Hover:** Standard lift + shadow + icon magnifying glass does slight `scale(1.1)` zoom

---

### MEDIUM CARD TYPE — Mermaid Diagrams (📊)

**Grid Position:** `grid-column: 1 / 4; grid-row: 3 / 4;`
**Spans:** 3 columns, 1 row

**Card Surface:**
Light Mode:
```
background: var(--bg-card-tint-jade); /* #EDF8F2 — jade tint */
border: 1px solid var(--border-jade);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-sm-light);
```

Dark Mode:
```
background: var(--bg-card-tint-jade); /* rgba(61,220,132,0.06) */
border: 1px solid var(--border-glow-jade);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-sm-dark);
```

**Padding:** `28px`

**Icon Container:**
- 48px squircle, `var(--accent-jade)` background at 12% opacity
- Icon: 📊 chart emoji at 24px or flowchart SVG icon, color `var(--accent-jade)`

**Heading:** `"Mermaid Diagrams"` — 17px, weight 700

**Description:** `"Flowcharts, sequence diagrams, Gantt charts, pie charts — all rendered from simple text syntax inside your markdown."`
- 14px, weight 400, `var(--text-secondary)`

**Mini Diagram Visual (unique to this card):**
A tiny inline SVG diagram (simplified flowchart):
```
[A] ──→ [B] ──→ [C]
         │
         ↓
        [D]
```
- Rendered as actual simple SVG:
  - 4 small rounded rectangles (30px × 18px), stroke `var(--accent-jade)` at 40% opacity, fill transparent
  - Connecting lines with small arrowheads
  - Letters A/B/C/D inside in 9px font
  - Total diagram size: ~140px × 60px
  - Positioned at bottom of card
- On card hover: the connecting arrows animate (stroke-dasharray animation, lines "draw" themselves) over 600ms

**Hover:** Standard lift + diagram arrow draw animation

---

### MEDIUM CARD TYPE — KaTeX Math (📐)

**Grid Position:** `grid-column: 4 / 7; grid-row: 3 / 4;`
**Spans:** 3 columns, 1 row

**Card Surface:** Standard glass card / dark card
**Padding:** `28px`

**Icon Container:**
- 48px squircle
- Background: `var(--accent-indigo)` at 12% opacity
- Icon: `"∑"` (sigma) rendered in `var(--font-mono)`, 28px, weight 700, color `var(--accent-indigo)` — OR 📐 emoji at 24px

**Heading:** `"LaTeX Math"` — 17px, weight 700

**Description:** `"Beautiful math equations with KaTeX. Inline $E=mc²$ and block equations rendered with publication-quality output."`
- 14px, weight 400, `var(--text-secondary)`
- The `$E=mc²$` part is rendered in `var(--font-mono)` with `var(--accent-indigo)` color and a subtle indigo background pill

**Math Showcase (unique to this card):**
A beautifully rendered mathematical equation displayed at the bottom of the card:

The equation: `∫₀^∞ e^(-x²) dx = √π/2`

Rendered styling:
- Font: A serif-style or the KaTeX-rendered font appearance
- Size: 16px
- Color: `var(--text-heading)` — it should look like actual typeset mathematics
- Background: `var(--bg-card)` (Light: white / Dark: dark surface) — a small "preview window" effect
- Padding: 12px 16px
- Border-radius: 8px
- Border: `1px solid var(--border-subtle)`
- The integral sign, subscripts, superscripts, and square root symbol are all properly rendered as they would appear in KaTeX output
- This serves as an irresistible proof of quality for anyone who needs math typesetting

**Hover:** Standard lift + the math equation does a very subtle color shift (becomes `var(--accent-indigo)` tinted) indicating interactivity

---

### WIDE CARD TYPE — Export Suite (📤)

**Grid Position:** `grid-column: 7 / 11; grid-row: 3 / 4;`
**Spans:** 4 columns, 1 row — wider than standard, signaling this is a substantial feature

**Card Surface:**
Light Mode:
```
background: var(--bg-card-tint-orange); /* #FFF2ED */
border: 1px solid var(--border-orange);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-md-light);
```

Dark Mode:
```
background: var(--bg-card-tint-orange); /* rgba(255,107,66,0.06) */
border: 1px solid var(--border-glow-orange);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-md-dark);
```

**Padding:** `28px`

**Layout:** This card has a two-column internal layout:
```
Left column (60%): Icon + Heading + Description
Right column (40%): Export format icons grid
```

**Left Content:**

Icon: 48px squircle, orange-tinted background, 📤 export icon at 24px, `var(--accent-orange)` color

Heading: `"Export Anywhere"` — 20px, weight 700

Description: `"Download as PDF with preserved formatting, clean HTML with embedded styles, raw Markdown, or copy to clipboard. Your content, your format."` — 14px, `var(--text-secondary)`

**Right Content — Export Format Icons Grid:**

A 2×2 grid of format mini-cards:
```
┌──────────┐  ┌──────────┐
│  📄 PDF  │  │  🌐 HTML │
└──────────┘  └──────────┘
┌──────────┐  ┌──────────┐
│  📝 MD   │  │  📋 Copy │
└──────────┘  └──────────┘
```

Each mini-card:
- Size: ~70px × 60px
- Background: `var(--bg-card)` (Light: white / Dark: dark surface)
- Border: `1px solid var(--border-subtle)`
- Border-radius: `var(--radius-md)` = 12px
- `display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;`
- Icon: 20px emoji
- Label: 10px, weight 700, uppercase, `var(--text-tertiary)`
- On individual mini-card hover: background tints orange, border becomes `var(--border-orange)`, small `translateY(-2px)` lift

**Card Hover:** Standard lift + shadow. Additionally, the 4 format mini-cards do a sequential subtle bounce animation (stagger 80ms each)

---

### SMALL CARD TYPE — Quick Snippets (⚡)

**Grid Position:** `grid-column: 11 / 13; grid-row: 3 / 4;`
**Spans:** 2 columns, 1 row

**Card Surface:** Standard glass/card
**Padding:** `24px`

**Icon:** 48px squircle, jade background tint, ⚡ lightning at 24px, `var(--accent-jade)` color

**Heading:** `"Quick Snippets"` — 16px, weight 700

**Description:** `"Insert tables, code blocks, alerts, and diagrams with a single click."` — 13px, `var(--text-secondary)`

**Mini Visual:**
A tiny mockup of a snippet dropdown:
- 3 rows, each 20px height:
  - `"📊 Table"` — 10px
  - `"💻 Code Block"` — 10px
  - `"⚠️ Alert Box"` — 10px
- Background: `var(--bg-card)` / dark surface
- Border: `1px solid var(--border-subtle)`
- Border-radius: 8px
- Padding: 6px 10px
- Total size: ~100px × 70px

**Hover:** Standard lift

---

### WIDE CARD TYPE — Multi-Tab Editing (📑)

**Grid Position:** `grid-column: 1 / 6; grid-row: 4 / 5;`
**Spans:** 5 columns, 1 row

**Card Surface:** Standard glass card (Light) / Standard card (Dark)
**Padding:** `28px`

**Layout:** Horizontal — icon + text on left, tab visual on right

**Left Content (60%):**

Icon: 48px squircle, indigo tint, 📑 tabs icon at 24px, `var(--accent-indigo)` color

Heading: `"Multi-Tab Editing"` — 20px, weight 700

Description: `"Work on multiple documents simultaneously. Each tab preserves its own content, scroll position, and undo history. Open up to 50 documents at once."` — 14px, `var(--text-secondary)`

Feature pills: `"50 Docs"` · `"Independent State"` · `"Drag & Drop"`

**Right Content (40%) — Tab Visual:**
A mini illustration of browser-like tabs:
```
┌─────────┐┌─────────┐┌─────────┐
│ README  ││ CHANGE  ││ API     │
│ .md ✕   ││ LOG ✕   ││ .md ✕   │
└─────────┘└─────────┘└─────────┘
```
- 3 small tab shapes, first one is "active" (has bottom border in `var(--accent-jade)` and slightly different background)
- Each tab: ~60px wide, 28px height
- Font: `var(--font-mono)`, 9px, `var(--text-secondary)`
- The `"✕"` close icon in `var(--text-muted)`, 8px
- Active tab: `var(--bg-card)` bg / others: slightly transparent
- On card hover: tabs animate a subtle sliding effect (active tab indicator moves from tab 1 to tab 2 over 600ms, then back)

---

### MEDIUM CARD TYPE — Keyboard Shortcuts (⌨️)

**Grid Position:** `grid-column: 6 / 9; grid-row: 4 / 5;`
**Spans:** 3 columns, 1 row

**Card Surface:** Standard card
**Padding:** `24px`

**Icon:** 48px squircle, `var(--bg-card-tint-jade)` / `var(--bg-card-tint-jade)`, ⌨️ at 24px, `var(--accent-jade)` color

**Heading:** `"Keyboard Shortcuts"` — 17px, weight 700

**Description:** `"Power-user shortcuts for everything. Ctrl+S, Ctrl+B, F11, and dozens more. Works like your favorite IDE."` — 14px, `var(--text-secondary)`

**Shortcut Key Visual:**
A row of 3 keyboard key caps:
```
[Ctrl] + [B]     [Ctrl] + [S]
```
Each keycap:
- Size: 28px × 28px (or wider for "Ctrl")
- Background: Light — `#F0EDE6` / Dark — `#1C1E28`
- Border: `1px solid var(--border-default)`
- Border-bottom: `2px solid var(--border-medium)` — creates the 3D keycap depth effect
- Border-radius: 6px
- Font: `var(--font-mono)`, 10px, weight 700, centered
- Color: `var(--text-body)`
- The `"+"` between keys: `var(--text-muted)`, 12px

On card hover: the keycaps do a press-down animation:
```css
@keyframes keycap-press {
  0% { transform: translateY(0px); border-bottom-width: 2px; }
  50% { transform: translateY(2px); border-bottom-width: 0px; }
  100% { transform: translateY(0px); border-bottom-width: 2px; }
}
```
Duration: 400ms, staggered between keys

---

### SMALL CARD TYPE — Table of Contents (📋)

**Grid Position:** `grid-column: 9 / 11; grid-row: 4 / 5;`
**Spans:** 2 columns, 1 row

**Card Surface:** Standard card
**Padding:** `24px`

**Icon:** 48px squircle, indigo tint, 📋 clipboard at 24px, `var(--accent-indigo)` color

**Heading:** `"Auto TOC"` — 16px, weight 700

**Description:** `"Auto-generated navigation from your headings. Click to jump to any section instantly."` — 13px, `var(--text-secondary)`

**Mini TOC Visual:**
A tiny indented list:
```
• Introduction
  • Getting Started
  • Features
    • Editor
    • Preview
```
- Font: `var(--font-mono)`, 9px
- Color: `var(--text-tertiary)`
- Indentation: 10px per level
- Bullet: tiny 3px circle, `var(--accent-indigo)` color
- Background: slight card tint
- Padding: 8px
- Border-radius: 6px

**Hover:** Standard lift. Mini TOC items sequentially highlight (top to bottom, each briefly turns `var(--accent-indigo)` color for 200ms, staggered 100ms)

---

### SMALL CARD TYPE — Auto-Save (💾)

**Grid Position:** `grid-column: 11 / 13; grid-row: 4 / 5;`
**Spans:** 2 columns, 1 row

**Card Surface:** Standard card with a subtle jade top border accent
Light: `border-top: 3px solid var(--accent-jade)`
Dark: `border-top: 3px solid var(--accent-jade)` with `--shadow-glow-jade-dark` added

**Padding:** `24px`

**Icon:** 48px squircle, jade tint, 💾 floppy disk at 24px, `var(--accent-jade)` color

**Heading:** `"Auto-Save"` — 16px, weight 700

**Description:** `"Never lose your work. Every keystroke saved to local storage automatically."` — 13px, `var(--text-secondary)`

**Status Indicator:**
- A tiny inline element: `"● Saved just now"` — the `"●"` is a 6px circle in `var(--accent-jade)` color (solid green dot), text `"Saved just now"` in 11px, `var(--text-tertiary)`, italic
- Position: bottom of card
- On card hover: the dot pulses (opacity 1→0.3→1 over 1s)

**Hover:** Standard lift

---

### Feature Cards — Scroll Entrance Animation

When the features section scrolls into viewport (IntersectionObserver, threshold 0.1):

All cards start at: `opacity: 0; transform: translateY(24px);`
Transition to: `opacity: 1; transform: translateY(0);`
Duration: `600ms`, easing: `var(--ease-out)`

**Stagger order (based on grid position, left-to-right, top-to-bottom):**
| Card | Delay |
|------|-------|
| Monaco | 0ms |
| Live Preview | 80ms |
| Themes | 160ms |
| Linter | 240ms |
| Mermaid | 320ms |
| KaTeX | 400ms |
| Export Suite | 480ms |
| Snippets | 560ms |
| Multi-Tab | 640ms |
| Shortcuts | 720ms |
| TOC | 800ms |
| Auto-Save | 880ms |

This creates a beautiful cascade "reveal" effect as the section enters the viewport.

### Feature Cards — Mobile Layout

**Tablet (768px — 1023px):**
```
grid-template-columns: repeat(6, 1fr);
```
- Monaco + Live Preview: each span 3 cols, 2 rows → reduce to span full 6 cols, 1 row each (stacked vertically, side-by-side loses too much height)
- All small cards: span 3 cols (2 per row)
- Wide cards (Export, Multi-Tab): span 6 cols

**Mobile (< 768px):**
```
grid-template-columns: repeat(2, 1fr);
```
- Large cards (Monaco, Live Preview): span full 2 columns, single row each
- Small cards: span 1 column each (2 per row)
- Wide cards: span 2 columns
- All internal layouts simplify: Two-column card layouts (like Export) become single column
- Mini visuals (diagrams, tabs, etc.) scale down proportionally or hide on very small screens (< 400px)
- Card padding reduces to 20px
- Grid gap reduces to 12px

---

# 12. 📖 SECTION 6 — HOW IT WORKS / STORY SECTION

## Container

**Background:** `var(--bg-page-alt)` — alternating background color
**Padding:** `96px 32px` (slightly more generous than standard sections to give breathing room)
**Max-width:** 1100px centered (narrower than features grid for focused reading)

## Section Header

**Text-align:** Center

**Eyebrow:**
- Text: `"HOW IT WORKS"`
- Standard: 12px, weight 700, uppercase, `var(--accent-jade)` color, letter-spacing 0.1em
- Small icon before: `"🔄"` at same size
- Margin-bottom: 12px

**Heading:**
- Text: `"From Blank Page to Beautiful Document in 3 Steps"`
- Font: `var(--text-h2)` = 44px, weight 700
- Color: `var(--text-heading)`
- `"3 Steps"` — highlighted in `var(--accent-orange)` color
- Margin-bottom: 12px

**Sub-text:**
- Text: `"No installation. No sign-up. No friction. Just open and start writing."`
- Font: `var(--text-body-lg)` = 18px, weight 400
- Color: `var(--text-secondary)`
- Margin-bottom: 56px

## Steps Layout

### Desktop (≥ 1024px): Horizontal 3-card row with connecting line

```
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│              │          │              │          │              │
│   ① WRITE   │──── ▶ ───│  ② PREVIEW   │──── ▶ ───│  ③ EXPORT    │
│              │          │              │          │              │
└──────────────┘          └──────────────┘          └──────────────┘
```

**Grid Configuration:**
```css
display: grid;
grid-template-columns: 1fr auto 1fr auto 1fr;
align-items: center;
gap: 0; /* Connectors handle the spacing */
```

Columns:
1. Step Card 1
2. Connector 1 (→)
3. Step Card 2
4. Connector 2 (→)
5. Step Card 3

### Connector Design (Between Cards)

**Width:** 60px
**Height:** 2px
**Display:** `flex; align-items: center; justify-content: center;`

The connector line:
- A horizontal dashed line: `border-top: 2px dashed var(--border-medium)`
- OR a series of animated dots

Arrowhead at the end:
- Text: `"▶"` at 12px, or a small SVG chevron arrow
- Color: `var(--accent-jade)` at 50% opacity
- Position: end (right side) of connector

**Scroll Animation for connectors:** When section enters view, after the step cards have faded in, the connector lines "draw" themselves from left to right:
```css
@keyframes connector-draw {
  0% { width: 0; }
  100% { width: 100%; }
}
```
- Connector 1 starts animating 400ms after Step 1 appears
- Connector 2 starts 400ms after Step 2 appears

### Step Card Design — Shared Structure

Each step card follows this common template:

**Card Container:**
```
padding: 36px;
border-radius: var(--radius-xl); /* 20px */
position: relative; /* for the step number watermark */
overflow: hidden; /* clip the watermark */
min-height: 320px;
display: flex;
flex-direction: column;
```

Light Mode:
```
background: var(--bg-card-glass-heavy);
backdrop-filter: blur(24px) saturate(1.5);
border: 1px solid rgba(255,255,255,0.6);
box-shadow: var(--shadow-md-light);
```

Dark Mode:
```
background: var(--bg-card);
border: 1px solid var(--border-default);
box-shadow: var(--shadow-md-dark);
```

**Watermark Number (background decoration):**
```css
.step-card::before {
  content: attr(data-step-number); /* "01", "02", "03" */
  position: absolute;
  top: -10px;
  right: 10px;
  font-family: var(--font-display);
  font-size: 120px;
  font-weight: 900;
  line-height: 1;
  color: var(--text-heading);
  opacity: 0.03; /* Light */ / 0.04; /* Dark */
  pointer-events: none;
  user-select: none;
}
```
This creates a huge, barely visible number in the background of each card, adding depth and visual reference without competing with content.

**Step Badge (foreground number):**
- Circular badge, 40px × 40px
- Border-radius: 999px
- Display: `flex; align-items: center; justify-content: center;`
- Font: `var(--font-display)`, 18px, weight 800, color white
- Margin-bottom: 20px

Step 1 badge: Background `var(--accent-jade)`, shadow: `0 2px 8px rgba(45,159,111,0.3)` / `0 2px 8px rgba(61,220,132,0.3)`
Step 2 badge: Background `var(--accent-indigo)`, shadow: `0 2px 8px rgba(88,101,242,0.3)` / `0 2px 8px rgba(124,138,255,0.3)`
Step 3 badge: Background `var(--accent-orange)`, shadow: `0 2px 8px rgba(232,98,62,0.3)` / `0 2px 8px rgba(255,107,66,0.3)`

**Hover Effect (all cards):**
- `transform: translateY(-6px)` — slightly more lift than standard cards (these are important)
- Shadow increases to `var(--shadow-lg)`
- Step badge: `scale(1.1)` with spring easing
- The watermark number's opacity increases from 0.03 to 0.06 (becomes slightly more visible, like the card is "activating")
- Transition: `all 0.35s var(--ease-spring)`

---

### Step 1 — WRITE

**data-step-number:** `"01"`

**Illustration Area (between badge and heading):**
A stylized mini-illustration of a code editor:
- A rounded rectangle (200px × 100px) representing an editor window
- Inside: 6-7 horizontal lines of varying widths (representing code lines)
  - Line 1: wider (heading), color `var(--accent-jade)` at 40% opacity
  - Lines 2-4: medium width, `var(--text-muted)` color
  - Line 5: narrower, `var(--accent-indigo)` at 30% opacity (representing a link/code)
  - Lines 6-7: medium, `var(--text-muted)` color
- A blinking cursor on line 4 (1.5px wide, `var(--accent-jade)` color, blink animation)
- Background of the mini-editor: `var(--bg-code-block)`
- Border: `1px solid var(--border-subtle)`
- Border-radius: 10px
- Margin-bottom: 20px

The illustration communicates "you write code here" without needing a real screenshot.

**Heading:**
- Text: `"Write Your Markdown"`
- Font: `var(--text-h4)` = 24px, weight 700
- Color: `var(--text-heading)`
- Margin-bottom: 12px

**Description:**
- Text: `"Open Markups in your browser and start typing immediately. The Monaco editor gives you IntelliSense, syntax highlighting, and the same editing experience as VS Code. Use our built-in templates for READMEs, blog posts, meeting notes, and more."`
- Font: `var(--text-body)` = 16px, weight 400
- Color: `var(--text-body)`
- Line-height: 1.65
- Margin-bottom: 16px

**Accent Tags Row:**
- Layout: `display: flex; flex-wrap: wrap; gap: 6px;`
- Tags: `"📚 Templates"` · `"⚡ Snippets"` · `"🧠 IntelliSense"`
- Each tag follows standard pill styling (tiny size variant):
  - Font: 11px, weight 600
  - Background: `var(--accent-jade-light)` / `var(--accent-jade-dim)`
  - Color: `var(--accent-jade)`
  - Padding: 4px 10px
  - Border-radius: 999px

---

### Step 2 — PREVIEW

**data-step-number:** `"02"`

**Illustration:**
A split-pane representation:
- Rounded rectangle (200px × 100px), divided vertically in the middle
- Left half: Horizontal lines (code representation), `var(--text-muted)` color
- Right half: A different layout — larger line (rendered heading, thicker), smaller lines (paragraph), a small rounded square (rendered image/diagram placeholder)
- Divider line in center: `var(--accent-indigo)` at 50%
- Small sync arrows (↕) on each side of the divider
- Background: `var(--bg-code-block)`
- Border/radius same as Step 1 illustration

This communicates "editor on left, preview on right" at a glance.

**Heading:** `"Preview in Real-Time"` — 24px, weight 700

**Description:** `"Watch your document come alive instantly. Split-view shows your markdown and the beautiful rendered output side by side. Mermaid diagrams render automatically. Math equations display perfectly. GitHub-flavored markdown supported fully."`

**Accent Tags:**
- `"👁️ Live Preview"` · `"🔄 Scroll Sync"` · `"📊 Mermaid"` · `"📐 KaTeX"`
- Background: `var(--accent-indigo-light)` / `var(--accent-indigo-dim)`
- Color: `var(--accent-indigo)`

---

### Step 3 — EXPORT

**data-step-number:** `"03"`

**Illustration:**
A download/export representation:
- A document shape (rectangle, 140px × 100px, rounded 10px) at center
- From this document, 4 small icons "fly out" in different directions:
  - Top-right: 📄 (PDF icon, small)
  - Right: 🌐 (HTML icon)
  - Bottom-right: 📝 (MD icon)
  - Bottom: 📋 (Clipboard icon)
- Small animated dashed arrows from document to each icon
- The document has horizontal lines inside (content representation)
- Colors: Document uses `var(--border-default)` stroke, icons use `var(--accent-orange)` color

On card hover: The icons animate outward slightly more (expand the distance from the document), creating a "burst" effect.

**Heading:** `"Export & Share"` — 24px, weight 700

**Description:** `"Download your polished document as a beautifully formatted PDF, clean HTML with embedded styles, raw Markdown file, or copy everything to clipboard. Share your work with the world — it's that simple."`

**Accent Tags:**
- `"📄 PDF"` · `"🌐 HTML"` · `"📝 Markdown"` · `"📋 Clipboard"`
- Background: `var(--accent-orange-light)` / `var(--accent-orange-dim)`
- Color: `var(--accent-orange)`

**Bottom Mini-CTA:**
- Text: `"Try It Now →"`
- Inline link style: `var(--accent-orange)` color, weight 600, 14px
- Hover: underline appears, arrow moves 3px right
- Links to `https://markups.vercel.app`

---

### Steps Section — Scroll Animation

| Element | Delay | Duration |
|---------|-------|----------|
| Section eyebrow | 0ms | 500ms |
| Section heading | 80ms | 500ms |
| Section sub-text | 160ms | 500ms |
| Step Card 1 | 300ms | 600ms |
| Connector 1 (draws) | 700ms | 400ms |
| Step Card 2 | 900ms | 600ms |
| Connector 2 (draws) | 1300ms | 400ms |
| Step Card 3 | 1500ms | 600ms |

This creates a cinematic left-to-right reveal that tells the story sequentially.

### Steps — Mobile Layout (< 768px)

```
Grid changes to single column:
grid-template-columns: 1fr;
```

- All 3 cards stack vertically
- Connectors rotate 90° and become vertical:
  - Height: 40px, width: 2px, centered horizontally
  - Arrow points downward (▼)
  - Same draw animation but vertical
- Cards: min-height reduces to auto, padding to 28px
- Illustrations scale down to 160px × 80px
- Watermark number size reduces to 80px

---

# 13. ⚡ SECTION 7 — ADVANCED FEATURES SHOWCASE

## Container

**Background:** `var(--bg-page)` — primary page background
**Padding:** `80px 32px`
**Max-width:** 1280px centered

## Section Header

**Text-align:** Center

**Eyebrow:**
- Text: `"BEYOND THE BASICS"`
- Standard eyebrow, color `var(--accent-indigo)`
- Icon: `"🚀"` before text

**Heading:**
- Text: `"Power Features for Power Users"`
- Font: `var(--text-h2)` = 44px, weight 700
- `"Power Users"` — colored `var(--accent-indigo)`

**Sub-text:**
- Text: `"Go deeper with features designed for focused writers and developers who demand more from their tools."`
- Font: `var(--text-body-lg)` = 18px, `var(--text-secondary)`
- Max-width: 600px, centered
- Margin-bottom: 48px

## Grid Layout

```css
display: grid;
grid-template-columns: repeat(3, 1fr);
gap: 20px;
```

9 cards in a 3×3 uniform grid. Unlike the features section (which uses irregular bento), this section uses a **clean, equal-sized grid** to signal that these are complementary features of equal importance.

## Advanced Feature Card — Universal Template

Each of the 9 cards follows this identical structure:

**Card Surface:**
Light Mode:
```
background: var(--bg-card); /* solid white */
border: 1px solid var(--border-subtle);
border-radius: var(--radius-lg); /* 16px */
box-shadow: var(--shadow-sm-light);
position: relative;
overflow: hidden;
```

Dark Mode:
```
background: var(--bg-card);
border: 1px solid var(--border-default);
border-radius: var(--radius-lg);
box-shadow: var(--shadow-sm-dark);
```

**Padding:** `28px`
**Min-height:** 200px (ensures cards are uniform even with varying content length)

**Colored Top Accent Line:**
Each card has a 3px-height gradient line at the very top edge (inside the border-radius):
```css
.advanced-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--card-accent-gradient);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.advanced-card:hover::before {
  opacity: 1;
}
```
The gradient line only appears on hover, creating a "activating" effect. The gradient color varies by feature category.

**Icon Container:**
- 44px × 44px
- Border-radius: `var(--radius-md)` = 12px (squircle)
- Background: category-specific tint (defined per card below)
- Icon: 22px emoji or SVG, category-specific accent color
- Margin-bottom: 16px

**Heading:**
- Font: `var(--text-h6)` = 17px, weight 700
- Color: `var(--text-heading)`
- Margin-bottom: 8px

**Description:**
- Font: `var(--text-body-sm)` = 14px, weight 400
- Color: `var(--text-secondary)`
- Line-height: 1.6

**Hover State:**
- `transform: translateY(-4px)` with spring easing
- Shadow: `var(--shadow-lg)`
- Top accent line fades in (opacity 0 → 1)
- Icon does subtle `scale(1.08)` and `rotate(3deg)`
- In dark mode: additional subtle glow matching accent color

## The 9 Advanced Feature Cards

### Card 1 — Focus Mode 🎯

**Category Color:** Jade
**Accent gradient:** `linear-gradient(90deg, var(--accent-jade), var(--accent-jade-hover))`
**Icon bg:** `var(--accent-jade-light)` / `var(--accent-jade-dim)`
**Icon color:** `var(--accent-jade)`

**Heading:** `"Focus Mode"`
**Description:** `"Hide everything except the editor. Pure, distraction-free writing surface. All UI chrome melts away, leaving you alone with your words. Toggle instantly with Ctrl+Shift+F."`

**Unique detail:** A small keyboard shortcut badge at bottom:
- Text: `"Ctrl+Shift+F"`
- Font: `var(--font-mono)`, 10px, weight 600
- Background: `var(--bg-code-inline)`
- Padding: 3px 8px
- Border-radius: 4px
- Color: `var(--text-tertiary)`

---

### Card 2 — Typewriter Mode ⌨️

**Category Color:** Jade
**Icon bg/color:** Same jade treatment

**Heading:** `"Typewriter Mode"`
**Description:** `"Keeps your active line vertically centered on screen as you type. Mimics the physical typewriter experience for comfortable long-form writing sessions. Reduces eye strain and keeps you in flow."`

**Unique detail:** A small visual showing 3 text lines, with the middle one highlighted and centered:
```
  ─── dimmed text ───
  ═══ ACTIVE LINE ═══  ← cursor here
  ─── dimmed text ───
```
Using `var(--text-muted)` for dimmed and `var(--text-heading)` for active, at 9px.

---

### Card 3 — Writing Goals 📊

**Category Color:** Orange
**Accent gradient:** `linear-gradient(90deg, var(--accent-orange), var(--accent-orange-hover))`
**Icon bg:** `var(--accent-orange-light)` / `var(--accent-orange-dim)`
**Icon color:** `var(--accent-orange)`

**Heading:** `"Writing Goals"`
**Description:** `"Set daily word count targets and track your progress. Build writing streaks to maintain consistency. Visual progress bar shows exactly how close you are to your goal."`

**Unique detail:** A tiny progress bar:
- Container: 100% width, 6px height, `var(--border-subtle)` background, border-radius 3px
- Fill: 68% width, `var(--accent-orange)` background, border-radius 3px
- Below: `"680 / 1,000 words"` in 10px, `var(--text-tertiary)`
- On card hover: the fill animates from 0% to 68% over 800ms, creating a satisfying reveal

---

### Card 4 — Document Statistics 📈

**Category Color:** Indigo
**Accent gradient:** `linear-gradient(90deg, var(--accent-indigo), var(--accent-indigo-hover))`
**Icon bg:** `var(--accent-indigo-light)` / `var(--accent-indigo-dim)`
**Icon color:** `var(--accent-indigo)`

**Heading:** `"Document Statistics"`
**Description:** `"Real-time word count, character count, paragraph count, sentence count, line count, and estimated reading time. Always accessible in the status bar without disrupting your writing flow."`

**Unique detail:** Tiny stats display:
```
Words: 1,234  ·  Chars: 6,789  ·  ~5 min read
```
In `var(--font-mono)`, 10px, `var(--text-tertiary)`, single line

---

### Card 5 — GitHub Flavored MD ✅

**Category Color:** Jade
**Icon bg/color:** Jade treatment

**Heading:** `"GitHub Flavored Markdown"`
**Description:** `"Full GFM support — task lists with checkboxes, data tables with alignment, strikethrough, alert blocks (NOTE, TIP, WARNING, CAUTION), footnotes, and auto-linked URLs."`

**Unique detail:** A mini task list:
```
☑ Design System     ← checked, jade color
☑ Components         ← checked
☐ Unit Tests         ← unchecked, muted
```
Checkboxes: 12px squares, checked ones filled with `var(--accent-jade)` with a white checkmark, unchecked ones just border. Text: 10px, checked items have `text-decoration: line-through` in `var(--text-muted)`.

---

### Card 6 — PWA Support 📱

**Category Color:** Indigo
**Icon bg/color:** Indigo treatment

**Heading:** `"Install as App (PWA)"`
**Description:** `"Progressive Web App support. Install Markups directly on your desktop or mobile device. Once installed, it works completely offline with full functionality. Feels and performs like a native application."`

**Unique detail:** A row of 3 tiny device silhouettes (desktop monitor, tablet, phone) at 16px height each, in `var(--text-muted)` color, with a small `"✓"` check above each in `var(--accent-jade)` color, indicating all are supported.

---

### Card 7 — Built-in Templates 📚

**Category Color:** Orange
**Icon bg/color:** Orange treatment

**Heading:** `"Built-in Templates"`
**Description:** `"Start instantly with professional templates — README, Resume, Blog Post, Meeting Notes, API Documentation, Changelog, and Contributing Guide. One click inserts the complete template."`

**Unique detail:** A mini dropdown showing template names:
```
┌─ README.md        ─┐
│  Resume.md          │
│  Blog Post.md       │
│  Meeting Notes.md   │
└─────────────────────┘
```
Font: `var(--font-mono)`, 9px, `var(--text-secondary)`. Background: `var(--bg-code-block)`. Border-radius: 6px. First item highlighted with jade background tint.

---

### Card 8 — Quick Snippets ⚡

**Category Color:** Jade
**Icon bg/color:** Jade treatment

**Heading:** `"Quick Snippets"`
**Description:** `"Insert complex markdown structures with a single click — tables with configurable rows and columns, code blocks with language selector, alert boxes, Mermaid diagram templates, horizontal rules, and image placeholders."`

**Unique detail:** A small code snippet preview:
```
| Header | Header |
|--------|--------|
| Cell   | Cell   |
```
In `var(--font-mono)`, 9px, `var(--accent-jade)` color for the table structure characters.

---

### Card 9 — Fullscreen Mode 🖥️

**Category Color:** Indigo
**Icon bg/color:** Indigo treatment

**Heading:** `"Fullscreen Mode"`
**Description:** `"Go fully immersive with F11. The browser's native fullscreen API removes everything — address bar, tab strip, system taskbar — leaving you with maximum writing space and zero visual distractions."`

**Unique detail:** Keyboard shortcut badge `"F11"` in the same style as Focus Mode's badge:
- `var(--font-mono)`, 10px, weight 600
- `var(--bg-code-inline)` background
- Padding 3px 8px, radius 4px

---

### Advanced Features — Scroll Animation

All 9 cards stagger-fade-in when section enters viewport:
- Row 1 (cards 1-3): delays 0ms, 80ms, 160ms
- Row 2 (cards 4-6): delays 240ms, 320ms, 400ms
- Row 3 (cards 7-9): delays 480ms, 560ms, 640ms
- Duration: 500ms each, easing: `var(--ease-out)`

### Advanced Features — Mobile Layout

**Tablet:** 2 columns (with one card spanning full width for the 3rd in each row, or 3×3 becomes 2-2-2-2-1)

Actually, cleaner approach:
```
Tablet: grid-template-columns: repeat(2, 1fr);
```
- 9 cards arranged in 5 rows: 2-2-2-2-1 (last card centered)

**Mobile:** Single column
```
grid-template-columns: 1fr;
```
- All 9 cards stacked vertically
- Card padding reduces to 24px
- Min-height: auto

---

# 14. 📤 SECTION 8 — EXPORT FORMATS DEEP-DIVE

## Purpose

This section gives a detailed, visually rich breakdown of each export format, serving as a mini-showcase for the export capability — which is a key selling point of the editor.

## Container

**Background:** `var(--bg-page-alt)`
**Padding:** `80px 32px`
**Max-width:** 1100px centered

## Section Header

**Text-align:** Center

**Eyebrow:** `"EXPORT FORMATS"` — standard eyebrow, `var(--accent-orange)` color, 📤 icon

**Heading:**
- Text: `"Your Content, Your Format"`
- `var(--text-h2)`, weight 700
- `"Your Format"` — `var(--accent-orange)` color

**Sub-text:** `"Write once in Markdown. Export to any format with a single click. Every export is polished and production-ready."` — 18px, `var(--text-secondary)`, max-width 580px

## Format Cards — Horizontal Scrolling Bento

**Layout:** A 4-card horizontal row on desktop, horizontally scrollable on mobile

```css
display: grid;
grid-template-columns: repeat(4, 1fr);
gap: 20px;
```

### Format Card — Universal Template

**Size:** Equal width (1/4 of container)
**Border-radius:** `var(--radius-xl)` = 20px
**Padding:** `28px`
**Min-height:** 280px
**Position:** relative

**Top accent stripe:** A 4px gradient bar at the top of each card (inside border), using the format's assigned color. Unlike the advanced features section where this appears on hover, here it is **always visible**, creating a colorful section.

### Card 1 — PDF Export 📄

**Accent Color:** `#E74C3C` (rich red — universally associated with PDF)
**Top stripe gradient:** `linear-gradient(90deg, #E74C3C, #C0392B)`

**Card Surface:**
- Light: white card with subtle red-tinted top
- Dark: dark card with red glow-line at top

**Icon Area:**
- A stylized PDF document icon:
  - 60px × 72px rounded rectangle with folded corner (the classic document icon)
  - Fill: `rgba(231,76,60,0.08)` (Light) / `rgba(231,76,60,0.1)` (Dark)
  - Stroke/border: `#E74C3C` at 30% opacity
  - `"PDF"` text centered inside: 14px, weight 900, `#E74C3C`
  - Folded corner triangle in top-right: slightly darker red fill
- Margin-bottom: 20px

**Heading:** `"PDF"` — 22px, weight 800, `var(--text-heading)`
**Sub-heading:** `"Print-Ready Documents"` — 13px, weight 500, `var(--text-tertiary)`

**Description:** `"Generate beautifully formatted PDF files that preserve all your markdown styling — headings, code syntax highlighting, rendered Mermaid diagrams, KaTeX equations, tables, and images. Professional quality output ready for printing or sharing."` — 14px, `var(--text-secondary)`

**Feature tags:** `"Preserves Styling"` · `"Print Ready"` · `"Diagrams Included"`
- Tags use red-tinted background

---

### Card 2 — HTML Export 🌐

**Accent Color:** `#3498DB` (confident blue — web)
**Top stripe gradient:** `linear-gradient(90deg, #3498DB, #2980B9)`

**Icon Area:**
- Stylized HTML document with angle brackets `"< >"`:
  - Same 60×72 document shape but with blue treatment
  - `"HTML"` text inside: 14px, weight 900, `#3498DB`

**Heading:** `"HTML"`
**Sub-heading:** `"Standalone Web Files"`

**Description:** `"Export a complete, self-contained HTML file with all CSS styles embedded inline. Open it in any browser and it looks identical to your preview — no external dependencies, no CDN links, no broken styles. Perfect for sharing via email or hosting."`

**Feature tags:** `"Embedded CSS"` · `"Self-Contained"` · `"Any Browser"`

---

### Card 3 — Markdown Export 📝

**Accent Color:** `var(--accent-jade)` (green — growth/creation)
**Top stripe gradient:** `linear-gradient(90deg, var(--accent-jade), var(--accent-jade-hover))`

**Icon Area:**
- Document shape with `"MD"` text, jade-colored treatment

**Heading:** `"Markdown"`
**Sub-heading:** `"Raw Source Files"`

**Description:** `"Download the raw .md source file exactly as you wrote it. Perfect for version control with Git, uploading to GitHub, or using with other markdown processors like Jekyll, Hugo, or Gatsby. Your content stays portable and future-proof."`

**Feature tags:** `"Git Ready"` · `"Portable"` · `"Future-Proof"`

---

### Card 4 — Clipboard Copy 📋

**Accent Color:** `var(--accent-indigo)` (purple — utility)
**Top stripe gradient:** `linear-gradient(90deg, var(--accent-indigo), var(--accent-indigo-hover))`

**Icon Area:**
- Clipboard shape with `"COPY"` text, indigo treatment

**Heading:** `"Clipboard"`
**Sub-heading:** `"Instant Sharing"`

**Description:** `"Copy rendered HTML or raw markdown to your system clipboard with a single click. Paste directly into Gmail, Notion, Slack, WordPress, or any platform that accepts rich text or markdown. The fastest path from writing to sharing."`

**Feature tags:** `"One Click"` · `"Rich Text"` · `"Paste Anywhere"`

---

### Export Cards — Hover & Animation

**Hover:**
- Standard card lift (`translateY(-5px)`) — slightly more than standard for emphasis
- Shadow increases dramatically to `var(--shadow-xl)`
- The top accent stripe gains a subtle glow matching the format's color
- Icon document shape does a slight `rotate(-3deg)` tilt (playful paper lift)

**Scroll Entrance:** All 4 stagger from left to right, 120ms delay between each

### Export Section — Mobile Layout

**Tablet:** 2×2 grid
**Mobile:** Horizontal scroll container (CSS `overflow-x: auto; scroll-snap-type: x mandatory;`):
- Each card: `min-width: 280px; scroll-snap-align: start;`
- Container shows slight overflow hint (next card peeking from right edge)
- Horizontal scrollbar styled or hidden
- OR: Stack vertically (1 column, reduced height)

---

# 15. 💬 SECTION 9 — TESTIMONIALS / SOCIAL PROOF

## Container

**Background:** `var(--bg-page)` — primary page background
**Padding:** `80px 32px`
**Max-width:** 1280px centered

## Section Header

**Text-align:** Center

**Eyebrow:** `"DEVELOPER LOVE"` — `var(--accent-jade)` color, ❤️ icon

**Heading:**
- Text: `"Trusted by Developers Who Care About Their Craft"`
- `var(--text-h2)`, weight 700
- `"Care About Their Craft"` — `var(--accent-jade)` color

**Sub-text:**
- Text: `"Don't just take our word for it. Here's what developers are saying about Markups."`
- 18px, `var(--text-secondary)`
- Margin-bottom: 48px

## Bento Grid Layout

```css
display: grid;
grid-template-columns: repeat(12, 1fr);
gap: 20px;
```

**Grid Map:**
```
Row 1: [FEATURED #1────────────] [REVIEW #2──────] [RATING────]
        col 1──────────────5      col 6────────9    col 10───12
        (spans 2 rows)            (1 row)           (spans 2 rows)

Row 2: [FEATURED #1 cont──────] [REVIEW #3──────]  [RATING cont]
                                  col 6────────9

Row 3: [REVIEW #4──────] [REVIEW #5──────] [COMMUNITY────]
        col 1──────4      col 5────────8    col 9────────12
```

---

### Featured Testimonial Card (#1 — Large)

**Grid Position:** `grid-column: 1 / 6; grid-row: 1 / 3;`
**Spans:** 5 columns, 2 rows

**Card Surface:**
Light:
```
background: var(--bg-card-tint-jade); /* #EDF8F2 */
border: 1px solid var(--border-jade);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-md-light);
```

Dark:
```
background: var(--bg-card-tint-jade);
border: 1px solid var(--border-glow-jade);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-md-dark), 0 0 24px rgba(61,220,132,0.06);
```

**Padding:** `36px`

**Layout:** Flex column, justify-content space-between

**Opening Quote Mark:**
- Character: `"❝"` or large curly opening quote
- Font: `var(--font-display)`, 80px, weight 900
- Color: `var(--accent-jade)` at 15% opacity
- Line-height: 0.8
- Margin-bottom: 8px (the quote text starts right below the huge quote mark)

**Quote Text:**
- Text: `"Markups completely replaced my previous markdown editor. The Monaco editor integration is brilliant — it feels like writing in VS Code but with instant beautiful preview. The Mermaid diagram support is a game-changer for my technical documentation workflow."`
- Font: `var(--text-quote)` = 18px, weight 500
- Font-style: italic
- Color: `var(--text-heading)` — full-weight color for the featured quote
- Line-height: 1.75
- Margin-bottom: 28px

**Author Area:**
Layout: `display: flex; align-items: center; gap: 14px;`

Avatar:
- 52px × 52px circle
- `border-radius: var(--radius-full)`
- Border: `2.5px solid var(--accent-jade)` at 30% opacity (a colored ring around the avatar)
- Image: A high-quality headshot placeholder (or generated avatar)
- `object-fit: cover`

Author info (text column next to avatar):
- Name: `"Alex Chen"` — 16px, weight 700, `var(--text-heading)`
- Title: `"Senior Developer at TechCorp"` — 13px, weight 400, `var(--text-tertiary)`
- Stars (below title): ⭐⭐⭐⭐⭐ — 5 gold star emoji at 14px, with 2px gap between each. Color: `var(--accent-gold)`

---

### Standard Testimonial Cards (#2 — #5)

# 🏯 MARKUPS — LANDING PAGE DESIGN SPECIFICATION (CONTINUED — Part 4)

---

### Standard Testimonial Cards (#2 — #5) — Universal Template

Each standard testimonial card follows this identical structure:

**Card Surface:**
Light:
```
background: var(--bg-card-glass);
backdrop-filter: blur(20px) saturate(1.4);
border: 1px solid rgba(255,255,255,0.6);
border-radius: var(--radius-xl); /* 20px */
box-shadow: var(--shadow-sm-light);
```

Dark:
```
background: var(--bg-card);
border: 1px solid var(--border-default);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-sm-dark);
```

**Padding:** `28px`

**Layout:** `display: flex; flex-direction: column; justify-content: space-between;` — quote at top, author pinned at bottom

**Opening Quote Mark:**
- Character: `"❝"`
- Font: 48px, weight 900
- Color: `var(--text-tertiary)` at 20% opacity
- Line-height: 0.7
- Margin-bottom: 8px

**Quote Text:**
- Font: `var(--text-body)` = 16px, weight 500
- Font-style: italic
- Color: `var(--text-body)`
- Line-height: 1.7

**Author Area:**
Layout: `display: flex; align-items: center; gap: 12px;`
Margin-top: 20px

Avatar:
- 40px × 40px circle
- `border-radius: var(--radius-full)`
- Border: `2px solid var(--border-default)`
- Generic avatar placeholder (different color for each reviewer)

Author Info:
- Name: 14px, weight 700, `var(--text-heading)`
- Title: 12px, weight 400, `var(--text-tertiary)`

Stars Row:
- 5 small gold stars: ⭐ at 12px each
- `display: flex; gap: 1px;`
- Position: below author info, with 6px margin-top
- Color: `var(--accent-gold)`

**Hover State:**
- `transform: translateY(-3px)` with spring easing
- Shadow increases to `var(--shadow-md)`
- The opening quote mark becomes slightly more visible (opacity increases from 20% to 35%)
- Border subtly tints (Light: `var(--border-jade)` at 50% / Dark: `var(--border-glow-jade)` at 50%)

---

### Testimonial Card #2

**Grid Position:** `grid-column: 6 / 10; grid-row: 1 / 2;`
**Spans:** 4 columns, 1 row

**Quote Text:** `"The export to PDF feature is flawless. I write all my documentation in Markups and export it for clients. Saves me hours every week. The embedded styles in HTML export are perfect for email newsletters too."`

**Author:**
- Avatar: Warm-toned avatar (orange/coral hue generated avatar)
- Name: `"Maya Patel"`
- Title: `"Technical Writer at DocuFlow"`
- Stars: ⭐⭐⭐⭐⭐ (5/5)

---

### Testimonial Card #3

**Grid Position:** `grid-column: 6 / 10; grid-row: 2 / 3;`
**Spans:** 4 columns, 1 row

**Quote Text:** `"Focus mode combined with typewriter mode creates the perfect distraction-free writing experience. I wrote my entire 40-post blog series using Markups. The auto-save feature means I never worry about losing my work."`

**Author:**
- Avatar: Cool-toned avatar (blue/teal hue)
- Name: `"Jordan Lee"`
- Title: `"Content Creator & Blogger"`
- Stars: ⭐⭐⭐⭐⭐ (5/5)

---

### Testimonial Card #4

**Grid Position:** `grid-column: 1 / 5; grid-row: 3 / 4;`
**Spans:** 4 columns, 1 row

**Quote Text:** `"Auto-save has rescued me more times than I can count. Plus the multi-tab support means I can work on README, CHANGELOG, and API docs all at once without switching between tools. It's become my daily driver for all text editing."`

**Author:**
- Avatar: Green-toned avatar
- Name: `"Sam Rivera"`
- Title: `"Full-Stack Developer at StartupHQ"`
- Stars: ⭐⭐⭐⭐⭐ (5/5)

---

### Testimonial Card #5

**Grid Position:** `grid-column: 5 / 9; grid-row: 3 / 4;`
**Spans:** 4 columns, 1 row

**Quote Text:** `"As a computer science professor, I use Markups to create lecture materials with complex LaTeX equations. The KaTeX integration is seamless — renders perfectly every time. My students love the clean output, and I love the zero-setup workflow."`

**Author:**
- Avatar: Purple-toned avatar
- Name: `"Dr. Sarah Kim"`
- Title: `"CS Professor at State University"`
- Stars: ⭐⭐⭐⭐⭐ (5/5)

---

### Rating Summary Card

**Grid Position:** `grid-column: 10 / 13; grid-row: 1 / 3;`
**Spans:** 3 columns, 2 rows

**Card Surface:**
Light:
```
background: var(--bg-card-tint-orange); /* #FFF2ED */
border: 1px solid var(--border-orange);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-md-light);
```

Dark:
```
background: var(--bg-card-tint-orange);
border: 1px solid var(--border-glow-orange);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-md-dark), 0 0 24px rgba(255,107,66,0.06);
```

**Padding:** `32px`
**Layout:** `display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;`

**Content (top to bottom, centered):**

Decorative star circle:
- A 72px × 72px circle
- Background: `var(--accent-orange)` at 10% opacity
- Border: `1.5px solid var(--accent-orange)` at 20% opacity
- `display: flex; align-items: center; justify-content: center;`
- Inside: `"⭐"` emoji at 32px
- Margin-bottom: 20px

Big Rating Number:
- Text: `"4.9"`
- Font: `var(--font-display)`, 56px, weight 900
- Color: `var(--accent-orange)`
- Line-height: 1
- Margin-bottom: 4px

Rating Scale Text:
- Text: `"out of 5.0"`
- Font: 14px, weight 500
- Color: `var(--text-secondary)`
- Margin-bottom: 12px

Star Row:
- ⭐⭐⭐⭐⭐ at 20px each, `var(--accent-gold)` color
- `display: flex; gap: 3px; justify-content: center;`
- Margin-bottom: 16px

Sub-text:
- Text: `"Based on developer feedback"`
- Font: 12px, weight 500
- Color: `var(--text-tertiary)`

Divider:
- A horizontal line, 40px wide, 1px, `var(--border-default)`, centered
- Margin: 16px auto

Additional stat:
- Text: `"100%"`
- Font: 28px, weight 800, `var(--accent-jade)` color
- Below: `"Would recommend"` — 12px, `var(--text-tertiary)`

**Hover:** Subtle lift, star circle does a gentle spin (rotate 0 → 15deg → 0deg over 600ms)

**Scroll Animation:** The `"4.9"` number counts up from `"0.0"` to `"4.9"` over 1.5 seconds when the card enters viewport (similar to hero stat count-up)

---

### Community Statistics Card

**Grid Position:** `grid-column: 9 / 13; grid-row: 3 / 4;`
**Spans:** 4 columns, 1 row

**Card Surface:**
Light:
```
background: var(--bg-card-tint-indigo); /* #EEEFFE */
border: 1px solid var(--border-indigo);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-sm-light);
```

Dark:
```
background: var(--bg-card-tint-indigo);
border: 1px solid var(--border-glow-indigo);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-sm-dark), 0 0 20px rgba(124,138,255,0.06);
```

**Padding:** `28px`

**Layout:** `display: flex; flex-direction: column; gap: 16px;`

**Top Row — GitHub Stats:**
Layout: `display: flex; align-items: center; gap: 16px;`

GitHub icon:
- 40px × 40px circle
- Background: `var(--accent-indigo)` at 10% opacity
- Inside: GitHub octocat SVG logo at 20px, `var(--accent-indigo)` color

Stats column:
- `"GitHub Stars"` — 11px, uppercase, weight 700, `var(--text-tertiary)`, letter-spacing 0.06em
- Star count: `"⭐ 2+"` — 24px, weight 800, `var(--accent-indigo)` — the number portion animates from 0 to 2 on scroll

**Middle — License Badge:**
- Full-width badge: `"📄 MIT Licensed — Free Forever"`
- Background: `var(--bg-card)` (white/dark surface)
- Border: `1px solid var(--border-subtle)`
- Border-radius: `var(--radius-md)` = 12px
- Padding: 10px 16px
- Font: 13px, weight 600, `var(--text-body)`
- `display: flex; align-items: center; gap: 8px;`

**Bottom Row — Quick Stats:**
Layout: `display: flex; gap: 12px;`

Three mini-stat cards in a row:
```
┌───────┐  ┌───────┐  ┌───────┐
│  20+  │  │  4    │  │  8+   │
│Feature│  │Export │  │Theme │
└───────┘  └───────┘  └───────┘
```

Each mini-stat:
- `flex: 1;`
- Background: `var(--bg-card)` (white/dark)
- Border: `1px solid var(--border-subtle)`
- Border-radius: `var(--radius-sm)` = 8px
- Padding: 8px
- Text-align: center
- Number: 16px, weight 800, `var(--accent-indigo)`
- Label: 9px, weight 600, `var(--text-tertiary)`, uppercase

**Hover:** Standard lift + the GitHub icon circle does a subtle rotation (360° over 1s on hover)

---

### Testimonials Section — Scroll Animation

All testimonial cards and the rating/community cards fade-stagger in:

| Element | Delay |
|---------|-------|
| Featured #1 | 0ms |
| Review #2 | 100ms |
| Rating Card | 150ms |
| Review #3 | 250ms |
| Review #4 | 350ms |
| Review #5 | 450ms |
| Community Card | 500ms |

Duration: 600ms each, easing: `var(--ease-out)`

### Testimonials — Mobile Layout

**Tablet (768px — 1023px):**
```
grid-template-columns: repeat(6, 1fr);
```
- Featured: span 6 cols (full width)
- Rating: span 6 cols (full width, horizontal layout instead of vertical)
- Reviews #2-5: span 3 cols each (2 per row)
- Community: span 6 cols

**Mobile (< 768px):**
```
grid-template-columns: 1fr;
```
- Everything single column stacked
- Featured testimonial: padding 24px, quote font 16px
- Rating card: horizontal layout (number + stars on left, text on right)
- Standard reviews: full width each
- Community card: full width, mini-stats stay 3-per-row

---

# 16. ⚖️ SECTION 10 — COMPARISON TABLE SECTION

## Purpose

This section directly addresses the "why choose Markups over alternatives?" question by presenting a clear, visual comparison table showing Markups against common alternatives (Notion, Typora, VS Code with extensions, StackEdit, etc.).

## Container

**Background:** `var(--bg-page-alt)`
**Padding:** `80px 32px`
**Max-width:** 1100px centered

## Section Header

**Text-align:** Center

**Eyebrow:** `"WHY MARKUPS?"` — `var(--accent-jade)` color, `"🏆"` icon

**Heading:**
- Text: `"See How Markups Compares"`
- `var(--text-h2)`, weight 700
- `"Compares"` — `var(--accent-jade)` color

**Sub-text:** `"We built Markups to be the most complete free markdown editor. Here's how it stacks up against the alternatives."` — 18px, `var(--text-secondary)`, max-width 600px

**Margin-bottom:** 48px

## Comparison Table Design

**Container:**
```
border-radius: var(--radius-xl); /* 20px */
overflow: hidden;
border: 1px solid var(--border-default);
box-shadow: var(--shadow-lg-light) / var(--shadow-lg-dark);
```

### Table Header Row

**Height:** 64px
**Background:**
- Light: `var(--bg-card)` — white
- Dark: `var(--bg-card)` — #161820

**Layout:** CSS Grid:
```css
grid-template-columns: 200px repeat(5, 1fr);
```

**First column (Feature names):** Empty or `"Features"` label
**Remaining 5 columns — Tool names:**

| Column | Tool Name | Is Highlighted? |
|--------|-----------|-----------------|
| 1 | **Markups** | ✅ YES — this is our product |
| 2 | `"Typora"` | No |
| 3 | `"StackEdit"` | No |
| 4 | `"VS Code"` | No |
| 5 | `"Notion"` | No |

**Markups column header styling:**
- Background: `var(--accent-jade)` at 8% opacity (Light) / at 10% (Dark)
- Text: `"✨ Markups"` — 14px, weight 800, `var(--accent-jade)` color
- A small `"FREE"` pill badge above or below the name: 9px, `var(--accent-jade)` bg, white text, border-radius 999px, padding 2px 6px
- This column has a subtle top border: `3px solid var(--accent-jade)` — visually marking it as the protagonist

**Other column headers:**
- Text: Tool name — 14px, weight 600, `var(--text-secondary)`
- Plain styling, no special background

### Table Body Rows

**Row height:** 52px each
**Alternating row backgrounds:**
- Even rows: `var(--bg-card)` (Light: white / Dark: #161820)
- Odd rows: `var(--bg-page-alt)` (Light: #F4F2ED / Dark: #10121A)

**Horizontal dividers:** `1px solid var(--border-subtle)` between each row

**First column — Feature name:**
- Text: 14px, weight 600, `var(--text-heading)`
- Padding-left: 24px
- Some feature names include a tiny emoji icon before the text

**Data cells (columns 2-6) — Feature availability:**

Three possible states:

**✅ Yes / Available:**
- A green checkmark circle: 24px × 24px
- Background: `var(--accent-jade)` at 12% opacity
- Checkmark: `"✓"` in `var(--accent-jade)` color, 13px, weight 700
- Border-radius: 999px
- Centered in cell

**❌ No / Not Available:**
- A muted X mark: `"✕"` in `var(--text-muted)` color, 13px, weight 500
- No background circle — intentionally less prominent than the check (we want checks to pop)

**⚠️ Partial / Requires Setup:**
- A yellow/amber circle: 24px × 24px
- Background: `rgba(212, 168, 67, 0.12)`
- Text: `"~"` (tilde) or `"⚡"` in `var(--accent-gold)` color, 13px
- Tooltip on hover: explains what "partial" means for that feature (e.g., "Requires extensions")

**Markups column cells get special treatment:**
- The entire column has a persistent subtle jade tint background: `var(--accent-jade)` at 3% opacity
- Left and right borders: `1px solid var(--accent-jade)` at 10% opacity — creating a "highlighted column" effect
- Checkmarks in this column are slightly larger (28px circle) and bolder

### Table Data (Feature Comparison)

| Feature | ✨ Markups | Typora | StackEdit | VS Code | Notion |
|---------|-----------|--------|-----------|---------|--------|
| 🆓 Free & Open Source | ✅ | ❌ ($15) | ✅ | ✅ | ⚠️ (Freemium) |
| 💻 Browser-Based (No Install) | ✅ | ❌ | ✅ | ❌ | ✅ |
| ⚡ Monaco Editor (VS Code Engine) | ✅ | ❌ | ❌ | ✅ | ❌ |
| 👁️ Live Split Preview | ✅ | ⚠️ (Inline only) | ✅ | ⚠️ (Extension) | ❌ |
| 📊 Mermaid Diagrams | ✅ | ⚠️ (Limited) | ❌ | ⚠️ (Extension) | ✅ |
| 📐 KaTeX Math | ✅ | ✅ | ✅ | ⚠️ (Extension) | ✅ |
| 📤 PDF Export | ✅ | ✅ | ❌ | ⚠️ (Extension) | ✅ |
| 🌐 HTML Export | ✅ | ✅ | ✅ | ⚠️ (Extension) | ❌ |
| 📑 Multi-Tab Editing | ✅ | ❌ | ❌ | ✅ | ❌ |
| 🎨 8+ Editor Themes | ✅ | ✅ | ❌ | ✅ | ❌ |
| 📱 PWA / Offline Support | ✅ | ✅ (Desktop) | ❌ | ✅ (Desktop) | ❌ |
| 💾 Auto-Save | ✅ | ✅ | ✅ | ⚠️ (Config) | ✅ |
| 🎯 Focus / Typewriter Mode | ✅ | ✅ | ❌ | ❌ | ❌ |
| 📊 Writing Goals & Stats | ✅ | ❌ | ❌ | ❌ | ❌ |
| ⌨️ Keyboard Shortcuts | ✅ | ✅ | ⚠️ (Limited) | ✅ | ⚠️ (Limited) |
| 📚 Built-in Templates | ✅ | ❌ | ❌ | ⚠️ (Extension) | ✅ |

### Table Footer Row

**Height:** 56px
**Background:** `var(--accent-jade)` at 5% opacity (Light) / at 8% (Dark)

**Content:**
- First column: `"Total ✅"` label — 14px, weight 700
- Markups column: `"16/16"` — 18px, weight 900, `var(--accent-jade)` color, with a small `"🏆"` emoji
- Other columns: Their respective totals in `var(--text-tertiary)`, 14px
  - Typora: `"8/16"`
  - StackEdit: `"6/16"`
  - VS Code: `"7/16"` (with partial credits)
  - Notion: `"6/16"`

The footer makes Markups' dominance visually undeniable.

### Table Interactions

**Row hover:**
- Background of entire row shifts to `var(--accent-jade)` at 3% opacity (Light) / 5% (Dark)
- Feature name text becomes slightly bolder/darker
- Transition: 200ms ease

**Column hover (on header):**
- The entire column gets a subtle highlight (background tint)
- Header text becomes bolder

**Cell hover (⚠️ partial cells only):**
- A tooltip appears below the cell explaining the caveat
- Tooltip: `var(--bg-card)` background, `var(--shadow-lg)`, `var(--radius-sm)` corners, 12px text, max-width 200px
- Arrow/triangle pointing to the cell

### Table — Mobile Layout

**On screens < 768px:**

The full table is too wide for mobile. Two approaches (pick one):

**Approach A — Horizontal scroll:**
```css
.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x proximity;
}
```
- First column (feature names) is sticky: `position: sticky; left: 0; z-index: 2;` with its own background color
- Other columns scroll horizontally
- A subtle gradient fade at the right edge hints at scrollable content:
  ```css
  .table-container::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 40px;
    background: linear-gradient(to right, transparent, var(--bg-page-alt));
    pointer-events: none;
  }
  ```

**Approach B — Collapsed cards:**
- Each row becomes a card showing: Feature name + all 5 tool statuses in a compact grid
- Cards stack vertically
- This is more mobile-native but uses more vertical space

**Recommendation:** Approach A (horizontal scroll with sticky first column) — it preserves the table's comparative power while being usable on mobile.

---

# 17. ❓ SECTION 11 — FAQ ACCORDION SECTION

## Purpose

Address common questions and objections proactively. This section reduces friction for undecided visitors by providing clear, honest answers.

## Container

**Background:** `var(--bg-page)` — primary page background
**Padding:** `80px 32px`
**Max-width:** 800px centered (narrower — FAQ is a focused reading section)

## Section Header

**Text-align:** Center

**Eyebrow:** `"FREQUENTLY ASKED"` — `var(--accent-indigo)` color, `"❓"` icon

**Heading:**
- Text: `"Got Questions? We've Got Answers"`
- `var(--text-h2)`, weight 700
- `"Answers"` — `var(--accent-jade)` color

**Sub-text:** `"Everything you need to know about Markups. Can't find your answer? Open an issue on GitHub — we're happy to help."` — 18px, `var(--text-secondary)`

**Margin-bottom:** 48px

## Accordion Design

**Container:** A vertical stack of FAQ items with `gap: 12px` between each

### Accordion Item — Closed State

**Container:**
```
border-radius: var(--radius-lg); /* 16px */
overflow: hidden;
transition: all 0.3s var(--ease-default);
```

Light Mode:
```
background: var(--bg-card);
border: 1px solid var(--border-default);
box-shadow: var(--shadow-xs-light);
```

Dark Mode:
```
background: var(--bg-card);
border: 1px solid var(--border-default);
box-shadow: var(--shadow-xs-dark);
```

**Question Row (always visible, acts as toggle button):**
- `cursor: pointer;`
- `display: flex; align-items: center; justify-content: space-between;`
- Padding: `20px 24px`
- Min-height: 60px

**Question Text:**
- Font: `var(--text-h6)` = 17px, weight 600
- Color: `var(--text-heading)`

**Toggle Icon (right side):**
- A `"+"` icon OR a chevron `"›"` rotated
- Size: 20px, weight 300 (thin)
- Color: `var(--text-tertiary)`
- Rotation: `rotate(0deg)` when closed
- Container: 32px × 32px circle, `var(--bg-page-alt)` background, `border-radius: 999px`, centered
- Transition: `transform 0.3s var(--ease-default)`

**Hover State (closed):**
- Background: very subtle tint — `var(--accent-jade)` at 2% opacity (Light) / 3% (Dark)
- Border: tints slightly toward jade
- Toggle icon circle: background becomes `var(--accent-jade)` at 8% opacity, icon color becomes `var(--accent-jade)`

### Accordion Item — Open State

**Container changes:**
```
background: var(--bg-card); /* same */
border-color: var(--accent-jade) at 20% opacity; /* jade tint */
box-shadow: var(--shadow-md); /* increased shadow */
```

Dark mode: subtle jade glow added to box-shadow

**Question Row changes:**
- Border-bottom: `1px solid var(--border-subtle)` — separates question from answer
- Question text color: `var(--accent-jade)` — indicates active state

**Toggle Icon:**
- Rotates to `rotate(45deg)` (the `"+"` becomes an `"×"`) OR chevron rotates `rotate(90deg)` downward
- Color: `var(--accent-jade)`
- Background: `var(--accent-jade)` at 12% opacity

**Answer Area:**
- `max-height: 0; opacity: 0; overflow: hidden;` → `max-height: 500px; opacity: 1;` (or use CSS `details/summary` with custom styling)
- Transition: `max-height 0.4s var(--ease-default), opacity 0.3s ease 0.1s` (opacity has slight delay, so content fades in after height expands)
- Padding: `20px 24px` (when open)

**Answer Text:**
- Font: `var(--text-body)` = 16px, weight 400
- Color: `var(--text-body)`
- Line-height: 1.7

**Links within answers:**
- Color: `var(--accent-jade)`
- Text-decoration: underline, `text-underline-offset: 3px`
- Hover: darker jade, underline becomes solid

## FAQ Content — All Questions & Answers

### Q1: `"Is Markups really completely free?"`

**Answer:** `"Yes, 100% free, forever. Markups is an open-source project licensed under the MIT license. There are no hidden fees, no premium tiers, no feature gates, and no 'free trial' limitations. Every single feature — from the Monaco editor to PDF export to Mermaid diagrams — is available to everyone, always. We believe great tools should be accessible to all developers regardless of budget."`

---

### Q2: `"Do I need to create an account or sign up?"`

**Answer:** `"No. There is absolutely no sign-up, login, or account creation required. Just open markups.vercel.app in your browser and start writing immediately. Your documents are saved locally in your browser's storage, so your data stays on your device. We don't collect any personal information because we literally have no backend server to store it on."`

---

### Q3: `"Will I lose my work if I close the browser?"`

**Answer:** `"No. Markups automatically saves every keystroke to your browser's LocalStorage. When you return to the app, your documents will be exactly where you left them — including all tabs, scroll positions, and editing history. The auto-save is nearly instantaneous (within 300ms of your last keystroke). However, if you clear your browser's site data or use a different browser/device, you'll start fresh. We recommend periodically exporting important documents as files for backup."`

---

### Q4: `"Can I use Markups offline?"`

**Answer:** `"Yes! Markups is a Progressive Web App (PWA). You can install it on your desktop or mobile device using your browser's 'Install App' option. Once installed, it works completely offline with full functionality — editing, preview, themes, everything. The only feature that requires internet is initially loading the app. After that, it's fully self-contained."`

---

### Q5: `"What markdown features are supported?"`

**Answer:** `"Markups supports the full CommonMark specification plus GitHub Flavored Markdown (GFM) extensions. This includes: headings, paragraphs, bold, italic, strikethrough, links, images, blockquotes, ordered and unordered lists, task lists with checkboxes, tables with alignment, code blocks with syntax highlighting for 20+ languages, horizontal rules, footnotes, alert/callout blocks (NOTE, TIP, IMPORTANT, WARNING, CAUTION), and automatic URL linking. Additionally, we support Mermaid diagrams and KaTeX mathematical equations."`

---

### Q6: `"How does the PDF export work? Is it high quality?"`

**Answer:** `"The PDF export generates a professionally formatted document that preserves all your markdown styling — properly formatted headings, syntax-highlighted code blocks, rendered Mermaid diagrams as vector graphics, beautiful KaTeX math equations, styled tables, and images. The output is print-ready and suitable for professional documentation, academic papers, or client deliverables. The PDF is generated entirely in your browser — no server-side processing, no data leaves your device."`

---

### Q7: `"Is my data private and secure?"`

**Answer:** `"Absolutely. Markups has no backend server whatsoever. All your documents are stored exclusively in your browser's LocalStorage on your own device. Nothing is transmitted over the internet. We don't track analytics, we don't use cookies for tracking, and we have no database of user content. Your writing is 100% private by architecture, not just by policy. The source code is open — you can verify this yourself on GitHub."`

---

### Q8: `"Can I contribute to the project?"`

**Answer:** `"Yes! We welcome contributions from the community. You can contribute by: submitting bug reports, requesting features, improving documentation, submitting pull requests with code improvements, or simply starring the repository on GitHub to help us gain visibility. Visit our GitHub repository at github.com/Nir-Bhay/markups to get started. The project is built with vanilla JavaScript, Vite, and Monaco Editor — no complex framework knowledge required."`

---

### Q9: `"What browsers are supported?"`

**Answer:** `"Markups works on all modern browsers — Chrome, Firefox, Safari, Edge, Brave, and Opera. We recommend the latest versions for the best experience. The Monaco editor requires WebAssembly support, which is available in all modern browsers released after 2017. Internet Explorer is not supported. On mobile, Chrome for Android and Safari for iOS both work well, and you can install Markups as a PWA for the best mobile experience."`

---

### Q10: `"How is Markups different from just using VS Code?"`

**Answer:** `"While Markups uses the same Monaco editor engine as VS Code, it's purpose-built for markdown writing. You get: instant live preview without any extensions, built-in Mermaid diagram rendering, KaTeX math support out of the box, one-click PDF/HTML export, focus and typewriter modes designed for writers, writing goals and statistics, a curated selection of document templates, and a zero-configuration experience. VS Code is a general-purpose code editor that can be configured for markdown — Markups is a specialized markdown editor that works perfectly from the first second."`

---

### FAQ — Scroll Animation

Accordion items stagger-fade-in from top to bottom:
- Each item: `opacity: 0; transform: translateY(12px)` → `opacity: 1; translateY(0)`
- Stagger delay: 60ms between each item
- Duration: 400ms
- Easing: `var(--ease-out)`

### FAQ — Mobile Layout

No significant changes needed:
- Container max-width naturally adapts (800px → 100% at mobile widths)
- Padding on question row: `16px 20px`
- Padding on answer area: `16px 20px`
- Question text: reduces to 16px
- Everything else remains functional

---

# 18. 🚀 SECTION 12 — FINAL CTA SECTION

## Purpose

The ultimate conversion point. After the visitor has read about features, seen the preview, understood the workflow, read testimonials, and compared alternatives — this section asks them to take action. It must be visually striking, emotionally compelling, and friction-free.

## Container

**Width:** Full viewport (breaks out of max-width for background, content stays constrained)
**Content Max Width:** 800px centered
**Padding:** `120px 32px` — generous vertical padding for dramatic emphasis
**Text-align:** Center

**Background:**

Light Mode:
```
background: linear-gradient(
  135deg,
  #F4F2ED 0%,
  #EDF8F2 35%,
  #EEEFFE 65%,
  #F4F2ED 100%
);
```
A beautiful, soft tri-tonal gradient sweeping from warm cream through jade tint to indigo tint and back. Subtle enough to be elegant, colorful enough to feel special and different from other sections.

Dark Mode:
```
background: linear-gradient(
  135deg,
  #10121A 0%,
  rgba(61,220,132,0.04) 35%,
  rgba(124,138,255,0.04) 65%,
  #10121A 100%
);
```
Same structure but with very subtle color hints glowing through the darkness.

**Background Decorative Elements:**

A series of abstract floating shapes at very low opacity (3-5%), positioned with `position: absolute`:

Shape 1 — Circle:
- Position: top 15%, left 10%
- Size: 180px × 180px
- Border-radius: 999px
- Background: `var(--accent-jade)` at 4% opacity
- Blur: `filter: blur(40px)` — makes it a soft blob

Shape 2 — Rounded Square:
- Position: bottom 20%, right 15%
- Size: 140px × 140px
- Border-radius: 32px
- Background: `var(--accent-indigo)` at 3% opacity
- Blur: 30px

Shape 3 — Oval:
- Position: top 40%, right 25%
- Size: 200px × 100px
- Border-radius: 999px
- Background: `var(--accent-orange)` at 3% opacity
- Blur: 50px

Shape 4 — Small Circle:
- Position: bottom 30%, left 20%
- Size: 80px
- Background: `var(--accent-jade)` at 5% opacity
- Blur: 20px

These shapes are static (not animated), serving as subtle depth and color accents. On mobile, they are hidden.

## Content

### Eyebrow Label
- Text: `"READY TO WRITE?"`
- Standard eyebrow: 12px, weight 700, uppercase, letter-spacing 0.1em
- Color: `var(--accent-jade)`
- `"✨"` icon before text
- Margin-bottom: 16px

### Main Heading
- Text (2 lines):
  ```
  "Start Writing Beautiful
   Markdown Today."
  ```
- Font: `var(--text-h1)` = 56px (slightly larger than standard H2 — this is the climax), weight 800
- Color: `var(--text-heading)`
- Line-height: 1.1

**"Beautiful" word treatment:**
- Color: `var(--accent-jade)`
- Background: `var(--accent-jade-light)` (Light) / `var(--accent-jade-dim)` (Dark)
- Padding: 2px 12px 4px 12px
- Border-radius: 8px
- Same highlighter marker effect as the hero

**"Today." word treatment:**
- Has a period followed by a blinking cursor (1.5px wide, `var(--accent-orange)` color, cursor-blink animation)
- Suggests "you can start right now"

- Margin-bottom: 20px

### Sub-text
- Text: `"No sign-up. No payment. No nonsense. Just open your browser and start creating. Markups is free, open-source, and built for developers who appreciate great tools."`
- Font: `var(--text-body-lg)` = 18px, weight 400
- Color: `var(--text-secondary)`
- Line-height: 1.75
- Max-width: 600px
- Margin: 0 auto 36px auto

### CTA Buttons Group

Layout: `display: flex; justify-content: center; align-items: center; gap: 16px;`
Mobile: `flex-direction: column; width: 100%;`

**Primary CTA — The Main Button:**

This is the most important button on the entire page. It must be unmissable.

Text: `"Launch Markups Editor →"`

Styling:
```
display: inline-flex;
align-items: center;
gap: 8px;
font-family: var(--font-body);
font-size: 18px; /* Larger than standard buttons */
font-weight: 700; /* Bolder than standard */
color: #FFFFFF;
background: var(--accent-orange);
padding: 18px 40px; /* Extra generous */
border-radius: 16px; /* var(--radius-lg) */
border: none;
cursor: pointer;
position: relative;
overflow: hidden;
```

Shadow (resting):
- Light: `0 6px 20px rgba(232, 98, 62, 0.3), 0 3px 6px rgba(232, 98, 62, 0.15)`
- Dark: `0 6px 20px rgba(255, 107, 66, 0.35), 0 0 30px rgba(255, 107, 66, 0.15)`

**Pulsating glow animation (always active, not just on hover):**
```css
@keyframes cta-pulse {
  0%, 100% { 
    box-shadow: 
      0 6px 20px rgba(232, 98, 62, 0.3),
      0 0 0px rgba(232, 98, 62, 0);
  }
  50% { 
    box-shadow: 
      0 6px 20px rgba(232, 98, 62, 0.3),
      0 0 20px rgba(232, 98, 62, 0.15);
  }
}
animation: cta-pulse 2.5s ease-in-out infinite;
```
This creates a subtle breathing glow around the button that draws the eye continuously.

Hover:
```
background: var(--accent-orange-hover);
transform: translateY(-3px) scale(1.02);
box-shadow: 
  0 10px 30px rgba(232, 98, 62, 0.4),
  0 0 30px rgba(232, 98, 62, 0.2);
animation: none; /* Stop pulse, use elevated static state */
```

The `"→"` arrow animates on hover: `margin-left: 0 → 4px` (arrow scoots right, suggesting forward motion)

Shimmer effect (same as hero CTA):
```css
.cta-final::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255,255,255,0.18),
    transparent
  );
  transition: left 0.6s ease;
}
.cta-final:hover::after {
  left: 130%;
}
```

Link: `https://markups.vercel.app`

**Secondary CTA:**

Text: `"⭐ Star on GitHub"`

Styling:
```
display: inline-flex;
align-items: center;
gap: 8px;
font-size: 16px;
font-weight: 600;
color: var(--text-body);
background: transparent;
padding: 16px 32px;
border-radius: 14px;
border: 1.5px solid var(--border-medium);
cursor: pointer;
```

Hover:
```
background: var(--bg-card);
border-color: var(--accent-jade);
color: var(--accent-jade);
transform: translateY(-2px);
box-shadow: var(--shadow-md);
```

The star `"⭐"` does a quick `scale(1) → scale(1.2) → scale(1)` bounce on hover (300ms spring)

Link: `https://github.com/Nir-Bhay/markups`

### Trust Text (Below CTAs)

- Text: `"✨ Free forever  ·  🔓 Open Source (MIT)  ·  🌍 Works everywhere  ·  🔒 100% Private"`
- Font: 14px, weight 500
- Color: `var(--text-tertiary)`
- Margin-top: 24px
- `display: flex; justify-content: center; flex-wrap: wrap; gap: 6px;`

### Scroll Animation

When section enters viewport:
1. Eyebrow fades in: 0ms delay
2. Heading fades in with slight upward drift: 100ms delay
3. Sub-text: 200ms delay
4. Primary CTA: 350ms delay, enters with `scale(0.95) → scale(1)` in addition to the standard fade-up
5. Secondary CTA: 450ms delay
6. Trust text: 550ms delay

The pulsating glow on the primary CTA begins only after it has fully entered and settled (after its entrance animation completes).

---

# 19. 🦶 SECTION 13 — FOOTER

## Design Philosophy

The footer is always rendered in a dark color scheme regardless of the page's current light/dark mode. This is a deliberate design choice: a dark footer creates a natural visual "grounding" at the bottom of the page, signals "the end" clearly, and provides elegant contrast against the lighter content above (in light mode). In dark mode, the footer is simply a slightly darker shade, maintaining consistency.

## Container

**Width:** Full viewport width
**Background:**
- Light mode page: Footer background = `#1A1917` (deep warm charcoal)
- Dark mode page: Footer background = `#08090C` (near-black with blue tint, darker than page bg)

**All text in footer uses light-on-dark colors regardless of page mode.**

**Padding:** `64px 32px 32px 32px`
**Content Max Width:** 1280px centered

## Top Area — 4-Column Grid

```css
display: grid;
grid-template-columns: 2fr 1fr 1fr 1fr;
gap: 48px;
```

The first column (brand) is wider than the other three (navigation columns).

### Column 1 — Brand & Description

**Logo:**
- `"✨ Markups"` — same as nav bar but in white
- Font: `var(--font-display)`, 20px, weight 700
- Color: `#FFFFFF`
- Margin-bottom: 16px

**Description:**
- Text: `"A powerful, free, open-source markdown editor with live preview, Mermaid diagrams, KaTeX math, and multi-format export. Built with love for developers who write."`
- Font: 14px, weight 400
- Color: `rgba(255, 255, 255, 0.45)` — soft, readable but not attention-competing
- Line-height: 1.7
- Max-width: 280px
- Margin-bottom: 24px

**Social Links:**
Layout: `display: flex; gap: 12px;`

Each social link:
- Size: 36px × 36px circle
- Border-radius: 999px
- Background: `rgba(255, 255, 255, 0.06)`
- Border: `1px solid rgba(255, 255, 255, 0.08)`
- Display: `flex; align-items: center; justify-content: center;`
- Icon: SVG, 18px, `rgba(255, 255, 255, 0.4)` color
- Transition: `all 0.2s ease`

Hover:
- Background: `rgba(255, 255, 255, 0.12)`
- Icon color: `#FFFFFF`
- Border: `1px solid rgba(255, 255, 255, 0.2)`
- `transform: translateY(-2px)`

Social platforms:
1. **GitHub** — GitHub octocat logo SVG
2. **Twitter/X** — X logo SVG
3. **Email** — Envelope icon SVG (mailto link)

### Column 2 — Product Links

**Column Title:**
- Text: `"Product"`
- Font: 12px, weight 700, uppercase
- Letter-spacing: 0.08em
- Color: `rgba(255, 255, 255, 0.3)`
- Margin-bottom: 20px
- Position: relative
- Optional: tiny colored line (2px × 16px, `var(--accent-jade)`) to the left of the title, `margin-right: 8px`

**Links (vertical list):**
Each link:
- Font: 14px, weight 400
- Color: `rgba(255, 255, 255, 0.5)`
- Line-height: 2.4 (generous vertical spacing for easy scanning)
- Hover: color → `#FFFFFF`, `translateX(3px)` subtle shift right
- Transition: `color 0.2s ease, transform 0.2s ease`

Links:
1. `"Editor"` → markups.vercel.app
2. `"Features"` → #features (anchor)
3. `"Templates"` → #templates
4. `"Export"` → #export
5. `"Themes"` → #themes

### Column 3 — Resources

**Column Title:** `"Resources"` — same styling as Column 2

**Links:**
1. `"Documentation"` → GitHub README
2. `"Keyboard Shortcuts"` → #shortcuts
3. `"Changelog"` → GitHub releases
4. `"Report a Bug"` → GitHub issues/new
5. `"Request Feature"` → GitHub issues/new with feature label

### Column 4 — Open Source

**Column Title:** `"Open Source"` — same styling

**Links:**
1. `"GitHub Repository"` → github.com/Nir-Bhay/markups
2. `"MIT License"` → LICENSE file on GitHub
3. `"Contributing Guide"` → CONTRIBUTING.md on GitHub
4. `"Star on GitHub"` → github.com/Nir-Bhay/markups (with ⭐ emoji before text, colored `var(--accent-gold)`)
5. `"About the Developer"` → Nir-Bhay's GitHub profile

### Newsletter / Mini-CTA (Optional, at bottom of Column 1)

If space permits, a small inline CTA:

Text: `"Try Markups today — it's free"`
Button: Small pill button `"Open Editor →"`, background `var(--accent-orange)`, color white, 13px, weight 600, padding 8px 16px, border-radius 999px
Hover: lighter orange, `translateY(-1px)`

---

## Bottom Bar — Copyright & Credits

**Separator Line (above bottom bar):**
- Width: 100%
- Height: 1px
- Color: `rgba(255, 255, 255, 0.06)`
- Margin: 40px 0 24px 0

**Layout:** `display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;`

**Left Side — Copyright:**
- Text: `"© 2025 Markups. Made with ❤️ by Nir-Bhay"`
- Font: 13px, weight 400
- Color: `rgba(255, 255, 255, 0.3)`
- The `"❤️"` heart has a subtle `scale(1) → scale(1.15) → scale(1)` pulse animation, `2.5s ease-in-out infinite` — because the product is made with love
- `"Nir-Bhay"` is a link: color `rgba(255,255,255,0.5)`, hover → `#FFFFFF`, links to GitHub profile

**Right Side — Tech Credits:**
- Text: `"Built with Vite · Monaco Editor · Marked"`
- Font: 13px, weight 400
- Color: `rgba(255, 255, 255, 0.2)` — very subtle, almost invisible but present for those who look
- Each technology name can be a link to its respective homepage (same color, hover → brighter)

### Footer — Mobile Layout

**Tablet (768px — 1023px):**
```
grid-template-columns: 1fr 1fr;
```
- Column 1 (brand): spans 2 cols (full width)
- Columns 2-4: 2 per row (Product + Resources on row 2, Open Source alone on row 3)

**Mobile (< 768px):**
```
grid-template-columns: 1fr;
```
- All columns stack vertically
- Each column: full width
- Column titles get extra margin-top: 28px (between columns)
- Brand description max-width: 100%
- Social icons: centered
- Bottom bar: `flex-direction: column; text-align: center; gap: 8px;`

---

# 20. 🎭 GLOBAL ANIMATIONS & MICRO-INTERACTIONS (Complete Reference)

## 20.1 Scroll-Triggered Entrance Animations

**Detection Method:** `IntersectionObserver` API

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // Optionally unobserve for one-time animation:
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.15, // Trigger when 15% of element is visible
  rootMargin: '0px 0px -50px 0px' // Slight offset so animation starts just before element reaches viewport center
});
```

**Default hidden state (CSS):**
```css
[data-animate] {
  opacity: 0;
  transform: translateY(24px);
  transition: 
    opacity var(--duration-slower) var(--ease-out),
    transform var(--duration-slower) var(--ease-out);
}

[data-animate].visible {
  opacity: 1;
  transform: translateY(0);
}
```

**Stagger children:**
```css
[data-animate-stagger] > * {
  opacity: 0;
  transform: translateY(20px);
  transition: 
    opacity var(--duration-slow) var(--ease-out),
    transform var(--duration-slow) var(--ease-out);
}

[data-animate-stagger].visible > *:nth-child(1) { transition-delay: 0ms; opacity: 1; transform: translateY(0); }
[data-animate-stagger].visible > *:nth-child(2) { transition-delay: 80ms; opacity: 1; transform: translateY(0); }
[data-animate-stagger].visible > *:nth-child(3) { transition-delay: 160ms; opacity: 1; transform: translateY(0); }
/* ... continue for more children */
```

**Alternatively, use CSS custom property for dynamic stagger:**
```css
[data-animate-stagger].visible > * {
  opacity: 1;
  transform: translateY(0);
  transition-delay: calc(var(--index, 0) * var(--stagger-delay));
}
```
Each child element gets `style="--index: 0"`, `style="--index: 1"`, etc.

## 20.2 Card Hover Interactions

**Standard Card Hover:**
```css
.bento-card {
  transition: 
    transform var(--duration-normal) var(--ease-spring),
    box-shadow var(--duration-normal) var(--ease-default),
    border-color var(--duration-fast) var(--ease-default);
}

.bento-card:hover {
  transform: translateY(-4px);
  /* Shadow values change based on light/dark mode */
}
```

**Featured Card Hover (Hero, Dashboard, Large Feature Cards):**
```css
.bento-card-featured:hover {
  transform: translateY(-6px);
  /* Even stronger shadow + glow */
}
```

**Small Card Hover:**
```css
.bento-card-small:hover {
  transform: translateY(-3px);
  /* Lighter shadow increase */
}
```

**Card Internal Element Reactions on Hover:**
```css
.bento-card:hover .card-icon {
  transform: scale(1.08) rotate(3deg);
  transition: transform 0.3s var(--ease-spring);
}

.bento-card:hover .card-badge {
  transform: scale(1.05);
  transition: transform 0.3s var(--ease-spring);
}
```

## 20.3 Button Interactions

**All Buttons:**
```css
button, .button, a.button {
  transition: 
    background var(--duration-fast) var(--ease-default),
    transform var(--duration-fast) var(--ease-spring),
    box-shadow var(--duration-fast) var(--ease-default),
    color var(--duration-fast) var(--ease-default),
    border-color var(--duration-fast) var(--ease-default);
}
```

**Primary Button States:**
```css
.btn-primary:hover {
  transform: translateY(-2px) scale(1.01);
  /* Enhanced shadow + glow */
}

.btn-primary:active {
  transform: translateY(0px) scale(0.98);
  /* Reduced shadow */
}

.btn-primary:focus-visible {
  outline: 3px solid var(--accent-jade);
  outline-offset: 3px;
}
```

## 20.4 Link Interactions

**Nav Links — Underline Slide:**
```css
.nav-link {
  position: relative;
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--accent-jade);
  border-radius: 1px;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0.3s var(--ease-spring);
}
.nav-link:hover::after {
  transform: scaleX(1);
}
```

**Body Links — Color + Underline:**
```css
.content-link {
  color: var(--accent-jade);
  text-decoration: underline;
  text-decoration-color: var(--accent-jade-medium);
  text-underline-offset: 3px;
  text-decoration-thickness: 1.5px;
  transition: 
    text-decoration-color 0.2s ease,
    color 0.2s ease;
}
.content-link:hover {
  color: var(--accent-jade-hover);
  text-decoration-color: var(--accent-jade);
}
```

**Footer Links — Slide Right:**
```css
.footer-link {
  transition: color 0.2s ease, transform 0.2s ease;
}
.footer-link:hover {
  color: #FFFFFF;
  transform: translateX(3px);
}
```

## 20.5 Theme Toggle Animation

When the user clicks the theme toggle:

**Body/Global Transition:**
```css
html {
  transition: 
    background-color var(--duration-slow) var(--ease-default),
    color var(--duration-slow) var(--ease-default);
}

/* Apply transition to all major color-affected elements */
*, *::before, *::after {
  transition: 
    background-color var(--duration-slow) var(--ease-default),
    border-color var(--duration-slow) var(--ease-default),
    color 0.4s var(--ease-default),
    box-shadow 0.4s var(--ease-default),
    fill 0.4s var(--ease-default),
    stroke 0.4s var(--ease-default);
}
```

**Important:** The `transition` on `*` should be added temporarily via a class (e.g., `.theme-transitioning`) and removed after 600ms to avoid unintended transitions during normal interactions.

```javascript
document.documentElement.classList.add('theme-transitioning');
// Apply new theme
document.documentElement.setAttribute('data-theme', newTheme);
// Remove transition class after animation completes
setTimeout(() => {
  document.documentElement.classList.remove('theme-transitioning');
}, 600);
```

**Icon Swap Animation (in toggle button):**
```css
.theme-toggle-icon {
  transition: 
    transform 0.3s var(--ease-default),
    opacity 0.2s ease;
}
.theme-toggle-icon.exiting {
  transform: rotate(90deg);
  opacity: 0;
}
.theme-toggle-icon.entering {
  transform: rotate(-90deg);
  opacity: 0;
  /* Then animate to: */
  /* transform: rotate(0deg); opacity: 1; */
}
```

## 20.6 Smooth Page Scroll

```css
html {
  scroll-behavior: smooth;
}

/* For JavaScript-triggered scrolls, use: */
/* element.scrollIntoView({ behavior: 'smooth', block: 'start' }); */
```

**Scroll offset:** Account for sticky nav height (68px) when scrolling to anchor sections:
```css
section[id] {
  scroll-margin-top: 80px; /* 68px nav + 12px buffer */
}
```

## 20.7 Scroll-to-Top Button

**Appearance:** Appears after user scrolls past the hero section (> 100vh from top)
**Position:** `position: fixed; bottom: 32px; right: 32px; z-index: var(--z-max);`

**Design:**
- Size: 48px × 48px circle
- Border-radius: 999px
- Background: `var(--accent-orange)` (same as CTA — visually linked)
- Color: white
- Icon: `"↑"` arrow at 20px, weight 700, OR SVG chevron-up
- Shadow: `var(--shadow-md)` + subtle orange glow (dark mode)

**States:**
```css
.scroll-top {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
  pointer-events: none;
  transition: 
    opacity 0.3s ease,
    transform 0.3s var(--ease-spring);
}
.scroll-top.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}
.scroll-top:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: var(--shadow-lg), 0 0 20px rgba(232,98,62,0.2);
}
.scroll-top:active {
  transform: translateY(0) scale(0.95);
}
```

**Click Action:** Smooth scroll to top of page

**Mobile:** Position changes to `bottom: 24px; right: 24px;`; size stays 48px

## 20.8 Count-Up Number Animations

Used in: Hero stat boxes (20+, 4), Rating card (4.9), Community card stats

**Implementation concept:**
```javascript
function animateCounter(element, target, duration = 1500) {
  const start = 0;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out cubic for decelerating count
    const eased = 1 - Math.pow(1 - progress, 3);
    
    const current = Math.floor(start + (target - start) * eased);
    element.textContent = current + (element.dataset.suffix || '');
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}
```

**Trigger:** Only when element enters viewport (IntersectionObserver), fires once.

## 20.9 Continuous Ambient Animations

These are always running, creating life and subtle motion on the page:

**Hero sparkle emoji rotation:**
```css
.sparkle-icon {
  animation: gentle-rotate 4s ease-in-out infinite;
}
@keyframes gentle-rotate {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(10deg); }
}
```

**Floating pills (dashboard section):**
```css
.floating-pill {
  animation: float-gentle 3.5s ease-in-out infinite;
}
@keyframes float-gentle {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}
/* Stagger with animation-delay */
.floating-pill:nth-child(1) { animation-delay: 0s; }
.floating-pill:nth-child(2) { animation-delay: 1.2s; }
.floating-pill:nth-child(3) { animation-delay: 2.4s; }
.floating-pill:nth-child(4) { animation-delay: 0.8s; }
```

**Editor cursor blink:**
```css
.cursor-blink {
  animation: blink 1.1s step-end infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
```

**CTA button pulse glow (final CTA section):**
```css
.cta-pulse {
  animation: pulse-glow 2.5s ease-in-out infinite;
}
@keyframes pulse-glow {
  0%, 100% { 
    box-shadow: 
      0 6px 20px rgba(232, 98, 62, 0.3),
      0 0 0 rgba(232, 98, 62, 0);
  }
  50% { 
    box-shadow: 
      0 6px 20px rgba(232, 98, 62, 0.3),
      0 0 20px rgba(232, 98, 62, 0.12);
  }
}
```

# 🏯 MARKUPS — LANDING PAGE DESIGN SPECIFICATION (CONTINUED — Part 5)

---

## 20.9 Continuous Ambient Animations (Continued)

**Footer heart pulse:**
```css
.heart-pulse {
  display: inline-block;
  animation: heart-beat 2.5s ease-in-out infinite;
}
@keyframes heart-beat {
  0%, 100% { transform: scale(1); }
  15% { transform: scale(1.15); }
  30% { transform: scale(1); }
  45% { transform: scale(1.1); }
  60% { transform: scale(1); }
}
```
This mimics a realistic heartbeat rhythm — two quick pulses followed by a rest, creating a natural, warm feeling that reinforces "made with love."

**Theme dots wave (Themes card, 6 color dots):**
```css
.theme-dots .dot {
  animation: dot-wave 1.2s ease-in-out infinite;
  animation-play-state: paused; /* Only plays on card hover */
}
.theme-card:hover .theme-dots .dot {
  animation-play-state: running;
}
.theme-dots .dot:nth-child(1) { animation-delay: 0ms; }
.theme-dots .dot:nth-child(2) { animation-delay: 60ms; }
.theme-dots .dot:nth-child(3) { animation-delay: 120ms; }
.theme-dots .dot:nth-child(4) { animation-delay: 180ms; }
.theme-dots .dot:nth-child(5) { animation-delay: 240ms; }
.theme-dots .dot:nth-child(6) { animation-delay: 300ms; }

@keyframes dot-wave {
  0%, 100% { transform: scale(1) translateY(0); }
  40% { transform: scale(1.2) translateY(-3px); }
  60% { transform: scale(0.9) translateY(1px); }
}
```
Creates a satisfying "Mexican wave" ripple through the theme color dots when the themes card is hovered.

**Writing Goals progress bar fill (Advanced Features card):**
```css
.progress-fill {
  width: 0%;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
.advanced-card:hover .progress-fill,
.advanced-card.visible .progress-fill {
  width: 68%;
}
```
The progress bar fills from 0% to 68% either on card hover or when the card first enters viewport, creating a satisfying visual "loading" effect.

**Mermaid diagram arrow draw:**
```css
.mermaid-arrow {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  transition: stroke-dashoffset 0.6s ease-out;
}
.mermaid-card:hover .mermaid-arrow {
  stroke-dashoffset: 0;
}
```
SVG arrows in the mini Mermaid diagram illustration "draw" themselves when the card is hovered — the line progressively appears from start to end.

**Keyboard keycap press:**
```css
.keycap {
  transition: transform 0.15s ease, border-bottom-width 0.15s ease;
}
.shortcuts-card:hover .keycap {
  animation: keycap-press 0.4s ease;
  animation-fill-mode: none;
}
.shortcuts-card:hover .keycap:nth-child(1) { animation-delay: 0ms; }
.shortcuts-card:hover .keycap:nth-child(2) { animation-delay: 100ms; }
.shortcuts-card:hover .keycap:nth-child(3) { animation-delay: 200ms; }
.shortcuts-card:hover .keycap:nth-child(4) { animation-delay: 300ms; }

@keyframes keycap-press {
  0% { transform: translateY(0px); border-bottom-width: 3px; }
  50% { transform: translateY(2px); border-bottom-width: 1px; }
  100% { transform: translateY(0px); border-bottom-width: 3px; }
}
```
Each keycap presses down sequentially when the keyboard shortcuts card is hovered, simulating actual typing.

**TOC item sequential highlight:**
```css
.toc-item {
  transition: color 0.2s ease;
}
.toc-card:hover .toc-item:nth-child(1) { animation: toc-highlight 0.3s ease 0ms both; }
.toc-card:hover .toc-item:nth-child(2) { animation: toc-highlight 0.3s ease 100ms both; }
.toc-card:hover .toc-item:nth-child(3) { animation: toc-highlight 0.3s ease 200ms both; }
.toc-card:hover .toc-item:nth-child(4) { animation: toc-highlight 0.3s ease 300ms both; }
.toc-card:hover .toc-item:nth-child(5) { animation: toc-highlight 0.3s ease 400ms both; }

@keyframes toc-highlight {
  0%, 100% { color: var(--text-tertiary); }
  50% { color: var(--accent-indigo); }
}
```
Table of Contents items flash with indigo color one after another, simulating someone "navigating through sections."

**Auto-save dot pulse:**
```css
.save-dot {
  animation: save-pulse 1.5s ease-in-out infinite;
  animation-play-state: paused;
}
.autosave-card:hover .save-dot {
  animation-play-state: running;
}

@keyframes save-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.85); }
}
```
The green "saved" indicator dot gently pulses when the auto-save card is hovered, communicating "actively saving."

**Export format mini-cards bounce:**
```css
.export-card:hover .format-mini-card:nth-child(1) { animation: mini-bounce 0.4s var(--ease-spring) 0ms both; }
.export-card:hover .format-mini-card:nth-child(2) { animation: mini-bounce 0.4s var(--ease-spring) 80ms both; }
.export-card:hover .format-mini-card:nth-child(3) { animation: mini-bounce 0.4s var(--ease-spring) 160ms both; }
.export-card:hover .format-mini-card:nth-child(4) { animation: mini-bounce 0.4s var(--ease-spring) 240ms both; }

@keyframes mini-bounce {
  0% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0); }
}
```
The four export format mini-cards (PDF, HTML, MD, Copy) bounce sequentially when the export card is hovered.

**Tab active indicator slide (Multi-Tab card):**
```css
.tab-indicator {
  position: absolute;
  bottom: 0;
  height: 2px;
  background: var(--accent-jade);
  border-radius: 1px;
  transition: left 0.4s var(--ease-spring), width 0.4s var(--ease-spring);
}
.multitab-card:hover .tab-indicator {
  animation: tab-slide 1.5s ease-in-out infinite;
}

@keyframes tab-slide {
  0%, 100% { left: 0; width: 60px; }
  33% { left: 66px; width: 60px; }
  66% { left: 132px; width: 60px; }
}
```
The active tab indicator line slides between the three mock tabs, showing multi-tab switching in action.

---

## 20.10 Performance Rules for Animations

**Rule 1 — Only animate `transform` and `opacity`:** These properties are handled by the GPU compositor and don't trigger layout or paint recalculations. Avoid animating `width`, `height`, `top`, `left`, `margin`, `padding`, `border-width`, or `font-size` — these cause expensive reflows.

**Exception:** `box-shadow` transitions are acceptable for hover states because they occur on user interaction and are brief. But never use `box-shadow` in continuous/infinite animations.

**Rule 2 — Use `will-change` sparingly:**
```css
.bento-card {
  will-change: transform;
}
.floating-pill {
  will-change: transform;
}
```
Only apply `will-change` to elements that actually animate frequently. Too many `will-change` declarations waste GPU memory.

**Rule 3 — Respect `prefers-reduced-motion`:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .floating-pill,
  .sparkle-icon,
  .heart-pulse,
  .cta-pulse,
  .cursor-blink {
    animation: none !important;
  }
  
  /* Entrance animations still work but are instant */
  [data-animate] {
    opacity: 1 !important;
    transform: none !important;
  }
}
```
Users who have requested reduced motion in their OS settings will see a completely static page — no floating elements, no entrance animations, no hover lifts, no pulses. Content and functionality remain identical.

**Rule 4 — Use `content-visibility: auto` for off-screen sections:**
```css
section:not(:first-of-type) {
  content-visibility: auto;
  contain-intrinsic-size: auto 600px; /* Approximate section height */
}
```
This tells the browser to skip rendering off-screen sections until they're near the viewport, dramatically improving initial page load performance.

**Rule 5 — Debounce scroll-based calculations:**
Any JavaScript that runs on scroll events (like parallax, scroll-to-top button visibility) must be debounced or use `requestAnimationFrame`:
```javascript
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      // Do scroll-based calculations here
      ticking = false;
    });
    ticking = true;
  }
});
```

---

# 21. 📱 RESPONSIVE DESIGN COMPLETE BREAKDOWN

## Breakpoint System

| Breakpoint Name | Min Width | Max Width | Description |
|----------------|-----------|-----------|-------------|
| `xs` (Small Mobile) | 0px | 479px | iPhone SE, small Android phones |
| `sm` (Mobile) | 480px | 767px | Standard smartphones in portrait |
| `md` (Tablet) | 768px | 1023px | iPads, Android tablets, large phones in landscape |
| `lg` (Desktop) | 1024px | 1279px | Small laptops, standard desktop monitors |
| `xl` (Wide Desktop) | 1280px | 1535px | Standard wide monitors — this is the primary design target |
| `2xl` (Ultra Wide) | 1536px | ∞ | Large/Ultra-wide monitors |

## Breakpoint-by-Breakpoint Section Layout Reference

### Navigation Bar

| Property | xs-sm (< 768px) | md (768-1023px) | lg+ (≥ 1024px) |
|----------|-----------------|-----------------|-----------------|
| Height | 56px | 60px | 68px |
| Padding-x | 20px | 24px | 32px |
| Logo text | 18px | 19px | 21px |
| Center nav links | Hidden (hamburger) | Hidden (hamburger) | Visible |
| GitHub Star button | Hidden | Visible (icon only, no text) | Visible (full text) |
| Theme toggle | Visible (36px) | Visible (38px) | Visible (40px) |
| Primary CTA | Hidden (in mobile menu) | Hidden (in mobile menu) | Visible |
| Hamburger | Visible | Visible | Hidden |

### Hero Section

| Property | xs (< 480px) | sm (480-767px) | md (768-1023px) | lg+ (≥ 1024px) |
|----------|-------------|----------------|-----------------|-----------------|
| Grid columns | 1 | 2 | 6 | 12 |
| Grid gap | 12px | 14px | 16px | 20px |
| Container padding-top | 72px | 80px | 88px | 96px |
| Container padding-x | 20px | 20px | 24px | 32px |
| Box A — span | Full (1 col) | Full (2 cols) | Full (6 cols) | 7 of 12 cols, 2 rows |
| Box A — padding | 24px | 28px | 32px | 48px |
| H1 size | 32px | 38px | 48px | 72px |
| H1 line-height | 1.1 | 1.08 | 1.06 | 1.05 |
| Sub-headline size | 15px | 16px | 17px | 18px |
| Sub-headline max-width | 100% | 100% | 480px | 560px |
| CTAs layout | Column (stacked) | Column (stacked) | Row | Row |
| CTA button width | 100% | 100% | auto | auto |
| CTA button padding | 14px 24px | 14px 28px | 15px 30px | 16px 32px |
| CTA font size | 15px | 15px | 16px | 16px |
| Trust text | 12px, wrap | 12px, wrap | 13px, inline | 13px, inline |
| Box B & C | Side by side (1col each in 2-col grid) | Side by side | 3+3 cols in 6-col grid | 3+2 cols in 12-col grid |
| Box B & C — number size | 28px | 32px | 40px | 48px |
| Box D (Benefits) | Full width, items stack vertically | Full width, items row | Full (6 cols) | 5 cols |
| Benefit items layout | Column (stacked) | Row (3 items) | Row (3 items) | Row (3 items) |
| Box E (Teaser) | Full width, height 180px | Full, 200px | Full (6 cols), 220px | 5 cols, auto |
| Box F (Tech Stack) | Full width | Full width | 2 cols | 2 cols |
| Box G (Trust) | Full width | Full width | 4 cols | 5 cols |
| Avatar size | 32px | 34px | 36px | 38px |
| Background decorative glows | Hidden | Reduced opacity | Full | Full |

**Eyebrow pill note for mobile:** On `xs`, the eyebrow text truncates or wraps. Consider shortening to `"✨ FREE & OPEN SOURCE"` → `"✨ FREE"` at smallest breakpoint if needed.

**"Beautiful" highlight on mobile:** Ensure the background highlight has enough padding to not look cramped at smaller H1 sizes. At 32px H1, the highlight padding reduces to `1px 6px 2px`.

**"Instantly" underline animation on mobile:** Still plays, just thinner (2px instead of 4px) and shorter delay (0.8s instead of 1.2s) to account for faster mobile scrolling.

### Marquee Trust Bar

| Property | xs-sm | md | lg+ |
|----------|-------|-----|------|
| Height | 44px | 48px | 56px |
| Font size | 11px | 12px | 13px |
| Separator margin | 16px each side | 20px | 24px |
| Animation speed | 30s (faster, less content to scroll) | 35s | 40s |

### Dashboard Preview Section

| Property | xs (< 480px) | sm (480-767px) | md (768-1023px) | lg+ (≥ 1024px) |
|----------|-------------|----------------|-----------------|-----------------|
| Section padding | 48px 20px | 56px 20px | 64px 24px | 80px 32px |
| Heading size | 28px | 32px | 36px | 44px |
| Sub-text size | 15px | 16px | 17px | 18px |
| Mockup max-width | 100% | 100% | 90% | 1100px |
| Browser chrome height | 36px | 38px | 42px | 48px |
| Traffic light dots | 8px | 10px | 11px | 12px |
| URL text size | 11px | 12px | 12px | 13px |
| Editor area height | 240px | 280px | 360px | 480px |
| Split view | Tabbed (stacked) | Tabbed (stacked) | Split (50/50) | Split (50/50) |
| Code font size | 11px | 12px | 13px | 14px |
| Line numbers | Hidden | Hidden | Visible | Visible |
| Status bar | 2 items only | 3 items | All items | All items |
| Status bar height | 28px | 30px | 32px | 36px |
| Floating elements | All hidden | All hidden | 2 visible (top) | All 4 visible |
| Background glow | Reduced/hidden | Reduced | Full | Full |

**Tabbed view on mobile detail:**
When `< 768px`, instead of the side-by-side split pane:
- Two tab buttons appear above the editor/preview area: `"✏️ Editor"` and `"👁️ Preview"`
- Tabs: `display: flex; width: 100%;`
- Each tab: `flex: 1; text-align: center; padding: 10px; font-size: 13px; font-weight: 600;`
- Active tab: `color: var(--accent-jade); border-bottom: 2px solid var(--accent-jade);`
- Inactive: `color: var(--text-tertiary); border-bottom: 2px solid transparent;`
- Background: Same as browser chrome
- Only the selected pane is rendered (display none on the other)
- Default active: Preview (it's more visually impressive for visitors)

### Main Features Section

| Property | xs | sm | md | lg+ |
|----------|-----|-----|-----|------|
| Grid columns | 1 | 2 | 6 | 12 |
| Gap | 12px | 14px | 16px | 20px |
| Header alignment | Left | Left | Left | Left |
| Heading size | 28px | 32px | 36px | 44px |
| Large cards (Monaco, Live Preview) | Full width, single row | Full (2 cols), single row | Full (6 cols), single row | 5-4 cols, 2 rows each |
| Large card padding | 24px | 28px | 32px | 36px |
| Large card heading | 20px | 22px | 22px | 24px |
| Large card description | 14px | 14px | 15px | 16px |
| Large card min-height | Auto | Auto | Auto | Determined by grid |
| Small cards | Full width | 1 col each (2 per row) | 3 cols each (2 per row) | 2-3 cols, 1 row |
| Small card padding | 20px | 22px | 24px | 24px |
| Small card heading | 15px | 16px | 16px | 17px |
| Small card description | 13px | 13px | 13px | 14px |
| Wide cards (Export, Multi-Tab) | Full width | Full (2 cols) | Full (6 cols) | 4-5 cols |
| Feature pills | Wrap | Wrap | Wrap | Wrap |
| Internal two-column layouts | Stack to single column | Stack | Stack on small cards, row on wide | Row |
| Mini visuals (diagrams, tabs, etc.) | Hidden at xs, simplified at sm | Visible, simplified | Full | Full |
| Icon container size | 40px | 44px | 44px | 48px |
| Icon size | 20px | 22px | 22px | 24px |

### How It Works Section

| Property | xs-sm (< 768px) | md (768-1023px) | lg+ (≥ 1024px) |
|----------|-----------------|-----------------|-----------------|
| Layout | Vertical stack | Vertical stack | Horizontal 3-column |
| Connectors | Vertical, downward arrows | Vertical, downward arrows | Horizontal, rightward arrows |
| Connector length | 32px (height) | 40px (height) | 60px (width) |
| Card min-height | Auto | 280px | 320px |
| Card padding | 24px | 28px | 36px |
| Illustration size | 160px × 70px | 180px × 85px | 200px × 100px |
| Heading size | 20px | 22px | 24px |
| Watermark number size | 70px | 90px | 120px |
| Step badge size | 32px | 36px | 40px |
| Entrance animation | Top-to-bottom stagger | Top-to-bottom stagger | Left-to-right stagger |

### Advanced Features Section

| Property | xs | sm | md | lg+ |
|----------|-----|-----|-----|------|
| Grid columns | 1 | 2 | 2 | 3 |
| Gap | 12px | 14px | 16px | 20px |
| Card min-height | Auto | 180px | 190px | 200px |
| Card padding | 22px | 24px | 26px | 28px |
| Last card (9th, odd) | Full width | Full (2 cols) | Full (2 cols) | Normal (1 col) |
| Icon size | 40px | 42px | 42px | 44px |
| Heading | 15px | 16px | 16px | 17px |
| Description | 13px | 13px | 14px | 14px |
| Unique details (visuals) | Hidden on xs | Simplified | Full | Full |

### Export Formats Section

| Property | xs-sm | md | lg+ |
|----------|-------|-----|------|
| Layout | Horizontal scroll OR vertical stack | 2×2 grid | 4-column grid |
| Card min-width (scroll mode) | 260px | N/A | N/A |
| Card min-height | 240px | 260px | 280px |
| Card padding | 24px | 26px | 28px |
| Document icon size | 48px × 58px | 54px × 65px | 60px × 72px |
| Heading | 18px | 20px | 22px |

### Testimonials Section

| Property | xs-sm | md | lg+ |
|----------|-------|-----|------|
| Grid columns | 1 | 6 | 12 |
| Featured card | Full width | Full (6 cols) | 5 cols, 2 rows |
| Featured quote size | 16px | 17px | 18px |
| Featured padding | 24px | 28px | 36px |
| Standard cards | Full width each | 3 cols each | 4 cols each |
| Standard quote size | 15px | 15px | 16px |
| Rating card | Full width, horizontal layout | Full (6 cols) or 3 cols | 3 cols, 2 rows |
| Community card | Full width | 3 cols | 4 cols |
| Avatar sizes | 36px (featured), 32px (standard) | 44px, 36px | 52px, 40px |

**Rating card horizontal layout on mobile:**
Instead of the tall vertical layout, the rating card becomes horizontal:
```
[⭐ Star Circle] [4.9 out of 5.0] [⭐⭐⭐⭐⭐]
                 [Based on feedback]
```
Using `flex-direction: row; align-items: center; gap: 16px;`

### Comparison Table Section

| Property | xs-sm | md | lg+ |
|----------|-------|-----|------|
| Layout | Horizontal scroll with sticky first column | Horizontal scroll | Full table visible |
| First column width | 140px | 160px | 200px |
| Data column width | 120px min | 130px min | Equal (1fr) |
| Row height | 44px | 48px | 52px |
| Cell font size | 12px | 13px | 14px |
| Check/X icon size | 20px | 22px | 24px |
| Scroll indicator gradient | Visible (right edge fade) | Visible | Hidden (no scroll needed) |
| Markups column highlight | Maintained | Maintained | Maintained |

### FAQ Section

| Property | xs-sm | md | lg+ |
|----------|-------|-----|------|
| Max-width | 100% | 100% | 800px |
| Padding-x | 20px | 24px | 32px |
| Question row height | 52px min | 56px | 60px |
| Question font | 15px | 16px | 17px |
| Answer font | 14px | 15px | 16px |
| Answer padding | 16px 20px | 18px 22px | 20px 24px |
| Toggle icon circle | 28px | 30px | 32px |
| Gap between items | 8px | 10px | 12px |

### Final CTA Section

| Property | xs-sm | md | lg+ |
|----------|-------|-----|------|
| Padding-y | 80px | 96px | 120px |
| Heading size | 32px | 40px | 56px |
| Sub-text size | 15px | 16px | 18px |
| Sub-text max-width | 100% | 520px | 600px |
| CTAs | Column (stacked, full width) | Row | Row |
| Primary CTA font | 16px | 17px | 18px |
| Primary CTA padding | 16px 28px | 17px 34px | 18px 40px |
| Background shapes | Hidden | 2 visible (reduced) | All 4 visible |
| Trust text | 12px, wraps | 13px | 14px |

### Footer

| Property | xs | sm-md | lg+ |
|----------|-----|-------|------|
| Grid columns | 1 | 2 | 4 (2fr 1fr 1fr 1fr) |
| Gap | 28px vertical | 32px | 48px |
| Brand description max-width | 100% | 100% | 280px |
| Column title margin-top | 24px (between stacked cols) | 0 | 0 |
| Social icons layout | Centered | Left aligned | Left aligned |
| Social icon size | 40px | 38px | 36px |
| Link font size | 15px (larger for touch) | 14px | 14px |
| Bottom bar layout | Column, centered | Row | Row |
| Bottom bar font | 12px | 12px | 13px |
| Footer padding | 48px 20px 24px | 56px 24px 28px | 64px 32px 32px |

---

# 22. ♿ ACCESSIBILITY SPECIFICATION

## 22.1 Semantic HTML Structure

The landing page must use proper semantic HTML5 elements to ensure screen readers, crawlers, and assistive technologies can parse the content correctly.

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <!-- Meta, title, preloads -->
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  
  <header role="banner">
    <nav role="navigation" aria-label="Main navigation">
      <!-- Nav content -->
    </nav>
  </header>
  
  <main id="main-content" role="main">
    <section id="hero" aria-label="Introduction to Markups">
      <!-- Hero bento grid -->
    </section>
    
    <div role="marquee" aria-label="Feature highlights">
      <!-- Marquee trust bar -->
    </div>
    
    <section id="preview" aria-label="Editor preview">
      <!-- Dashboard mockup -->
    </section>
    
    <section id="features" aria-label="Features">
      <!-- Feature cards -->
    </section>
    
    <section id="how-it-works" aria-label="How it works">
      <!-- Step cards -->
    </section>
    
    <section id="advanced-features" aria-label="Advanced features">
      <!-- Advanced feature cards -->
    </section>
    
    <section id="export" aria-label="Export formats">
      <!-- Export cards -->
    </section>
    
    <section id="testimonials" aria-label="Testimonials">
      <!-- Testimonial cards -->
    </section>
    
    <section id="comparison" aria-label="Feature comparison">
      <!-- Comparison table -->
    </section>
    
    <section id="faq" aria-label="Frequently asked questions">
      <!-- FAQ accordion -->
    </section>
    
    <section id="cta" aria-label="Get started">
      <!-- Final CTA -->
    </section>
  </main>
  
  <footer role="contentinfo">
    <!-- Footer content -->
  </footer>
  
  <button class="scroll-to-top" aria-label="Scroll to top of page">
    <!-- Arrow icon -->
  </button>
</body>
</html>
```

## 22.2 Skip Link

The very first focusable element on the page, visually hidden but becomes visible on focus:

```css
.skip-link {
  position: absolute;
  top: -100px;
  left: 16px;
  background: var(--accent-jade);
  color: white;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  z-index: 10000;
  text-decoration: none;
  transition: top 0.2s ease;
}
.skip-link:focus {
  top: 16px;
}
```

When a keyboard user presses Tab on page load, this link appears at the top-left, allowing them to skip directly to the main content area without tabbing through the entire navigation.

## 22.3 Focus Indicators

Every interactive element must have a clearly visible focus indicator:

```css
:focus-visible {
  outline: 3px solid var(--accent-jade);
  outline-offset: 3px;
  border-radius: inherit; /* Matches element's border-radius */
}

/* Specifically for dark elements where jade might not contrast */
[data-theme="dark"] :focus-visible {
  outline-color: var(--accent-jade); /* #3DDC84 — high contrast on dark */
}

/* Remove outline on mouse click (only show for keyboard nav) */
:focus:not(:focus-visible) {
  outline: none;
}
```

**Button focus:**
```css
button:focus-visible,
.button:focus-visible {
  outline: 3px solid var(--accent-jade);
  outline-offset: 3px;
  box-shadow: 0 0 0 6px rgba(45, 159, 111, 0.15); /* Extra glow ring for prominence */
}
```

**Card focus (if cards are interactive/tabbable):**
```css
.bento-card:focus-visible {
  outline: 3px solid var(--accent-jade);
  outline-offset: 4px;
  transform: translateY(-2px); /* Subtle lift to match hover state */
}
```

## 22.4 ARIA Attributes

**Theme toggle button:**
```html
<button 
  class="theme-toggle" 
  aria-label="Switch to dark mode" 
  aria-pressed="false"
  role="switch"
>
  <!-- Sun/Moon icon -->
</button>
```
When toggled to dark mode: `aria-label="Switch to light mode"` and `aria-pressed="true"`

**Hamburger menu button:**
```html
<button 
  class="hamburger" 
  aria-label="Open navigation menu" 
  aria-expanded="false"
  aria-controls="mobile-menu"
>
  <!-- 3 lines -->
</button>

<div id="mobile-menu" role="dialog" aria-label="Navigation menu" aria-hidden="true">
  <!-- Menu content -->
</div>
```
When opened: `aria-expanded="true"`, `aria-label="Close navigation menu"`, menu `aria-hidden="false"`

**FAQ accordion:**
```html
<div class="faq-item">
  <button 
    class="faq-question" 
    aria-expanded="false" 
    aria-controls="faq-answer-1"
    id="faq-question-1"
  >
    <span>Is Markups really completely free?</span>
    <span class="toggle-icon" aria-hidden="true">+</span>
  </button>
  <div 
    class="faq-answer" 
    id="faq-answer-1" 
    role="region" 
    aria-labelledby="faq-question-1"
    hidden
  >
    <p>Yes, 100% free, forever...</p>
  </div>
</div>
```
When expanded: `aria-expanded="true"`, answer `hidden` attribute removed

**Comparison table:**
```html
<table role="table" aria-label="Feature comparison between Markups and alternative editors">
  <thead>
    <tr>
      <th scope="col">Feature</th>
      <th scope="col" aria-label="Markups - highlighted">✨ Markups</th>
      <th scope="col">Typora</th>
      <!-- etc -->
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Free & Open Source</th>
      <td aria-label="Available"><span aria-hidden="true">✅</span> Yes</td>
      <td aria-label="Not available"><span aria-hidden="true">❌</span> No ($15)</td>
      <!-- etc -->
    </tr>
  </tbody>
</table>
```

**Decorative elements:**
All purely decorative elements (background glows, floating pills, watermark numbers, noise texture) must have `aria-hidden="true"` to prevent screen readers from announcing them.

```html
<div class="floating-pill" aria-hidden="true">✨ Auto-Save Enabled</div>
<div class="watermark-number" aria-hidden="true">01</div>
```

**Star ratings:**
```html
<div role="img" aria-label="5 out of 5 stars">
  <span aria-hidden="true">⭐⭐⭐⭐⭐</span>
</div>
```

**Stat numbers with suffixes:**
```html
<div aria-label="20 plus features">
  <span class="counter" aria-hidden="true">20+</span>
  <span class="sr-only">20 plus</span>
</div>
```

## 22.5 Color Contrast Compliance (WCAG 2.1 AA)

All text must meet minimum contrast ratios:

| Text Type | Required Ratio | Light Mode Status | Dark Mode Status |
|-----------|---------------|-------------------|------------------|
| `--text-heading` on `--bg-page` | 4.5:1 (normal) / 3:1 (large) | #1A1917 on #FAF9F6 = **16.3:1** ✅ | #EEEEE8 on #0A0C10 = **15.8:1** ✅ |
| `--text-body` on `--bg-page` | 4.5:1 | #44433F on #FAF9F6 = **8.2:1** ✅ | #B0B0A8 on #0A0C10 = **9.4:1** ✅ |
| `--text-secondary` on `--bg-page` | 4.5:1 | #6B6A64 on #FAF9F6 = **5.1:1** ✅ | #888880 on #0A0C10 = **6.2:1** ✅ |
| `--text-tertiary` on `--bg-page` | 3:1 (for UI elements) | #96958E on #FAF9F6 = **3.3:1** ✅ | #58585A on #0A0C10 = **3.1:1** ✅ (borderline, acceptable for labels) |
| `--accent-jade` on `--bg-page` | 3:1 (for links, large text) | #2D9F6F on #FAF9F6 = **4.1:1** ✅ | #3DDC84 on #0A0C10 = **8.9:1** ✅ |
| `--accent-orange` on white (#FFF) | 3:1 (for buttons, large) | #E8623E on #FFF = **3.8:1** ✅ | N/A (orange on dark bg) |
| White on `--accent-orange` | 4.5:1 (button text) | #FFF on #E8623E = **3.8:1** ⚠️ (borderline, use weight 600+ to compensate) | #FFF on #FF6B42 = **3.2:1** ⚠️ (acceptable at 18px+ bold) |
| Footer text on dark bg | 4.5:1 | rgba(255,255,255,0.5) on #1A1917 ≈ **5.5:1** ✅ | rgba(255,255,255,0.5) on #08090C ≈ **6.0:1** ✅ |

**Note on orange CTA buttons:** The white text on orange background is borderline at standard text sizes. This is mitigated by:
1. Using font-weight 600-700 (bold text has better perceived legibility)
2. Using font-size 16px+ (qualifies as "large text" under WCAG, requiring only 3:1)
3. The shadow behind the button provides additional text separation from the background

## 22.6 Keyboard Navigation Order

Tab order follows the visual reading flow (left to right, top to bottom):

1. Skip link (hidden, first focus)
2. Logo (link to top)
3. Nav links: Features → Preview → How It Works → Export → Testimonials
4. Theme toggle button
5. GitHub Star button
6. Primary nav CTA ("Try Editor")
7. Hero primary CTA ("Start Writing — It's Free")
8. Hero secondary CTA ("View on GitHub")
9. Dashboard floating elements (if interactive — probably not, `tabindex="-1"`)
10. Feature cards (if they contain links — the pill badges and links within cards)
11. Step cards (the mini-CTA "Try It Now" in step 3)
12. Export cards (if clickable)
13. Testimonial cards (not typically interactive)
14. Comparison table cells (natural table navigation)
15. FAQ accordion buttons (each question is a button)
16. Final CTA buttons
17. Footer links (column by column)
18. Scroll-to-top button

**Trap focus in mobile menu:** When the mobile menu is open, focus must be trapped within it (cannot tab to elements behind the overlay):
```javascript
// On menu open:
// 1. Find all focusable elements within menu
// 2. On Tab at last element, loop to first
// 3. On Shift+Tab at first element, loop to last
// 4. On Escape, close menu and return focus to hamburger button
```

## 22.7 Screen Reader Text (Visually Hidden)

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

Use `.sr-only` for:
- Additional context for stat numbers: `<span class="sr-only">20 plus features packed into the editor</span>`
- Decorative icons that carry meaning when no visible text is present
- Status indicators: `<span class="sr-only">Document auto-saved successfully</span>`

## 22.8 Motion & Animation Accessibility

Already covered in section 20.10 with `prefers-reduced-motion`, but to reiterate:

- All entrance animations: disabled (elements appear immediately)
- All hover lift/shadow: disabled (elements stay flat)
- All continuous animations (float, pulse, blink): disabled
- Scroll behavior: `auto` (instant jump instead of smooth)
- Theme transition: instant (no crossfade)
- Marquee: stopped (static display of items)

The page remains fully functional and beautiful even without any animation.

---

# 23. ⚡ PERFORMANCE OPTIMIZATION NOTES

## 23.1 Critical Rendering Path

**Above-the-fold content (nav + hero section) must render within 1.5 seconds on 3G connections.**

Strategy:
1. **Inline critical CSS:** Extract the CSS needed for nav bar and hero section (approximately 8-12KB) and inline it in a `<style>` tag in the `<head>`. This eliminates a render-blocking CSS file request for above-the-fold content.

2. **Defer non-critical CSS:** The remaining CSS (for sections below hero) is loaded asynchronously:
   ```html
   <link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
   <noscript><link rel="stylesheet" href="styles.css"></noscript>
   ```

3. **Font preloading:**
   ```html
   <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossorigin>
   <link rel="preload" href="/fonts/JetBrainsMono-Medium.woff2" as="font" type="font/woff2" crossorigin>
   ```

4. **No JavaScript required for above-the-fold:** The hero section renders with pure HTML + CSS. JavaScript (for animations, theme toggle, etc.) loads asynchronously.

## 23.2 Image Optimization

**Dashboard screenshot (the largest image on the page):**
```html
<picture>
  <source 
    srcset="/images/dashboard-dark.avif" 
    type="image/avif"
    media="(prefers-color-scheme: dark)"
  >
  <source 
    srcset="/images/dashboard-light.avif" 
    type="image/avif"
  >
  <source 
    srcset="/images/dashboard-dark.webp" 
    type="image/webp"
    media="(prefers-color-scheme: dark)"
  >
  <source 
    srcset="/images/dashboard-light.webp" 
    type="image/webp"
  >
  <img 
    src="/images/dashboard-light.png" 
    alt="Markups editor showing split view with markdown and live preview"
    loading="lazy"
    decoding="async"
    width="1100"
    height="700"
    fetchpriority="low"
  >
</picture>
```

- AVIF format: ~60% smaller than PNG
- WebP fallback: ~30% smaller than PNG
- PNG fallback: for old browsers
- `loading="lazy"`: Dashboard is below the fold, no need to load eagerly
- `decoding="async"`: Don't block the main thread for image decode
- Explicit `width` and `height`: Prevents layout shift (CLS)

**Teaser image (hero section — above fold):**
```html
<img 
  src="/images/teaser.webp" 
  alt="..." 
  loading="eager"
  fetchpriority="high"
  width="540"
  height="320"
>
```
This image IS above the fold, so it loads eagerly with high priority.

**Avatar images (testimonials):**
- Use tiny (48px × 48px) images, preferably data URLs or inline SVGs for generated avatars
- If using real photos: serve at 2x resolution (96px × 96px source) for retina
- Format: WebP, ~2KB each
- `loading="lazy"`

## 23.3 JavaScript Loading

```html
<!-- Critical: Theme preference (prevents flash of wrong theme) -->
<script>
  // Inline in <head>, before render:
  const theme = localStorage.getItem('markups-theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
</script>

<!-- Non-critical: All interactive behavior -->
<script src="/js/main.js" defer></script>
```

The theme detection script is inlined and synchronous (tiny, ~200 bytes) to prevent a flash of the wrong theme. Everything else is deferred.

**JavaScript budget:** The total JS for the landing page should be under 30KB gzipped. This includes:
- Theme toggle logic: ~2KB
- IntersectionObserver setup: ~3KB
- Counter animations: ~2KB
- Mobile menu: ~2KB
- FAQ accordion: ~2KB
- Smooth scroll: ~1KB
- Marquee pause on hover: ~0.5KB
- Total: ~12.5KB unminified → ~5KB gzipped

No heavy frameworks needed. Pure vanilla JavaScript.

## 23.4 CSS Optimization

**Total CSS budget:** Under 40KB gzipped

Strategy:
- Use CSS custom properties (variables) for all theme values — no duplicate rulesets for light/dark
- Use CSS Grid and Flexbox natively — no grid framework bloat
- Use `@layer` for cascade management if supported
- Minimize selector specificity — prefer class selectors
- Use logical properties (`margin-inline`, `padding-block`) for future RTL support
- Compress with PostCSS + cssnano in production

## 23.5 Core Web Vitals Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Hero section renders with inlined critical CSS; hero H1 is the LCP element; fonts are preloaded |
| **FID** (First Input Delay) | < 100ms | Minimal JS; no heavy computation on main thread during load |
| **CLS** (Cumulative Layout Shift) | < 0.1 | All images have explicit dimensions; fonts use `font-display: swap` with matching fallback metrics; no dynamically injected content above the fold |
| **INP** (Interaction to Next Paint) | < 200ms | Event handlers are lightweight; DOM updates are batched; no forced reflows in interaction handlers |
| **TTFB** (Time to First Byte) | < 800ms | Static hosting on Vercel CDN; HTML is static (no server-side rendering needed for landing page) |
| **FCP** (First Contentful Paint) | < 1.8s | Inlined critical CSS; preloaded fonts; no render-blocking resources |

## 23.6 Content Visibility

```css
/* Sections below the fold */
#preview,
#features,
#how-it-works,
#advanced-features,
#export,
#testimonials,
#comparison,
#faq,
#cta {
  content-visibility: auto;
  contain-intrinsic-size: auto 800px; /* Estimated height */
}
```

This tells the browser to skip rendering these sections until they're about to scroll into view, dramatically reducing initial rendering work.

## 23.7 Preconnect & DNS Prefetch

```html
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
<link rel="preconnect" href="https://github.com" crossorigin>
<link rel="dns-prefetch" href="https://markups.vercel.app">
```

## 23.8 Resource Hints for Navigation

```html
<!-- When user hovers over "Try Editor" CTA, preload the app -->
<link rel="prefetch" href="https://markups.vercel.app">
```

This can also be triggered dynamically:
```javascript
document.querySelector('.cta-primary').addEventListener('mouseenter', () => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = 'https://markups.vercel.app';
  document.head.appendChild(link);
}, { once: true });
```

When the user hovers over the primary CTA, the browser begins prefetching the editor page in the background. If they click, the navigation feels instant.

---

# 24. 🖨️ PRINT STYLESHEET SPECIFICATION

## Purpose

When a user prints the landing page (rare, but possible for reference or sharing), the output should be clean, readable, and professional — not a mess of broken layouts and missing backgrounds.

## Print Stylesheet

```css
@media print {
  /* ===== Reset visual effects ===== */
  * {
    animation: none !important;
    transition: none !important;
    box-shadow: none !important;
    text-shadow: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
  
  /* ===== Force light colors for printing ===== */
  html, body {
    background: white !important;
    color: #1A1917 !important;
    font-size: 12pt;
    line-height: 1.5;
  }
  
  /* ===== Hide non-essential elements ===== */
  nav,
  .hamburger,
  .theme-toggle,
  .scroll-to-top,
  .floating-pill,
  .marquee-section,
  .background-glow,
  .noise-texture,
  .decorative-shape,
  .cta-section, /* The final CTA is redundant in print */
  footer .social-links,
  .mobile-menu {
    display: none !important;
  }
  
  /* ===== Layout simplification ===== */
  .bento-grid,
  .feature-grid,
  .testimonial-grid,
  .advanced-grid,
  .export-grid {
    display: block !important;
  }
  
  .bento-card,
  .feature-card,
  .testimonial-card,
  .step-card {
    display: block !important;
    width: 100% !important;
    margin-bottom: 16pt;
    padding: 12pt;
    border: 1pt solid #E0E0E0 !important;
    border-radius: 8pt;
    background: white !important;
    page-break-inside: avoid;
  }
  
  /* ===== Typography for print ===== */
  h1 { font-size: 28pt; }
  h2 { font-size: 22pt; page-break-after: avoid; }
  h3 { font-size: 16pt; }
  p, li { font-size: 11pt; }
  
  /* ===== Links show URLs ===== */
  a[href]:not(.nav-link)::after {
    content: " (" attr(href) ")";
    font-size: 9pt;
    color: #666;
    font-style: italic;
  }
  
  /* External links only */
  a[href^="http"]::after {
    content: " (" attr(href) ")";
  }
  a[href^="#"]::after {
    content: none; /* Don't show for anchor links */
  }
  
  /* ===== Images ===== */
  img {
    max-width: 100% !important;
    page-break-inside: avoid;
  }
  
  .dashboard-mockup {
    max-width: 80% !important;
    margin: 16pt auto;
    border: 1pt solid #CCC;
  }
  
  /* ===== Comparison table ===== */
  table {
    width: 100% !important;
    border-collapse: collapse;
    font-size: 10pt;
  }
  table th, table td {
    border: 1pt solid #DDD;
    padding: 6pt 8pt;
    text-align: center;
  }
  table th {
    background: #F5F5F5 !important;
    font-weight: 700;
  }
  
  /* ===== Page breaks ===== */
  section {
    page-break-before: auto;
    page-break-after: auto;
    page-break-inside: avoid;
  }
  
  h2, h3 {
    page-break-after: avoid;
  }
  
  /* ===== Footer for print ===== */
  footer {
    background: white !important;
    color: #1A1917 !important;
    border-top: 2pt solid #E0E0E0;
    padding-top: 16pt;
  }
  footer a {
    color: #1A1917 !important;
  }
  
  /* ===== Color adjustments ===== */
  .accent-jade {
    color: #2D9F6F !important; /* Keep jade readable */
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .accent-orange {
    color: #D4532F !important; /* Slightly darker for print contrast */
  }
  
  /* ===== Buttons become text links ===== */
  .btn-primary, .btn-secondary {
    background: none !important;
    border: 1pt solid #999 !important;
    color: #1A1917 !important;
    padding: 6pt 12pt;
  }
}
```

---

# 25. 📊 COMPLETE SECTION FLOW SUMMARY

For easy reference, here is the complete top-to-bottom order of all page sections with their key characteristics:

```
┌─────────────────────────────────────────────────────────────┐
│  PRE-LOADER (0.5-1.5s, then fades out)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ① NAVIGATION BAR (Sticky, 68px, glass background)         │
│     Logo + Links + Theme Toggle + GitHub + CTA              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ② HERO SECTION (Full viewport height, Bento Grid)         │
│     7 bento boxes: Main content + Stats + Benefits +        │
│     Teaser Image + Tech Stack + Trust Signal                │
│     BG: Primary + subtle color wash gradient                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ③ MARQUEE TRUST BAR (56px, infinite scroll, full-bleed)   │
│     Feature names scrolling horizontally                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ④ DASHBOARD PREVIEW (BG: Alt)                              │
│     Eyebrow + Heading + Sub-text                            │
│     Browser-chrome-framed editor mockup with:               │
│     - Split view (editor + preview)                         │
│     - Syntax highlighted code                               │
│     - Rendered markdown with Mermaid diagram                │
│     - Status bar with word count                            │
│     4 floating accent pills around mockup                   │
│     Background glow behind mockup                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⑤ MAIN FEATURES (BG: Primary, Irregular Bento Grid)       │
│     12 feature cards in irregular sizes:                    │
│     2 Large (Monaco, Live Preview) spanning 2 rows          │
│     2 Wide (Export Suite, Multi-Tab)                        │
│     8 Small/Medium (Themes, Linter, Mermaid, KaTeX,        │
│       Snippets, Shortcuts, TOC, Auto-Save)                  │
│     Each with icon, heading, description, unique visuals    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⑥ HOW IT WORKS (BG: Alt, 3-Step Horizontal Cards)         │
│     Step 1: Write → Step 2: Preview → Step 3: Export        │
│     Connected by animated dashed lines with arrows          │
│     Each with illustration, heading, description, tags      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⑦ ADVANCED FEATURES (BG: Primary, 3×3 Uniform Grid)       │
│     9 equal cards: Focus Mode, Typewriter, Writing Goals,   │
│     Statistics, GFM, PWA, Templates, Snippets, Fullscreen   │
│     Each with colored top-accent that appears on hover      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⑧ EXPORT FORMATS (BG: Alt, 4-Column Grid)                 │
│     4 format cards: PDF (red), HTML (blue),                 │
│     Markdown (jade), Clipboard (indigo)                     │
│     Each with stylized document icon, heading, description  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⑨ TESTIMONIALS (BG: Primary, Bento Grid)                   │
│     1 Featured testimonial (large, 2-row spanning)          │
│     4 Standard testimonials                                 │
│     1 Rating Summary card (4.9/5.0)                         │
│     1 Community Statistics card (GitHub stars, license)      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⑩ COMPARISON TABLE (BG: Alt)                               │
│     Feature comparison: Markups vs Typora vs StackEdit      │
│     vs VS Code vs Notion                                    │
│     16 features compared with ✅ ❌ ⚠️                       │
│     Markups column highlighted with jade tint               │
│     Footer row showing totals: Markups 16/16 🏆             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⑪ FAQ ACCORDION (BG: Primary, 800px centered)              │
│     10 questions with expandable answers                    │
│     Clean accordion with smooth open/close animation        │
│     Jade accent on active items                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⑫ FINAL CTA (BG: Tri-tonal gradient, full-bleed)          │
│     Eyebrow + Large heading + Sub-text                      │
│     Pulsing primary CTA button + Secondary GitHub button    │
│     Trust text line                                         │
│     Decorative abstract shapes at low opacity               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⑬ FOOTER (Always dark, 4-column)                           │
│     Brand + Description + Social links                      │
│     Product links | Resources | Open Source links           │
│     Copyright bar with ❤️ pulse                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

FLOATING ELEMENTS (always visible):
  → Scroll-to-top button (bottom-right, appears after hero)
  → Sticky nav bar (top, always)
```

---

# 26. 🎯 FINAL DESIGN CHECKLIST

Before implementation, verify every item on this checklist:

## Visual Design
- [ ] All colors match token system exactly (no hardcoded hex values outside the design system)
- [ ] All typography follows the type scale precisely (no arbitrary font sizes)
- [ ] All spacing uses the 8px grid system tokens
- [ ] All border-radius values use the radius token system
- [ ] All shadows use the shadow token system
- [ ] Glassmorphism is applied consistently in light mode
- [ ] Dark mode has its own distinct personality (not just inverted colors)
- [ ] Bento grid irregularity feels intentional and balanced
- [ ] Visual hierarchy is clear in every section (eye path is obvious)
- [ ] No two adjacent sections have the same background color
- [ ] Accent colors are used semantically (jade = trust, orange = CTA, indigo = tech)
- [ ] Noise texture is barely perceptible (2-3% opacity)
- [ ] Background decorative glows are subtle (< 6% opacity)

## Typography
- [ ] All headings use `--font-display`
- [ ] All body text uses `--font-body`
- [ ] All code/technical text uses `--font-mono`
- [ ] Font weights are consistent within their context
- [ ] Line heights ensure comfortable readability
- [ ] Letter spacing is tighter for large text, standard for body
- [ ] No line of body text exceeds 75 characters (max-width constraints)
- [ ] Highlighted words ("Beautiful", "Everything", etc.) are consistent in treatment

## Interactivity
- [ ] Every hover state has a smooth transition (no instant snapping)
- [ ] Card hover lifts use spring easing for natural feel
- [ ] Button hover includes translateY + shadow + color change
- [ ] Link hover includes underline animation
- [ ] No hover effect causes content reflow (only transform + opacity + shadow)
- [ ] Theme toggle animates smoothly without jarring flash
- [ ] FAQ accordion opens/closes smoothly
- [ ] Mobile menu opens/closes smoothly
- [ ] Marquee pauses on hover

## Animation
- [ ] All entrance animations use IntersectionObserver (not scroll listeners)
- [ ] Stagger delays feel natural and sequential
- [ ] No animation exceeds 1 second duration (except hero choreography)
- [ ] Count-up animations trigger only once
- [ ] Continuous animations (float, pulse) are GPU-friendly (transform only)
- [ ] `prefers-reduced-motion` disables all non-essential animations
- [ ] Loading choreography feels cinematic but not slow

## Responsiveness
- [ ] Page looks perfect at 1280px (primary target)
- [ ] No horizontal overflow at any breakpoint
- [ ] Touch targets are minimum 44px × 44px on mobile
- [ ] Text remains readable at all breakpoints (no text smaller than 11px)
- [ ] Images scale proportionally without distortion
- [ ] Bento grid restructures logically at each breakpoint
- [ ] CTAs become full-width on mobile
- [ ] Navigation converts to hamburger below 1024px
- [ ] Dashboard mockup adapts to tabbed view on mobile
- [ ] Comparison table has horizontal scroll on mobile

## Accessibility
- [ ] Skip link is present and functional
- [ ] All interactive elements have visible focus indicators
- [ ] All images have descriptive alt text
- [ ] All decorative elements have `aria-hidden="true"`
- [ ] Color contrast meets WCAG 2.1 AA for all text
- [ ] FAQ uses proper ARIA attributes for accordion pattern
- [ ] Theme toggle uses `role="switch"
