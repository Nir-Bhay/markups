# UI-SPEC — AI Writing-Assistant Sidebar as Chatbot Thread

**Status:** reviewed (design review 2026-09-14: 26 findings, 5 user decisions — all applied)
**Date:** 2026-09-14
**Branch:** `polish/v1.1.4-foundations`
**Scope:** Redesign `aside#ai-writer-panel` from button-grid + single-output panel into a chatbot-style conversation thread. Vanilla JS + Vite, no React, no new dependencies.
**Sources:** `src/features/ai-writer/ui.js` (`AIWriterUI.renderPanel`, `_injectStyles`), `src/features/ai-writer/index.js` (`AIWriterManager`, `getRecommendedApplyMode`), `src/features/ai-writer/service.js` (`aiService.streamMessage`), `src/features/ai-writer/system-prompt.js` (`ACTION_PROMPTS`), `src/features/ai-writer/diff.js`, `src/core/editor/index.js` (`editorService`), `src/__tests__/aiWriterApplyFlow.test.js`, `public/css/premium-ui.css` tokens, `AI-DOCS/AI-MEMORY.md`, `AI-DOCS/QUICK-START.md`.
**Design system:** manual (no `components.json`, no shadcn — N/A for vanilla-JS project). Contract maps onto existing `var(--ai-*)` tokens with `premium-ui.css` fallbacks (see §3).

---

## 1. Goal & principles

USER ASK: a chatbot that is genuinely usable at a glance — chat input at the BOTTOM, conversation ABOVE, minimal chrome, maximum clarity. The current 8-button grid (Generate/Add/Continue/Edit/Improve/Summarize/Expand/Review in 3 labeled groups) looks ugly and confusing.

Principles (locked for this phase):

1. **Thread, not form.** Every prompt and every result is a message in one scrollable thread. No separate "output area".
2. **Composer is always last.** Input + Send are pinned to the panel bottom, always visible.
3. **One obvious next step.** Each assistant message carries ONE `Apply ▾` split-button (label = recommended mode with char count) plus a `···` overflow; never a wall of equal buttons.
4. **Selection is context, not buttons.** Editor selection appears as a small context card; it never enables/disables a wall of buttons.
5. **No data loss on redesign.** All 8 current actions remain reachable (chips + menu + context menu), streaming/diff/stale-target-guard/settings/BYOK flows are preserved.

---

## 2. Layout skeleton (top → bottom, exact order)

```
.ai-panel-inner (flex column, height 100%)
├── 1. .ai-chat-header (48px, sticky top, flex-shrink 0)
│     ├── title: ✦ MarkupsAI + model id tiny (`· gpt-4o-mini`, set at generation start)
│     ├── [Settings gear] icon-btn (existing #ai-settings-btn behavior)
│     └── [Close ×] icon-btn (existing #ai-close-btn behavior)
│     └── [+ New] text pill, left-aligned second row (44px touch target; NOT a bare icon —
│         New chat is destructive-adjacent, never sits beside Close as an equal icon)
├── 2. .ai-context-card (auto height, flex-shrink 0, hidden when no selection)
│     └── "12 chars selected · 'clean snippet…'" + [× dismiss] + hint "replies will target this".
│         Dismiss sets an explicit ignored-selection epoch: the NEXT send goes composer-only
│         (`target: null`) regardless of live editor selection; the card reappears on the next
│         `SELECTION_CHANGED` with non-empty text. Visual state and model input never diverge.
├── 3. .ai-thread (#ai-thread, flex 1, overflow-y auto, role="log")
│     ├── empty state (only when zero messages) — §9
│     ├── .ai-msg[data-kind=user|assistant|system|error]… (append-only)
│     └── [↓ New messages pill] floating bottom-center (only when stuck-check fails during stream)
├── 4. .ai-chips-row (auto height, flex-shrink 0, horizontal scroll)
│     └── 3 contextual suggestion chips — §6
├── 5. .ai-composer (sticky bottom, flex-shrink 0)
│     ├── composer row: [✦ 32px actions-btn][textarea#ai-input flex-1][Send 32px], gap 8px
│     ├── token/context meter row (FIXED 16px height, reserved always — empty when no text,
│     │   so typing never shifts layout)
│     └── Send button (morphs to Stop square while generating)
└── 6. .ai-settings-sheet (absolute inset-0 overlay, unchanged behavior)
```

Heights: header 48px fixed. Composer min 56px, max ~132px (4 rows + padding). Thread takes all remaining space. Total panel width unchanged: 360px desktop, 320px at 769–1100px, full overlay ≤768px (existing breakpoints in `_injectStyles` are kept verbatim).

---

## 3. Design tokens (concrete, no ranges)

### 3.1 Spacing — 4px base scale only

4, 8, 12, 16, 24. Panel padding 12 (thread/composer), 8 gaps between messages, 16 between message groups of different kinds. Border radius: bubbles 12px (user bubble 12px with 4px bottom-right corner cut for direction cue), buttons/chips 8px (`--radius-lg`), icon buttons 6px.

### 3.2 Typography — exactly 3 sizes, 2 weights

| Token | Value | Use |
|---|---|---|
| `--ai-font-sm` | 12px, 400, lh 1.45 | timestamps, hints, meters, chip labels |
| `--ai-font-body` | 13px, 400, lh 1.6 | user bubbles, assistant content, composer |
| `--ai-font-label` | 11px, 600, uppercase, ls 0.05em | message role labels ("YOU", "MARKUPSAI"), section hints |

Weights allowed: 400 + 600 only. Assistant message body uses `var(--font-mono)` (JetBrains Mono, already loaded) to preserve current Markdown-plain-text readability; user bubbles + composer use `var(--font-sans)`. Line-height body 1.6.

### 3.3 Color — 60/30/10 split

| Role | Token → value (light) | Value (dark, `[data-theme="dark"]`) |
|---|---|---|
| 60% dominant surface | `--ai-bg` → `var(--bg-primary, #ffffff)` | `#1f2937` (keep current) |
| 30% secondary (user bubble, hover fills) | `--ai-bubble-user` → `var(--bg-tertiary, #f1f5f9)` | `#374151` |
| 10% accent, reserved ONLY for: Send button, recommended apply button, streaming cursor, focus rings, context-card left border | `--ai-accent` → `#8b5cf6` (keep; premium `--accent-primary #5865f2` NOT adopted — AI accent stays violet to distinguish AI from app chrome) | `#a78bfa` (keep) |
| Semantic destructive/error | `#dc2626` on `#fef2f2` / dark `#fca5a5` on `#450a0a` (keep current `.ai-error`) | keep |
| Semantic success | `--accent-success #22c55e` (copy confirmation, connection OK) | same |

Accent is NEVER used for decorative icons, timestamps, or non-recommended buttons. All existing `--ai-*` variables are kept as the override point; each new rule falls back to the `premium-ui.css` equivalent first, then the current hardcoded hex (so both theme systems keep working).

---

## 4. Message anatomy

### 4.1 Message types

| Kind | Avatar/label | Bubble style | Content |
|---|---|---|---|
| `user` | right-aligned, label "YOU" 11px tertiary — shown ONCE per consecutive group, not per message | filled `--ai-bubble-user`, max-width 85%, right | plain text, `white-space: pre-wrap`, escaped via existing `_escapeHtml`/`escapeHtml` util |
| `assistant` | left-aligned, label "MARKUPSAI" once per group (model id lives in the HEADER, §2 — never per message) | PERMANENT 1px `var(--border)` card, radius 12px, full-width; streaming swaps border to 2px `--ai-accent`, completion returns to neutral (structure never disappears) | streams as plain pre-wrap mono; for edit/improve/expand the DEFAULT view is the diff (`renderLineDiffHtml`, capped 240px scroll), `[Show text]` toggles to plain. Long bodies collapse after 12 lines with `[Show more]` (§4.4). |
| `system` | centered pill, 12px muted | no bubble, e.g. "Selection attached · 120 chars" / "Chat cleared" | transient context notices, never sent to the model |
| `error` | left, ⚠ inline card | `.ai-error` styling (keep current) | problem + next step + [Retry] [Copy partial] — §9. Partial streamed text ABOVE the card is NEVER destroyed. |

### 4.2 Assistant message footer (ONE split-button + overflow)

Every completed non-read-only assistant message ends with a single-row `.ai-msg-actions`:

```
[Apply: Replace (120 chars) ▾] [···]
```

- The split-button label = recommended mode from `getRecommendedApplyMode(action, target)` + target char count
  (e.g. `Apply: Insert at Cursor`, `Apply: Replace (120 chars)`, `Apply: Append`). Solid accent.
- `▾` and `···` open the same overflow menu: the other two apply modes + [Copy] + [Retry] (+ [Show text]/[Show changes] toggle when diff applies).
- `review` (read-only) messages: NO apply; footer = [Copy] only. Below review messages render follow-up
  chips `[Fix issues]` (runs `edit` with "Fix the issues listed above against the full document") and
  `[Summarize fixes]` (runs `summarize` on the review text) — review never dead-ends.
- After a successful apply: apply controls disable, footer shows badge `✓ Applied as Replace · 14:02`;
  Copy stays live. Retry stays live on error/cancelled messages only (not on successfully applied
  ones). Retry on a message re-runs THAT message's stored `{ actionPrompt, target, options }`,
  never a global `_lastRun`. Clicking Retry on an older error after a newer generation must not
  replay the newer run.
- Buttons act on THAT message's text AND THAT message's captured editor target. Store
  `msg.target` (the `_captureEditTarget()` snapshot) on the assistant message at generation
  start. Apply NEVER reads a global `_pendingTarget`. After a successful apply, keep
  `msg.target` for stale checks on later retries; do not null a shared slot.
- Single source of truth: `messages[id].text` ONLY. `lastResult` is a getter for the last
  assistant message's text, never a separate variable. `AI_RESULT_INSERTED` REQUIRES
  `{ messageId }` (no `text` / `lastResult` fallback). Manager resolves
  `{ text: getMessageText(id), target: getMessageTarget(id) }`.
- Stale-target guard (`_isTargetCurrent(msg.target)`) per message: on stale apply, toast
  "The document changed while AI was working. Generate again before applying." and mark
  that message's controls `.ai-stale` (disabled + tooltip). Other messages stay independently applicable.

### 4.4 Long-message collapse (exact numbers)

- Assistant body: visible max 12 lines (~240px at 13px/1.6), then `[Show more]` expands inline; `[Show less]` collapses.
- Diff view: max-height 240px with inner scroll, inline line-diff rows (red/green per `diff.js`), NEVER side-by-side under 1100px.
- User bubbles: no collapse (user text is short by construction; over 40 lines gets the same 12-line treatment).

### 4.3 Timestamps & model tag

Role labels render ONCE per consecutive same-kind group. Timestamps on hover only (`title="14:02"`) —
no per-message timestamp rows. Model id appears ONCE in the chat header (§2), never per message
(BYOK users still see what they pay for, without 20 repeated tags). No avatars beyond ✦.

---

## 5. Composer behavior

- `textarea#ai-input` kept (same id → manager/tests untouched). Auto-grow 1–4 rows (`rows=1` default, max-height 96px, then scroll). Placeholder rotates by context: with selection → "How should I change the selected text? (Enter to send)"; without → "Ask MarkupsAI to write, edit, or improve… (Enter to send)".
- **Enter = send, Shift+Enter = newline** (keep current handler). Send disabled when empty/whitespace ONLY
  (never while streaming — see follow-up queue below).
- While `isGenerating`: Send morphs into Stop (■, `aria-label="Stop generation"`, emits `AI_GENERATION_CANCELLED`).
  Status lives INLINE in the live message header (`MARKUPSAI · Generating… ■`) — never as a microline under the
  composer (eyes are on the thread while streaming, and the microline can sit below the fold on mobile).
- Follow-up queue (locked): composer stays EDITABLE while streaming (draft the next thought); pressing Enter
  during a stream queues it as the next user message, auto-sent when the current stream finalizes. One queued
  item max; queuing a second replaces the first + toast "Queued follow-up replaced". Stop discards the queue.
- **Esc** stops generation (stop takes precedence over Esc-closes-settings while streaming).
- Focus: panel open → focus composer (keep). After send → keep focus, clear input (keep `clearInput`). After Stop/error → return focus to composer.
- Token/context meter: FIXED 16px row, always reserved (F6). Content when composer non-empty: `~N tokens · limit M`
  where `M = contextWindow` and N = `estimateTokens()`; red + tooltip "Exceeds context — shorten selection or raise
  limit in AI Settings" when over budget. Meter is advisory; the gate is the preflight error card (§9) — Send stays
  enabled so behavior is never ambiguous.
- `Ctrl/Cmd+Shift+A` toggle unchanged.

---

## 6. Command affordance (replaces the 8-button grid)

The 3 labeled groups + 8 buttons + group labels are REMOVED. Replaced by two mechanisms:

### 6.1 Contextual suggestion chips (primary, always visible)

`.ai-chips-row`: horizontally scrollable, max 3 chips, 12px labels:

| Context | Chips (label → action) |
|---|---|
| Text selected | [Improve] → `improve`, [Fix grammar] → `edit` with preset "Fix grammar…", [Summarize] → `summarize` |
| No selection, doc non-empty | [Continue writing] → `continue`, [Review document] → `review`, [Generate…] → focuses composer |
| Empty doc | [Generate…] → focuses composer, [Write an outline] → `generate` with preset "Write an outline for…", [Review] hidden |

Clicking a chip with a preset fills the composer with the preset text + focuses (user confirms with Enter) EXCEPT zero-input actions (`continue`, `review`, selection `improve/summarize/expand`) which run immediately — same semantics as today's buttons. RULE (locked): any chip label ending in `…` NEVER executes — it always fills the composer as a draft. Instant chips carry no ellipsis. Identical pills must never have opposite outcomes. Chips re-render on `SELECTION_CHANGED` (existing event) via `setSelection()`.

Preset strings (exact): "Fix grammar: " (edit prefix — user completes the instruction), "Write an outline for: " (generate prefix). Instant chips have no preset.

### 6.2 "✦ All actions" menu (secondary, covers everything)

The `✦` button (32px, left of textarea per §2 skeleton) opens the menu UPWARD: `position: absolute; bottom: calc(100% + 8px); left: 0; width: 280px; max-height: 320px; overflow-y: auto`, `role="menu"`, items `role="menuitem"`. Esc closes + returns focus to ✦; click-outside closes; Arrow Up/Down moves focus (roving tabindex REQUIRED here — the thread menu is opened deliberately, native tab order is not enough). Lists all 8 actions with one-line descriptions (reuse current `title` attributes as subtitles). Full mapping:

| Menu item | Emits (unchanged) | Needs selection? |
|---|---|---|
| Generate from prompt | `ai:action-generate` | no |
| Add at cursor | `ai:action-add` | no |
| Continue writing | `ai:action-continue` | no (needs non-empty doc) |
| Edit selection… | `ai:action-edit` | yes |
| Improve | `ai:action-improve` | yes |
| Summarize | `ai:action-summarize` | yes |
| Expand | `ai:action-expand` | yes |
| Review document | `ai:action-review` | no (needs non-empty doc) |

Menu items with unmet preconditions are disabled with reason tooltips (same rules as today's `data-needs-selection` + toast guards in manager). Editor right-click menu (`AppContextMenuManager._buildEditorMenu`) is KEPT unchanged.

Slash commands in composer (`/improve` etc.) are explicitly OUT of scope for this phase (deferred — chips + menu cover discoverability with less parsing surface).

---

## 7. Selection context

- Current `#ai-selection-strip` (top strip + "Use Edit / Improve below" hint) is REMOVED, replaced by `.ai-context-card` (region 2): compact card, accent left border, `"{N} chars selected · "{snippet≤90}"` (same truncation logic as `setSelection`) + `×` dismiss (clears visual pin only, never touches editor selection) + tiny hint "replies will target this".
- `AIWriterUI.setSelection(text)` signature is KEPT (manager + tests call it) but reimplemented to render the card + re-render chips + update composer placeholder. Card hidden when selection empty. Dismiss-× sets the ignored-selection epoch (§2) — it never just hides the card.
- Live mirror on `SELECTION_CHANGED` unchanged (`_refreshSelectionStrip` may be renamed `_refreshSelectionContext`, keep alias).

---

## 8. Streaming rendering & auto-scroll

- `appendChunk(chunk, fullText)` targets the LIVE assistant message node (created at generation start with pending style), not a global output div. rAF-throttled text update KEPT (same `_pendingStreamText`/`_streamRenderHandle` pattern). Streaming cursor `▍` appended via CSS `::after` on `.ai-msg.streaming`.
- Auto-scroll (new, thread-level): after each render, if `thread.scrollHeight - scrollTop - clientHeight < 48` → `scrollTop = scrollHeight` (stick). Else → show floating `↓ New` pill: `position: absolute; bottom: 12px; left: 50%; translateX(-50%); 28px circle; accent bg; white ↓`; visible only while stuck >48px during stream; click jumps to bottom and re-sticks. Never yank a user reading history.
- `showStatus/showResult/showError/hideStatus` signatures KEPT as facades (tests + manager call them) but reimplemented on messages: `showStatus` creates pending assistant msg; `showResult` finalizes it + attaches split-button footer; `showError` converts pending msg to error kind (partial text KEPT above the card); `hideStatus` removes streaming state. `showResult/showError` with NO live message create one then finalize (idempotent — covers newChat-mid-stream, close-mid-stream, dispose).
- Interrupt lifecycle (locked): New chat / panel close DURING a stream = implicit Stop + live message converted to a "Generation cancelled" system pill. Queued follow-up is discarded with it.
- `clearOutput()` → clears thread to empty state. New `newChat()`: if thread holds ≥1 user message → inline confirm `Discard this chat? [Keep] [Discard]` (user prompts are labor, not regenerable); zero user messages → wipe silently + system msg "New chat started".

---

## 9. State table (all states, exact UI)

| State | Thread shows | Composer | Chips |
|---|---|---|---|
| **Empty** (no messages, key configured) | empty-state block: ✦ glyph 32px 30% opacity + "What should we write?" + "Pick a suggestion or type below — selection becomes context automatically." | enabled, placeholder default | visible (doc-based set) |
| **Empty + no API key** | same block + prominent [Add API key] button → `openSettings()` (replaces today's auto-open-settings-jump which stays for first-run: `show()` still auto-opens sheet when `!isConfigured()`) | ENABLED always (disabled inputs kill mobile discovery — tooltips don't fire on touch); Send with no key opens settings + system pill "Add your API key to start" | hidden |
| **Loading** (request sent, no chunk yet, >300ms) | pending assistant msg with 3-dot pulse + "Thinking…" (spinner kept, moved inline) | Send→Stop, composer editable (queue) | rendered, clicks queue-or-run after stream |
| **Streaming** | live text + ▍ cursor + stick-or-pill scroll; header shows model + Generating… | Send→Stop; Enter queues ONE follow-up (second replaces first + toast) | rendered, inert during stream |
| **Error** (API/network/budget) | streamed partial text KEPT as-is + error card BELOW it in the same message: message (reuse `service._createApiError` strings) + next-step line + [Retry] (re-runs same action, same captured target) + [Copy partial] + [Open settings] when 401/403/404 | re-enabled, text preserved (never cleared on error) | re-enabled |
| **Applied** (NEW — was missing) | message footer: apply controls disabled + badge `✓ Applied as Replace · 14:02`; Copy/Retry stay live | unchanged | unchanged |
| **Cancelled** | system pill "Generation cancelled" + composer intact | re-enabled | re-enabled |
| **Selection present** | context card visible (§7); refine chips shown | placeholder = edit variant | selection set |
| **Stale target** (doc changed mid-flight) | applied-message buttons get `.ai-stale` + toast (existing text) | unchanged | unchanged |
| **Over context budget** (`_ensureContext` fail / preflight estimate over) | error card "Selection is too large for the current AI limit (N chars)…" + [Open settings] | preserved | unchanged |
| **Offline** (`fetch` TypeError) | error card "You're offline…" + [Retry] | preserved | unchanged |

Retry reuses the message's stored `{ actionPrompt, target, options }` (no re-capture) so stale-guard semantics hold per message. A global `_lastRun` is forbidden.

## 9b. Data flow (locked)

```
  Editor selection ──SELECTION_CHANGED──► UI.setSelection
       │                                      │
       │                              context card + chips
       │                                      ▼
  Manager._captureEditTarget ◄── dismiss epoch? ── if dismissed: cursor-only target
       │
       ├── _runAI(prompt, target, options)
       │         writes {target, actionPrompt, options} onto live assistant message
       │         stream chunks ──► UI.appendChunk(live id)
       │         complete ──► UI.finalizeMessage + Apply split-button
       │         error    ──► UI error card (partial kept); Retry uses msg.run
       │
       ▼
  Apply click ──AI_RESULT_INSERTED {messageId, mode}──►
       getMessageText(id) + getMessageTarget(id)
       _isTargetCurrent(msg.target) ? executeEdits : markStale(id)
```

---

## 2b. Data flow (locked)

```
  Editor selection ──SELECION_CHANGED──► UI.setSelection
       │                                      │
       │                              context card + chips
       │                                      │
       ▼                                      ▼
  Manager._captureEditTarget ◄── dismiss epoch? ── if dismissed: cursor-only target
       │
       ├── _runAI(prompt, target, options)
       │         writes target+prompt onto live assistant message
       │         stream chunks ──► UI.appendChunk(live id)
       │         complete ──► UI.finalizeMessage + Apply split-button
       │         error    ──► UI error card (partial kept) + Retry uses msg.run
       │
       ▼
  Apply click ──AI_RESULT_INSERTED {messageId, mode}──►
       getMessageText(id) + getMessageTarget(id)
       _isTargetCurrent(msg.target) ? executeEdits : markStale(id)
```

## 10. History

- In-memory `this.messages = [{id, kind, text, action, targetSummary, ts, model}]`, capped at 50. Eviction (locked, FIFO by pairs): over 50 → drop oldest user message + its following assistant reply TOGETHER; error/system singles always drop first. Never orphan a reply from its prompt.
- NO persistence in v1 (no new storage keys — deliberate: avoids quota/migration surface; `STORAGE_KEYS.AI_PANEL_VISIBLE` still persists visibility only). Rationale recorded for checker: persistence is the obvious v2, not this phase.

---

## 11. Settings entry

Unchanged flow, new home: gear icon in chat header opens the SAME in-sidebar sheet (`openSettings/closeSettings/_bindSettingsForm` untouched, including BYOK session-only, endpoint allowlist + custom-endpoint confirm, Test Connection). Sheet overlays the thread (absolute inset-0, z 4) — unchanged CSS. [Add API key] empty-state button and error-card [Open settings] both call `openSettings()`.

---

## 12. Responsive

| Breakpoint | Behavior |
|---|---|
| `>1100px` | 360px right sidebar, thread + composer as specified |
| `769–1100px` | 320px (existing rule kept) |
| `≤768px` | full-screen fixed overlay (`position: fixed; inset: 0; z-index: 100` — existing rule kept); composer gains `padding-bottom: env(safe-area-inset-bottom)` (NEW, one line); chips scroll horizontally; header keeps 44px touch targets for + New/Settings/Close (New is a text pill, never a 32px bare icon next to Close) |

No new breakpoints. `body.view-editor .ai-writer-panel` rules untouched.

---

## 13. Accessibility (normative)

- Thread: `role="log"`, `aria-label="AI conversation"`, `aria-live="off"` on container (prevents whole-thread re-announce).
- Live assistant message body: `aria-live="off"` WHILE streaming (60fps text mutation re-announces every chunk in
  screen readers — coalescing is a myth). Announce ONCE at start (`Generating…` via `role="status"`) and ONCE on
  finalize (`Response complete. Apply actions available.` via the same status node). Never announce chunks.
- Composer: `aria-label="Message MarkupsAI"`, describedby token meter id. Send/Stop: distinct `aria-label`s ("Send message" / "Stop generation"). Chips: `role="list"` + `aria-label="Suggested actions"`. ✦ menu: `role="menu"` + `menuitem`s, roving tabindex, Esc closes + refocuses ✦, Up/Down moves.
- Composer: `aria-label="Message MarkupsAI"`, describedby token meter id. Send/Stop: distinct `aria-label`s ("Send message" / "Stop generation"). Chips: `role="list"` + `aria-label="Suggested actions"`. Menu: `role="menu"` + `menuitem`s, Esc closes, arrow-key nav (native button focus is acceptable v1; roving tabindex deferred).
- Focus: send→focus stays in composer; Stop→focus composer; message action buttons are normal tab stops; settings sheet traps focus until closed (keep existing `_focusTrap` if present; otherwise focus key input on open + return focus to gear on close — minimum contract).
- Contrast: 12px tertiary text on white uses `--text-secondary #475569` (AA ~7:1), never `#9ca3af` for text. Focus rings: 2px `var(--ai-accent)` outline offset 2px on all interactive elements (add `:focus-visible` rules — currently missing).
- Copy: button label → `✓ Copied` for 1.5s, then reverts (no toast — too heavy for per-message actions).
- Reduced motion: `@media (prefers-reduced-motion: reduce)` disables slide-in, spinner animation (static "…"), `▍` blink (static glyph), and auto-scroll ENTIRELY (scroll position untouched, `↓ New` pill always shows instead of sticking — an instant jump is still motion).
- Keyboard map (documented in empty-state tooltip + menu footer): Enter send · Shift+Enter newline · Esc stop/close · Ctrl/Cmd+Shift+A toggle panel.

---

## 14. REMOVED vs KEPT (explicit)

**REMOVED from sidebar UI:**

1. `.ai-panel-actions` 3 labeled groups + 8 `.ai-action-btn` buttons + `.ai-actions-group-label` labels (+ `data-needs-selection` disabling — replaced by chips/menu gating).
2. `.ai-panel-status` standalone bar + `#ai-stop-btn` as separate element (folded into composer morph + microline; `showStatus/hideStatus` become facades).
3. `.ai-panel-output` single-output region + `#ai-output-content` + global `#ai-insert-bar` with 3 always-visible insert buttons + `#ai-insert-hint` (replaced by per-message split-button footer; old ids DELETED outright — hidden alias bridges are forbidden: acceptance requires `grep ai-output-content ai-insert-bar ai-panel-actions → zero hits`).
4. `.ai-panel-placeholder` static placeholder (replaced by thread empty state).
5. `#ai-selection-strip` top strip (replaced by context card; `setSelection` kept as API).

**KEPT (logic untouched, DOM re-homed):**

- All `eventBus` events: `ai:action-*` (8), `AI_RESULT_INSERTED`, `AI_GENERATION_*`, `AI_PANEL_TOGGLED/REQUESTED`, `SELECTION_CHANGED`, `AI_SETTINGS_CHANGED` (chips/menu emit the same names). Manager Apply path DOES change: resolve `{messageId}` → `{text, target, run}` from the message store.
- `getRecommendedApplyMode`, `_captureEditTarget`, `_isTargetCurrent`, `_insertResult`, `_ensureContext`, `_runAI` streaming callbacks, `ACTION_PROMPTS`, `renderLineDiffHtml`, settings form + BYOK/session-key + endpoint policy + Test Connection, toast strings, `Ctrl+Shift+A`, toolbar `#ai-writer-button` active state.
- Apply/Retry read `{ text, target, actionPrompt, options }` from `messages[id]`. `_pendingTarget` is in-flight-only (current stream), never used at Apply time.

---

## 15. Copywriting contract (exact strings)

- Header: `✦ MarkupsAI · {model}`. Composer default: `Ask MarkupsAI to write, edit, or improve…`. With selection: `How should I change the selected text?`.
- Empty state title: `What should we write?` / body: `Pick a suggestion below or just type — selected text becomes context automatically.` / no-key CTA: `Add API key` / no-key pill after Send: `Add your API key to start`.
- Streaming header: `MARKUPSAI · Generating…` / finalize announcement: `Response complete. Apply actions available.` / queued: `Queued follow-up replaced`.
- Apply controls: `Apply: {Insert at Cursor|Replace (N chars)|Append} ▾` · overflow `···` · badge `✓ Applied as {mode} · HH:MM` · stale tooltip uses existing stale-guard toast text. Copy: `✓ Copied` (1.5s revert).
- New chat confirm: `Discard this chat?` [Keep] [Discard]. Cancelled pill: `Generation cancelled`.
- Error + next step pairs: 401 → `Invalid API key.` + `Check your key in AI Settings.` [Open settings]; 429 → `Rate limited.` + `Wait a moment, then Retry.`; 404 → `Model or endpoint not found.` + `Check endpoint and model name.`; budget → `Selection is too large…` (existing text kept); offline → `You're offline.` + `Reconnect, then Retry.` [Retry] [Copy partial].
- Destructive actions in this phase: New chat with ≥1 user message asks first (§8); document writes ALWAYS require explicit per-message Apply click + pass stale-guard.
- CTA verbs: `Send`, `Stop`, `Retry`, `Copy partial`, `Show more`, `Show less`, `Show text`, `Add API key`, `Open settings`, `Fix issues`, `Summarize fixes`.

---

## 16. Implementation notes (mapped to files/functions)

No new files except styles already inline. All inside existing modules:

1. `src/features/ai-writer/ui.js`
   - `renderPanel`: rebuild innerHTML to §2 skeleton (header/context/thread/chips/composer/sheet). Keep ids `ai-input`, `ai-settings-btn`, `ai-close-btn`, `ai-settings-sheet`, `ai-settings-body` (manager + sheet code bind to them). DELETE `ai-output-content`, `ai-insert-bar`, `ai-insert-hint`, `ai-panel-actions` ids entirely (§14.3).
   - Add `messages[]` store + `renderMessage(kind, …)`, `renderChips(context)`, `ensureLiveMessage()`, `finalizeMessage()`, `renderErrorCard(msg, error)` (partial kept above card), `setComposerMode('send'|'stop')`, `updateMeter()`, `newChat()` (confirm-gated), `queuedFollowUp` (max 1), `applySplitButton` renderer + overflow menu, `renderAppliedBadge(msg, mode)`. `lastResult` → getter. Keep facades: `showStatus/hideStatus/appendChunk/showResult/showError/clearOutput/setSelection/getInput/clearInput/focusInput/openSettings/closeSettings/showDiff`.
   - `_attachPanelEvents`: rebind send/stop/chips/menu/split-button/overflow (event delegation on `#ai-thread` for `[data-apply]`/`[data-retry]`/`[data-copy]`/`[data-diff]`/`[data-more]`), keep Enter/Esc handlers + settings/close handlers. ✦ menu: roving tabindex + Up/Down + Esc + click-outside.
   - `_injectStyles`: keep panel/sheet/dark/mobile blocks; delete actions/output/status rules; add thread bubbles/cards/chips/composer/menu/pill/`▍` cursor/`prefers-reduced-motion`/`:focus-visible` rules. Map new vars to `premium-ui.css` with current hex fallbacks (§3).
2. `src/features/ai-writer/index.js` — NO dispatch changes (same event names). Changes: `AI_RESULT_INSERTED` handler REQUIRES `{messageId}` → `{ text, target }` from the message store (no `lastResult` fallback, no global `_pendingTarget` on apply); `_runAI` writes `target` onto the live assistant message; `_captureEditTarget` returns a cursor-only target (empty `selectedText`) when the UI dismiss-epoch is set; `editSelection` preset path accepts instruction from chip (`editSelection('Fix grammar: …')` already supported via param); follow-up queue flush on `AI_GENERATION_COMPLETE`; `newChat` confirm lives in UI, manager only clears store; optional rename `_refreshSelectionStrip` → keep alias.
3. `src/features/ai-writer/service.js`, `system-prompt.js`, `diff.js`, `src/core/editor/index.js` — UNCHANGED.
4. A11y attributes (§13) added in `renderPanel` markup only.

---

## 17. Test updates (required, specified)

`src/__tests__/aiWriterApplyFlow.test.js` already covers the chat DOM (context card, chips, split-button, queue, new-chat confirm, eviction). Keep those. Add **CRITICAL regression** tests (eng review 2026-09-14):

| Test | File | Assert |
|---|---|---|
| **CRITICAL** Apply older message after a newer generation | `aiWriterApplyFlow.test.js` (manager) | mock editor `executeEdits`; two `_runAI` completions with different `target.range`; Apply on message 1 uses range 1, not range 2 |
| **CRITICAL** Retry older error after a newer run | same | Retry on message 1 re-sends message 1's `actionPrompt`, not the later run |
| Apply requires `messageId` | same | emit `AI_RESULT_INSERTED` without `messageId` does not insert (`lastResult` fallback forbidden) |
| Dismiss epoch → cursor-only capture | same | after dismiss, `_captureEditTarget` has empty `selectedText` even if editor still has a selection |
| newChat mid-stream | UI tests | live msg becomes cancelled pill; queue discarded |
| Esc during stream | UI tests | emits `AI_GENERATION_CANCELLED` |

No other test files reference AI DOM except `aiWriter*.test.js`. Playwright e2e deferred this PR (eng review: unit-only for the two-generation Apply landmine).

```
CODE PATH COVERAGE
===========================
[+] ui.js / index.js chat apply
    ├── getRecommendedApplyMode          [★★★] aiWriterApplyFlow.test.js
    ├── setSelection / dismiss flag      [★★ ] same
    ├── stream + split-button + review   [★★ ] same
    ├── queue / newChat / eviction       [★★ ] same
    ├── Apply uses msg.target            [GAP] CRITICAL — add manager test
    ├── Retry uses msg.run               [GAP] CRITICAL — add manager test
    └── no lastResult fallback           [GAP]

USER FLOW COVERAGE
===========================
[+] Generate → Apply → document
    ├── [★★ ] UI states covered
    ├── [GAP] two-generation wrong-target — CRITICAL unit
    └── [GAP] [→E2E] live Generate→Replace in browser — optional, see review Q
```

---

## 18. Decisions made without asking (rationale)

1. **No persistence for history** — avoids storage-quota/migration risk flagged in `AI-MEMORY.md`; thread is ephemeral aid, document is source of truth.
2. **Plain-text streaming, diff-on-demand** — full Markdown re-render per chunk needs sanitize pipeline (`sanitize.js` + Marked) inside a hot loop: XSS + perf risk for zero user-asked benefit. Plain mono text preserves today's behavior exactly.
3. **Chips + menu, no slash commands** — user asked "understandable at a glance"; invisible `/` syntax is the opposite. Deferred, not rejected.
4. **Keep violet `#8b5cf6` AI accent** instead of unifying on app `--accent-primary #5865f2` — AI affordances must be visually distinct from app chrome so "what will touch my document" is always recognizable.
5. **No user questions asked** — upstream code + USER ASK fully determined the contract; only genuinely open v2 items (history persistence, slash commands, markdown-rich bubbles) are deferred above with reasons.

---

## 19. Acceptance checklist for checker/executor

- [ ] Composer pinned bottom (row `[✦][input][Send]` + fixed 16px meter), thread above; zero of the 8 old buttons rendered as buttons; old ids (`ai-output-content`, `ai-insert-bar`, `ai-panel-actions`) grep to zero hits.
- [ ] All 8 actions reachable (3 chips + 8-item upward menu + context menu) with correct selection/doc guards; `…`-chips never execute.
- [ ] Per-message `Apply: {mode} (N chars) ▾` + `···` overflow; review = copy-only + follow-up chips; applied badge + disabled controls; stale guard marks message.
- [ ] Diff-by-default on edit/improve/expand; 12-line collapse + Show more; streaming cursor + stick-or-pill scroll; `prefers-reduced-motion` = no autoscroll, static glyphs.
- [ ] All §9 states render with specified copy; partial text survives errors; composer text never lost; follow-up queue works; no-key composer opens settings.
- [ ] `role=log` (live off) + single `role=status` announcements + group labels + hover timestamps + focus-visible rings + Esc semantics per §13.
- [ ] `getRecommendedApplyMode`, service, prompts, diff, editor integration untouched; event names unchanged; single message-text source of truth.
- [ ] `aiWriterApplyFlow.test.js` migrated per §17 + 4 new tests green; `npm test`, `lint`, both builds pass.

---

## 20. NOT in scope (deferred with rationale)

- Chat history persistence — quota/migration surface; thread is ephemeral, document is truth (v2 candidate).
- Slash commands (`/improve`) — invisible syntax contradicts glanceable UX; chips + menu cover it.
- Markdown-rich assistant bubbles — sanitize pipeline in hot streaming loop = XSS + perf risk; plain mono + diff-on-demand.
- Multi-model comparison / side-by-side answers — nobody asked; single thread only.
- Voice input — no mic affordance in scope; composer is text-only.
- Token meter as a hard gate — advisory only; preflight error card remains the gate.

## 21. What already exists (reuse, don't reinvent)

- Existing AI CSS tokens + dark/light blocks in ui.js styles; premium-ui.css fallbacks.
- getRecommendedApplyMode, edit-target capture, stale-target guard, insertResult, ensureContext, streaming callbacks.
- ACTION_PROMPTS (8 actions), renderLineDiffHtml, settings sheet + BYOK/session-key + endpoint allowlist + Test Connection.
- SELECTION_CHANGED live mirror, AI_RESULT_INSERTED / ai:action-* event names, toast strings, Ctrl+Shift+A.
- AppContextMenuManager AI items, header AI button active state, existing focus-trap helper.
- estimateTokens + context-budget check in service.js; escapeHtml utils.

## 22. Failure modes (eng review)

| Path | Production failure | Test | User sees |
|---|---|---|---|
| Apply | Two generations, Apply on first uses second range | CRITICAL unit required | Silent wrong edit if untested |
| Retry | Retry old error replays latest run | CRITICAL unit required | Wrong prompt billed / wrong text |
| Stale editor | User typed during stream | `_isTargetCurrent` + markStale | Toast, no write |
| Dismiss then Send | Live selection still highlighted | dismiss-epoch unit | Would Replace by accident if untested |
| Stream abort | Esc / Stop / newChat | cancelled pill | Partial kept |
| Offline / 401 | fetch fail | error card + settings | Retry / Open settings |
| Over 50 msgs | Unbounded DOM | eviction test | Oldest pair dropped |

No silent-and-untested path once the two CRITICAL tests land.

## 23. Performance (eng review)

No extra infra. Streaming stays rAF-throttled. Thread cap 50 pairs. Long bodies collapse at 12 lines. Token meter may run on `input` (composer max 4 rows, cheap). No N+1, no new network besides existing AI fetch.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | Codex CLI not on PATH |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 2 arch locks (per-message target + retry), 0 CQ, 6 test gaps (2 CRITICAL required), 0 perf |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR | score 8/10 → 10/10, 26 decisions |

- **UNRESOLVED:** 0
- **VERDICT:** DESIGN + ENG CLEARED — ready to implement remaining locks (per-message target/retry + CRITICAL tests).

