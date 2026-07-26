# Implementation Flow Diagram

## Issue Dependencies & Implementation Order

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARKUPS ISSUES AUDIT                        │
│                    Implementation Flow                         │
└─────────────────────────────────────────────────────────────────┘

PHASE 1: Quick Win (Week 1)
┌───────────────────┐
│  Issue #42        │
│  XML Preview      │
│  Effort: 1 hour  │
│  Priority: 🟢     │
└────────┬──────────┘
         │
         │ Modify: src/core/markdown/index.js
         │ Add: Prism XML/SVG imports
         │
         ▼
    ✅ COMPLETED (No conflicts)
         │
         │
PHASE 2: Core Fix (Week 2)
┌───────────────────┐
│  Issue #39        │
│  Scroll Sync      │
│  Effort: 6 hours │
│  Priority: 🔴     │
└────────┬──────────┘
         │
         │ Modify: src/utils/scroll-sync.js
         │ Modify: src/main.js
         │ Add: Heading-based sync logic
         │
         ▼
    ✅ COMPLETED (Improves all preview features)
         │
         │
PHASE 3: Feature Add (Week 3)
┌───────────────────┐
│  Issue #40        │
│  Video Embedding  │
│  Effort: 4 hours │
│  Priority: 🟡     │
└────────┬──────────┘
         │
         │ Create: src/core/markdown/extensions/video.js
         │ Modify: src/core/markdown/index.js
         │ Modify: public/css/premium-ui.css
         │
         ▼
    ✅ COMPLETED (New feature, no conflicts)
         │
         │
PHASE 4: Future (Backlog)
┌───────────────────┐
│  Issue #30        │
│  WYSIWYG Editing  │
│  Effort: 40+ hrs  │
│  Priority: 🟡     │
└────────┬──────────┘
         │
         │ Architectural Decision Needed
         │ Options: Preview Focus / Enhanced Toolbar / Hybrid Editor
         │
         ▼
    🔄 PROTOTYPE (Gather user feedback first)


═══════════════════════════════════════════════════════════════

CODEBASE MODIFICATION MAP

File: src/core/markdown/index.js
├── Issue #42: Add 2 import lines (prism-xml-doc, prism-svg)
├── Issue #40: Add videoExtension registration
└── Impact: Both issues modify same file → Implement #42 first

File: src/utils/scroll-sync.js
├── Issue #39: Rewrite syncEditorToPreview() method
├── Issue #39: Add buildHeadingMap() method
└── Impact: Major change, test thoroughly

File: src/main.js
├── Issue #39: Call scrollSync.buildHeadingMap() after preview render
└── Impact: Minor change, one line addition

New File: src/core/markdown/extensions/video.js
├── Issue #40: Create videoExtension for marked.js
└── Impact: New file, no conflicts

File: public/css/premium-ui.css
├── Issue #40: Add .video-container styling
└── Impact: Add to end of file, no conflicts


═══════════════════════════════════════════════════════════════

RESEARCH FINDINGS SUMMARY

Scroll Sync Best Practices:
┌─────────────────────────────────────────────────────────┐
│ Approach              │ Accuracy │ Complexity │ Used By │
├───────────────────────┼──────────┼────────────┼─────────┤
│ Proportional (current)│ Low      │ Low        │ Markups  │
│ Heading-based (rec)   │ Medium   │ Medium     │ StackEdit│
│ Source map            │ High     │ High       │ VS Code  │
│ Live preview         │ Perfect  │ N/A        │ Typora   │
└─────────────────────────────────────────────────────────┘
Recommendation: Heading-based (good balance)

Video Embedding Techniques:
┌─────────────────────────────────────────────────────────┐
│ Technique           │ Pros        │ Cons           │
├─────────────────────┼─────────────┼────────────────┤
│ HTML <video> tag    │ Simple      │ Manual for    │
│                     │             │ users          │
│ Custom extension    │ Automatic   │ Requires JS    │
│ (recommended)       │             │ development    │
│ GitHub API          │ Full feature│ Requires auth  │
│                     │             │ + complex      │
└─────────────────────────────────────────────────────────┘

XML Highlighting:
┌─────────────────────────────────────────────────────────┐
│ Prism Component │ Covers          │ Needed?          │
├─────────────────┼─────────────────┼──────────────────┤
│ prism-markup     │ HTML, XML      │ Maybe (test)    │
│ prism-xml-doc    │ XML documents  │ Yes (explicit)  │
│ prism-svg        │ SVG elements   │ Yes (explicit)  │
└─────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════

TESTING CHECKLIST

Issue #42 (XML Preview):
□ Test XML code block highlighting
□ Test SVG code block highlighting
□ Test HTML code block (no regression)
□ Compare with GitHub rendering (screenshot)
□ Verify no console errors

Issue #39 (Scroll Sync):
□ Test with 100-line document
□ Test with 1000-line document
□ Test with 5000-line document (from issue reporter)
□ Test rapid scrolling (no lag)
□ Test documents with/without headings
□ Test preview-to-editor sync (if implemented)

Issue #40 (Video Embedding):
□ Test MP4 URL embedding
□ Test WebM URL embedding
□ Test GitHub video attachment link
□ Test DOMPurify doesn't strip video tags
□ Test responsive video sizing
□ Test video controls work

Issue #30 (WYSIWYG):
□ Survey users on current experience
□ Prototype Preview Focus Mode
□ Gather feedback on prototype
□ Decide on full implementation


═══════════════════════════════════════════════════════════════

RISK ASSESSMENT

Risk Matrix:
┌─────────────────────────────────────────────────────────┐
│ Risk                  │ Likelihood │ Impact │ Mitigation│
├───────────────────────┼────────────┼────────┼───────────┤
│ XML import conflicts │ Low        │ Low    │ Test      │
│ Scroll sync breaks   │ Medium     │ High   │ Debounce  │
│ Video tag XSS        │ Low        │ High   │ DOMPurify │
│ WYSIWYG complexity   │ High       │ High   │ Prototype │
└─────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════

SUCCESS CRITERIA

Phase 1 (XML Preview):
✓ XML/SVG code blocks highlight correctly
✓ No regression in other languages
✓ Visual match with GitHub (95%+)

Phase 2 (Scroll Sync):
✓ Scroll drift <50px for 5000-line document
✓ No lag during rapid scrolling
✓ Works with all document types

Phase 3 (Video Embedding):
✓ Video URLs render as <video> elements
✓ GitHub attachments show as links
✓ Responsive and accessible

Phase 4 (WYSIWYG):
? User satisfaction survey results
? Prototype feedback positive
? Decision on full implementation


═══════════════════════════════════════════════════════════════

END OF DIAGRAM
