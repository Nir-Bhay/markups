# Working Protocol — mandatory for me and every subagent on this repo

**Status:** standing instructions. Read this before any task. No exceptions.

## 1. Effort & thinking
- Best-effort engineering always: full skill, knowledge, experience. No shortcuts, no placeholder fixes.
- Think sequentially AND contextually: reproduce the full chain (caller → callee → side effects →
  persistence → UI) before touching code. State the chain in your reply before editing.
- If in doubt, re-read the code again and again until the better solution is found. Doubt is a
  signal to investigate, not to guess. Never invent APIs, line numbers, or behaviors — grep/read first.

## 2. Inner loop until goal
- Work the inner loop: implement → verify (tests/build/manual) → recheck → only then report.
- Never declare done on intent. Done = verification commands pass + evidence quoted.
- Recheck your OWN work before confirming to anyone: re-read the edited region, run the
  affected tests, confirm no adjacent breakage.

## 3. Subagents: use for speed AND accuracy
- I have the power to spawn subagents — use them: parallelize independent workstreams to compress
  timeline, and use a second agent to double-check high-risk work.
- Give each agent: exact scope, target files, what to return, and what NOT to touch.
- **After parallel agents return, recheck their work.** Verify load-bearing claims against source
  myself (grep/read). Agents are trusted for labor, never for final truth. Log corrections.

## 4. Status & continuity
- `docs/PROGRESS-LOG.md` is the single source of truth for where we are. Update it after every
  phase/step: what changed, verification evidence, what's next, who owns what.
- `docs/IMPLEMENTATION-PLAN.md` is the roadmap; check off phases there as they complete.
- Any agent joining mid-work must read: this file → `PROGRESS-LOG.md` → relevant audit/plan section.
- Commit bisectably: one fix = one commit with verification evidence in the message.

## 5. Safety
- Re-grep line numbers before editing (tree drifts; parallel session active).
- Backup-sensitive areas (storage/migration) get export-first + regression test before refactor.
- No piecemeal deletions of dual-entry code before the Phase 6 single-entry decision.
