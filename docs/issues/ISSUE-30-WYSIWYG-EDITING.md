# Issue #30: Live Wiki-Style Formatted Editing

**GitHub Issue**: https://github.com/Nir-Bhay/markups/issues/30  
**Reported By**: connect-mahdi  
**Date**: May 7, 2026  
**Priority**: 🟡 Medium  
**Status**: Closed (but relevant for future roadmap)  
**Component**: Architecture Decision

---

## 📋 Executive Summary

User requested a WYSIWYG (What You See Is What You Get) editing experience similar to [markdownliveview.com](https://markdownliveview.com/), where users edit directly in the preview pane without seeing raw Markdown syntax.

**Impact**: Would transform Markups from a "developer tool" to a "general-purpose document editor," opening up to non-technical users.

---

## 🔍 Problem Analysis

### Current Architecture
Markups uses a **split-pane** architecture:
- **Left pane**: Monaco Editor (raw Markdown)
- **Right pane**: Preview (rendered HTML)
- **User experience**: Users see both panes simultaneously

### Desired Architecture (from issue)
- **Single pane**: Live preview with inline editing
- **No raw Markdown visible**: Users see formatted text while editing
- **Wiki-style editing**: Like Confluence, Notion, or Google Docs

### Technical Challenges

#### 1. **Monaco Editor Limitations**
Monaco is designed for **code editing**, not WYSIWYG:
- No "contenteditable" mode
- Syntax highlighting assumes code, not formatted text
- Line-based editing model (not ideal for rich text)

#### 2. **Markdown is Not WYSIWYG**
Markdown is a **markup language** (like HTML), not a document format:
- `**bold**` is not the same as **bold** (visual)
- Users must learn Markdown syntax
- Live preview bridges this gap, but doesn't eliminate syntax

#### 3. **Architecture Mismatch**
Current codebase assumes:
- `src/core/editor/` → Monaco Editor
- `src/core/markdown/` → Preview renderer
- `src/utils/scroll-sync.js` → Sync between two panes

WYSIWYG would require:
- Single editable preview pane
- No scroll sync needed
- Different keyboard shortcuts (formatting toolbar instead of Markdown syntax)

---

## 🛠️ Solution Approaches

### Solution 1: "Focus Preview" Mode (Recommended Short-Term)

**Pros**:
- ✅ Minimal architecture changes
- ✅ Users can hide editor pane
- ✅ Keeps existing Markdown editing model
- ✅ Quick to implement

**Cons**:
- ❌ Still shows Markdown syntax in editor
- ❌ Not true WYSIWYG

**Implementation**:

#### Step 1: Add "Preview Only" View Mode
**File**: `src/features/modes/index.js` (or similar)

```javascript
// Existing view modes: 'editor', 'split', 'preview'
// Add new mode: 'preview-focus'

function setViewMode(mode) {
    const editorPane = document.getElementById('editor');
    const previewPane = document.querySelector('.preview-wrapper');
    
    switch (mode) {
        case 'editor':
            editorPane.style.display = 'block';
            previewPane.style.display = 'none';
            break;
        case 'split':
            editorPane.style.display = 'block';
            previewPane.style.display = 'block';
            break;
        case 'preview':
            editorPane.style.display = 'none';
            previewPane.style.display = 'block';
            break;
        case 'preview-focus':  // NEW
            editorPane.style.display = 'none';
            previewPane.style.display = 'block';
            // Add "Edit" button overlay on preview
            addEditButtonToPreview();
            break;
    }
}
```

#### Step 2: Add "Edit" Button to Preview
When in preview-focus mode, show a floating "Edit" button that switches back to split mode at cursor position.

**Benefit**: Users spend most time in preview, only switch to editor when they need to edit.

---

### Solution 2: Rich Text Toolbar (Recommended Medium-Term)

**Pros**:
- ✅ Users don't need to learn Markdown syntax
- ✅ Toolbar inserts Markdown for them
- ✅ Keeps split-pane architecture
- ✅ Easier than full WYSIWYG

**Cons**:
- ⚠️ Still shows Markdown syntax in editor
- ⚠️ User must switch between toolbar and editor

**Implementation**:

#### Step 1: Enhance Toolbar
**File**: `index.html` (toolbar section, around line 350)

Already exists! The toolbar has:
- Bold, Italic, Heading buttons
- Link, Image, Table insertion
- Code block, Lists

**Enhancement Needed**:
- Add **keyboard shortcut hints** (e.g., "Bold (Ctrl+B)")
- Add **tooltip explanations** ("Make text bold")
- Add **visual feedback** (highlight button when cursor is on bold text)

#### Step 2: Add "Format Painter" Mode
Click a button → cursor changes → click text to apply formatting.

**Not Currently Implemented**: Would require significant toolbar changes.

---

### Solution 3: Hybrid Editor (Future Consideration)

**Pros**:
- ✅ True WYSIWYG experience
- ✅ Can still show Markdown on demand
- ✅ Modern editing experience

**Cons**:
- ❌ Requires replacing Monaco Editor
- ❌ Major architecture change
- ❌ Steep learning curve for developers

**Implementation** (Conceptual):

Replace Monaco with a **contenteditable-based editor** that:
1. Shows formatted text (WYSIWYG)
2. Maintains Markdown source in background
3. Exports to Markdown on save

**Libraries to Consider**:
- **ProseMirror**: Rich text editor with schema support
- **Slate**: Customizable rich text editor
- **Quill**: Simple rich text editor
- **Tiptap**: Vue/React wrapper around ProseMirror

**Challenge**: None of these natively support Markdown. Would need a Markdown ↔ WYSIWYG converter.

---

### Solution 4: Live Preview with Click-to-Edit (Alternative)

**Pros**:
- ✅ Closest to requested feature
- ✅ Users click preview elements to edit
- ✅ Preview stays visible while editing

**Cons**:
- ⚠️ Complex to implement
- ⚠️ Requires mapping preview clicks to editor positions

**Implementation** (Conceptual):

```javascript
// Click on preview element → scroll editor to corresponding line
previewElement.addEventListener('click', (e) => {
    const target = e.target.closest('h1, h2, p, code, pre');
    if (target) {
        const lineNumber = getLineFromPreviewElement(target);
        editor.revealLine(lineNumber);
        editor.setPosition({ lineNumber, column: 1 });
        // Switch to split view temporarily
        setViewMode('split');
    }
});
```

**Benefit**: Users can "navigate" the preview like a document, then edit in split view.

---

## 📊 Comparison with Similar Projects

### 1. **markdownliveview.com** (Referenced in Issue)
- **Approach**: True WYSIWYG Markdown editor
- **Implementation**: Custom editor (not open source)
- **Lesson**: Possible but requires custom editor

### 2. **Notion**
- **Approach**: Block-based WYSIWYG editor
- **Markdown Support**: Import/export only (not editing format)
- **Lesson**: Users don't need Markdown if editor is good enough

### 3. **Google Docs**
- **Approach**: Pure WYSIWYG
- **Markdown Support**: None (not a Markdown editor)
- **Lesson**: WYSIWYG and Markdown are different paradigms

### 4. **Typora** (Discontinued but Influential)
- **Approach**: Live preview (Markdown rendered as you type)
- **Implementation**: Custom editor that hides Markdown syntax
- **Lesson**: Possible to make Markdown feel like WYSIWYG

### 5. **StackEdit**
- **Approach**: Split-pane (like Markups)
- **WYSIWYG**: No
- **Lesson**: Split-pane is acceptable for technical users

---

## 🧪 Testing Plan (For Future Implementation)

### Test Cases

#### Test 1: Non-Technical User Experience
- Ask non-programmer to write document in Markups
- **Current**: They struggle with Markdown syntax
- **With Solution 1**: They can stay in preview, click "Edit" when needed
- **With Solution 3**: They never see Markdown syntax

#### Test 2: Document Complexity
- Create document with tables, code blocks, images
- **Current**: Markdown syntax is helpful for complex elements
- **WYSIWYG**: Hard to edit tables/code blocks without syntax

#### Test 3: Export Compatibility
- Export WYSIWYG-edited document to Markdown
- **Requirement**: Must produce clean Markdown (no proprietary format)

---

## 🔧 Integration with Existing Codebase

### Solution 1 (Preview Focus Mode)
**Files to Modify**:
1. `src/features/modes/index.js` (add new mode)
2. `index.html` (add mode toggle button)
3. `public/css/premium-ui.css` (style preview-only mode)

**No Breaking Changes**: Keeps existing architecture.

### Solution 2 (Rich Text Toolbar)
**Files to Modify**:
1. `index.html` (toolbar already exists, enhance it)
2. `src/features/toolbar/index.js` (add keyboard shortcut hints)

**No Breaking Changes**: Toolbar already exists.

### Solution 3 (Hybrid Editor)
**Files to Modify**:
1. **Replace** `src/core/editor/` (entirely new editor)
2. **Modify** `src/main.js` (initialization)
3. **Add** Markdown ↔ WYSIWYG converter

**Breaking Changes**: Major architecture change.

---

## 📈 Performance Impact

### Solution 1 (Preview Focus Mode)
- **Performance**: No impact (just hiding/showing panes)
- **Bundle Size**: No change

### Solution 2 (Rich Text Toolbar)
- **Performance**: No impact (toolbar already exists)
- **Bundle Size**: No change

### Solution 3 (Hybrid Editor)
- **Performance**: Depends on library (ProseMirror is ~100KB)
- **Bundle Size**: +100-200KB (significant for PWA)

---

## 🎯 Recommended Solution

**Short-Term (Now)**: **Solution 1** (Preview Focus Mode)
- Quick win for users who want "preview-first" experience
- Minimal development effort
- No breaking changes

**Medium-Term (Next Release)**: **Solution 2** (Enhanced Toolbar)
- Make toolbar more discoverable
- Add keyboard shortcut hints
- Help non-technical users learn Markdown

**Long-Term (Future Consideration)**: **Solution 3** (Hybrid Editor)
- Only if user feedback strongly requests WYSIWYG
- Requires dedicated development sprint
- Consider as v3.0 feature

---

## 📚 References

1. [markdownliveview.com](https://markdownliveview.com/) (Referenced in issue)
2. [ProseMirror](https://prosemirror.net/) (WYSIWYG library)
3. [Typora](https://typora.io/) (Live preview editor)
4. [Notion](https://www.notion.so/) (Block-based editor)
5. [Issue #30 Discussion](https://github.com/Nir-Bhay/markups/issues/30)

---

## 🔄 Follow-Up Actions

- [ ] Survey users: Do they want WYSIWYG or enhanced split-pane?
- [ ] Prototype Solution 1 (preview focus mode) and test with non-technical users
- [ ] Research Markdown ↔ WYSIWYG converters (for Solution 3)
- [ ] Consider partnering with open-source WYSIWYG Markdown editor project
- [ ] Document current Markdown syntax in help panel (helps new users)

---

**Last Updated**: July 25, 2026  
**Author**: AI Assistant (based on codebase analysis)  
**Next Review**: After user feedback on Solution 1 prototype
