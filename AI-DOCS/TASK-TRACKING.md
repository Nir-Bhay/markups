# 📊 Task Tracking Board - Markups Implementation

> **Instructions**: Copy this table to your project management tool (Jira, Trello, GitHub Projects, Notion)  
> Update status and completion daily

---

## 🔴 Phase 1: Critical Fixes (Weeks 1-2)

### Sprint 1 (Week 1)

| ID | Task | Owner | Points | Status | Progress | Dependencies | Done |
|----|------|-------|--------|--------|-------------|---------------|------|
| P1-T1 | **Delete main.js & Migrate to app.js** | Senior Dev | 13 | 🟡 Partial | 40% | None | [ ] |
| P1-T1-S1 | Audit main.js functionality | Senior Dev | 2 | 🟢 Done | 100% | None | [x] |
| P1-T1-S2 | Ensure app.js imports all modules | Senior Dev | 3 | 🔴 Not Started | 0% | S1 | [ ] |
| P1-T1-S3 | Migrate remaining code to modules | Senior Dev | 8 | 🟡 Partial | 40% | S2 | [ ] |
| P1-T1-S3a | Wire toast + clipboard modular APIs | Senior Dev | — | 🟢 Done | 100% | — | [x] |
| P1-T1-S3b | Integrate version-history module | Senior Dev | — | 🟢 Done | 100% | — | [x] |
| P1-T1-S4 | Update index.html to use app.js | Senior Dev | 1 | ⏸ Deferred | 0% | S3 | [ ] |
| P1-T1-S5 | Delete main.js | Senior Dev | 1 | ⏸ Deferred | 0% | S4 | [ ] |
| P1-T1-S6 | Test full application | QA | 2 | 🔴 Not Started | 0% | S5 | [ ] |
| P1-T2 | **Fix Typing Lag** | Perf Specialist | 8 | 🟢 Done | 100% | None | [x] |
| P1-T2-S1 | Add debounce to convert() | Perf | 2 | 🟢 Done | 100% | None | [x] |
| P1-T2-S2 | Defer non-critical updates | Perf | 2 | 🔴 Not Started | 0% | S1 | [ ] |
| P1-T2-S3 | Use requestAnimationFrame | Perf | 2 | ✅ Done (Phase 3) | 100% | S2 | [x] |
| P1-T2-S4 | Benchmark improvements | Perf | 2 | 🔴 Not Started | 0% | S3 | [ ] |
| P1-T3 | **Add Content Security Policy** | Security | 5 | 🟢 Done | 100% | None | [x] |
| P1-T4 | **Mobile Toolbar Overflow Fix** | UI/UX | 8 | 🟢 Done | 100% | None | [x] |

**Sprint 1 Total**: 34 points

---

### Sprint 2 (Week 2)

| ID | Task | Owner | Points | Status | Progress | Dependencies | Done |
|----|------|-------|--------|--------|-------------|---------------|------|
| P1-T3 | Complete CSP implementation | Security | 3 | 🟢 Done | 100% | Sprint 1 | [x] |
| P1-T4 | Complete mobile toolbar | UI/UX | 6 | 🟢 Done | 100% | Sprint 1 | [x] |
| P1-T5 | **Fix Image Memory Leak** | Perf | 5 | 🟢 Done | 100% | None | [x] |
| P1-T5-S1 | Implement LRU cache for images | Perf | 3 | 🟢 Done | 100% | None | [x] |
| P1-T5-S2 | Clean up on tab close | Perf | 2 | 🟢 Done | 100% | S1 | [x] |
| P1-T6 | **Add ARIA Labels to Toolbar** | A11y | 3 | 🟢 Done | 100% | None | [x] |
| P1-T7 | **Remove Unused Dependencies** | DevOps | 3 | 🟡 Partial | 70% | None | [ ] |

**Sprint 2 Total**: 20 points

---

## 🟡 Phase 2: Architecture Migration (Weeks 3-4)

### Sprint 3 (Week 3)

| ID | Task | Owner | Points | Status | Progress | Dependencies | Done |
|----|------|-------|--------|--------|-------------|---------------|------|
| P2-T1 | **Split toolbar/index.js** | Refactor | 13 | 🟢 Done | 100% | P1-T1 complete | [x] |
| P2-T1-S1 | Analyze toolbar.js structure | Refactor | 2 | 🟢 Done | 100% | None | [x] |
| P2-T1-S2 | Extract dropdown logic | Refactor | 3 | 🟢 Done | 100% | S1 | [x] |
| P2-T1-S3 | Extract popover logic | Refactor | 3 | 🟢 Done | 100% | S2 | [x] |
| P2-T1-S4 | Extract utility functions | Refactor | 2 | 🟢 Done | 100% | S3 | [x] |
| P2-T1-S5 | Create main index.js | Refactor | 1 | 🟢 Done | 100% | S4 | [x] |
| P2-T1-S6 | Test all toolbar functions | QA | 2 | 🟢 Done | 100% | S5 | [x] |
| P2-T2 | **Split image-resize/index.js** | Refactor | 13 | 🟢 Done | 100% | P1-T1 complete | [x] |
| P2-T3 | **Code Quality: Remove Duplicates** | Refactor | 5 | 🟡 Partial | 40% | P1-T1 complete | [ ] |

**Sprint 3 Total**: 31 points

---

### Sprint 4 (Week 4)

| ID | Task | Owner | Points | Status | Progress | Dependencies | Done |
|----|------|-------|--------|--------|-------------|---------------|------|
| P2-T2 | Continue image-resize split | Refactor | 8 | 🟢 Done | 100% | S1-S3 from S3 | [x] |
| P2-T4 | **Implement Event Delegation** | Refactor | 5 | 🔴 Not Started | 0% | None | [ ] |
| P2-T5 | **Add State Management** | Arch | 8 | 🔴 Not Started | 0% | P1-T1 complete | [ ] |
| P2-T6 | **Refactor Global Variables** | Refactor | 5 | 🔴 Not Started | 0% | P2-T5 | [ ] |

**Sprint 4 Total**: 26 points

---

### Phase 2 Notes (2026-07-25)

**Completed**:
- P2-T1 toolbar split → `constants.js`, `utils.js`, `preferences.js`, `popovers.js`, `dropdowns.js`, `styles.js`, `manager.js`, thin `index.js`
- P2-T2 image-resize split → `constants.js`, `utils.js`, `history.js`, `ui.js`, `core.js`, thin `index.js`
- Dependency audit: removed unused `markdownlint`; **kept** `storehouse-js` (still used by `main.js`)

**Deferred / TODO**:
- P2-T3: `TEMPLATES` / `SNIPPETS` still duplicated in `main.js` vs `src/config/` — unsafe to delete while main.js is entry
- P2-T4–T6: event delegation, state management, globals — not started
- Optional: further split `image-resize/core.js` (~2410 lines) UI methods

**Verify**: `npm run build` ✅

---

## 🟢 Phase 3: Performance Optimization (Weeks 5-6)

> **Status**: ✅ Sprint 5 complete + Sprint 6 partial (2026-07-25)  
> **Entry**: `main.js` preserved (no app.js switch). Full markdown Web Worker + virtual scrolling deferred.

### Sprint 5 (Week 5)

| ID | Task | Owner | Points | Status | Progress | Dependencies | Done |
|----|------|-------|--------|--------|-------------|---------------|------|
| P3-T1 | **Lazy Load Heavy Features** | Perf | 8 | ✅ Done | 100% | P2 complete | [x] |
| P3-T1-S1 | Lazy load AI Writer | Perf | 3 | ✅ Done | 100% | None | [x] |
| P3-T1-S2 | Lazy load Image Resize | Perf | 3 | ✅ Done | 100% | None | [x] |
| P3-T1-S3 | Lazy load Export | Perf | 2 | ✅ Done | 100% | None | [x] |
| P3-T2 | **Bundle Size Optimization** | DevOps | 5 | ✅ Done | 100% | None | [x] |
| P3-T3 | **Tree-shake Dependencies** | DevOps | 3 | ✅ Done | 100% | None | [x] |

**Sprint 5 Total**: 16 points — ✅ Complete

**Landed**:
- `html2pdf.js` / `html2canvas` dynamic import on first export in `main.js` (`getHtml2Pdf` / `getHtml2Canvas`)
- Image resize dynamic import after editor init
- AI Writer dynamic import in `app.js` (`getAiWriterManager`)
- `vite.config.js`: split `export-vendor` chunk from eager `dom-utils` (dompurify/prism stay eager)

---

### Sprint 6 (Week 6)

| ID | Task | Owner | Points | Status | Progress | Dependencies | Done |
|----|------|-------|--------|--------|-------------|---------------|------|
| P3-T4 | **Web Worker for Markdown** | Perf | 13 | 🟡 Deferred | 40% | P3-T1 complete | [~] |
| P3-T5 | **Virtual Scrolling (Large Docs)** | Perf | 21 | ⏸️ Deferred | 0% | None | [ ] |
| P3-T6 | **Memory Leak Audit** | Perf | 5 | ✅ Done | 100% | None | [x] |

**Sprint 6 Total**: 39 points — partial (P3-T6 done; P3-T4 smaller win; P3-T5 TODO)

**P3-T4 decision**: Full `marked.parse()` Web Worker deferred — too invasive against `main.js` monolith / Mermaid+KaTeX DOM coupling. **Substitute landed**: `requestAnimationFrame` around preview DOM write + deferred Mermaid/TOC/highlight (`setTimeout(0)`), with `_convertToken` to drop stale frames. Debounce pipeline unchanged (300ms).

**P3-T6 landed**:
- Verified Phase 1 `imageStore` LRU / revoke / tab-close cleanup still present
- Toolbar: bound keydown removed on `dispose`; popover `dispose()` removes document listeners
- Image resize: hover timer cleared on `destroy`; `disposeImageResize()` export
- Mobile: keydown / overflow outside-click / resize listeners removed on `dispose`; docs-list timers tracked

**Deferred**:
- Full markdown Web Worker
- Virtual scrolling for large docs (too large; leave as TODO)

**Verify**: `npm run build`
## 🔵 Phase 4: Security & Accessibility (Weeks 7-8)

> **Status**: ✅ Core complete (2026-07-25) — Sprint 7 done; Sprint 8 deferred items documented  
> **Entry**: `main.js` preserved (no app.js switch). CSP nonce deferred.

### Sprint 7 (Week 7)

| ID | Task | Owner | Points | Status | Progress | Dependencies | Done |
|----|------|-------|--------|--------|-------------|---------------|------|
| P4-T1 | **Harden DOMPurify Config** | Security | 5 | ✅ Done | 100% | None | [x] |
| P4-T2 | **File Upload Validation** | Security | 5 | ✅ Done | 100% | None | [x] |
| P4-T3 | **Accessibility: ARIA Labels** | A11y | 8 | ✅ Done | 100% | None | [x] |
| P4-T4 | **Accessibility: Keyboard Nav** | A11y | 8 | 🟡 Partial | 70% | P4-T3 | [~] |
| P4-T5 | **Accessibility: Focus Management** | A11y | 5 | ✅ Done | 100% | P4-T4 | [x] |

**Sprint 7 Total**: 31 points — ✅ Core complete

**Landed**:
- SVG upload sanitization (`sanitizeSvgToDataUrl` in `src/utils/file.js`) used by `main.js` + `image-upload`
- Magic-byte validation for jpeg/png/gif/webp (reject MIME spoofing)
- DOMPurify: `ALLOW_DATA_ATTR: false`, forbid style/srcdoc; SVG profile + explicit on* strip
- Skip-nav link (`index.html` + `.skip-nav-link` CSS)
- Modal focus traps via `createFocusTrap` (export/help/settings/stats/goals/templates + `ui/modal` + AI Writer panel)
- Escape closes + focus returns on deactivate
- `--text-secondary` contrast fix (#475569 light / #cbd5e1 dark)
- Global `:focus-visible` on toolbar/header/modal buttons

---

### Sprint 8 (Week 8)

| ID | Task | Owner | Points | Status | Progress | Dependencies | Done |
|----|------|-------|--------|--------|-------------|---------------|------|
| P4-T6 | **WCAG Compliance Audit** | A11y | 5 | ⏸️ Deferred | 0% | P4-T5 | [ ] |
| P4-T7 | **Security: Penetration Testing** | Security | 8 | ⏸️ Deferred | 0% | P4-T1, P4-T2 | [ ] |
| P4-T8 | **Security: Dependency Audit** | Security | 3 | ⏸️ Deferred | 0% | None | [ ] |
| P4-T9 | **Security: HTTPS Enforcement** | DevOps | 2 | ⏸️ Deferred | 0% | None | [ ] |

**Sprint 8 Total**: 18 points — deferred (manual/ops work)

**Deferred / TODO**:
- P4-T4 remainder: full keyboard nav audit for all toolbar dropdowns (partial via existing patterns)
- P4-T6: axe DevTools full WCAG audit
- P4-T7–T9: pen test, `npm audit`, HTTPS-only headers beyond current Vercel CSP
- **CSP nonce**: deferred — Monaco requires careful nonce plumbing; keep `'unsafe-inline'` for now (document in FINAL-REVIEW)

**Verify**: `npm run build`

---

## 🟣 Phase 5: Testing & Quality (Weeks 9-10)

### Sprint 9 (Week 9)

| ID | Task | Owner | Points | Status | Progress | Dependencies | Done |
|----|------|-------|--------|--------|-------------|---------------|------|
| P5-T1 | **Unit Tests: Core Modules** | QA | 13 | 🔴 Not Started | 0% | None | [ ] |
| P5-T1-S1 | Test editor service | QA | 3 | 🔴 Not Started | 0% | None | [ ] |
| P5-T1-S2 | Test markdown service | QA | 5 | 🔴 Not Started | 0% | None | [ ] |
| P5-T1-S3 | Test storage service | QA | 5 | 🔴 Not Started | 0% | None | [ ] |
| P5-T2 | **Unit Tests: Features** | QA | 13 | 🔴 Not Started | 0% | None | [ ] |
| P5-T3 | **Set Up CI/CD** | DevOps | 5 | 🔴 Not Started | 0% | None | [ ] |

**Sprint 9 Total**: 31 points

---

### Sprint 10 (Week 10)

| ID | Task | Owner | Points | Status | Progress | Dependencies | Done |
|----|------|-------|--------|--------|-------------|---------------|------|
| P5-T4 | **Unit Tests: Continue** | QA | 13 | 🔴 Not Started | 0% | S9 | [ ] |
| P5-T5 | **E2E Tests** | QA | 8 | 🔴 Not Started | 0% | P5-T1 | [ ] |
| P5-T6 | **Test Coverage Report** | QA | 3 | 🔴 Not Started | 0% | P5-T4, P5-T5 | [ ] |
| P5-T7 | **Performance Regression Tests** | QA | 5 | 🔴 Not Started | 0% | None | [ ] |

**Sprint 10 Total**: 29 points

---

## 🟤 Phase 6: Polish & Documentation (Weeks 11-12)

### Sprint 11 (Week 11)

| ID | Task | Owner | Points | Status | Progress | Dependencies | Done |
|----|------|-------|--------|--------|-------------|---------------|------|
| P6-T1 | **Performance Monitoring** | DevOps | 5 | 🔴 Not Started | 0% | None | [ ] |
| P6-T2 | **Documentation: README** | Tech Writer | 3 | 🔴 Not Started | 0% | All phases | [ ] |
| P6-T3 | **Documentation: CONTRIBUTING** | Tech Writer | 3 | 🔴 Not Started | 0% | None | [ ] |
| P6-T4 | **Documentation: JSDoc** | Tech Writer | 8 | 🔴 Not Started | 0% | None | [ ] |
| P6-T5 | **Onboarding Flow** | UI/UX | 5 | 🔴 Not Started | 0% | None | [ ] |

**Sprint 11 Total**: 24 points

---

### Sprint 12 (Week 12)

| ID | Task | Owner | Points | Status | Progress | Dependencies | Done |
|----|------|-------|--------|--------|-------------|---------------|------|
| P6-T6 | **Final Testing & Bug Fixes** | QA | 8 | 🔴 Not Started | 0% | All phases | [ ] |
| P6-T7 | **Release Preparation** | DevOps | 5 | 🔴 Not Started | 0% | P6-T6 | [ ] |
| P6-T8 | **Deploy to Production** | DevOps | 3 | 🔴 Not Started | 0% | P6-T7 | [ ] |
| P6-T9 | **Post-Release Monitoring** | DevOps | 2 | 🔴 Not Started | 0% | P6-T8 | [ ] |

**Sprint 12 Total**: 18 points

---

## 📈 Progress Summary

### Points Tracking

| Phase | Total Points | Completed | Remaining | % Done |
|-------|--------------|-----------|-----------|--------|
| Phase 1 (Critical) | 54 | 48 | 6 | ~89% |
| Phase 2 (Architecture) | 57 | 34 | 23 | ~60% |
| Phase 3 (Performance) | 55 | 21 | 34 | ~38% |
| Phase 4 (Security/A11y) | 49 | 31 | 18 | ~63% |
| Phase 5 (Testing) | 60 | 0 | 60 | 0% |
| Phase 6 (Polish) | 42 | 0 | 42 | 0% |
| **TOTAL** | **317** | **134** | **183** | **~42%** |

---

## 🎯 Sprint Velocity

| Sprint | Planned Points | Completed Points | Velocity |
|--------|----------------|------------------|----------|
| Sprint 1 | 34 | - | - |
| Sprint 2 | 20 | - | - |
| Sprint 3 | 31 | - | - |
| Sprint 4 | 26 | - | - |
| Sprint 5 | 16 | 16 | 16 |
| Sprint 6 | 39 | 5 (+P3-T4 substitute) | ~5 |
| Sprint 7 | 31 | 31 | 31 |
| Sprint 8 | 18 | 0 (deferred) | — |
| Sprint 9 | 31 | - | - |
| Sprint 10 | 29 | - | - |
| Sprint 11 | 24 | - | - |
| Sprint 12 | 18 | - | - |

**Average Velocity Target**: 25-30 points/sprint

---

## 📊 Status Legend

| Emoji | Status | Description |
|-------|--------|-------------|
| 🔴 | Not Started | Task not yet begun |
| 🟡 | In Progress | Currently being worked on |
| 🟢 | Review | Code review / QA testing |
| ✅ | Done | Task completed and accepted |
| ⏸️ | Blocked | Waiting on dependency |
| ❌ | Cancelled | Task no longer needed |

---

## 🔄 Daily Update Template

**Date**: [DATE]

**Team Member**: [NAME]

**Today's Work**:
- [ ] Task ID - What I did

**Blockers**:
- None / List blockers

**Tomorrow's Plan**:
- [ ] Task ID - What I'll do

**Updated Progress**:
- Task ID: X% → Y%

---

## 📞 Sprint Ceremonies

### Sprint Planning (Start of Sprint)
- **When**: Every 2 weeks, Monday 9:00 AM
- **Who**: All team members
- **Duration**: 2 hours
- **Agenda**:
  1. Review previous sprint
  2. Select tasks for this sprint
  3. Estimate effort
  4. Identify dependencies
  5. Commit to sprint goal

### Daily Standup (Every Day)
- **When**: 9:00 AM
- **Who**: All team members
- **Duration**: 15 min
- **Format**: 3 questions (What did I do? What will I do? Blockers?)

### Sprint Review (End of Sprint)
- **When**: Every 2 weeks, Friday 2:00 PM
- **Who**: All team members + stakeholders
- **Duration**: 1 hour
- **Agenda**:
  1. Demo completed features
  2. Review sprint goal
  3. Gather feedback

### Retrospective (End of Sprint)
- **When**: Every 2 weeks, Friday 3:00 PM
- **Who**: All team members
- **Duration**: 1 hour
- **Agenda**:
  1. What went well?
  2. What didn't go well?
  3. Action items for next sprint

---

## ✅ Task Completion Checklist

Before marking a task as **Done**:
- [ ] Code written and follows style guide
- [ ] Unit tests written and passing
- [ ] Code reviewed by 2 team members
- [ ] No console errors/warnings
- [ ] Performance benchmark meets target (if applicable)
- [ ] Accessibility checked (if UI changes)
- [ ] Security reviewed (if sensitive code)
- [ ] Documentation updated
- [ ] Deployed to staging and tested
- [ ] Product owner approves

---

**Tracking Board Status**: ✅ Updated July 25, 2026  
**Phase 1–3**: largely complete / partial as noted above  
**Phase 4**: ✅ Core security + a11y done (SVG sanitize, magic bytes, focus traps, contrast, skip-nav); Sprint 8 ops/audit deferred  
**Next Step**: Phase 5 testing / browser smoke of Phase 4 upload + modals

---

*Update this document daily. Keep it as the single source of truth for project progress.*
