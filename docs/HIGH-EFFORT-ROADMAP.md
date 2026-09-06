# Markups — High-Effort Roadmap Research
> 8–12 features estimated at 1–2 weeks each, ranked by user-visible impact.
> Project context: client-side only, no backend, no accounts. Stack: Monaco, marked, IndexedDB (Dexie), BYOK AI.

---

## Ranked Feature List

### 1. Real-Time Collaboration (Yjs + WebRTC / Signaling)
| Attribute | Detail |
|-----------|--------|
| **Effort** | 2 weeks |
| **Impact** | ★★★★★ (5/5) |
| **Why it matters** | HackMD’s entire positioning is "realtime collaborative markdown." StackEdit, Google Docs, and Notion all treat collab as table stakes. Yjs has **900k+ weekly npm downloads** and is the de-facto standard for browser CRDTs. |
| **Technical approach** | `yjs` + `y-monaco` bindings for the Monaco editor. For signaling: `y-webrtc` (peer-to-peer, no backend required) or a lightweight WebSocket relay. Conflict resolution is automatic via CRDT — no manual merge UI required for same-doc editing. |
| **Dependencies** | None strictly required if using y-webrtc (STUN/TURN only). If y-websocket is chosen, a small relay server is needed. |
| **Risks** | Medium. WebRTC can be flaky behind symmetric NATs; TURN relay costs money. Presence/cursors add UI complexity. |
| **Demand evidence** | HackMD homepage headline; Reddit threads asking for browser-based collab; Liveblocks/Yjs blog posts showing enterprise adoption. |

---

### 2. Cloud Sync via User-Owned Storage (OAuth + Google Drive / Dropbox / GitHub Gist)
| Attribute | Detail |
|-----------|--------|
| **Effort** | 2 weeks |
| **Impact** | ★★★★★ (5/5) |
| **Why it matters** | Issue **#14** is explicitly open for this. StackEdit’s #1 advertised feature is "Sync with Google Drive, Dropbox and GitHub." Users repeatedly ask for cross-device access on Reddit and Obsidian forums. |
| **Technical approach** | Browser-native OAuth 2.0 PKCE flow — no custom backend needed. Use Google Picker API / Dropbox Chooser / GitHub OAuth. Store encrypted tokens in IndexedDB. Debounced auto-sync every 3–5 seconds. Conflict strategy: manual merge prompt or "latest wins." |
| **Dependencies** | OAuth client IDs from Google/Dropbox/GitHub (free tier available). No server required. |
| **Risks** | High. OAuth app review takes days. Token revocation/refresh UX is tricky. API rate limits (Google Drive: 10k req/day free). Dropbox/Google APIs change frequently. |
| **Demand evidence** | GitHub issue #14 (open, blocked on backend decision). StackEdit feature page. Multiple Reddit posts asking for GDrive-synced markdown PKM. |

---

### 3. Advanced AI Copilot (Streaming Chat + Inline Diffs + Tool Use)
| Attribute | Detail |
|-----------|--------|
| **Effort** | 2 weeks |
| **Impact** | ★★★★☆ (4/5) |
| **Why it matters** | Markups already has BYOK AI, but "Copilot" means more than inline suggestions — it means a sidebar chat, streaming diffs, context-aware edits, and tool calls. VS Code, Cursor, and Nimbalyst all market "AI-native" or "Copilot-like" workflows as their 2026 differentiator. |
| **Technical approach** | Extend existing BYOK AI with: (1) streaming SSE responses into a chat panel, (2) Monaco decoration-based inline diff preview, (3) system prompt templates for common tasks (summarize, fix grammar, convert to HTML), (4) optional tool-call loop for file operations. |
| **Dependencies** | BYOK API key from user. No new backend. |
| **Risks** | Medium. Prompt injection in markdown context. Token cost surprises for users. Diff UX needs careful design to avoid flicker. |
| **Demand evidence** | VS Code 2026 release notes highlight Copilot + Markdown integration. "Best markdown editor 2026" comparisons consistently rank AI integration as top criterion. |

---

### 4. Plugin / Extension System (Sandboxed)
| Attribute | Detail |
|-----------|--------|
| **Effort** | 2 weeks |
| **Impact** | ★★★★☆ (4/5) |
| **Why it matters** | Obsidian has **7,198 community plugins and 727 themes**. Even closed-source editors like Typora are evaluated by plugin extensibility. A plugin system turns Markups from an editor into a platform. |
| **Technical approach** | Define a minimal plugin API (`onFileOpen`, `onEditorAction`, `registerCommand`, `registerTheme`). Load plugins as ES modules from CDN or local files. Sandbox via iframe + postMessage or Web Worker to prevent XSS. Provide a plugin manager UI with enable/disable toggle. |
| **Dependencies** | None server-side. Plugin registry could start as a curated JSON file or GitHub repo list. |
| **Risks** | High. Security is the biggest concern — arbitrary code execution in the user’s browser. API surface must be stable or plugins break on every release. |
| **Demand evidence** | Obsidian community plugin count (7,198). FSNotes GitHub issue #500 explicitly requests plugin API. Reddit threads compare editors by ecosystem size. |

---

### 5. Multi-Document Workspace (Split / Tree / Drag-Drop)
| Attribute | Detail |
|-----------|--------|
| **Effort** | 1–2 weeks |
| **Impact** | ★★★★☆ (4/5) |
| **Why it matters** | Markups already has multi-tab support, but StackEdit, HackMD, and Obsidian offer **file trees, split panes, and drag-drop reordering**. Users with 10+ files need spatial organization, not just tabs. |
| **Technical approach** | Add a collapsible file-tree sidebar (tree view of Dexie documents). Implement split-view for side-by-side editing of two files. Drag-and-drop tab reordering via `@dnd-kit/core` or native HTML5 DnD. Persist layout to IndexedDB. |
| **Dependencies** | None beyond existing Dexie storage. |
| **Risks** | Low–Medium. Split-view state management adds complexity. Monaco instances are heavy; two instances can hurt performance on low-end devices. |
| **Demand evidence** | StackEdit homepage highlights "file explorer on the left corner." MDPeak App Store description explicitly calls out "Multi-Document Workspace." Reddit post "ultimate multi-pane agentic markdown workspace." |

---

### 6. Git Integration (isomorphic-git + GitHub/GitLab remote)
| Attribute | Detail |
|-----------|--------|
| **Effort** | 2 weeks |
| **Impact** | ★★★☆☆ (3/5) |
| **Why it matters** | The roadmap explicitly lists "GitHub & Git sync" for Q3. Developers want to version notes, branch drafts, and publish via git. isomorophic-git runs fully in the browser. |
| **Technical approach** | `isomorphic-git` for local git operations (init, add, commit, log, diff). For remote: GitHub/GitLab OAuth + REST API (`git/trees`, `git/blobs`, `git/commits`). Show commit history + diff preview in a sidebar. Allow checkout of branches. |
| **Dependencies** | OAuth client ID for GitHub/GitLab (free). BrowserFS or OPFS for `.git` directory storage. |
| **Risks** | Medium. isomorophic-git is large (~500KB gzipped). Browser storage limits for large repos. OAuth scope creep. No push/pull over SSH in browser — only HTTPS APIs. |
| **Demand evidence** | Markups roadmap Q3. Markdown++ blog post mentions isomorphic-git for browser-based git sync. Reddit "self-hosted browser-based markdown editor" discussions. |

---

### 7. Vim / Emacs Keybinding Modes
| Attribute | Detail |
|-----------|--------|
| **Effort** | 1 week |
| **Impact** | ★★★☆☆ (3/5) |
| **Why it matters** | Vim and Emacs users are loyal and vocal. `monaco-vim` already exists. Logseq, Obsidian, and VS Code all ship vim modes. It’s a low-cost feature that removes a major adoption blocker for power users. |
| **Technical approach** | Integrate `monaco-vim` for Vim mode. For Emacs mode, use `monaco-emacs` or custom keybinding bindings via Monaco’s `addCommand` + `addAction` APIs. Toggle via settings dropdown. Persist preference to IndexedDB. |
| **Dependencies** | None. `monaco-vim` is a standalone npm package. |
| **Risks** | Low. Monaco-vim has known webpack/browserify bundling quirks — Vite may need manual alias. Emacs keybindings are less standardized; expect 70–80% coverage. |
| **Demand evidence** | Livebook GitHub issue #715 requesting vim mode. Logseq feature request for vim-mode. Multiple "vim-friendly markdown editor" Reddit posts. |

---

### 8. Theme Marketplace (Import / Export / Gallery)
| Attribute | Detail |
|-----------|--------|
| **Effort** | 1 week |
| **Impact** | ★★★☆☆ (3/5) |
| **Why it matters** | Markups already ships VS Light/Dark, Dracula, GitHub, Solarized. A marketplace lets the community extend visual identity without core changes. Obsidian’s 727 themes show demand. |
| **Technical approach** | Themes are JSON objects mapping Monaco token colors + CSS variables. Add a theme gallery page (static JSON + previews). Allow `.json` import/export. Persist custom themes to IndexedDB. |
| **Dependencies** | None server-side. A gallery page could be a static Vite route. |
| **Risks** | Low. Security risk from malicious themes is minimal if themes are pure JSON (no code execution). |
| **Demand evidence** | Reddit post "markdown with per-file or per-folder themes." Obsidian community has 727 themes. Markups roadmap Q3 lists "Templates marketplace" — themes are a natural subset. |

---

### 9. PDF / DOCX Import
| Attribute | Detail |
|-----------|--------|
| **Effort** | 1–2 weeks |
| **Impact** | ★★★☆☆ (3/5) |
| **Why it matters** | Users have existing docs in Word/PDF. StackEdit and Dillinger are often evaluated by import breadth. "How can doc/docx files be converted to markdown?" is a top StackOverflow question in the markdown tag. |
| **Technical approach** | **DOCX:** `mammoth.js` (browser-native, converts DOCX → HTML → markdown). **PDF:** `pdf.js` for text extraction + heuristic structure detection (headings, lists), or pipe through a lightweight markdown inference step. Show fidelity warning for complex layouts. |
| **Dependencies** | `mammoth.js` (free, MIT). `pdf.js` (already used in some markdown tools). No backend. |
| **Risks** | Medium. DOCX with tracked changes, images, or complex tables degrades gracefully but imperfectly. PDFs are especially lossy — set user expectations. |
| **Demand evidence** | StackOverflow question "How can doc/docx files be converted to markdown?" (high views). Reddit thread "Automating markdown to docx without pandoc." MarkdowntoWord.io traffic. |

---

### 10. PWA / Offline-First Hardening
| Attribute | Detail |
|-----------|--------|
| **Effort** | 1 week |
| **Impact** | ★★★☆☆ (3/5) |
| **Why it matters** | README already lists "PWA Support," but true offline-first means install prompt, background sync, and OPFS for large files. Monod and Markdown reader PWAs get positive HN/Reddit reception. |
| **Technical approach** | Add `vite-plugin-pwa` with Workbox. Precache app shell. Use OPFS (`originPrivateFileSystem`) for large markdown files instead of IndexedDB blobs. Add "Install App" banner with `beforeinstallprompt`. Background sync queue for future cloud-sync integration. |
| **Dependencies** | None server-side. HTTPS required for service workers (Vercel/Netlify handle this). |
| **Risks** | Low. Service worker caching is well-understood. OPFS browser support is ~92% (2026). |
| **Demand evidence** | Reddit "I built a Markdown reader PWA" (installable, runs fully offline). HN discussion on Monod (secure, offline-first markdown editor). Markups README already advertises PWA — hardening delivers on the promise. |

---

### 11. Proofreading / Grammar (LanguageTool Integration)
| Attribute | Detail |
|-----------|--------|
| **Effort** | 1 week |
| **Impact** | ★★☆☆☆ (2/5) |
| **Why it matters** | Markups already has linting. Grammar checking is the natural next tier. LanguageTool is open-source, free, and supports 20+ languages. |
| **Technical approach** | Call LanguageTool public API (`https://api.languagetool.org/v2/check`) or allow users to point to a self-hosted instance. Decorate Monaco editor with squiggly underlines + tooltip suggestions. Debounce requests (500ms after typing stops). |
| **Dependencies** | LanguageTool API (free tier: 20 req/min). Self-hosted option for privacy. |
| **Risks** | Low. API is stable. Main risk is latency — 200–500ms round-trip feels sluggish; cache checks per sentence. |
| **Demand evidence** | LanguageTool.org Insights post on editor integration. DEV.to article "Grammar checker for an editor?" using LanguageTool. Obsidian plugin "Grammar & Spell Checker" popularity. |

---

### 12. Mobile Native Wrapper (Capacitor iOS / Android)
| Attribute | Detail |
|-----------|--------|
| **Effort** | 2 weeks |
| **Impact** | ★★☆☆☆ (2/5) |
| **Why it matters** | Markups is browser-based; mobile users are second-class. A native wrapper unlocks App Store / Play Store distribution and offline mobile usage. |
| **Technical approach** | Use **Capacitor** (Ionic) to wrap the existing Vite build. Add mobile-specific UI (bottom toolbar, swipe gestures, file picker). Handle iOS keyboard insets. Deploy to TestFlight / Play Console. |
| **Dependencies** | Capacitor CLI. Xcode / Android Studio for native builds. Apple Developer account ($99/yr). |
| **Risks** | Medium. Monaco Editor on mobile is heavy — performance tuning required. App store review guidelines may reject "webview wrappers" if UX is poor. Native build chain adds CI complexity. |
| **Demand evidence** | Reddit "Making Markdown Editor for Android App" (Takuya Matsuyama). DEV.to "Created a Markdown Desktop App with Tauri." Capacitor docs showcase markdown apps. |

---

## Features Cut or Deprioritized

| Feature | Reason Cut |
|---------|-----------|
| **Account-based auth / backend** | Explicitly out of scope. Markups is client-side only. |
| **Knowledge Graph** | Roadmap Q4 item, but requires backend graph store + indexing — 4+ weeks, not 1–2. |
| **Publishing Platform** | Also Q4; requires CMS/SSG backend. Cut from this high-effort sprint list. |
| **Enterprise SSO** | Requires backend identity provider. Out of scope. |
| **Role-based permissions / Team workspaces** | Requires multi-tenant backend. Out of scope. |

---

## Architectural Shift Warnings

These features require moving beyond "pure client-side, no backend":

1. **Cloud Sync (#2)** — Requires OAuth secrets, token refresh, and ideally a lightweight proxy for rate-limit resilience. Can be done purely client-side via PKCE, but long-term maintenance is painful without any backend.
2. **Real-Time Collaboration (#1)** — y-webrtc works without a server, but for >2 users or production reliability, a small signaling/relay server is needed.
3. **Plugin System (#4)** — Sandboxing plugins is fundamentally a security boundary question. If plugins run in the same DOM, one malicious theme/plugin compromises all user data.
4. **Git Integration (#6)** — isomorphic-git runs in-browser, but writing to remote Git repos over HTTPS requires OAuth tokens stored client-side. Large repos hit IndexedDB quotas.

---

## Recommended Sprint Order

If the team has 1–2 weeks per feature and wants maximum user-visible impact:

1. **Vim/Emacs Keybindings** (1 wk) — quick win, vocal user base, low risk.
2. **PWA Hardening** (1 wk) — delivers on existing README promise, low risk.
3. **Theme Marketplace** (1 wk) — community engagement, low risk.
4. **Grammar/Proofreading** (1 wk) — stacks on existing linting, low risk.
5. **Multi-Document Workspace** (1–2 wks) — upgrades existing tabs into a real workspace.
6. **Advanced AI Copilot** (2 wks) — leverages existing BYOK AI, high differentiation.
7. **PDF/DOCX Import** (1–2 wks) — import demand is proven.
8. **Real-Time Collaboration** (2 wks) — highest impact but needs signaling decision.
9. **Cloud Sync** (2 wks) — issue #14, high demand, but OAuth complexity.
10. **Plugin System** (2 wks) — platform play, but security-sensitive.
11. **Git Integration** (2 wks) — developer-centric, niche but valuable.
12. **Mobile Wrapper** (2 wks) — last, because web UX should be solid before native packaging.

---

## Sources & Evidence

- Yjs downloads: yjs.dev (900k weekly npm downloads)
- Liveblocks Yjs: liveblocks.io/blog/introducing-liveblocks-yjs
- StackEdit sync features: stackedit.io/app
- HackMD collab: homepage.hackmd.io
- Obsidian plugins: community.obsidian.md (7,198 plugins)
- Monaco vim: npmjs.com/package/monaco-vim
- isomorphic-git: isomorphic-git.org/docs/en/0.78.0/browser
- LanguageTool: languagetool.org + DEV.to grammar-checker article
- Markups issue #14: github.com/Nir-Bhay/markups/issues/14
- Markups roadmap: `docs/ROADMAP.md` and `docs/FUTURE_SCOPE.md`
