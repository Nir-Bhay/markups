# Markups — Very-High-Effort Feature Research
> 6–10 initiatives estimated at 4+ weeks each, ranked by strategic impact.
> Project context: open-source, client-side only, no backend, no auth.
> Stack: Monaco, marked, IndexedDB (Dexie), BYOK AI. Repo: `D:\harmes\projects\markups`.

---

## Ranked Feature List

### 1. Full SaaS Pivot (Backend, Accounts, Cloud Sync, Billing)
| Attribute | Detail |
|-----------|--------|
| **Effort** | 4–6 months |
| **Impact** | ★★★★★ (5/5) |
| **Why it matters** | HackMD, Notion, and Obsidian Sync all prove that hosted sync + accounts is the primary monetization lever for markdown editors. StackEdit’s free tier still wins on cross-device access. The existing roadmap already lists “Shareable URLs → Cloud Sync → Auth” as Phases 1–2, so this is the natural evolution. Without a backend, Markups is permanently capped at “nice offline tool.” |
| **Technical approach** | Add a lightweight backend (e.g., Node/Express or Supabase/Firebase). Implement OAuth or email/password auth. Replace IndexedDB with a sync engine that reconciles local + remote state (CRDT or last-write-wins). Add Stripe/Paddle billing for paid tiers. Ship a hosted `markups.dev` premium plan while keeping the OSS client MIT. |
| **Team required** | Full team (2–3 eng + 1 design + 1 PM) |
| **Funding required** | Yes — infra + billing compliance + support. Seed/series-pre or bootstrap from revenue. |
| **Open source viability** | Core editor stays OSS; backend/service can be proprietary or AGPL. Dual-license is common (Obsidian sync, GitBook). |
| **Strategic fit** | Directly contradicts current “client-side only” positioning, but is the only path to sustainable revenue. Highest long-term impact because it unlocks every other feature (collab, plugins, API). |

**Honest caveat:** This is a 6-month minimum commitment and changes the project’s nature from “free tool” to “hosted product.” If the team is a single maintainer, this is not realistic without funding.

---

### 2. AI-First Editor (LLM-Native Rewrite)
| Attribute | Detail |
|-----------|--------|
| **Effort** | 4–8 weeks (MVP), 6+ months (full rewrite) |
| **Impact** | ★★★★★ (5/5) |
| **Why it matters** | Nimbalyst, Markra, and Cursor all show that “AI-native” is the 2026 differentiator. Markdown is the lingua franca of LLM training data, so an editor built around inline AI edits, streaming diffs, and context-aware generation has a defensible wedge. BYOK alone is table stakes; native means the editor architecture treats AI as first-class, not a sidebar add-on. |
| **Technical approach** | Treat the document as a state stream, not a text buffer. Add streaming SSE into Monaco decorations, inline diff previews, agentic tool loops (read/write/search), and a prompt template layer. Optional: rewrite preview renderer to support AI-generated diagrams/code. Keep BYOK; do not host models. |
| **Team required** | Small team (1 senior frontend + 1 AI/UX engineer) |
| **Funding required** | Minimal if BYOK; compute costs shift to user. |
| **Open source viability** | High — BYOK avoids hosting costs; MIT core + proprietary AI orchestration layer is viable. |
| **Strategic fit** | Leverages existing Monaco + BYOK AI, but requires rethinking editor UX around AI actions. Highest differentiation potential. |

**Honest caveat:** A true LLM-native rewrite is 6+ months. A 4–8 week “AI copilot” MVP is doable on existing architecture but will feel bolted-on, not native.

---

### 3. Native Desktop Wrapper (Tauri vs Electron)
| Attribute | Detail |
|-----------|--------|
| **Effort** | 4–8 weeks |
| **Impact** | ★★★★☆ (4/5) |
| **Why it matters** | Tauri 2.x apps ship at ~10 MB, idle at 40–80 MB RAM, and cold-start in <200 ms versus Electron’s 150 MB+ and 1.4 s (Rustify, Tech Insider, 2026). VS Code, Slack, and Discord still use Electron, but new greenfield projects in 2026 default to Tauri unless the team is 100% JavaScript. A native installer unlocks App Store / Homebrew / winget distribution and makes Markups competitive with Typora, Obsidian, and Bear on desktop. |
| **Technical approach** | Wrap the existing Vite build in Tauri v2. Add native menus, file associations (`.md`, `.markups`), auto-updater, and optional filesystem access. If the team knows no Rust, Electron is the safer 4-week path but produces a 150 MB installer. |
| **Team required** | 1 developer (frontend-heavy). 1–2 weeks Rust ramp-up if choosing Tauri. |
| **Funding required** | None required. Apple Developer account ($99/yr) if distributing on Mac App Store. |
| **Open source viability** | High. Tauri is MIT/Apache. Electron wrapper is trivial. |
| **Strategic fit** | Adds a desktop distribution channel without breaking the web app. Low risk, high perceived professionalism. |

**Honest caveat:** Monaco Editor on mobile is heavy; desktop Tauri is fine, but expect platform-specific CSS bugs in WKWebView/WebView2/WebKitGTK. Electron is faster to ship if Rust is unavailable.

---

### 4. Plugin Marketplace with Developer Tools
| Attribute | Detail |
|-----------|--------|
| **Effort** | 4–8 weeks (MVP), 6+ months (full marketplace) |
| **Impact** | ★★★★☆ (4/5) |
| **Why it matters** | Obsidian has 4,000+ community plugins (up from 7,198 themes+plugins combined per earlier data). A plugin API turns Markups from an editor into a platform. OnlyOFFICE, WordPress, and VS Code all show that ecosystems outlive individual features. |
| **Technical approach** | Define a stable plugin API (`onFileOpen`, `registerCommand`, `registerTheme`, `registerExporter`). Load plugins as ES modules or iframe-sandboxed workers. Build a registry UI (curated JSON or GitHub-based discovery). Add a plugin manager with enable/disable, auto-update, and permissions. |
| **Team required** | Small team (1 platform eng + 1 security-conscious reviewer) |
| **Funding required** | None for MVP. Curated registry hosting costs are trivial. |
| **Open source viability** | High, but security is the existential risk. Sandboxing is mandatory. |
| **Strategic fit** | Major architectural commitment. API stability is a long-term burden. |

**Honest caveat:** Sandboxing arbitrary JS/TS plugins safely in the browser is genuinely hard. One XSS in a plugin compromises all user data. If the team cannot commit to API stability and security review, skip this.

---

### 5. Native Mobile App (Capacitor / React Native)
| Attribute | Detail |
|-----------|--------|
| **Effort** | 4–8 weeks |
| **Impact** | ★★★★☆ (4/5) |
| **Why it matters** | Mobile users are second-class citizens in browser-only tools. A native wrapper unlocks App Store / Play Store distribution and offline mobile usage. Capacitor is the cheaper path if the web UI is already solid; React Native is better for performance but requires a rewrite. |
| **Technical approach** | **Capacitor:** wrap the Vite build, add bottom toolbar, swipe gestures, file picker, and keyboard insets. **React Native:** rewrite UI in RN, keep Monaco via `react-native-monaco`. Handle offline storage via WatermelonDB or Realm. |
| **Team required** | Small team (1 mobile-capable dev + 1 QA) |
| **Funding required** | Apple Developer ($99/yr), Google Play ($25 one-time). TestFlight/Internal Testing is free. |
| **Open source viability** | High for Capacitor. React Native adds maintenance burden. |
| **Strategic fit** | Expands addressable market, but mobile editing UX is different from desktop. |

**Honest caveat:** Monaco on mobile is heavy; expect 4–8 weeks of performance tuning. App stores may reject “webview wrappers” if UX is poor. React Native is 3–4 months, not 4 weeks, for a polished experience.

---

### 6. Browser Extension (Preview + Capture Anywhere)
| Attribute | Detail |
|-----------|--------|
| **Effort** | 4–6 weeks |
| **Impact** | ★★★☆☆ (3/5) |
| **Why it matters** | Markdown Preview Plus, MarkView, and Obsidian Web Clipper all have active user bases. A Markups extension would let users preview/edit markdown on any webpage and clip content into Markups. It is a distribution and retention play, not a core product pivot. |
| **Technical approach** | Build a Manifest V3 Chrome/Firefox/Edge extension. Inject a content script that renders Markups preview pane on `*.md` files and GitHub READMEs. Add a popup editor for quick edits. Sync with `markups.dev` via user token or export as file. |
| **Team required** | 1 developer (frontend + extension APIs) |
| **Funding required** | None. Chrome Web Store / Firefox Add-ons are free to publish. |
| **Open source viability** | High. |
| **Strategic fit** | Incremental distribution channel. Low strategic risk. |

**Honest caveat:** Manifest V3 restricts background scripts; content scripts on arbitrary sites face CSP walls. This is a “nice to have” that rarely drives direct revenue.

---

### 7. VSCode Extension (Markups as VS Code’s Markdown Preview)
| Attribute | Detail |
|-----------|--------|
| **Effort** | 4–6 weeks |
| **Impact** | ★★★☆☆ (3/5) |
| **Why it matters** | VS Code has 75.9% Stack Overflow usage, 50M+ monthly developers, and 100,000+ extensions (GetPanto, 2026). Markdown Preview Enhanced has 2.9M installs. A Markups extension would replace VS Code’s built-in preview with Markups’ Monaco-based preview, driving brand awareness and potential Pro conversions. |
| **Technical approach** | Contribute a VS Code extension that registers a custom Markdown preview provider. Reuse Markups’ marked/Mermaid/KaTeX pipeline. Sync scroll with editor. Publish to Open VSX and Marketplace. |
| **Team required** | 1 developer (TypeScript + VS Code extension API) |
| **Funding required** | None. |
| **Open source viability** | High. |
| **Strategic fit** | Low-risk developer-tool distribution. Does not change core product. |

**Honest caveat:** VS Code’s native markdown preview is already good. Switching cost for users is high unless Markups offers something VS Code cannot (e.g., better Mermaid/KaTeX, AI inline diffs).

---

### 8. Public API + Third-Party Integrations
| Attribute | Detail |
|-----------|--------|
| **Effort** | 4–8 weeks (API design + auth), ongoing (maintenance) |
| **Impact** | ★★★☆☆ (3/5) |
| **Why it matters** | API Management market is $10B in 2025, growing to $146B by 2034 (Market Data Forecast). A public API lets power users script workflows, embed Markups in other tools, and build integrations (Notion import, Bear import, Evernote import). It is an ecosystem play. |
| **Technical approach** | Define a REST/GraphQL API over the Markups engine (parse, render, convert). Add API key auth + rate limits. Provide webhooks for document changes. Build Notion/Obsidian/Bear import adapters as first-party integrations or expose them as community examples. |
| **Team required** | Small team (1 backend-leaning eng + 1 docs/sdk eng) |
| **Funding required** | Minimal for MVP; bandwidth costs scale with usage. |
| **Open source viability** | API can be open; hosting is where monetization lives. |
| **Strategic fit** | Requires backend. Changes client-side-only posture. |

**Honest caveat:** Without a backend, the API is just a wrapper around browser libraries. Real value comes from hosted conversion/rendering, which is a cost center unless billed.

---

### 9. Multi-Format Import (DOCX, EPUB, PDF, LaTeX, Org-mode)
| Attribute | Detail |
|-----------|--------|
| **Effort** | 4–8 weeks (browser-native), 6+ weeks (PDF/AI-assisted) |
| **Impact** | ★★★☆☆ (3/5) |
| **Why it matters** | “How can doc/docx files be converted to markdown?” is a top StackOverflow question. StackEdit and Dillinger are evaluated by import breadth. Microsoft MarkItDown, Mammoth.js, and pdf2md show the tooling exists but is fragmented. |
| **Technical approach** | **DOCX:** Mammoth.js (browser-native, DOCX → HTML → markdown). **EPUB:** epub.js or raw XML parsing. **PDF:** pdf.js text extraction + heuristic structure detection, or pipe through MarkItDown/ MinerU for AI-assisted layout recovery. **LaTeX/Org:** existing parsers (pandoc.js, org-mode parser). |
| **Team required** | 1–2 developers |
| **Funding required** | None for browser-native. AI-assisted PDF may need inference costs if using hosted LLM. |
| **Open source viability** | High. All libraries are open source. |
| **Strategic fit** | Extends Markups’ utility without backend. Natural extension of existing export features. |

**Honest caveat:** PDF import is lossy. Complex layouts, tracked changes, and images degrade gracefully but imperfectly. Set user expectations explicitly or the feature will generate more bugs than delight.

---

### 10. Notion/Obsidian Compatibility Layer
| Attribute | Detail |
|-----------|--------|
| **Effort** | 4–8 weeks |
| **Impact** | ★★★☆☆ (3/5) |
| **Why it matters** | Migration from Notion to Obsidian is a 10–20 hour manual process (Tech Insider, 2026). Both tools have official importers. A Markups importer/exporter that understands Notion block semantics and Obsidian plugin syntax (Dataview, YAML frontmatter, internal links) would lower switching costs and attract displaced users. |
| **Technical approach** | Build import adapters: (1) Notion Markdown export → normalize UUID-stripped filenames, convert callouts to alerts, flatten databases to tables. (2) Obsidian vault → preserve wikilinks, tags, frontmatter, and plugin-specific syntax. Add export-to-Notion via Notion API (requires backend token). |
| **Team required** | 1–2 developers |
| **Funding required** | None for import. Notion API export needs a backend token store; can be user-supplied. |
| **Open source viability** | High. |
| **Strategic fit** | Niche but defensible. Positions Markups as the interoperability hub. |

**Honest caveat:** Bidirectional sync with Notion is a rabbit hole. Import/export is realistic; real-time sync is not, without a backend and conflict-resolution layer.

---

## Summary Verdict

| Rank | Feature | Effort | Impact | Realistic for Solo Dev? |
|------|---------|--------|--------|------------------------|
| 1 | Full SaaS Pivot | 4–6 months | 5/5 | No — needs team + funding |
| 2 | AI-First Editor | 4–8 wks (MVP), 6+ mo (rewrite) | 5/5 | Partial — MVP yes, rewrite no |
| 3 | Native Desktop (Tauri) | 4–8 wks | 4/5 | Yes — if willing to learn minimal Rust |
| 4 | Plugin Marketplace | 4–8 wks (MVP), 6+ mo (full) | 4/5 | Partial — MVP yes, marketplace no |
| 5 | Native Mobile | 4–8 wks | 4/5 | Partial — Capacitor yes, RN no |
| 6 | Browser Extension | 4–6 wks | 3/5 | Yes |
| 7 | VSCode Extension | 4–6 wks | 3/5 | Yes |
| 8 | Public API | 4–8 wks | 3/5 | Partial — needs backend decision |
| 9 | Multi-Format Import | 4–8 wks | 3/5 | Yes |
| 10 | Notion/Obsidian Layer | 4–8 wks | 3/5 | Yes |

**Bottom line:** If Markups is a solo / small-team OSS project, prioritize **Native Desktop (Tauri)** → **AI Copilot MVP** → **Multi-Format Import** → **Browser/VS Code Extensions**. These are real 4–8 week projects that change distribution and differentiation without requiring a backend.

If the project secures funding or a full team, **Full SaaS Pivot** is the only feature that fundamentally repositions Markups from “nice editor” to “sustainable business,” but it is a 6-month bet that should be validated with a landing page + waitlist first.

---

## Sources & Evidence
- Tauri vs Electron benchmarks: Rustify.rs (Aug 2026), Tech Insider (Apr 2026), Digital Applied (Jun 2026)
- VS Code ecosystem: GetPanto (May 2025), VS Code Marketplace 100K extensions milestone
- Obsidian plugin ecosystem: Obsidian blog / forum, Reddit r/ObsidianMD
- Markdown editor market comparisons: Nimbalyst, RewriteBar, Dillinger, StackEdit
- Web clipper / extension demand: Chrome Web Store ratings, Minibase, MarkView, Obsidian Web Clipper
- API market size: Market Data Forecast, Mordor Intelligence, Straits Research (2026)
- Notion/Obsidian migration: Tech Insider (2026), Obsidian Help docs, Reddit migration threads
- AI-native editor trend: Kurtis Redux (Medium), Nimbalyst, Markra GitHub, OpenKnowledge
