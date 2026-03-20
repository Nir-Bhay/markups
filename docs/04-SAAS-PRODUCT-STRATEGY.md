# MARKUPS — SaaS Product Strategy Document

Document Version: 1.0

Date: 2026-02-14

Purpose: Product strategy for Markups as a free, privacy-first SaaS product

Prerequisite: Read documents 01, 02, and 03 first

---

## 1. Product Identity

### 1.1 One-Line Description

**Markups** — The free, private, offline-first Markdown editor that never touches your data.

### 1.2 Elevator Pitch

Markups is a beautiful, fast Markdown editor that works entirely in your browser. No sign-ups, no cloud storage, no data collection. Your notes live on your device, always. Write, organize, and export Markdown notes with zero friction — online or offline. Open your browser and start writing.

### 1.3 Core Values

| Value | Description |
|---|---|
| **Privacy by architecture** | Not by policy, by design. We can't access your data because it never leaves your device. |
| **Zero friction** | No account, no setup, no paywall. Open the URL, start writing. |
| **Offline-first** | Works without internet after first visit. Your notes don't depend on our servers. |
| **Open & transparent** | Open-source, auditable, trustworthy. |
| **Focused simplicity** | Do one thing excellently: Markdown editing. |

### 1.4 Target Users

| User Segment | Description | Priority |
|---|---|---|
| Developers | Write docs, READMEs, notes in Markdown daily | Primary |
| Technical Writers | Create documentation, guides, tutorials | Primary |
| Privacy-Conscious Users | Refuse to use tools that store their data | Primary |
| Students | Note-taking for technical courses | Secondary |
| Bloggers | Draft blog posts in Markdown before publishing | Secondary |
| Casual Note-Takers | Quick notes without installing an app | Secondary |
| Journalists | Private note-taking, source protection | Tertiary |
| Researchers | Literature notes, research journals | Tertiary |

### 1.5 User Personas

**Persona 1: Dev Priya**
- Full-stack developer, 28 years old
- Uses Markdown daily for docs, README files, notes
- Privacy-conscious, dislikes creating accounts for simple tools
- Works across laptop and phone
- Wants: Fast editor, syntax highlighting, quick export to .md
- Pain: Current tools require accounts or are desktop-only

**Persona 2: Student Arjun**
- Computer science student, 21 years old
- Takes lecture notes, writes project documentation
- Uses library computers and personal laptop (needs browser-based)
- Budget: Zero — free is essential
- Wants: Organized notes, search, clean interface
- Pain: Notion requires account, Google Docs isn't Markdown

**Persona 3: Writer Sarah**
- Technical blogger, 34 years old
- Drafts articles in Markdown, exports to CMS
- Works from coffee shops, sometimes without reliable WiFi
- Wants: Distraction-free writing, offline capability, PDF export
- Pain: Online editors fail without internet

---

## 2. Product Positioning

### 2.1 Positioning Statement

For developers, writers, and privacy-conscious individuals who need a reliable Markdown editor, Markups is a free, browser-based, offline-first writing tool that keeps all data on your device. Unlike Notion, Google Docs, or HackMD, Markups requires no account, stores nothing on servers, and works without internet.

### 2.2 Competitive Positioning Map

```
                    PRIVACY / LOCAL DATA
                           │
                           │
         Obsidian ●        │        ● Markups (Target)
                           │
         Typora ●          │
                           │
     ──────────────────────┼──────────────────────
     DESKTOP/INSTALLED     │     WEB/BROWSER-BASED
                           │
                           │
         VS Code ●         │        ● StackEdit
                           │
                           │        ● HackMD
                           │        ● Notion
                           │
                    SERVER / CLOUD DATA
```

Markups occupies the **top-right quadrant** — web/browser-based AND privacy/local data. This is the least crowded quadrant and the highest-growth opportunity.

### 2.3 Key Differentiators

| Differentiator | Markups | Notion | Obsidian | StackEdit |
|---|---|---|---|---|
| No account required | Yes | No | Yes | Optional |
| Works in browser | Yes | Yes | No (desktop) | Yes |
| Offline capable | Yes (PWA) | Limited | Yes | Limited |
| Data on device only | Yes | No (cloud) | Yes | Optional |
| Open source | Yes | No | No | Yes |
| Free forever (core) | Yes | Freemium | Freemium | Yes |
| Mobile web support | Yes | Yes | No | Limited |
| Zero install | Yes | N/A | No | Yes |

---

## 3. SaaS Model — Free-Core with Optional Premium

### 3.1 Philosophy

Markups is free for everyone, forever. The core product — editing, organizing, and exporting Markdown notes — will never be behind a paywall. This is a promise and a positioning strategy.

However, sustainability requires revenue. The model is:
- **Core (free):** Everything in the editor, storage, organization, export
- **Premium (optional):** Advanced convenience features that require infrastructure

### 3.2 Free Tier (Core Product)

Everything a user needs to write and manage Markdown notes:

- Full Markdown editor with live preview
- Unlimited notes (limited only by device storage)
- GFM, syntax highlighting, tables, task lists
- Dark/light/system themes
- Note organization (tags, categories, favorites)
- Full-text search
- Keyboard shortcuts
- Auto-save
- Version history (local)
- Export: .md, .html, .pdf, .txt, bulk .zip
- Import: .md, .txt, .html, other editors' formats
- PWA / offline mode
- Templates
- Focus/zen mode
- Command palette
- All current and future core editing features

### 3.3 Premium Tier (Optional — Future)

Features that require server infrastructure or significant development:

| Feature | Why Premium | Pricing Consideration |
|---|---|---|
| Cloud Sync (User's Storage) | OAuth integration, maintaining connectors for Google Drive, Dropbox, OneDrive | $3-5/month |
| P2P Real-time Collaboration | Signaling server infrastructure | $3-5/month |
| Extended Version History | Complex versioning logic, larger storage guidance | Include with sync |
| Priority Support | Human support costs | $3-5/month |
| Custom Themes | Additional design work | Include with any premium |
| Advanced Export | DOCX, EPUB, custom-styled PDF | $3-5/month |

**Recommended pricing:** Single tier, $4/month or $36/year, includes all premium features.

### 3.4 Alternative Revenue Models (Complement, Not Replace)

| Model | Approach | Pros | Cons |
|---|---|---|---|
| Donations / Sponsors | GitHub Sponsors, Buy Me a Coffee, Open Collective | Aligns with open-source values | Unpredictable income |
| Affiliate | Recommend hosting/tools, earn commission | Passive | Can feel inauthentic |
| Enterprise | Self-hosted version with admin features | High value | Very different product |
| Marketplace | Premium templates, themes by community | Scalable | Needs community first |
| One-time Purchase | "Pro" upgrade, pay once | Simple | Less sustainable |

**Recommended approach:** Start with donations (GitHub Sponsors), validate demand. If user base grows, introduce optional $4/month tier. Never gate core features.

---

## 4. User Journey Design

### 4.1 First-Time User Journey

```
Step 1: DISCOVERY
User finds Markups via search, social media, or recommendation
→ Lands on landing page
→ Sees clear value proposition and "Start Writing" CTA

Step 2: INSTANT VALUE (< 5 seconds)
User clicks "Start Writing"
→ Editor opens immediately with a welcome/sample note
→ No signup wall, no onboarding wizard
→ User can start typing immediately

Step 3: EXPLORATION (first session)
User notices features naturally:
→ Toolbar shows formatting options
→ Preview pane shows rendered output
→ Sidebar shows notes list
→ Theme toggle visible

Step 4: FIRST SAVE (automatic)
User types content → auto-saved to IndexedDB
→ Subtle "Saved" indicator confirms
→ User feels safe — data is persisted

Step 5: RETURN VISIT
User opens Markups again → last note is loaded
→ All notes are there → trust established
→ User starts creating more notes

Step 6: POWER USER
User discovers keyboard shortcuts, search, tags
→ Installs as PWA
→ Uses regularly
→ Tells friends/colleagues
→ Maybe exports, maybe not — it just works

Step 7: ADVOCACY
User shares Markups on social media / with team
→ "I found this amazing Markdown editor that doesn't need an account"
→ Organic growth
```

### 4.2 Returning User Journey

```
Open Markups (or PWA) → Last edited note loads → Continue writing
                                                        │
                              OR: Switch notes ← Browse sidebar
                              OR: Search notes ← Ctrl+F / search bar
                              OR: Create new ← Ctrl+N / + button
                              OR: Export/share ← Export button
```

### 4.3 Migration User Journey (From Other Tools)

```
Step 1: User clicks "Import" in sidebar/settings
Step 2: Selects source format (.md, .txt, Notion export, Obsidian vault)
Step 3: Drops files or selects folder
Step 4: Preview imported notes (count, titles)
Step 5: Confirm import → Notes added to collection
Step 6: User is now using Markups as primary tool
```

---

## 5. Growth Strategy

### 5.1 Organic Growth Channels

| Channel | Strategy | Effort |
|---|---|---|
| SEO | Rank for "free markdown editor", "online markdown editor no signup", "private markdown editor" | Medium |
| Product Hunt | Launch on Product Hunt with strong positioning | One-time |
| Hacker News | "Show HN: I built a markdown editor that stores nothing on servers" | One-time |
| Dev.to / Hashnode | Write about the architecture, privacy-first approach | Ongoing |
| Reddit | r/programming, r/webdev, r/privacytoolsIO, r/selfhosted | Ongoing |
| Twitter/X | Developer audience, privacy community | Ongoing |
| GitHub | Open source visibility, README, topics, stars | Ongoing |
| Word of mouth | Product quality drives organic sharing | Automatic |

### 5.2 Content Marketing Topics

- "Why your notes should stay on your device"
- "Building an offline-first web app with Vite and IndexedDB"
- "The case against note-taking apps that require accounts"
- "How to write a README that people actually read" (with Markups demo)
- "Markdown tips and tricks for developers"
- Comparison articles: "Markups vs Notion vs Obsidian for developers"

### 5.3 Virality Features

- **Share via URL:** Encode notes in URL hash — recipient sees note, can import it
- **Share button:** Web Share API on mobile, copy link on desktop
- **QR code sharing:** Quick phone-to-phone note sharing
- **"Made with Markups"** footer on exported HTML/PDF (optional, user can remove)
- **Referral motivation:** Product is so frictionless that sharing IS the referral

### 5.4 Retention Strategy

- **PWA install prompt:** After 3rd visit, suggest installing as app
- **Streak tracking:** Writing streaks encourage daily use
- **Templates:** Reduce effort to create new notes
- **Keyboard shortcuts:** Invested users don't switch tools
- **Data gravity:** More notes = harder to leave = higher retention
- **Reliability:** Never lose data, always work → trust → retention

---

## 6. Success Metrics (KPIs)

### 6.1 Product Metrics

| Metric | Definition | Target (6 months) |
|---|---|---|
| Monthly Active Users (MAU) | Unique visitors who open editor | 10,000 |
| Daily Active Users (DAU) | Unique visitors who edit a note | 1,500 |
| Retention (D7) | Users who return within 7 days | 30% |
| Retention (D30) | Users who return within 30 days | 15% |
| Notes Created | Total notes created (anonymous count) | 50,000 |
| PWA Installs | Users who install as PWA | 500 |
| Session Duration | Average time per visit | 15 minutes |
| Bounce Rate | Landing page visitors who don't open editor | < 40% |

### 6.2 How to Measure (Privacy-Preserving)

Since we don't track users, metrics must be anonymous and aggregated:

- **Vercel Analytics:** Page views, unique visitors, geography (already active)
- **Vercel Speed Insights:** Performance metrics (already active)
- **Anonymous event tracking:** Track feature usage without user identity
  - "Note created" (count only, no content)
  - "Export triggered" (format only)
  - "PWA installed"
  - "Theme changed"
- All tracking must be opt-in or anonymized beyond identification
- **GitHub:** Stars, forks, issues as community health indicators

### 6.3 Business Metrics (When Premium Launches)

| Metric | Target (Year 1) |
|---|---|
| Free → Premium conversion | 2-3% |
| Monthly Recurring Revenue (MRR) | $500+ |
| Churn rate | < 5% monthly |
| Customer Lifetime Value (CLV) | $40+ |
| Donation revenue | $100/month |

---

## 7. Brand & Design Language

### 7.1 Brand Attributes

- **Clean:** Minimal, uncluttered, purposeful
- **Fast:** Instant load, instant response
- **Trustworthy:** Privacy promise, open source
- **Developer-friendly:** Markdown-native, keyboard-first
- **Modern:** Contemporary design, current tech stack

### 7.2 Visual Identity Suggestions

- **Color palette:** Neutral base (slate/zinc) with a single accent color (blue, teal, or green)
- **Typography:** Monospace for editor (JetBrains Mono, Fira Code), clean sans-serif for UI (Inter, Geist)
- **Logo concept:** Simple, geometric, recognizable at small sizes. Consider a stylized "M" or markdown symbol
- **Tone of voice:** Friendly but professional, concise, no jargon, no corporate speak
- **Illustration style:** If used, simple line drawings or geometric shapes — not stock photos

### 7.3 Design Principles

- **Content first:** The user's text is the star — UI should support, not compete
- **Progressive disclosure:** Show basic features first, reveal advanced features as needed
- **Consistent patterns:** Same interactions work the same way everywhere
- **Fast feedback:** Every action has immediate, visible feedback
- **Forgiving design:** Easy undo, confirmation for destructive actions, recovery options

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Browser clears localStorage/IndexedDB | Medium | High (data loss) | Auto-backup reminders, export guidance, storage persistence API |
| Competitor copies privacy-first approach | Medium | Medium | Build brand and community moat, move fast on features |
| Users expect cloud sync | High | Medium | Clear positioning, provide file-based sync, premium cloud sync |
| Performance issues with many notes | Medium | High | IndexedDB indexing, virtualization, pagination |
| Mobile editing is poor | High | High | Invest heavily in mobile UX (Phase 2 priority) |
| Low monetization potential | Medium | Medium | Keep costs low (Vercel free tier), donation model |
| IndexedDB browser bugs | Low | High | Fallback to localStorage, data integrity checks |
| User doesn't understand "no cloud" | Medium | Low | Clear onboarding messaging, FAQ |

---

## 9. Technical SaaS Considerations

### 9.1 Hosting & Infrastructure (Current: Vercel)

Vercel is the right choice for this product:
- Free tier covers most needs (100GB bandwidth, serverless functions)
- Edge network for fast global delivery
- Automatic HTTPS
- Preview deployments for testing
- Analytics & Speed Insights built in
- Zero server management

**Cost projection:**

| Stage | Monthly Cost | Traffic |
|---|---|---|
| Launch | $0 (free tier) | < 100GB bandwidth |
| Growth (10K MAU) | $0-20 | ~100-200GB bandwidth |
| Scale (100K MAU) | $20-50 | ~500GB bandwidth |

Since the app is a PWA that caches itself, bandwidth is low. After first visit, most requests are served from cache.

### 9.2 Domain & DNS

- Primary: markups.dev (or markups.app, markups.ink — check availability)
- DNS: Vercel DNS or Cloudflare (free, with DDoS protection)

### 9.3 CI/CD Pipeline

- GitHub Actions for: linting, testing, type checking, build verification
- Vercel auto-deploy on push to main
- Preview deployments for pull requests
- Staging branch for pre-production testing

### 9.4 Monitoring

- Vercel Speed Insights (real user performance)
- Vercel Analytics (traffic)
- Sentry (error tracking, free tier) — client-side errors only
- Uptime monitoring (UptimeRobot, free)

### 9.5 Legal Requirements

- **Privacy Policy:** Must state what data is (not) collected
- **Terms of Service:** Basic terms for using the web app
- **Cookie Banner:** Likely not needed (no tracking cookies), but Vercel Analytics may require notice
- **Open Source License:** Choose MIT, Apache 2.0, or AGPL based on philosophy
- **GDPR:** Largely compliant by design (no personal data collected/stored)
- **Accessibility Statement:** Document commitment to accessibility

---

## 10. Launch Checklist

### Pre-Launch

- [ ] Core editor features complete and polished
- [ ] IndexedDB storage working reliably
- [ ] Auto-save working
- [ ] PWA installable and working offline
- [ ] Mobile responsive
- [ ] Accessibility audit passed
- [ ] Performance audit passed (Lighthouse 90+ all categories)
- [ ] Landing page optimized
- [ ] SEO meta tags and OG images
- [ ] Privacy policy page
- [ ] README updated with features, screenshots, tech stack
- [ ] Open source license added
- [ ] Error tracking setup (Sentry)

### Launch Day

- [ ] Product Hunt submission
- [ ] Hacker News "Show HN" post
- [ ] Twitter/X announcement
- [ ] Reddit posts (r/webdev, r/programming, r/SideProject)
- [ ] Dev.to / Hashnode blog post
- [ ] GitHub repository visibility (topics, description, social preview)

### Post-Launch (Week 1-2)

- [ ] Monitor error reports
- [ ] Respond to GitHub issues
- [ ] Gather user feedback
- [ ] Fix critical bugs immediately
- [ ] Write follow-up blog post with launch results
- [ ] Thank early supporters

---

*This document defines the product WHAT and WHY. See 05-BUILDING-GUIDE.md for the actionable implementation plan.*
