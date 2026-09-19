# Markups TODOs (design debt — from plan-design-review 2026-09-14)

## TODO 1 — Chat history persistence across reloads
- **What:** Persist the AI thread (messages store, cap 50 pairs) across panel close/reload.
- **Why:** Long editing sessions lose AI context today; thread is ephemeral by v1 decision.
- **Pros:** Continuity across sessions; fewer repeated prompts.
- **Cons:** Storage quota + migration risk (flagged in AI-DOCS/AI-MEMORY.md); privacy surface for API-adjacent content.
- **Context:** Spec `docs/ai-writer-chat-UI-SPEC.md` §10 deliberately chose in-memory only for v1. Revisit with namespaced storage keys + opt-out.
- **Depends on / blocked by:** Chatbot redesign implemented (§10 pair-eviction in place).

## TODO 2 — Slash commands in composer (/improve etc.)
- **What:** Parse `/action` prefixes in `#ai-input` mapping to the 8 `ai:action-*` events.
- **Why:** Keyboard-first power users go faster than chips/menu.
- **Pros:** Speed; no UI chrome needed.
- **Cons:** Parsing surface, typo handling, discoverability work; chips + ✦ menu already cover the need.
- **Context:** Spec §6 deferred explicitly ("invisible syntax contradicts glanceable UX"). Revisit only on user demand.
- **Depends on / blocked by:** Chatbot redesign implemented.

## TODO 3 — Screen-reader verification on real assistive tech
- **What:** Verify the thread live-region contract (aria-live off during stream, single status announcements) on NVDA + VoiceOver.
- **Why:** Spec §13 is written but unverified; SR chunk-spam was a flagged critical risk (F25).
- **Pros:** Catches real AT behavior no spec can guarantee.
- **Cons:** Manual effort; needs devices/screen-reader installs.
- **Context:** Test with streaming + finalize + error-card flows; record results in spec §13.
- **Depends on / blocked by:** Chatbot redesign implemented.
