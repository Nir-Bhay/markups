# MARKUPS — Improvement & Optimization Roadmap

Document Version: 1.0

Date: 2026-02-14

Purpose: Detailed roadmap of what to improve, optimize, add, change, and polish

Prerequisite: Read documents 01 and 02 first

---

## 1. Roadmap Philosophy

Every item is categorized by:

- **Priority:** P0 (critical) → P3 (nice-to-have)
- **Effort:** S (small, hours) → XL (extra large, weeks)
- **Impact:** How much it improves user experience
- **Phase:** When to implement

| Phase | Timeline | Focus |
|---|---|---|
| Phase 1: Foundation | Weeks 1-3 | Fix fundamentals, data layer upgrade |
| Phase 2: Experience | Weeks 4-7 | Polish editor, add key features |
| Phase 3: Growth | Weeks 8-12 | PWA, sharing, discoverability |
| Phase 4: Expansion | Weeks 13+ | Advanced features, sync, monetization |

---

## 2. Phase 1 — Foundation (Critical Infrastructure)

### 2.1 Storage Migration: localStorage → IndexedDB

| Attribute | Detail |
|---|---|
| Priority | P0 |
| Effort | M (medium) |
| Impact | Removes the biggest technical limitation |

**What to do:**
- Set up Dexie.js with proper schema (notes, versions, attachments, settings)
- Create a storage abstraction layer so components never directly access IndexedDB
- Build migration utility to move existing localStorage data to IndexedDB
- Add data integrity checks (count verification, checksum)
- Keep localStorage for settings only (theme, UI preferences)
- Add storage usage indicator in settings panel (show how much space used)

**What this unlocks:**
- Virtually unlimited notes (hundreds of MB instead of 5MB)
- Indexed search (query by title, tags, date without loading everything)
- Version history (store previous versions efficiently)
- Attachment support (images, files stored as Blobs)
- Multi-tab safety (IndexedDB transactions are atomic)

### 2.2 Zustand Store Refactoring

| Attribute | Detail |
|---|---|
| Priority | P0 |
| Effort | M |
| Impact | Better state management, fewer bugs, better perf |

**What to do:**
- Split single noteStore into modular stores (noteStore, uiStore, settingsStore)
- Add proper TypeScript interfaces for all store states and actions
- Implement Zustand selectors to prevent unnecessary re-renders
- Add persist middleware that writes to IndexedDB instead of localStorage
- Add immer middleware for immutable state updates with mutable syntax
- Add devtools middleware for debugging in development
- Remove direct localStorage calls from components — all through stores

### 2.3 Error Boundaries & Loading States

| Attribute | Detail |
|---|---|
| Priority | P0 |
| Effort | S |
| Impact | Prevents white screen crashes, better perceived performance |

**What to do:**
- Add React Error Boundaries around major sections (editor, notes list, preview)
- Add fallback UIs for each error boundary (not just generic "something went wrong")
- Add loading skeletons for notes list, editor initialization
- Add Suspense boundaries for lazy-loaded routes
- Handle edge cases: empty state (no notes), first-time user, storage full

### 2.4 Auto-Save System

| Attribute | Detail |
|---|---|
| Priority | P0 |
| Effort | S |
| Impact | Prevents data loss — the #1 user fear |

**What to do:**
- Debounced auto-save (save 1.5-2 seconds after user stops typing)
- Visual save indicator (subtle "Saving..." → "Saved" in status bar)
- Save on blur (user switches tab or app)
- Save on beforeunload (user closes tab)
- Save on visibilitychange (user switches to another app on mobile)
- Configurable auto-save interval in settings
- "Last saved at [time]" display in editor

### 2.5 Testing Infrastructure

| Attribute | Detail |
|---|---|
| Priority | P1 |
| Effort | M |
| Impact | Confidence in changes, prevents regressions |

**What to do:**
- Add Vitest as test runner (fast, Vite-compatible)
- Add React Testing Library for component tests
- Add Playwright for end-to-end tests
- Write tests for critical paths:
  - Note CRUD operations
  - Storage operations (IndexedDB read/write)
  - Migration from localStorage
  - Import/export functionality
  - Search functionality
- Add test script to package.json
- Aim for 70%+ coverage on business logic, 50%+ on components

---

## 3. Phase 2 — Experience (Editor & UX Polish)

### 3.1 Editor Experience Overhaul

| Attribute | Detail |
|---|---|
| Priority | P0 |
| Effort | L (large) |
| Impact | This IS the product — the editor must be excellent |

**A. Keyboard Shortcuts:**
- Bold: Ctrl/Cmd + B
- Italic: Ctrl/Cmd + I
- Heading: Ctrl/Cmd + 1-6
- Link: Ctrl/Cmd + K
- Code: Ctrl/Cmd + `
- Save: Ctrl/Cmd + S (triggers manual save)
- New note: Ctrl/Cmd + N
- Search: Ctrl/Cmd + F (notes search)
- Toggle preview: Ctrl/Cmd + P
- Toggle sidebar: Ctrl/Cmd + \
- Display keyboard shortcuts help overlay: Ctrl/Cmd + /

**B. Editor Enhancements:**
- Tab key inserts spaces (configurable: 2 or 4)
- Auto-indent on new line
- Auto-close brackets and quotes: (), [], "", ``
- Auto-continue lists (type "- item" + Enter → "- " on next line)
- Indent/outdent with Tab/Shift+Tab in lists
- Line numbers (optional, toggle in settings)
- Current line highlight
- Word wrap toggle
- Minimap for long documents (optional, toggle)

**C. Markdown Toolbar Improvements:**
- Add all common formatting buttons
- Group buttons logically (text formatting | lists | blocks | insert)
- Add dropdown for heading levels
- Add table insertion wizard
- Add link insertion dialog
- Show active formatting
- Make toolbar responsive — collapse to dropdown on mobile

**D. Split View Improvements:**
- Synchronized scrolling between editor and preview
- Resizable split pane (drag handle between editor and preview)
- Three view modes: edit-only, split, preview-only
- Remember last used view mode
- Proportional scroll sync

### 3.2 Preview Rendering Improvements

| Attribute | Detail |
|---|---|
| Priority | P1 |
| Effort | M |
| Impact | Better reading experience, handles edge cases |

**What to do:**
- Debounce preview rendering (don't re-render on every keystroke — wait 150ms)
- Add syntax highlighting for more languages
- Add copy button on code blocks
- Add proper table styling (borders, alternating rows, responsive scroll)
- Add task list checkbox rendering (GFM checkboxes)
- Add image rendering with lazy loading
- Add heading anchor links (click to copy link to heading)
- Add mermaid diagram support (mermaid.js)
- Add math/LaTeX support (KaTeX)
- Add footnote support
- Style improvements: better typography, reading-width constraint, proper spacing

### 3.3 Search & Organization

| Attribute | Detail |
|---|---|
| Priority | P1 |
| Effort | M |
| Impact | Essential for users with many notes |

**A. Search Improvements:**
- Full-text search across note content (not just titles)
- Fuzzy search (typo-tolerant) — use Fuse.js or similar
- Search highlights in results
- Search within current note (Ctrl+F)
- Recent searches history
- Search by tags, date range, category

**B. Organization:**
- Tags system (add/remove tags to notes, filter by tags)
- Categories or folders (simple hierarchy, one level deep)
- Favorites/pinned notes (quick access)
- Sort options: date created, date modified, title A-Z, title Z-A
- Bulk operations: select multiple notes → delete, tag, move

**C. Notes List View:**
- Card view and list view toggle
- Preview snippet in list (first 100 chars of content)
- Date display (relative: "2 hours ago", "yesterday")
- Tag pills visible in list
- Favorite star indicator
- Drag to reorder (manual sort option)

### 3.4 Mobile Experience

| Attribute | Detail |
|---|---|
| Priority | P0 |
| Effort | L |
| Impact | Huge — many users will access on mobile |

**What to do:**
- Full mobile-responsive layout
- Bottom navigation bar on mobile (thumb-friendly)
- Swipe gestures: swipe right for sidebar, swipe left for preview
- Full-screen editor mode on mobile (hide header, maximize space)
- Mobile-optimized toolbar (scrollable, compact)
- Touch-friendly buttons and tap targets (min 44x44px)
- Mobile keyboard handling (viewport resize, toolbar position)
- "Share to Markups" — receive shared text from other apps (Web Share Target API)
- Haptic feedback on actions (if available)

### 3.5 Theme System Enhancement

| Attribute | Detail |
|---|---|
| Priority | P2 |
| Effort | S |
| Impact | Personalization, developer appeal |

**What to do:**
- Current: light/dark/system — keep this as base
- Add editor theme options (syntax highlighting themes)
- Add custom accent color picker (change the primary color)
- Consider 2-3 preset themes: "Ocean", "Forest", "Sunset"
- Ensure ALL components respect theme (check for hard-coded colors)
- Add high-contrast theme option for accessibility
- Preview theme should match editor theme

---

## 4. Phase 3 — Growth (Reach & Retention)

### 4.1 PWA Implementation

| Attribute | Detail |
|---|---|
| Priority | P0 |
| Effort | M |
| Impact | Offline capability, installability, app-like experience |

**What to do:**
- Create web manifest file (manifest.json / manifest.webmanifest)
- Design app icons at all sizes (192x192, 512x512, maskable)
- Implement Service Worker with Workbox (or next-pwa)
- Cache strategy: app shell (cache-first), assets (cache-first), data (IndexedDB)
- Add install prompt UI (subtle banner, not intrusive)
- Add offline indicator (show when connection is lost)
- Ensure all features work completely offline
- Background sync for deferred operations
- Add splash screens for iOS (apple-touch-startup-image)

### 4.2 Sharing & Collaboration (Privacy-Preserving)

| Attribute | Detail |
|---|---|
| Priority | P1 |
| Effort | L |
| Impact | Viral growth, word-of-mouth |

**A. Share via URL (No Server Storage):**
- Encode short notes into URL hash (base64 compressed)
- For longer notes, use a temporary paste service or URL shortener
- Recipient opens link → note content decoded from URL → displayed in read-only mode
- Option to "Import to my notes" from shared view
- Note: URL length limit is ~2000 chars, so this works for shorter notes only

**B. Share via File:**
- Export single note as .md file
- Export collection as .zip of .md files
- Export as PDF (using browser print-to-PDF or jsPDF)
- Export as HTML (styled, self-contained)
- Share via Web Share API (mobile native share sheet)

**C. Share via QR Code:**
- Generate QR code for shared note URL
- Useful for quick phone-to-phone sharing
- Use qrcode.js or similar library (client-side generation)

**D. Collaborative Editing (Future — Phase 4+):**
- WebRTC-based P2P editing (no server)
- Room-based: create a room code, share it, peers join
- Use Yjs or Automerge for CRDT-based conflict-free editing
- No data stored on server — all in-memory during session
- Session ends when all peers disconnect

### 4.3 Import Capabilities

| Attribute | Detail |
|---|---|
| Priority | P1 |
| Effort | M |
| Impact | Onboarding users from other tools |

**What to do:**
- Import from .md files (single or batch)
- Import from .txt files (convert to markdown)
- Import from .html files (convert to markdown using turndown.js)
- Import from JSON (Markups backup format)
- Import from Notion export (JSON/MD)
- Import from Obsidian vault (.md files in folders → categories)
- Drag-and-drop file import
- Paste from clipboard (detect markdown, HTML, or plain text)
- Show import preview before confirming

### 4.4 SEO & Landing Page Optimization

| Attribute | Detail |
|---|---|
| Priority | P1 |
| Effort | S |
| Impact | Organic discovery, first impressions |

**What to do:**
- Optimize meta tags (title, description, og:image, twitter:card)
- Add structured data (JSON-LD for SoftwareApplication)
- Create Open Graph image for social sharing
- Add sitemap.xml
- Add robots.txt
- Landing page improvements:
  - Add animated demo/GIF of the editor in action
  - Add social proof (GitHub stars, user count, testimonials)
  - Add comparison table with competitors
  - Add FAQ section
  - Add "Try it now" button that goes directly to editor with a sample note
  - Feature sections with visual illustrations
  - Performance stats (load time, storage available, etc.)
  - Blog section for content marketing (optional, markdown-based)

### 4.5 Accessibility (a11y) Audit & Fixes

| Attribute | Detail |
|---|---|
| Priority | P1 |
| Effort | M |
| Impact | Inclusivity, legal compliance, better UX for everyone |

**What to do:**
- Run axe-core or Lighthouse accessibility audit
- Fix all critical and serious issues found
- Ensure proper heading hierarchy (h1 → h2 → h3, no skipping)
- Add ARIA labels to all interactive elements
- Ensure keyboard navigability (Tab order, focus indicators)
- Screen reader testing (NVDA, VoiceOver)
- Ensure color contrast ratios meet WCAG AA minimum (4.5:1 for text)
- Add skip-to-content link
- Make editor announcements for screen readers ("Note saved", "3 results found")
- Reduce motion support (respect prefers-reduced-motion)
- Focus trap in modals/dialogs

---

## 5. Phase 4 — Expansion (Advanced Features)

### 5.1 Version History

| Attribute | Detail |
|---|---|
| Priority | P2 |
| Effort | M |
| Impact | Peace of mind, undo capability |

**What to do:**
- Save version snapshots on meaningful changes (not every keystroke)
  - On explicit save (Ctrl+S)
  - Every 5 minutes of active editing
  - On significant content change (>50 chars difference)
- Version history panel: list of versions with timestamps
- Diff view: show what changed between versions (use diff library)
- Restore to previous version (with confirmation)
- Limit storage: keep last 50 versions per note, auto-prune older
- Storage-aware: if storage is getting full, reduce version retention

### 5.2 Templates System

| Attribute | Detail |
|---|---|
| Priority | P2 |
| Effort | S |
| Impact | Faster note creation, onboarding |

**What to do:**
- Built-in templates: Meeting Notes, Daily Journal, Bug Report, README, Blog Post, To-Do List, Recipe, Project Plan
- "New from template" option in note creation
- Custom templates: user can save any note as template
- Template preview before selection
- Templates stored in IndexedDB alongside notes

### 5.3 Markdown Extensions

| Attribute | Detail |
|---|---|
| Priority | P2 |
| Effort | M |
| Impact | Power user features, differentiation |

**What to do:**
- Mermaid diagrams (flowcharts, sequence diagrams)
- KaTeX math (inline and block math expressions)
- Admonitions/callouts (note, warning, tip, danger blocks)
- Wiki-style links [[note title]] for linking between notes
- Embedded note references (show content of another note inline)
- Custom containers (collapsible sections)
- Emoji shortcodes (:smile: → 😄)
- Table of contents auto-generation ([TOC] marker)

### 5.4 Command Palette

| Attribute | Detail |
|---|---|
| Priority | P2 |
| Effort | M |
| Impact | Power user productivity, discoverability |

**What to do:**
- Ctrl/Cmd + Shift + P to open command palette
- Search all available commands
- Recent commands at top
- Commands include: all formatting actions, navigation, settings, export, theme switch
- Fuzzy search for commands
- Keyboard shortcut display next to each command
- Extensible: new features auto-appear in palette

### 5.5 Focus/Zen Mode

| Attribute | Detail |
|---|---|
| Priority | P3 |
| Effort | S |
| Impact | Distraction-free writing experience |

**What to do:**
- Hide all UI chrome (header, sidebar, footer, toolbar)
- Center the editor with comfortable reading width (~700px)
- Subtle typewriter scrolling (current line stays centered)
- Ambient background options (plain, subtle gradient, nature image)
- Soft transitions entering/leaving focus mode
- Keyboard shortcut to toggle: F11 or Ctrl/Cmd + Shift + F
- Show word count and time in focus mode (bottom corner, fade on inactivity)

### 5.6 Analytics Dashboard (For the User)

| Attribute | Detail |
|---|---|
| Priority | P3 |
| Effort | S |
| Impact | Engagement, journaling motivation |

**What to do:**
- Writing streak tracker (days with at least one edit)
- Total notes count and total words written
- Notes created per week/month chart
- Most active days/times
- Storage usage breakdown
- All computed client-side from IndexedDB data
- No data sent anywhere

### 5.7 Plugin/Extension System (Long-term Vision)

| Attribute | Detail |
|---|---|
| Priority | P3 |
| Effort | XL |
| Impact | Community growth, infinite extensibility |

**What to do:**
- Define plugin API (hooks into editor, preview, toolbar, storage)
- Plugin manifest format (JSON describing capabilities)
- Plugin sandbox (isolated execution, no access to other notes without permission)
- Built-in plugin marketplace (simple listing page)
- Plugin examples: word count, reading time, grammar check, custom themes
- Community contributions
- This is a LONG-TERM feature — design for it but don't build until product-market fit is proven

---

## 6. Technical Debt & Code Quality Improvements

### 6.1 Items to Address

| Item | Priority | Effort | Description |
|---|---|---|---|
| TypeScript strict mode | P1 | S | Enable strict mode in tsconfig, fix all type errors |
| ESLint configuration | P1 | S | Add comprehensive ESLint config (recommended rules) |
| Prettier configuration | P1 | S | Add .prettierrc for consistent formatting |
| Component prop types | P1 | S | Ensure all components have proper TypeScript interfaces for props |
| Remove unused code | P2 | S | Audit for dead code, unused imports, unused variables |
| Environment variables | P2 | S | Proper .env setup with validation (zod or similar) |
| Bundle size audit | P2 | S | Run bundle analyzer, identify and fix large bundles |
| Image optimization | P2 | S | Proper sizing and formats |
| Console.log cleanup | P2 | S | Remove all console.log statements, use proper error reporting |
| Dependency audit | P2 | S | Run npm audit, update dependencies, remove unused packages |

---

## 7. What NOT to Do

Important anti-patterns to avoid:

| Anti-Pattern | Why |
|---|---|
| Don't add user authentication | It's the core differentiator — stay auth-free |
| Don't store user data on server | Privacy-first is the brand promise |
| Don't add heavy frameworks | Keep the bundle lean (no Redux, no Apollo) |
| Don't over-engineer storage | Dexie.js is sufficient |
| Don't add social features | This is a personal tool, not a social network |
| Don't add AI features yet | Focus on core editing excellence first |
| Don't chase feature parity with Notion | Markups is a focused markdown editor |
| Don't sacrifice offline capability | Every feature must work offline first |
| Don't add analytics that track content | Analytics should be anonymous usage patterns only |
| Don't redesign the UI before fixing data layer | Foundation first, polish second |

---

## 8. Improvement Priority Matrix

```
                    HIGH IMPACT
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    │  P0: DO FIRST     │  P1: DO NEXT      │
    │                   │                   │
    │  • IndexedDB      │  • PWA            │
    │  • Auto-save      │  • Keyboard       │
    │  • Error handling  │    shortcuts      │
    │  • Mobile layout  │  • Search upgrade  │
    │  • Store refactor │  • Import/export   │
    │                   │  • Accessibility   │
    │                   │  • Landing page    │
LOW ├───────────────────┼───────────────────┤ HIGH
EFFORT│                 │                   │ EFFORT
    │  P2: SCHEDULE     │  P3: PLAN         │
    │                   │                   │
    │  • Templates      │  • Version history │
    │  • Focus mode     │  • Command palette │
    │  • Theme options  │  • P2P sync       │
    │  • Analytics dash │  • Plugin system   │
    │  • TypeScript     │  • Collab editing  │
    │    strict mode    │  • Mermaid/KaTeX   │
    │                   │                   │
    └───────────────────┼───────────────────┘
                        │
                    LOW IMPACT
```

---

*This roadmap should be treated as a living document. Priorities may shift based on user feedback and product metrics. See 04-SAAS-PRODUCT-STRATEGY.md for business and product strategy.*
