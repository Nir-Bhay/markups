# MARKUPS — Implementation Walkthrough

Document Version: 1.0

Date: 2026-02-14

Purpose: A guided walkthrough of the implementation process, bridging documentation to action

Prerequisite: Read all previous documents (01-05) first

---

## 1. About This Walkthrough

This document connects the dots between the analysis, strategy, roadmap, and building guide. It walks you through the implementation journey — what to think about at each stage, what decisions you'll face, and how to navigate them.

This is NOT a code document. It's a companion guide for the person implementing the building guide (document 05).

---

## 2. Before You Start

### 2.1 Situational Awareness

Before writing a single line of code, internalize these facts from the analysis report:

- **The app already works.** Markups is a functional Markdown editor. Users can create, edit, and export notes. The goal is to evolve it, not rebuild it.
- **localStorage is the bottleneck.** The single biggest technical limitation is the ~5MB storage cap. Everything in Phase 1 exists to remove this constraint.
- **The codebase is clean.** React + Vite + Zustand is a solid foundation. You're enhancing, not rescuing.
- **Privacy is non-negotiable.** Every implementation decision must be tested against: "Does this keep data on the user's device?" If not, don't build it.

### 2.2 Development Environment Checklist

Before beginning implementation, verify:

| Item | Status | Command/Check |
|---|---|---|
| Node.js 18+ installed | Required | `node --version` |
| npm or pnpm available | Required | `npm --version` |
| Git initialized | Required | `git status` |
| Dependencies installed | Required | `npm install` |
| Dev server runs | Required | `npm run dev` |
| Build succeeds | Required | `npm run build` |
| IDE (VS Code recommended) | Recommended | Extensions: ESLint, Prettier, Vite |
| Browser DevTools proficiency | Recommended | Application tab → IndexedDB, localStorage |

### 2.3 Branch Strategy

- **main:** Production-ready, deployed to Vercel automatically
- **develop:** Integration branch for completed features
- **feature/\*:** Individual feature branches (e.g., `feature/indexeddb-setup`, `feature/auto-save`)
- Merge strategy: Feature → develop → main (via pull requests)

---

## 3. Phase 1 Walkthrough — Foundation

### 3.1 Starting Point: IndexedDB Setup (WU-F1)

**Why this is first:** Every subsequent work unit depends on reliable data storage. IndexedDB is the foundation that everything else builds on.

**Decisions you'll face:**

1. **Dexie.js version:** Use the latest stable version (currently v4.x). It has excellent TypeScript support and a modern API.

2. **Database schema versioning:** Dexie handles schema migrations automatically. Define version 1 cleanly — you can add versions later as features require new indexes or stores.

3. **Note ID format:** Use crypto.randomUUID() for generating note IDs. It's built into modern browsers, cryptographically random, and collision-proof.

4. **Lazy loading vs. eager loading:** Load note metadata (title, dates, tags) eagerly on app start, but load note content lazily (only when a note is selected). This keeps the app fast even with thousands of notes.

5. **Error handling philosophy:** Storage operations can fail (quota exceeded, corrupted data, private browsing mode). Wrap every storage operation in try/catch. Return meaningful errors, not raw IndexedDB errors.

**What to verify after completing:**
- Open browser DevTools → Application tab → IndexedDB → confirm `markups_db` exists
- Create a note programmatically → verify it appears in IndexedDB
- Read it back → verify data integrity
- Delete it → verify it's removed from IndexedDB
- Test in a private/incognito window (some browsers restrict IndexedDB)

### 3.2 Data Migration (WU-F2)

**Why this matters:** Existing users have notes in localStorage. If they update the app and their notes disappear, they'll never trust the app again. Migration must be invisible and foolproof.

**Decisions you'll face:**

1. **When to run migration:** At app initialization, before any UI renders. Use a loading screen: "Updating your data..." (should take < 1 second for most users).

2. **What if localStorage is empty?** Skip migration entirely. New users should never see migration logic.

3. **What if migration partially fails?** Roll back the entire IndexedDB transaction. Keep localStorage data intact. Show a non-blocking error: "We couldn't update your data storage. Your notes are safe — we'll try again next time."

4. **When to delete old localStorage data:** Never automatically. Add a "Clear legacy data" button in Settings that only appears after successful migration. Let the user decide.

**What to verify after completing:**
- Create several notes in the old localStorage format
- Load the app → migration runs → notes appear in IndexedDB
- Reload the app → migration doesn't run again (flag set)
- Clear localStorage manually → notes still exist in IndexedDB
- Test with 50+ notes to ensure performance is acceptable

### 3.3 Zustand Store Refactoring (WU-F3)

**Why refactor:** The current store likely mixes concerns (notes, UI state, settings). Separating them improves performance (components only re-render when their subscribed state changes), testability, and maintainability.

**Decisions you'll face:**

1. **Middleware stack:** Use `persist` (for IndexedDB/localStorage), `devtools` (for development debugging), and optionally `immer` (for immutable updates with mutable syntax). Order: `devtools(persist(immer(store)))`.

2. **Custom persist storage adapter:** Zustand's persist middleware expects a synchronous storage API (like localStorage). IndexedDB is asynchronous. You'll need to write a custom storage adapter that implements `getItem`, `setItem`, and `removeItem` as async operations, and handle the initial hydration carefully (show loading state while IndexedDB loads).

3. **Selector patterns:** Use Zustand's `useShallow` or individual selectors to prevent unnecessary re-renders. Instead of `const { notes, activeNote } = useNoteStore()`, use `const notes = useNoteStore(state => state.notes)`.

4. **Migration from mono-store:** Don't rewrite everything at once. Create the new stores, then migrate one component at a time. Keep the old store temporarily, removing it only when all components have migrated.

**What to verify after completing:**
- React DevTools shows component re-renders are minimal
- Zustand DevTools shows state changes clearly
- Settings persist across page refreshes (localStorage)
- Note list loads from IndexedDB on refresh
- UI state resets on refresh (sidebar default, view mode default)

### 3.4 Auto-Save (WU-F4)

**This is about trust.** Users need to feel that Markups will never lose their work.

**Decisions you'll face:**

1. **Debounce interval:** 1.5-2 seconds after last keystroke is the sweet spot. Too short = excessive writes. Too long = potential data loss if tab closes.

2. **Save indicator design:** Keep it subtle. A small text in the status bar: "Saving..." → "Saved" is sufficient. Don't use modals or intrusive notifications for auto-save. Consider a small dot indicator (orange while saving, green when saved).

3. **Conflict between auto-save and manual save:** Ctrl+S should save immediately (cancel the debounce timer and save now). Show the same "Saved" indicator.

4. **What to save:** Save both content and metadata (wordCount, updatedAt) on each save. Don't save a version snapshot on every auto-save — that's too frequent. Save version snapshots on manual save (Ctrl+S) only.

**What to verify after completing:**
- Type in editor → stop → "Saving..." appears → "Saved" appears → content persists on refresh
- Close browser tab while typing → reopen → last auto-saved content is there
- Switch tabs → content auto-saves
- Ctrl+S → immediate save → indicator confirms

### 3.5 Error Boundaries (WU-F5)

**Decisions you'll face:**

1. **Granularity:** Too many error boundaries = complex, hard to maintain. Too few = large sections fail together. The recommended three (editor, notes list, preview) plus one app-level boundary is the right balance.

2. **Fallback content:** Each boundary should have a meaningful fallback. The editor boundary should offer "Try reloading the editor" with a button. The preview boundary should show the raw markdown text. The notes list boundary should show "Unable to load notes" with a refresh button.

3. **Error reporting:** In development, show full error details. In production, show user-friendly messages and send errors to a logging service (Sentry free tier) if configured.

---

## 4. Phase 2 Walkthrough — Experience

### 4.1 General Philosophy

Phase 2 is about making the editor feel premium. Every interaction should feel smooth, fast, and intentional. Think about the small details:
- Button hover effects
- Transition animations (150-200ms)
- Focus states
- Consistent spacing
- Typography that's easy on the eyes

### 4.2 Keyboard Shortcuts (WU-E1)

**Key consideration:** Keyboard shortcuts must NOT conflict with browser defaults. Test every shortcut in Chrome, Firefox, Safari, and Edge. If there's a conflict, change the shortcut, not the override.

**Platform detection:** Use `navigator.platform` or `navigator.userAgentData` to detect Mac vs. Windows/Linux. Show "⌘" for Mac and "Ctrl" for others.

### 4.3 Editor Improvements (WU-E2)

**Key consideration:** Monaco Editor (which the project uses) already handles many of these features. Before building custom solutions, check what Monaco provides out of the box: tab handling, auto-indent, line numbers, minimap, bracket matching. Configure Monaco options before writing custom code.

### 4.4 Preview Improvements (WU-E3)

**Key consideration:** Debounced rendering is critical. Without it, the preview re-renders on every keystroke, which causes lag for long documents. A 150-200ms debounce is imperceptible to the user but dramatically reduces renders.

**Scroll synchronization** is the hardest part of this work unit. Markdown source and HTML output don't have a 1:1 line mapping. The most reliable approach is proportional scrolling (if editor is 30% scrolled, scroll preview to 30%).

### 4.5 Search & Organization (WU-E4)

**Key consideration:** Full-text search across note content is the killer feature for users with many notes. Fuse.js provides excellent fuzzy search, but for very large note collections (1000+), you may want to build a simple inverted index or use Dexie's built-in filtering capabilities.

### 4.6 Mobile Experience (WU-E5)

**Key consideration:** Mobile is not a smaller version of desktop. It's a fundamentally different interaction model. Design for one-handed use. Navigation at the bottom. Large tap targets. View switching instead of split panes.

---

## 5. Phase 3 Walkthrough — Growth

### 5.1 PWA (WU-G1)

**Critical:** The PWA must pass Google's Lighthouse PWA audit with a perfect score. Test with `lighthouse --view` during development. The main requirements: valid manifest, registered service worker, HTTPS, responsive, offline-capable.

### 5.2 Import/Export (WU-G2)

**Critical:** Export must produce valid, standard-format files. A Markdown export should be pure .md that opens correctly in any Markdown editor. Don't add proprietary metadata. Import should handle messy inputs gracefully — real-world .md files have inconsistent formatting.

### 5.3 Landing Page & SEO (WU-G3)

**Critical:** The landing page must load fast (< 2 seconds on 3G), look professional, and clearly communicate the value proposition in the first viewport (above the fold). A/B test the CTA button text: "Start Writing" vs "Open Editor" vs "Try Markups".

---

## 6. Decision Framework

When facing implementation decisions, use this priority order:

1. **Does it preserve privacy?** If it sends data anywhere, don't do it.
2. **Does it work offline?** If it requires network, it's a progressive enhancement, not a core feature.
3. **Does it keep the app fast?** If it adds > 50ms to any interaction, optimize it.
4. **Does it add complexity?** Prefer simpler solutions. Every line of code is a liability.
5. **Does the user need it?** Build what users need, not what's technically interesting.

---

## 7. Common Pitfalls to Avoid

| Pitfall | Why It Happens | How to Avoid |
|---|---|---|
| Over-engineering the database | Trying to anticipate every future need | Start with minimal schema, add as needed |
| Blocking the main thread | Synchronous operations on large data | Use async operations, Web Workers for heavy tasks |
| Ignoring Safari | Testing only in Chrome | Test every feature in Safari (different IndexedDB behavior) |
| Premature optimization | Optimizing before measuring | Profile first, optimize only measured bottlenecks |
| Feature creep | Adding "just one more thing" | Stick to the phase — complete it fully before moving on |
| Inconsistent UI state | Multiple sources of truth | Single store per domain, selectors for derived state |
| Not handling edge cases | Assuming happy path | Test: empty state, max storage, slow network, private browsing |

---

## 8. Quality Gates

Before moving from one phase to the next, ensure:

### Phase 1 → Phase 2 Gate

- [ ] All notes stored in IndexedDB (not localStorage)
- [ ] Migration works for existing users
- [ ] Auto-save works reliably
- [ ] Error boundaries prevent crashes
- [ ] No data loss in any scenario tested
- [ ] Build succeeds with zero warnings

### Phase 2 → Phase 3 Gate

- [ ] Keyboard shortcuts work on all platforms
- [ ] Editor enhancements feel natural
- [ ] Preview renders correctly for all GFM features
- [ ] Search returns results in < 200ms
- [ ] Mobile layout is usable and pleasant
- [ ] No performance regressions (Lighthouse performance 90+)

### Phase 3 → Phase 4 Gate

- [ ] PWA passes Lighthouse audit (100 on PWA category)
- [ ] App works fully offline
- [ ] All import/export formats work correctly
- [ ] Landing page loads in < 2 seconds on 3G
- [ ] SEO score 95+
- [ ] User retention metrics improving

---

## 9. Measuring Success

After each phase, ask:

1. **Is the app more reliable?** (fewer errors, no data loss)
2. **Is the app faster?** (Lighthouse scores, interaction latency)
3. **Is the app easier to use?** (less confusion, more features discovered)
4. **Are users coming back?** (retention metrics)
5. **Would I recommend this to a friend?** (the ultimate test)

---

## 10. Final Notes

Markups is a product built on a simple promise: **your notes, your device, your privacy.** Every implementation decision should reinforce this promise. When in doubt, choose the option that keeps data local, keeps the app fast, and keeps the experience simple.

Build with care. Ship with confidence. Iterate with feedback.

---

*This concludes the Markups documentation suite. The six documents together form a complete blueprint:*

| # | Document | Purpose |
|---|---|---|
| 01 | Project Analysis Report | Where we are |
| 02 | Architecture & Data Strategy | Where we want to go |
| 03 | Improvement & Optimization Roadmap | What to build and when |
| 04 | SaaS Product Strategy | The business and product vision |
| 05 | Building Guide | How to build it (work units) |
| 06 | Implementation Walkthrough | How to think about building it |
