# LEAF-C Gates — Async/Promise Rejection Handling

Branch: `review/integration`
Scope: async rejection handling in tab-delete and file-tree reorder.
Status: PASS (local-only, not committed/pushed).

## G1 — tab-delete handles rejections
**File:** `src/main.js`  **Lines:** 709–730 (inside `deleteNode`)

- The note-cleanup step uses `Promise.allSettled(...)` over
  `result.deletedNoteIds.map((noteId) => noteStorage.deleteNote(noteId))`
  so a single rejected IDB delete no longer aborts the whole teardown.
- Wrapped in `try/catch` that degrades gracefully: remaining deletions
  continue, the failure is `console.error`-logged, and a `showToast(..., 'error')`
  is shown. A thrown error is also caught and surfaced via toast + log.

## G2 — reorderNode uses allSettled
**File:** `src/core/storage/fileTreeStorage.js`  **Lines:** 126–134 (inside `reorderNode`)

- Changed `await Promise.all(...)` → `await Promise.allSettled(...)` for the
  sibling `db.file_nodes.update(...)` calls, so one failed order write does
  not reject the whole reorder.
- Added logging: rejected outcomes are filtered and `console.error`-logged with
  a count and the rejection reasons.

## G3 — eslint clean
**Command:** `npx eslint src/main.js src/core/storage/fileTreeStorage.js`
**Result:** exit 0 — 0 errors, 24 warnings (all pre-existing, unrelated to
this leaf; none on lines 709–730 or 126–134).

---

### Verification
- `git diff` confirms both edits are present and self-contained.
- No commit/push performed (local-only per task constraints).
